import re

code = open('src/pages/TrangChu.tsx', encoding='utf-8').read()

# Fix the broken className and structure
# I'll just find and replace the badly interpolated code block.
bad_block = """            <div className={`mt-6 grid gap-3  === 'confirm' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {popup.type === 'confirm' && ("""
good_block = """            <div className={`mt-6 grid gap-3 ${popup.type === 'confirm' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {popup.type === 'confirm' && ("""
              
code = code.replace(bad_block, good_block)

# Let me check if there's any other bad `${...}`
# Actually, the best way is to re-inject properly.
# The previous injection was:
old_jsx_injection = """
      {/* 🟣 CUSTOM POPUP */}
      {popup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center border border-slate-100">
            <h3 className="text-lg font-black text-slate-900">{popup.title}</h3>
            <p className="mt-2 text-sm text-slate-600 whitespace-pre-line leading-relaxed">{popup.message}</p>
            
            <div className={`mt-6 grid gap-3  === 'confirm' ? 'grid-cols-2' : 'grid-cols-1'}`}>
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

new_jsx_injection = """
      {/* 🟣 CUSTOM POPUP */}
      {popup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center border border-slate-100">
            <h3 className="text-lg font-black text-slate-900">{popup.title}</h3>
            <p className="mt-2 text-sm text-slate-600 whitespace-pre-line leading-relaxed">{popup.message}</p>
            
            <div className={'mt-6 grid gap-3 ' + (popup.type === 'confirm' ? 'grid-cols-2' : 'grid-cols-1')}>
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

code = code.replace(old_jsx_injection, new_jsx_injection)

# Wait, if there was another error at line 984, I should just wipe the old popup block and re-add.
# Let's use re to remove the corrupted block.
code = re.sub(r'\{\/\* 🟣 CUSTOM POPUP \*\/\}[\s\S]*?\{\/\* 🟡 MODAL THANH TOÁN', new_jsx_injection + '\n      {/* 🟡 MODAL THANH TOÁN', code)

open('src/pages/TrangChu.tsx', 'w', encoding='utf-8').write(code)
print("Popups Fixed!")
