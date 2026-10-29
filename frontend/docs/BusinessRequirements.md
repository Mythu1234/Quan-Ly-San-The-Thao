<!-- 
================================================================================
CRITICAL DIRECTIVE FOR ALL AI ASSISTANTS & DEVELOPERS:
BẮT BUỘC PHẢI ĐỌC TÀI LIỆU NÀY TRƯỚC KHI BẮT ĐẦU BẤT KỲ TÁC VỤ NÀO!
Tất cả các logic về giá sân (Cầu lông 120k, Bóng chuyền 150k, Bóng đá 200k),
chuyển đổi 8 ô mặt sân linh hoạt, theo dõi thanh toán,
quản lý thiết bị từng chiếc (Asset Serial), phân ca và nhiệm vụ ca trực
PHẢI TUÂN THỦ 100% CÁC QUY TẮC TRONG TÀI LIỆU NÀY. KHÔNG ĐƯỢC TỰ Ý THAY ĐỔI.
================================================================================
-->

> [!IMPORTANT]
> ### ⚠️ CHÚ Ý ĐẶC BIỆT DÀNH CHO AI ASSISTANT & LẬP TRÌNH VIÊN:
> **BẮT BUỘC ĐỌC TÀI LIỆU NÀY TRƯỚC KHI THỰC HIỆN BẤT KỲ TÁC VỤ NÀO!**
> Mọi tác vụ phân tích, thiết kế CSDL (ERD), viết mã backend, frontend hay kiểm thử trong dự án này **bắt buộc phải đọc và tuân thủ tuyệt đối các quy tắc nghiệp vụ (Business Rules) được định nghĩa trong file này**. Tuyệt đối không tự ý giả định sai lệch bảng giá, chuyển đổi mặt sân, thanh toán hay quy trình vận hành.

# CÁC YÊU CẦU NGHIỆP VỤ HỆ THỐNG (BUSINESS REQUIREMENTS)
## DỰ ÁN: HỆ THỐNG QUẢN LÝ VẬN HÀNH VÀ ĐẶT SÂN THỂ THAO ĐA NĂNG (COURTX ARENA)
*(Học phần: Thực hành Phân tích Thiết kế Hệ thống Thông tin - THPTTKHTTT)*

---

Tài liệu này tổng hợp toàn bộ các quy tắc vận hành, chính sách kinh doanh và quy tắc nghiệp vụ (Business Rules) dành cho Hệ thống Quản lý Vận hành Sân thể thao Đa năng chuyển đổi (Cầu lông, Bóng chuyền, Bóng đá). 

Các thông tin này là cơ sở cốt lõi để lập trình logic xử lý, kiểm tra ràng buộc (constraints) và thiết kế cơ sở dữ liệu (ERD).

---

## 1. THÔNG TIN QUY MÔ VÀ ĐẶC THÙ MẶT SÂN (COURT SPECIFICATIONS)

* **Giờ mở cửa hoạt động:** 05:00 sáng đến 23:00 đêm hằng ngày.
* **Quy mô mặt sân vật lý cơ sở:** Tổng diện tích sàn thi đấu được chia thành **8 ô sân cơ sở** (đánh số từ Ô 1 đến Ô 8).
* **Tính linh hoạt chuyển đổi mặt sân (Dynamic Spatial Conversion):**
  * **Cầu lông:** Chiếm đúng **1 ô sân cơ sở** (Ô 1 đến Ô 8).
  * **Bóng chuyền:** Chiếm **4 ô sân cơ sở liên tiếp** bất kỳ đang còn trống (Ví dụ: [1,2,3,4], [2,3,4,5], [3,4,5,6], [4,5,6,7] hoặc [5,6,7,8]). Hệ thống linh hoạt ghép sân, không gán cứng cố định.
  * **Bóng đá mini:** Chiếm toàn bộ **8 ô sân cơ sở** (từ Ô 1 đến Ô 8).
