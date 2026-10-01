import React from 'react';
import { Hammer } from 'lucide-react';
import type { Transaction } from '../../types/admin';

interface WalletRevenueViewProps {
  transactions: Transaction[];
  onProcessRefund: (txId: string, bankRef: string) => void;
}

export default function WalletRevenueView({
  transactions,
  onProcessRefund,
}: WalletRevenueViewProps) {
  return (
    <div className="flex-1 space-y-4 p-4 pb-28 animate-in fade-in duration-200">
      {/* 🟢 Top Badge */}
      <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 border border-slate-200">
        <span className="h-2 w-2 rounded-full bg-slate-400" />
        VÍ DOANH THU & ĐỐI SOÁT
      </div>

      {/* 🟢 Title */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
          VÍ TIỀN <span className="text-slate-500">& THU CHI</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Đối soát giao dịch Napas247 VietQR và thực hiện lệnh hoàn tiền theo quy chế.
        </p>
      </div>

      {/* 🟢 Under Development State */}
      <div className="mt-8 flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 shadow-sm text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
          <Hammer className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-black text-slate-800">Tính năng đang phát triển</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto font-medium">
          Phân hệ Ví & Doanh Thu hiện đang được tích hợp cổng thanh toán và đối soát tự động. Vui lòng quay lại sau!
        </p>
      </div>
    </div>
  );
}
