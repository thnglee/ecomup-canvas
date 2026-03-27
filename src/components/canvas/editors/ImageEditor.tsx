"use client";

import { useState, useEffect, useRef } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import { recordUpdateComponent } from "@/stores/historyStore";
import { createClient } from "@/lib/supabase/client";
import EditorPanel, { Field, TextInput } from "./EditorPanel";
import type { CanvasComponent } from "@/types/canvas";

interface ImageEditorProps {
  component: CanvasComponent;
  onClose: () => void;
}

export default function ImageEditor({ component, onClose }: ImageEditorProps) {
  const updateComponent = useCanvasStore((s) => s.updateComponent);
  const [data, setData] = useState({ ...component.data });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
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

  const handleUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("File must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${component.id}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from("component-images")
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("component-images").getPublicUrl(path);

      update({ image_url: publicUrl });
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Make sure the storage bucket exists.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <EditorPanel title="Edit Image" onClose={handleClose}>
      <Field label="Image URL">
        <TextInput
          value={data.image_url || ""}
          onChange={(v) => update({ image_url: v })}
          placeholder="https://example.com/image.png"
        />
      </Field>

      <Field label="Upload Image">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 text-sm rounded bg-[#3b82f6]/20 text-[#3b82f6] hover:bg-[#3b82f6]/30 transition-colors disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Choose File"}
        </button>
      </Field>

      <Field label="Alt Text">
        <TextInput
          value={data.alt_text || ""}
          onChange={(v) => update({ alt_text: v })}
          placeholder="Description for accessibility"
        />
      </Field>
    </EditorPanel>
  );
}