* **Quy tắc khóa va chạm không gian (Spatial Conflict Lock):**
  * Khi một bộ môn được đặt trên một nhóm ô sân, hệ thống tự động khóa (lock) toàn bộ các ô sàn đó đối với các môn thể thao khác trong cùng khung giờ.
  * *Ví dụ:* Nếu Ô 1 đang có khách chơi Cầu lông, hệ thống tự động vô hiệu hóa việc đặt Bóng chuyền ở cụm [1,2,3,4] và khóa đặt Bóng đá (vì bóng đá cần cả 8 ô); tuy nhiên vẫn cho phép đặt Bóng chuyền ở cụm [2,3,4,5] hoặc [5,6,7,8] nếu các ô đó còn trống.

---

## 2. BẢNG GIÁ THUÊ SÂN TIÊU CHUẨN (STANDARD HOURLY RATES)

Đơn giá thuê sân áp dụng tính theo giờ (VNĐ/giờ) cho từng bộ môn như sau:

| Bộ môn | Số ô sân chiếm dụng | Đơn giá thuê tiêu chuẩn | Mô tả sử dụng |
| :--- | :---: | :---: | :--- |
| **Cầu lông** | 1 ô sân | **120.000 VNĐ / giờ** | Chơi đơn/đôi theo ô sân tiêu chuẩn |
| **Bóng chuyền** | 4 ô sân liên tiếp | **150.000 VNĐ / giờ** | Ghép 4 ô sàn liên tiếp, căng lưới bóng chuyền |
| **Bóng đá mini** | 8 ô sân (Toàn sàn) | **200.000 VNĐ / giờ** | Gộp toàn bộ 8 ô sàn, dựng 2 khung thành mini di động |

---

## 3. QUY TẮC CHUYỂN ĐỔI MẶT SÂN LINH HOẠT (FLEXIBLE COURT CONVERSION RULES)

* **Toàn bộ thời gian hoạt động (05:00 - 23:00 hàng ngày):** Cho phép **tự do chuyển đổi mặt sân** và cho thuê linh hoạt cả 3 bộ môn (Cầu lông, Bóng chuyền, Bóng đá) theo nhu cầu thực tế của khách hàng.
* **Không áp đặt khung giờ cố định cho riêng môn nào:** Khách hàng có thể đặt Cầu lông, Bóng chuyền hay Bóng đá ở bất kỳ khung giờ nào trong ngày, miễn là các ô sân cơ sở tương ứng chưa bị ai đặt trước (không bị va chạm không gian).

---

## 4. PHẠM VI KHÁCH HÀNG & YÊU CẦU ĐẶT SÂN

* Sân không kinh doanh gói khách hàng VIP/thành viên theo tháng; không tạo, tiếp nhận hoặc hiển thị yêu cầu đặt sân thuộc nhóm VIP.
* Form tiếp nhận đặt sân tại quầy dùng một luồng đặt sân thông thường, không phân loại khách thành “trải nghiệm” hoặc “sự kiện”. Nhân viên ghi nhận khách, môn/sân, ngày đặt, giờ bắt đầu và thời lượng.
* Yêu cầu sự kiện/chuỗi ngày trên website (nếu có) được xử lý ở luồng riêng, không phải loại đặt sân tại quầy.
* Dữ liệu yêu cầu VIP cũ (nếu có) không hiển thị trong danh sách yêu cầu đặt sân.

---

## 5. QUY ĐỊNH THANH TOÁN, THEO DÕI THANH TOÁN & HÓA ĐƠN ĐIỆN TỬ

1. **Hình thức thanh toán:**
   * Khách đặt sân thông thường thanh toán đủ 100% ngay lúc đặt chỗ qua mã QR VietQR của sân. Không áp dụng đặt cọc, tiền mặt hoặc quẹt thẻ POS.
   * Đặt sân tại quầy cũng phải thanh toán đủ 100%; không nhận đặt cọc hoặc chia đợt.

