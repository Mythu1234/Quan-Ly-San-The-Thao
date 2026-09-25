import TrangChu from './pages/TrangChu';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-200 px-0 py-0 text-slate-900 antialiased">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-white shadow-2xl ring-1 ring-slate-300 overflow-x-hidden">
        <TrangChu />
      </div>
    </div>
  );
}