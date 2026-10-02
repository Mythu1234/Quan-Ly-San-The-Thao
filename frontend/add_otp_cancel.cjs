const fs = require('fs');
let code = fs.readFileSync('src/pages/TrangChu.tsx', 'utf8');

// 1. Add otpAction state
const stateMarker = `const [otpError, setOtpError] = useState<boolean>(false);`;
if (!code.includes('otpAction')) {
    code = code.replace(stateMarker, `${stateMarker}\n  const [otpAction, setOtpAction] = useState<'booking' | 'cancel'>('booking');`);
}

// 2. Update handleBookingSubmit to set otpAction
const bookingSubmitStr = `setShowOTP(true);
    setOtpInput('');
    setOtpError(false);`;
code = code.replace(bookingSubmitStr, `setOtpAction('booking');\n    setShowOTP(true);\n    setOtpInput('');\n    setOtpError(false);`);

// 3. Update handleCancelTicket
// Need to replace the else block inside handleCancelTicket
const oldCancelRegex = /const handleCancelTicket = \(ticket: any\) => \{[\s\S]*?\}\s*\};\s*const handleTabChange/m;
if (code.match(oldCancelRegex)) {
    const newCancelStr = `const handleCancelTicket = (ticket: any) => {
    if (ticket.hoursUntilStart <= 24) {
      showAlert('Không thể hủy vé', 'Vé của bạn sắp đến giờ thi đấu (dưới 24h). Vui lòng liên hệ chủ sân để được hỗ trợ.\\n\\nHotline: 0912 345 678');
    } else {
      setOtpAction('cancel');
      setShowOTP(true);
      setOtpInput('');
      setOtpError(false);
    }
  };

  const handleTabChange`;
    code = code.replace(oldCancelRegex, newCancelStr);
} else {
    // If handleTabChange isn't right after, just replace the block itself
    const fallbackCancel = /const handleCancelTicket = \(ticket: any\) => \{[\s\S]*?\}\s*\};/;
    code = code.replace(fallbackCancel, `const handleCancelTicket = (ticket: any) => {
    if (ticket.hoursUntilStart <= 24) {
      showAlert('Không thể hủy vé', 'Vé của bạn sắp đến giờ thi đấu (dưới 24h). Vui lòng liên hệ chủ sân để được hỗ trợ.\\n\\nHotline: 0912 345 678');
    } else {
      setOtpAction('cancel');
      setShowOTP(true);
      setOtpInput('');
      setOtpError(false);
    }
  };`);
}

// 4. Update handleVerifyOTP
const verifyOTPRegex = /const handleVerifyOTP = \(\) => \{[\s\S]*?setShowPayment\(true\);\s*\} else \{\s*setOtpError\(true\);\s*\}\s*\};/;
const newVerifyOTP = `const handleVerifyOTP = () => {
    if (otpInput === '123456') {
      setShowOTP(false);
      if (otpAction === 'booking') {
        setShowPayment(true);
      } else {
        showAlert('Đã gửi yêu cầu hoàn tiền', 'Hệ thống đã tiếp nhận yêu cầu hủy vé.\\n\\nVui lòng đợi xử lý trong vòng 24h và kiểm tra trạng thái hoàn tiền tại mục Tra cứu thông tin đặt sân.');
        setLookupResult(prev => prev ? { ...prev, status: 'ĐÃ HỦY', paymentStatus: 'ĐANG XỬ LÝ HOÀN TIỀN' } : null);
      }
    } else {
      setOtpError(true);
    }
  };`;
code = code.replace(verifyOTPRegex, newVerifyOTP);

// 5. Update OTP modal text
const otpTextRegex = /Mã xác thực đã được gửi đến số điện thoại <strong className="text-slate-900">\{customerPhone\}<\/strong>/;
const newOtpText = `{otpAction === 'cancel' ? 'Mã xác thực hủy vé đã được gửi đến số điện thoại' : 'Mã xác thực đã được gửi đến số điện thoại'} <strong className="text-slate-900">{otpAction === 'cancel' ? lookupResult?.phone : customerPhone}</strong>`;
code = code.replace(otpTextRegex, newOtpText);

fs.writeFileSync('src/pages/TrangChu.tsx', code, 'utf8');
console.log("OTP Cancellation flow updated!");