2. **Theo dõi Số tiền đã trả & Số tiền còn lại:**
   * Tại mọi thời điểm, hệ thống tự động xác định số tiền khách còn phải nộp:
     $$\text{Số tiền còn lại} = \text{Tổng tiền phải trả} - \text{Tổng số tiền đã thanh toán qua các đợt}$$
   * **Trạng thái thanh toán của đơn đặt sân:**
     * `CHUA_THANH_TOAN`: Khách chưa thanh toán đợt nào.
     * `DA_COC_HOAC_MOT_PHAN`: Đơn đặt sân cũ hoặc ngoại lệ đã thanh toán một phần (Số tiền còn lại > 0).
     * `DA_THANH_TOAN_DU`: Khách đã thanh toán đủ 100% (Số tiền còn lại = 0).
   * Khi khách hoàn tất đóng đợt tiền cuối cùng, hệ thống cập nhật số tiền còn lại về 0đ và chuyển trạng thái sang `DA_THANH_TOAN_DU`.
3. **Quy định Hóa đơn điện tử:**
   * Không thiết kế bảng Hóa đơn riêng biệt gây dư thừa. Thông tin xuất hóa đơn điện tử được tích hợp trực tiếp vào mỗi lần thanh toán (`thanh_toan`).
   * Khi khách hàng doanh nghiệp yêu cầu hóa đơn cho đợt thanh toán, nhân viên ghi nhận `so_hoa_don` điện tử (từ hệ thống xuất HĐĐT liên kết) và `ngay_xuat_hoa_don`. Khách lẻ không lấy hóa đơn thì giá trị này để trống (`NULL`).
4. **Vé đặt sân:**
   * Không sử dụng bảng Vé điện tử riêng. Mã đặt sân (`ma_dat_san`) kiêm luôn vai trò của Mã vé điện tử để khách quét QR đối soát và làm thủ tục Check-in/Check-out.

---

## 6. CHÍNH SÁCH HỦY ĐẶT SÂN & HOÀN TIỀN (CANCELLATION & REFUND)

1. **Khách hàng tự hủy trên hệ thống:**
   * **Hủy trước $\ge$ 24 giờ:** Khách hàng được phép tự thao tác bấm "Hủy vé" trực tuyến trên hệ thống. Đơn chuyển sang trạng thái "Đã hủy - Chờ duyệt hoàn tiền", hoàn trả 100% số tiền đã thanh toán. Chủ sân xử lý đối soát và chuyển khoản hoàn tiền trong vòng 24 giờ.
   * **Hủy trong vòng < 24 giờ trước giờ chơi:** Hệ thống khóa chức năng tự hủy trực tuyến. Khách hàng bắt buộc phải liên hệ trực tiếp với Chủ sân để xử lý ngoại lệ thủ công.
2. **Quyền hạn Nhân viên / Chủ sân chủ động hủy sân:**
   * Nhân viên hoặc Chủ sân có toàn quyền **chủ động hủy lịch đặt sân của khách** trong các trường hợp bất khả kháng: Sự cố hỏng hóc khẩn cấp (cháy đèn chiếu sáng, hỏng mặt sân, dột nước, mất điện lưới...) hoặc phục vụ bảo trì đột xuất.
   * Khi nhân viên hủy sân, bắt buộc phải ghi rõ `ly_do_huy` trên hệ thống. Hệ thống tự động giải phóng sân, gửi thông báo xin lỗi đến khách hàng và tạo lệnh hoàn tiền 100% cho khách.

---

## 7. QUY TẮC XỬ LÝ CHƠI LỐ GIỜ (OVERTIME) & CHECKOUT

* **Quy tắc ân hạn (Grace Period):** Khách hàng được phép trễ **tối đa 10 phút** sau khi hết giờ thuê (thời gian này dành cho việc dọn dẹp đồ đạc và nhân viên nhắc nhở).
* **Quy tắc tính Phụ phí thêm giờ (Overtime Surcharge):**
  * Nếu khách chơi quá 10 phút, hệ thống bắt đầu tính phụ phí lố giờ, **tính cộng dồn toàn bộ thời gian trễ** (bao gồm cả 10 phút ân hạn ban đầu).
  * Tiền phụ phí làm tròn theo block 15 phút hoặc 30 phút dựa theo đơn giá theo giờ của bộ môn đang chơi.
