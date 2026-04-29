"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { MapViewState } from "@/types";

const MIN_SCALE = 0.2;
const MAX_SCALE = 8;

export interface UseMapTransformOptions {
  initial?: MapViewState;
  enabled?: boolean;
}

export interface MapTransformApi {
  view: MapViewState;
  setView: (view: Partial<MapViewState>) => void;
  resetView: () => void;
  zoomBy: (factor: number, focusX?: number, focusY?: number) => void;
  centerOn: (x: number, y: number, scale?: number) => void;
  transform: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  svgRef: React.RefObject<SVGSVGElement | null>;
  bindContainer: {
    onWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void;
    onContextMenu: (e: React.MouseEvent<HTMLDivElement>) => void;
  };
  screenToSvg: (clientX: number, clientY: number) => [number, number];
  isPanning: boolean;
}

export function useMapTransform({
  initial,
  enabled = true,
}: UseMapTransformOptions = {}): MapTransformApi {
  const [view, setViewState] = useState<MapViewState>(
    initial ?? { x: 0, y: 0, scale: 1 },
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const panState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startView: MapViewState;
  } | null>(null);
  const pinchState = useRef<{
    pointers: Map<number, { x: number; y: number }>;
    initialDist: number;
    initialScale: number;
    midX: number;
    midY: number;
  } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const setView = useCallback((next: Partial<MapViewState>) => {
    setViewState((v) => {
      const merged = { ...v, ...next };
      if ("scale" in next && typeof next.scale === "number") {
        merged.scale = clamp(next.scale, MIN_SCALE, MAX_SCALE);
      }
      return merged;
    });
  }, []);

  const resetView = useCallback(() => {
    setViewState({ x: 0, y: 0, scale: 1 });
  }, []);

  const zoomBy = useCallback(
    (factor: number, focusX?: number, focusY?: number) => {
      setViewState((v) => {
        const newScale = clamp(v.scale * factor, MIN_SCALE, MAX_SCALE);
        if (focusX === undefined || focusY === undefined) {
          return { ...v, scale: newScale };
        }
        const ratio = newScale / v.scale;
        return {
          scale: newScale,
          x: focusX - (focusX - v.x) * ratio,
          y: focusY - (focusY - v.y) * ratio,
        };
      });
    },
    [],
  );

  const centerOn = useCallback(
    (svgX: number, svgY: number, targetScale?: number) => {
      const node = containerRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      setViewState((v) => {
        const scale = clamp(
          targetScale ?? Math.max(v.scale, 1.5),
          MIN_SCALE,
          MAX_SCALE,
        );
        return {
          scale,
          x: rect.width / 2 - svgX * scale,
          y: rect.height / 2 - svgY * scale,
        };
      });
    },
    [],
  );

  const onWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (!enabled) return;
      const node = containerRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const focusX = e.clientX - rect.left;
      const focusY = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      zoomBy(factor, focusX, focusY);
    },
    [enabled, zoomBy],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled) return;
      const node = containerRef.current;
      if (!node) return;

      // Right-click: do nothing here; the contextmenu handler will swallow it.
      if (e.button === 2) return;

      if (pinchState.current) {
        pinchState.current.pointers.set(e.pointerId, {
          x: e.clientX,
          y: e.clientY,
        });
        return;
      }

      if (panState.current) {
        const map = new Map<number, { x: number; y: number }>();
        map.set(panState.current.pointerId, {
          x: panState.current.startX,
          y: panState.current.startY,
        });
        map.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const points = [...map.values()];
        const dist = Math.hypot(
          points[0].x - points[1].x,
          points[0].y - points[1].y,
        );
        const rect = node.getBoundingClientRect();
        const midX = (points[0].x + points[1].x) / 2 - rect.left;
        const midY = (points[0].y + points[1].y) / 2 - rect.top;
        pinchState.current = {
          pointers: map,
          initialDist: dist || 1,
          initialScale: view.scale,
          midX,
          midY,
        };
        panState.current = null;
        setIsPanning(false);
        return;
      }

      const isPanButton =
        e.button === 1 ||
        e.metaKey ||
        e.ctrlKey ||
        e.currentTarget.dataset.pan === "true";

      if (!isPanButton) return;

      node.setPointerCapture(e.pointerId);
      panState.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startView: view,
      };
      setIsPanning(true);
    },
    [enabled, view],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const pinch = pinchState.current;
      if (pinch) {
        if (!pinch.pointers.has(e.pointerId)) return;
        pinch.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const points = [...pinch.pointers.values()];
        if (points.length < 2) return;
        const dist = Math.hypot(
          points[0].x - points[1].x,
          points[0].y - points[1].y,
        );
        const ratio = dist / pinch.initialDist;
        const newScale = clamp(
          pinch.initialScale * ratio,
          MIN_SCALE,
          MAX_SCALE,
        );
        const fx = pinch.midX;
        const fy = pinch.midY;
        setViewState((v) => {
          const r = newScale / v.scale;
          return {
            scale: newScale,
            x: fx - (fx - v.x) * r,
            y: fy - (fy - v.y) * r,
          };
        });
        return;
      }

      const pan = panState.current;
      if (!pan) return;
      if (pan.pointerId !== e.pointerId) return;
      const dx = e.clientX - pan.startX;
      const dy = e.clientY - pan.startY;
      const startView = pan.startView;
      setViewState((v) => ({
        ...v,
        x: startView.x + dx,
        y: startView.y + dy,
      }));
    },
    [],
  );

  const endInteraction = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const node = containerRef.current;
      if (panState.current && panState.current.pointerId === e.pointerId) {
        node?.releasePointerCapture?.(e.pointerId);
        panState.current = null;
        setIsPanning(false);
      }
      if (pinchState.current?.pointers.has(e.pointerId)) {
        pinchState.current.pointers.delete(e.pointerId);
        if (pinchState.current.pointers.size < 2) {
          pinchState.current = null;
        }
      }
    },
    [],
  );

  const onContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
    },
    [],
  );

  const screenToSvg = useCallback(
    (clientX: number, clientY: number): [number, number] => {
      const svg = svgRef.current;
      if (svg && typeof svg.getScreenCTM === "function") {
        const ctm = svg.getScreenCTM();
        if (ctm) {
          // Convert client → SVG viewBox coords, then undo the inner <g> transform.
          const inv = ctm.inverse();
          const pt = new DOMPoint(clientX, clientY).matrixTransform(inv);
          return [
            (pt.x - view.x) / view.scale,
            (pt.y - view.y) / view.scale,
          ];
        }
      }
      // Fallback: assume 1:1 viewBox-to-container mapping.
      const node = containerRef.current;
      if (!node) return [0, 0];
      const rect = node.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      return [(localX - view.x) / view.scale, (localY - view.y) / view.scale];
    },
    [view.x, view.y, view.scale],
  );

  const transform = useMemo(
    () => `translate(${view.x} ${view.y}) scale(${view.scale})`,
    [view.x, view.y, view.scale],
  );

  return {
    view,
    setView,
    resetView,
    zoomBy,
    centerOn,
    transform,
    containerRef,
    svgRef,
    bindContainer: {
      onWheel,
      onPointerDown,
      onPointerMove,
      onPointerUp: endInteraction,
      onPointerCancel: endInteraction,
      onContextMenu,
    },
    screenToSvg,
    isPanning,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
