export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export type BuildingCategory =
  | "academic"
  | "residence"
  | "dining"
  | "parking"
  | "athletics"
  | "admin"
  | "other";

export interface Building {
  id: string;
  mapId: string;
  name: string;
  abbreviation: string;
  category: BuildingCategory;
  description?: string;
  polygonPoints: [number, number][];
  centerX: number;
  centerY: number;
  floors?: number;
  departments?: string[];
  color?: string;
  sortOrder: number;
  locked: boolean;
}

export interface CampusMap {
  id: string;
  userId: string;
  name: string;
  description?: string;
  imageUrl: string;
  viewBoxWidth: number;
  viewBoxHeight: number;
  buildings: Building[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EditorTool = "select" | "polygon" | "rectangle" | "pan";

export interface DrawingState {
  isDrawing: boolean;
  currentPoints: [number, number][];
  selectedBuildingId: string | null;
  tool: EditorTool;
}

export interface MapViewState {
  x: number;
  y: number;
  scale: number;
}

export const CATEGORY_COLORS: Record<BuildingCategory, string> = {
  academic: "#3B82F6",
  residence: "#10B981",
  dining: "#F59E0B",
  parking: "#6B7280",
  athletics: "#EF4444",
  admin: "#8B5CF6",
  other: "#EC4899",
};

export const CATEGORY_LABELS: Record<BuildingCategory, string> = {
  academic: "Academic",
  residence: "Residence",
  dining: "Dining",
  parking: "Parking",
  athletics: "Athletics",
  admin: "Administration",
  other: "Other",
};

export const BUILDING_CATEGORIES: BuildingCategory[] = [
  "academic",
  "residence",
  "dining",
  "parking",
  "athletics",
  "admin",
  "other",
];
