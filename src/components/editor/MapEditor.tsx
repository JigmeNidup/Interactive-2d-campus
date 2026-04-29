"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft, ImageIcon, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

import { EditorCanvas } from "./EditorCanvas";
import { EditorToolbar } from "./EditorToolbar";
import { BuildingList } from "./BuildingList";
import { BuildingForm } from "./BuildingForm";
import { MapUploader } from "./MapUploader";
import { MapPreview } from "./MapPreview";

import { useEditorStore, resetEditorStore } from "@/stores/editor-store";
import type { Building, CampusMap } from "@/types";

interface MapEditorProps {
  initialMap?: CampusMap | null;
}

export function MapEditor({ initialMap }: MapEditorProps) {
  const router = useRouter();
  const meta = useEditorStore((s) => s.meta);
  const buildings = useEditorStore((s) => s.buildings);
  const drawing = useEditorStore((s) => s.drawing);
  const isSaving = useEditorStore((s) => s.isSaving);
  const isDirty = useEditorStore((s) => s.isDirty);
  const setMapData = useEditorStore((s) => s.setMapData);
  const setIsSaving = useEditorStore((s) => s.setIsSaving);
  const markClean = useEditorStore((s) => s.markClean);
  const hydrateFromCampusMap = useEditorStore((s) => s.hydrateFromCampusMap);

  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (initialMap) {
      hydrateFromCampusMap(initialMap);
    } else {
      resetEditorStore();
    }
    return () => {
      resetEditorStore();
    };
  }, [initialMap, hydrateFromCampusMap]);

  const selected =
    buildings.find((b) => b.id === drawing.selectedBuildingId) ?? null;

  async function handleSave() {
    if (!meta.imageUrl) {
      toast.error("Upload a map image before saving");
      return;
    }
    setIsSaving(true);
    try {
      const buildingsPayload = buildings.map((b, idx) => ({
        name: b.name,
        abbreviation: b.abbreviation,
        category: b.category,
        description: b.description ?? null,
        polygonPoints: b.polygonPoints,
        centerX: b.centerX,
        centerY: b.centerY,
        floors: b.floors ?? null,
        departments: b.departments ?? [],
        color: b.color ?? null,
        sortOrder: idx,
      }));

      if (!meta.id) {
        const createRes = await fetch("/api/maps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: meta.name,
            description: meta.description || null,
            imageUrl: meta.imageUrl,
            viewBoxWidth: meta.viewBoxWidth,
            viewBoxHeight: meta.viewBoxHeight,
          }),
        });
        if (!createRes.ok) {
          const data = await safeJson(createRes);
          toast.error(data?.error ?? "Failed to create map");
          return;
        }
        const createData = (await createRes.json()) as { map: CampusMap };
        const newId = createData.map.id;

        if (buildingsPayload.length > 0 || meta.isPublished) {
          const updateRes = await fetch(`/api/maps/${newId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: meta.name,
              description: meta.description || null,
              imageUrl: meta.imageUrl,
              viewBoxWidth: meta.viewBoxWidth,
              viewBoxHeight: meta.viewBoxHeight,
              isPublished: meta.isPublished,
              buildings: buildingsPayload,
            }),
          });
          if (!updateRes.ok) {
            const data = await safeJson(updateRes);
            toast.error(data?.error ?? "Failed to save buildings");
            return;
          }
        }

        toast.success("Map created");
        markClean();
        router.replace(`/editor/${newId}`);
        router.refresh();
      } else {
        const res = await fetch(`/api/maps/${meta.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: meta.name,
            description: meta.description || null,
            imageUrl: meta.imageUrl,
            viewBoxWidth: meta.viewBoxWidth,
            viewBoxHeight: meta.viewBoxHeight,
            isPublished: meta.isPublished,
            buildings: buildingsPayload,
          }),
        });
        if (!res.ok) {
          const data = await safeJson(res);
          toast.error(data?.error ?? "Failed to save map");
          return;
        }
        toast.success("Map saved");
        markClean();
      }
    } catch (err) {
      console.error(err);
      toast.error("Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between gap-3 border-b bg-background px-4 py-2">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <a href="/dashboard">
              <ArrowLeft className="size-4" />
              Dashboard
            </a>
          </Button>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Input
            value={meta.name}
            onChange={(e) => setMapData({ map: { name: e.target.value } })}
            placeholder="Map name"
            className="w-64"
          />
        </div>

        <div className="flex items-center gap-2">
          <EditorToolbar />
          <Separator orientation="vertical" className="mx-1 h-6" />
          <PublishToggle
            published={meta.isPublished}
            onToggle={(v) => setMapData({ map: { isPublished: v } })}
          />
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="size-4" />
                {isDirty ? "Save changes" : "Saved"}
              </>
            )}
          </Button>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden">
                <Settings2 className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[360px] sm:w-[420px]">
              <SheetHeader>
                <SheetTitle>Map &amp; buildings</SheetTitle>
                <SheetDescription>
                  Configure the map and edit buildings.
                </SheetDescription>
              </SheetHeader>
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as "edit" | "preview")}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="border-b px-4 py-1">
              <TabsList>
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent
              value="edit"
              className="min-h-0 flex-1 overflow-hidden p-0"
            >
              {meta.imageUrl ? (
                <EditorCanvas />
              ) : (
                <div className="flex h-full items-center justify-center p-8">
                  <div className="w-full max-w-md">
                    <MapUploader />
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent
              value="preview"
              className="min-h-0 flex-1 overflow-hidden p-0"
            >
              <MapPreview />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="hidden w-[360px] shrink-0 overflow-y-auto border-l bg-background lg:block">
          <SidebarContent />
        </aside>
      </div>
    </div>
  );
}

function SidebarContent() {
  const meta = useEditorStore((s) => s.meta);
  const setMapData = useEditorStore((s) => s.setMapData);
  const buildings = useEditorStore((s) => s.buildings);
  const drawing = useEditorStore((s) => s.drawing);

  const selected = buildings.find((b) => b.id === drawing.selectedBuildingId) ?? null;

  return (
    <div className="flex flex-col gap-6 p-4">
      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
          <ImageIcon className="size-4" />
          Map
        </h3>
        <div className="space-y-2">
          <Label htmlFor="map-desc">Description</Label>
          <Textarea
            id="map-desc"
            rows={3}
            placeholder="A short description shown to visitors."
            value={meta.description}
            onChange={(e) => setMapData({ map: { description: e.target.value } })}
          />
          <MapUploader compact />
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="mb-2 text-sm font-medium">
          Buildings ({buildings.length})
        </h3>
        <BuildingList />
      </section>

      {selected ? (
        <>
          <Separator />
          <section>
            <BuildingForm building={selected as Building} />
          </section>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Select a building to edit its details, or pick the polygon tool to
          draw a new one.
        </p>
      )}
    </div>
  );
}

function PublishToggle({
  published,
  onToggle,
}: {
  published: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={published ? "default" : "outline"}
      onClick={() => onToggle(!published)}
    >
      {published ? "Published" : "Draft"}
    </Button>
  );
}

async function safeJson(res: Response): Promise<{ error?: string } | null> {
  try {
    return (await res.json()) as { error?: string };
  } catch {
    return null;
  }
}
