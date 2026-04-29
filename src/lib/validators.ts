import { z } from "zod";
import { BUILDING_CATEGORIES } from "@/types";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required").max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;

const pointSchema = z.tuple([z.number().finite(), z.number().finite()]);

export const buildingSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(255),
  abbreviation: z.string().min(1).max(10).transform((s) => s.toUpperCase()),
  category: z.enum(BUILDING_CATEGORIES as [string, ...string[]]),
  description: z.string().max(2000).optional().nullable(),
  polygonPoints: z.array(pointSchema).min(3).max(100),
  centerX: z.number().finite(),
  centerY: z.number().finite(),
  floors: z.number().int().min(0).max(500).optional().nullable(),
  departments: z.array(z.string().max(255)).max(100).optional(),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Color must be a 6-digit hex value")
    .optional()
    .nullable(),
  imageUrl: z.string().min(1).max(500).optional().nullable(),
  sortOrder: z.number().int().optional(),
  locked: z.boolean().optional(),
});

export type BuildingInput = z.infer<typeof buildingSchema>;

export const buildingImportItemSchema = z.object({
  name: z.string().min(1).max(255),
  abbreviation: z
    .string()
    .min(1)
    .max(10)
    .transform((s) => s.toUpperCase()),
  category: z.enum(BUILDING_CATEGORIES as [string, ...string[]]),
  description: z.string().max(2000).optional().nullable(),
  polygonPoints: z.array(pointSchema).min(3).max(100),
  centerX: z.number().finite().optional(),
  centerY: z.number().finite().optional(),
  floors: z.number().int().min(0).max(500).optional().nullable(),
  departments: z.array(z.string().max(255)).max(100).optional(),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Color must be a 6-digit hex value")
    .optional()
    .nullable(),
  imageUrl: z.string().min(1).max(500).optional().nullable(),
  locked: z.boolean().optional(),
});

export type BuildingImportItem = z.infer<typeof buildingImportItemSchema>;

export const buildingImportFileSchema = z.object({
  version: z.number().int().optional(),
  exportedAt: z.string().max(64).optional(),
  source: z
    .object({
      mapName: z.string().max(255).optional(),
      viewBoxWidth: z.number().optional(),
      viewBoxHeight: z.number().optional(),
    })
    .partial()
    .optional(),
  buildings: z.array(buildingImportItemSchema).min(1).max(500),
});

export type BuildingImportFile = z.infer<typeof buildingImportFileSchema>;

export const createMapSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  imageUrl: z.string().min(1).max(500),
  viewBoxWidth: z.number().int().positive().max(20_000).optional(),
  viewBoxHeight: z.number().int().positive().max(20_000).optional(),
});

export type CreateMapInput = z.infer<typeof createMapSchema>;

export const updateMapSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  imageUrl: z.string().min(1).max(500).optional(),
  viewBoxWidth: z.number().int().positive().max(20_000).optional(),
  viewBoxHeight: z.number().int().positive().max(20_000).optional(),
  isPublished: z.boolean().optional(),
  buildings: z.array(buildingSchema).max(500).optional(),
});

export type UpdateMapInput = z.infer<typeof updateMapSchema>;

export const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
]);

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const MAX_UPLOAD_MB = 25;
