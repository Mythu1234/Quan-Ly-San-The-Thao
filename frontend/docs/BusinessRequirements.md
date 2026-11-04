<!-- 
================================================================================
CRITICAL DIRECTIVE FOR ALL AI ASSISTANTS & DEVELOPERS:
BẮT BUỘC PHẢI ĐỌC TÀI LIỆU NÀY TRƯỚC KHI BẮT ĐẦU BẤT KỲ TÁC VỤ NÀO!
Tất cả các logic về:
- Đơn giá thuê sân (Cầu lông 120k, Bóng chuyền 150k, Bóng đá 200k) và lưu đơn giá lịch sử tại thời điểm đặt
- Danh mục sân: 5 sân Cầu lông (CL-01 -> CL-05), 5 sân Bóng chuyền (BC-01 -> BC-05), 4 sân Bóng đá mini (BD-01 -> BD-04)
- KHÔNG ÁP DỤNG GÓI VIP THÁNG / HỘI VIÊN TRONG PHẠM VI DỰ ÁN
- TUYỆT ĐỐI KHÔNG TÍNH PHỤ PHÍ / PHỤ THU QUÁ GIỜ: Thanh toán 100% tiền sân ngay lúc đặt; Muốn gia hạn giờ thì bắt buộc phải đặt một lượt đặt sân mới độc lập
- LÚC CHECKOUT: CHỈ THU TIỀN ĐỀN BÙ KHI CÓ HƯ HỎNG trang thiết bị CSVC do khách làm hỏng (theo Bảng giá bồi thường niêm yết, mặc định = 0 VNĐ nếu không hư hỏng)
- KHÔNG ÁP DỤNG HÓA ĐƠN VAT / MÃ SỐ THUẾ: Thanh toán 100% qua VietQR, chỉ lưu mã đối soát giao dịch ngân hàng, không quản lý hóa đơn VAT
- KHÁCH VÃNG LAI KHÔNG CẦN EMAIL / MẬT KHẨU: Định danh bằng Số điện thoại (bắt buộc) và Họ tên; Email là tùy chọn (nullable). Tách biệt thực thể Khách hàng với Tài khoản Nhân sự nội bộ (ADMIN, STAFF)
- Danh mục thiết bị bồi thường dùng chung: bảng thiet_bi lưu tên, bộ môn và mức giá; không quản lý kho, điều chuyển hoặc bắt buộc Seri. Báo cáo sự cố và checkout chọn cùng danh mục, lưu đơn giá lịch sử.
- Báo cáo sự cố CSVC: Phân loại Do khách làm hỏng (đền bù theo Bảng giá niêm yết thu lúc Checkout) hoặc Bảo hành của sân vận động (sân tự liên hệ NCC, khách không chịu phí)
- Quản lý nhân sự và tài khoản nhân viên (Soft delete, tự đổi mật khẩu)
- QUY ƯỚC ĐỊNH DẠNG MÃ (STANDARDIZED ID FORMAT): Thống nhất toàn hệ thống dạng [Tiền tố 2-3 ký tự] + [8 chữ số] (Ví dụ: TB00000001, NV00000001, KH00000001, SAN00000001, DS00000001, TT00000001, HT00000001, SC00000001, DB00000001, BM00000001)
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

## 4. PHẠM VI KHÁCH HÀNG & THÔNG TIN ĐẶT SÂN

1. **Khách vãng lai & Thông tin định danh:**
   * Khách đặt sân tại quầy hoặc qua hotline/Zalo (khách vãng lai) chỉ cần cung cấp **Họ và tên** và **Số điện thoại** (`so_dien_thoai` bắt buộc - NOT NULL) để làm mã định danh nhận diện và đối soát khi nhận sân.
   * **Không yêu cầu Email & Mật khẩu đối với khách vãng lai:** Khách vãng lai không bắt buộc phải có Email (`email` là trường tùy chọn - NULLABLE) và không cần tạo tài khoản/mật khẩu đăng nhập.
2. **Khách hàng trực tuyến (Online):**
   * Khách đặt sân qua website có thể cung cấp thêm Email (tùy chọn) để nhận thông báo xác nhận và lịch sử đặt chỗ.
3. **Quy trình tiếp nhận đặt sân tại quầy:**
   * Form tiếp nhận đặt sân tại quầy dùng một luồng đặt sân thông thường, không phân loại khách thành “trải nghiệm” hoặc “sự kiện”. Nhân viên ghi nhận thông tin khách (Tên, SĐT), chọn môn/sân, ngày đặt, giờ bắt đầu và thời lượng.
   * Yêu cầu sự kiện/chuỗi ngày trên website (nếu có) được xử lý ở luồng riêng, không phải loại đặt sân tại quầy.
   * Dữ liệu yêu cầu VIP cũ (nếu có) không hiển thị trong danh sách yêu cầu đặt sân.

