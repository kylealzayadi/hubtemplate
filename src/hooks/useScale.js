import { useState, useCallback } from 'react';

export function useScale() {
  const [scale, setScale] = useState(() => {
    const saved = parseInt(localStorage.getItem('hub_scale') || '100', 10);
    document.body.style.zoom = saved / 100;
    return saved;
  });

  const applyScale = useCallback((val) => {
    const n = parseInt(val, 10);
    document.body.style.zoom = n / 100;
    localStorage.setItem('hub_scale', n);
    setScale(n);
  }, []);

  return { scale, applyScale };
}
