"use client";

import { useEffect, useCallback, useState } from "react";
import { HEADER_HEIGHT, STATUSBAR_HEIGHT } from "@/lib/constants";
import { forceSave } from "@/hooks/useAutoSave";

interface EditorPanelProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export default function EditorPanel({ title, children, onClose }: EditorPanelProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="fixed right-0 z-40 w-[400px] bg-[#12121f] border-l border-[#2a2a4a] flex flex-col overflow-hidden"
      style={{ top: HEADER_HEIGHT, bottom: STATUSBAR_HEIGHT }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a4a] shrink-0">
        <h3 className="text-sm font-semibold text-[#e4e4ef]">{title}</h3>
        <button
          onClick={onClose}
          className="text-[#8888aa] hover:text-[#e4e4ef] transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>
      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {children}
      </div>
      {/* Save button */}
      <div className="px-4 py-3 border-t border-[#2a2a4a] shrink-0">
        <SaveButton />
      </div>
    </div>
  );
}

function SaveButton() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await forceSave();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <button
      onClick={handleSave}
      disabled={saving}
      className={`w-full py-2 px-4 rounded text-sm font-medium transition-all ${
        saved
          ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30"
          : saving
            ? "bg-[#3b82f6]/10 text-[#8888aa] border border-[#2a2a4a] cursor-wait"
            : "bg-[#3b82f6] text-white hover:bg-[#2563eb] border border-[#3b82f6]"
      }`}
    >
      {saved ? "Saved!" : saving ? "Saving..." : "Save"}
    </button>
  );
}

// Shared field components
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-[#8888aa]">{label}</span>
      {children}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm rounded bg-[#0a0a0f] border border-[#2a2a4a] text-[#e4e4ef] placeholder-[#555577] outline-none focus:border-[#3b82f6] transition-colors"
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows || 4}
      className="w-full px-3 py-2 text-sm rounded bg-[#0a0a0f] border border-[#2a2a4a] text-[#e4e4ef] placeholder-[#555577] outline-none focus:border-[#3b82f6] transition-colors resize-none"
    />
  );
}

export function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm rounded bg-[#0a0a0f] border border-[#2a2a4a] text-[#e4e4ef] outline-none focus:border-[#3b82f6] transition-colors"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function ColorPicker({
  value,
  onChange,
  colors,
}: {
  value: string;
  onChange: (v: string) => void;
  colors: { name: string; color: string }[];
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {colors.map((c) => (
        <button
          key={c.name}
          onClick={() => onChange(c.name)}
          className={`w-7 h-7 rounded-full border-2 transition-all ${
            value === c.name ? "border-[#3b82f6] scale-110" : "border-[#2a2a4a]"
          }`}
          style={{ backgroundColor: c.color }}
          title={c.name}
        />
      ))}
    </div>
  );
}
