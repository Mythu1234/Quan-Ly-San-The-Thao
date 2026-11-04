import { createBookingReceiptImage } from './bookingReceiptImage';

export interface BookingReceiptData {
  bookingCode: string;
  paymentCode: string;
  customerName: string;
  customerPhone: string;
  sport: string;
  court: string;
  date: string;
  time: string;
  total: string;
}

const escapeHtml = (value: string) => String(value || '—').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]!);

export function renderBookingReceipt(data: BookingReceiptData, issuedAt = new Date()) {
  const row = (label: string, value: string, code = false) => `<div class="row"><dt>${label}</dt><dd${code ? ' class="code"' : ''}>${escapeHtml(value)}</dd></div>`;
  const issued = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'medium' }).format(issuedAt);
  return `<!doctype html>
<html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Biên nhận ${escapeHtml(data.bookingCode)} · COURTX</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#f1f5f9;color:#172033;font:12px/1.4 Arial,Helvetica,sans-serif;padding:14px 10px}
article{max-width:400px;margin:auto;background:white;border:1px solid #dce7e4;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px #0f172a0a}
.header{padding:14px 18px;background:#047857;color:white}.brand{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.logo{display:grid;place-items:center;width:30px;height:30px;background:white;color:#047857;border-radius:9px;font-size:19px;font-weight:800}
.brand strong{font-size:17px;letter-spacing:-.4px}.brand small{display:block;color:#d1fae5;font-size:8px;letter-spacing:.8px}
.header h1{margin:0;font-size:18px;letter-spacing:-.4px}.header p{margin:3px 0 0;color:#d1fae5;font-size:10px}
.body{padding:14px 18px}.status{display:inline-block;border:1px solid #a7f3d0;background:#ecfdf5;color:#047857;border-radius:999px;padding:3px 8px;font-size:10px;font-weight:bold;margin-bottom:8px}
dl{margin:0}.row{display:grid;grid-template-columns:110px minmax(0,1fr);gap:10px;align-items:baseline;padding:5px 0}
dt{color:#64748b;font-size:11px}dd{margin:0;text-align:right;font-weight:600;overflow-wrap:anywhere}.code{font-family:Consolas,monospace;color:#047857}
.divider{height:1px;background:#e7eeec;margin:8px 0}
.amount{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px;padding:10px;background:#ecfdf5;border:1px solid #d1fae5;border-radius:10px;margin-top:10px}
.amount span{font-size:10px;font-weight:bold}.amount strong{color:#047857;font-size:20px;letter-spacing:-.6px}
.note{margin:10px 0 0;padding:8px;border:1px solid #fde68a;background:#fffbeb;border-radius:8px;color:#92400e;font-size:10px}
.footer{border-top:1px dashed #dce7e4;padding:10px 16px;text-align:center;color:#64748b;font-size:9px}.footer p{margin:2px 0}
.actions{max-width:400px;margin:10px auto;text-align:center}button{border:0;border-radius:8px;padding:8px 14px;background:#047857;color:white;font:600 11px Arial;cursor:pointer}button:hover{background:#065f46}.hint{color:#64748b;font-size:10px;margin:5px 0}
@media(max-width:360px){.header,.body{padding:12px}.row{grid-template-columns:95px minmax(0,1fr);gap:8px}.amount strong{font-size:18px}}
@page{size:A5 portrait;margin:10mm}@media print{body{padding:0;background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact}article{width:100%;max-width:400px;box-shadow:none;break-inside:avoid;border-radius:12px}.actions{display:none}}
</style></head><body>
<article>
<header class="header"><div class="brand"><span class="logo">C</span><div><strong>COURTX</strong><small>NHÀ THI ĐẤU ĐA NĂNG</small></div></div><h1>Biên nhận đặt sân</h1><p>Thông tin xác nhận thanh toán và nhận sân</p></header>
<main class="body"><span class="status">✓ Đã thanh toán thành công</span><dl>
${row('Mã đặt sân / Vé', data.bookingCode, true)}${row('Mã thanh toán', data.paymentCode, true)}
</dl><div class="divider"></div><dl>
${row('Khách hàng', data.customerName)}${row('Số điện thoại', data.customerPhone)}${row('Bộ môn', data.sport)}${row('Sân thi đấu', data.court)}${row('Ngày chơi', data.date)}${row('Khung giờ', data.time)}${row('Phương thức', 'VietQR (100%)')}
</dl><div class="amount"><span>Tổng tiền đã thanh toán</span><strong>${escapeHtml(data.total)}</strong></div>
<p class="note">Vui lòng lưu hoặc xuất trình biên nhận này khi đến nhận sân tại COURTX.</p></main>
<footer class="footer"><p>Đường số 6, An Hải, Đà Nẵng · Hotline: 0838 598 626</p><p>Xuất biên nhận: ${escapeHtml(issued)}</p><p>Cảm ơn quý khách đã lựa chọn COURTX!</p></footer>
</article><div class="actions"><button type="button" onclick="window.print()">In / Lưu PDF</button><p class="hint">Chọn “Lưu dưới dạng PDF” trong cửa sổ in để lưu biên nhận PDF.</p></div>
</body></html>`;
}

export function downloadBookingReceipt(data: BookingReceiptData) {
  try {
    createBookingReceiptImage(data).toBlob(blob => {
      if (!blob) { window.alert('Chưa tạo được ảnh biên nhận. Vui lòng thử lại.'); return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Bien-Nhan-${data.bookingCode.replace(/[^a-zA-Z0-9_-]/g, '') || 'COURTX'}.png`;
      document.body.appendChild(link);
      link.click();link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  } catch {
    window.alert('Chưa tạo được ảnh biên nhận. Vui lòng thử lại.');
  }
}

export function printBookingReceipt(data: BookingReceiptData) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) { window.alert('Vui lòng cho phép mở cửa sổ mới để in biên nhận.'); return; }
  printWindow.opener = null;
  printWindow.document.write(renderBookingReceipt(data));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
