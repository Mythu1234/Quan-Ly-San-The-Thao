<!-- 
================================================================================
CRITICAL DIRECTIVE FOR ALL AI ASSISTANTS & DEVELOPERS:
BẮT BUỘC PHẢI ĐỌC TÀI LIỆU NÀY TRƯỚC KHI BẮT ĐẦU BẤT KỲ TÁC VỤ NÀO!
Tất cả các logic về:
- Đơn giá thuê sân (Cầu lông 120k, Bóng chuyền 150k, Bóng đá 200k)
- Danh mục sân: 5 sân Cầu lông (CL-01 -> CL-05), 5 sân Bóng chuyền (BC-01 -> BC-05), 4 sân Bóng đá mini (BD-01 -> BD-04)
- KHÔNG ÁP DỤNG GÓI VIP THÁNG / HỘI VIÊN TRONG PHẠM VI DỰ ÁN
- Quản lý thiết bị từng chiếc (Asset Serial), tự động thu hồi khi Checkout
- Báo cáo sự cố CSVC: Phân loại Do khách làm hỏng (đền bù theo Bảng giá niêm yết) hoặc Bảo hành của sân vận động
- Quản lý nhân sự và tài khoản nhân viên (Soft delete, tự đổi mật khẩu)
- KHÔNG CÓ NGHIỆP VỤ CA TRỰC TRONG PHẠM VI DỰ ÁN
PHẢI TUÂN THỦ 100% CÁC QUY TẮC TRONG TÀI LIỆU NÀY. KHÔNG ĐƯỢC TỰ Ý THAY ĐỔI.
================================================================================
-->

> [!IMPORTANT]
> ### ⚠️ CHÚ Ý ĐẶC BIỆT DÀNH CHO AI ASSISTANT & LẬP TRÌNH VIÊN:
> **BẮT BUỘC ĐỌC TÀI LIỆU NÀY TRƯỚC KHI THỰC HIỆN BẤT KỲ TÁC VỤ NÀO!**
> Mọi tác vụ phân tích, thiết kế CSDL (ERD), viết mã backend, frontend hay kiểm thử trong dự án này **bắt buộc phải đọc và tuân thủ tuyệt đối các quy tắc nghiệp vụ (Business Rules) được định nghĩa trong file này**. Tuyệt đối không tự ý giả định sai lệch bảng giá, cơ cấu sân, chính sách bồi thường hư hỏng hay quy trình vận hành.

# CÁC YÊU CẦU NGHIỆP VỤ HỆ THỐNG (BUSINESS REQUIREMENTS)
## DỰ ÁN: HỆ THỐNG QUẢN LÝ VẬN HÀNH VÀ ĐẶT SÂN THỂ THAO (COURTX ARENA)
*(Học phần: Thực hành Phân tích Thiết kế Hệ thống Thông tin - THPTTKHTTT)*

---

Tài liệu này tổng hợp toàn bộ các quy tắc vận hành, chính sách kinh doanh và quy tắc nghiệp vụ (Business Rules) dành cho Hệ thống Quản lý Vận hành và Đặt Sân Thể Thao CourtX (Cầu lông, Bóng chuyền, Bóng đá).

Các thông tin này là cơ sở cốt lõi để lập trình logic xử lý, kiểm tra ràng buộc (constraints) và thiết kế cơ sở dữ liệu (ERD).

---

## 1. QUY MÔ SÂN & CƠ CẤU MẶT SÂN (COURT STRUCTURE & SPECIFICATIONS)

* **Giờ mở cửa hoạt động:** 05:00 sáng đến 23:00 đêm hằng ngày.
* **Cơ cấu danh mục sân tiêu chuẩn ban đầu:** Hệ thống phân chia theo từng bộ môn cụ thể với các mã sân chuẩn hóa:
  * **05 Sân Cầu lông:** Mã sân từ `Sân CL-01` đến `Sân CL-05` (`SAN_CL_01` -> `SAN_CL_05`).
  * **05 Sân Bóng chuyền:** Mã sân từ `Sân BC-01` đến `Sân BC-05` (`SAN_BC_01` -> `SAN_BC_05`).
  * **04 Sân Bóng đá mini:** Mã sân từ `Sân BD-01` đến `Sân BD-04` (`SAN_BD_01` -> `SAN_BD_04`) (có thể mở rộng lên `BD-05` khi mở thêm sân).
