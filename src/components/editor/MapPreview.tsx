"use client";

import { useState } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { useMapTransform } from "@/hooks/useMapTransform";
import { MapOverlay } from "@/components/map/MapOverlay";
import { BuildingDrawer } from "@/components/map/BuildingDrawer";
import { MapControls } from "@/components/map/MapControls";
import { cn } from "@/lib/utils";
import type { Building } from "@/types";

export function MapPreview() {
  const meta = useEditorStore((s) => s.meta);
  const buildings = useEditorStore((s) => s.buildings);
  const {
    transform,
    containerRef,
    svgRef,
    bindContainer,
    view,
    resetView,
    zoomBy,
    isPanning,
  } = useMapTransform();

  const [selected, setSelected] = useState<Building | null>(null);

  if (!meta.imageUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
        Upload a map image to enable preview.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-pan="true"
      className={cn(
        "map-canvas relative h-full w-full overflow-hidden bg-muted/30",
        isPanning ? "cursor-grabbing" : "cursor-grab",
      )}
      {...bindContainer}
    >
      <MapOverlay
        svgRef={svgRef}
        imageUrl={meta.imageUrl}
        viewBoxWidth={meta.viewBoxWidth}
        viewBoxHeight={meta.viewBoxHeight}
        buildings={buildings}
        transform={transform}
        viewScale={view.scale}
        onBuildingClick={(b) => setSelected(b)}
      />
      <MapControls
        onZoomIn={() => zoomBy(1.2)}
        onZoomOut={() => zoomBy(1 / 1.2)}
        onReset={resetView}
      />
      <BuildingDrawer
        building={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
