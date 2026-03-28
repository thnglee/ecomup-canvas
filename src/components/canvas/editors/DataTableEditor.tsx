"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import { recordUpdateComponent } from "@/stores/historyStore";
import EditorPanel, { Field, TextInput } from "./EditorPanel";
import type { CanvasComponent } from "@/types/canvas";

interface DataTableEditorProps {
  component: CanvasComponent;
  onClose: () => void;
}

export default function DataTableEditor({ component, onClose }: DataTableEditorProps) {
  const updateComponent = useCanvasStore((s) => s.updateComponent);
  const [title, setTitle] = useState(component.data.title || "");
  const [columns, setColumns] = useState<string[]>(component.data.columns || ["Column 1"]);
  const [rows, setRows] = useState<string[][]>(component.data.rows || []);
  const initialData = useRef({ ...component.data });
  const savedData = useRef({ ...component.data });

  useEffect(() => {
    setTitle(component.data.title || "");
    setColumns(component.data.columns || ["Column 1"]);
    setRows(component.data.rows || []);
    initialData.current = { ...component.data };
  }, [component.data]);

  const currentData = { title, columns, rows };
  const hasChanges = JSON.stringify(currentData) !== JSON.stringify({
    title: savedData.current.title || "",
    columns: savedData.current.columns || ["Column 1"],
    rows: savedData.current.rows || [],
  });

  const handleSave = () => {
    savedData.current = { ...currentData };
  };

  const handleClose = () => {
    const storeData = useCanvasStore.getState().components[component.id]?.data;
    if (storeData && JSON.stringify(storeData) !== JSON.stringify(initialData.current)) {
      recordUpdateComponent(component.id, { data: initialData.current }, { data: storeData }, updateComponent);
    }
    onClose();
  };

  const save = useCallback(
    (t: string, cols: string[], r: string[][]) => {
      updateComponent(component.id, {
        data: { title: t, columns: cols, rows: r },
      });
    },
    [component.id, updateComponent]
  );

  const updateTitle = (v: string) => {
    setTitle(v);
    save(v, columns, rows);
  };

  const updateColumn = (i: number, v: string) => {
    const next = [...columns];
    next[i] = v;
    setColumns(next);
    save(title, next, rows);
  };

  const addColumn = () => {
    const next = [...columns, `Column ${columns.length + 1}`];
    const nextRows = rows.map((r) => [...r, ""]);
    setColumns(next);
    setRows(nextRows);
    save(title, next, nextRows);
  };

  const deleteColumn = (i: number) => {
    if (columns.length <= 1) return;
    const next = columns.filter((_, idx) => idx !== i);
    const nextRows = rows.map((r) => r.filter((_, idx) => idx !== i));
    setColumns(next);
    setRows(nextRows);
    save(title, next, nextRows);
  };

  const updateCell = (ri: number, ci: number, v: string) => {
    const next = rows.map((r, i) =>
      i === ri ? r.map((c, j) => (j === ci ? v : c)) : [...r]
    );
    setRows(next);
    save(title, columns, next);
  };

  const addRow = () => {
    const next = [...rows, new Array(columns.length).fill("")];
    setRows(next);
    save(title, columns, next);
  };

  const deleteRow = (i: number) => {
    const next = rows.filter((_, idx) => idx !== i);
    setRows(next);
    save(title, columns, next);
  };

  return (
    <EditorPanel title="Edit Data Table" onClose={handleClose} hasChanges={hasChanges} onSave={handleSave}>
      <Field label="Title">
        <TextInput value={title} onChange={updateTitle} placeholder="Table title" />
      </Field>

      <Field label="Columns">
        <div className="flex flex-col gap-2">
          {columns.map((col, i) => (
            <div key={i} className="flex gap-2 items-center">
              <TextInput
                value={col}
                onChange={(v) => updateColumn(i, v)}
                placeholder={`Column ${i + 1}`}
              />
              {columns.length > 1 && (
                <button
                  onClick={() => deleteColumn(i)}
                  className="text-[#ef4444] hover:text-[#f87171] text-xs shrink-0 px-1"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addColumn}
            className="text-xs text-[#3b82f6] hover:text-[#60a5fa] self-start"
          >
            + Add Column
          </button>
        </div>
      </Field>

      <Field label="Rows">
        <div className="flex flex-col gap-3">
          {rows.map((row, ri) => (
            <div key={ri} className="flex flex-col gap-1 p-2 rounded bg-[#0a0a0f] border border-[#2a2a4a]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[#555577]">Row {ri + 1}</span>
                <button
                  onClick={() => deleteRow(ri)}
                  className="text-[#ef4444] hover:text-[#f87171] text-xs"
                >
                  Delete
                </button>
              </div>
              {columns.map((col, ci) => (
                <div key={ci} className="flex gap-2 items-center">
                  <span className="text-[10px] text-[#555577] w-16 shrink-0 truncate">
                    {col}:
                  </span>
                  <input
                    type="text"
                    value={row[ci] ?? ""}
                    onChange={(e) => updateCell(ri, ci, e.target.value)}
                    className="flex-1 px-2 py-1 text-xs rounded bg-[#12121f] border border-[#2a2a4a] text-[#e4e4ef] outline-none focus:border-[#3b82f6]"
                  />
                </div>
              ))}
            </div>
          ))}
          <button
            onClick={addRow}
            className="text-xs text-[#3b82f6] hover:text-[#60a5fa] self-start"
          >
            + Add Row
          </button>
        </div>
      </Field>
    </EditorPanel>
  );
}
