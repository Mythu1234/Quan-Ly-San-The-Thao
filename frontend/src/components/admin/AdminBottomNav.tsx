import { LayoutGrid, Users, CalendarClock, Wallet } from 'lucide-react';

export type AdminTab = 'lich_san' | 'nhan_vien' | 'ca_truc' | 'vi_thu';

interface AdminBottomNavProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export default function AdminBottomNav({ activeTab, onTabChange }: AdminBottomNavProps) {
  const tabs = [
    {
      id: 'lich_san' as AdminTab,
      label: 'LỊCH SÂN',
      icon: LayoutGrid,
    },
    {
      id: 'nhan_vien' as AdminTab,
      label: 'NHÂN VIÊN',
      icon: Users,
    },
    {
      id: 'ca_truc' as AdminTab,
      label: 'CA TRỰC',
      icon: CalendarClock,
    },
    {
      id: 'vi_thu' as AdminTab,
      label: 'VÍ & THU',
      icon: Wallet,
    }
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-2 py-2">
      <div className="grid grid-cols-4 items-center justify-around text-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={[
                'flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95 cursor-pointer',
                isActive
                  ? 'text-emerald-700 font-black'
                  : 'text-slate-400 hover:text-slate-700 font-semibold',
              ].join(' ')}
            >
              <div className={['p-1 rounded-xl transition', isActive ? 'bg-emerald-50 text-emerald-700' : ''].join(' ')}>
                <Icon className={['w-5 h-5', isActive ? 'stroke-[2.5]' : 'stroke-2'].join(' ')} />
              </div>
              <span className="text-[10px] tracking-tight whitespace-nowrap uppercase">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
