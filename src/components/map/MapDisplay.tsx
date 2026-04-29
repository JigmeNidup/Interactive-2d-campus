"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { useMapTransform } from "@/hooks/useMapTransform";
import { MapOverlay } from "@/components/map/MapOverlay";
import { MapControls } from "@/components/map/MapControls";
import { SearchBar } from "@/components/map/SearchBar";
import { CategoryFilter } from "@/components/map/CategoryFilter";
import { BuildingDrawer } from "@/components/map/BuildingDrawer";
import {
  BUILDING_CATEGORIES,
  type Building,
  type BuildingCategory,
  type CampusMap,
} from "@/types";
import { cn } from "@/lib/utils";

interface MapDisplayProps {
  map: CampusMap;
}

export function MapDisplay({ map }: MapDisplayProps) {
  const {
    transform,
    containerRef,
    svgRef,
    bindContainer,
    view,
    resetView,
    zoomBy,
    centerOn,
    isPanning,
  } = useMapTransform();

  const [visible, setVisible] = useState<Set<BuildingCategory>>(
    () => new Set(BUILDING_CATEGORIES),
  );
  const [selected, setSelected] = useState<Building | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const filteredBuildings = useMemo(
    () => map.buildings.filter((b) => visible.has(b.category)),
    [map.buildings, visible],
  );

  function focusBuilding(b: Building) {
    centerOn(b.centerX, b.centerY, Math.max(view.scale, 2));
    setHighlightedId(b.id);
    window.setTimeout(() => setHighlightedId(null), 2500);
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Image
              src="/logo.png"
              alt="Campus Map logo"
              width={28}
              height={28}
              className="size-7 rounded-md object-contain"
              priority
            />
            <span>{map.name}</span>
          </Link>
          {map.description ? (
            <p className="hidden text-sm text-muted-foreground sm:block">
              {map.description}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <SearchBar
            buildings={map.buildings}
            onPick={(b) => focusBuilding(b)}
          />
        </div>
      </header>

      <div className="border-b bg-background px-4 py-2">
        <CategoryFilter visible={visible} onChange={setVisible} />
      </div>

      <div
        ref={containerRef}
        data-pan="true"
        className={cn(
          "map-canvas relative min-h-0 flex-1 overflow-hidden bg-muted/30",
          isPanning ? "cursor-grabbing" : "cursor-grab",
        )}
        {...bindContainer}
      >
        <MapOverlay
          svgRef={svgRef}
          imageUrl={map.imageUrl}
          viewBoxWidth={map.viewBoxWidth}
          viewBoxHeight={map.viewBoxHeight}
          buildings={filteredBuildings}
          transform={transform}
          viewScale={view.scale}
          highlightedId={highlightedId}
          onBuildingClick={(b) => setSelected(b)}
        />
        <MapControls
          onZoomIn={() => zoomBy(1.2)}
          onZoomOut={() => zoomBy(1 / 1.2)}
          onReset={resetView}
        />
      </div>

      <BuildingDrawer
        building={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
