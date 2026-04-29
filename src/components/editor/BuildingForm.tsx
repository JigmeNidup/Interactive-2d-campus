"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  ImagePlus,
  Loader2,
  Lock,
  Trash2,
  Unlock,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEditorStore } from "@/stores/editor-store";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_MB,
} from "@/lib/validators";
import {
  BUILDING_CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  type Building,
  type BuildingCategory,
} from "@/types";

interface BuildingFormProps {
  building: Building;
}

export function BuildingForm({ building }: BuildingFormProps) {
  const updateBuilding = useEditorStore((s) => s.updateBuilding);
  const deleteBuilding = useEditorStore((s) => s.deleteBuilding);

  const [departmentInput, setDepartmentInput] = useState("");

  const [local, setLocal] = useState({
    name: building.name,
    abbreviation: building.abbreviation,
    description: building.description ?? "",
    floors: building.floors?.toString() ?? "",
    color: building.color ?? CATEGORY_COLORS[building.category],
  });

  useEffect(() => {
    setLocal({
      name: building.name,
      abbreviation: building.abbreviation,
      description: building.description ?? "",
      floors: building.floors?.toString() ?? "",
      color: building.color ?? CATEGORY_COLORS[building.category],
    });
  }, [building.id, building.name, building.abbreviation, building.description, building.floors, building.color, building.category]);

  const departments = building.departments ?? [];

  function commit<K extends keyof Building>(field: K, value: Building[K]) {
    updateBuilding(building.id, { [field]: value } as Partial<Building>);
  }

  function addDepartment() {
    const value = departmentInput.trim();
    if (!value) return;
    if (departments.includes(value)) {
      setDepartmentInput("");
      return;
    }
    commit("departments", [...departments, value]);
    setDepartmentInput("");
  }

  function removeDepartment(d: string) {
    commit(
      "departments",
      departments.filter((x) => x !== d),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-block size-3 rounded-full"
            style={{
              background: building.color ?? CATEGORY_COLORS[building.category],
            }}
          />
          <h3 className="text-sm font-medium">Building details</h3>
        </div>

        <Button
          type="button"
          size="sm"
          variant={building.locked ? "default" : "outline"}
          onClick={() => commit("locked", !building.locked)}
          aria-pressed={building.locked}
        >
          {building.locked ? (
            <>
              <Lock className="size-3.5" />
              Locked
            </>
          ) : (
            <>
              <Unlock className="size-3.5" />
              Unlocked
            </>
          )}
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="building-name">Name</Label>
        <Input
          id="building-name"
          value={local.name}
          maxLength={255}
          onChange={(e) => setLocal((s) => ({ ...s, name: e.target.value }))}
          onBlur={() => commit("name", local.name)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="building-abbr">Abbreviation</Label>
        <Input
          id="building-abbr"
          value={local.abbreviation}
          maxLength={5}
          onChange={(e) =>
            setLocal((s) => ({
              ...s,
              abbreviation: e.target.value.toUpperCase().slice(0, 5),
            }))
          }
          onBlur={() => commit("abbreviation", local.abbreviation)}
        />
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={building.category}
          onValueChange={(v) => commit("category", v as BuildingCategory)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BUILDING_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block size-3 rounded-full"
                    style={{ background: CATEGORY_COLORS[cat] }}
                  />
                  {CATEGORY_LABELS[cat]}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="building-color">Color</Label>
        <div className="flex items-center gap-2">
          <Input
            id="building-color"
            type="color"
            value={local.color}
            className="h-9 w-16 p-1"
            onChange={(e) => setLocal((s) => ({ ...s, color: e.target.value }))}
            onBlur={() => commit("color", local.color)}
          />
          <Input
            value={local.color}
            onChange={(e) => setLocal((s) => ({ ...s, color: e.target.value }))}
            onBlur={() => {
              if (/^#[0-9a-fA-F]{6}$/.test(local.color)) {
                commit("color", local.color);
              }
            }}
            className="font-mono"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="building-floors">Floors</Label>
        <Input
          id="building-floors"
          type="number"
          min={0}
          max={500}
          value={local.floors}
          onChange={(e) => setLocal((s) => ({ ...s, floors: e.target.value }))}
          onBlur={() => {
            const n = parseInt(local.floors, 10);
            commit("floors", Number.isFinite(n) ? n : undefined);
          }}
        />
      </div>

      <BuildingImageField
        imageUrl={building.imageUrl}
        onChange={(url) => commit("imageUrl", url)}
      />

      <div className="space-y-2">
        <Label htmlFor="building-desc">Description</Label>
        <Textarea
          id="building-desc"
          rows={4}
          maxLength={2000}
          value={local.description}
          onChange={(e) => setLocal((s) => ({ ...s, description: e.target.value }))}
          onBlur={() => commit("description", local.description)}
        />
      </div>

      <div className="space-y-2">
        <Label>Departments</Label>
        <div className="flex flex-wrap gap-1">
          {departments.map((d) => (
            <Badge
              key={d}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {d}
              <button
                type="button"
                onClick={() => removeDepartment(d)}
                className="ml-0.5 rounded-sm p-0.5 text-muted-foreground hover:bg-muted-foreground/10"
                aria-label={`Remove ${d}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={departmentInput}
            placeholder="Add department"
            onChange={(e) => setDepartmentInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addDepartment();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addDepartment}
            disabled={!departmentInput.trim()}
          >
            Add
          </Button>
        </div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-full">
            <Trash2 className="size-4" />
            Delete building
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this building?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove &quot;{building.name}&quot; from the map.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteBuilding(building.id)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface BuildingImageFieldProps {
  imageUrl: string | undefined;
  onChange: (url: string | undefined) => void;
}

function BuildingImageField({ imageUrl, onChange }: BuildingImageFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.type)) {
      toast.error(`Unsupported file type: ${file.type || "unknown"}`);
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(`File exceeds the ${MAX_UPLOAD_MB}MB limit`);
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        toast.error(data.error ?? "Upload failed");
        return;
      }
      onChange(data.url);
      toast.success("Image uploaded");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setBusy(false);
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void upload(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-2">
      <Label>Image</Label>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        className="hidden"
        onChange={onPick}
      />

      {imageUrl ? (
        <div className="space-y-2">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border bg-muted">
            <Image
              src={imageUrl}
              alt="Building image"
              fill
              sizes="(max-width: 768px) 100vw, 320px"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Replace
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange(undefined)}
              disabled={busy}
            >
              <X className="size-4" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-center"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <ImagePlus className="size-4" />
              Upload image
            </>
          )}
        </Button>
      )}
      <p className="text-xs text-muted-foreground">
        PNG, JPG, or SVG. Max {MAX_UPLOAD_MB}MB.
      </p>
    </div>
  );
}
