# Kế hoạch kiểm thử tự động CourtX bằng Pytest

## Cách chạy

Chạy toàn bộ suite và tạo báo cáo trình bày:

```powershell
python scripts/run_pytest_report.py
```

Chạy trực tiếp bằng Pytest:

```powershell
python -m pytest -vv
```

## Cấu trúc suite

| Nhóm | Nội dung |
|---|---|
| Backend | Pytest chạy đủ 11 file/42 test Node hiện hữu theo chế độ tuần tự để tránh thiếu bộ nhớ. |
| Frontend | Pytest chạy đủ 6 script kiểm chứng biên nhận, checkout, sân khả dụng, khóa sân, API CSVC và sự cố. |
| Build | Biên dịch production cho cả backend TypeScript và frontend TypeScript/Vite. |
| Hợp đồng nghiệp vụ | Kiểm tra giá chuẩn, 14 sân, vai trò, OTP, khung giờ, trùng lịch, VietQR, checkout, không phụ thu quá giờ, không VAT, bồi thường, thu hồi thiết bị và soft delete trực tiếp từ source/schema/migration. |
| Tích hợp | Kiểm tra Supabase Realtime Broadcast với hai sự kiện xác nhận/hủy thanh toán. |
| Phạm vi | Kiểm tra VIP tháng, giảm giá và quản lý ca trực; sai lệch đã biết được ghi nhận bằng XFAIL. |

## Ý nghĩa trạng thái

- `PASSED`: chức năng đáp ứng điều kiện kiểm thử.
- `FAILED`/`ERROR`: lỗi ngoài dự kiến, suite trả mã lỗi.
- `XFAIL`: sai lệch đã biết so với phạm vi nghiệp vụ; được công khai trong báo cáo và chưa làm suite dừng.
- `SKIPPED`: trường hợp không chạy do điều kiện môi trường.

Không nên diễn giải bộ test là chứng minh mọi đầu vào có thể có. Suite bao phủ các phân vùng tương đương, giá trị biên và quy tắc nghiệp vụ đã xác định trong tài liệu yêu cầu.