* **Tổng kết thu tiền lúc Checkout:**
  $$\text{Tổng tiền thu lúc Checkout} = \text{Khoản thanh toán còn thiếu (nếu có)} + \text{Phụ phí chơi thêm giờ} + \text{Phí bồi thường sự cố (nếu có)}$$

---

## 8. QUẢN LÝ CƠ SỞ VẬT CHẤT & TRANG THIẾT BỊ (ASSET MANAGEMENT)

1. **Quản lý theo từng cá thể tài sản (Asset Tracking):**
   * Tuyệt đối **không ghi số lượng tổng gộp** (Ví dụ: Không ghi "Điều hòa: 2 cái").
   * Mỗi tài sản là một bản ghi độc lập, có **Mã thiết bị** và **Mã Seri / Asset Tag** riêng biệt để phục vụ dán mã QR kiểm kê và theo dõi bảo hành.
2. **Theo dõi Bảo hành & Bảo dưỡng:**
   * Mỗi thiết bị lưu trữ đầy đủ: Ngày đưa vào sử dụng, Thời hạn bảo hành, Ngày bảo trì gần nhất.
3. **Trạng thái thiết bị:**
   * `san_sang`: Thiết bị lưu kho trong tình trạng hoàn hảo, sẵn sàng mang ra sử dụng.
   * `dang_su_dung`: Thiết bị đang được lắp đặt hoặc phục vụ khách trên sân.
   * `bao_tri`: Thiết bị đang trong quá trình bảo dưỡng định kỳ hoặc gửi đi bảo hành.
   * `hong`: Thiết bị gặp sự cố hư hại, không thể sử dụng.
4. **Phân loại theo Bộ môn & Phân bổ vị trí:**
   * Thiết bị theo bộ môn: Lưới/cột bóng chuyền $\rightarrow$ Môn Bóng chuyền; Cột/lưới cầu lông $\rightarrow$ Môn Cầu lông; Cặp khung thành mini di động $\rightarrow$ Môn Bóng đá.
   * Thiết bị dùng chung: Dàn đèn LED, điều hòa nhiệt độ, máy lau sàn, bảng điểm điện tử $\rightarrow$ `ma_bo_mon = NULL`.
   * Vị trí: Thiết bị cố định gắn với ô sân cụ thể (`ma_san`), thiết bị cơ động lưu tại Kho dùng chung (`ma_san = NULL`).
5. **Ghi nhận sự cố hư hỏng (Incident Reporting):**
   * Phiếu báo cáo sự cố hư hỏng (`bao_cao_su_co`) liên kết trực tiếp với `ma_thiet_bi` để chỉ rõ đích danh tài sản bị hỏng.
   * Khi sự cố được ghi nhận ở mức "Khẩn cấp", hệ thống tự động gợi ý kích hoạt khóa bảo trì ô sân liên quan.
6. **Cơ chế Tự động thu hồi thiết bị khi Check-out sân (Automatic Equipment Recall):**
   * Khi khách đặt sân và nhận thiết bị phục vụ trận đấu (cột lưới, bóng, bảng điểm...), các thiết bị này được gán vào sân và khung giờ tương ứng.
   * Khi nhân viên/chủ sân thực hiện thao tác **Check-out sân** (hoàn tất trận đấu và thanh toán hóa đơn), hệ thống **tự động thu hồi toàn bộ thiết bị đang gắn với sân đó về Kho chung**, chuyển trạng thái về `san_sang`.
   * Giao diện quản lý CSVC **không có nút thu hồi thủ công từng thiết bị riêng lẻ**, đảm bảo dữ liệu vòng đời thiết bị được đồng bộ tự động và thống nhất 100% với chu trình đặt & trả sân.

---

## 9. QUẢN LÝ CA TRỰC & PHÂN CÔNG NHÂN SỰ (SHIFTS & STAFFING)

