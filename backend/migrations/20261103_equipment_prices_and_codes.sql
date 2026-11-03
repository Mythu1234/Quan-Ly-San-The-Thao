-- Paste the ENTIRE file into Supabase SQL Editor, Run as postgres.
-- Adds explicit price columns, preserves unknown purchase prices as NULL,
-- and renumbers catalogue equipment from TB00000001 with all references in one transaction.
-- Requires 20261103_remove_equipment_court.sql first. Safe to rerun.
DO $equipment_prices$
DECLARE mappings jsonb; fk_state jsonb; r record; m record; phase integer; old_id text; new_id text;
BEGIN
 LOCK TABLE public.thiet_bi, public.bang_gia_den_bu IN ACCESS EXCLUSIVE MODE;
 IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='thiet_bi' AND column_name='ma_san') THEN
  RAISE EXCEPTION 'Run 20261103_remove_equipment_court.sql first.';
 END IF;
 IF EXISTS(SELECT 1 FROM public.thiet_bi WHERE coalesce(thong_tin_bo_sung->>'isCatalogItem','false')<>'true' OR ma_thiet_bi !~ '^TB[0-9]{8}$') THEN
  RAISE EXCEPTION 'Synchronize the equipment catalogue before renumbering.';
 END IF;

 ALTER TABLE public.thiet_bi ADD COLUMN IF NOT EXISTS gia_mua numeric(14,2);
 ALTER TABLE public.thiet_bi ADD COLUMN IF NOT EXISTS gia_boi_thuong numeric(14,2);
 UPDATE public.thiet_bi t SET
  gia_mua=coalesce(t.gia_mua,nullif(t.thong_tin_bo_sung->>'purchasePrice','')::numeric),
  gia_boi_thuong=coalesce(t.gia_boi_thuong,nullif(t.thong_tin_bo_sung->>'compensationPrice','')::numeric,
   (SELECT p.don_gia_den_bu FROM public.bang_gia_den_bu p WHERE p.ma_danh_muc_den_bu=t.thong_tin_bo_sung->>'compensationItemId' OR p.mo_ta_hu_hai='asset:'||t.ma_thiet_bi LIMIT 1));
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.thiet_bi'::regclass AND conname='thiet_bi_purchase_price_valid') THEN
  ALTER TABLE public.thiet_bi ADD CONSTRAINT thiet_bi_purchase_price_valid CHECK(gia_mua IS NULL OR (gia_mua>=0 AND gia_mua=trunc(gia_mua)));
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.thiet_bi'::regclass AND conname='thiet_bi_compensation_price_valid') THEN
  ALTER TABLE public.thiet_bi ADD CONSTRAINT thiet_bi_compensation_price_valid CHECK(gia_boi_thuong IS NOT NULL AND gia_boi_thuong>0 AND gia_boi_thuong=trunc(gia_boi_thuong));
 END IF;

 -- Existing RPCs write JSON metadata. Keep explicit columns and the compatible price row
 -- synchronized for RPC writes and direct edits to the new columns in Table Editor.
 EXECUTE $function$
 CREATE OR REPLACE FUNCTION public.courtx_sync_equipment_prices() RETURNS trigger
 LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
 DECLARE v_meta jsonb; v_purchase numeric; v_compensation numeric; v_catalog text;
 BEGIN
  v_meta:=coalesce(NEW.thong_tin_bo_sung,'{}');
  v_purchase:=nullif(v_meta->>'purchasePrice','')::numeric;
  v_compensation:=nullif(v_meta->>'compensationPrice','')::numeric;
  IF TG_OP='INSERT' THEN
   NEW.gia_mua:=coalesce(NEW.gia_mua,v_purchase);
   NEW.gia_boi_thuong:=coalesce(NEW.gia_boi_thuong,v_compensation);
  ELSE
   IF NEW.gia_mua IS NOT DISTINCT FROM OLD.gia_mua AND v_meta->'purchasePrice' IS DISTINCT FROM OLD.thong_tin_bo_sung->'purchasePrice' THEN NEW.gia_mua:=v_purchase; END IF;
   IF NEW.gia_boi_thuong IS NOT DISTINCT FROM OLD.gia_boi_thuong AND v_meta->'compensationPrice' IS DISTINCT FROM OLD.thong_tin_bo_sung->'compensationPrice' THEN NEW.gia_boi_thuong:=v_compensation; END IF;
  END IF;
  IF NEW.gia_mua IS NOT NULL AND (NEW.gia_mua<0 OR NEW.gia_mua<>trunc(NEW.gia_mua)) THEN RAISE EXCEPTION 'Giá mua phải là số nguyên không âm.'; END IF;
  IF NEW.gia_boi_thuong IS NULL OR NEW.gia_boi_thuong<=0 OR NEW.gia_boi_thuong<>trunc(NEW.gia_boi_thuong) THEN RAISE EXCEPTION 'Giá bồi thường phải là số nguyên dương.'; END IF;
  NEW.thong_tin_bo_sung:=v_meta || jsonb_build_object('purchasePrice',NEW.gia_mua,'compensationPrice',NEW.gia_boi_thuong);
  v_catalog:=v_meta->>'compensationItemId';
  UPDATE public.bang_gia_den_bu SET ten_vat_tu=NEW.ten_thiet_bi,don_gia_den_bu=NEW.gia_boi_thuong
   WHERE ma_danh_muc_den_bu=v_catalog OR mo_ta_hu_hai='asset:'||NEW.ma_thiet_bi;
  RETURN NEW;
 END $$;
 $function$;
 DROP TRIGGER IF EXISTS courtx_equipment_prices_sync ON public.thiet_bi;
 CREATE TRIGGER courtx_equipment_prices_sync BEFORE INSERT OR UPDATE ON public.thiet_bi
  FOR EACH ROW EXECUTE FUNCTION public.courtx_sync_equipment_prices();
 -- Also copy the backfilled values into metadata without inventing purchase costs.
 UPDATE public.thiet_bi SET thong_tin_bo_sung=thong_tin_bo_sung;

 SELECT coalesce(jsonb_agg(jsonb_build_object('old_code',ma_thiet_bi,'temp_code','TBTMP'||lpad(n::text,8,'0'),
  'new_code','TB'||lpad(n::text,8,'0')) ORDER BY n),'[]') INTO mappings
 FROM (SELECT ma_thiet_bi,row_number() OVER(ORDER BY ma_thiet_bi) AS n FROM public.thiet_bi) t
 WHERE ma_thiet_bi<>'TB'||lpad(n::text,8,'0');
 SELECT coalesce(jsonb_agg(jsonb_build_object('rel',c.conrelid::regclass::text,'name',c.conname,
  'def',c.condeferrable,'deferred',c.condeferred,'att',a.attname)),'[]') INTO fk_state
 FROM pg_constraint c JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=c.conkey[1]
 WHERE c.contype='f' AND c.confrelid='public.thiet_bi'::regclass;
 FOR r IN SELECT * FROM jsonb_to_recordset(fk_state) AS f(rel text,name text) LOOP
  EXECUTE format('LOCK TABLE %s IN ACCESS EXCLUSIVE MODE',r.rel::regclass);
  EXECUTE format('ALTER TABLE %s ALTER CONSTRAINT %I DEFERRABLE INITIALLY DEFERRED',r.rel::regclass,r.name);
 END LOOP;

 -- The helper takes the mapping as an argument, without relying on temporary tables.
 -- Original historical snapshots remain intact for audit.
 EXECUTE $function$
 CREATE OR REPLACE FUNCTION pg_temp.courtx_rename_equipment_json(value jsonb,mapping jsonb,phase integer) RETURNS jsonb
 LANGUAGE plpgsql AS $$
 DECLARE result jsonb; m record; raw text; source_id text; target_id text;
 BEGIN
  CASE jsonb_typeof(value)
  WHEN 'object' THEN
   SELECT coalesce(jsonb_object_agg(key,CASE WHEN key IN ('legacyEquipmentHistory','legacyAssets') THEN val
    ELSE pg_temp.courtx_rename_equipment_json(val,mapping,phase) END),'{}') INTO result FROM jsonb_each(value) AS x(key,val);
  WHEN 'array' THEN
   SELECT coalesce(jsonb_agg(pg_temp.courtx_rename_equipment_json(val,mapping,phase) ORDER BY ord),'[]') INTO result
    FROM jsonb_array_elements(value) WITH ORDINALITY AS x(val,ord);
  WHEN 'string' THEN
   raw:=value#>>'{}';
   FOR m IN SELECT * FROM jsonb_to_recordset(mapping) AS x(old_code text,temp_code text,new_code text) LOOP
    source_id:=CASE phase WHEN 1 THEN m.old_code ELSE m.temp_code END;
    target_id:=CASE phase WHEN 1 THEN m.temp_code ELSE m.new_code END;
    IF raw=source_id THEN RETURN to_jsonb(target_id); END IF;
   END LOOP;
   result:=value;
  ELSE result:=value;
  END CASE;
  RETURN result;
 END $$;
 $function$;

 SET CONSTRAINTS ALL DEFERRED;
 FOR phase IN 1..2 LOOP
  FOR m IN SELECT * FROM jsonb_to_recordset(mappings) AS x(old_code text,temp_code text,new_code text) LOOP
   old_id:=CASE phase WHEN 1 THEN m.old_code ELSE m.temp_code END;
   new_id:=CASE phase WHEN 1 THEN m.temp_code ELSE m.new_code END;
   FOR r IN SELECT * FROM jsonb_to_recordset(fk_state) AS f(rel text,att text) LOOP
    EXECUTE format('UPDATE %s SET %I=$1 WHERE %I=$2',r.rel::regclass,r.att,r.att) USING new_id,old_id;
   END LOOP;
   UPDATE public.bang_gia_den_bu SET mo_ta_hu_hai='asset:'||new_id WHERE mo_ta_hu_hai='asset:'||old_id;
   UPDATE public.thiet_bi SET ma_thiet_bi=new_id WHERE ma_thiet_bi=old_id;
  END LOOP;
  UPDATE public.thiet_bi SET thong_tin_bo_sung=pg_temp.courtx_rename_equipment_json(thong_tin_bo_sung,mappings,phase);
  UPDATE public.bao_cao_su_co SET thong_tin_bo_sung=pg_temp.courtx_rename_equipment_json(thong_tin_bo_sung,mappings,phase);
  UPDATE public.dat_san SET ket_qua_checkout=pg_temp.courtx_rename_equipment_json(ket_qua_checkout,mappings,phase) WHERE ket_qua_checkout IS NOT NULL;
 END LOOP;
 SET CONSTRAINTS ALL IMMEDIATE;
 FOR r IN SELECT * FROM jsonb_to_recordset(fk_state) AS f(rel text,name text,def boolean,deferred boolean) LOOP
  EXECUTE format('ALTER TABLE %s ALTER CONSTRAINT %I %s',r.rel::regclass,r.name,
   CASE WHEN NOT r.def THEN 'NOT DEFERRABLE' WHEN r.deferred THEN 'DEFERRABLE INITIALLY DEFERRED' ELSE 'DEFERRABLE INITIALLY IMMEDIATE' END);
 END LOOP;
 DROP FUNCTION pg_temp.courtx_rename_equipment_json(jsonb,jsonb,integer);
 PERFORM pg_notify('pgrst','reload schema');
END $equipment_prices$;

SELECT ma_thiet_bi,ten_thiet_bi,gia_mua,gia_boi_thuong FROM public.thiet_bi ORDER BY ma_thiet_bi;
