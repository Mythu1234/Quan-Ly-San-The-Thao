-- Apply after 20261103_facility_supabase.sql. Keeps all existing IDs and records.
BEGIN;
CREATE OR REPLACE FUNCTION public.courtx_booking_next_id(p_prefix text) RETURNS text
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE v_table text; v_column text; v_next bigint;
BEGIN
  CASE p_prefix
    WHEN 'DS' THEN v_table:='dat_san'; v_column:='ma_dat_san';
    WHEN 'KH' THEN v_table:='khach_hang'; v_column:='ma_khach_hang';
    WHEN 'TT' THEN v_table:='thanh_toan'; v_column:='ma_thanh_toan';
    ELSE RAISE EXCEPTION 'Tiền tố mã không hợp lệ.';
  END CASE;
  PERFORM pg_advisory_xact_lock(hashtext('courtx:' || p_prefix));
  EXECUTE format('SELECT coalesce(max(substring(%I from ''[0-9]+$'')::bigint),0)+1 FROM %I WHERE %I ~ $1',v_column,v_table,v_column)
    INTO v_next USING '^' || p_prefix || '[0-9]{8}$';
  IF v_next>99999999 THEN RAISE EXCEPTION 'Đã hết dải mã.'; END IF;
  RETURN p_prefix || lpad(v_next::text,8,'0');
END $$;

CREATE OR REPLACE FUNCTION public.courtx_create_paid_booking(p_request jsonb) RETURNS text
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE v_court san; v_rate numeric; v_date date; v_start time; v_end time;
  v_minutes numeric; v_total numeric; v_customer text; v_code text; v_bank text;
  v_phone text; v_name text; v_payment thanh_toan; v_existing dat_san;
