import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { createMapSchema } from "@/lib/validators";
import {
  mapRowToCampusMap,
  type CampusMapRow,
} from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await query<CampusMapRow>(
      "SELECT * FROM campus_maps WHERE user_id = $1 ORDER BY created_at DESC",
      [session.user.id],
    );
    return NextResponse.json({
      maps: result.rows.map((row) => mapRowToCampusMap(row)),
    });
  } catch (err) {
    console.error("[api/maps GET]", err);
    return NextResponse.json(
      { error: "Failed to load maps" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createMapSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const {
    name,
    description,
    imageUrl,
    viewBoxWidth,
    viewBoxHeight,
  } = parsed.data;

  try {
    const result = await query<CampusMapRow>(
      `INSERT INTO campus_maps (user_id, name, description, image_url, view_box_width, view_box_height)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        session.user.id,
        name,
        description ?? null,
        imageUrl,
        viewBoxWidth ?? 800,
        viewBoxHeight ?? 600,
      ],
    );
    return NextResponse.json({ map: mapRowToCampusMap(result.rows[0]) }, { status: 201 });
  } catch (err) {
    console.error("[api/maps POST]", err);
    return NextResponse.json(
      { error: "Failed to create map" },
      { status: 500 },
    );
  }
}
