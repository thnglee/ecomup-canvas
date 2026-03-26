"use client";

import { useToastStore } from "@/stores/toastStore";

const TYPE_STYLES = {
  info: "bg-[#1a1a2e] border-[#3b82f6] text-[#e4e4ef]",
  success: "bg-[#1a1a2e] border-[#22c55e] text-[#22c55e]",
  error: "bg-[#1a1a2e] border-[#ef4444] text-[#ef4444]",
  warning: "bg-[#1a1a2e] border-[#eab308] text-[#eab308]",
};

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-lg border shadow-xl text-sm ${TYPE_STYLES[toast.type]}`}
          style={{ animation: "slideUp 200ms ease-out" }}
        >
          <span>{toast.message}</span>
          {toast.action && (
            <button
              onClick={() => {
                toast.action!.onClick();
                removeToast(toast.id);
              }}
              className="font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              {toast.action.label}
            </button>
          )}
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-1 opacity-50 hover:opacity-100 transition-opacity text-xs"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
