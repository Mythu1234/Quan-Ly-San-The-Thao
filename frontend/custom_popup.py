import re

code = open('src/pages/TrangChu.tsx', encoding='utf-8').read()

# 1. State
state_injection = """  const [popup, setPopup] = useState<any>(null);
  const showAlert = (title: string, message: string) => setPopup({ type: 'alert', title, message });
  const showConfirm = (title: string, message: string, onConfirm: () => void) => setPopup({ type: 'confirm', title, message, onConfirm });"""

code = code.replace(
    "const [otpError, setOtpError] = useState<boolean>(false);",
    "const [otpError, setOtpError] = useState<boolean>(false);\n" + state_injection
)

# 2. JSX
jsx_injection = """
      {/* 🟣 CUSTOM POPUP */}
      {popup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center border border-slate-100">
            <h3 className="text-lg font-black text-slate-900">{popup.title}</h3>
            <p className="mt-2 text-sm text-slate-600 whitespace-pre-line leading-relaxed">{popup.message}</p>
            
            <div className={mt-6 grid gap-3 }>
              {popup.type === 'confirm' && (
                <button 
                  onClick={() => setPopup(null)} 
                  className="rounded-xl border border-slate-200 py-3.5 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition"
                >
                  Không, quay lại
                </button>
              )}
              <button 
                onClick={() => {
                  if (popup.type === 'confirm' && popup.onConfirm) popup.onConfirm();
                  setPopup(null);
                }} 
                className="rounded-xl bg-emerald-500 py-3.5 text-xs font-bold text-white hover:bg-emerald-600 active:scale-95 transition shadow-sm"
              >
                {popup.type === 'confirm' ? 'Có, xác nhận' : 'Đóng'}
              </button>
            </div>
          </div>
        </div>
      )}
"""
code = code.replace("{/* 🟡 MODAL THANH TOÁN", jsx_injection + "\n      {/* 🟡 MODAL THANH TOÁN")

# 3. Replace alerts
code = code.replace("alert('Đang mở video trải nghiệm Nhà Thi Đấu COURTX!')", "showAlert('Trải nghiệm không gian', 'Đang mở video trải nghiệm Nhà Thi Đấu COURTX!')")
code = code.replace("alert('Đang mở bản đồ tới Nhà thi đấu COURTX...')", "showAlert('Chỉ đường', 'Đang mở bản đồ Google Maps tới Nhà thi đấu COURTX...')")
code = code.replace("alert('Vui lòng nhập đầy đủ Họ tên và Số điện thoại!');", "showAlert('Thiếu thông tin', 'Vui lòng nhập đầy đủ Họ tên và Số điện thoại!');")
code = code.replace("alert('Vui lòng liên hệ chủ sân để hỗ trợ huỷ. Hotline: 0912 345 678');", "showAlert('Không thể hủy vé', 'Vé của bạn sắp đến giờ thi đấu (dưới 24h). Vui lòng liên hệ chủ sân để được hỗ trợ.\\n\\nHotline: 0912 345 678');")
code = code.replace("alert('Hệ thống đã chọn lại môn ' + ticket.sport + '. Vui lòng chọn ngày và giờ mới!');", "showAlert('Đặt lại vé', 'Hệ thống đã chọn lại môn ' + ticket.sport + '. Vui lòng chọn ngày và giờ thi đấu mới!');")

# 4. Replace confirm block
confirm_old = """if (window.confirm('Bạn có chắc chắn muốn hủy vé này?')) {
        alert('Hủy vé thành công! Tiền sẽ được hoàn lại theo chính sách.');
        setLookupResult({ ...ticket, status: 'ĐÃ HỦY' });
      }"""
confirm_new = """showConfirm('Xác nhận hủy vé', 'Bạn có chắc chắn muốn hủy vé này không? Hành động này không thể hoàn tác.', () => {
        showAlert('Hủy vé thành công', 'Tiền sẽ được hoàn lại vào tài khoản của bạn theo quy định.');
        setLookupResult({ ...ticket, status: 'ĐÃ HỦY' });
      });"""
code = code.replace(confirm_old, confirm_new)

open('src/pages/TrangChu.tsx', 'w', encoding='utf-8').write(code)
print("Popups implemented!")
