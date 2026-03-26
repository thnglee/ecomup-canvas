"use client";

import { memo } from "react";
import type { CanvasComponent } from "@/types/canvas";
import LinkBox from "./components/LinkBox";
import StickyNote from "./components/StickyNote";
import DataTable from "./components/DataTable";
import ProcessBlock from "./components/ProcessBlock";
import ImageBadge from "./components/ImageBadge";

interface ComponentRendererProps {
  component: CanvasComponent;
}

function ComponentRendererInner({ component }: ComponentRendererProps) {
  switch (component.type) {
    case "link_box":
      return <LinkBox component={component} />;
    case "sticky_note":
      return <StickyNote component={component} />;
    case "data_table":
      return <DataTable component={component} />;
    case "process_block":
      return <ProcessBlock component={component} />;
    case "image":
      return <ImageBadge component={component} />;
    default:
      return (
        <div className="w-full h-full bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg flex items-center justify-center text-[#555577] text-xs">
          Unknown: {component.type}
        </div>
      );
  }
}

export default memo(ComponentRendererInner);
