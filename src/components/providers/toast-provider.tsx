"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface ToastApi {
  toast: (message: string) => void;
}

const ToastContext = createContext<ToastApi>({ toast: () => {} });

export function useToast(): (message: string) => void {
  return useContext(ToastContext).toast;
}

interface ToastItem {
  id: number;
  message: string;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const toast = useCallback((message: string) => {
    const id = ++seq.current;
    setItems((prev) => [...prev, { id, message }].slice(-3));
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 2100);
  }, []);

  const api = useMemo(() => ({ toast }), [toast]);

  // 앱 어딘가에서 오류가 나도 토스트가 계속 쌓이지 않도록 정리
  useEffect(() => {
    if (items.length === 0) return;
    const timer = window.setTimeout(() => setItems((prev) => prev.slice(1)), 2400);
    return () => window.clearTimeout(timer);
  }, [items]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom))] z-[70] flex flex-col items-center gap-2 px-4"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="animate-rise max-w-[86%] truncate rounded-[13px] bg-ink/95 px-4 py-[11px] text-[12.5px] font-bold text-white shadow-[0_8px_24px_rgba(16,24,40,.3)]"
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
