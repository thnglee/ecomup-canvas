"use client";

import { useToastStore } from "@/stores/toastStore";

const TYPE_ACCENT: Record<string, string> = {
  info:    "var(--accent)",
  success: "var(--success)",
  error:   "var(--danger)",
  warning: "var(--warning)",
};

export default function ToastContainer() {
  const toasts      = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const accent = TYPE_ACCENT[toast.type] ?? TYPE_ACCENT.info;
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs"
            style={{
              animation: "slideUp 200ms ease-out",
              background: "var(--surface-raised)",
              border: `1px solid var(--border)`,
              borderLeftColor: accent,
              borderLeftWidth: 3,
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              color: "var(--foreground)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: accent }}
              aria-hidden="true"
            />
            <span>{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => { toast.action!.onClick(); removeToast(toast.id); }}
                className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
                style={{ color: accent }}
              >
                {toast.action.label}
              </button>
            )}
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss"
              className="ml-1 transition-opacity opacity-40 hover:opacity-100 text-xs"
              style={{ color: "var(--foreground)" }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
