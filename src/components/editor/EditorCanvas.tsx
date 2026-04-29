"use client";

import { useCallback, useRef } from "react";
import { Lock } from "lucide-react";
import { useEditorStore } from "@/stores/editor-store";
import { useMapTransform } from "@/hooks/useMapTransform";
import { usePolygonDrawing } from "@/hooks/usePolygonDrawing";
import { CATEGORY_COLORS, type Building } from "@/types";
import { cn } from "@/lib/utils";

interface PolygonNodeOnMove {
  (dx: number, dy: number): void;
}

const HANDLE_SIZE = 8;
const DRAG_THRESHOLD_PX = 4;

export function EditorCanvas() {
  const meta = useEditorStore((s) => s.meta);
  const buildings = useEditorStore((s) => s.buildings);
  const drawing = useEditorStore((s) => s.drawing);
  const selectBuilding = useEditorStore((s) => s.selectBuilding);
  const updateBuilding = useEditorStore((s) => s.updateBuilding);
  const moveBuilding = useEditorStore((s) => s.moveBuilding);
  const pushHistorySnapshot = useEditorStore((s) => s.pushHistorySnapshot);

  const { tool, isDrawing, currentPoints } = drawing;

  const {
    transform,
    containerRef,
    svgRef,
    bindContainer,
    screenToSvg,
    view,
    isPanning,
  } = useMapTransform();

  const drawingApi = usePolygonDrawing({ screenToSvg });

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (tool === "polygon" || tool === "rectangle") {
        drawingApi.handleClick(e.clientX, e.clientY);
      } else if (tool === "select") {
        selectBuilding(null);
      }
    },
    [drawingApi, tool, selectBuilding],
  );

  const cursor =
    tool === "polygon" || tool === "rectangle"
      ? "cursor-crosshair"
      : tool === "pan"
        ? isPanning
          ? "cursor-grabbing"
          : "cursor-grab"
        : "cursor-default";

  return (
    <div
      ref={containerRef}
      className={cn(
        "map-canvas relative h-full w-full select-none overflow-hidden bg-muted/30",
        cursor,
      )}
      data-pan={tool === "pan" ? "true" : "false"}
      {...bindContainer}
    >
      {meta.imageUrl ? (
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${meta.viewBoxWidth} ${meta.viewBoxHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 block h-full w-full"
          onClick={handleSvgClick}
          onDoubleClick={drawingApi.handleDoubleClick}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <defs>
            <filter
              id="building-glow"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g transform={transform}>
            <image
              href={meta.imageUrl}
              x="0"
              y="0"
              width={meta.viewBoxWidth}
              height={meta.viewBoxHeight}
              preserveAspectRatio="none"
              pointerEvents="none"
            />

            {buildings.map((b) => (
              <PolygonNode
                key={b.id}
                building={b}
                selected={drawing.selectedBuildingId === b.id}
                onSelect={() => {
                  if (tool === "select") selectBuilding(b.id);
                }}
                onPointDrag={(idx, point) => {
                  const next = b.polygonPoints.map((p, i) =>
                    i === idx ? point : p,
                  ) as [number, number][];
                  updateBuilding(b.id, { polygonPoints: next });
                }}
                onMoveStart={() => pushHistorySnapshot(buildings)}
                onMove={(dx, dy) => moveBuilding(b.id, dx, dy)}
                screenToSvg={screenToSvg}
                viewScale={view.scale}
                editable={tool === "select"}
              />
            ))}

            {isDrawing && (
              <DraftPolygon
                tool={tool}
                points={currentPoints}
                viewScale={view.scale}
              />
            )}
          </g>
        </svg>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <p className="text-sm">Upload a map image to start.</p>
        </div>
      )}
    </div>
  );
}

interface PolygonNodeProps {
  building: Building;
  selected: boolean;
  editable: boolean;
  viewScale: number;
  onSelect: () => void;
  onPointDrag: (idx: number, point: [number, number]) => void;
  onMoveStart: () => void;
  onMove: PolygonNodeOnMove;
  screenToSvg: (x: number, y: number) => [number, number];
}

