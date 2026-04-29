import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getClient, query } from "@/lib/db";
import { updateMapSchema } from "@/lib/validators";
import {
  mapRowToBuilding,
  mapRowToCampusMap,
  type BuildingRow,
  type CampusMapRow,
} from "@/lib/utils";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid map id" }, { status: 400 });
  }

  try {
    const mapResult = await query<CampusMapRow>(
      "SELECT * FROM campus_maps WHERE id = $1",
      [id],
    );
    if (mapResult.rowCount === 0) {
      return NextResponse.json({ error: "Map not found" }, { status: 404 });
    }
    const mapRow = mapResult.rows[0];

    const session = await auth();
    const isOwner = session?.user?.id === mapRow.user_id;
    if (!mapRow.is_published && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const buildingsResult = await query<BuildingRow>(
      "SELECT * FROM buildings WHERE map_id = $1 ORDER BY sort_order ASC, created_at ASC",
      [id],
    );

    return NextResponse.json({
      map: mapRowToCampusMap(
        mapRow,
        buildingsResult.rows.map(mapRowToBuilding),
      ),
    });
  } catch (err) {
    console.error("[api/maps/:id GET]", err);
    return NextResponse.json(
      { error: "Failed to load map" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid map id" }, { status: 400 });
  }

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

  const parsed = updateMapSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const client = await getClient();
  try {
    const ownerResult = await client.query<{ user_id: string }>(
      "SELECT user_id FROM campus_maps WHERE id = $1",
      [id],
    );
    if (ownerResult.rowCount === 0) {
      return NextResponse.json({ error: "Map not found" }, { status: 404 });
    }
    if (ownerResult.rows[0].user_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await client.query("BEGIN");

    const updates: string[] = [];
    const values: unknown[] = [];
    let p = 1;

    const data = parsed.data;
    if (data.name !== undefined) {
      updates.push(`name = $${p++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${p++}`);
      values.push(data.description);
    }
    if (data.imageUrl !== undefined) {
      updates.push(`image_url = $${p++}`);
      values.push(data.imageUrl);
    }
    if (data.viewBoxWidth !== undefined) {
      updates.push(`view_box_width = $${p++}`);
      values.push(data.viewBoxWidth);
    }
    if (data.viewBoxHeight !== undefined) {
      updates.push(`view_box_height = $${p++}`);
      values.push(data.viewBoxHeight);
    }
    if (data.isPublished !== undefined) {
      updates.push(`is_published = $${p++}`);
      values.push(data.isPublished);
    }
    updates.push(`updated_at = NOW()`);

    values.push(id);
    const updatedMapResult = await client.query<CampusMapRow>(
      `UPDATE campus_maps SET ${updates.join(", ")} WHERE id = $${p} RETURNING *`,
      values,
    );

    if (data.buildings !== undefined) {
      await client.query("DELETE FROM buildings WHERE map_id = $1", [id]);

      for (let i = 0; i < data.buildings.length; i++) {
        const b = data.buildings[i];
        await client.query(
          `INSERT INTO buildings (
             map_id, name, abbreviation, category, description,
             polygon_points, center_x, center_y, floors, departments, color, sort_order, locked
           ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12, $13)`,
          [
            id,
            b.name,
            b.abbreviation,
            b.category,
            b.description ?? null,
            JSON.stringify(b.polygonPoints),
            b.centerX,
            b.centerY,
            b.floors ?? null,
            b.departments ?? [],
            b.color ?? null,
            b.sortOrder ?? i,
            b.locked ?? false,
          ],
        );
      }
    }

    await client.query("COMMIT");

    const buildingsResult = await client.query<BuildingRow>(
      "SELECT * FROM buildings WHERE map_id = $1 ORDER BY sort_order ASC, created_at ASC",
      [id],
    );

    return NextResponse.json({
      map: mapRowToCampusMap(
        updatedMapResult.rows[0],
        buildingsResult.rows.map(mapRowToBuilding),
      ),
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("[api/maps/:id PUT]", err);
    return NextResponse.json(
      { error: "Failed to update map" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid map id" }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await query(
      "DELETE FROM campus_maps WHERE id = $1 AND user_id = $2",
      [id, session.user.id],
    );
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Map not found or not yours" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/maps/:id DELETE]", err);
    return NextResponse.json(
      { error: "Failed to delete map" },
      { status: 500 },
    );
  }
}
