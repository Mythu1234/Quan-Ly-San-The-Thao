-- Paste this ENTIRE file into a new Supabase SQL Editor query and Run as postgres.
-- One atomic statement, without temporary tables or session-dependent helpers.
-- Preserves amounts, bank references, dates, statuses and foreign-key settings.
DO $normalize$
DECLARE
 mappings jsonb := '[
  {"kind":"DS","old_code":"CX-88291","new_code":"DS00000041"},
  {"kind":"DS","old_code":"DS10199488","new_code":"DS00000042"},
  {"kind":"DS","old_code":"DS08547310","new_code":"DS00000043"},
  {"kind":"DS","old_code":"DS09398827","new_code":"DS00000044"},
  {"kind":"DS","old_code":"DS82835925","new_code":"DS00000045"},
  {"kind":"DS","old_code":"DS88492724","new_code":"DS00000046"},
  {"kind":"TT","old_code":"TT08547310","new_code":"TT00000043"},
  {"kind":"TT","old_code":"TT10199488","new_code":"TT00000044"}
 ]';
 fk_state jsonb; r record; m record; j record;
 t text; col text; old_exists boolean; target_exists boolean;
BEGIN
 LOCK TABLE public.dat_san, public.thanh_toan IN ACCESS EXCLUSIVE MODE;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
   'rel',c.conrelid::regclass::text,'name',c.conname,
   'def',c.condeferrable,'deferred',c.condeferred,'att',a.attname,
   'kind',CASE c.confrelid WHEN 'public.dat_san'::regclass THEN 'DS' ELSE 'TT' END)), '[]'::jsonb)
 INTO fk_state
 FROM pg_constraint c JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=c.conkey[1]
 WHERE c.contype='f' AND c.confrelid IN ('public.dat_san'::regclass,'public.thanh_toan'::regclass);

 FOR r IN SELECT * FROM jsonb_to_recordset(fk_state) AS f(rel text) LOOP
   EXECUTE format('LOCK TABLE %s IN ACCESS EXCLUSIVE MODE',r.rel::regclass);
 END LOOP;
 -- Check every destination before changing anything. Collisions abort the whole block.
 FOR m IN SELECT * FROM jsonb_to_recordset(mappings) AS x(kind text,old_code text,new_code text) LOOP
   t:=CASE m.kind WHEN 'DS' THEN 'dat_san' ELSE 'thanh_toan' END;
   col:=CASE m.kind WHEN 'DS' THEN 'ma_dat_san' ELSE 'ma_thanh_toan' END;
   EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I WHERE %I=$1), EXISTS(SELECT 1 FROM public.%I WHERE %I=$2)',t,col,t,col)
     INTO old_exists,target_exists USING m.old_code,m.new_code;
   IF old_exists AND target_exists THEN RAISE EXCEPTION 'Destination ID already exists: %',m.new_code; END IF;
 END LOOP;
 FOR r IN SELECT * FROM jsonb_to_recordset(fk_state) AS f(rel text,name text) LOOP
   EXECUTE format('ALTER TABLE %s ALTER CONSTRAINT %I DEFERRABLE INITIALLY DEFERRED',r.rel::regclass,r.name);
 END LOOP;
 SET CONSTRAINTS ALL DEFERRED;
 FOR m IN SELECT * FROM jsonb_to_recordset(mappings) AS x(kind text,old_code text,new_code text) LOOP
   t:=CASE m.kind WHEN 'DS' THEN 'dat_san' ELSE 'thanh_toan' END;
   col:=CASE m.kind WHEN 'DS' THEN 'ma_dat_san' ELSE 'ma_thanh_toan' END;
   EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I WHERE %I=$1)',t,col) INTO old_exists USING m.old_code;
   IF NOT old_exists THEN CONTINUE; END IF;
   FOR r IN SELECT * FROM jsonb_to_recordset(fk_state) AS f(rel text,att text,kind text) WHERE kind=m.kind LOOP
     EXECUTE format('UPDATE %s SET %I=$1 WHERE %I=$2',r.rel::regclass,r.att,r.att) USING m.new_code,m.old_code;
   END LOOP;
   EXECUTE format('UPDATE public.%I SET %I=$1 WHERE %I=$2',t,col,col) USING m.new_code,m.old_code;
 END LOOP;
 SET CONSTRAINTS ALL IMMEDIATE;
 FOR r IN SELECT * FROM jsonb_to_recordset(fk_state) AS f(rel text,name text,def boolean,deferred boolean) LOOP
   EXECUTE format('ALTER TABLE %s ALTER CONSTRAINT %I %s',r.rel::regclass,r.name,
     CASE WHEN NOT r.def THEN 'NOT DEFERRABLE' WHEN r.deferred THEN 'DEFERRABLE INITIALLY DEFERRED' ELSE 'DEFERRABLE INITIALLY IMMEDIATE' END);
 END LOOP;
 -- Replace complete JSON string values and date:bookingCode receipt references.
 -- Bank transaction columns and free-text notes are never rewritten.
 FOR m IN SELECT * FROM jsonb_to_recordset(mappings) AS x(kind text,old_code text,new_code text) LOOP
   FOR j IN SELECT * FROM (VALUES
     ('dat_san','ket_qua_checkout'),('bao_cao_su_co','thong_tin_bo_sung'),('thiet_bi','thong_tin_bo_sung')
   ) AS columns_to_update(tbl,colname) LOOP
     EXECUTE format(
       'UPDATE public.%I SET %I=regexp_replace(replace(%I::text,$1,$2),$3,$4,''g'')::jsonb WHERE %I IS NOT NULL AND %I::text LIKE $5',
       j.tbl,j.colname,j.colname,j.colname,j.colname)
       USING to_jsonb(m.old_code)::text,to_jsonb(m.new_code)::text,
         '("[0-9]{4}-[0-9]{2}-[0-9]{2}:)'||m.old_code||'"',
         chr(92)||'1'||m.new_code||'"','%'||m.old_code||'%';
   END LOOP;
 END LOOP;
END $normalize$;

SELECT ma_dat_san,ngay_dat,trang_thai,tong_tien_san FROM public.dat_san ORDER BY ma_dat_san;
