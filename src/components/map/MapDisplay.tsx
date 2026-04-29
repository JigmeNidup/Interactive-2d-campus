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
    centerOn(b.centerX, b.centerY, Math.max(view.scale, 2), 0.5);
    setHighlightedId(b.id);
    window.setTimeout(() => setHighlightedId(null), 2500);
  }

  function handleBuildingClick(b: Building) {
    setHighlightedId(null);
    setSelected(b);
  }

  function handleDrawerClose() {
    setSelected(null);
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between gap-2 border-b bg-background px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 font-semibold"
        >
          <Image
            src="/logo.png"
            alt="Campus Map logo"
            width={28}
            height={28}
            className="size-7 shrink-0 rounded-md object-contain"
            priority
          />
          <span className="truncate text-sm sm:text-base">{map.name}</span>
        </Link>

        {map.description ? (
          <p className="hidden flex-1 truncate text-sm text-muted-foreground lg:block">
            {map.description}
          </p>
        ) : null}

        <div className="shrink-0">
          <SearchBar
            buildings={map.buildings}
            onPick={(b) => focusBuilding(b)}
          />
        </div>
      </header>

      <div className="border-b bg-background">
        <div className="overflow-x-auto px-3 py-2 sm:px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <CategoryFilter visible={visible} onChange={setVisible} />
        </div>
      </div>

      <div
        ref={containerRef}
        data-pan="true"
        className={cn(
          "map-canvas relative min-h-0 w-full min-w-0 flex-1 touch-none self-stretch overflow-hidden bg-muted/30",
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
          selectedId={selected?.id ?? null}
          highlightedId={highlightedId}
          onBuildingClick={handleBuildingClick}
        />
        <MapControls
          onZoomIn={() => zoomBy(1.2)}
          onZoomOut={() => zoomBy(1 / 1.2)}
          onReset={resetView}
        />
      </div>

      <BuildingDrawer building={selected} onClose={handleDrawerClose} />
    </div>
  );
}