---

## 5. QUY ĐỊNH THANH TOÁN 100% QUA VIETQR (KHÔNG QUẢN LÝ HÓA ĐƠN VAT)

1. **Hình thức thanh toán:**
   * Khách đặt sân thông thường thanh toán đủ 100% ngay lúc đặt chỗ qua mã QR VietQR của sân. Không áp dụng đặt cọc, tiền mặt hoặc quẹt thẻ POS.
   * Đặt sân tại quầy cũng phải thanh toán đủ 100%; không nhận đặt cọc hoặc chia đợt.

2. **Theo dõi Số tiền đã trả & Số tiền còn lại:**
   * Tại mọi thời điểm, hệ thống tự động xác định số tiền khách còn phải nộp:
     $$\text{Số tiền còn lại} = \text{Tổng tiền phải trả} - \text{Tổng số tiền đã thanh toán qua các đợt}$$

3. **Loại bỏ Hóa đơn VAT & Mã số thuế khỏi phạm vi dự án:**
   * Hệ thống **KHÔNG quản lý hóa đơn VAT (`so_hoa_don_vat`) và Mã số thuế (`ma_so_thue`)**. Giao dịch thanh toán được quản lý tinh gọn theo Biên lai/Mã giao dịch đối soát VietQR ngân hàng (`ma_giao_dich_ngan_hang`).
   * Không thiết kế bảng Hóa đơn riêng gây dư thừa. Mỗi lần khách thanh toán (tiền thuê sân hoặc tiền đền bù hư hại CSVC lúc checkout) được ghi nhận 1 bản ghi vào bảng `thanh_toan`.

4. **Vé đặt sân:**
   * Không sử dụng bảng Vé điện tử riêng. Mã đặt sân (`ma_dat_san`) kiêm luôn vai trò của Mã vé điện tử để khách quét QR đối soát và làm thủ tục Check-in/Check-out.

5. **Quy trình Thanh toán VietQR & Xuất biên nhận (Đồng bộ Khách hàng & Nhân viên/Chủ sân):**
   * **Giao diện thanh toán VietQR tinh gọn:**
     - Khi xác nhận đặt sân, hệ thống hiển thị mã QR VietQR với số tiền tương ứng và nội dung chuyển khoản chuẩn hóa (`CX <MÃ SÂN> <SỐ ĐIỆN THOẠI>`).
     - Giao diện hiển thị trạng thái duy nhất: `"Đang chờ ghi nhận thanh toán qua VietQR…"` kèm biểu tượng radar nhấp nháy.
     - Tuyệt đối **không hiển thị thanh tiến trình (progress bar) và không hiển thị số giây đếm ngược** trên giao diện nhằm giữ trải nghiệm tinh gọn, chuyên nghiệp.
     - Cung cấp nút `"Hủy giao dịch"` cho phép hủy thao tác nếu có thay đổi.
   * **Cơ chế ghi nhận tự động sau 5 giây:**
     - Hệ thống chạy ngầm bộ đếm 5 giây (`5s`) mô phỏng phản hồi ghi nhận tiền vào tài khoản từ hệ thống ngân hàng.
     - Sau 5 giây, hệ thống tự động lưu trữ dữ liệu vào CSDL Supabase: đơn đặt sân (`dat_san`), giao dịch thanh toán (`thanh_toan`), và biên nhận điện tử (`bien_nhan`) với mã định dạng tuần tự chuẩn (`DS...`, `TT...`, `BN...`).
     - Tự động chuyển thẳng sang màn hình **"ĐẶT SÂN THÀNH CÔNG!"**.
   * **Màn hình Đặt sân thành công & Biên nhận:**
     - Màn hình "ĐẶT SÂN THÀNH CÔNG!" hiển thị mã đơn đặt sân, thông tin chi tiết môn, sân, thời gian, số tiền đã thanh toán 100% qua VietQR.
     - Đồng bộ ở cả 2 luồng: cung cấp nút **"📋 BIÊN NHẬN"** mở modal biên nhận chi tiết (hỗ trợ in biên nhận kiểm tra vé tại quầy) và nút **"HOÀN TẤT"**.

---

## 6. CHÍNH SÁCH HỦY ĐẶT SÂN & HOÀN TIỀN (CANCELLATION & REFUND)

