-- Paste the ENTIRE file into a new Supabase SQL Editor query. Run as postgres.
-- Requires the shared equipment catalogue to be synchronized first.
-- Replaces dependent RPCs and drops ONLY thiet_bi.ma_san atomically; safe to rerun.
DO $install_catalog$
BEGIN
 LOCK TABLE public.thiet_bi IN ACCESS EXCLUSIVE MODE;
 IF EXISTS(SELECT 1 FROM public.thiet_bi t WHERE coalesce(t.thong_tin_bo_sung->>'isCatalogItem','false')<>'true'
   OR to_jsonb(t)->>'ma_san' IS NOT NULL) THEN
  RAISE EXCEPTION 'Synchronize the shared equipment catalogue before removing its court column.';
 END IF;
 EXECUTE $definition$
CREATE OR REPLACE FUNCTION public.courtx_save_equipment(p_item jsonb,p_id text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE v_id text; v_catalog text; v_name text; v_price numeric; v_sport text;
 v_serial text; v_bo_mon text; v_old thiet_bi; v_meta jsonb;
BEGIN
 v_name:=nullif(trim(p_item->>'name'),'');
 v_price:=(p_item->>'compensationPrice')::numeric;
 v_sport:=coalesce(p_item->>'sportType','DungChung');
 IF v_name IS NULL OR length(v_name)>100 THEN RAISE EXCEPTION 'Nhập tên thiết bị hợp lệ.'; END IF;
 IF v_price IS NULL OR v_price<=0 OR v_price<>trunc(v_price) THEN RAISE EXCEPTION 'Nhập giá bồi thường nguyên dương.'; END IF;
 IF v_sport NOT IN ('CauLong','BongChuyen','BongDa','DungChung') THEN RAISE EXCEPTION 'Bộ môn không hợp lệ.'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext('catalog:' || v_sport || ':' || lower(regexp_replace(v_name,'\s+',' ','g'))));
 IF EXISTS(SELECT 1 FROM thiet_bi WHERE NOT da_xoa AND ma_thiet_bi IS DISTINCT FROM p_id
  AND coalesce(thong_tin_bo_sung->>'sportType','DungChung')=v_sport
  AND lower(regexp_replace(trim(ten_thiet_bi),'\s+',' ','g'))=lower(regexp_replace(v_name,'\s+',' ','g'))) THEN
  RAISE EXCEPTION 'Thiết bị này đã có trong danh mục của bộ môn.';
 END IF;
 IF p_id IS NOT NULL THEN
  SELECT * INTO v_old FROM thiet_bi WHERE ma_thiet_bi=p_id AND NOT da_xoa FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy thiết bị.'; END IF;
 END IF;
 v_id:=coalesce(p_id,courtx_next_id('TB'));
 v_serial:=nullif(trim(p_item->>'serialNumber'),'');
 IF v_serial LIKE 'DM-%' THEN v_serial:=NULL; END IF;
 SELECT ma_bo_mon INTO v_bo_mon FROM bo_mon WHERE
  (v_sport='CauLong' AND ten_bo_mon ILIKE '%cầu%') OR
  (v_sport='BongChuyen' AND ten_bo_mon ILIKE '%chuyền%') OR
  (v_sport='BongDa' AND ten_bo_mon ILIKE '%đá%') LIMIT 1;
 v_meta:=coalesce(v_old.thong_tin_bo_sung,'{}') || p_item || jsonb_build_object(
  'isCatalogItem',true,'name',v_name,'sportType',v_sport,'compensationPrice',v_price,'serialNumber',coalesce(v_serial,''));
 IF p_id IS NULL THEN
  INSERT INTO thiet_bi(ma_thiet_bi,ten_thiet_bi,so_seri,trang_thai,nha_cung_cap,sdt_ncc,ngay_mua,han_bao_hanh,thong_tin_bo_sung)
  VALUES(v_id,v_name,v_serial,'san_sang',nullif(p_item->>'supplier',''),nullif(p_item->>'supplierPhone',''),
   nullif(p_item->>'purchaseDate','')::date,nullif(p_item->>'warrantyExpire','')::date,v_meta);
 ELSE
  UPDATE thiet_bi SET ten_thiet_bi=v_name,so_seri=v_serial,nha_cung_cap=nullif(p_item->>'supplier',''),
   sdt_ncc=nullif(p_item->>'supplierPhone',''),ngay_mua=nullif(p_item->>'purchaseDate','')::date,
   han_bao_hanh=nullif(p_item->>'warrantyExpire','')::date,thong_tin_bo_sung=v_meta WHERE ma_thiet_bi=v_id;
 END IF;
 SELECT ma_danh_muc_den_bu INTO v_catalog FROM bang_gia_den_bu WHERE
  ma_danh_muc_den_bu=v_old.thong_tin_bo_sung->>'compensationItemId' OR mo_ta_hu_hai='asset:'||v_id FOR UPDATE;
 IF v_catalog IS NULL THEN
  v_catalog:=courtx_next_id('DB');
  INSERT INTO bang_gia_den_bu(ma_danh_muc_den_bu,ten_vat_tu,ma_bo_mon,don_gia_den_bu,don_vi_tinh,mo_ta_hu_hai)
   VALUES(v_catalog,v_name,v_bo_mon,v_price,'chiếc','asset:'||v_id);
 ELSE
  UPDATE bang_gia_den_bu SET ten_vat_tu=v_name,ma_bo_mon=v_bo_mon,don_gia_den_bu=v_price WHERE ma_danh_muc_den_bu=v_catalog;
 END IF;
 UPDATE thiet_bi SET thong_tin_bo_sung=thong_tin_bo_sung || jsonb_build_object('compensationItemId',v_catalog) WHERE ma_thiet_bi=v_id;
 RETURN v_id;
