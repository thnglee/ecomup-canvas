"use client";

import { useEffect, useRef } from "react";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

export default function ContextMenu({
  x,
  y,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
  onBringToFront,
  onSendToBack,
}: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const items = [
    { label: "Edit",           action: onEdit },
    { label: "Duplicate",      action: onDuplicate },
    { label: "---",            action: () => {} },
    { label: "Bring to Front", action: onBringToFront },
    { label: "Send to Back",   action: onSendToBack },
    { label: "---",            action: () => {} },
    { label: "Delete",         action: onDelete, danger: true },
  ];

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-[100] py-1 min-w-[156px] rounded-xl shadow-2xl"
      style={{
        top: y,
        left: x,
        background: "var(--surface-raised)",
        border: "1px solid var(--border)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      }}
    >
      {items.map((item, i) =>
        item.label === "---" ? (
          <div
            key={i}
            className="my-1 mx-2"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
            aria-hidden="true"
          />
        ) : (
          <button
            key={i}
            role="menuitem"
            onClick={() => { item.action(); onClose(); }}
            className="w-full text-left px-3 py-1.5 text-xs font-medium transition-colors rounded-lg mx-auto"
            style={{
              display: "block",
              color: item.danger ? "var(--danger)" : "var(--foreground)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = item.danger
                ? "rgba(240,96,96,0.08)"
                : "var(--surface-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            {item.label}
          </button>
        )
      )}
    </div>
  );
}
