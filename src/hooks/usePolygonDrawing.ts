"use client";

import { useCallback, useEffect } from "react";
import { useEditorStore } from "@/stores/editor-store";

export interface UsePolygonDrawingOptions {
  screenToSvg: (clientX: number, clientY: number) => [number, number];
}

export function usePolygonDrawing({
  screenToSvg,
}: UsePolygonDrawingOptions) {
  const tool = useEditorStore((s) => s.drawing.tool);
  const isDrawing = useEditorStore((s) => s.drawing.isDrawing);
  const currentPoints = useEditorStore((s) => s.drawing.currentPoints);
  const startDrawing = useEditorStore((s) => s.startDrawing);
  const addPoint = useEditorStore((s) => s.addPoint);
  const finishDrawing = useEditorStore((s) => s.finishDrawing);
  const cancelDrawing = useEditorStore((s) => s.cancelDrawing);

  const handleClick = useCallback(
    (clientX: number, clientY: number) => {
      if (tool !== "polygon" && tool !== "rectangle") return;
      const point = screenToSvg(clientX, clientY);

      if (!isDrawing) {
        startDrawing(point);
        return;
      }

      addPoint(point);

      if (tool === "rectangle" && currentPoints.length >= 1) {
        finishDrawing();
      }
    },
    [
      tool,
      isDrawing,
      currentPoints.length,
      addPoint,
      finishDrawing,
      screenToSvg,
      startDrawing,
    ],
  );

  const handleDoubleClick = useCallback(() => {
    if (tool === "polygon" && isDrawing) {
      finishDrawing();
    }
  }, [tool, isDrawing, finishDrawing]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!isDrawing) return;
      if (e.key === "Escape") {
        cancelDrawing();
      } else if (e.key === "Enter") {
        finishDrawing();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDrawing, cancelDrawing, finishDrawing]);

  return {
    tool,
    isDrawing,
    currentPoints,
    handleClick,
    handleDoubleClick,
  };
}
