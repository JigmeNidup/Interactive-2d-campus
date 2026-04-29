import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_MB,
} from "@/lib/validators";
import { EXT_BY_MIME, UPLOAD_DIR, fileUrl } from "@/lib/uploads";

export const runtime = "nodejs";

function sanitizeName(name: string): string {
  const base = name.replace(/\\/g, "/").split("/").pop() ?? "upload";
  return base.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart payload" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No file uploaded under field 'file'" },
      { status: 400 },
    );
  }

  if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type || "unknown"}` },
      { status: 400 },
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `File exceeds ${MAX_UPLOAD_MB}MB limit` },
      { status: 413 },
    );
  }

  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const ext = EXT_BY_MIME[file.type] ?? "bin";
    const safe = sanitizeName(file.name || `upload.${ext}`);
    const filename =
      `${randomUUID()}-${safe}`.replace(/\.[^.]+$/, "") + "." + ext;
    const fullPath = path.join(UPLOAD_DIR, filename);

    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(fullPath, Buffer.from(arrayBuffer));

    return NextResponse.json({
      url: fileUrl(filename),
      filename,
      size: file.size,
      type: file.type,
    });
  } catch (err) {
    console.error("[api/upload POST]", err);
    return NextResponse.json(
      { error: "Failed to save upload" },
      { status: 500 },
    );
  }
}
