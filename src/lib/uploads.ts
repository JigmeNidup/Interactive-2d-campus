import path from "node:path";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export const FILE_API_PREFIX = "/api/files";

export const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/svg+xml": "svg",
};

export const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
};

const FILENAME_RE = /^[a-zA-Z0-9._-]{1,200}$/;

export function isSafeFilename(name: string): boolean {
  if (!FILENAME_RE.test(name)) return false;
  if (name.includes("..")) return false;
  if (name.startsWith(".")) return false;
  return true;
}

export function fileUrl(filename: string): string {
  return `${FILE_API_PREFIX}/${filename}`;
}
