export type ComponentType =
  | "link_box"
  | "data_table"
  | "sticky_note"
  | "process_block"
  | "image";

export type ConnectorType = "line" | "arrow" | "bidirectional";
export type ConnectorStyle = "solid" | "dashed";
export type AnchorPosition = "top" | "right" | "bottom" | "left";
export type ActiveTool = "select" | "zone" | "connector";

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface CanvasComponent {
  id: string;
  user_id: string;
  type: ComponentType;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  z_index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  zone_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Zone {
  id: string;
  user_id: string;
  name: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  color: string;
  z_index: number;
  created_at: string;
  updated_at: string;
}

export interface Connector {
  id: string;
  user_id: string;
  from_component_id: string;
  to_component_id: string;
  from_anchor: AnchorPosition;
  to_anchor: AnchorPosition;
  type: ConnectorType;
  style: ConnectorStyle;
  color: string;
  label: string | null;
  created_at: string;
  updated_at: string;
}

export interface CanvasState {
  id: string;
  user_id: string;
  viewport_x: number;
  viewport_y: number;
  viewport_zoom: number;
  snap_to_grid: boolean;
  sidebar_collapsed: boolean;
  minimap_visible: boolean;
  updated_at: string;
}
