# AI AGENT & ASSISTANT GUIDELINES

## 📌 NGUYÊN TẮC HOẠT ĐỘNG
1. **Ưu tiên yêu cầu người dùng:** Luôn ưu tiên lắng nghe và thực hiện chính xác theo yêu cầu trực tiếp của người dùng (User Request).
2. **Không bắt buộc đọc tài liệu đầu tiên:** AI **KHÔNG** bắt buộc phải đọc `frontend/docs/BusinessRequirements.md` ở mỗi lượt tương tác, tránh làm sai lệch hoặc gò bó theo các thông tin cũ. Chỉ mở ra tham khảo khi người dùng yêu cầu tra cứu ngữ cảnh nghiệp vụ.

## 📖 THÔNG TIN NGHIỆP VỤ THAM KHẢO (KHI CẦN)
👉 **[`frontend/docs/BusinessRequirements.md`](frontend/docs/BusinessRequirements.md)**

### Tóm tắt cấu hình hệ thống:
1. **Bảng giá tham khảo:**
   - Cầu lông: `120.000 VNĐ / giờ / sân`
   - Bóng chuyền: `150.000 VNĐ / giờ / sân`
   - Bóng đá mini: `200.000 VNĐ / giờ / sân`
2. **Cơ cấu danh mục sân:**
   - 5 Sân Cầu lông: `Sân CL-01` đến `Sân CL-05`
   - 5 Sân Bóng chuyền: `Sân BC-01` đến `Sân BC-05`
   - 4 Sân Bóng đá mini: `Sân BD-01` đến `Sân BD-04`
   - Quản trị viên (Admin) có thể Thêm / Sửa / Xóa sân linh hoạt.
3. **Phạm vi nghiệp vụ:**
   - Đặt sân và thanh toán qua VietQR.
   - Bồi thường sự cố trang thiết bị căn cứ danh mục giá niêm yết (nếu có hỏng hóc do khách).
   - Quản lý tài khoản nhân viên (đổi mật khẩu, soft delete / vô hiệu hóa).
