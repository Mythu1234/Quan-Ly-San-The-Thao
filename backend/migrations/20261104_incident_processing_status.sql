-- Run this ENTIRE file in Supabase SQL Editor as postgres.
-- Processing progress is separate from who pays for the damage.
-- Commit enum additions before using them (required by PostgreSQL).
BEGIN;
ALTER TYPE public.trang_thai_su_co_enum ADD VALUE IF NOT EXISTS 'CHO_XU_LY';
ALTER TYPE public.trang_thai_su_co_enum ADD VALUE IF NOT EXISTS 'DANG_SUA_CHUA';
COMMIT;

BEGIN;
ALTER TABLE public.bao_cao_su_co ALTER COLUMN trang_thai_xu_ly SET DEFAULT 'CHO_XU_LY';

CREATE OR REPLACE FUNCTION public.courtx_incident_processing_status()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
  -- Translate legacy writers without treating venue liability as customer debt.
  IF NEW.trang_thai_xu_ly::text='CHO_BOI_THUONG' THEN
    NEW.trang_thai_xu_ly:=CASE WHEN NEW.thong_tin_bo_sung->>'status'='dang_sua_chua'
      THEN 'DANG_SUA_CHUA'::trang_thai_su_co_enum ELSE 'CHO_XU_LY'::trang_thai_su_co_enum END;
  END IF;
  NEW.thong_tin_bo_sung:=coalesce(NEW.thong_tin_bo_sung,'{}'::jsonb)||jsonb_build_object('status',
    CASE NEW.trang_thai_xu_ly::text WHEN 'DA_XU_LY' THEN 'da_khac_phuc'
      WHEN 'DANG_SUA_CHUA' THEN 'dang_sua_chua' ELSE 'cho_xu_ly' END);
  IF NEW.nguyen_nhan::text='BAO_HANH_SAN_VAN_DONG' THEN
    NEW.tong_tien_den_bu:=0;
    NEW.thong_tin_bo_sung:=NEW.thong_tin_bo_sung||'{"compensationPaymentStatus":"not_required"}'::jsonb;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS courtx_incident_processing_status ON public.bao_cao_su_co;
CREATE TRIGGER courtx_incident_processing_status BEFORE INSERT OR UPDATE ON public.bao_cao_su_co
FOR EACH ROW EXECUTE FUNCTION public.courtx_incident_processing_status();

CREATE OR REPLACE FUNCTION public.courtx_patch_incident(p_id text,p_patch jsonb)
RETURNS void LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE v_row bao_cao_su_co; v_meta jsonb;
BEGIN
  SELECT * INTO v_row FROM bao_cao_su_co WHERE ma_su_co=p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy báo cáo.'; END IF;
  IF p_patch ? 'deletedAt' AND (v_row.thong_tin_bo_sung->>'compensationPaymentStatus'='paid'
    OR v_row.thong_tin_bo_sung->>'checkoutReference' IS NOT NULL) THEN RAISE EXCEPTION 'Không xóa được báo cáo đã quyết toán.'; END IF;
  IF p_patch ? 'status' AND coalesce(p_patch->>'status','') NOT IN ('cho_xu_ly','dang_sua_chua','da_khac_phuc') THEN
    RAISE EXCEPTION 'Trạng thái sự cố không hợp lệ.';
  END IF;
  v_meta:=v_row.thong_tin_bo_sung||(p_patch-'newLog')||jsonb_build_object('updatedAt',now());
  IF p_patch ? 'newLog' THEN
    v_meta:=v_meta||jsonb_build_object('timelineLogs',jsonb_build_array(p_patch->'newLog')||
      coalesce((SELECT jsonb_agg(value||'{"active":false}'::jsonb)
        FROM jsonb_array_elements(coalesce(v_row.thong_tin_bo_sung->'timelineLogs','[]'))),'[]'));
  END IF;
  UPDATE bao_cao_su_co SET thong_tin_bo_sung=v_meta,trang_thai_xu_ly=
    CASE WHEN NOT(p_patch ? 'status') THEN trang_thai_xu_ly
      WHEN p_patch->>'status'='da_khac_phuc' THEN 'DA_XU_LY'::trang_thai_su_co_enum
      WHEN p_patch->>'status'='dang_sua_chua' THEN 'DANG_SUA_CHUA'::trang_thai_su_co_enum
      ELSE 'CHO_XU_LY'::trang_thai_su_co_enum END WHERE ma_su_co=p_id;
END $$;

-- Trigger repairs legacy progress and venue payment flags without changing unit prices.
UPDATE public.bao_cao_su_co SET trang_thai_xu_ly=trang_thai_xu_ly;
NOTIFY pgrst,'reload schema';
COMMIT;

SELECT ma_su_co,nguyen_nhan,trang_thai_xu_ly,tong_tien_den_bu
FROM public.bao_cao_su_co ORDER BY ma_su_co;
