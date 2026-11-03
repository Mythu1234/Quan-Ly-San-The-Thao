-- Run once in the Supabase SQL Editor. Additive: existing business rows are retained.
BEGIN;
ALTER TABLE public.thiet_bi ADD COLUMN IF NOT EXISTS thong_tin_bo_sung jsonb NOT NULL DEFAULT '{}';
ALTER TABLE public.thiet_bi ADD COLUMN IF NOT EXISTS da_xoa boolean NOT NULL DEFAULT false;
ALTER TABLE public.san ADD COLUMN IF NOT EXISTS thong_tin_bo_sung jsonb NOT NULL DEFAULT '{}';
ALTER TABLE public.bao_cao_su_co ADD COLUMN IF NOT EXISTS thong_tin_bo_sung jsonb NOT NULL DEFAULT '{}';
ALTER TABLE public.dat_san ADD COLUMN IF NOT EXISTS ket_qua_checkout jsonb;
ALTER TABLE public.bang_gia_den_bu ADD COLUMN IF NOT EXISTS da_an boolean NOT NULL DEFAULT false;

-- IDs are allocated and inserted inside the same transaction, under a per-table lock.
CREATE OR REPLACE FUNCTION public.courtx_next_id(p_prefix text) RETURNS text
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE v_table text; v_column text; v_next bigint;
BEGIN
  CASE p_prefix
    WHEN 'TB' THEN v_table := 'thiet_bi'; v_column := 'ma_thiet_bi';
    WHEN 'SC' THEN v_table := 'bao_cao_su_co'; v_column := 'ma_su_co';
    WHEN 'CT' THEN v_table := 'chi_tiet_su_co'; v_column := 'ma_chi_tiet';
    WHEN 'TT' THEN v_table := 'thanh_toan'; v_column := 'ma_thanh_toan';
    WHEN 'DB' THEN v_table := 'bang_gia_den_bu'; v_column := 'ma_danh_muc_den_bu';
    ELSE RAISE EXCEPTION 'Tiền tố mã không hợp lệ.';
  END CASE;
  PERFORM pg_advisory_xact_lock(hashtext('courtx:' || p_prefix));
  EXECUTE format('SELECT coalesce(max(substring(%I from ''[0-9]+$'')::bigint),0)+1 FROM %I', v_column, v_table) INTO v_next;
  IF v_next > 99999999 THEN RAISE EXCEPTION 'Đã hết dải mã.'; END IF;
  RETURN p_prefix || lpad(v_next::text,8,'0');
END $$;

