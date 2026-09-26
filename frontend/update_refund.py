import re

code = open('src/pages/TrangChu.tsx', encoding='utf-8').read()

# 1. Handle confirmation prompt change
confirm_old = """showConfirm('Xác nhận hủy vé', 'Bạn có chắc chắn muốn hủy vé này không? Hành động này không thể hoàn tác.', () => {
        showAlert('Hủy vé thành công', 'Tiền sẽ được hoàn lại vào tài khoản của bạn theo quy định.');
        setLookupResult({ ...ticket, status: 'ĐÃ HỦY' });
      });"""
confirm_new = """showConfirm('Xác nhận hủy vé', 'Bạn có chắc chắn muốn hủy vé này không? Hành động này không thể hoàn tác.', () => {
        showAlert('Đã gửi yêu cầu hoàn tiền', 'Hệ thống đã tiếp nhận yêu cầu hủy vé.\\n\\nVui lòng đợi xử lý trong vòng 24h và kiểm tra trạng thái hoàn tiền tại mục Tra cứu thông tin đặt sân.');
        setLookupResult({ ...ticket, status: 'ĐÃ HỦY', paymentStatus: 'ĐANG XỬ LÝ HOÀN TIỀN' });
      });"""
code = code.replace(confirm_old, confirm_new)

# 2. Add 'ĐÃ HOÀN TIỀN' mock button
mock_old = """<button type="button" onClick={() => { setHasSearched(true); setLookupResult({
                    code: '#CX-99999', sport: 'Cầu Lông', court: 'Sân Cầu Lông 2', name: 'Nguyễn Văn An', phone: '0912345678', date: '30/09/2026', time: '09:00 - 10:30', total: '180.000đ', status: 'ĐÃ XÁC NHẬN', hoursUntilStart: 48, sportId: 'badminton'
                }); }} className="rounded-xl bg-slate-100 p-2 text-center font-bold text-slate-700 active:scale-95 hover:bg-slate-200">
                  Vé tuần sau (&gt; 24h)
                </button>
              </div>"""
mock_new = """<button type="button" onClick={() => { setHasSearched(true); setLookupResult({
                    code: '#CX-99999', sport: 'Cầu Lông', court: 'Sân Cầu Lông 2', name: 'Nguyễn Văn An', phone: '0912345678', date: '30/09/2026', time: '09:00 - 10:30', total: '180.000đ', status: 'ĐÃ XÁC NHẬN', hoursUntilStart: 48, sportId: 'badminton'
                }); }} className="rounded-xl bg-slate-100 p-2 text-center font-bold text-slate-700 active:scale-95 hover:bg-slate-200">
                  Vé tuần sau (&gt; 24h)
                </button>
                <button type="button" onClick={() => { setHasSearched(true); setLookupResult({
                    code: '#CX-77777', sport: 'Bóng Chuyền', court: 'Sân Bóng Chuyền 1', name: 'Nguyễn Văn An', phone: '0912345678', date: '20/09/2026', time: '08:00 - 09:30', total: '300.000đ', status: 'ĐÃ HỦY', paymentStatus: 'ĐÃ HOÀN TIỀN', hoursUntilStart: -24, sportId: 'volleyball'
                }); }} className="col-span-2 rounded-xl bg-red-50 border border-red-100 p-2 text-center font-bold text-red-600 active:scale-95 hover:bg-red-100">
                  Vé mẫu Đã Hủy & Hoàn Tiền
                </button>
              </div>"""
code = code.replace(mock_old, mock_new)

# 3. Update status badge rendering
badge_old = """<span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-700 border border-emerald-200">
                      {lookupResult.status}
                    </span>"""
badge_new = """<span className={'rounded-full px-2.5 py-0.5 text-[10px] font-black border ' + (lookupResult.status === 'ĐÃ HỦY' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200')}>
                      {lookupResult.status}
                    </span>"""
code = code.replace(badge_old, badge_new)

# 4. Add refund status to ticket details
details_old = """<div className="flex justify-between"><span className="text-slate-500">Tổng tiền:</span> <span className="font-bold text-slate-900">{lookupResult.total}</span></div>
                  </div>"""
details_new = """<div className="flex justify-between"><span className="text-slate-500">Tổng tiền:</span> <span className="font-bold text-slate-900">{lookupResult.total}</span></div>
                    {lookupResult.status === 'ĐÃ HỦY' && (
                      <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1.5">
                        <span className="text-slate-500">Hoàn tiền:</span> 
                        <span className={'font-black ' + (lookupResult.paymentStatus === 'ĐÃ HOÀN TIỀN' ? 'text-emerald-600' : 'text-amber-500')}>
                          {lookupResult.paymentStatus || 'ĐANG XỬ LÝ HOÀN TIỀN'}
                        </span>
                      </div>
                    )}
                  </div>"""
code = code.replace(details_old, details_new)

open('src/pages/TrangChu.tsx', 'w', encoding='utf-8').write(code)
print("Refund feature implemented!")
