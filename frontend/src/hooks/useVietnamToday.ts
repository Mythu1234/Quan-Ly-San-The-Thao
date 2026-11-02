import { useEffect, useState } from 'react';

export const getVietnamToday = (instant = new Date()) => {
  const vietnam = new Date(instant.getTime() + 7 * 60 * 60 * 1000);
  return new Date(vietnam.getUTCFullYear(), vietnam.getUTCMonth(), vietnam.getUTCDate());
};

export default function useVietnamToday() {
  const [today, setToday] = useState(getVietnamToday);

  useEffect(() => {
    const refresh = () => {
      const next = getVietnamToday();
      setToday((previous) => previous.getTime() === next.getTime() ? previous : next);
    };
    const onVisibility = () => { if (!document.hidden) refresh(); };
    const timer = window.setInterval(refresh, 1000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisibility);
    refresh();
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return today;
}