CREATE OR REPLACE FUNCTION public.courtx_save_equipment(p_item jsonb, p_id text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE v_id text; v_court text; v_price numeric; v_catalog text; v_old thiet_bi;
BEGIN
  IF nullif(trim(p_item->>'name'),'') IS NULL THEN RAISE EXCEPTION 'Nhập tên thiết bị.'; END IF;
  IF nullif(trim(p_item->>'serialNumber'),'') IS NULL THEN RAISE EXCEPTION 'Nhập số Seri / Asset Tag cho thiết bị.'; END IF;
  IF coalesce(p_item->>'currentLocation','Kho chung') NOT ILIKE '%kho%' THEN
    SELECT ma_san INTO v_court FROM san WHERE ten_san = p_item->>'currentLocation' AND trang_thai NOT IN ('bao_tri','tam_dong');
    IF v_court IS NULL THEN RAISE EXCEPTION 'Không tìm thấy sân điều phối.'; END IF;
  END IF;
  v_id := coalesce(p_id, courtx_next_id('TB'));
  IF nullif(p_item->>'assignedBookingCode','') IS NOT NULL AND NOT EXISTS(
    SELECT 1 FROM dat_san WHERE ma_dat_san=p_item->>'assignedBookingCode' AND ma_san=v_court AND trang_thai IN ('DA_THANH_TOAN','DANG_SU_DUNG')) THEN
    RAISE EXCEPTION 'Lượt đặt gán thiết bị không tồn tại hoặc không thuộc sân này.';
  END IF;
  IF p_id IS NULL THEN
    INSERT INTO thiet_bi(ma_thiet_bi,ten_thiet_bi,ma_san,so_seri,trang_thai,nha_cung_cap,sdt_ncc,ngay_mua,han_bao_hanh,thong_tin_bo_sung)
    VALUES(v_id,trim(p_item->>'name'),v_court,p_item->>'serialNumber',(p_item->>'status')::trang_thai_thiet_bi_enum,
      nullif(p_item->>'supplier',''),nullif(p_item->>'supplierPhone',''),nullif(p_item->>'purchaseDate','')::date,
      nullif(p_item->>'warrantyExpire','')::date,p_item);
  ELSE
    SELECT * INTO v_old FROM thiet_bi WHERE ma_thiet_bi=v_id AND NOT da_xoa FOR UPDATE;
    IF v_old.trang_thai IN ('hong','bao_tri') AND p_item->>'status' NOT IN ('hong','bao_tri') THEN
      RAISE EXCEPTION 'Thiết bị hỏng hoặc bảo trì phải được nghiệm thu trước khi sử dụng.';
    END IF;
    UPDATE thiet_bi SET ten_thiet_bi=trim(p_item->>'name'),ma_san=v_court,so_seri=p_item->>'serialNumber',
      trang_thai=(p_item->>'status')::trang_thai_thiet_bi_enum,nha_cung_cap=nullif(p_item->>'supplier',''),
      sdt_ncc=nullif(p_item->>'supplierPhone',''),ngay_mua=nullif(p_item->>'purchaseDate','')::date,
      han_bao_hanh=nullif(p_item->>'warrantyExpire','')::date,thong_tin_bo_sung=p_item
      WHERE ma_thiet_bi=v_id AND NOT da_xoa;
    IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy thiết bị.'; END IF;
  END IF;
  -- A separately listed price for each asset preserves its serial identity.
  IF p_item ? 'compensationPrice' THEN
    v_price := (p_item->>'compensationPrice')::numeric;
    IF v_price < 0 OR v_price <> trunc(v_price) THEN RAISE EXCEPTION 'Giá bồi thường không hợp lệ.'; END IF;
    SELECT ma_danh_muc_den_bu INTO v_catalog FROM bang_gia_den_bu WHERE mo_ta_hu_hai='asset:' || v_id FOR UPDATE;
    IF v_catalog IS NULL THEN
      v_catalog := courtx_next_id('DB');
      INSERT INTO bang_gia_den_bu(ma_danh_muc_den_bu,ten_vat_tu,don_gia_den_bu,don_vi_tinh,mo_ta_hu_hai)
      VALUES(v_catalog,p_item->>'name',v_price,'chiếc','asset:' || v_id);
    ELSE
      UPDATE bang_gia_den_bu SET ten_vat_tu=p_item->>'name',don_gia_den_bu=v_price WHERE ma_danh_muc_den_bu=v_catalog;
    END IF;
  END IF;
  RETURN v_id;
END $$;

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
    IF v_asset.ma_san IS NOT NULL AND NOT EXISTS(SELECT 1 FROM san WHERE ma_san=v_asset.ma_san AND ten_san=p_report->>'courtName') THEN
      RAISE EXCEPTION 'Thiết bị không thuộc sân báo cáo.';
    END IF;
    IF v_item.mo_ta_hu_hai LIKE 'asset:%' AND v_item.mo_ta_hu_hai <> 'asset:' || v_asset.ma_thiet_bi THEN RAISE EXCEPTION 'Bảng giá không thuộc thiết bị.'; END IF;
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
  IF v_asset.ma_thiet_bi IS NOT NULL THEN UPDATE thiet_bi SET trang_thai='hong' WHERE ma_thiet_bi=v_asset.ma_thiet_bi; END IF;
  RETURN v_id;
END $$;

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
  UPDATE thiet_bi SET trang_thai='dang_su_dung' WHERE ma_san=v_booking.ma_san AND trang_thai='san_sang' AND NOT da_xoa;
END $$;

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
      IF v_incident.ma_dat_san IS DISTINCT FROM v_booking.ma_dat_san AND v_incident.thong_tin_bo_sung->>'courtName' IS DISTINCT FROM v_court.ten_san
        AND NOT EXISTS(SELECT 1 FROM chi_tiet_su_co d JOIN thiet_bi t ON t.ma_thiet_bi=d.ma_thiet_bi WHERE d.ma_su_co=v_incident.ma_su_co AND t.ma_san=v_court.ma_san) THEN RAISE EXCEPTION 'Sự cố không thuộc sân.'; END IF;
      IF v_incident.thong_tin_bo_sung->>'deletedAt' IS NOT NULL OR v_incident.thong_tin_bo_sung->>'compensationPaymentStatus'='paid' THEN RAISE EXCEPTION 'Sự cố đã xóa hoặc đã thu tiền.'; END IF;
      v_id := v_incident.ma_su_co;
      UPDATE bao_cao_su_co SET ma_dat_san=v_booking.ma_dat_san WHERE ma_su_co=v_id;
    ELSE
      v_id := courtx_save_incident(v_report || jsonb_build_object('bookingCode',v_booking.ma_dat_san,'bookingDate',v_booking.ngay_dat,'courtName',v_court.ten_san));
      SELECT * INTO v_incident FROM bao_cao_su_co WHERE ma_su_co=v_id;
    END IF;
    IF v_id=ANY(v_ids) THEN RAISE EXCEPTION 'Báo cáo bị chọn trùng.'; END IF;
    IF EXISTS(SELECT 1 FROM chi_tiet_su_co WHERE ma_su_co=v_id AND ma_thiet_bi=ANY(v_assets)) THEN RAISE EXCEPTION 'Thiết bị bị chọn trùng.'; END IF;
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
  -- Recall assets while retaining damaged/maintenance states.
  SELECT coalesce(array_agg(ma_thiet_bi),'{}') INTO v_assets FROM thiet_bi WHERE ma_san=v_court.ma_san OR ma_thiet_bi=ANY(v_assets);
  UPDATE thiet_bi SET ma_san=NULL,trang_thai=CASE WHEN trang_thai IN ('hong','bao_tri') THEN trang_thai ELSE 'san_sang'::trang_thai_thiet_bi_enum END,
    thong_tin_bo_sung=thong_tin_bo_sung - ARRAY['assignedBookingCode','assignedCourt','assignedCustomer','assignedTimeSlot']
    WHERE ma_thiet_bi=ANY(v_assets);
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

-- Merge timeline/status changes while holding a row lock, so simultaneous updates are retained.
CREATE OR REPLACE FUNCTION public.courtx_patch_incident(p_id text,p_patch jsonb)
RETURNS void LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE v_row bao_cao_su_co; v_meta jsonb;
BEGIN
  SELECT * INTO v_row FROM bao_cao_su_co WHERE ma_su_co=p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy báo cáo.'; END IF;
  IF p_patch ? 'deletedAt' AND (v_row.thong_tin_bo_sung->>'compensationPaymentStatus'='paid' OR v_row.thong_tin_bo_sung->>'checkoutReference' IS NOT NULL) THEN RAISE EXCEPTION 'Không xóa được báo cáo đã quyết toán.'; END IF;
  v_meta := v_row.thong_tin_bo_sung || (p_patch - 'newLog') || jsonb_build_object('updatedAt',now());
  IF p_patch ? 'newLog' THEN
    v_meta := v_meta || jsonb_build_object('timelineLogs',jsonb_build_array(p_patch->'newLog') ||
      coalesce((SELECT jsonb_agg(value || '{"active":false}'::jsonb) FROM jsonb_array_elements(coalesce(v_row.thong_tin_bo_sung->'timelineLogs','[]'))),'[]'));
  END IF;
  UPDATE bao_cao_su_co SET thong_tin_bo_sung=v_meta,
    trang_thai_xu_ly=CASE WHEN p_patch->>'status'='da_khac_phuc' THEN 'DA_XU_LY'::trang_thai_su_co_enum
      WHEN p_patch ? 'status' THEN 'CHO_BOI_THUONG'::trang_thai_su_co_enum ELSE trang_thai_xu_ly END WHERE ma_su_co=p_id;
END $$;
CREATE OR REPLACE FUNCTION public.courtx_complete_maintenance(p_code text)
RETURNS void LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE v_asset thiet_bi; v_incident text;
BEGIN
  SELECT * INTO v_asset FROM thiet_bi WHERE ma_thiet_bi=p_code AND NOT da_xoa FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy thiết bị.'; END IF;
  IF v_asset.trang_thai='san_sang' THEN RETURN; END IF;
  IF v_asset.trang_thai='dang_su_dung' THEN RAISE EXCEPTION 'Thiết bị đang được sử dụng, không thể nghiệm thu bảo trì.'; END IF;
  UPDATE thiet_bi SET trang_thai='san_sang',thong_tin_bo_sung=thong_tin_bo_sung || jsonb_build_object(
    'healthRate','Tốt (Đã nghiệm thu)','lastMaintenance',to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh','DD/MM/YYYY')) WHERE ma_thiet_bi=p_code;
  FOR v_incident IN SELECT DISTINCT b.ma_su_co FROM bao_cao_su_co b JOIN chi_tiet_su_co d ON d.ma_su_co=b.ma_su_co
    WHERE d.ma_thiet_bi=p_code AND b.thong_tin_bo_sung->>'deletedAt' IS NULL LOOP
    PERFORM courtx_patch_incident(v_incident,jsonb_build_object('newLog',jsonb_build_object('id',p_code || ':' || now()::text,
      'time',now(),'title','Nghiệm thu thiết bị ' || p_code,'description','Đã kiểm tra và nghiệm thu thiết bị.','active',true)));
  END LOOP;
END $$;
CREATE OR REPLACE FUNCTION public.courtx_facility_schema_version() RETURNS integer
LANGUAGE sql IMMUTABLE AS $$ SELECT 1 $$;
NOTIFY pgrst, 'reload schema';
COMMIT;
