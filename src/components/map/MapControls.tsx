"use client";

import { Maximize2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function MapControls({
  onZoomIn,
  onZoomOut,
  onReset,
}: MapControlsProps) {
  return (
    <div
      className="absolute bottom-4 right-4 z-10 flex flex-col gap-1 rounded-md border bg-background/95 p-1 shadow-md backdrop-blur"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.stopPropagation()}
    >
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={onZoomIn}
        aria-label="Zoom in"
      >
        <Plus className="size-4" />
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={onZoomOut}
        aria-label="Zoom out"
      >
        <Minus className="size-4" />
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={onReset}
        aria-label="Fit to screen"
      >
        <Maximize2 className="size-4" />
      </Button>
    </div>
  );
}