END $$;
$definition$;

 EXECUTE $definition$
CREATE OR REPLACE FUNCTION public.courtx_save_incident(p_report jsonb)
RETURNS text LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE v_id text; v_employee text; v_price numeric; v_amount numeric; v_item bang_gia_den_bu;
  v_booking dat_san; v_court text; v_asset thiet_bi; v_existing bao_cao_su_co; v_meta jsonb;
BEGIN
  IF coalesce(p_report->>'liability','') NOT IN ('DO_KHACH_LAM_HONG','BAO_HANH_SAN_VAN_DONG') THEN
    RAISE EXCEPTION 'Chọn trách nhiệm hư hỏng.';
  END IF;
  IF nullif(trim(p_report->>'description'),'') IS NULL OR nullif(trim(p_report->>'title'),'') IS NULL THEN
    RAISE EXCEPTION 'Nhập tiêu đề và mô tả sự cố.';
  END IF;
  IF nullif(p_report->>'id','') IS NOT NULL THEN PERFORM pg_advisory_xact_lock(hashtext('report:' || (p_report->>'id'))); END IF;
  SELECT * INTO v_existing FROM bao_cao_su_co WHERE ma_su_co=p_report->>'id'
    OR (nullif(p_report->>'id','') IS NOT NULL AND thong_tin_bo_sung->>'requestId'=p_report->>'id') FOR UPDATE;
  IF FOUND THEN
    IF v_existing.thong_tin_bo_sung->>'deletedAt' IS NOT NULL THEN RAISE EXCEPTION 'Báo cáo đã bị xóa.'; END IF;
    RETURN v_existing.ma_su_co;
  END IF;
  SELECT ma_nhan_vien INTO v_employee FROM nhan_vien
    WHERE trang_thai_hoat_dong AND regexp_replace(so_dien_thoai,'[^0-9]','','g')=regexp_replace(p_report->>'reporterPhone','[^0-9]','','g');
  IF v_employee IS NULL THEN RAISE EXCEPTION 'Không xác định được nhân viên lập báo cáo. Kiểm tra tài khoản đăng nhập.'; END IF;
  SELECT * INTO v_item FROM bang_gia_den_bu WHERE ma_danh_muc_den_bu=p_report->>'compensationItemId' AND NOT da_an FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Mục bồi thường không còn trong bảng giá.'; END IF;
  v_price := v_item.don_gia_den_bu;
  IF v_price<0 OR v_price<>trunc(v_price) THEN RAISE EXCEPTION 'Giá niêm yết không hợp lệ.'; END IF;
  IF nullif(p_report->>'bookingCode','') IS NOT NULL THEN
    SELECT * INTO v_booking FROM dat_san WHERE ma_dat_san=p_report->>'bookingCode' FOR UPDATE;
    IF NOT FOUND OR v_booking.trang_thai NOT IN ('DA_THANH_TOAN','DANG_SU_DUNG') THEN RAISE EXCEPTION 'Lượt đặt không còn hiệu lực.'; END IF;
    IF nullif(p_report->>'bookingDate','') IS NOT NULL AND v_booking.ngay_dat<>(p_report->>'bookingDate')::date THEN RAISE EXCEPTION 'Ngày đặt không khớp.'; END IF;
    SELECT ten_san INTO v_court FROM san WHERE ma_san=v_booking.ma_san;
    IF v_court IS DISTINCT FROM p_report->>'courtName' THEN RAISE EXCEPTION 'Báo cáo không thuộc sân của lượt đặt.'; END IF;
  END IF;
  IF nullif(p_report->>'equipmentCode','') IS NOT NULL THEN
    SELECT * INTO v_asset FROM thiet_bi WHERE ma_thiet_bi=p_report->>'equipmentCode' AND NOT da_xoa FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy thiết bị.'; END IF;
    IF v_item.mo_ta_hu_hai LIKE 'asset:%' AND v_item.mo_ta_hu_hai <> 'asset:' || v_asset.ma_thiet_bi THEN RAISE EXCEPTION 'Bảng giá không thuộc thiết bị.'; END IF;
  END IF;
  IF v_asset.ma_thiet_bi IS NULL THEN
    SELECT * INTO v_asset FROM thiet_bi WHERE NOT da_xoa AND
      (thong_tin_bo_sung->>'compensationItemId'=v_item.ma_danh_muc_den_bu OR v_item.mo_ta_hu_hai='asset:'||ma_thiet_bi) LIMIT 1;
  END IF;
  v_id := courtx_next_id('SC');
  v_amount := CASE WHEN p_report->>'liability'='DO_KHACH_LAM_HONG' THEN v_price ELSE 0 END;
  v_meta := (p_report - ARRAY['deletedAt','checkoutReference','compensationPaidAt']) || jsonb_build_object('id',v_id,'requestId',p_report->>'id','compensationPrice',v_price,'compensationAmount',v_amount,
    'compensationPaymentStatus',CASE WHEN v_amount=0 THEN 'not_required' ELSE 'pending' END,
    'status','cho_xu_ly','createdAt',now(),'updatedAt',now());
  INSERT INTO bao_cao_su_co(ma_su_co,ma_dat_san,ma_nhan_vien,nguyen_nhan,tong_tien_den_bu,thong_tin_bo_sung)
  VALUES(v_id,v_booking.ma_dat_san,v_employee,(p_report->>'liability')::nguyen_nhan_su_co_enum,v_amount,v_meta);
  INSERT INTO chi_tiet_su_co(ma_chi_tiet,ma_su_co,ma_thiet_bi,ma_danh_muc_den_bu,don_gia_ap_dung,so_luong_hu_hai,thanh_tien,muc_do_hu_hai,mo_ta_chi_tiet)
  VALUES(courtx_next_id('CT'),v_id,v_asset.ma_thiet_bi,v_item.ma_danh_muc_den_bu,v_price,1,v_amount,p_report->>'severity',p_report->>'description');
  RETURN v_id;
