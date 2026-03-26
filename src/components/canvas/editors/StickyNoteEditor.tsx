"use client";

import { useState, useEffect } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import EditorPanel, { Field, TextArea, SelectInput, ColorPicker } from "./EditorPanel";
import { NOTE_COLORS } from "../components/StickyNote";
import type { CanvasComponent } from "@/types/canvas";

const noteColorOptions = Object.entries(NOTE_COLORS).map(([name, c]) => ({
  name,
  color: c.bg,
}));

interface StickyNoteEditorProps {
  component: CanvasComponent;
  onClose: () => void;
}

export default function StickyNoteEditor({ component, onClose }: StickyNoteEditorProps) {
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
    <EditorPanel title="Edit Sticky Note" onClose={onClose}>
      <Field label="Content (Markdown)">
        <TextArea
          value={data.content || ""}
          onChange={(v) => update({ content: v })}
          placeholder="Write your note..."
          rows={10}
        />
      </Field>
      <Field label="Color">
        <ColorPicker
          value={data.color || "blue"}
          onChange={(v) => update({ color: v })}
          colors={noteColorOptions}
        />
      </Field>
      <Field label="Font Size">
        <SelectInput
          value={String(data.font_size || 14)}
          onChange={(v) => update({ font_size: Number(v) })}
          options={[
            { value: "12", label: "12px - Small" },
            { value: "14", label: "14px - Default" },
            { value: "16", label: "16px - Medium" },
            { value: "18", label: "18px - Large" },
          ]}
        />
      </Field>
    </EditorPanel>
  );
}
