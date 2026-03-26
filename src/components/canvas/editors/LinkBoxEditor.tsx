"use client";

import { useState, useEffect } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import EditorPanel, { Field, TextInput, TextArea } from "./EditorPanel";
import { PRESET_ICONS } from "../components/LinkBox";
import type { CanvasComponent } from "@/types/canvas";

const ACCENT_COLORS = [
  { name: "#3b82f6", color: "#3b82f6" },
  { name: "#22c55e", color: "#22c55e" },
  { name: "#eab308", color: "#eab308" },
  { name: "#ef4444", color: "#ef4444" },
  { name: "#7c3aed", color: "#7c3aed" },
  { name: "#f97316", color: "#f97316" },
  { name: "#06b6d4", color: "#06b6d4" },
];

interface LinkBoxEditorProps {
  component: CanvasComponent;
  onClose: () => void;
}

export default function LinkBoxEditor({ component, onClose }: LinkBoxEditorProps) {
  const updateComponent = useCanvasStore((s) => s.updateComponent);
  const [data, setData] = useState({ ...component.data });

  useEffect(() => {
    setData({ ...component.data });
  }, [component.data]);

  const update = (partial: Record<string, unknown>) => {
    const next = { ...data, ...partial };
    setData(next);
    updateComponent(component.id, { data: next });
  };

  return (
    <EditorPanel title="Edit Link Box" onClose={onClose}>
      <Field label="Title">
        <TextInput
          value={data.title || ""}
          onChange={(v) => update({ title: v })}
          placeholder="Link title"
        />
      </Field>
      <Field label="Description">
        <TextArea
          value={data.description || ""}
          onChange={(v) => update({ description: v })}
          placeholder="Brief description"
          rows={2}
        />
      </Field>
      <Field label="URL">
        <TextInput
          value={data.url || ""}
          onChange={(v) => update({ url: v })}
          placeholder="https://..."
        />
      </Field>
      <Field label="Icon">
        <div className="flex gap-2 flex-wrap">
          {Object.entries(PRESET_ICONS).map(([key, emoji]) => (
            <button
              key={key}
              onClick={() => update({ icon: key })}
              className={`w-9 h-9 rounded border text-lg flex items-center justify-center transition-all ${
                data.icon === key
                  ? "border-[#3b82f6] bg-[#3b82f6]/20"
                  : "border-[#2a2a4a] hover:border-[#3a3a5a]"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Accent Color">
        <div className="flex gap-2">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => update({ color_accent: c.name })}
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                (data.color_accent || "#3b82f6") === c.name
                  ? "border-white scale-110"
                  : "border-[#2a2a4a]"
              }`}
              style={{ backgroundColor: c.color }}
            />
          ))}
        </div>
      </Field>
    </EditorPanel>
  );
}