END $$;
$definition$;

 EXECUTE $definition$
CREATE OR REPLACE FUNCTION public.courtx_checkin(p_code text,p_date date)
RETURNS void LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE v_booking dat_san; v_court san; v_paid numeric;
BEGIN
  SELECT * INTO v_booking FROM dat_san WHERE ma_dat_san=p_code AND ngay_dat=p_date FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy lượt đặt.'; END IF;
  IF v_booking.trang_thai='DANG_SU_DUNG' THEN RETURN; END IF;
  IF v_booking.trang_thai<>'DA_THANH_TOAN' THEN RAISE EXCEPTION 'Chỉ check-in lượt đặt đã thanh toán.'; END IF;
  SELECT * INTO v_court FROM san WHERE ma_san=v_booking.ma_san FOR UPDATE;
  IF v_court.trang_thai IN ('bao_tri','tam_dong') THEN RAISE EXCEPTION 'Sân đang bị khóa.'; END IF;
  IF EXISTS(SELECT 1 FROM dat_san WHERE ma_san=v_booking.ma_san AND trang_thai='DANG_SU_DUNG' AND ma_dat_san<>p_code) THEN RAISE EXCEPTION 'Sân đang có khách sử dụng.'; END IF;
  SELECT coalesce(sum(so_tien),0) INTO v_paid FROM thanh_toan WHERE ma_dat_san=p_code AND trang_thai='THANH_CONG' AND loai_giao_dich='THANH_TOAN_DAT_SAN';
  IF v_paid < v_booking.tong_tien_san THEN RAISE EXCEPTION 'Lượt đặt chưa thanh toán đủ 100%% tiền sân.'; END IF;
  UPDATE dat_san SET trang_thai='DANG_SU_DUNG',thoi_gian_checkin=now() WHERE ma_dat_san=p_code;
  UPDATE san SET trang_thai='dang_su_dung' WHERE ma_san=v_booking.ma_san;
