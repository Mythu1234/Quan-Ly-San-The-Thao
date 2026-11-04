import { useEffect, useState } from 'react';
import TrangChu from './pages/TrangChu';
import MobilePaymentSimulator from './components/MobilePaymentSimulator';

export default function App() {
  const [isPhonePaymentView, setIsPhonePaymentView] = useState<boolean>(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const view = searchParams.get('view');
    const path = window.location.pathname;

    if (view === 'phone-payment' || path.includes('xac-nhan-thanh-toan') || path.includes('mobile-payment')) {
      setIsPhonePaymentView(true);
    }
  }, []);

  if (isPhonePaymentView) {
    return <MobilePaymentSimulator />;
  }

  return (
    <div className="min-h-screen bg-slate-200 px-0 py-0 text-slate-900 antialiased">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-white shadow-2xl ring-1 ring-slate-300 overflow-x-clip">
        <TrangChu />
      </div>
    </div>
  );
}