* **Quyền hạn Thêm / Sửa / Xóa sân của Chủ sân (Admin Court Management):**
  * Chủ sân (Admin) có toàn quyền **Thêm mới sân**, **Chỉnh sửa thông tin sân** (tên sân, bộ môn, vị trí) hoặc **Xóa / Ngừng hoạt động sân** để linh hoạt đáp ứng việc mở rộng hoặc tái cấu trúc quy mô sân bãi.
  * *Khi thêm sân mới:* Admin nhập Mã sân, Tên sân, chọn Bộ môn (Cầu lông / Bóng chuyền / Bóng đá), Vị trí và Trạng thái ban đầu (`san_sang`).
  * *Khi xóa/ngừng hoạt động sân:* Áp dụng cơ chế kiểm tra ràng buộc toàn vẹn dữ liệu: Nếu sân đang có đơn đặt trước trong tương lai, hệ thống cảnh báo yêu cầu nhân viên/chủ sân xử lý điều chuyển sân hoặc hoàn cọc cho khách trước khi vô hiệu hóa sân.
* **Trạng thái sân:**
  * `san_sang`: Sân trống, trong tình trạng hoàn hảo sẵn sàng nhận khách.
  * `dang_su_dung`: Sân đang có khách thi đấu.
  * `bao_tri`: Sân đang tạm khóa phục vụ sửa chữa, bảo dưỡng mặt sàn hoặc hệ thống đèn.
  * `tam_dong`: Sân tạm dừng phục vụ vận hành.

---

## 2. BẢNG GIÁ THUÊ SÂN TIÊU CHUẨN (STANDARD HOURLY RATES)

Đơn giá thuê sân áp dụng tính theo giờ (VNĐ/giờ/sân) cho từng bộ môn như sau:

| Bộ môn | Quy mô sân | Đơn giá thuê tiêu chuẩn | Mô tả sử dụng |
| :--- | :---: | :---: | :--- |
| **Cầu lông** | 1 sân riêng biệt | **120.000 VNĐ / giờ** | Chơi đơn/đôi theo mặt sân thảm tiêu chuẩn BWF |
| **Bóng chuyền** | 1 sân riêng biệt | **150.000 VNĐ / giờ** | Sân thảm bóng chuyền, lắp trụ & lưới căng tiêu chuẩn |
| **Bóng đá mini** | 1 sân riêng biệt | **200.000 VNĐ / giờ** | Sân cỏ nhân tạo/thảm futsal kèm cặp khung thành mini |

---

## 3. QUY TẮC ĐẶT SÂN & KHUNG GIỜ HOẠT ĐỘNG (COURT BOOKING RULES)

* **Toàn bộ thời gian hoạt động (05:00 - 23:00 hàng ngày):** Khách hàng và nhân viên có thể tra cứu và đặt sân theo các khung giờ (block 30 phút hoặc 60 phút) trên từng sân độc lập.
* **Tính độc lập của mặt sân:** Mỗi sân (CL, BC, BD) hoạt động độc lập theo mã sân tương ứng. Khi một sân đã có khách đặt trước trong khung giờ $T_1 \rightarrow T_2$, hệ thống lập tức khóa khung giờ đó của đúng sân đó, không làm ảnh hưởng đến các sân còn lại.
* **Không áp dụng ca trực:** Dự án không quản lý nghiệp vụ ca trực của nhân viên. Lịch đặt sân được hiển thị liên tục theo trục thời gian trong ngày từ 05:00 đến 23:00.

---

## 4. PHẠM VI KHÁCH HÀNG & YÊU CẦU ĐẶT SÂN

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
   * Nhân viên hoặc Chủ sân có toàn quyền **chủ động hủy lịch đặt sân của khách** trong các trường hợp bất khả kháng: Sự cố hỏng hóc khẩn cấp (cháy đèn chiếu sáng, rách thảm sân, gãy khung thành, mất điện lưới...) hoặc phục vụ bảo trì đột xuất.
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

## 8. QUẢN LÝ CƠ SỞ VẬT CHẤT, BÁO CÁO SỰ CỐ & BẢNG GIÁ ĐỀN BÙ (ASSET & DAMAGE MANAGEMENT)

1. **Quản lý theo từng cá thể tài sản (Asset Tracking):**
   * Tuyệt đối **không ghi số lượng tổng gộp** (Ví dụ: Không ghi "Vợt: 10 cái").
   * Mỗi tài sản là một bản ghi độc lập, có **Mã thiết bị** và **Mã Seri / Asset Tag** riêng biệt để phục vụ dán mã QR kiểm kê và theo dõi bảo hành.
2. **Theo dõi Bảo hành & Bảo dưỡng:**
   * Mỗi thiết bị lưu trữ đầy đủ: Ngày đưa vào sử dụng, Thời hạn bảo hành, Ngày bảo trì gần nhất.
3. **Trạng thái thiết bị:**
   * `san_sang`: Thiết bị lưu kho trong tình trạng hoàn hảo, sẵn sàng mang ra sử dụng.
   * `dang_su_dung`: Thiết bị đang được lắp đặt hoặc phục vụ khách trên sân.
   * `bao_tri`: Thiết bị đang trong quá trình bảo dưỡng định kỳ hoặc gửi đi bảo hành.
   * `hong`: Thiết bị gặp sự cố hư hại, không thể sử dụng.
