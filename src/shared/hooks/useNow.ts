import { useEffect, useState } from 'react';

/** Текущее время, обновляется раз в 30 секунд — чтобы кнопка «Подключиться» включалась сама */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
