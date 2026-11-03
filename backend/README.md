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

Sau khi chạy SQL, khởi động lại backend và tải lại frontend.
Chạy `npm.cmd run check:db` trong `backend/` để kiểm tra kết nối và phiên bản migration.

## Luồng dữ liệu

- `GET /api/bookings`: lịch đặt, khách hàng và tiền sân đã trả từ database.
- `POST /api/bookings/lookup` với body `{ "query": "mã đặt sân hoặc số điện thoại" }`: tra cứu chính xác dữ liệu trên Supabase, không trả kết quả mẫu khi không tìm thấy hoặc API lỗi.
- `POST /api/bookings/:code/check-in`: kiểm tra thanh toán, khóa sân và trạng thái trước khi nhận sân.
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

```powershell
npm.cmd run build
node --test tests/facility-database.test.mjs
```

Kiểm thử dùng PostgreSQL cục bộ qua PGlite, với dữ liệu thử độc lập; không ghi vào
Supabase thật. Bao gồm kiểm tra migration chạy lại, check-in, hai loại trách nhiệm,
giá lịch sử, rollback khi giá/thanh toán sai, chống thu trùng và thu hồi thiết bị.
