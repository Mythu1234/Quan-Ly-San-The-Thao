import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle2, Landmark, ShieldCheck, ArrowRight, XCircle, AlertCircle } from 'lucide-react';

export default function MobilePaymentSimulator() {
  const [params, setParams] = useState<{
    sessionId: string;
    court: string;
    amount: string;
    phone: string;
    time: string;
    name: string;
  }>({
    sessionId: '',
    court: '',
    amount: '0',
    phone: '',
    time: '',
    name: '',
  });

  const [status, setStatus] = useState<'idle' | 'confirming' | 'success' | 'cancelled'>('idle');
  const [bankRef, setBankRef] = useState<string>('');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sId = searchParams.get('session') || searchParams.get('sessionId') || `VQR_${Date.now()}`;
    const court = searchParams.get('court') || 'Sân CL-01';
    const amount = searchParams.get('amount') || '120000';
    const phone = searchParams.get('phone') || '0835702603';
    const time = searchParams.get('time') || 'Khung giờ tiêu chuẩn';
    const name = searchParams.get('name') || 'Khách hàng CourtX';

    setParams({
      sessionId: sId,
      court,
      amount,
      phone,
      time,
      name,
    });
  }, []);

  const handleConfirmPaymentOnPhone = async () => {
    setStatus('confirming');
    const autoRef = `MB${Date.now().toString().slice(-8)}`;
    setBankRef(autoRef);

    // 1. Gửi tín hiệu Broadcast qua Supabase Realtime Channel
    try {
      const channel = supabase.channel(`payment_session_${params.sessionId}`);
      await channel.subscribe();
      await channel.send({
        type: 'broadcast',
        event: 'PAYMENT_CONFIRMED',
        payload: {
          sessionId: params.sessionId,
          bankRef: autoRef,
          amount: params.amount,
          confirmedAt: Date.now(),
        },
      });
    } catch (err) {
      console.warn('Lỗi gửi realtime Supabase:', err);
    }

    // 2. Ghi vào localStorage (phục vụ nếu test cùng trình duyệt/tab)
    try {
      localStorage.setItem(`courtx_confirmed_${params.sessionId}`, JSON.stringify({
        confirmed: true,
        bankRef: autoRef,
        timestamp: Date.now(),
      }));
    } catch {
      // ignore
    }

    // Đổi trạng thái hiển thị trên điện thoại
    setTimeout(() => {
      setStatus('success');
    }, 400);
  };

  const handleCancelOnPhone = async () => {
    setStatus('cancelled');
    try {
      const channel = supabase.channel(`payment_session_${params.sessionId}`);
      await channel.subscribe();
      await channel.send({
        type: 'broadcast',
        event: 'PAYMENT_CANCELLED',
        payload: {
          sessionId: params.sessionId,
          cancelledAt: Date.now(),
        },
      });
    } catch {
      // ignore
    }
  };

  const numAmount = Number(params.amount.replace(/\D/g, '')) || 120000;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-3 sm:p-6 font-sans antialiased text-slate-800">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Header App Ngân Hàng */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-4 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
                <Landmark className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-blue-200">MB BANK MOBILE</p>
                <p className="text-[9px] text-blue-300">Chuyển tiền nhanh 24/7 (VietQR)</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black text-emerald-300 border border-emerald-400/30">
              MÔ PHỎNG
            </span>
          </div>
        </div>

        {/* Nội dung giao diện điện thoại */}
        {status === 'success' ? (
          <div className="p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 border border-emerald-300">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-900">CHUYỂN TIỀN THÀNH CÔNG!</h2>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {numAmount.toLocaleString('vi-VN')} VND
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Mã giao dịch: <strong className="font-mono text-slate-800">{bankRef}</strong>
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-left text-xs space-y-2 text-emerald-900">
              <div className="flex justify-between">
                <span className="text-emerald-700">Người nhận:</span>
                <span className="font-bold">COURTX ARENA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-700">Dịch vụ:</span>
                <span className="font-bold">{params.court}</span>
              </div>
              <div className="flex justify-between border-t border-emerald-200/60 pt-1.5">
                <span className="text-emerald-700">Trạng thái web:</span>
                <span className="font-black text-emerald-700">✓ Đã đồng bộ sang máy tính</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Màn hình trên máy tính đã tự động nhận diện thanh toán thành công và chuyển sang biên nhận đặt sân.
            </p>

            <button
              type="button"
              onClick={() => window.close()}
              className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 py-3 text-xs font-bold text-slate-700 transition"
            >
              Đóng trang mô phỏng
            </button>
          </div>
        ) : status === 'cancelled' ? (
          <div className="p-6 text-center space-y-4 animate-in fade-in duration-150">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <XCircle className="h-7 w-7" />
            </div>
            <h2 className="text-base font-black text-slate-900">GIAO DỊCH ĐÃ BỊ HỦY</h2>
            <p className="text-xs text-slate-600">
              Bạn đã chọn hủy chuyển tiền. Màn hình máy tính sẽ ghi nhận hủy thao tác.
            </p>
            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-bold text-white transition"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Thẻ số tiền */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-center">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Số tiền thanh toán</p>
              <p className="text-2xl font-black text-blue-700 mt-1">
                {numAmount.toLocaleString('vi-VN')} VND
              </p>
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-100/70 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
                <ShieldCheck className="h-3 w-3" /> Chuyển khoản VietQR an toàn 100%
              </div>
            </div>

            {/* Chi tiết đơn */}
            <div className="space-y-2 rounded-2xl bg-white border border-slate-200 p-3.5 text-xs">
              <div className="flex justify-between items-start">
                <span className="text-slate-500">Người thụ hưởng:</span>
                <span className="font-extrabold text-slate-900 text-right">COURTX ARENA</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Số tài khoản:</span>
                <span className="font-mono font-bold text-slate-900">0835702603 (MB Bank)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Sân đặt:</span>
                <span className="font-bold text-emerald-700">{params.court}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Khung giờ:</span>
                <span className="font-medium text-slate-700">{params.time}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                <span className="text-slate-500">Nội dung CK:</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                  CX {params.court.replace(/\s+/g, '')} {params.phone.replace(/\D/g, '')}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                Bấm nút bên dưới để mô phỏng bạn đã hoàn tất chuyển tiền trên ứng dụng ngân hàng của điện thoại.
              </span>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={status === 'confirming'}
                onClick={handleConfirmPaymentOnPhone}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 py-3.5 text-xs font-black text-white shadow-lg shadow-emerald-600/30 active:scale-98 transition cursor-pointer"
              >
                {status === 'confirming' ? (
                  <span>Đang ghi nhận...</span>
                ) : (
                  <>
                    <span>XÁC NHẬN CHUYỂN TIỀN</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCancelOnPhone}
                className="w-full rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-98 transition"
              >
                Hủy giao dịch
              </button>
            </div>
          </div>
        )}

        <div className="bg-slate-50 border-t border-slate-100 p-2.5 text-center text-[10px] text-slate-400">
          CourtX Sports Arena · Hệ thống thanh toán giả lập di động
        </div>
      </div>
    </div>
  );
}

