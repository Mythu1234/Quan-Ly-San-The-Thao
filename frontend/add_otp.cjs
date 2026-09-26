const fs = require('fs');
const filePath = 'src/pages/TrangChu.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add OTP States
if (!code.includes('const [showOTP')) {
  code = code.replace(
    /const \[showPayment, setShowPayment\] = useState<boolean>\(false\);/,
    "const [showPayment, setShowPayment] = useState<boolean>(false);\n  const [showOTP, setShowOTP] = useState<boolean>(false);\n  const [otpInput, setOtpInput] = useState<string>('');\n  const [otpError, setOtpError] = useState<boolean>(false);"
  );
}

// 2. Update handleBookingSubmit to show OTP instead of Payment
const oldSubmitLogic = "setShowPayment(true);";
const newSubmitLogic = "setShowOTP(true);\n    setOtpInput('');\n    setOtpError(false);";
if (!code.includes('setShowOTP(true);')) {
    // Only replace inside handleBookingSubmit
    code = code.replace(
        /const handleBookingSubmit = \(e: React\.FormEvent\) => \{[\s\S]*?setShowPayment\(true\);\s*\};/,
        "const handleBookingSubmit = (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!customerName.trim() || !customerPhone.trim()) {\n      alert('Vui lòng nhập đầy đủ Họ tên và Số điện thoại!');\n      return;\n    }\n    " + newSubmitLogic + "\n  };\n\n  const handleVerifyOTP = () => {\n    if (otpInput === '123456') {\n      setShowOTP(false);\n      setShowPayment(true);\n    } else {\n      setOtpError(true);\n    }\n  };"
    );
}

// 3. Inject OTP Modal
const otpModal = "      {/* 🟠 MODAL XÁC THỰC OTP */}\n      {showOTP && (\n        <div className=\"fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-300\">\n          <div className=\"w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-300 flex flex-col items-center\">\n            <div className=\"w-12 h-1.5 bg-slate-200 rounded-full mb-4 sm:hidden\"></div>\n            \n            <div className=\"mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600\">\n              <Phone className=\"h-6 w-6\" />\n            </div>\n            \n            <h3 className=\"text-lg font-black text-slate-900 uppercase tracking-wide\">Xác thực OTP</h3>\n            <p className=\"text-xs text-slate-500 mt-1 mb-4 text-center\">\n              Vui lòng nhập mã gồm 6 chữ số được gửi đến số điện thoại <br/>\n              <strong className=\"text-slate-800\">{customerPhone}</strong>\n            </p>\n\n            <div className=\"w-full space-y-4\">\n              <div>\n                <input\n                  type=\"text\"\n                  maxLength={6}\n                  value={otpInput}\n                  onChange={(e) => {\n                    setOtpInput(e.target.value.replace(/[^0-9]/g, ''));\n                    setOtpError(false);\n                  }}\n                  placeholder=\"Nhập mã OTP (Mẫu: 123456)\"\n                  className={w-full text-center text-2xl tracking-widest font-mono font-black rounded-xl border  px-4 py-3 outline-none transition focus:border-emerald-500}\n                />\n                {otpError && <p className=\"mt-2 text-center text-[10px] font-bold text-red-500\">Mã OTP không chính xác. Vui lòng thử lại!</p>}\n              </div>\n\n              <div className=\"grid grid-cols-2 gap-3 mt-2\">\n                <button onClick={() => setShowOTP(false)} type=\"button\" className=\"rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer active:scale-95\">Quay lại</button>\n                <button onClick={handleVerifyOTP} type=\"button\" className=\"rounded-xl bg-emerald-500 py-3 text-xs font-bold text-white hover:bg-emerald-600 cursor-pointer active:scale-95\">Xác nhận</button>\n              </div>\n            </div>\n          </div>\n        </div>\n      )}\n\n";

if (!code.includes('MODAL XÁC THỰC OTP')) {
  code = code.replace(
    /\{\/\* 🟡 MODAL THANH TOÁN/,
    otpModal + '      {/* 🟡 MODAL THANH TOÁN'
  );
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('OTP flow added!');
