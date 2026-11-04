import type { BookingReceiptData } from './bookingReceipt';

/** Draw text directly so the downloaded receipt needs no external images or fonts. */
export function createBookingReceiptImage(data: BookingReceiptData, issuedAt = new Date()) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw Error('Trình duyệt chưa hỗ trợ tạo ảnh biên nhận.');
  const width = 400, padding = 20, right = width - padding, lineHeight = 17;
  const font = (size: number, bold = false) => { context.font = `${bold ? 600 : 400} ${size}px Arial, Helvetica, sans-serif`; };
  const wrap = (value: string, maxWidth: number) => {
    const lines: string[] = [];
    let line = '';
    for (const char of String(value || '—')) {
      if (char === '\n') { lines.push(line); line = ''; continue; }
      if (line && context.measureText(line + char).width > maxWidth) { lines.push(line.trimEnd()); line = ''; }
      line += char;
    }
    lines.push(line);
    return lines;
  };
  const fields = [
    ['Mã đặt sân / Vé', data.bookingCode], ['Mã thanh toán', data.paymentCode],
    ['Khách hàng', data.customerName], ['Số điện thoại', data.customerPhone],
    ['Bộ môn', data.sport], ['Sân thi đấu', data.court], ['Ngày chơi', data.date],
    ['Khung giờ', data.time], ['Phương thức', 'VietQR (100%)'],
  ];
  font(12, true);
  const rows = fields.map(([label, value]) => ({ label, lines: wrap(value, 215) }));
  font(20, true);
  const totalLines = wrap(data.total, width - padding * 2 - 24);
  const amountHeight = 31 + totalLines.length * 25;
  const rowsHeight = rows.reduce((height, row) => height + Math.max(26, row.lines.length * lineHeight + 9), 0) + 12;
  const amountTop = 155 + rowsHeight;
  const noteTop = amountTop + amountHeight + 12;
  const footerTop = noteTop + 52;
  const height = footerTop + 65;
  // Render at 2x resolution while keeping a compact 400px layout.
  canvas.width = width * 2;
  canvas.height = height * 2;
  context.scale(2, 2);
  context.textBaseline = 'top';
  const box = (x: number, y: number, w: number, h: number, color: string, radius = 10) => {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + w, y, x + w, y + h, radius);
    context.arcTo(x + w, y + h, x, y + h, radius);
    context.arcTo(x, y + h, x, y, radius);
    context.arcTo(x, y, x + w, y, radius);
    context.closePath();context.fillStyle = color;context.fill();
  };
  const text = (value: string, x: number, y: number, size = 12, color = '#172033', bold = false, align: CanvasTextAlign = 'left') => {
    font(size, bold);context.fillStyle = color;context.textAlign = align;context.fillText(value, x, y);
  };
  const divider = (y: number) => { context.fillStyle = '#e7eeec';context.fillRect(padding, y, width - padding * 2, 1); };
  context.fillStyle = '#ffffff';context.fillRect(0, 0, width, height);
  context.fillStyle = '#047857';context.fillRect(0, 0, width, 110);
  box(padding, 16, 30, 30, '#ffffff', 8);
  text('C', padding + 8, 20, 21, '#047857', true);
  text('COURTX', padding + 40, 17, 18, '#ffffff', true);
  text('NHÀ THI ĐẤU ĐA NĂNG', padding + 40, 39, 8, '#d1fae5');
  text('Biên nhận đặt sân', padding, 65, 20, '#ffffff', true);
  text('Thông tin xác nhận thanh toán và nhận sân', padding, 90, 10, '#d1fae5');
  box(padding, 125, 190, 23, '#ecfdf5', 11);
  text('✓ Đã thanh toán thành công', padding + 9, 131, 11, '#047857', true);
  let y = 155;
  rows.forEach((row, index) => {
    if (index === 2) { divider(y + 2);y += 12; }
    text(row.label, padding, y + 5, 11, '#64748b');
    row.lines.forEach((line, lineIndex) => text(line, right, y + 5 + lineIndex * lineHeight, 12, index < 2 ? '#047857' : '#172033', true, 'right'));
    y += Math.max(26, row.lines.length * lineHeight + 9);
  });
  box(padding, amountTop, width - padding * 2, amountHeight, '#ecfdf5');
  text('Tổng tiền đã thanh toán', padding + 12, amountTop + 9, 10, '#172033', true);
  totalLines.forEach((line, index) => text(line, right - 12, amountTop + 26 + index * 25, 20, '#047857', true, 'right'));
  box(padding, noteTop, width - padding * 2, 42, '#fffbeb', 8);
  text('Vui lòng lưu hoặc xuất trình biên nhận này', padding + 10, noteTop + 8, 10, '#92400e');
  text('khi đến nhận sân tại COURTX.', padding + 10, noteTop + 23, 10, '#92400e');
  divider(footerTop);
  const issued = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'medium' }).format(issuedAt);
  text('Đường số 6, An Hải, Đà Nẵng · Hotline: 0838 598 626', width / 2, footerTop + 12, 9, '#64748b', false, 'center');
  text(`Xuất biên nhận: ${issued}`, width / 2, footerTop + 28, 9, '#64748b', false, 'center');
  text('Cảm ơn quý khách đã lựa chọn COURTX!', width / 2, footerTop + 44, 9, '#64748b', false, 'center');
  return canvas;
}
