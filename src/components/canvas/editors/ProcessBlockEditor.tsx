"use client";

import { useState, useEffect, useRef } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import { recordUpdateComponent } from "@/stores/historyStore";
import EditorPanel, { Field, TextInput, TextArea, SelectInput } from "./EditorPanel";
import type { CanvasComponent } from "@/types/canvas";

interface ProcessBlockEditorProps {
  component: CanvasComponent;
  onClose: () => void;
}

export default function ProcessBlockEditor({ component, onClose }: ProcessBlockEditorProps) {
  const updateComponent = useCanvasStore((s) => s.updateComponent);
  const [data, setData] = useState({ ...component.data });
  const initialData = useRef({ ...component.data });

  useEffect(() => {
    setData({ ...component.data });
    initialData.current = { ...component.data };
  }, [component.data]);

  const update = (partial: Record<string, unknown>) => {
    const next = { ...data, ...partial };
    setData(next);
    updateComponent(component.id, { data: next });
  };

  const handleClose = () => {
    const currentData = useCanvasStore.getState().components[component.id]?.data;
    if (currentData && JSON.stringify(currentData) !== JSON.stringify(initialData.current)) {
      recordUpdateComponent(component.id, { data: initialData.current }, { data: currentData }, updateComponent);
    }
    onClose();
  };

  return (
    <EditorPanel title="Edit Process Block" onClose={handleClose}>
      <Field label="Title">
        <TextInput
          value={data.title || ""}
          onChange={(v) => update({ title: v })}
          placeholder="Step title"
        />
      </Field>
      <Field label="Description">
        <TextArea
          value={data.description || ""}
          onChange={(v) => update({ description: v })}
          placeholder="Step description"
          rows={3}
        />
      </Field>
      <Field label="Block Type">
        <SelectInput
          value={data.block_type || "action"}
          onChange={(v) => update({ block_type: v })}
          options={[
            { value: "action", label: "🔵 Action" },
            { value: "decision", label: "🟡 Decision" },
            { value: "contact", label: "🟣 Contact" },
            { value: "wait", label: "⚪ Wait" },
          ]}
        />
      </Field>
      <Field label="URL (optional)">
        <TextInput
          value={data.url || ""}
          onChange={(v) => update({ url: v })}
          placeholder="https://..."
        />
      </Field>
    </EditorPanel>
  );
}
