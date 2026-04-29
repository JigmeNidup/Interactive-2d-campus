import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  CONTENT_TYPE_BY_EXT,
  UPLOAD_DIR,
  isSafeFilename,
} from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;

  if (!isSafeFilename(id)) {
    return NextResponse.json({ error: "Invalid file id" }, { status: 400 });
  }

  const ext = id.split(".").pop()?.toLowerCase() ?? "";
  const contentType = CONTENT_TYPE_BY_EXT[ext];
  if (!contentType) {
    return NextResponse.json(
      { error: "Unsupported file type" },
      { status: 400 },
    );
  }

  const targetPath = path.resolve(path.join(UPLOAD_DIR, id));
  const baseDir = path.resolve(UPLOAD_DIR) + path.sep;
  if (!targetPath.startsWith(baseDir)) {
    return NextResponse.json({ error: "Invalid file id" }, { status: 400 });
  }

  try {
    const buffer = await fs.readFile(targetPath);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    console.error("[api/files GET]", err);
    return NextResponse.json(
      { error: "Failed to read file" },
      { status: 500 },
    );
  }
}
