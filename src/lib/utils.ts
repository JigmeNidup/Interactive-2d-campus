import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function centroidOf(points: [number, number][]): [number, number] {
  if (points.length === 0) return [0, 0];
  let sumX = 0;
  let sumY = 0;
  for (const [x, y] of points) {
    sumX += x;
    sumY += y;
  }
  return [sumX / points.length, sumY / points.length];
}

export function rectFromTwoPoints(
  a: [number, number],
  b: [number, number],
): [number, number][] {
  const [x1, y1] = a;
  const [x2, y2] = b;
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  return [
    [minX, minY],
    [maxX, minY],
    [maxX, maxY],
    [minX, maxY],
  ];
}

export type CampusMapRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  image_url: string;
  view_box_width: number;
  view_box_height: number;
  is_published: boolean;
  created_at: Date | string;
  updated_at: Date | string;
};

export type BuildingRow = {
  id: string;
  map_id: string;
  name: string;
  abbreviation: string;
  category: string;
  description: string | null;
  polygon_points: unknown;
  center_x: number | string;
  center_y: number | string;
  floors: number | null;
  departments: string[] | null;
  color: string | null;
  image_url: string | null;
  sort_order: number;
  locked: boolean | null;
};

import type { Building, BuildingCategory, CampusMap } from "@/types";

export function mapRowToCampusMap(
  row: CampusMapRow,
  buildings: Building[] = [],
): CampusMap {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? undefined,
    imageUrl: row.image_url,
    viewBoxWidth: row.view_box_width,
    viewBoxHeight: row.view_box_height,
    isPublished: row.is_published,
    buildings,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : row.updated_at,
  };
}

export function mapRowToBuilding(row: BuildingRow): Building {
  const points = Array.isArray(row.polygon_points)
    ? (row.polygon_points as [number, number][])
    : (JSON.parse(String(row.polygon_points)) as [number, number][]);
  return {
    id: row.id,
    mapId: row.map_id,
    name: row.name,
    abbreviation: row.abbreviation,
    category: row.category as BuildingCategory,
    description: row.description ?? undefined,
    polygonPoints: points,
    centerX: typeof row.center_x === "string" ? parseFloat(row.center_x) : row.center_x,
    centerY: typeof row.center_y === "string" ? parseFloat(row.center_y) : row.center_y,
    floors: row.floors ?? undefined,
    departments: row.departments ?? [],
    color: row.color ?? undefined,
    imageUrl: row.image_url ?? undefined,
    sortOrder: row.sort_order,
    locked: row.locked ?? false,
  };
}
