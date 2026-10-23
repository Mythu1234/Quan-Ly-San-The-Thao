import { ArrowLeft, Search, User as UserIcon, LogOut } from 'lucide-react';

interface AdminHeaderProps {
  title?: string;
  onBack?: () => void;
  onSearchClick?: () => void;
  onLogout?: () => void;
  showSearch?: boolean;
}

export default function AdminHeader({
  title,
  onBack,
  onSearchClick,
  onLogout,
  showSearch = true,
}: AdminHeaderProps) {
  // If title & onBack are provided -> Render Detail/Sub-screen header (e.g. Image 1, Image 3)
  if (title && onBack) {
    return (
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <h1 className="text-base font-black tracking-tight text-slate-900 uppercase">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
              <UserIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Default Main Hub Header (Image 2)
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md shadow-xs">
      <div className="flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-slate-900 leading-none">
              COURT<span className="text-emerald-600">X</span>
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mt-0.5">
              Nhà thi đấu đa năng
            </span>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-2">
          {showSearch && (
            <button
              type="button"
              onClick={onSearchClick}
              className="flex h-8 px-3 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 text-xs font-bold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 active:scale-95 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>Tra cứu</span>
            </button>
          )}

          <div
            title="Tài khoản Quản trị viên"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs"
          >
            <UserIcon className="w-4 h-4 stroke-[2.2]" />
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Đăng xuất quản trị"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition active:scale-95 cursor-pointer ml-0.5"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