function PolygonNode({
  building,
  selected,
  editable,
  viewScale,
  onSelect,
  onPointDrag,
  onMoveStart,
  onMove,
  screenToSvg,
}: PolygonNodeProps) {
  const vertexDragRef = useRef<{ idx: number; pointerId: number } | null>(null);
  const bodyDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    moved: boolean;
  } | null>(null);

  const fill = building.color ?? CATEGORY_COLORS[building.category];
  const isLocked = building.locked === true;
  const canDragBody = editable && selected && !isLocked;
  const canEditPoints = editable && selected && !isLocked;

  const pointsAttr = building.polygonPoints
    .map(([x, y]) => `${x},${y}`)
    .join(" ");

  return (
    <g>
      <polygon
        points={pointsAttr}
        fill={fill}
        fillOpacity={selected ? 0.7 : 0.35}
        stroke={fill}
        strokeWidth={selected ? 2 / viewScale : 1.2 / viewScale}
        filter={selected ? "url(#building-glow)" : undefined}
        className="building-polygon"
        onPointerDown={(e) => {
          if (!editable) return;
          if (e.button !== 0) return;
          e.stopPropagation();

          if (!selected) {
            onSelect();
          }

          if (!canDragBody) return;

          const target = e.currentTarget;
          target.setPointerCapture(e.pointerId);
          const [sx, sy] = screenToSvg(e.clientX, e.clientY);
          bodyDragRef.current = {
            pointerId: e.pointerId,
            startX: sx,
            startY: sy,
            lastX: sx,
            lastY: sy,
            moved: false,
          };
        }}
        onPointerMove={(e) => {
          const drag = bodyDragRef.current;
          if (!drag || drag.pointerId !== e.pointerId) return;
          const [cx, cy] = screenToSvg(e.clientX, e.clientY);
          const dx = cx - drag.lastX;
          const dy = cy - drag.lastY;
          if (!drag.moved) {
            const movedPx =
              Math.hypot(cx - drag.startX, cy - drag.startY) * viewScale;
            if (movedPx < DRAG_THRESHOLD_PX) return;
            drag.moved = true;
            // Capture pre-drag snapshot for undo
            onMoveStart();
          }
          drag.lastX = cx;
          drag.lastY = cy;
          if (dx !== 0 || dy !== 0) onMove(dx, dy);
        }}
        onPointerUp={(e) => {
          const drag = bodyDragRef.current;
          if (!drag || drag.pointerId !== e.pointerId) return;
          e.currentTarget.releasePointerCapture?.(e.pointerId);
          if (!drag.moved) {
            onSelect();
          }
          bodyDragRef.current = null;
        }}
        onPointerCancel={(e) => {
          const drag = bodyDragRef.current;
          if (drag?.pointerId === e.pointerId) {
            bodyDragRef.current = null;
          }
        }}
        style={{
          cursor: editable
            ? canDragBody
              ? "move"
              : isLocked
                ? "not-allowed"
                : "pointer"
            : "default",
        }}
      />
      <text
        x={building.centerX}
        y={building.centerY}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12 / viewScale}
        fontWeight={600}
        fill="white"
        stroke="black"
        strokeWidth={0.5 / viewScale}
        paintOrder="stroke"
        pointerEvents="none"
      >
        {building.abbreviation}
      </text>

      {selected && isLocked && (
        <g
          transform={`translate(${building.centerX} ${
            building.centerY - 18 / viewScale
          })`}
          pointerEvents="none"
        >
          <circle
            r={8 / viewScale}
            fill="black"
            fillOpacity={0.65}
          />
          <foreignObject
            x={-6 / viewScale}
            y={-6 / viewScale}
            width={12 / viewScale}
            height={12 / viewScale}
          >
            <Lock
              style={{
                width: `${12 / viewScale}px`,
                height: `${12 / viewScale}px`,
                color: "white",
              }}
            />
          </foreignObject>
        </g>
      )}

      {canEditPoints &&
        building.polygonPoints.map(([x, y], idx) => (
          <circle
            key={idx}
            cx={x}
            cy={y}
            r={HANDLE_SIZE / viewScale}
            fill="white"
            stroke={fill}
            strokeWidth={2 / viewScale}
            style={{ cursor: "grab" }}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (e.button !== 0) return;
              const target = e.currentTarget;
              target.setPointerCapture(e.pointerId);
              vertexDragRef.current = { idx, pointerId: e.pointerId };
            }}
            onPointerMove={(e) => {
              if (!vertexDragRef.current) return;
              if (vertexDragRef.current.pointerId !== e.pointerId) return;
              const point = screenToSvg(e.clientX, e.clientY);
              onPointDrag(vertexDragRef.current.idx, point);
            }}
            onPointerUp={(e) => {
              if (!vertexDragRef.current) return;
              e.currentTarget.releasePointerCapture?.(e.pointerId);
              vertexDragRef.current = null;
            }}
            onPointerCancel={() => {
              vertexDragRef.current = null;
            }}
          />
        ))}
    </g>
  );
}

function DraftPolygon({
  tool,
  points,
  viewScale,
}: {
  tool: string;
  points: [number, number][];
  viewScale: number;
}) {
  if (points.length === 0) return null;
  const pointsAttr = points.map(([x, y]) => `${x},${y}`).join(" ");
  return (
    <g pointerEvents="none">
      {tool === "polygon" && points.length >= 2 && (
        <polyline
          points={pointsAttr}
          fill="none"
          stroke="#0EA5E9"
          strokeWidth={2 / viewScale}
          strokeDasharray={`${4 / viewScale} ${4 / viewScale}`}
        />
      )}
      {tool === "rectangle" && points.length >= 1 && (
        <rect
          x={Math.min(points[0][0], points[points.length - 1][0])}
          y={Math.min(points[0][1], points[points.length - 1][1])}
          width={Math.abs(points[points.length - 1][0] - points[0][0])}
          height={Math.abs(points[points.length - 1][1] - points[0][1])}
          fill="#0EA5E9"
          fillOpacity={0.2}
          stroke="#0EA5E9"
          strokeWidth={2 / viewScale}
          strokeDasharray={`${4 / viewScale} ${4 / viewScale}`}
        />
      )}
      {points.map(([x, y], idx) => (
        <circle
          key={idx}
          cx={x}
          cy={y}
          r={4 / viewScale}
          fill="#0EA5E9"
        />
      ))}
    </g>
  );
}
