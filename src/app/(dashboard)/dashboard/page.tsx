import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { mapRowToCampusMap, type CampusMapRow } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MapCard } from "@/components/dashboard/MapCard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard - Campus Map" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { rows } = await query<CampusMapRow>(
    "SELECT * FROM campus_maps WHERE user_id = $1 ORDER BY created_at DESC",
    [session.user.id],
  );
  const maps = rows.map((r) => mapRowToCampusMap(r));

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your maps</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your campus maps. Create one, add buildings, and publish.
          </p>
        </div>
      </div>

      {maps.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
          <h2 className="text-xl font-medium">No maps yet</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Get started by creating your first interactive campus map. Upload
            an image and start drawing building polygons.
          </p>
          <Button asChild className="mt-6">
            <Link href="/editor">
              <Plus className="size-4" />
              Create your first map
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {maps.map((m) => (
            <MapCard key={m.id} map={m} />
          ))}
        </div>
      )}
    </div>
  );
}
