import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BellRing,
  CheckCircle2,
  Circle,
  Clock3,
  Info,
  ListChecks,
  Lock,
  Settings,
  Trophy,
  Volleyball,
} from 'lucide-react';

type AdminSetupReminderPageProps = {
  onBack: () => void;
};

const setupTasks = [
  {
    title: 'Tháo dỡ 4 cột và lưới cầu lông',
    description: 'Thu gọn cọc căng lưới vào kho vật tư số 2',
    checked: true,
  },
  {
    title: 'Kéo trụ và căng lưới bóng chuyền',
    description: 'Căn chuẩn chiều cao thi đấu tiêu chuẩn 2m43',
    checked: true,
  },
  {
    title: 'Kiểm tra vạch biên sân gộp',
    description: 'Làm sạch sân và kiểm tra độ bám dính vạch kẻ cam',
    checked: true,
  },
  {
    title: 'Kiểm tra bóng thi đấu & ghế trọng tài',
    description: 'Bố trí 02 quả bóng Molten đạt áp suất và lau ghế quan sát',
    checked: false,
  },
];

export default function AdminSetupReminderPage({ onBack }: AdminSetupReminderPageProps) {
  const [checkedTasks, setCheckedTasks] = useState(() => setupTasks.map((task) => task.checked));
  const completedCount = useMemo(() => checkedTasks.filter(Boolean).length, [checkedTasks]);

  const toggleTask = (index: number) => {
    setCheckedTasks((current) => current.map((checked, itemIndex) => (itemIndex === index ? !checked : checked)));
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[#f7f6ff] px-3 py-3">
      <button
        type="button"
        onClick={onBack}
        className="mb-3 flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[11px] font-black text-slate-700 shadow-sm ring-1 ring-slate-200 active:scale-95"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Quay lại lịch sân
      </button>

      <section className="mb-3 overflow-hidden rounded-xl bg-gradient-to-r from-amber-700 to-orange-700 p-4 text-white shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <BellRing className="h-5 w-5" />
            </span>
            <h2 className="text-[20px] font-black uppercase leading-tight tracking-tight">Setup chuyển đổi sân</h2>
          </div>
          <span className="shrink-0 rounded-full bg-white px-4 py-2 text-center text-[12px] font-black uppercase leading-none text-amber-800 shadow-sm">
            Còn 25
            <br />
            phút
          </span>
        </div>

        <div className="mt-3 space-y-2 rounded-lg bg-black/15 p-3">
          <div className="flex items-start justify-between gap-3 text-white/90">
            <span className="flex shrink-0 items-center gap-1.5 text-[13px] font-semibold">
              <Volleyball className="h-4 w-4" />
              Khu vực thao tác:
            </span>
            <span className="text-right text-[17px] font-black leading-tight text-white">Cụm sân 1-4 (Sân 01 - Sân 04)</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-white/90">
            <span className="flex shrink-0 items-center gap-1.5 text-[13px] font-semibold">
              <Clock3 className="h-4 w-4" />
              Hạn chót hoàn thành:
            </span>
            <span className="text-right text-[17px] font-black text-white">Trước 09:30</span>
          </div>
        </div>

        <p className="mt-3 flex items-start gap-1.5 text-[13px] font-medium leading-snug text-white/85">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          Lịch chơi bóng chuyền (Trận phong trào) bắt đầu lúc 09:30.
        </p>
      </section>

      <section className="mb-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-[18px] font-black text-slate-900">Cấu Hình Chuyển Đổi</h3>
          <span className="shrink-0 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black uppercase text-white">Sân gộp đa năng</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-indigo-50 p-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-emerald-700">
                <Settings className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase text-slate-500">Hiện tại</p>
                <p className="truncate text-[17px] font-black leading-tight text-slate-900">4 Sân Cầu Lông Độc Lập</p>
                <p className="text-[12px] font-semibold text-slate-500">Sân 01, Sân 02, Sân 03, Sân 04</p>
              </div>
            </div>
            <span className="text-xl font-black text-slate-300">→</span>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 p-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white">
                <Volleyball className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase text-emerald-700">Mục tiêu chuyển đổi</p>
                <p className="truncate text-[17px] font-black leading-tight text-slate-900">1 Sân Bóng Chuyền (BC1)</p>
                <p className="text-[12px] font-semibold text-slate-500">Mặt sân tiêu chuẩn liên cụm 1-4</p>
              </div>
            </div>
            <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-700" />
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-lg bg-indigo-50/80 p-3">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="text-[12px] font-black leading-snug text-slate-800">Tự động khóa 4 sân vật lý (Sân 01, Sân 02, Sân 03, Sân 04)</p>
            <p className="mt-0.5 text-[12px] font-medium leading-snug text-slate-500">Chặn toàn bộ lịch đặt mới để tránh xung đột lịch trình.</p>
          </div>
        </div>
      </section>

      <section className="mb-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-1.5 text-[18px] font-black text-slate-900">
            <ListChecks className="h-5 w-5 text-emerald-700" />
            Danh Mục Việc Cần Làm
          </h3>
          <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-black text-slate-700">
            {completedCount}/4 Đạt
          </span>
        </div>
        <p className="mb-3 text-[13px] font-medium leading-relaxed text-slate-500">
          Nhân viên bắt buộc kiểm tra và đánh dấu thực tế trước khi xác nhận mở sân.
        </p>

        <div className="space-y-2">
          {setupTasks.map((task, index) => {
            const checked = checkedTasks[index];

            return (
              <button
                key={task.title}
                type="button"
                onClick={() => toggleTask(index)}
                className="flex w-full items-start gap-3 rounded-lg bg-indigo-50 p-3 text-left transition active:scale-[0.99]"
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded ${
                    checked ? 'bg-emerald-700 text-white' : 'bg-white text-slate-400 ring-1 ring-slate-300'
                  }`}
                >
                  {checked ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-black leading-snug text-slate-900">{task.title}</span>
                  <span className="mt-1 block text-[13px] font-medium leading-relaxed text-slate-500">{task.description}</span>
                </span>
                {checked ? <Settings className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /> : <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-[12px] font-black uppercase text-slate-500">Trạng thái hiện tại</span>
          <span className="flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-[11px] font-black text-orange-800">
            <span className="h-2 w-2 rounded-full bg-orange-600" />
            Đang tiến hành Setup...
          </span>
        </div>

        <button
          type="button"
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 text-[15px] font-black uppercase text-white shadow-sm active:scale-[0.99]"
        >
          <CheckCircle2 className="h-5 w-5" />
          Xác nhận sân đã sẵn sàng
        </button>
        <button
          type="button"
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-indigo-50 px-3 text-[15px] font-black text-red-600 active:scale-[0.99]"
        >
          <AlertTriangle className="h-5 w-5" />
          Báo lỗi / Cần thêm thời gian
        </button>
      </section>

      <div className="flex items-center justify-center gap-1 pb-2 text-[10px] font-semibold text-slate-400">
        <Trophy className="h-3.5 w-3.5" />
        Quy trình setup sân gộp BC1
      </div>
    </div>
  );
}
