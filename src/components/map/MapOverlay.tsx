"use client";

import { useState } from "react";
import { CATEGORY_COLORS, type Building } from "@/types";

export interface BuildingHover {
  building: Building;
  clientX: number;
  clientY: number;
}

interface MapOverlayProps {
  svgRef?: React.RefObject<SVGSVGElement | null>;
  imageUrl: string;
  viewBoxWidth: number;
  viewBoxHeight: number;
  buildings: Building[];
  transform: string;
  visibleCategories?: Set<string>;
  selectedId?: string | null;
  highlightedId?: string | null;
  viewScale: number;
  onBuildingClick?: (building: Building) => void;
  onSvgPointerDown?: (e: React.PointerEvent<SVGSVGElement>) => void;
  cursor?: string;
}

export function MapOverlay({
  svgRef,
  imageUrl,
  viewBoxWidth,
  viewBoxHeight,
  buildings,
  transform,
  visibleCategories,
  selectedId,
  highlightedId,
  viewScale,
  onBuildingClick,
  onSvgPointerDown,
  cursor,
}: MapOverlayProps) {
  const [hover, setHover] = useState<BuildingHover | null>(null);

  return (
    <>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 block h-full w-full"
        style={cursor ? { cursor } : undefined}
        onPointerDown={onSvgPointerDown}
        onContextMenu={(e) => e.preventDefault()}
      >
        <defs>
          <filter id="building-glow-display" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g transform={transform}>
          <image
            href={imageUrl}
            x="0"
            y="0"
            width={viewBoxWidth}
            height={viewBoxHeight}
            preserveAspectRatio="none"
            pointerEvents="none"
          />
          {buildings.map((b) => {
            const visible = !visibleCategories || visibleCategories.has(b.category);
            const isSelected = b.id === selectedId;
            const isHighlight = b.id === highlightedId;
            const fill = b.color ?? CATEGORY_COLORS[b.category];
            const baseOpacity = visible ? 0.3 : 0.05;
            const hoverOpacity = visible ? 0.5 : 0.1;
            const selectedOpacity = visible ? 0.7 : 0.15;
            const opacity =
              isSelected || isHighlight
                ? selectedOpacity
                : hover?.building.id === b.id
                  ? hoverOpacity
                  : baseOpacity;
            return (
              <g key={b.id} pointerEvents={visible ? "auto" : "none"}>
                <polygon
                  points={b.polygonPoints.map(([x, y]) => `${x},${y}`).join(" ")}
                  fill={fill}
                  fillOpacity={opacity}
                  stroke={fill}
                  strokeWidth={(isSelected || isHighlight ? 2.5 : 1.5) / viewScale}
                  filter={
                    isSelected || isHighlight ? "url(#building-glow-display)" : undefined
                  }
                  className="building-polygon cursor-pointer"
                  onPointerEnter={(e) => {
                    setHover({
                      building: b,
                      clientX: e.clientX,
                      clientY: e.clientY,
                    });
                  }}
                  onPointerMove={(e) => {
                    setHover((h) =>
                      h
                        ? { ...h, clientX: e.clientX, clientY: e.clientY }
                        : null,
                    );
                  }}
                  onPointerLeave={() => setHover(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onBuildingClick?.(b);
                  }}
                />
                <text
                  x={b.centerX}
                  y={b.centerY}
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
                  {b.abbreviation}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {hover && (
        <div
          className="pointer-events-none fixed z-50 rounded-md bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md"
          style={{
            left: hover.clientX + 12,
            top: hover.clientY + 12,
          }}
        >
          <div className="font-medium">{hover.building.name}</div>
          <div className="text-muted-foreground">
            {hover.building.abbreviation}
            {hover.building.floors !== undefined && hover.building.floors !== null
              ? ` - ${hover.building.floors} floor${hover.building.floors === 1 ? "" : "s"}`
              : ""}
          </div>
        </div>
      )}
    </>
  );
}
