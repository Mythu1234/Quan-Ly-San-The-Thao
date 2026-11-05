import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  FileSpreadsheet,
  Check,
  Info,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import {
  cancellationWorkflowService,
  CATEGORY_META,
  CANCELLATION_UPDATED_EVENT,
} from '../../services/cancellationWorkflowService';
import type {
  CancellationRecord,
  CancelCategory,
} from '../../services/cancellationWorkflowService';

// Metric Card chuẩn theo phong cách của WalletRevenueView
function DashboardMetricCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: 'emerald' | 'slate' | 'amber';
}) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-800',
    slate: 'bg-slate-100 text-slate-700',
    amber: 'bg-amber-100 text-amber-800',
  };

  return (
    <article className="w-[min(75vw,260px)] shrink-0 snap-start rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4 @4xl:w-auto @4xl:flex-1 @4xl:basis-0">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold text-slate-600">{label}</p>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tones[tone]} [&>svg]:h-4 [&>svg]:w-4`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 break-words text-[clamp(1.2rem,3.4vw,1.6rem)] font-black leading-tight tracking-tight text-slate-950 tabular-nums">
        {value}
      </p>
      <p className="mt-1.5 text-[11px] leading-4 text-slate-500">{detail}</p>
    </article>
  );
}

export default function CancellationWorkflowDashboard() {
  const [records, setRecords] = useState<CancellationRecord[]>(() =>
    cancellationWorkflowService.getAll()
  );
  const [analytics, setAnalytics] = useState(() =>
    cancellationWorkflowService.getAnalytics()
  );
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<CancellationRecord | null>(null);
  const [manualCategory, setManualCategory] = useState<CancelCategory>('PERSONAL');

  // Cài đặt Webhook (collapsible)
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [webhookUrl, setWebhookUrl] = useState<string>(() =>
    cancellationWorkflowService.getWebhookUrl()
  );
  const [isTestingWebhook, setIsTestingWebhook] = useState<boolean>(false);
  const [webhookMessage, setWebhookMessage] = useState<{
    success: boolean;
    text: string;
  } | null>(null);

  const reloadData = () => {
    setRecords(cancellationWorkflowService.getAll());
    setAnalytics(cancellationWorkflowService.getAnalytics());
  };

  useEffect(() => {
    window.addEventListener(CANCELLATION_UPDATED_EVENT, reloadData);
    return () => window.removeEventListener(CANCELLATION_UPDATED_EVENT, reloadData);
  }, []);

  const filteredRecords = records.filter((r) => {
    const matchCat = filterCategory === 'all' || r.category === filterCategory;
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchCat && matchStatus;
  });

  const handleSaveWebhook = () => {
    cancellationWorkflowService.setWebhookUrl(webhookUrl);
    setWebhookMessage({ success: true, text: 'Đã lưu đường dẫn Webhook thành công!' });
    setTimeout(() => setWebhookMessage(null), 3000);
  };

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    setWebhookMessage(null);
    const result = await cancellationWorkflowService.testWebhookConnection(webhookUrl);
    setWebhookMessage({ success: result.success, text: result.message });
    setIsTestingWebhook(false);
  };


  const handleConfirmManualReview = () => {
    if (!selectedRecord) return;
    cancellationWorkflowService.confirmManually(selectedRecord.id, manualCategory);
    setSelectedRecord(null);
    reloadData();
  };

  return (
    <div className="space-y-5">
      {/* 1. Header chuẩn phong cách Thống kê Đặt sân & Doanh thu */}
      <header className="flex min-w-0 flex-col gap-4 @4xl:flex-row @4xl:items-end @4xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <RotateCcw className="h-3.5 w-3.5 text-emerald-700" />
            Phân tích đơn hủy sân · Tự động hóa
          </div>
          <h1 className="mt-1.5 text-lg font-black tracking-tight text-slate-950 @4xl:text-xl">
            Phân tích & Thống kê lý do hủy sân
          </h1>
          <p className="mt-1 max-w-2xl text-[11px] leading-4 text-slate-500">
            Tổng hợp nguyên nhân khách hủy lịch, tự động phân nhóm và hỗ trợ nhân viên xử lý nhanh chóng.
          </p>
        </div>

        <div className="no-scrollbar flex min-w-0 flex-nowrap items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 @4xl:shrink-0">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`inline-flex h-8.5 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer ${
              showSettings
                ? 'border-emerald-700 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-700" />
            <span>Kết nối Webhook</span>
            {showSettings ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          <a
            href="https://docs.google.com/spreadsheets/d/138a9mHm83_76ACHKy8WHlGtT94uWzPB5t_nh7HDGp8U/edit?usp=drivesdk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8.5 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-emerald-800 bg-emerald-800 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 whitespace-nowrap"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Google Sheet</span>
            <ExternalLink className="h-3 w-3 opacity-70" />
          </a>

          <button
            type="button"
            onClick={reloadData}
            className="inline-flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Cấu hình Webhook (Thu gọn tinh tế khi cần) */}
      {showSettings && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 sm:p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Đường dẫn Webhook kết nối hệ thống
            </h3>
            <span className="text-[11px] text-slate-500">
              Dán URL từ n8n hoặc API backend để tự động đồng bộ sang Google Sheets & Gmail.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="http://localhost:5678/webhook/cancel-classify hoặc URL n8n Cloud..."
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
            <button
              type="button"
              onClick={handleSaveWebhook}
              className="rounded-lg border border-slate-300 bg-white hover:bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              Lưu URL
            </button>
            <button
              type="button"
              onClick={handleTestWebhook}
              disabled={isTestingWebhook}
              className="rounded-lg bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 px-3.5 py-2 text-xs font-bold text-white transition active:scale-95 cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
            >
              {isTestingWebhook ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Đang kiểm tra...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" /> Kiểm tra kết nối
                </>
              )}
            </button>
          </div>

          {webhookMessage && (
            <div
              className={`rounded-lg p-2.5 text-xs font-medium flex items-center gap-2 ${
                webhookMessage.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              <Info className="h-4 w-4 shrink-0 text-emerald-700" />
              <span>{webhookMessage.text}</span>
            </div>
          )}
        </div>
      )}

      {/* 3. Chỉ 3 thẻ số liệu chính - Cuộn ngang mượt mà trên mobile, mở rộng trên desktop */}
      <section
        aria-label="Số liệu thống kê hủy sân"
        className="no-scrollbar flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1"
      >
        <DashboardMetricCard
          icon={<RotateCcw />}
          label="Tổng lượt hủy sân"
          value={new Intl.NumberFormat('vi-VN').format(analytics.total)}
          detail="Toàn bộ yêu cầu khách báo hủy"
          tone="slate"
        />
        <DashboardMetricCard
          icon={<CheckCircle2 />}
          label="Đã nhận diện tự động"
          value={`${analytics.autoApproved + analytics.manuallyApproved} đơn (${analytics.autoRate}%)`}
          detail="Hệ thống tự động phân loại & lưu trữ"
          tone="emerald"
        />
        <DashboardMetricCard
          icon={<AlertTriangle />}
          label="Cần nhân viên xử lý"
          value={`${analytics.needReview} đơn (${analytics.reviewRate}%)`}
          detail="Lý do chưa rõ, nhân viên cần xác nhận"
          tone="amber"
        />
      </section>

      {/* 4. Khung phân bổ lý do hủy sân - Chiếm trọn chiều ngang, gọn gàng và cân đối */}
      <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold tracking-tight text-slate-900">
              Phân bổ lý do hủy sân
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Tỷ lệ phần trăm và số lượng đơn theo từng nhóm lý do.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
            <span className="h-2 w-2 rounded-sm bg-emerald-700" />
            Tỷ lệ %
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 pt-1">
          {analytics.categoryStats.map((item) => (
            <div key={item.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span>{item.icon}</span>
                  <span className="text-slate-900 font-bold">{item.name}</span>
                </span>
                <span className="tabular-nums font-bold text-slate-900">
                  {item.percent}%{' '}
                  <span className="font-normal text-slate-400">({item.count} đơn)</span>
                </span>
              </div>
              {/* Thanh đo chuẩn tone xanh ngọc CourtX */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-700 transition-all duration-500"
                  style={{ width: `${Math.max(item.percent, 3)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Bảng danh sách đơn hủy - Chuẩn table của WalletRevenueView */}
      <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold tracking-tight text-slate-900">
              Danh sách yêu cầu hủy sân
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Theo dõi chi tiết lý do khách hủy sân và quyết định nhóm phân loại cho các trường hợp chưa rõ.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="all">Tất cả lý do</option>
              <option value="WEATHER">🌧️ Thời tiết</option>
              <option value="PERSONAL">💼 Khách bận việc</option>
              <option value="LACK_OF_PLAYERS">👥 Thiếu người chơi</option>
              <option value="WRONG_BOOKING">📅 Đặt nhầm lịch</option>
              <option value="COURT_ISSUE">⚡ Sự cố tại sân</option>
              <option value="OTHER">❓ Lý do khác</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="DA_PHAN_LOAI_TU_DONG">Tự động</option>
              <option value="CHO_NHAN_VIEN_XAC_NHAN">Cần xem xét</option>
              <option value="DA_XAC_NHAN_THU_CONG">Đã xác nhận</option>
            </select>
          </div>
        </div>

        {/* Bảng dữ liệu */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider font-extrabold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 whitespace-nowrap">Thời gian & Mã</th>
                <th className="px-3 py-2.5 whitespace-nowrap">Khách hàng & Sân</th>
                <th className="px-3 py-2.5">Lý do khách báo</th>
                <th className="px-3 py-2.5 whitespace-nowrap">Nhóm lý do</th>
                <th className="px-3 py-2.5 whitespace-nowrap">Trạng thái</th>
                <th className="px-3 py-2.5 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-400">
                    Không tìm thấy đơn hủy phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const meta = CATEGORY_META[r.category] || CATEGORY_META.OTHER;
                  const isAuto = r.status === 'DA_PHAN_LOAI_TU_DONG';
                  const isPending = r.status === 'CHO_NHAN_VIEN_XAC_NHAN';

                  return (
                    <tr
                      key={r.id}
                      onClick={() => {
                        setSelectedRecord(r);
                        setManualCategory(r.category);
                      }}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                      title="Bấm để xem chi tiết đơn hủy này"
                    >
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">{r.id}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(r.created_at).toLocaleDateString('vi-VN')}{' '}
                          {new Date(r.created_at).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      <td className="px-3 py-2.5">
                        <div className="font-bold text-slate-800">{r.customer_name}</div>
                        <div className="text-[11px] text-slate-500 whitespace-nowrap">
                          {r.customer_phone} · {r.court_name}
                        </div>
                      </td>

                      <td className="px-3 py-2.5 max-w-xs sm:max-w-md">
                        <p className="text-slate-800 font-medium truncate" title={r.cancel_reason}>
                          "{r.cancel_reason}"
                        </p>
                      </td>

                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          <span>{meta.icon}</span>
                          <span>{meta.name}</span>
                        </span>
                      </td>

                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {isAuto ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Tự động
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-700" /> Cần xem xét
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                            <Check className="w-3 h-3 text-slate-600" /> Đã xác nhận
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        {isPending ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRecord(r);
                              setManualCategory(r.category);
                            }}
                            className="rounded-lg bg-emerald-800 hover:bg-emerald-900 px-3 py-1 text-[11px] font-bold text-white transition active:scale-95 cursor-pointer shadow-sm"
                          >
                            Quyết định
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRecord(r);
                              setManualCategory(r.category);
                            }}
                            className="text-slate-500 hover:text-emerald-800 text-[11px] font-semibold underline cursor-pointer"
                          >
                            Chi tiết
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Modal Chi tiết & Quyết định phân loại */}
      {selectedRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900">
                Quyết định nhóm lý do hủy sân
              </h3>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Mã đơn:</span>
                <span className="font-mono font-bold text-slate-900">{selectedRecord.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Khách hàng:</span>
                <span className="font-bold text-slate-900">
                  {selectedRecord.customer_name} ({selectedRecord.customer_phone})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Sân đặt:</span>
                <span className="font-bold text-slate-900">{selectedRecord.court_name}</span>
              </div>
              <div className="pt-1 border-t border-slate-200">
                <span className="text-slate-500 block mb-1 font-medium">Lý do khách nhập:</span>
                <p className="rounded-lg bg-white border border-slate-200 p-2.5 font-semibold text-slate-800 leading-relaxed">
                  "{selectedRecord.cancel_reason}"
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block">
                Chọn nhóm lý do phù hợp:
              </label>
              <select
                value={manualCategory}
                onChange={(e) => setManualCategory(e.target.value as CancelCategory)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-800 focus:border-emerald-600 focus:outline-none"
              >
                <option value="WEATHER">🌧️ Thời tiết (Mưa, ngập...)</option>
                <option value="PERSONAL">💼 Khách bận việc đột xuất</option>
                <option value="LACK_OF_PLAYERS">👥 Không đủ người chơi</option>
                <option value="WRONG_BOOKING">📅 Đặt nhầm lịch</option>
                <option value="COURT_ISSUE">⚡ Sự cố tại sân</option>
                <option value="OTHER">❓ Lý do khác</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleConfirmManualReview}
                className="rounded-xl bg-emerald-800 py-2.5 text-xs font-bold text-white hover:bg-emerald-900 transition active:scale-95 shadow-sm cursor-pointer"
              >
                Lưu quyết định
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