4. **Phân loại theo Bộ môn & Phân bổ vị trí:**
   * Thiết bị theo bộ môn: Lưới/cột bóng chuyền $\rightarrow$ Môn Bóng chuyền; Cột/lưới cầu lông $\rightarrow$ Môn Cầu lông; Khung thành/bóng đá $\rightarrow$ Môn Bóng đá.
   * Thiết bị dùng chung: Dàn đèn LED, ghế trọng tài, máy lau sàn, bảng điểm điện tử $\rightarrow$ `ma_bo_mon = NULL`.
   * Vị trí: Thiết bị cố định gắn với sân cụ thể (`ma_san`), thiết bị cơ động lưu tại Kho dùng chung (`ma_san = NULL`).
5. **Ghi nhận Sự cố hư hỏng & Phân loại Trách nhiệm (Incident Reporting & Liability):**
   * Khi phát sinh hư hại trang thiết bị hoặc mặt sân, nhân viên lập phiếu báo cáo sự cố (`bao_cao_su_co`) gắn trực tiếp với `ma_thiet_bi` hoặc `ma_san`.
   * **Bắt buộc phân loại nguyên nhân / trách nhiệm hư hỏng gồm 2 trường hợp:**
     * **Trường hợp 1: Do khách làm hỏng (`DO_KHACH_LAM_HONG`):**
       - Khách hàng sử dụng sai cách, va đập mạnh làm gãy cột lưới, rách lưới, ném vỡ bóng đèn, rách mặt thảm sàn hoặc làm mất bóng thi đấu...
       - Hệ thống tự động tính tiền bồi thường căn cứ theo **Bảng giá bồi thường trang thiết bị hư hỏng niêm yết**.
       - Số tiền đền bù được tự động cộng vào hóa đơn thanh toán lúc **Check-out** sân của khách hàng vi phạm.
     * **Trường hợp 2: Bảo hành của sân vận động / Hao mòn tự nhiên (`BAO_HANH_SAN_VAN_DONG`):**
       - Sự cố phát sinh do khấu hao tự nhiên, lỗi linh kiện nhà sản xuất, chập điện giàn đèn trần hoặc hết hạn bảo dưỡng.
       - Sân vận động tự chi trả 100% chi phí sửa chữa. Khách hàng **không phải thanh toán bất kỳ khoản bồi thường nào**.
       - Phiếu sự cố được kích hoạt chuyển sang quy trình bảo hành/sửa chữa thiết bị (`bao_hanh_thiet_bi`).
6. **Bảng giá niêm yết bồi thường vật tư / trang thiết bị hư hại (Damage Compensation Price List):**
   Hệ thống quy định bảng giá bồi thường chuẩn hóa công khai để áp dụng thu tiền minh bạch khi khách làm hỏng:

   | STT | Trang thiết bị / Vật tư hư hại | Bộ môn | Đơn giá bồi thường | Quy cách / Mô tả hư hại |
   | :---: | :--- | :---: | :---: | :--- |
   | 1 | **Lưới cầu lông thi đấu** | Cầu lông | **150.000 VNĐ / tấm** | Rách mắt lưới, đứt dây căng viền |
   | 2 | **Cột trụ căng lưới cầu lông** | Cầu lông | **450.000 VNĐ / chiếc** | Móp méo, cong gãy thân trụ thép |
   | 3 | **Quả cầu lông thi đấu** | Cầu lông | **30.000 VNĐ / quả** | Dẫm nát, gãy gập khung lông vũ |
   | 4 | **Lưới bóng chuyền tiêu chuẩn** | Bóng chuyền | **250.000 VNĐ / tấm** | Đứt cáp thép bọc nhựa, rách lưới |
   | 5 | **Cọc ăng-ten giới hạn biên** | Bóng chuyền | **100.000 VNĐ / cặp** | Gãy que sợi thủy tinh chỉ giới |
   | 6 | **Trụ bóng chuyền di động** | Bóng chuyền | **600.000 VNĐ / trụ** | Hỏng tăng đơ căng cáp hoặc méo trụ |
   | 7 | **Quả bóng chuyền thi đấu** | Bóng chuyền | **200.000 VNĐ / quả** | Rách da bóng, xì van do vật sắc nhọn |
   | 8 | **Lưới khung thành mini** | Bóng đá | **300.000 VNĐ / bộ** | Rách lưới do lực tác động sai quy cách |
   | 9 | **Khung thành mini di động** | Bóng đá | **800.000 VNĐ / khung** | Cong gãy thanh xà ngang hoặc gãy chốt |
   | 10 | **Quả bóng đá thi đấu** | Bóng đá | **250.000 VNĐ / quả** | Bục chỉ, nứt da bóng do đá vào vật nhọn |
   | 11 | **Bảng điểm lật số để bàn** | Dùng chung | **120.000 VNĐ / chiếc** | Rách thẻ số, gãy khớp lật |
   | 12 | **Ghế ngồi trọng tài / ghế nghỉ** | Dùng chung | **200.000 VNĐ / chiếc** | Gãy chân ghế, biến dạng khung |
   | 13 | **Bóng đèn LED chiếu sáng trần** | Dùng chung | **500.000 VNĐ / bóng** | Vỡ chao đèn, hỏng mắt chip LED do bóng đập |
   | 14 | **Mặt thảm vinyl sàn thi đấu** | Dùng chung | **600.000 VNĐ / m²** | Thủng rách thảm, trầy xước sâu, tàn thuốc lá |

