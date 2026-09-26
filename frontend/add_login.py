import re

code = open('src/pages/TrangChu.tsx', encoding='utf-8').read()

# 1. Imports
# We need to ensure User, Lock, Eye, Bell, Key, ArrowLeft are imported.
# Find the lucide-react import line:
import_match = re.search(r"import \{([^}]+)\} from 'lucide-react';", code)
if import_match:
    current_imports = import_match.group(1)
    new_icons = ['User', 'Lock', 'Eye', 'Bell', 'Key', 'ArrowLeft']
    for icon in new_icons:
        if icon not in current_imports:
            current_imports += f", {icon}"
    code = code.replace(import_match.group(0), f"import {{{current_imports}}} from 'lucide-react';")

# 2. State injection
state_code = """  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
"""
code = code.replace("const [showOTP, setShowOTP] = useState<boolean>(false);", "const [showOTP, setShowOTP] = useState<boolean>(false);\n" + state_code)

# 3. Modify Avatar Button
avatar_old = """<div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-extrabold text-xs shadow-xs">
              AN
            </div>"""
avatar_new = """<button type="button" onClick={() => setShowLogin(true)} className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-extrabold text-xs shadow-xs hover:bg-emerald-200 active:scale-95 transition cursor-pointer">
              AN
            </button>"""
code = code.replace(avatar_old, avatar_new)
# Fallback in case spacing differs
code = re.sub(r'<div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-extrabold text-xs shadow-xs">\s*AN\s*</div>', avatar_new, code)

# 4. Inject Login Screen JSX
login_jsx = """
      {/* 🟢 LOGIN SCREEN OVERLAY */}
      {showLogin && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-50 animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-y-auto">
          {/* Header */}
          <header className="flex items-center justify-between px-4 py-4 bg-white border-b border-slate-200 sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 border border-emerald-100">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v6" />
                  <path d="M6 8l6-6 6 6" />
                  <path d="M4 14l4-6h8l4 6" />
                  <circle cx="12" cy="18" r="3" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">COURTX</h1>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-1">Nhà thi đấu đa năng</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-slate-500" />
              <button 
                onClick={() => setShowLogin(false)}
                className="rounded-full bg-[#00c853] px-3.5 py-2 text-[10px] font-black uppercase text-white shadow-sm flex items-center gap-1 active:scale-95 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> TRANG CHỦ
              </button>
            </div>
          </header>

          {/* Content */}
          <div className="p-5 flex-1 flex flex-col max-w-md mx-auto w-full">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
              ĐĂNG NHẬP HỆ THỐNG
            </h2>
            
            {/* Banner */}
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              <div className="flex h-10 w-12 items-center justify-center rounded-xl bg-slate-900 text-white flex-shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-slate-800">Dành cho chủ sân và nhân viên tại sân</p>
            </div>

            {/* Form Card */}
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="space-y-4">
                {/* Username */}
                <div>
                  <label className="mb-1.5 block text-xs font-black text-slate-700 uppercase tracking-wider">
                    Tài khoản <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                      <User className="w-5 h-5" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Nhập tên tài khoản" 
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="mb-1.5 block text-xs font-black text-slate-700 uppercase tracking-wider">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="••••••••" 
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition tracking-widest"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <label className="flex items-center gap-2.5 pt-2 pb-1 cursor-pointer">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-[#00c853] text-white flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <span className="text-sm font-medium text-slate-700">Ghi nhớ đăng nhập trên thiết bị này</span>
                </label>

                {/* Submit Button */}
                <button 
                  type="button"
                  onClick={() => showAlert('Chưa hoàn thiện', 'Tính năng đăng nhập sẽ được nối với Backend trong các phiên bản tới!')}
                  className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-[#00c853] py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-500 active:scale-95"
                >
                  ĐĂNG NHẬP HỆ THỐNG <Zap className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
"""
code = code.replace("{/* 🟣 CUSTOM POPUP", login_jsx + "\n      {/* 🟣 CUSTOM POPUP")

open('src/pages/TrangChu.tsx', 'w', encoding='utf-8').write(code)
print("Login Screen Implemented!")
