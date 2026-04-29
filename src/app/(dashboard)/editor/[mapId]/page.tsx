import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import {
  mapRowToBuilding,
  mapRowToCampusMap,
  type BuildingRow,
  type CampusMapRow,
} from "@/lib/utils";
import { MapEditor } from "@/components/editor/MapEditor";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PageProps {
  params: Promise<{ mapId: string }>;
}

export default async function EditorPage({ params }: PageProps) {
  const { mapId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  if (!UUID_RE.test(mapId)) notFound();

  const mapResult = await query<CampusMapRow>(
    "SELECT * FROM campus_maps WHERE id = $1 AND user_id = $2",
    [mapId, session.user.id],
  );
  if (mapResult.rowCount === 0) notFound();

  const buildingsResult = await query<BuildingRow>(
    "SELECT * FROM buildings WHERE map_id = $1 ORDER BY sort_order ASC, created_at ASC",
    [mapId],
  );

  const map = mapRowToCampusMap(
    mapResult.rows[0],
    buildingsResult.rows.map(mapRowToBuilding),
  );

  return <MapEditor initialMap={map} />;
}
