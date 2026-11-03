# CourtX backend

## Cấu hình và chạy

Tạo `backend/.env` (file này được Git bỏ qua):

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-publishable-key
PORT=5000
```

Trong thư mục `backend/`, chạy `npm.cmd install`, sau đó `npm.cmd run dev`.
Frontend dùng proxy `/api` của Vite trỏ đến `http://localhost:5000`.

## Cập nhật database hiện có

Mở Supabase SQL Editor và chạy toàn bộ file
[`migrations/20261103_facility_supabase.sql`](migrations/20261103_facility_supabase.sql).
Migration bổ sung cột và hàm giao dịch cho dữ liệu hiện có; không chạy lại seed,
không xóa bảng, không thay chính sách RLS hiện tại. Có thể chạy lại migration.
Khóa publishable dùng trong ứng dụng không có quyền thực hiện DDL nên bước này
cần được chạy bởi người quản trị dự án Supabase.

Để tạo lượt đặt mới và thanh toán đồng thời, chạy thêm
[`migrations/20261103_booking_payment.sql`](migrations/20261103_booking_payment.sql).
File này cấp mã DS/KH/TT tăng dần trong database, giữ nguyên mã lịch sử,
kiểm tra giá và trùng lịch, bắt buộc mã ngân hàng và xác nhận đối soát.
Nếu lưu thanh toán thất bại, toàn bộ lượt đặt mới được rollback. Gửi lại cùng
mã ngân hàng cho cùng lượt đặt trả về mã đã lưu. Đây là ghi nhận đối soát thủ công,
không phải kết nối xác thực giao dịch trực tiếp với ngân hàng.

Sau khi chạy SQL, khởi động lại backend và tải lại frontend.
Chạy `npm.cmd run check:db` trong `backend/` để kiểm tra kết nối và phiên bản migration.

## Luồng dữ liệu

- `POST /api/employees/login`: kiểm tra tài khoản ADMIN/STAFF đang hoạt động trong `nhan_vien`; nhận mã NV, số điện thoại, email hoặc bí danh `admin` / `staff` / `nhanvien` (bí danh trỏ tài khoản đầu tiên của vai trò).
- `POST /api/employees/:id/password`: xác minh mật khẩu hiện tại trước khi lưu mật khẩu mới dạng scrypt trong Supabase. API không trả mật khẩu/hash về FE.
- Hồ sơ cá nhân trên FE chọn đúng mã tài khoản đăng nhập. Danh sách và chi tiết tài khoản đọc qua API BE từ Supabase, không thay bằng dữ liệu mẫu khi lỗi kết nối. Vai trò `ADMIN` hiển thị Chủ sân, `STAFF` hiển thị Nhân viên.
- Thêm/sửa nhân sự chờ Supabase ghi thành công; mật khẩu mới/đặt lại lưu dạng scrypt. Xóa tài khoản chỉ ngừng hoạt động để giữ lịch sử.

- `GET /api/bookings`: lịch đặt, khách hàng và tiền sân đã trả từ database.
- `POST /api/bookings`: tạo đơn đã đối soát VietQR và bản ghi thanh toán trong cùng giao dịch; trả mã thật và chi tiết đã lưu.
- `POST /api/bookings/lookup` với body `{ "query": "mã đặt sân hoặc số điện thoại" }`: tra cứu chính xác dữ liệu trên Supabase, không trả kết quả mẫu khi không tìm thấy hoặc API lỗi.
- `POST /api/bookings/:code/check-in`: kiểm tra thanh toán, khóa sân và trạng thái trước khi nhận sân.
- Dữ liệu cũ có trạng thái `DA_THANH_TOAN` / `DANG_SU_DUNG` nhưng thiếu hoàn toàn dòng tiền sân được hiểu là đã trả 100% theo trạng thái trong database. Trước check-in/check-out, BE đồng bộ dòng tiền bị thiếu từ chính đơn đó, ghi rõ nguồn trong ghi chú; không phát sinh thu mới hoặc tạo mã ngân hàng giả. Giao dịch thất bại/thanh toán một phần không được tự nâng thành đủ tiền. Check-out lấy số tiền từ database và chỉ thu bồi thường.
- `GET/POST/PUT /api/equipments`: quản lý từng thiết bị theo mã và Seri.
- `PATCH /api/equipments/:code/relocate`: điều phối; thiết bị hỏng không được chuyển thành sẵn sàng.
- `POST /api/equipments/:code/complete-maintenance`: nghiệm thu và lưu nhật ký trong cùng giao dịch.
- `GET/POST /api/incidents`: báo cáo, ảnh và đơn giá bồi thường tại thời điểm lập.
- `PATCH /api/incidents/:id/status`, `POST /api/incidents/:id/timeline`: tiến độ xử lý.
- `GET /api/compensation-prices`: bảng giá từ database.
- `POST /api/checkout-settlements`: một giao dịch database để lưu sự cố, thanh toán bồi thường,
  hoàn tất lượt đặt và thu hồi thiết bị. Bấm lại cùng lượt đặt trả về quyết toán đã lưu.
