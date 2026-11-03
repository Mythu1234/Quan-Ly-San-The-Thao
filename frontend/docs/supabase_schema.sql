-- =====================================================================
-- HỆ THỐNG QUẢN LÝ VẬN HÀNH VÀ ĐẶT SÂN THỂ THAO COURTX ARENA
-- SCRIPT KHỞI TẠO CƠ SỞ DỮ LIỆU POSTGRESQL / SUPABASE (DDL + SEED DATA)
-- Chuẩn hóa mã toàn hệ thống: [Tiền tố 2-3 ký tự] + [8 chữ số]
-- Mỗi bảng nghiệp vụ chính có ít nhất 25 dòng dữ liệu thực tế, hợp lý
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 1. TẠO CÁC ENUMS
-- =====================================================================

DO $$ BEGIN
    CREATE TYPE vai_tro_noi_bo_enum AS ENUM ('ADMIN', 'STAFF');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE trang_thai_san_enum AS ENUM ('san_sang', 'dang_su_dung', 'bao_tri', 'tam_dong');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE kenh_dat_enum AS ENUM ('TAI_QUAY', 'ONLINE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE trang_thai_dat_san_enum AS ENUM ('CHO_THANH_TOAN', 'DA_THANH_TOAN', 'DANG_SU_DUNG', 'HOAN_TAT', 'DA_HUY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE loai_giao_dich_enum AS ENUM ('THANH_TOAN_DAT_SAN', 'THANH_TOAN_BOI_THUONG');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE phuong_thuc_thanh_toan_enum AS ENUM ('VIETQR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE trang_thai_thanh_toan_enum AS ENUM ('THANH_CONG', 'THAT_BAI');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE trang_thai_thiet_bi_enum AS ENUM ('san_sang', 'dang_su_dung', 'bao_tri', 'hong');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE nguyen_nhan_su_co_enum AS ENUM ('DO_KHACH_LAM_HONG', 'BAO_HANH_SAN_VAN_DONG');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE trang_thai_su_co_enum AS ENUM ('CHO_BOI_THUONG', 'DA_XU_LY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================================
-- 2. TẠO CÁC BẢNG DỮ LIỆU
-- =====================================================================

CREATE TABLE IF NOT EXISTS nhan_vien (
    ma_nhan_vien VARCHAR(30) PRIMARY KEY,
    ho_ten VARCHAR(100) NOT NULL,
    so_dien_thoai VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    mat_khau VARCHAR(255) NOT NULL,
    vai_tro vai_tro_noi_bo_enum NOT NULL DEFAULT 'STAFF',
    trang_thai_hoat_dong BOOLEAN NOT NULL DEFAULT TRUE,
    ngay_tao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS khach_hang (
    ma_khach_hang VARCHAR(30) PRIMARY KEY,
    ho_ten VARCHAR(100) NOT NULL,
    so_dien_thoai VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100),
    ghi_chu TEXT,
    ngay_tao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bo_mon (
    ma_bo_mon VARCHAR(20) PRIMARY KEY,
    ten_bo_mon VARCHAR(50) NOT NULL,
    don_gia_gio NUMERIC(12,2) NOT NULL,
    mo_ta TEXT
);

CREATE TABLE IF NOT EXISTS san (
    ma_san VARCHAR(30) PRIMARY KEY,
    ten_san VARCHAR(50) NOT NULL,
    ma_bo_mon VARCHAR(20) NOT NULL REFERENCES bo_mon(ma_bo_mon) ON DELETE RESTRICT,
    trang_thai trang_thai_san_enum NOT NULL DEFAULT 'san_sang',
    vi_tri VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS dat_san (
    ma_dat_san VARCHAR(30) PRIMARY KEY,
    ma_san VARCHAR(30) NOT NULL REFERENCES san(ma_san) ON DELETE RESTRICT,
    ma_khach_hang VARCHAR(30) NOT NULL REFERENCES khach_hang(ma_khach_hang) ON DELETE RESTRICT,
    ma_nhan_vien VARCHAR(30) REFERENCES nhan_vien(ma_nhan_vien) ON DELETE SET NULL,
    
    ngay_dat DATE NOT NULL,
    gio_bat_dau TIME NOT NULL,
    gio_ket_thuc TIME NOT NULL,
    
    kenh_dat kenh_dat_enum NOT NULL DEFAULT 'TAI_QUAY',
    don_gia_gio NUMERIC(12,2) NOT NULL,
    tong_tien_san NUMERIC(12,2) NOT NULL,
    
    trang_thai trang_thai_dat_san_enum NOT NULL DEFAULT 'CHO_THANH_TOAN',
    thoi_gian_checkin TIMESTAMPTZ,
    thoi_gian_checkout TIMESTAMPTZ,
    
    thoi_gian_huy TIMESTAMPTZ,
    ly_do_huy TEXT,
    ma_nhan_vien_huy VARCHAR(30) REFERENCES nhan_vien(ma_nhan_vien) ON DELETE SET NULL,
    
    ngay_tao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS thanh_toan (
    ma_thanh_toan VARCHAR(30) PRIMARY KEY,
    ma_dat_san VARCHAR(30) NOT NULL REFERENCES dat_san(ma_dat_san) ON DELETE CASCADE,
    so_tien NUMERIC(12,2) NOT NULL,
    phuong_thuc_thanh_toan phuong_thuc_thanh_toan_enum NOT NULL DEFAULT 'VIETQR',
    loai_giao_dich loai_giao_dich_enum NOT NULL,
    ma_giao_dich_ngan_hang VARCHAR(100),
    thoi_gian_thanh_toan TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    trang_thai trang_thai_thanh_toan_enum NOT NULL DEFAULT 'THANH_CONG',
    ghi_chu TEXT
);

CREATE TABLE IF NOT EXISTS hoan_tien (
    ma_hoan_tien VARCHAR(30) PRIMARY KEY,
    ma_dat_san VARCHAR(30) NOT NULL REFERENCES dat_san(ma_dat_san) ON DELETE CASCADE,
    ma_thanh_toan_goc VARCHAR(30) NOT NULL REFERENCES thanh_toan(ma_thanh_toan) ON DELETE RESTRICT,
    so_tien_hoan NUMERIC(12,2) NOT NULL,
    ly_do_hoan TEXT NOT NULL,
    
    stk_nhan_tien VARCHAR(30) NOT NULL,
    ngan_hang VARCHAR(100) NOT NULL,
    ten_chu_tai_khoan VARCHAR(100) NOT NULL,
    
    ma_giao_dich_ngan_hang VARCHAR(100),
    thoi_gian_hoan TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    trang_thai trang_thai_thanh_toan_enum NOT NULL DEFAULT 'THANH_CONG',
    ghi_chu TEXT
);

CREATE TABLE IF NOT EXISTS thiet_bi (
    ma_thiet_bi VARCHAR(30) PRIMARY KEY,
    ten_thiet_bi VARCHAR(100) NOT NULL,
    ma_san VARCHAR(30) REFERENCES san(ma_san) ON DELETE SET NULL,
    so_seri VARCHAR(50) UNIQUE,
    trang_thai trang_thai_thiet_bi_enum NOT NULL DEFAULT 'san_sang',
    
    nha_cung_cap VARCHAR(100),
    sdt_ncc VARCHAR(20),
    ngay_mua DATE,
    han_bao_hanh DATE
);

CREATE TABLE IF NOT EXISTS bang_gia_den_bu (
    ma_danh_muc_den_bu VARCHAR(30) PRIMARY KEY,
    ten_vat_tu VARCHAR(100) NOT NULL,
    ma_bo_mon VARCHAR(20) REFERENCES bo_mon(ma_bo_mon) ON DELETE SET NULL,
    don_gia_den_bu NUMERIC(12,2) NOT NULL,
    don_vi_tinh VARCHAR(20) NOT NULL,
    mo_ta_hu_hai TEXT
);

CREATE TABLE IF NOT EXISTS bao_cao_su_co (
    ma_su_co VARCHAR(30) PRIMARY KEY,
    ma_dat_san VARCHAR(30) REFERENCES dat_san(ma_dat_san) ON DELETE SET NULL,
    ma_nhan_vien VARCHAR(30) NOT NULL REFERENCES nhan_vien(ma_nhan_vien) ON DELETE RESTRICT,
    nguyen_nhan nguyen_nhan_su_co_enum NOT NULL,
    tong_tien_den_bu NUMERIC(12,2) NOT NULL DEFAULT 0,
    trang_thai_xu_ly trang_thai_su_co_enum NOT NULL DEFAULT 'CHO_BOI_THUONG',
    ngay_tao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chi_tiet_su_co (
    ma_chi_tiet VARCHAR(30) PRIMARY KEY,
    ma_su_co VARCHAR(30) NOT NULL REFERENCES bao_cao_su_co(ma_su_co) ON DELETE CASCADE,
    ma_thiet_bi VARCHAR(30) REFERENCES thiet_bi(ma_thiet_bi) ON DELETE SET NULL,
    ma_danh_muc_den_bu VARCHAR(30) NOT NULL REFERENCES bang_gia_den_bu(ma_danh_muc_den_bu) ON DELETE RESTRICT,
    
    don_gia_ap_dung NUMERIC(12,2) NOT NULL,
    so_luong_hu_hai INT NOT NULL DEFAULT 1,
    thanh_tien NUMERIC(12,2) NOT NULL,
    
    muc_do_hu_hai VARCHAR(50),
    mo_ta_chi_tiet TEXT
);

-- =====================================================================
-- 3. CẤU HÌNH ROW LEVEL SECURITY (RLS) - MỞ QUYỀN TRUY CẬP CHO FRONTEND
-- =====================================================================

ALTER TABLE nhan_vien ENABLE ROW LEVEL SECURITY;
ALTER TABLE khach_hang ENABLE ROW LEVEL SECURITY;
ALTER TABLE bo_mon ENABLE ROW LEVEL SECURITY;
ALTER TABLE san ENABLE ROW LEVEL SECURITY;
ALTER TABLE dat_san ENABLE ROW LEVEL SECURITY;
ALTER TABLE thanh_toan ENABLE ROW LEVEL SECURITY;
ALTER TABLE hoan_tien ENABLE ROW LEVEL SECURITY;
ALTER TABLE thiet_bi ENABLE ROW LEVEL SECURITY;
ALTER TABLE bang_gia_den_bu ENABLE ROW LEVEL SECURITY;
ALTER TABLE bao_cao_su_co ENABLE ROW LEVEL SECURITY;
ALTER TABLE chi_tiet_su_co ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Public full access nhan_vien" ON nhan_vien FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Public full access khach_hang" ON khach_hang FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Public full access bo_mon" ON bo_mon FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Public full access san" ON san FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Public full access dat_san" ON dat_san FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Public full access thanh_toan" ON thanh_toan FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Public full access hoan_tien" ON hoan_tien FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Public full access thiet_bi" ON thiet_bi FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Public full access bang_gia_den_bu" ON bang_gia_den_bu FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Public full access bao_cao_su_co" ON bao_cao_su_co FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Public full access chi_tiet_su_co" ON chi_tiet_su_co FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================================
-- 4. DỮ LIỆU BAN ĐẦU (SEED DATA ĐẦY ĐỦ >= 25 DÒNG MỖI BẢNG NGHIỆP VỤ)
-- =====================================================================

-- 4.1. BẢNG NHÂN VIÊN (5 nhân sự nội bộ)
INSERT INTO nhan_vien (ma_nhan_vien, ho_ten, so_dien_thoai, email, mat_khau, vai_tro, trang_thai_hoat_dong) VALUES
('NV00000001', 'Phạm Quốc Hùng (Chủ Sân)', '0912345678', 'admin@courtx.vn', 'admin@123', 'ADMIN', TRUE),
('NV00000002', 'Nguyễn Văn An (Trực quầy)', '0901234567', 'an.nguyen@courtx.vn', 'staff@123', 'STAFF', TRUE),
('NV00000003', 'Trần Thị Bình (Vận hành)', '0907654321', 'binh.tran@courtx.vn', 'staff@123', 'STAFF', TRUE),
('NV00000004', 'Lê Hoàng Long (Kỹ thuật)', '0933112233', 'long.le@courtx.vn', 'staff@123', 'STAFF', TRUE),
('NV00000005', 'Võ Thảo My (Lễ tân)', '0944556677', 'my.vo@courtx.vn', 'staff@123', 'STAFF', TRUE)
ON CONFLICT (ma_nhan_vien) DO NOTHING;

-- 4.2. BẢNG KHÁCH HÀNG (15 khách hàng thực tế)
INSERT INTO khach_hang (ma_khach_hang, ho_ten, so_dien_thoai, email, ghi_chu) VALUES
('KH00000001', 'Nguyễn Tuấn Hưng', '0912000001', 'tuanhung@gmail.com', 'Khách quen sân cầu lông tối T3-T5-T7'),
('KH00000002', 'Trần Quang Thắng', '0912000002', 'thang.tran@fpt.com', 'Đại diện giải phong trào'),
('KH00000003', 'Lê Ngọc Mai', '0912000003', 'ngocmai92@yahoo.com', 'Khách chơi cầu lông sáng'),
('KH00000004', 'Phạm Minh Trí', '0912000004', 'minhtri.fc@gmail.com', 'Đội trưởng CLB Bóng đá FC Trẻ'),
('KH00000005', 'Đoàn Thành Long', '0912000005', NULL, 'Khách vãng lai đặt tại quầy'),
('KH00000006', 'Vũ Hồng Quân', '0912000006', 'hongquan.volley@gmail.com', 'CLB Bóng chuyền sinh viên'),
('KH00000007', 'Hoàng Nam Khánh', '0912000007', 'khanhhn@outlook.com', 'Khách đặt qua web'),
('KH00000008', 'Nguyễn Văn Hoàng', '0912000008', NULL, 'Khách đặt trực tiếp tại quầy'),
('KH00000009', 'Lê Bảo Long', '0912000009', 'baolong.le@gmail.com', 'FC Bảo Long Quận 7'),
('KH00000010', 'Trương Huy Khánh', '0912000010', 'huykhanh.arch@gmail.com', 'Khách chơi thường xuyên'),
('KH00000011', 'Phan Thanh Tùng', '0912000011', NULL, 'Khách vãng lai gọi điện đặt'),
('KH00000012', 'Đỗ Hải Đăng', '0912000012', 'haidang.do@gmail.com', 'Khách chơi bóng chuyền'),
('KH00000013', 'Bùi Đức Anh', '0912000013', NULL, 'Khách vãng lai'),
('KH00000014', 'Dương Quốc Cường', '0912000014', 'cuongdq@viettel.com.vn', 'Khách đoàn thể Viettel'),
('KH00000015', 'Ngô Kiến Huy', '0912000015', 'kienhuy.ngo@gmail.com', 'Khách đặt qua website')
ON CONFLICT (ma_khach_hang) DO NOTHING;

-- 4.3. BẢNG BỘ MÔN (3 bộ môn theo chuẩn đơn giá)
INSERT INTO bo_mon (ma_bo_mon, ten_bo_mon, don_gia_gio, mo_ta) VALUES
('BM00000001', 'Cầu lông', 120000, 'Mặt sân thảm tiêu chuẩn BWF, chơi đơn hoặc đôi'),
('BM00000002', 'Bóng chuyền', 150000, 'Mặt sân thảm vinyl chuyên dụng kèm trụ lưới căng tiêu chuẩn'),
('BM00000003', 'Bóng đá mini', 200000, 'Sân cỏ nhân tạo chất lượng cao 5 người kèm cặp khung thành mini')
ON CONFLICT (ma_bo_mon) DO UPDATE SET don_gia_gio = EXCLUDED.don_gia_gio;

-- 4.4. BẢNG SÂN (14 sân chuẩn hóa cơ cấu)
INSERT INTO san (ma_san, ten_san, ma_bo_mon, trang_thai, vi_tri) VALUES
-- 5 Sân Cầu lông
('SAN00000001', 'Sân CL-01', 'BM00000001', 'san_sang', 'Khu A - Trong nhà'),
('SAN00000002', 'Sân CL-02', 'BM00000001', 'san_sang', 'Khu A - Trong nhà'),
('SAN00000003', 'Sân CL-03', 'BM00000001', 'san_sang', 'Khu A - Trong nhà'),
('SAN00000004', 'Sân CL-04', 'BM00000001', 'san_sang', 'Khu A - Trong nhà'),
('SAN00000005', 'Sân CL-05', 'BM00000001', 'san_sang', 'Khu A - Trong nhà'),
-- 5 Sân Bóng chuyền
('SAN00000006', 'Sân BC-01', 'BM00000002', 'san_sang', 'Khu B - Trong nhà'),
('SAN00000007', 'Sân BC-02', 'BM00000002', 'san_sang', 'Khu B - Trong nhà'),
('SAN00000008', 'Sân BC-03', 'BM00000002', 'san_sang', 'Khu B - Trong nhà'),
('SAN00000009', 'Sân BC-04', 'BM00000002', 'san_sang', 'Khu B - Trong nhà'),
('SAN00000010', 'Sân BC-05', 'BM00000002', 'san_sang', 'Khu B - Trong nhà'),
-- 4 Sân Bóng đá mini
('SAN00000011', 'Sân BD-01', 'BM00000003', 'san_sang', 'Khu C - Cỏ nhân tạo'),
('SAN00000012', 'Sân BD-02', 'BM00000003', 'san_sang', 'Khu C - Cỏ nhân tạo'),
('SAN00000013', 'Sân BD-03', 'BM00000003', 'san_sang', 'Khu C - Cỏ nhân tạo'),
('SAN00000014', 'Sân BD-04', 'BM00000003', 'san_sang', 'Khu C - Cỏ nhân tạo')
ON CONFLICT (ma_san) DO NOTHING;

-- 4.5. BẢNG THIẾT BỊ GẮN THEO SÂN (20 thiết bị cá thể)
INSERT INTO thiet_bi (ma_thiet_bi, ten_thiet_bi, ma_san, so_seri, trang_thai, nha_cung_cap, sdt_ncc, ngay_mua, han_bao_hanh) VALUES
('TB00000001', 'Bộ trụ lưới cầu lông Sân 1', 'SAN00000001', 'SN00000001', 'san_sang', 'Cty Thể Thao VinaSport', '02838999999', '2026-01-10', '2028-01-10'),
('TB00000002', 'Thảm thi đấu Vinyl Sân 1', 'SAN00000001', 'SN00000002', 'san_sang', 'Tập đoàn Enlio Floor', '02437888888', '2026-01-10', '2029-01-10'),
('TB00000003', 'Bộ trụ lưới cầu lông Sân 2', 'SAN00000002', 'SN00000003', 'san_sang', 'Cty Thể Thao VinaSport', '02838999999', '2026-01-10', '2028-01-10'),
('TB00000004', 'Thảm thi đấu Vinyl Sân 2', 'SAN00000002', 'SN00000004', 'san_sang', 'Tập đoàn Enlio Floor', '02437888888', '2026-01-10', '2029-01-10'),
('TB00000005', 'Bộ trụ lưới cầu lông Sân 3', 'SAN00000003', 'SN00000005', 'san_sang', 'Cty Thể Thao VinaSport', '02838999999', '2026-01-10', '2028-01-10'),
('TB00000006', 'Trụ bóng chuyền thi đấu Sân 1', 'SAN00000006', 'SN00000006', 'san_sang', 'Cty Sodex Sport VN', '02543888777', '2026-01-15', '2028-01-15'),
('TB00000007', 'Lưới bóng chuyền cáp thép Sân 1', 'SAN00000006', 'SN00000007', 'san_sang', 'Cty Sodex Sport VN', '02543888777', '2026-01-15', '2027-01-15'),
('TB00000008', 'Cặp cọc ăng-ten giới hạn Sân 1', 'SAN00000006', 'SN00000008', 'san_sang', 'Cty Sodex Sport VN', '02543888777', '2026-01-15', '2027-01-15'),
('TB00000009', 'Trụ bóng chuyền thi đấu Sân 2', 'SAN00000007', 'SN00000009', 'san_sang', 'Cty Sodex Sport VN', '02543888777', '2026-01-15', '2028-01-15'),
('TB00000010', 'Lưới bóng chuyền cáp thép Sân 2', 'SAN00000007', 'SN00000010', 'san_sang', 'Cty Sodex Sport VN', '02543888777', '2026-01-15', '2027-01-15'),
('TB00000011', 'Khung thành mini di động Sân 1', 'SAN00000011', 'SN00000011', 'san_sang', 'Cơ khí Hoàng Phát', '0918112233', '2026-01-20', '2028-01-20'),
('TB00000012', 'Lưới khung thành mini Sân 1', 'SAN00000011', 'SN00000012', 'san_sang', 'Cơ khí Hoàng Phát', '0918112233', '2026-01-20', '2027-01-20'),
('TB00000013', 'Khung thành mini di động Sân 2', 'SAN00000012', 'SN00000013', 'san_sang', 'Cơ khí Hoàng Phát', '0918112233', '2026-01-20', '2028-01-20'),
('TB00000014', 'Cỏ nhân tạo sợi kim cương Sân 1', 'SAN00000011', 'SN00000014', 'san_sang', 'Cty Cỏ Nhân Tạo Đại Thịnh', '0968999888', '2026-01-20', '2029-01-20'),
('TB00000015', 'Dàn đèn LED cao áp trần Khu A', NULL, 'SN00000015', 'san_sang', 'Rạng Đông Lighting', '19002098', '2026-01-05', '2028-01-05'),
('TB00000016', 'Dàn đèn LED cao áp trần Khu B', NULL, 'SN00000016', 'san_sang', 'Rạng Đông Lighting', '19002098', '2026-01-05', '2028-01-05'),
('TB00000017', 'Bảng điểm điện tử LED để bàn số 1', NULL, 'SN00000017', 'san_sang', 'Điện tử Bách Khoa', '02838666555', '2026-01-05', '2027-01-05'),
('TB00000018', 'Bảng điểm điện tử LED để bàn số 2', NULL, 'SN00000018', 'san_sang', 'Điện tử Bách Khoa', '02838666555', '2026-01-05', '2027-01-05'),
('TB00000019', 'Ghế trọng tài bóng chuyền inox', 'SAN00000006', 'SN00000019', 'san_sang', 'Cty Thể Thao VinaSport', '02838999999', '2026-01-15', '2028-01-15'),
('TB00000020', 'Máy đánh bóng & hút ẩm thảm sàn', NULL, 'SN00000020', 'san_sang', 'Karcher Việt Nam', '19005715', '2026-01-05', '2027-01-05')
ON CONFLICT (ma_thiet_bi) DO NOTHING;

-- 4.6. BẢNG GIÁ ĐỀN BÙ NIÊM YẾT (25 mục niêm yết chuẩn xác)
INSERT INTO bang_gia_den_bu (ma_danh_muc_den_bu, ten_vat_tu, ma_bo_mon, don_gia_den_bu, don_vi_tinh, mo_ta_hu_hai) VALUES
('DB00000001', 'Lưới cầu lông thi đấu', 'BM00000001', 150000, 'tấm', 'Rách mắt lưới, đứt dây căng viền'),
('DB00000002', 'Cột trụ căng lưới cầu lông', 'BM00000001', 450000, 'chiếc', 'Móp méo, cong gãy thân trụ thép'),
('DB00000003', 'Quả cầu lông thi đấu', 'BM00000001', 30000, 'quả', 'Dẫm nát, gãy gập khung lông vũ'),
('DB00000004', 'Dây căng lưới cầu lông', 'BM00000001', 50000, 'cuộn', 'Đứt dây cáp căng viền trên'),
('DB00000005', 'Bọc đệm bảo vệ chân trụ CL', 'BM00000001', 80000, 'cặp', 'Rách vỏ bọc đệm mút chống va đập'),
('DB00000006', 'Lưới bóng chuyền tiêu chuẩn', 'BM00000002', 250000, 'tấm', 'Đứt cáp thép bọc nhựa, rách lưới'),
('DB00000007', 'Cọc ăng-ten giới hạn biên', 'BM00000002', 100000, 'cặp', 'Gãy que sợi thủy tinh chỉ giới'),
('DB00000008', 'Trụ bóng chuyền di động', 'BM00000002', 600000, 'trụ', 'Hỏng tăng đơ căng cáp hoặc méo trụ'),
('DB00000009', 'Quả bóng chuyền thi đấu', 'BM00000002', 200000, 'quả', 'Rách da bóng, xì van do vật sắc nhọn'),
('DB00000010', 'Bọc đệm trụ bóng chuyền', 'BM00000002', 150000, 'bộ', 'Rách đệm mút bọc thân cột'),
('DB00000011', 'Lưới khung thành mini', 'BM00000003', 300000, 'bộ', 'Rách lưới do tác động sai quy cách'),
('DB00000012', 'Khung thành mini di động', 'BM00000003', 800000, 'khung', 'Cong gãy thanh xà ngang hoặc gãy chốt'),
('DB00000013', 'Quả bóng đá thi đấu số 4', 'BM00000003', 250000, 'quả', 'Bục chỉ, nứt da bóng do đá vào vật nhọn'),
('DB00000014', 'Cột cờ góc sân bóng đá', 'BM00000003', 70000, 'cột', 'Gãy cán cờ góc, rách lá cờ'),
('DB00000015', 'Lưới chắn bóng bao quanh sân', 'BM00000003', 350000, 'cuộn', 'Rách mảng lưới chắn bóng tầng cao'),
('DB00000016', 'Bảng điểm lật số để bàn', NULL, 120000, 'chiếc', 'Rách thẻ số, gãy khớp lật'),
('DB00000017', 'Ghế ngồi trọng tài / ghế nghỉ', NULL, 200000, 'chiếc', 'Gãy chân ghế, biến dạng khung'),
('DB00000018', 'Bóng đèn LED chiếu sáng trần', NULL, 500000, 'bóng', 'Vỡ chao đèn, hỏng mắt chip LED'),
('DB00000019', 'Mặt thảm vinyl sàn thi đấu', NULL, 600000, 'm2', 'Thủng rách thảm, trầy xước sâu, tàn thuốc lá'),
('DB00000020', 'Quạt công nghiệp treo tường', NULL, 450000, 'chiếc', 'Gãy cánh quạt, móp lồng bảo hiểm'),
('DB00000021', 'Bình xịt lạnh giảm đau chấn thương', NULL, 120000, 'bình', 'Làm mất hoặc hỏng van xịt y tế'),
('DB00000022', 'Khóa tủ locker cá nhân', NULL, 50000, 'ổ', 'Làm mất chìa khóa hoặc kẹt gãy ruột khóa'),
('DB00000023', 'Bảng mica chiến thuật kèm nam châm', NULL, 150000, 'bộ', 'Nứt vỡ bảng, mất quân cờ chiến thuật'),
('DB00000024', 'Thùng rác nắp lật phân loại', NULL, 90000, 'chiếc', 'Vỡ nắp thùng hoặc bể đáy'),
('DB00000025', 'Bình cứu hỏa bột chữa cháy', NULL, 280000, 'bình', 'Xịt nghịch phá hoặc làm móp bình áp lực')
ON CONFLICT (ma_danh_muc_den_bu) DO NOTHING;

-- 4.7. BẢNG ĐẶT SÂN (30 ca đặt sân thực tế các khung giờ)
INSERT INTO dat_san (ma_dat_san, ma_san, ma_khach_hang, ma_nhan_vien, ngay_dat, gio_bat_dau, gio_ket_thuc, kenh_dat, don_gia_gio, tong_tien_san, trang_thai, thoi_gian_checkin, thoi_gian_checkout, thoi_gian_huy, ly_do_huy) VALUES
-- Nhóm 1: Ca đã hoàn tất (HOAN_TAT)
('DS00000001', 'SAN00000001', 'KH00000001', 'NV00000002', '2026-10-25', '06:00', '07:00', 'ONLINE', 120000, 120000, 'HOAN_TAT', '2026-10-25 05:55:00+07', '2026-10-25 07:05:00+07', NULL, NULL),
('DS00000002', 'SAN00000001', 'KH00000002', 'NV00000002', '2026-10-25', '07:00', '09:00', 'TAI_QUAY', 120000, 240000, 'HOAN_TAT', '2026-10-25 06:58:00+07', '2026-10-25 09:08:00+07', NULL, NULL),
('DS00000003', 'SAN00000006', 'KH00000006', 'NV00000003', '2026-10-25', '08:00', '10:00', 'ONLINE', 150000, 300000, 'HOAN_TAT', '2026-10-25 07:50:00+07', '2026-10-25 10:05:00+07', NULL, NULL),
('DS00000004', 'SAN00000011', 'KH00000004', 'NV00000002', '2026-10-25', '17:00', '19:00', 'ONLINE', 200000, 400000, 'HOAN_TAT', '2026-10-25 16:55:00+07', '2026-10-25 19:10:00+07', NULL, NULL),
('DS00000005', 'SAN00000012', 'KH00000009', 'NV00000003', '2026-10-25', '19:00', '21:00', 'TAI_QUAY', 200000, 400000, 'HOAN_TAT', '2026-10-25 18:50:00+07', '2026-10-25 21:02:00+07', NULL, NULL),
-- Nhóm 2: Đang sử dụng & Đã thanh toán (DANG_SU_DUNG & DA_THANH_TOAN)
('DS00000006', 'SAN00000002', 'KH00000003', 'NV00000002', '2026-11-03', '06:00', '08:00', 'ONLINE', 120000, 240000, 'DA_THANH_TOAN', NULL, NULL, NULL, NULL),
('DS00000007', 'SAN00000003', 'KH00000007', 'NV00000002', '2026-11-03', '17:00', '19:00', 'ONLINE', 120000, 240000, 'DA_THANH_TOAN', NULL, NULL, NULL, NULL),
('DS00000008', 'SAN00000007', 'KH00000012', 'NV00000003', '2026-11-03', '18:00', '20:00', 'TAI_QUAY', 150000, 300000, 'DA_THANH_TOAN', NULL, NULL, NULL, NULL),
('DS00000009', 'SAN00000011', 'KH00000004', 'NV00000002', '2026-11-03', '19:00', '21:00', 'ONLINE', 200000, 400000, 'DA_THANH_TOAN', NULL, NULL, NULL, NULL),
('DS00000010', 'SAN00000004', 'KH00000010', 'NV00000005', '2026-11-03', '08:00', '10:00', 'TAI_QUAY', 120000, 240000, 'DANG_SU_DUNG', '2026-11-03 07:55:00+07', NULL, NULL, NULL),
-- Nhóm 3: 20 Ca đã hủy (DA_HUY) để làm dữ liệu hoàn tiền (HT00000001 -> HT00000020)
('DS00000011', 'SAN00000001', 'KH00000001', 'NV00000002', '2026-10-20', '06:00', '07:00', 'ONLINE', 120000, 120000, 'DA_HUY', NULL, NULL, '2026-10-18 10:00:00+07', 'Bận lịch công tác đột xuất'),
('DS00000012', 'SAN00000002', 'KH00000003', 'NV00000002', '2026-10-20', '07:00', '08:00', 'ONLINE', 120000, 120000, 'DA_HUY', NULL, NULL, '2026-10-18 14:00:00+07', 'Thời tiết mưa bão'),
('DS00000013', 'SAN00000006', 'KH00000006', 'NV00000003', '2026-10-20', '08:00', '10:00', 'ONLINE', 150000, 300000, 'DA_HUY', NULL, NULL, '2026-10-18 16:30:00+07', 'Đội bạn báo hoãn thi đấu'),
('DS00000014', 'SAN00000011', 'KH00000004', 'NV00000002', '2026-10-21', '17:00', '19:00', 'ONLINE', 200000, 400000, 'DA_HUY', NULL, NULL, '2026-10-19 09:00:00+07', 'Sân bị sự cố chập điện đèn cao áp (Sân hủy)'),
('DS00000015', 'SAN00000013', 'KH00000009', 'NV00000003', '2026-10-21', '19:00', '21:00', 'ONLINE', 200000, 400000, 'DA_HUY', NULL, NULL, '2026-10-19 11:00:00+07', 'Khách đổi kế hoạch tập huấn'),
('DS00000016', 'SAN00000003', 'KH00000007', 'NV00000002', '2026-10-22', '06:00', '08:00', 'ONLINE', 120000, 240000, 'DA_HUY', NULL, NULL, '2026-10-20 15:00:00+07', 'Thành viên trong đội bị ốm'),
('DS00000017', 'SAN00000004', 'KH00000010', 'NV00000002', '2026-10-22', '08:00', '10:00', 'ONLINE', 120000, 240000, 'DA_HUY', NULL, NULL, '2026-10-20 18:00:00+07', 'Hủy vé trước 48h'),
('DS00000018', 'SAN00000007', 'KH00000012', 'NV00000003', '2026-10-22', '16:00', '18:00', 'ONLINE', 150000, 300000, 'DA_HUY', NULL, NULL, '2026-10-21 08:30:00+07', 'Trùng lịch thi học kỳ'),
('DS00000019', 'SAN00000012', 'KH00000014', 'NV00000002', '2026-10-22', '18:00', '20:00', 'ONLINE', 200000, 400000, 'DA_HUY', NULL, NULL, '2026-10-21 10:00:00+07', 'Sân bảo trì mặt cỏ đột xuất (Sân hủy)'),
('DS00000020', 'SAN00000005', 'KH00000015', 'NV00000005', '2026-10-23', '06:00', '07:00', 'ONLINE', 120000, 120000, 'DA_HUY', NULL, NULL, '2026-10-21 15:00:00+07', 'Bận việc gia đình'),
('DS00000021', 'SAN00000001', 'KH00000002', 'NV00000002', '2026-10-23', '07:00', '09:00', 'ONLINE', 120000, 240000, 'DA_HUY', NULL, NULL, '2026-10-21 19:00:00+07', 'Chuyển sang tuần sau'),
('DS00000022', 'SAN00000008', 'KH00000006', 'NV00000003', '2026-10-23', '09:00', '11:00', 'ONLINE', 150000, 300000, 'DA_HUY', NULL, NULL, '2026-10-22 07:00:00+07', 'CLB đổi địa điểm thi đấu'),
('DS00000023', 'SAN00000014', 'KH00000004', 'NV00000002', '2026-10-23', '17:00', '19:00', 'ONLINE', 200000, 400000, 'DA_HUY', NULL, NULL, '2026-10-22 09:30:00+07', 'Khách bận họp công ty'),
('DS00000024', 'SAN00000002', 'KH00000007', 'NV00000002', '2026-10-24', '06:00', '08:00', 'ONLINE', 120000, 240000, 'DA_HUY', NULL, NULL, '2026-10-22 14:00:00+07', 'Không gom đủ người'),
('DS00000025', 'SAN00000009', 'KH00000012', 'NV00000003', '2026-10-24', '08:00', '10:00', 'ONLINE', 150000, 300000, 'DA_HUY', NULL, NULL, '2026-10-22 16:00:00+07', 'Sân bị dột mái che (Sân hủy)'),
('DS00000026', 'SAN00000011', 'KH00000009', 'NV00000002', '2026-10-24', '16:00', '18:00', 'ONLINE', 200000, 400000, 'DA_HUY', NULL, NULL, '2026-10-22 20:00:00+07', 'Khách hủy trước hạn 24h'),
('DS00000027', 'SAN00000003', 'KH00000010', 'NV00000002', '2026-10-24', '18:00', '20:00', 'ONLINE', 120000, 240000, 'DA_HUY', NULL, NULL, '2026-10-23 08:00:00+07', 'Lý do cá nhân'),
('DS00000028', 'SAN00000010', 'KH00000006', 'NV00000003', '2026-10-25', '06:00', '08:00', 'ONLINE', 150000, 300000, 'DA_HUY', NULL, NULL, '2026-10-23 12:00:00+07', 'Thời tiết không thuận lợi'),
('DS00000029', 'SAN00000012', 'KH00000014', 'NV00000002', '2026-10-25', '08:00', '10:00', 'ONLINE', 200000, 400000, 'DA_HUY', NULL, NULL, '2026-10-23 15:30:00+07', 'Công ty dời lịch giao hữu'),
('DS00000030', 'SAN00000005', 'KH00000015', 'NV00000005', '2026-10-25', '16:00', '18:00', 'ONLINE', 120000, 240000, 'DA_HUY', NULL, NULL, '2026-10-23 18:00:00+07', 'Thay đổi kế hoạch cuối tuần')
ON CONFLICT (ma_dat_san) DO NOTHING;

-- 4.8. BẢNG THANH TOÁN (35 giao dịch thu tiền: 30 tiền sân + 5 tiền đền bù bồi thường lúc checkout)
INSERT INTO thanh_toan (ma_thanh_toan, ma_dat_san, so_tien, phuong_thuc_thanh_toan, loai_giao_dich, ma_giao_dich_ngan_hang, thoi_gian_thanh_toan, trang_thai, ghi_chu) VALUES
('TT00000001', 'DS00000001', 120000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202610250001', '2026-10-24 15:20:00+07', 'THANH_CONG', 'Khách thanh toán 100% qua VietQR'),
('TT00000002', 'DS00000002', 240000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202610250002', '2026-10-25 06:45:00+07', 'THANH_CONG', 'Thanh toán tại quầy qua VietQR'),
('TT00000003', 'DS00000003', 300000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202610250003', '2026-10-24 18:10:00+07', 'THANH_CONG', 'Khách chuyển khoản VietQR online'),
('TT00000004', 'DS00000004', 400000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202610250004', '2026-10-24 20:05:00+07', 'THANH_CONG', 'Khách thanh toán 100% VietQR'),
('TT00000005', 'DS00000005', 400000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202610250005', '2026-10-25 18:40:00+07', 'THANH_CONG', 'Thanh toán tại quầy VietQR'),
('TT00000006', 'DS00000006', 240000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202611020006', '2026-11-02 10:15:00+07', 'THANH_CONG', 'Thanh toán VietQR'),
('TT00000007', 'DS00000007', 240000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202611020007', '2026-11-02 11:20:00+07', 'THANH_CONG', 'Thanh toán VietQR'),
('TT00000008', 'DS00000008', 300000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202611020008', '2026-11-02 14:05:00+07', 'THANH_CONG', 'Thanh toán VietQR'),
('TT00000009', 'DS00000009', 400000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202611020009', '2026-11-02 16:30:00+07', 'THANH_CONG', 'Thanh toán VietQR'),
('TT00000010', 'DS00000010', 240000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202611030010', '2026-11-03 07:45:00+07', 'THANH_CONG', 'Thanh toán VietQR'),
-- Thanh toán các đơn sẽ bị hủy (DS00000011 -> DS00000030)
('TT00000011', 'DS00000011', 120000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202610170011', '2026-10-17 09:10:00+07', 'THANH_CONG', 'Thanh toán gốc tiền sân'),
('TT00000012', 'DS00000012', 120000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202610170012', '2026-10-17 11:00:00+07', 'THANH_CONG', 'Thanh toán gốc tiền sân'),
('TT00000013', 'DS00000013', 300000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202610170013', '2026-10-17 15:40:00+07', 'THANH_CONG', 'Thanh toán gốc tiền sân'),
('TT00000014', 'DS00000014', 400000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202610180014', '2026-10-18 08:20:00+07', 'THANH_CONG', 'Thanh toán gốc tiền sân'),
('TT00000015', 'DS00000015', 400000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202610180015', '2026-10-18 10:15:00+07', 'THANH_CONG', 'Thanh toán gốc tiền sân'),
('TT00000016', 'DS00000016', 240000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202610190016', '2026-10-19 14:00:00+07', 'THANH_CONG', 'Thanh toán gốc tiền sân'),
('TT00000017', 'DS00000017', 240000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202610190017', '2026-10-19 17:25:00+07', 'THANH_CONG', 'Thanh toán gốc tiền sân'),
('TT00000018', 'DS00000018', 300000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202610200018', '2026-10-20 07:50:00+07', 'THANH_CONG', 'Thanh toán gốc tiền sân'),
('TT00000019', 'DS00000019', 400000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202610200019', '2026-10-20 09:15:00+07', 'THANH_CONG', 'Thanh toán gốc tiền sân'),
('TT00000020', 'DS00000020', 120000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202610200020', '2026-10-20 14:30:00+07', 'THANH_CONG', 'Thanh toán gốc tiền sân'),
('TT00000021', 'DS00000021', 240000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202610200021', '2026-10-20 18:00:00+07', 'THANH_CONG', 'Thanh toán gốc tiền sân'),
('TT00000022', 'DS00000022', 300000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202610210022', '2026-10-21 06:45:00+07', 'THANH_CONG', 'Thanh toán gốc tiền sân'),
('TT00000023', 'DS00000023', 400000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202610210023', '2026-10-21 08:50:00+07', 'THANH_CONG', 'Thanh toán gốc tiền sân'),
('TT00000024', 'DS00000024', 240000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202610210024', '2026-10-21 12:10:00+07', 'THANH_CONG', 'Thanh toán gốc tiền sân'),
('TT00000025', 'DS00000025', 300000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202610210025', '2026-10-21 15:30:00+07', 'THANH_CONG', 'Thanh toán gốc tiền sân'),
('TT00000026', 'DS00000026', 400000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202610210026', '2026-10-21 19:40:00+07', 'THANH_CONG', 'Thanh toán gốc tiền sân'),
('TT00000027', 'DS00000027', 240000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202610220027', '2026-10-22 07:15:00+07', 'THANH_CONG', 'Thanh toán gốc tiền sân'),
('TT00000028', 'DS00000028', 300000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202610220028', '2026-10-22 10:20:00+07', 'THANH_CONG', 'Thanh toán gốc tiền sân'),
('TT00000029', 'DS00000029', 400000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202610220029', '2026-10-22 14:10:00+07', 'THANH_CONG', 'Thanh toán gốc tiền sân'),
('TT00000030', 'DS00000030', 240000, 'VIETQR', 'THANH_TOAN_DAT_SAN', 'VQR202610220030', '2026-10-22 17:35:00+07', 'THANH_CONG', 'Thanh toán gốc tiền sân'),
-- 5 Giao dịch thu tiền bồi thường hư hại CSVC lúc Checkout (THANH_TOAN_BOI_THUONG)
('TT00000031', 'DS00000002', 150000, 'VIETQR', 'THANH_TOAN_BOI_THUONG', 'VQR20261025BT01', '2026-10-25 09:07:00+07', 'THANH_CONG', 'Thu bồi thường rách lưới cầu lông lúc Checkout'),
('TT00000032', 'DS00000004', 300000, 'VIETQR', 'THANH_TOAN_BOI_THUONG', 'VQR20261025BT02', '2026-10-25 19:08:00+07', 'THANH_CONG', 'Thu bồi thường rách lưới khung thành mini'),
('TT00000033', 'DS00000005', 250000, 'VIETQR', 'THANH_TOAN_BOI_THUONG', 'VQR20261025BT03', '2026-10-25 21:01:00+07', 'THANH_CONG', 'Thu bồi thường bóng thi đấu bị thủng'),
('TT00000034', 'DS00000001', 60000, 'VIETQR', 'THANH_TOAN_BOI_THUONG', 'VQR20261025BT04', '2026-10-25 07:03:00+07', 'THANH_CONG', 'Thu bồi thường 2 quả cầu lông thi đấu bị dẫm nát'),
('TT00000035', 'DS00000003', 100000, 'VIETQR', 'THANH_TOAN_BOI_THUONG', 'VQR20261025BT05', '2026-10-25 10:04:00+07', 'THANH_CONG', 'Thu bồi thường gãy cọc ăng-ten bóng chuyền')
ON CONFLICT (ma_thanh_toan) DO NOTHING;

-- 4.9. BẢNG HOÀN TIỀN (20 giao dịch hoàn tiền tự động 100% cho các đơn hủy hợp lệ)
INSERT INTO hoan_tien (ma_hoan_tien, ma_dat_san, ma_thanh_toan_goc, so_tien_hoan, ly_do_hoan, stk_nhan_tien, ngan_hang, ten_chu_tai_khoan, ma_giao_dich_ngan_hang, thoi_gian_hoan, trang_thai) VALUES
('HT00000001', 'DS00000011', 'TT00000011', 120000, 'Khách hủy trước 24h: Bận công tác', '190345678910', 'Techcombank', 'NGUYEN TUAN HUNG', 'REFUND2026101801', '2026-10-18 10:05:00+07', 'THANH_CONG'),
('HT00000002', 'DS00000012', 'TT00000012', 120000, 'Khách hủy trước 24h: Thời tiết mưa bão', '0071001234567', 'Vietcombank', 'LE NGOC MAI', 'REFUND2026101802', '2026-10-18 14:05:00+07', 'THANH_CONG'),
('HT00000003', 'DS00000013', 'TT00000013', 300000, 'Khách hủy trước 24h: Đội hoãn', '0451000334455', 'Vietcombank', 'VU HONG QUAN', 'REFUND2026101803', '2026-10-18 16:35:00+07', 'THANH_CONG'),
('HT00000004', 'DS00000014', 'TT00000014', 400000, 'Sân chủ động hủy: Chập điện đèn', '1012345678', 'MBBank', 'PHAM MINH TRI', 'REFUND2026101904', '2026-10-19 09:05:00+07', 'THANH_CONG'),
('HT00000005', 'DS00000015', 'TT00000015', 400000, 'Khách hủy trước 24h: Đổi kế hoạch', '9999888877', 'ACB', 'LE BAO LONG', 'REFUND2026101905', '2026-10-19 11:05:00+07', 'THANH_CONG'),
('HT00000006', 'DS00000016', 'TT00000016', 240000, 'Khách hủy trước 24h: Thành viên ốm', '2221000998877', 'BIDV', 'HOANG NAM KHANH', 'REFUND2026102006', '2026-10-20 15:05:00+07', 'THANH_CONG'),
('HT00000007', 'DS00000017', 'TT00000017', 240000, 'Khách hủy trước 48h', '0381000223344', 'Vietcombank', 'TRUONG HUY KHANH', 'REFUND2026102007', '2026-10-20 18:05:00+07', 'THANH_CONG'),
('HT00000008', 'DS00000018', 'TT00000018', 300000, 'Khách hủy trước 24h: Bận thi', '10987654321', 'VPBank', 'DO HAI DANG', 'REFUND2026102108', '2026-10-21 08:35:00+07', 'THANH_CONG'),
('HT00000009', 'DS00000019', 'TT00000019', 400000, 'Sân chủ động hủy: Bảo trì mặt cỏ', '180010005544', 'TPBank', 'DUONG QUOC CUONG', 'REFUND2026102109', '2026-10-21 10:05:00+07', 'THANH_CONG'),
('HT00000010', 'DS00000020', 'TT00000020', 120000, 'Khách hủy trước 24h: Bận việc', '09011223344', 'Sacombank', 'NGO KIEN HUY', 'REFUND2026102110', '2026-10-21 15:05:00+07', 'THANH_CONG'),
('HT00000011', 'DS00000021', 'TT00000021', 240000, 'Khách hủy trước 24h', '0071009876543', 'Vietcombank', 'TRAN QUANG THANG', 'REFUND2026102111', '2026-10-21 19:05:00+07', 'THANH_CONG'),
('HT00000012', 'DS00000022', 'TT00000022', 300000, 'Khách hủy trước 24h: Đổi sân', '0451000334455', 'Vietcombank', 'VU HONG QUAN', 'REFUND2026102212', '2026-10-22 07:05:00+07', 'THANH_CONG'),
('HT00000013', 'DS00000023', 'TT00000023', 400000, 'Khách hủy trước 24h: Bận họp', '1012345678', 'MBBank', 'PHAM MINH TRI', 'REFUND2026102213', '2026-10-22 09:35:00+07', 'THANH_CONG'),
('HT00000014', 'DS00000024', 'TT00000024', 240000, 'Khách hủy trước 24h: Thiếu người', '2221000998877', 'BIDV', 'HOANG NAM KHANH', 'REFUND2026102214', '2026-10-22 14:05:00+07', 'THANH_CONG'),
('HT00000015', 'DS00000025', 'TT00000025', 300000, 'Sân chủ động hủy: Dột mái che', '10987654321', 'VPBank', 'DO HAI DANG', 'REFUND2026102215', '2026-10-22 16:05:00+07', 'THANH_CONG'),
('HT00000016', 'DS00000026', 'TT00000026', 400000, 'Khách hủy trước 24h', '9999888877', 'ACB', 'LE BAO LONG', 'REFUND2026102216', '2026-10-22 20:05:00+07', 'THANH_CONG'),
('HT00000017', 'DS00000027', 'TT00000027', 240000, 'Khách hủy trước 24h: Việc cá nhân', '0381000223344', 'Vietcombank', 'TRUONG HUY KHANH', 'REFUND2026102317', '2026-10-23 08:05:00+07', 'THANH_CONG'),
('HT00000018', 'DS00000028', 'TT00000028', 300000, 'Khách hủy trước 24h: Mưa to', '0451000334455', 'Vietcombank', 'VU HONG QUAN', 'REFUND2026102318', '2026-10-23 12:05:00+07', 'THANH_CONG'),
('HT00000019', 'DS00000029', 'TT00000029', 400000, 'Khách hủy trước 24h: Dời lịch', '180010005544', 'TPBank', 'DUONG QUOC CUONG', 'REFUND2026102319', '2026-10-23 15:35:00+07', 'THANH_CONG'),
('HT00000020', 'DS00000030', 'TT00000030', 240000, 'Khách hủy trước 24h: Đổi kế hoạch', '09011223344', 'Sacombank', 'NGO KIEN HUY', 'REFUND2026102320', '2026-10-23 18:05:00+07', 'THANH_CONG')
ON CONFLICT (ma_hoan_tien) DO NOTHING;

-- 4.10. BẢNG BÁO CÁO SỰ CỐ (25 biên bản: Phân loại Do khách làm hỏng vs Bảo hành sân)
INSERT INTO bao_cao_su_co (ma_su_co, ma_dat_san, ma_nhan_vien, nguyen_nhan, tong_tien_den_bu, trang_thai_xu_ly, ngay_tao) VALUES
('SC00000001', 'DS00000002', 'NV00000002', 'DO_KHACH_LAM_HONG', 150000, 'DA_XU_LY', '2026-10-25 08:50:00+07'),
('SC00000002', 'DS00000004', 'NV00000002', 'DO_KHACH_LAM_HONG', 300000, 'DA_XU_LY', '2026-10-25 18:55:00+07'),
('SC00000003', 'DS00000005', 'NV00000003', 'DO_KHACH_LAM_HONG', 250000, 'DA_XU_LY', '2026-10-25 20:45:00+07'),
('SC00000004', 'DS00000001', 'NV00000002', 'DO_KHACH_LAM_HONG', 60000, 'DA_XU_LY', '2026-10-25 06:55:00+07'),
('SC00000005', 'DS00000003', 'NV00000003', 'DO_KHACH_LAM_HONG', 100000, 'DA_XU_LY', '2026-10-25 09:50:00+07'),
-- Sự cố do bảo hành sân (Khách 0 đồng)
('SC00000006', NULL, 'NV00000004', 'BAO_HANH_SAN_VAN_DONG', 0, 'DA_XU_LY', '2026-10-26 08:00:00+07'),
('SC00000007', NULL, 'NV00000004', 'BAO_HANH_SAN_VAN_DONG', 0, 'DA_XU_LY', '2026-10-26 10:30:00+07'),
('SC00000008', NULL, 'NV00000004', 'BAO_HANH_SAN_VAN_DONG', 0, 'DA_XU_LY', '2026-10-27 09:15:00+07'),
('SC00000009', NULL, 'NV00000004', 'BAO_HANH_SAN_VAN_DONG', 0, 'DA_XU_LY', '2026-10-27 14:00:00+07'),
('SC00000010', NULL, 'NV00000004', 'BAO_HANH_SAN_VAN_DONG', 0, 'DA_XU_LY', '2026-10-28 07:30:00+07'),
('SC00000011', NULL, 'NV00000004', 'BAO_HANH_SAN_VAN_DONG', 0, 'DA_XU_LY', '2026-10-28 11:20:00+07'),
('SC00000012', NULL, 'NV00000004', 'BAO_HANH_SAN_VAN_DONG', 0, 'DA_XU_LY', '2026-10-29 08:45:00+07'),
('SC00000013', NULL, 'NV00000004', 'BAO_HANH_SAN_VAN_DONG', 0, 'DA_XU_LY', '2026-10-29 15:10:00+07'),
('SC00000014', NULL, 'NV00000004', 'BAO_HANH_SAN_VAN_DONG', 0, 'DA_XU_LY', '2026-10-30 09:00:00+07'),
('SC00000015', NULL, 'NV00000004', 'BAO_HANH_SAN_VAN_DONG', 0, 'DA_XU_LY', '2026-10-30 16:30:00+07'),
('SC00000016', NULL, 'NV00000004', 'BAO_HANH_SAN_VAN_DONG', 0, 'DA_XU_LY', '2026-10-31 08:20:00+07'),
('SC00000017', NULL, 'NV00000004', 'BAO_HANH_SAN_VAN_DONG', 0, 'DA_XU_LY', '2026-10-31 14:40:00+07'),
('SC00000018', NULL, 'NV00000004', 'BAO_HANH_SAN_VAN_DONG', 0, 'DA_XU_LY', '2026-11-01 07:50:00+07'),
('SC00000019', NULL, 'NV00000004', 'BAO_HANH_SAN_VAN_DONG', 0, 'DA_XU_LY', '2026-11-01 13:15:00+07'),
('SC00000020', NULL, 'NV00000004', 'BAO_HANH_SAN_VAN_DONG', 0, 'DA_XU_LY', '2026-11-02 09:30:00+07'),
-- Sự cố chờ xử lý (CHO_BOI_THUONG hoặc đang sửa chữa)
('SC00000021', 'DS00000010', 'NV00000005', 'DO_KHACH_LAM_HONG', 450000, 'CHO_BOI_THUONG', '2026-11-03 08:30:00+07'),
('SC00000022', NULL, 'NV00000004', 'BAO_HANH_SAN_VAN_DONG', 0, 'CHO_BOI_THUONG', '2026-11-03 09:00:00+07'),
('SC00000023', NULL, 'NV00000004', 'BAO_HANH_SAN_VAN_DONG', 0, 'CHO_BOI_THUONG', '2026-11-03 10:15:00+07'),
('SC00000024', NULL, 'NV00000004', 'BAO_HANH_SAN_VAN_DONG', 0, 'CHO_BOI_THUONG', '2026-11-03 11:45:00+07'),
('SC00000025', NULL, 'NV00000004', 'BAO_HANH_SAN_VAN_DONG', 0, 'CHO_BOI_THUONG', '2026-11-03 14:20:00+07')
ON CONFLICT (ma_su_co) DO NOTHING;

-- 4.11. BẢNG CHI TIẾT SỰ CỐ (28 dòng chi tiết hư hỏng có lưu vết đơn giá áp dụng)
INSERT INTO chi_tiet_su_co (ma_chi_tiet, ma_su_co, ma_thiet_bi, ma_danh_muc_den_bu, don_gia_ap_dung, so_luong_hu_hai, thanh_tien, muc_do_hu_hai, mo_ta_chi_tiet) VALUES
('CT00000001', 'SC00000001', 'TB00000001', 'DB00000001', 150000, 1, 150000, 'TrungBinh', 'Khách đập vợt làm rách mắt lưới thi đấu'),
('CT00000002', 'SC00000002', 'TB00000012', 'DB00000011', 300000, 1, 300000, 'NghiemTrong', 'Sút bóng mạnh làm đứt chùm dây lưới khung thành'),
('CT00000003', 'SC00000003', NULL, 'DB00000013', 250000, 1, 250000, 'Nhe', 'Bóng bay vào cọc sắc nhọn làm rách da'),
('CT00000004', 'SC00000004', NULL, 'DB00000003', 30000, 2, 60000, 'Nhe', 'Khách nhảy dẫm nát 2 quả cầu lông'),
('CT00000005', 'SC00000005', 'TB00000008', 'DB00000007', 100000, 1, 100000, 'TrungBinh', 'Gãy que ăng ten chỉ giới biên bóng chuyền'),
('CT00000006', 'SC00000006', 'TB00000015', 'DB00000018', 500000, 1, 500000, 'TrungBinh', 'Chập mắt chip đèn LED do quá tải điện (NCC bảo hành)'),
('CT00000007', 'SC00000007', 'TB00000006', 'DB00000008', 600000, 1, 600000, 'NghiemTrong', 'Kẹt tăng đơ căng cáp trụ bóng chuyền Sân 1 (Sân bảo trì)'),
('CT00000008', 'SC00000008', 'TB00000002', 'DB00000019', 600000, 1, 600000, 'Nhe', 'Bong mép dán thảm vinyl khu vực biên (Dán lại keo nhiệt)'),
('CT00000009', 'SC00000009', 'TB00000016', 'DB00000018', 500000, 1, 500000, 'Nhe', 'Hỏng bộ nguồn driver đèn LED khu B'),
('CT00000010', 'SC00000010', 'TB00000011', 'DB00000012', 800000, 1, 800000, 'TrungBinh', 'Gãy ốc bản lề khung thành mini di động (Hàn gia cố)'),
('CT00000011', 'SC00000011', 'TB00000017', 'DB00000016', 120000, 1, 120000, 'Nhe', 'Kẹt phím điều khiển bảng điểm số 1'),
('CT00000012', 'SC00000012', 'TB00000004', 'DB00000019', 600000, 1, 600000, 'Nhe', 'Hở keo nối thảm vinyl Sân CL-02'),
('CT00000013', 'SC00000013', 'TB00000009', 'DB00000008', 600000, 1, 600000, 'Nhe', 'Rão dây cáp trụ bóng chuyền Sân 2'),
('CT00000014', 'SC00000014', 'TB00000014', 'DB00000015', 350000, 1, 350000, 'TrungBinh', 'Bục mép lưới chắn bóng ngoài trời Sân BD-01'),
('CT00000015', 'SC00000015', 'TB00000019', 'DB00000017', 200000, 1, 200000, 'Nhe', 'Mòn đệm chân ghế ngồi trọng tài'),
('CT00000016', 'SC00000016', 'TB00000020', 'DB00000020', 450000, 1, 450000, 'TrungBinh', 'Thay chổi quét máy đánh bóng sàn'),
('CT00000017', 'SC00000017', 'TB00000005', 'DB00000002', 450000, 1, 450000, 'Nhe', 'Lỏng bulong cố định chân trụ CL-03'),
('CT00000018', 'SC00000018', 'TB00000015', 'DB00000018', 500000, 1, 500000, 'Nhe', 'Bảo dưỡng định kỳ hộp điện giàn đèn'),
('CT00000019', 'SC00000019', 'TB00000013', 'DB00000012', 800000, 1, 800000, 'Nhe', 'Sơn lại khung sắt chống rỉ khung thành'),
('CT00000020', 'SC00000020', 'TB00000018', 'DB00000016', 120000, 1, 120000, 'Nhe', 'Thay pin sạc bảng điểm điện tử'),
('CT00000021', 'SC00000021', 'TB00000003', 'DB00000002', 450000, 1, 450000, 'NghiemTrong', 'Khách ngã va vào làm cong thân trụ thép Sân CL-02'),
('CT00000022', 'SC00000022', 'TB00000007', 'DB00000006', 250000, 1, 250000, 'Nhe', 'Đứt sợi cáp bọc nhựa viền lưới bóng chuyền'),
('CT00000023', 'SC00000023', 'TB00000010', 'DB00000010', 150000, 1, 150000, 'Nhe', 'Bong gai dán đệm mút bọc trụ'),
('CT00000024', 'SC00000024', NULL, 'DB00000024', 90000, 1, 90000, 'Nhe', 'Bể nắp lật thùng rác khu A'),
('CT00000025', 'SC00000025', NULL, 'DB00000022', 50000, 2, 100000, 'Nhe', 'Kẹt gãy 2 ổ khóa tủ locker phòng thay đồ'),
('CT00000026', 'SC00000002', 'TB00000011', 'DB00000014', 70000, 1, 70000, 'Nhe', 'Gãy cán cờ góc sân bóng đá trong cùng ca'),
('CT00000027', 'SC00000006', NULL, 'DB00000020', 450000, 1, 450000, 'Nhe', 'Quạt trần bị kêu bạc đạn'),
('CT00000028', 'SC00000008', NULL, 'DB00000023', 150000, 1, 150000, 'Nhe', 'Mất 3 quân cờ chiến thuật để bàn')
ON CONFLICT (ma_chi_tiet) DO NOTHING;