1. **Khách hàng tự hủy trên hệ thống:**
   * Khách hàng chọn "Hủy" trên đơn đặt sân đã xác thực. Hệ thống kiểm tra đơn còn hiệu lực và thời điểm bắt đầu lượt đặt sân.
   * **Hủy trước giờ sử dụng ít nhất 24 giờ:** Hệ thống xác định khách đủ điều kiện hoàn tiền, tính số tiền hoàn theo chính sách hoàn tiền hiện hành (mặc định hoàn 100% số tiền đã thanh toán), xử lý hoàn tiền, hủy đơn, giải phóng khung giờ trên lịch sân và gửi xác nhận hủy cho khách.
   * **Hủy trước giờ sử dụng dưới 24 giờ:** Hệ thống thông báo khách không đủ điều kiện hoàn tiền và hỏi khách có tiếp tục hủy sân không. Nếu khách đồng ý, hệ thống hủy đơn, không hoàn tiền, giải phóng khung giờ trên lịch sân và gửi xác nhận hủy. Nếu khách không đồng ý, hệ thống giữ nguyên lịch đặt sân.
   * Mỗi lần xử lý hủy phải lưu thời điểm hủy, người thực hiện, kết quả kiểm tra điều kiện, số tiền hoàn (nếu có), trạng thái hoàn tiền và trạng thái cuối cùng của đơn để phục vụ tra cứu, đối soát.
2. **Quyền hạn Nhân viên / Chủ sân chủ động hủy sân:**
   * Nhân viên hoặc Chủ sân có toàn quyền **chủ động hủy lịch đặt sân của khách** trong các trường hợp bất khả kháng: Sự cố hỏng hóc khẩn cấp (cháy đèn chiếu sáng, rách thảm sân, gãy khung thành, mất điện lưới...) hoặc phục vụ bảo trì đột xuất.
   * Khi nhân viên hủy sân, bắt buộc phải ghi rõ `ly_do_huy` trên hệ thống. Hệ thống tự động giải phóng sân, gửi thông báo xin lỗi đến khách hàng và tạo lệnh hoàn tiền 100% cho khách.

---

## 7. QUY ĐỊNH HẾT GIỜ, ÂN HẠN 10 PHÚT & THỦ TỤC CHECKOUT (NO OVERTIME SURCHARGE - CHỈ ĐỀN BÙ KHI CÓ HƯ HỎNG)

* **TUYỆT ĐỐI KHÔNG TÍNH PHỤ PHÍ / PHỤ THU THÊM GIỜ:**
  * Hệ thống **KHÔNG CÓ NGHIỆP VỤ TÍNH PHỤ PHÍ / PHỤ THU QUÁ GIỜ** dưới bất kỳ hình thức nào.
  * Toàn bộ tiền thuê sân bắt buộc phải được thanh toán **100% qua VietQR ngay tại thời điểm đặt sân**.
* **Quy tắc gia hạn giờ chơi (Bắt buộc đặt sân khác/mới):**
  * Hệ thống **KHÔNG hỗ trợ gia hạn thêm giờ trực tiếp trên ca đang thi đấu** hoặc thu thêm tiền giờ tại chỗ.
  * Nếu khách hàng có nhu cầu chơi tiếp, khách hàng **bắt buộc phải đặt một lượt đặt sân mới độc lập** (nếu sân hiện tại hoặc sân khác còn khung giờ trống) theo đúng quy trình đặt sân tiêu chuẩn.
* **Quy tắc ân hạn 10 phút & Bắt buộc Check-out:** Sau khi hết giờ thuê sân, khách hàng có thời gian ân hạn **tối đa 10 phút** để dọn dẹp tư trang cá nhân và bắt buộc phải thực hiện thủ tục Check-out để bàn giao lại mặt sân cho ca tiếp theo.
* **Quy định thanh toán lúc Check-out (CHỈ ĐỀN BÙ KHI CÓ HƯ HỎNG):**
  * Tiền thuê sân đã được thanh toán 100% trước đó khi đặt chỗ qua VietQR (`Tiền sân còn lại = 0 VNĐ`).
  * Lúc Check-out, hệ thống **CHỈ PHÁT SINH THANH TOÁN THU TIỀN KHI VÀ CHỈ KHI CÓ BỒI THƯỜNG HƯ HỎNG TRANG THIẾT BỊ CSVC** do khách gây ra (căn cứ theo Biên bản sự cố và Bảng giá đền bù niêm yết).
  * Nếu không phát sinh sự cố hư hại thiết bị, nhân viên thực hiện thao tác Check-out hoàn tất lượt đặt ngay lập tức với số tiền cần thu là **0 VNĐ**:
    $$\text{Tổng tiền thu lúc Checkout} = \text{Phí bồi thường sự cố CSVC do khách làm hỏng (nếu có, mặc định = 0 VNĐ)}$$
    $$\text{Tổng thanh toán lượt đặt} = \text{Tiền thuê sân (đã thanh toán 100% lúc đặt)} + \text{Phí bồi thường CSVC (nếu có)}$$

