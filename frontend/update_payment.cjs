const fs = require('fs');
const filePath = 'src/pages/TrangChu.tsx';
let code = fs.readFileSync(filePath, 'utf8');

if (!code.includes('const [showPayment')) {
  code = code.replace(
    /const \[isSubmitted, setIsSubmitted\] = useState<boolean>\(false\);/,
    "const [isSubmitted, setIsSubmitted] = useState<boolean>(false);\n  const [showPayment, setShowPayment] = useState<boolean>(false);"
  );
}

const oldSubmitLogic = /const handleBookingSubmit = \(e: React\.FormEvent\) => \{[\s\S]*?setIsSubmitted\(true\);\s*\};/;
const newSubmitLogic = "const handleBookingSubmit = (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!customerName.trim() || !customerPhone.trim()) {\n      alert('Vui lòng nhập đầy đủ Họ tên và Số điện thoại!');\n      return;\n    }\n    setShowPayment(true);\n  };\n\n  const simulatePaymentSuccess = () => {\n    const randomCode = 'CX-' + Math.floor(10000 + Math.random() * 90000);\n    setOrderCode(randomCode);\n    setShowPayment(false);\n    setIsSubmitted(true);\n  };";
code = code.replace(oldSubmitLogic, newSubmitLogic);

code = code.replace(
  /\{\/\* ⚡ BƯỚC 6: CHUYỂN KHOẢN VIETQR & NÚT XÁC NHẬN \*\/\}[\s\S]*?<\/form>/,
  "{/* SUBMIT BUTTON */}\n            <button\n              type=\"submit\"\n              className=\"mt-6 w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-600 active:scale-95\"\n            >\n              TIẾN HÀNH THANH TOÁN\n            </button>\n          </form>"
);

const paymentModal = "      {/* 🟡 MODAL THANH TOÁN (PAYMENT BOTTOM SHEET) */}\n      {showPayment && (\n        <div className=\"fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-300\">\n          <div className=\"w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-300 flex flex-col items-center\">\n            <div className=\"w-12 h-1.5 bg-slate-200 rounded-full mb-4 sm:hidden\"></div>\n            \n            <h3 className=\"text-lg font-black text-slate-900 uppercase tracking-wide\">Thanh toán đơn hàng</h3>\n            <p className=\"text-xs text-slate-500 mt-1 mb-4 text-center\">Quét mã VietQR bằng ứng dụng ngân hàng</p>\n\n            <div className=\"w-full rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 p-5 relative overflow-hidden text-center\">\n              <div className=\"flex justify-between items-center mb-3\">\n                 <p className=\"font-extrabold text-slate-900 text-sm\">MB BANK</p>\n                 <span className=\"rounded bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700\">VIETQR</span>\n              </div>\n              \n              <div className=\"mx-auto h-40 w-40 bg-white rounded-xl p-2 border border-slate-200 shadow-sm relative flex items-center justify-center\">\n                <div className=\"grid grid-cols-4 gap-1.5 w-full h-full p-2 bg-slate-100 rounded\">\n                  {Array.from({ length: 16 }).map((_, idx) => (\n                    <div key={idx} className={'rounded ' + (idx % 3 === 0 ? 'bg-emerald-500' : 'bg-slate-800')}></div>\n                  ))}\n                </div>\n                <div className=\"absolute inset-0 flex items-center justify-center\">\n                   <span className=\"bg-white text-emerald-600 px-3 py-1 font-black text-xs rounded-full shadow-md uppercase border border-emerald-100\">COURTX</span>\n                </div>\n              </div>\n\n              <div className=\"mt-4 space-y-1 text-xs\">\n                <p className=\"text-slate-500\">Số tiền thanh toán:</p>\n                <p className=\"text-2xl font-black text-emerald-600\">{formattedPrice}</p>\n                <p className=\"text-slate-500 mt-2\">Nội dung chuyển khoản:</p>\n                <p className=\"font-mono font-bold text-slate-900 bg-white py-1 rounded border border-slate-200 uppercase\">CX {selectedCourt.replace(/ /g, '')} {customerPhone}</p>\n              </div>\n            </div>\n\n            <div className=\"mt-6 flex flex-col items-center gap-2\">\n               <div className=\"relative flex h-10 w-10 items-center justify-center\">\n                 <span className=\"absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75\"></span>\n                 <span className=\"relative inline-flex h-6 w-6 rounded-full bg-emerald-500 items-center justify-center\">\n                   <span className=\"h-2 w-2 bg-white rounded-full\"></span>\n                 </span>\n               </div>\n               <p className=\"text-xs font-bold text-emerald-600\">Đang lắng nghe giao dịch...</p>\n               <p className=\"text-[10px] text-slate-400\">Tự động xác nhận khi có biến động số dư</p>\n            </div>\n\n            <div className=\"w-full mt-6 grid grid-cols-2 gap-3\">\n              <button onClick={() => setShowPayment(false)} type=\"button\" className=\"rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer active:scale-95\">Hủy giao dịch</button>\n              <button onClick={simulatePaymentSuccess} type=\"button\" className=\"rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer active:scale-95\">Mô phỏng Đã CK</button>\n            </div>\n          </div>\n        </div>\n      )}\n";

if (!code.includes('MODAL THANH TOÁN')) {
  code = code.replace(
    /\{\/\* ======================================================== \*\/\}\s*\{\/\* 🔴 MODAL XÁC NHẬN ĐẶT SÂN/,
    paymentModal + '\n      {/* ======================================================== */}\n      {/* 🔴 MODAL XÁC NHẬN ĐẶT SÂN'
  );
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Payment flow updated!');
