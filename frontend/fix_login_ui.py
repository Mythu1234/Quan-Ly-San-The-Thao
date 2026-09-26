import re

code = open('src/pages/TrangChu.tsx', encoding='utf-8').read()

# 1. Fix Modals to be constrained within the mobile frame
# For Login screen
code = code.replace(
    '<div className="fixed inset-0 z-[100] flex flex-col bg-slate-50 animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-y-auto">',
    '<div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md flex flex-col bg-slate-50 animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-y-auto shadow-2xl border-x border-slate-200">'
)

# For other modals (OTP, Payment)
code = code.replace(
    'className="fixed inset-0 z-50 flex items-end',
    'className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 flex items-end'
)

# For custom popup
code = code.replace(
    'className="fixed inset-0 z-[60] flex items-center',
    'className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[60] flex items-center'
)

# 2. Fix Color (replace #00c853 with emerald-500)
code = code.replace('bg-[#00c853]', 'bg-emerald-500')
code = code.replace('text-[#00c853]', 'text-emerald-500')

# 3. Fix Font
code = code.replace(
    '<h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter" style={{ fontFamily: \'Impact, Arial Black, sans-serif\' }}>',
    '<h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">'
)

open('src/pages/TrangChu.tsx', 'w', encoding='utf-8').write(code)
print("Fixes applied!")
