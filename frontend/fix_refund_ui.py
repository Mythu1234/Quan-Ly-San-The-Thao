import re

code = open('src/pages/TrangChu.tsx', encoding='utf-8').read()

# Try to find:
# <div className="flex justify-between"><span className="text-slate-500">Tổng tiền:</span> <span className="font-bold text-slate-900">{lookupResult.total}</span></div>
# </div>

pattern = r'(<div className="flex justify-between"><span className="text-slate-500">[^<]*</span> <span className="font-bold text-slate-900">\{lookupResult\.total\}</span></div>)\s*(</div>)'

replacement = r'''\1
                    {lookupResult.status === 'ĐÃ HỦY' && (
                      <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1.5">
                        <span className="text-slate-500">Hoàn tiền:</span> 
                        <span className={'font-black ' + (lookupResult.paymentStatus === 'ĐÃ HOÀN TIỀN' ? 'text-emerald-600' : 'text-amber-500')}>
                          {lookupResult.paymentStatus || 'ĐANG XỬ LÝ HOÀN TIỀN'}
                        </span>
                      </div>
                    )}
                  \2'''

new_code = re.sub(pattern, replacement, code)
open('src/pages/TrangChu.tsx', 'w', encoding='utf-8').write(new_code)
print("Details injected")
