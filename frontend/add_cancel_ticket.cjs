const fs = require('fs');
const filePath = 'src/pages/TrangChu.tsx';
let code = fs.readFileSync(filePath, 'utf8');

const oldLookupResult = /setLookupResult\(\{\s*code: '#CX-88291',[\s\S]*?paymentStatus: 'Đã thanh toán qua VietQR',\s*\}\);/;
const newLookupResult = "setLookupResult({\n        code: '#CX-88291',\n        name: 'Nguyễn Văn An',\n        phone: '0912345678',\n        sport: 'Bóng Đá',\n        court: 'Sân Bóng Đá 1',\n        date: '28/09/2026',\n        time: '18:00 - 19:30 (1.5 giờ)',\n        total: '450.000đ',\n        status: 'ĐÃ XÁC NHẬN',\n        paymentStatus: 'Đã thanh toán qua VietQR',\n        hoursUntilStart: 12,\n        sportId: 'football'\n      });";
code = code.replace(oldLookupResult, newLookupResult);

const logicToInject = "\n  const handleCancelTicket = (ticket: any) => {\n    if (ticket.hoursUntilStart <= 24) {\n      alert('Vui lòng liên hệ chủ sân để hỗ trợ huỷ. Hotline: 0912 345 678');\n    } else {\n      if (window.confirm('Bạn có chắc chắn muốn hủy vé này?')) {\n        alert('Hủy vé thành công! Tiền sẽ được hoàn lại theo chính sách.');\n        setLookupResult({ ...ticket, status: 'ĐÃ HỦY' });\n      }\n    }\n  };\n\n  const handleRebook = (ticket: any) => {\n    setSelectedSportId(ticket.sportId);\n    handleTabChange('booking');\n    alert('Hệ thống đã chọn lại môn ' + ticket.sport + '. Vui lòng chọn ngày và giờ mới!');\n  };\n";

code = code.replace(
  /return \(\s*<div className="flex min-h-screen/,
  logicToInject + '\n  return (\n    <div className="flex min-h-screen'
);

const oldButtons = /<div className="flex gap-2 pt-2 border-t border-slate-100">[\s\S]*?<\/div>\s*<\/div>\s*\) : \(/;
const newButtons = "<div className=\"flex gap-2 pt-2 border-t border-slate-100\">\n                  <button type=\"button\" onClick={() => handleRebook(lookupResult)} className=\"flex-1 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-white hover:bg-emerald-600 active:scale-95 transition\">\n                    Đặt lại vé\n                  </button>\n                  <button \n                    type=\"button\" \n                    onClick={() => handleCancelTicket(lookupResult)} \n                    disabled={lookupResult.status === 'ĐÃ HỦY'}\n                    className={'flex-1 rounded-xl border py-2.5 text-xs font-bold active:scale-95 transition ' + (lookupResult.status === 'ĐÃ HỦY' ? 'border-slate-200 text-slate-400 bg-slate-50' : 'border-red-200 text-red-600 hover:bg-red-50')}\n                  >\n                    {lookupResult.status === 'ĐÃ HỦY' ? 'Đã hủy' : 'Hủy vé'}\n                  </button>\n                </div>\n              </div>\n            ) : (";
code = code.replace(oldButtons, newButtons);

const oldDemoBlock = /<div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2 text-xs shadow-xs">[\s\S]*?<\/div>/;
const newDemoBlock = "<div className=\"rounded-2xl border border-slate-200 bg-white p-4 space-y-3 text-xs shadow-xs\">\n              <div className=\"flex items-center justify-between text-slate-500\">\n                <span className=\"font-bold\">ĐƠN HÀNG MẪU:</span>\n              </div>\n              <div className=\"grid grid-cols-2 gap-2\">\n                <button type=\"button\" onClick={() => setLookupResult({\n                    code: '#CX-11111', sport: 'Bóng Đá', court: 'Sân Bóng Đá 1', name: 'Nguyễn Văn An', phone: '0912345678', date: '26/09/2026', time: '14:00 - 15:30', total: '450.000đ', status: 'ĐÃ XÁC NHẬN', hoursUntilStart: 12, sportId: 'football'\n                })} className=\"rounded-xl bg-slate-100 p-2 text-center font-bold text-slate-700 active:scale-95 hover:bg-slate-200\">\n                  Vé sắp đá (&lt; 24h)\n                </button>\n                <button type=\"button\" onClick={() => setLookupResult({\n                    code: '#CX-99999', sport: 'Cầu Lông', court: 'Sân Cầu Lông 2', name: 'Nguyễn Văn An', phone: '0912345678', date: '30/09/2026', time: '09:00 - 10:30', total: '180.000đ', status: 'ĐÃ XÁC NHẬN', hoursUntilStart: 48, sportId: 'badminton'\n                })} className=\"rounded-xl bg-slate-100 p-2 text-center font-bold text-slate-700 active:scale-95 hover:bg-slate-200\">\n                  Vé tuần sau (&gt; 24h)\n                </button>\n              </div>\n            </div>";
code = code.replace(oldDemoBlock, newDemoBlock);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Cancel and Rebook logic added!');
