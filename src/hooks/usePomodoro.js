import { useState, useRef, useCallback, useEffect } from 'react';

const POM = { work: 20 * 60, break: 5 * 60 };

export function usePomodoro() {
  const [mode, setMode]           = useState('work');
  const [remaining, setRemaining] = useState(POM.work);
  const [running, setRunning]     = useState(false);
  const [sessions, setSessions]   = useState(0);
  const [everStarted, setEverStarted] = useState(false);
  const intervalRef               = useRef(null);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
  }, []);

  const switchMode = useCallback((newMode) => {
    stop();
    setMode(newMode);
    setRemaining(POM[newMode]);
    setEverStarted(false);
  }, [stop]);

  const reset = useCallback(() => {
    stop();
    setRemaining(POM[mode]);
    setEverStarted(false);
  }, [stop, mode]);

  const toggle = useCallback(() => {
    if (running) {
      stop();
    } else {
      setEverStarted(true);
      setRunning(true);
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setRunning(false);
            setMode(cur => {
              const next = cur === 'work' ? 'break' : 'work';
              if (cur === 'work') setSessions(s => s + 1);
              setRemaining(POM[next]);
              return next;
            });
            new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA==').play().catch(() => {});
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [running, stop]);

  useEffect(() => {
    if (running) {
      const m = String(Math.floor(remaining / 60)).padStart(2, '0');
      const s = String(remaining % 60).padStart(2, '0');
      document.title = `${m}:${s} · The Hub`;
    } else {
      document.title = 'The Hub';
    }
  }, [running, remaining]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const m = String(Math.floor(remaining / 60)).padStart(2, '0');
  const s = String(remaining % 60).padStart(2, '0');
  const display = `${m}:${s}`;
  const startLabel = running ? 'Pause' : (everStarted ? 'Resume' : 'Start');

  return { mode, running, display, sessions, startLabel, toggle, reset, switchMode };
}