* **Thanh toán bồi thường tại Check-out:** Sau khi nhập đủ thông tin sự cố và chọn trách nhiệm, nhân viên tick `Thanh toán qua VietQR` để mở mã QR dùng chung với phần đặt sân. Hệ thống mô phỏng ghi nhận thành công sau **7 giây**, tự tạo mã tham chiếu giao dịch và mở nút `Xác nhận Check-out`. Nhân viên phải nhấn xác nhận để lưu quyết toán, thanh toán và báo cáo sự cố; bộ đếm không tự hoàn tất trả sân. Thay đổi thông tin sự cố hoặc số tiền sẽ hủy trạng thái xác nhận thanh toán cũ. Bỏ tick sẽ hủy chờ thanh toán. Sân chịu chi phí hoặc không có hư hỏng thì không cần bước thanh toán bồi thường. Đây là luồng mô phỏng, chưa phải xác minh giao dịch ngân hàng thực tế.

---

## 8. QUẢN LÝ CƠ SỞ VẬT CHẤT, BÁO CÁO SỰ CỐ & BẢNG GIÁ ĐỀN BÙ (ASSET & DAMAGE MANAGEMENT)

1. **Danh mục thiết bị và giá bồi thường (cập nhật theo yêu cầu chủ dự án):**
   * `thiet_bi` là danh mục dùng chung cho bảng giá, báo cáo sự cố và checkout; mỗi mục có mã, tên, bộ môn và mức giá bồi thường.
   * Mã danh mục được chuẩn hóa từ `TB00000001`; giá mua lưu tại `gia_mua` (chưa biết thì NULL), giá bồi thường lưu tại `gia_boi_thuong`. Không lấy giá bồi thường làm giá mua khi thiếu dữ liệu.
   * Không quản lý tồn kho, điều chuyển, cấp phát theo lượt đặt hoặc bắt buộc nhập Seri. Thông tin nhà cung cấp/bảo hành là tùy chọn.
   * Các mục trùng được gộp; dữ liệu thiết bị cũ được lưu lại trong lịch sử sự cố/quyết toán trước khi loại khỏi danh mục.
   * `bang_gia_den_bu` giữ liên kết tương thích để bảo toàn giao dịch và đơn giá đã áp dụng. Thêm thiết bị phải lưu đồng thời thiết bị và mức giá, không sinh hai danh sách tên riêng.
2. **Thông tin Nhà cung cấp & Bảo hành (Lưu trực tiếp tại thiết bị):**
   * Mỗi thiết bị lưu trữ trực tiếp: Tên nhà cung cấp (`nha_cung_cap`), Hotline nhà cung cấp (`sdt_ncc`), Ngày đưa vào sử dụng và Thời hạn bảo hành (`han_bao_hanh`).
   * Hệ thống **không thiết kế bảng phiếu bảo hành/sửa chữa riêng** để tinh gọn quy trình; khi có sự cố cần bảo hành, nhân viên tra cứu trực tiếp thông tin NCC từ thiết bị.
3. **Trạng thái thiết bị:**
   * `san_sang`: Thiết bị trong tình trạng hoàn hảo, sẵn sàng phục vụ.
   * `dang_su_dung`: Thiết bị đang phục vụ khách trên sân.
   * `bao_tri`: Thiết bị đang trong quá trình bảo dưỡng hoặc gửi NCC bảo hành.
   * `hong`: Thiết bị gặp sự cố hư hại, không thể sử dụng.
4. **Sân được ghi nhận trên từng báo cáo:**
   * Danh mục thiết bị không gắn cố định với một sân. Báo cáo sự cố ghi sân/khu vực và lượt đặt liên quan.
   * Một loại thiết bị có thể được báo hỏng tại nhiều sân; không đổi tình trạng của toàn bộ danh mục khi chỉ một sân gặp sự cố.