1. **Các ca trực chuẩn trong ngày:**
   * **Ca 1 (Sáng sớm & Thể dục):** 06:00 - 14:00 (Hệ số lương: 1.0).
   * **Ca 2 (Chiều tối Giờ Vàng):** 14:00 - 22:00 (Hệ số lương: 1.0).
   * **Ca 3 (Đêm muộn & Bảo trì mặt sân):** 22:00 - 02:00 (Hệ số lương: **1.3** - Phụ cấp ca đêm).
2. **Định biên & Phân công ca:**
   * Mỗi ngày phải đảm bảo tối thiểu có ít nhất 1 nhân viên phụ trách mỗi ca trực.
   * Chủ sân có toàn quyền Thêm, Sửa, Xóa và Phân ca trực cho nhân viên. Nhân viên có quyền xem lịch và đăng ký ca theo các khung giờ đã mở.
3. **Quy định Chấm dứt / Xóa nhân viên:**
   * Không xóa cứng (Hard delete) thông tin nhân viên khỏi CSDL để bảo toàn dữ liệu lịch sử hóa đơn, phiếu sự cố và đối soát lương.
   * Chỉ thực hiện khóa mềm (Soft delete / Vô hiệu hóa tài khoản). Nhân viên phải bàn giao hết toàn bộ các ca trực trong tương lai mới được phép vô hiệu hóa tài khoản.
4. **Quản lý & Giao nhiệm vụ ca trực (Daily Shift Task Management):**
   * **Giao việc:** Chủ sân (Admin) có quyền tạo và giao danh sách các công việc/nhiệm vụ cụ thể (Tasks / Checklist) gắn với từng ca trực trong ngày (Ví dụ: *"Lau dọn sàn Ô 1-4 trước 14:00"*, *"Kiểm tra dàn đèn LED Ô 3"*, *"Căng lưới bóng chuyền chuẩn bị đón khách 15:00"*, *"Kiểm kê két tiền và bàn giao ca"*).
   * **Thực hiện:** Nhân viên nhận ca có trách nhiệm theo dõi danh sách việc cần làm, cập nhật trạng thái (*Chưa làm*, *Đang làm*, *Đã hoàn thành*) và ghi chú báo cáo kết quả.
   * **Đánh giá:** Lịch sử hoàn thành công việc được lưu lại để Chủ sân nghiệm thu ca và làm căn cứ đánh giá hiệu suất nhân viên.

---

## 10. MÔ HÌNH TÁC NHÂN (ACTORS) & PHÂN QUYỀN VAI TRÒ (ROLES)

Hệ thống thiết lập bảng vai trò (`vai_tro`) chuẩn hóa với 3 nhóm tác nhân chính:

1. **Chủ sân (Admin / Owner - `ADMIN`):**
   * Quản trị toàn bộ hệ thống: Cấu hình giá, mở/khóa ca trực, quản lý nhân viên, phê duyệt hoàn tiền, xem báo cáo doanh thu tài chính tổng hợp.
2. **Nhân viên (Staff / Employee - `STAFF`):**
   * Đăng ký ca làm việc, xem lịch phân ca.
   * Check-in / Check-out cho khách, tính phụ phí thêm giờ lúc thanh toán.
   * Tiếp nhận đặt sân thông thường tại quầy theo ngày, giờ và thời lượng khách chọn.
   * Chủ động hủy sân khi phát sinh sự cố cơ sở vật chất đột xuất.
   * Báo cáo sự cố hỏng hóc trang thiết bị, cập nhật nhật ký bảo trì.
3. **Khách hàng (Customer - `CUSTOMER`):**
   * Đăng ký tài khoản, tra cứu tình trạng sân trống theo thời gian thực.
   * Đặt sân trực tuyến, thanh toán đủ 100% qua mã QR VietQR của sân; không đặt cọc.
   * Xem lịch sử đặt chỗ, chủ động hủy vé trước 24 giờ.
