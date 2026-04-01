"use client";

import { useEffect, useCallback, useState } from "react";
import { HEADER_HEIGHT, STATUSBAR_HEIGHT } from "@/lib/constants";
import { useCanvasStore } from "@/stores/canvasStore";
import { forceSave } from "@/hooks/useAutoSave";

interface EditorPanelProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  hasChanges: boolean;
  onSave: () => void;
}

export default function EditorPanel({ title, children, onClose, hasChanges, onSave }: EditorPanelProps) {
  const setEditorOpen = useCanvasStore((s) => s.setEditorOpen);

  useEffect(() => {
    setEditorOpen(true);
    return () => setEditorOpen(false);
  }, [setEditorOpen]);

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
      className="fixed right-0 z-40 w-[380px] flex flex-col overflow-hidden"
      style={{
        top: HEADER_HEIGHT,
        bottom: STATUSBAR_HEIGHT,
        background: "var(--surface)",
        borderLeft: "1px solid var(--border-subtle)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <h3
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--foreground-muted)", letterSpacing: "0.1em" }}
        >
          {title}
        </h3>
        <button
          onClick={onClose}
          aria-label="Close editor"
          className="w-6 h-6 flex items-center justify-center rounded text-lg leading-none transition-colors"
          style={{ color: "var(--foreground-faint)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--foreground-faint)")}
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {children}
      </div>

      {/* Save button */}
      <div
        className="px-4 py-3 shrink-0"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <SaveButton hasChanges={hasChanges} onSave={onSave} />
      </div>
    </div>
  );
}

function SaveButton({ hasChanges, onSave }: { hasChanges: boolean; onSave: () => void }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    onSave();
    await forceSave();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const disabled = saving || (!hasChanges && !saved);

  let bg = "var(--accent)";
  let color = "#fff";
  let border = "var(--accent)";
  if (saved) { bg = "rgba(52,196,122,0.12)"; color = "var(--success)"; border = "rgba(52,196,122,0.3)"; }
  if (saving) { bg = "var(--surface-raised)"; color = "var(--foreground-muted)"; border = "var(--border)"; }
  if (disabled && !saved) { bg = "var(--surface-raised)"; color = "var(--foreground-faint)"; border = "var(--border)"; }

  return (
    <button
      onClick={handleSave}
      disabled={disabled}
      className="w-full py-2 px-4 rounded-lg text-xs font-semibold transition-all"
      style={{ background: bg, color, border: `1px solid ${border}`, cursor: disabled ? "not-allowed" : "pointer" }}
    >
      {saved ? "Saved" : saving ? "Saving…" : "Save changes"}
    </button>
  );
}

/* ── Shared field primitives ── */

const INPUT_BASE: React.CSSProperties = {
  background: "var(--background)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
  borderRadius: "var(--radius)",
  outline: "none",
  transition: "border-color 150ms",
};

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span
        className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "var(--foreground-faint)", letterSpacing: "0.1em" }}
      >
        {label}
      </span>
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
      className="w-full px-3 py-2 text-xs"
      style={INPUT_BASE}
      onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
      onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
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
      className="w-full px-3 py-2 text-xs resize-none"
      style={INPUT_BASE}
      onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
      onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
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
      className="w-full px-3 py-2 text-xs"
      style={INPUT_BASE}
      onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
      onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
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
          className="w-6 h-6 rounded-full transition-all"
          style={{
            backgroundColor: c.color,
            border: value === c.name
              ? "2px solid var(--accent)"
              : "2px solid var(--border)",
            transform: value === c.name ? "scale(1.15)" : "scale(1)",
          }}
          title={c.name}
          aria-label={c.name}
          aria-pressed={value === c.name}
        />
      ))}
    </div>
  );
}