END $$;
$definition$;

 EXECUTE $definition$
CREATE OR REPLACE FUNCTION public.courtx_checkout(p_request jsonb)
RETURNS jsonb LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE v_booking dat_san; v_court san; v_report jsonb; v_incident bao_cao_su_co;
  v_id text; v_ids text[] := '{}'; v_assets text[] := '{}'; v_total numeric := 0;
  v_receipt jsonb; v_result jsonb; v_now timestamptz := now(); v_paid numeric;
BEGIN
  SELECT * INTO v_booking FROM dat_san WHERE ma_dat_san=p_request->>'bookingCode' AND ngay_dat=(p_request->>'bookingDate')::date FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy lượt đặt.'; END IF;
  IF p_request->>'reference' <> v_booking.ngay_dat::text || ':' || v_booking.ma_dat_san THEN RAISE EXCEPTION 'Mã quyết toán không khớp.'; END IF;
  IF v_booking.ket_qua_checkout IS NOT NULL THEN RETURN v_booking.ket_qua_checkout; END IF;
  IF v_booking.trang_thai<>'DANG_SU_DUNG' THEN RAISE EXCEPTION 'Lượt đặt chưa check-in hoặc đã hủy.'; END IF;
  SELECT * INTO v_court FROM san WHERE ma_san=v_booking.ma_san FOR UPDATE;
  IF v_court.ten_san IS DISTINCT FROM p_request->>'courtName' THEN RAISE EXCEPTION 'Sân không khớp lượt đặt.'; END IF;
  SELECT coalesce(sum(so_tien),0) INTO v_paid FROM thanh_toan WHERE ma_dat_san=v_booking.ma_dat_san AND trang_thai='THANH_CONG' AND loai_giao_dich='THANH_TOAN_DAT_SAN';
  IF v_paid<v_booking.tong_tien_san OR coalesce((p_request->>'remainingBalance')::numeric,0)<>0 THEN RAISE EXCEPTION 'Tiền sân phải thanh toán đủ trước khi sử dụng; checkout chỉ thu bồi thường.'; END IF;
  IF jsonb_typeof(p_request->'reports') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Danh sách sự cố không hợp lệ.'; END IF;
  FOR v_report IN SELECT value FROM jsonb_array_elements(p_request->'reports') LOOP
    SELECT * INTO v_incident FROM bao_cao_su_co WHERE ma_su_co=v_report->>'id'
      OR (nullif(v_report->>'id','') IS NOT NULL AND thong_tin_bo_sung->>'requestId'=v_report->>'id') FOR UPDATE;
    IF FOUND THEN
      IF v_incident.ma_dat_san IS DISTINCT FROM v_booking.ma_dat_san AND v_incident.ma_dat_san IS NOT NULL THEN RAISE EXCEPTION 'Sự cố thuộc lượt đặt khác.'; END IF;
      IF v_incident.ma_dat_san IS DISTINCT FROM v_booking.ma_dat_san AND v_incident.thong_tin_bo_sung->>'courtName' IS DISTINCT FROM v_court.ten_san THEN RAISE EXCEPTION 'Sự cố không thuộc sân.'; END IF;
      IF v_incident.thong_tin_bo_sung->>'deletedAt' IS NOT NULL OR v_incident.thong_tin_bo_sung->>'compensationPaymentStatus'='paid' THEN RAISE EXCEPTION 'Sự cố đã xóa hoặc đã thu tiền.'; END IF;
      v_id := v_incident.ma_su_co;
      UPDATE bao_cao_su_co SET ma_dat_san=v_booking.ma_dat_san WHERE ma_su_co=v_id;
    ELSE
      v_id := courtx_save_incident(v_report || jsonb_build_object('bookingCode',v_booking.ma_dat_san,'bookingDate',v_booking.ngay_dat,'courtName',v_court.ten_san));
      SELECT * INTO v_incident FROM bao_cao_su_co WHERE ma_su_co=v_id;
    END IF;
    IF v_id=ANY(v_ids) THEN RAISE EXCEPTION 'Báo cáo bị chọn trùng.'; END IF;
    SELECT array_cat(v_assets,coalesce(array_agg(ma_thiet_bi) FILTER(WHERE ma_thiet_bi IS NOT NULL),'{}')) INTO v_assets FROM chi_tiet_su_co WHERE ma_su_co=v_id;
    v_ids := array_append(v_ids,v_id);
    v_total := v_total + v_incident.tong_tien_den_bu;
  END LOOP;
  IF EXISTS(SELECT 1 FROM bao_cao_su_co WHERE ma_dat_san=v_booking.ma_dat_san
    AND NOT(ma_su_co=ANY(v_ids)) AND thong_tin_bo_sung->>'deletedAt' IS NULL
    AND coalesce(thong_tin_bo_sung->>'compensationPaymentStatus','pending') NOT IN ('paid','not_required')) THEN RAISE EXCEPTION 'Còn báo cáo chưa được đưa vào quyết toán.'; END IF;
  IF v_total IS DISTINCT FROM (p_request->>'expectedAmount')::numeric THEN RAISE EXCEPTION 'Giá bồi thường đã thay đổi. Vui lòng tải lại.'; END IF;
  IF v_total>0 AND coalesce((p_request->>'paymentConfirmed')::boolean,false)=false THEN RAISE EXCEPTION 'Xác nhận đã nhận đủ VietQR.'; END IF;
  IF v_total>0 THEN
    IF nullif(trim(p_request->>'bankTransactionCode'),'') IS NULL THEN RAISE EXCEPTION 'Nhập mã giao dịch ngân hàng để đối soát khoản bồi thường.'; END IF;
    PERFORM pg_advisory_xact_lock(hashtext('payment:' || (p_request->>'bankTransactionCode')));
    IF EXISTS(SELECT 1 FROM thanh_toan WHERE ma_giao_dich_ngan_hang=p_request->>'bankTransactionCode' AND trang_thai='THANH_CONG') THEN RAISE EXCEPTION 'Mã giao dịch ngân hàng đã được ghi nhận.'; END IF;
  END IF;
  UPDATE bao_cao_su_co SET thong_tin_bo_sung=thong_tin_bo_sung || jsonb_build_object(
    'compensationPaymentStatus',CASE WHEN tong_tien_den_bu>0 THEN 'paid' ELSE 'not_required' END,
    'compensationPaidAt',CASE WHEN tong_tien_den_bu>0 THEN v_now ELSE NULL END,
    'checkoutReference',p_request->>'reference','bookingCode',v_booking.ma_dat_san,'bookingDate',v_booking.ngay_dat,'updatedAt',v_now)
    WHERE ma_su_co=ANY(v_ids);
  IF v_total>0 THEN
    INSERT INTO thanh_toan(ma_thanh_toan,ma_dat_san,so_tien,phuong_thuc_thanh_toan,loai_giao_dich,ma_giao_dich_ngan_hang,ghi_chu)
    VALUES(courtx_next_id('TT'),v_booking.ma_dat_san,v_total,'VIETQR','THANH_TOAN_BOI_THUONG',nullif(p_request->>'bankTransactionCode',''),'Checkout ' || (p_request->>'reference'));
  END IF;
  v_receipt := jsonb_build_object('reference',p_request->>'reference','bookingCode',v_booking.ma_dat_san,
    'bookingDate',v_booking.ngay_dat,'courtName',v_court.ten_san,'compensationAmount',v_total,'amountPaid',v_total,'completedAt',v_now,'incidentIds',to_jsonb(v_ids));
  v_result := jsonb_build_object('receipt',v_receipt,'incidentIds',to_jsonb(v_ids),'equipmentIds',to_jsonb(v_assets));
  UPDATE dat_san SET trang_thai='HOAN_TAT',thoi_gian_checkout=v_now,ket_qua_checkout=v_result WHERE ma_dat_san=v_booking.ma_dat_san;
  UPDATE san SET trang_thai=CASE WHEN trang_thai IN ('bao_tri','tam_dong') THEN trang_thai ELSE 'san_sang'::trang_thai_san_enum END WHERE ma_san=v_court.ma_san;
  RETURN v_result;
END $$;
$definition$;
 ALTER TABLE public.thiet_bi DROP COLUMN IF EXISTS ma_san;
 PERFORM pg_notify('pgrst','reload schema');
END $install_catalog$;

SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='thiet_bi' ORDER BY ordinal_position;