BEGIN
  v_bank:=nullif(trim(p_request->>'bankTransactionCode'),'');
  v_name:=nullif(trim(p_request->>'customerName'),'');
  v_phone:=nullif(trim(p_request->>'customerPhone'),'');
  IF v_bank IS NULL OR length(v_bank)>100 THEN RAISE EXCEPTION 'Nhập mã giao dịch ngân hàng hợp lệ.'; END IF;
  IF coalesce((p_request->>'paymentConfirmed')::boolean,false)=false THEN RAISE EXCEPTION 'Cần xác nhận đã đối soát tiền thực nhận qua VietQR.'; END IF;
  IF v_name IS NULL OR length(v_name)>100 OR v_phone !~ '^0[35789][0-9]{8}$' OR v_phone IS NULL THEN RAISE EXCEPTION 'Họ tên hoặc số điện thoại không hợp lệ.'; END IF;
  IF coalesce(p_request->>'channel','ONLINE') NOT IN ('ONLINE','TAI_QUAY') THEN RAISE EXCEPTION 'Kênh đặt không hợp lệ.'; END IF;
  v_date:=(p_request->>'bookingDate')::date;
  v_start:=(p_request->>'startTime')::time;
  v_end:=(p_request->>'endTime')::time;
  v_minutes:=extract(epoch FROM (v_end-v_start))/60;
  IF v_date IS NULL OR v_start IS NULL OR v_end IS NULL OR v_start<'05:00'::time OR v_end>'23:00'::time OR v_minutes<=0
    OR mod(extract(epoch FROM v_start),1800)<>0 OR mod(extract(epoch FROM v_end),1800)<>0 THEN RAISE EXCEPTION 'Khung giờ đặt sân không hợp lệ.'; END IF;
  -- A retry with the same bank reference returns the original booking, never charges twice.
  PERFORM pg_advisory_xact_lock(hashtext('payment:' || v_bank));
  SELECT * INTO v_payment FROM thanh_toan WHERE ma_giao_dich_ngan_hang=v_bank AND trang_thai='THANH_CONG' LIMIT 1;
  IF FOUND THEN
    SELECT * INTO v_existing FROM dat_san WHERE ma_dat_san=v_payment.ma_dat_san;
    IF v_payment.loai_giao_dich='THANH_TOAN_DAT_SAN' AND v_existing.ngay_dat=v_date AND v_existing.gio_bat_dau=v_start AND v_existing.gio_ket_thuc=v_end
      AND v_payment.so_tien=(p_request->>'totalAmount')::numeric
      AND EXISTS(SELECT 1 FROM san WHERE ma_san=v_existing.ma_san AND (ten_san=p_request->>'courtCode' OR ten_san='Sân ' || (p_request->>'courtCode')))
      AND EXISTS(SELECT 1 FROM khach_hang WHERE ma_khach_hang=v_existing.ma_khach_hang AND so_dien_thoai=v_phone) THEN
      RETURN v_existing.ma_dat_san;
    END IF;
    RAISE EXCEPTION 'Mã giao dịch ngân hàng đã được ghi nhận cho giao dịch khác.';
  END IF;
  SELECT * INTO v_court FROM san WHERE ten_san=p_request->>'courtCode' OR ten_san='Sân ' || (p_request->>'courtCode') FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy sân.'; END IF;
  IF v_court.trang_thai IN ('bao_tri','tam_dong') THEN RAISE EXCEPTION 'Sân đang khóa hoặc bảo trì.'; END IF;
  IF v_date<(now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date THEN RAISE EXCEPTION 'Không thể đặt sân cho ngày quá khứ.'; END IF;
  IF EXISTS(SELECT 1 FROM dat_san WHERE ma_san=v_court.ma_san AND ngay_dat=v_date AND trang_thai<>'DA_HUY' AND gio_bat_dau<v_end AND gio_ket_thuc>v_start) THEN RAISE EXCEPTION 'Khung giờ đã có lượt đặt khác. Vui lòng chọn lại.'; END IF;
  SELECT don_gia_gio INTO v_rate FROM bo_mon WHERE ma_bo_mon=v_court.ma_bo_mon;
  v_total:=round(v_rate*v_minutes/60);
  IF v_total IS NULL OR v_total<=0 OR v_total IS DISTINCT FROM (p_request->>'totalAmount')::numeric THEN RAISE EXCEPTION 'Giá sân đã thay đổi. Vui lòng tải lại và đối soát số tiền.'; END IF;
  IF nullif(p_request->>'staffId','') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM nhan_vien WHERE ma_nhan_vien=p_request->>'staffId' AND trang_thai_hoat_dong) THEN RAISE EXCEPTION 'Nhân viên không hợp lệ.'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('customer:' || v_phone));
  SELECT ma_khach_hang INTO v_customer FROM khach_hang WHERE so_dien_thoai=v_phone LIMIT 1;
  IF v_customer IS NULL THEN
    v_customer:=courtx_booking_next_id('KH');
    INSERT INTO khach_hang(ma_khach_hang,ho_ten,so_dien_thoai) VALUES(v_customer,v_name,v_phone);
  END IF;
  v_code:=courtx_booking_next_id('DS');
  INSERT INTO dat_san(ma_dat_san,ma_san,ma_khach_hang,ma_nhan_vien,ngay_dat,gio_bat_dau,gio_ket_thuc,kenh_dat,don_gia_gio,tong_tien_san,trang_thai)
    VALUES(v_code,v_court.ma_san,v_customer,nullif(p_request->>'staffId',''),v_date,v_start,v_end,coalesce(p_request->>'channel','ONLINE')::kenh_dat_enum,v_rate,v_total,'DA_THANH_TOAN');
  INSERT INTO thanh_toan(ma_thanh_toan,ma_dat_san,so_tien,phuong_thuc_thanh_toan,loai_giao_dich,ma_giao_dich_ngan_hang,trang_thai,ghi_chu)
    VALUES(courtx_booking_next_id('TT'),v_code,v_total,'VIETQR','THANH_TOAN_DAT_SAN',v_bank,'THANH_CONG','Nhân viên/chủ sân xác nhận đối soát VietQR');
  RETURN v_code;
END $$;
NOTIFY pgrst,'reload schema';
COMMIT;