7. **Cơ chế Tự động thu hồi thiết bị khi Check-out sân (Automatic Equipment Recall):**
   * Khi khách đặt sân và nhận thiết bị phục vụ trận đấu (cột lưới, bóng, bảng điểm...), các thiết bị này được gán vào sân và khung giờ tương ứng.
   * Khi nhân viên/chủ sân thực hiện thao tác **Check-out sân** (hoàn tất trận đấu và thanh toán hóa đơn), hệ thống **tự động thu hồi toàn bộ thiết bị đang gắn với sân đó về Kho chung**, chuyển trạng thái về `san_sang`.
   * Giao diện quản lý CSVC **không có nút thu hồi thủ công từng thiết bị riêng lẻ**, đảm bảo dữ liệu vòng đời thiết bị được đồng bộ tự động và thống nhất 100% với chu trình đặt & trả sân.

---

## 9. QUẢN LÝ NHÂN SỰ & TÀI KHOẢN NHÂN VIÊN (STAFF & ACCOUNT MANAGEMENT)

1. **Quản lý Hồ sơ & Tài khoản:**
   * Chủ sân (Admin) quản lý danh sách nhân viên vận hành, bao gồm: Họ và tên, Số điện thoại, Email, Chức danh/Vai trò và Mật khẩu ban đầu.
   * Tài khoản nhân viên được cấp quyền truy cập hệ thống để làm việc tại quầy và quản lý vận hành. Nhân viên có quyền tự đổi mật khẩu cá nhân tại giao diện Hồ sơ cá nhân.
2. **Quy định Chấm dứt / Xóa nhân viên:**
   * Không xóa cứng (Hard delete) thông tin nhân viên khỏi CSDL để bảo toàn dữ liệu lịch sử hóa đơn, báo cáo sự cố hư hỏng và nhật ký vận hành sân.
   * Chỉ thực hiện khóa mềm (Soft delete / Vô hiệu hóa tài khoản). Nhân viên bị vô hiệu hóa sẽ không thể đăng nhập vào hệ thống nhưng toàn bộ lịch sử thao tác trước đây vẫn được lưu trữ nguyên vẹn.
3. **Phạm vi dự án:**
   * Hệ thống **không triển khai module phân chia ca trực**. Nhân viên sử dụng tài khoản để đăng nhập, thực hiện nhiệm vụ đón tiếp khách, check-in / check-out và lập biên bản sự cố thiết bị tại quầy.

---

## 10. MÔ HÌNH TÁC NHÂN (ACTORS) & PHÂN QUYỀN VAI TRÒ (ROLES)

Hệ thống thiết lập bảng vai trò (`vai_tro`) chuẩn hóa với 3 nhóm tác nhân chính:

1. **Chủ sân (Admin / Owner - `ADMIN`):**
   * Quản trị toàn bộ hệ thống: Cấu hình giá thuê sân, **Thêm / Sửa / Xóa sân**, quản lý trang thiết bị CSVC, quản lý nhân viên và tài khoản, phê duyệt hoàn tiền, xem báo cáo doanh thu tài chính tổng hợp.
2. **Nhân viên (Staff / Employee - `STAFF`):**
   * Check-in / Check-out cho khách, tính phụ phí thêm giờ lúc thanh toán.
   * Tiếp nhận đặt sân thông thường tại quầy theo ngày, giờ và thời lượng khách chọn.
   * Chủ động hủy sân khi phát sinh sự cố cơ sở vật chất đột xuất.
   * Báo cáo sự cố hỏng hóc trang thiết bị, cập nhật nhật ký bảo trì.
3. **Khách hàng (Customer - `CUSTOMER`):**
   * Đăng ký tài khoản, tra cứu tình trạng sân trống theo thời gian thực.
   * Đặt sân trực tuyến, thanh toán đủ 100% qua mã QR VietQR của sân; không áp dụng đặt cọc hay các gói VIP tháng.
   * Xem lịch sử đặt chỗ, chủ động hủy vé trước 24 giờ.