5. **Ghi nhận Sự cố hư hỏng & Phân loại Trách nhiệm (Master - Detail Incident Reporting):**
   * Khi phát sinh hư hại trang thiết bị hoặc mặt sân, nhân viên lập biên bản sự cố tổng (`bao_cao_su_co`) và danh sách các món hư hại (`chi_tiet_su_co`).
   * **Bảo toàn đơn giá đền bù lịch sử:** Bảng `chi_tiet_su_co` lưu vết `don_gia_ap_dung` tại thời điểm xảy ra sự cố và `so_luong_hu_hai` để tính `thanh_tien`, đảm bảo khi bảng giá niêm yết thay đổi thì biên bản cũ không bị sai lệch số tiền phạt.
   * **Bắt buộc phân loại nguyên nhân / trách nhiệm hư hỏng gồm 2 trường hợp:**
     * **Trường hợp 1: Do khách làm hỏng (`DO_KHACH_LAM_HONG`):**
       - Khách hàng sử dụng sai cách, va đập mạnh làm gãy cột lưới, rách lưới, vỡ bóng đèn, rách mặt thảm sàn hoặc làm mất bóng thi đấu...
       - Hệ thống tự động tính tiền bồi thường căn cứ theo **Bảng giá bồi thường trang thiết bị hư hỏng niêm yết**.
       - Số tiền đền bù được tự động đưa vào mục thanh toán bồi thường lúc **Check-out** sân của khách hàng vi phạm.
     * **Trường hợp 2: Bảo hành của sân vận động / Hao mòn tự nhiên (`BAO_HANH_SAN_VAN_DONG`):**
       - Sự cố phát sinh do khấu hao tự nhiên, lỗi linh kiện nhà sản xuất, chập điện giàn đèn trần hoặc hết hạn bảo dưỡng.
       - Sân vận động tự chi trả 100% chi phí sửa chữa. Khách hàng **không phải thanh toán bất kỳ khoản bồi thường nào**.
       - Nhân viên cập nhật tiến độ xử lý trên báo cáo sự cố và tra cứu thông tin NCC nếu có; không thu bồi thường của khách.
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

7. **Kiểm tra tình trạng thiết bị khi Check-out sân:**
   * Khi nhân viên thực hiện thao tác **Check-out sân**, nhân viên kiểm tra hiện trạng thiết bị và mặt sân.
   * Nếu thiết bị trong tình trạng nguyên vẹn: Duy trì trạng thái `san_sang`.
   * Nếu thiết bị bị hư hại (có lập biên bản sự cố): Chuyển trạng thái sang `hong` hoặc `bao_tri`, tuyệt đối không tự động đưa về `san_sang`.

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

Hệ thống phân định rành mạch giữa **Tài khoản người dùng nội bộ** (nhân sự vận hành có tài khoản đăng nhập) và **Khách hàng** (người đặt sân):

1. **Phân quyền Tài khoản Nội bộ (RBAC - Quản lý nhân sự):**
   * Bảng tài khoản nội bộ chỉ bao gồm 2 vai trò quản trị:
     * **Chủ sân (Admin / Owner - `ADMIN`):** Quản trị toàn bộ hệ thống: Cấu hình giá thuê sân, **Thêm / Sửa / Xóa sân**, quản lý trang thiết bị CSVC, quản lý nhân sự & tài khoản nhân viên, theo dõi giao dịch và báo cáo doanh thu tài chính tổng hợp.
     * **Nhân viên (Staff / Employee - `STAFF`):** Tiếp nhận đặt sân tại quầy cho khách vãng lai; Check-in / Check-out cho khách, kiểm tra trang thiết bị và lập biên bản đền bù sự cố (nếu có) lúc Checkout (không tính phụ phí quá giờ); chủ động hủy sân khi có sự cố bất khả kháng; ghi nhận sự cố thiết bị sân và tra cứu thông tin NCC để xử lý bảo trì.
   * *Quy tắc phân quyền:* Khi Admin tạo tài khoản nhân sự mới, vai trò mặc định là `STAFF`. Bảng tài khoản nội bộ **KHÔNG chứa vai trò `CUSTOMER`**.

2. **Khách hàng (Customer):**
   * Lưu trữ trong bảng hồ sơ khách hàng độc lập (`khach_hang`), định danh bằng Số điện thoại (`so_dien_thoai` NOT NULL).
   * **Khách vãng lai:** Được nhân viên ghi nhận nhanh tại quầy (chỉ cần Họ tên + SĐT, không cần email, không có mật khẩu hay tài khoản hệ thống).
   * **Khách đặt trực tuyến (Online):** Tra cứu tình trạng sân trống theo thời gian thực trên website, đặt sân và thanh toán 100% qua VietQR, có thể nhập email để nhận thông báo, chủ động hủy vé trước 24 giờ để nhận hoàn tiền.
