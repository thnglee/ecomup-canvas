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
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
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
    { label: "Edit", action: onEdit },
    { label: "Duplicate", action: onDuplicate },
    { label: "---", action: () => {} },
    { label: "Bring to Front", action: onBringToFront },
    { label: "Send to Back", action: onSendToBack },
    { label: "---", action: () => {} },
    { label: "Delete", action: onDelete, danger: true },
  ];

  return (
    <div
      ref={ref}
      className="fixed z-[100] bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg py-1 shadow-2xl min-w-[160px]"
      style={{ top: y, left: x }}
    >
      {items.map((item, i) =>
        item.label === "---" ? (
          <div key={i} className="border-t border-[#2a2a4a] my-1" />
        ) : (
          <button
            key={i}
            onClick={() => {
              item.action();
              onClose();
            }}
            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#222240] transition-colors ${
              item.danger ? "text-[#ef4444]" : "text-[#e4e4ef]"
            }`}
          >
            {item.label}
          </button>
        )
      )}
    </div>
  );
}
