"use client";

import type { CanvasComponent } from "@/types/canvas";

interface DataTableProps {
  component: CanvasComponent;
}

export default function DataTable({ component }: DataTableProps) {
  const { title, columns, rows } = component.data;
  const cols: string[] = columns || ["Column 1"];
  const dataRows: string[][] = rows || [];

  return (
    <div className="w-full h-full bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg flex flex-col overflow-hidden">
      {/* Title bar */}
      <div className="px-3 py-2 border-b border-[#2a2a4a] text-sm font-semibold text-[#e4e4ef] shrink-0">
        {title || "Untitled Table"}
      </div>
      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse font-mono text-xs">
          <thead>
            <tr className="bg-[#222240]">
              {cols.map((col: string, i: number) => (
                <th
                  key={i}
                  className="px-3 py-2 text-left font-semibold text-[#e4e4ef] border-b border-r border-[#2a2a4a] last:border-r-0 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row: string[], ri: number) => (
              <tr
                key={ri}
                className={ri % 2 === 0 ? "bg-[#1a1a2e]" : "bg-[#171728]"}
              >
                {cols.map((_: string, ci: number) => (
                  <td
                    key={ci}
                    className="px-3 py-1.5 text-[#e4e4ef] border-b border-r border-[#2a2a4a]/50 last:border-r-0 whitespace-nowrap"
                  >
                    {row[ci] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
            {dataRows.length === 0 && (
              <tr>
                <td
                  colSpan={cols.length}
                  className="px-3 py-4 text-center text-[#555577]"
                >
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
