"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Download, FileUp, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useEditorStore } from "@/stores/editor-store";
import { buildingImportFileSchema } from "@/lib/validators";
import type { BuildingCategory } from "@/types";

const EXPORT_VERSION = 1;
const MAX_PASTE_BYTES = 1024 * 1024;

type ImportMode = "replace" | "append";

export function BuildingImportExport() {
  const meta = useEditorStore((s) => s.meta);
  const buildings = useEditorStore((s) => s.buildings);
  const importBuildings = useEditorStore((s) => s.importBuildings);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ImportMode>("replace");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  function handleExport() {
    if (buildings.length === 0) {
      toast.error("Nothing to export — add at least one building first");
      return;
    }

    const payload = {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      source: {
        mapName: meta.name,
        viewBoxWidth: meta.viewBoxWidth,
        viewBoxHeight: meta.viewBoxHeight,
      },
      buildings: buildings.map((b) => ({
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
        imageUrl: b.imageUrl ?? null,
        locked: b.locked,
      })),
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(meta.name) || "campus-map"}-buildings.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${buildings.length} building(s)`);
  }

  async function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_PASTE_BYTES) {
      toast.error("File is too large (max 1MB)");
      return;
    }
    try {
      const content = await file.text();
      setText(content);
    } catch (err) {
      console.error(err);
      toast.error("Could not read file");
    }
  }

  function handleImport() {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error("Paste JSON or pick a file first");
      return;
    }
    if (trimmed.length > MAX_PASTE_BYTES) {
      toast.error("JSON content is too large (max 1MB)");
      return;
    }

    setBusy(true);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        toast.error("Invalid JSON — could not parse");
        return;
      }

      const result = buildingImportFileSchema.safeParse(parsed);
      if (!result.success) {
        const first = result.error.issues[0];
        const path = first?.path.join(".") || "(root)";
        toast.error(
          `Invalid file — ${path}: ${first?.message ?? "validation failed"}`,
        );
        return;
      }

      const count = importBuildings(
        result.data.buildings.map((b) => ({
          name: b.name,
          abbreviation: b.abbreviation,
          category: b.category as BuildingCategory,
          description: b.description,
          polygonPoints: b.polygonPoints,
          centerX: b.centerX,
          centerY: b.centerY,
          floors: b.floors,
          departments: b.departments,
          color: b.color,
          imageUrl: b.imageUrl,
          locked: b.locked,
        })),
        mode,
      );

      toast.success(
        mode === "replace"
          ? `Replaced with ${count} building(s)`
          : `Added ${count} building(s)`,
      );

      setOpen(false);
      setText("");
      setMode("replace");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={buildings.length === 0}
          >
            <Download className="size-3.5" />
            Export
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Download all buildings as a portable JSON file
        </TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" size="sm" variant="outline">
            <Upload className="size-3.5" />
            Import
          </Button>
        </DialogTrigger>
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 p-0 sm:max-w-lg">
          <DialogHeader className="shrink-0 border-b p-6 pb-4">
            <DialogTitle>Import buildings</DialogTitle>
            <DialogDescription>
              Restore buildings from a previously exported JSON file. New IDs
              are generated, so the same file works across maps.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Mode
              </Label>
              <ToggleGroup
                type="single"
                value={mode}
                onValueChange={(v) => v && setMode(v as ImportMode)}
                size="sm"
                variant="outline"
                className="w-full"
              >
                <ToggleGroupItem value="replace" className="flex-1">
                  Replace existing
                </ToggleGroupItem>
                <ToggleGroupItem value="append" className="flex-1">
                  Add to existing
                </ToggleGroupItem>
              </ToggleGroup>
              <p className="text-xs text-muted-foreground">
                {mode === "replace"
                  ? `This will remove all ${buildings.length} current building(s) and load the imported ones.`
                  : `Imported buildings will be added after the ${buildings.length} existing one(s).`}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="import-json">JSON content</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp className="size-3.5" />
                  Load from file
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={handlePickFile}
                />
              </div>
              <Textarea
                id="import-json"
                rows={8}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Paste JSON, e.g.\n{\n  "version": 1,\n  "buildings": [ ... ]\n}`}
                className="max-h-64 resize-none overflow-auto font-mono text-xs"
              />
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t bg-background p-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleImport} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
