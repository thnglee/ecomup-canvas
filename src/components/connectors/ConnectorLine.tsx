"use client";

import type { Connector, CanvasComponent } from "@/types/canvas";
import { getAnchorPoint } from "@/lib/canvas/connectors";

interface ConnectorLineProps {
  connector: Connector;
  fromComponent: CanvasComponent;
  toComponent: CanvasComponent;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
}

/** Get the control point offset direction for an anchor */
function getControlOffset(anchor: string, distance: number): { dx: number; dy: number } {
  switch (anchor) {
    case "top":
      return { dx: 0, dy: -distance };
    case "bottom":
      return { dx: 0, dy: distance };
    case "left":
      return { dx: -distance, dy: 0 };
    case "right":
      return { dx: distance, dy: 0 };
    default:
      return { dx: 0, dy: 0 };
  }
}

export default function ConnectorLine({
  connector,
  fromComponent,
  toComponent,
  isSelected,
  onMouseDown,
  onDoubleClick,
}: ConnectorLineProps) {
  const from = getAnchorPoint(fromComponent, connector.from_anchor);
  const to = getAnchorPoint(toComponent, connector.to_anchor);

  // Cubic bezier control point distance — proportional to the distance between points
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const curvature = Math.min(dist * 0.4, 150);

  const c1 = getControlOffset(connector.from_anchor, curvature);
  const c2 = getControlOffset(connector.to_anchor, curvature);

  const cp1x = from.x + c1.dx;
  const cp1y = from.y + c1.dy;
  const cp2x = to.x + c2.dx;
  const cp2y = to.y + c2.dy;

  const pathD = `M ${from.x},${from.y} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${to.x},${to.y}`;

  // Label position: midpoint of the bezier (t=0.5)
  const midX = 0.125 * from.x + 0.375 * cp1x + 0.375 * cp2x + 0.125 * to.x;
  const midY = 0.125 * from.y + 0.375 * cp1y + 0.375 * cp2y + 0.125 * to.y;

  const markerId = `arrow-${connector.id}`;
  const markerIdStart = `arrow-start-${connector.id}`;
  const color = connector.color || "#ffffff";
  const isDashed = connector.style === "dashed";

  return (
    <g>
      {/* Arrow marker definitions */}
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="8"
          refX="9"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L10,4 L0,8 L2,4 Z" fill={color} />
        </marker>
        {connector.type === "bidirectional" && (
          <marker
            id={markerIdStart}
            markerWidth="10"
            markerHeight="8"
            refX="1"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M10,0 L0,4 L10,8 L8,4 Z" fill={color} />
          </marker>
        )}
      </defs>

      {/* Invisible wider path for easier click targeting */}
      <path
        d={pathD}
        stroke="transparent"
        strokeWidth={12}
        fill="none"
        style={{ cursor: "pointer" }}
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
      />

      {/* Visible curved line */}
      <path
        d={pathD}
        stroke={isSelected ? "#3b82f6" : color}
        strokeWidth={isSelected ? 2.5 : 2}
        strokeDasharray={isDashed ? "8,4" : undefined}
        fill="none"
        markerEnd={
          connector.type === "arrow" || connector.type === "bidirectional"
            ? `url(#${markerId})`
            : undefined
        }
        markerStart={
          connector.type === "bidirectional"
            ? `url(#${markerIdStart})`
            : undefined
        }
        style={{ pointerEvents: "none" }}
      />

      {/* Selection indicators */}
      {isSelected && (
        <>
          <circle cx={from.x} cy={from.y} r={4} fill="#3b82f6" />
          <circle cx={to.x} cy={to.y} r={4} fill="#3b82f6" />
        </>
      )}

      {/* Label */}
      {connector.label && (
        <g
          onMouseDown={onMouseDown}
          onDoubleClick={onDoubleClick}
          style={{ cursor: "pointer" }}
        >
          <rect
            x={midX - connector.label.length * 4 - 8}
            y={midY - 10}
            width={connector.label.length * 8 + 16}
            height={20}
            rx={10}
            fill="#1a1a2e"
            stroke={isSelected ? "#3b82f6" : "#2a2a4a"}
            strokeWidth={1}
          />
          <text
            x={midX}
            y={midY + 4}
            textAnchor="middle"
            fill="#e4e4ef"
            fontSize={11}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {connector.label}
          </text>
        </g>
      )}
    </g>
  );
}