- `GET /api/checkout-settlements/:reference`: tra cứu quyết toán sau khi tải lại trang.

Các luồng trên không đọc/ghi `backend/data/*.json`. Frontend không báo lưu thành công
khi API bị lỗi và không dùng dữ liệu mẫu thay thế cho lịch sân, thiết bị hay sự cố.
Các chức năng nhân viên và các luồng đặt/hủy/điều chuyển lịch khác được giữ riêng.

## Kiểm thử

Danh mục bồi thường dùng chung lưu tại `thiet_bi`: tên ở `ten_thiet_bi`, bộ môn và giá ở
`thong_tin_bo_sung.sportType` / `thong_tin_bo_sung.compensationPrice`, nhận diện bằng `isCatalogItem`.
`bang_gia_den_bu` giữ mã tương thích cho sự cố và đơn giá lịch sử; tạo mới thiết bị và giá
được lưu cùng giao dịch RPC. Danh mục không phải một thiết bị vật lý dùng chung để đổi trạng thái hỏng trên mọi sân.
Script `scripts/sync-equipment-catalog.mjs` mặc định chỉ rà soát; `--apply` hợp nhất danh mục,
lưu bản sao cục bộ, bảo toàn chi tiết sự cố trước khi xóa thiết bị cũ. Không chạy trên database khác khi chưa rà soát.
`node scripts/verify-equipment-catalog.mjs` kiểm tra database/API và đơn giá lịch sử so với bản sao.

Sau khi đồng bộ danh mục, chạy toàn bộ `migrations/20261103_remove_equipment_court.sql`
trong Supabase SQL Editor bằng role `postgres`. File thay các RPC phụ thuộc và xóa duy nhất
`thiet_bi.ma_san` trong một giao dịch, giữ `dat_san.ma_san` và thông tin sân trên từng sự cố.
Không xóa riêng cột này hoặc chạy lại migration facility cũ sau bước này; các hàm cũ vẫn tham chiếu cột sân thiết bị.

Chạy tiếp `migrations/20261103_equipment_prices_and_codes.sql` bằng role `postgres` để thêm
`thiet_bi.gia_mua`, `thiet_bi.gia_boi_thuong`, chuyển các giá đã biết và chuẩn hóa mã từ `TB00000001`.
Giá mua chưa nhập giữ `NULL`. Migration cập nhật khóa ngoại, mã liên kết trong bảng giá,
báo cáo và quyết toán theo hai bước tránh trùng mã; giữ nguyên bản chụp lịch sử gốc.
Trigger đồng bộ giá từ form hoặc Table Editor với metadata và bảng giá tương thích,
không thay đổi `chi_tiet_su_co.don_gia_ap_dung` của báo cáo cũ.

Chạy `migrations/20261104_incident_processing_status.sql` bằng role `postgres` để tách
tiến độ xử lý khỏi trách nhiệm chi phí. Trạng thái là `CHO_XU_LY`, `DANG_SUA_CHUA`,
`DA_XU_LY`; sân chịu thì tiền thu khách bằng 0 và `compensationPaymentStatus=not_required`.
Chạy toàn bộ file, gồm bước commit bổ sung enum trước khi dùng giá trị mới.

```powershell
npm.cmd run build
node --test tests/facility-database.test.mjs
```

Kiểm thử dùng PostgreSQL cục bộ qua PGlite, với dữ liệu thử độc lập; không ghi vào
Supabase thật. Bao gồm kiểm tra migration chạy lại, check-in, hai loại trách nhiệm,
giá lịch sử, rollback khi giá/thanh toán sai, chống thu trùng và thu hồi thiết bị.
