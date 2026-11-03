-- Copy the ENTIRE file into Supabase SQL Editor. Run as postgres.
-- One atomic statement, safe to rerun. Keeps names, phones, dates and booking history.
DO $normalize$
DECLARE
 mappings jsonb := '[
  {"old_code":"KH10988930","new_code":"KH00000018"},
  {"old_code":"KH10988931","new_code":"KH00000019"},
  {"old_code":"KH82728200","new_code":"KH00000020"},
  {"old_code":"KH83295534","new_code":"KH00000021"},
  {"old_code":"KH88492210","new_code":"KH00000022"},
  {"old_code":"KH08546729","new_code":"KH00000023"},
  {"old_code":"KH10198910","new_code":"KH00000024"},
  {"old_code":"KH88492211","new_code":"KH00000025"}
 ]';
 fk_state jsonb; r record; m record;
BEGIN
 LOCK TABLE public.khach_hang IN ACCESS EXCLUSIVE MODE;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
   'rel',c.conrelid::regclass::text,'name',c.conname,
   'def',c.condeferrable,'deferred',c.condeferred,'att',a.attname)), '[]'::jsonb)
 INTO fk_state FROM pg_constraint c
 JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=c.conkey[1]
 WHERE c.contype='f' AND c.confrelid='public.khach_hang'::regclass;
 FOR r IN SELECT * FROM jsonb_to_recordset(fk_state) AS f(rel text) LOOP
   EXECUTE format('LOCK TABLE %s IN ACCESS EXCLUSIVE MODE',r.rel::regclass);
 END LOOP;
 FOR m IN SELECT * FROM jsonb_to_recordset(mappings) AS x(old_code text,new_code text) LOOP
   IF EXISTS(SELECT 1 FROM public.khach_hang WHERE ma_khach_hang=m.old_code)
     AND EXISTS(SELECT 1 FROM public.khach_hang WHERE ma_khach_hang=m.new_code) THEN
     RAISE EXCEPTION 'Destination customer ID already exists: %',m.new_code;
   END IF;
 END LOOP;
 FOR r IN SELECT * FROM jsonb_to_recordset(fk_state) AS f(rel text,name text) LOOP
   EXECUTE format('ALTER TABLE %s ALTER CONSTRAINT %I DEFERRABLE INITIALLY DEFERRED',r.rel::regclass,r.name);
 END LOOP;
 SET CONSTRAINTS ALL DEFERRED;
 FOR m IN SELECT * FROM jsonb_to_recordset(mappings) AS x(old_code text,new_code text) LOOP
   IF NOT EXISTS(SELECT 1 FROM public.khach_hang WHERE ma_khach_hang=m.old_code) THEN CONTINUE; END IF;
   FOR r IN SELECT * FROM jsonb_to_recordset(fk_state) AS f(rel text,att text) LOOP
     EXECUTE format('UPDATE %s SET %I=$1 WHERE %I=$2',r.rel::regclass,r.att,r.att) USING m.new_code,m.old_code;
   END LOOP;
   UPDATE public.khach_hang SET ma_khach_hang=m.new_code WHERE ma_khach_hang=m.old_code;
 END LOOP;
 SET CONSTRAINTS ALL IMMEDIATE;
 FOR r IN SELECT * FROM jsonb_to_recordset(fk_state) AS f(rel text,name text,def boolean,deferred boolean) LOOP
   EXECUTE format('ALTER TABLE %s ALTER CONSTRAINT %I %s',r.rel::regclass,r.name,
     CASE WHEN NOT r.def THEN 'NOT DEFERRABLE' WHEN r.deferred THEN 'DEFERRABLE INITIALLY DEFERRED' ELSE 'DEFERRABLE INITIALLY IMMEDIATE' END);
 END LOOP;
END $normalize$;

SELECT ma_khach_hang,ho_ten,so_dien_thoai,ngay_tao FROM public.khach_hang ORDER BY ma_khach_hang;
