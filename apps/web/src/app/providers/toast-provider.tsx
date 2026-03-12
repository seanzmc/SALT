import type { PropsWithChildren, ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

type ToastTone = "success" | "error" | "info";

type ToastRecord = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastInput = Omit<ToastRecord, "id">;

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  dismissToast: (toastId: string) => void;
};

const TOAST_DURATION_MS = 4200;

const ToastContext = createContext<ToastContextValue | null>(null);

function toneClasses(tone: ToastTone) {
  switch (tone) {
    case "success":
      return "border-emerald-200 bg-emerald-50/95 text-emerald-900";
    case "error":
      return "border-rose-200 bg-rose-50/95 text-rose-900";
    default:
      return "border-slate-200 bg-white/95 text-slate-900";
  }
}

function toneLabel(tone: ToastTone) {
  switch (tone) {
    case "success":
      return "Success";
    case "error":
      return "Error";
    default:
      return "Notice";
  }
}

function ToastItem({
  toast,
  onDismiss
}: {
  toast: ToastRecord;
  onDismiss: (toastId: string) => void;
}) {
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      onDismiss(toast.id);
    }, TOAST_DURATION_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [onDismiss, toast.id]);

  return (
    <div
      className={[
        "pointer-events-auto rounded-2xl border p-4 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.4)] backdrop-blur",
        toneClasses(toast.tone)
      ].join(" ")}
      role="status"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] opacity-70">
            {toneLabel(toast.tone)}
          </p>
          <p className="mt-1 text-sm font-semibold">{toast.title}</p>
          {toast.description ? (
            <p className="mt-1 text-sm opacity-80">{toast.description}</p>
          ) : null}
        </div>
        <button
          aria-label="Dismiss notification"
          className="rounded-full px-2 py-1 text-sm opacity-60 transition hover:bg-black/5 hover:opacity-100"
          onClick={() => onDismiss(toast.id)}
          type="button"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function ToastViewport({
  toasts,
  onDismiss
}: {
  toasts: ToastRecord[];
  onDismiss: (toastId: string) => void;
}) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(26rem,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} onDismiss={onDismiss} toast={toast} />
      ))}
    </div>
  );
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismissToast = useCallback((toastId: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }, []);

  const showToast = useCallback((toast: ToastInput) => {
    setToasts((current) => [
      ...current.slice(-3),
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...toast
      }
    ]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      success(title, description) {
        showToast({ title, description, tone: "success" });
      },
      error(title, description) {
        showToast({ title, description, tone: "error" });
      },
      info(title, description) {
        showToast({ title, description, tone: "info" });
      },
      dismissToast
    }),
    [dismissToast, showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport onDismiss={dismissToast} toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider.");
  }

  return context;
}
