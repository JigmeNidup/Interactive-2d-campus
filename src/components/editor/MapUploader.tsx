"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/stores/editor-store";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_MB,
} from "@/lib/validators";
import { cn } from "@/lib/utils";

interface MapUploaderProps {
  compact?: boolean;
}

export function MapUploader({ compact = false }: MapUploaderProps) {
  const setMapData = useEditorStore((s) => s.setMapData);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  const upload = useCallback(
    async (file: File) => {
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
        const res = await fetch("/api/upload", {
          method: "POST",
          body: fd,
        });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) {
          toast.error(data.error ?? "Upload failed");
          return;
        }

        const dimensions = await readImageSize(file);
        setMapData({
          map: {
            imageUrl: data.url,
            ...(dimensions
              ? {
                  viewBoxWidth: dimensions.width,
                  viewBoxHeight: dimensions.height,
                }
              : {}),
          },
        });
        toast.success("Map image uploaded");
      } catch (err) {
        console.error(err);
        toast.error("Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [setMapData],
  );

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void upload(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void upload(file);
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          className="hidden"
          onChange={onPick}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          Replace image
        </Button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 p-10 text-center transition-colors",
        drag && "border-primary bg-primary/5",
      )}
    >
      <Upload className="mb-3 size-10 text-muted-foreground" />
      <h3 className="text-base font-medium">Upload a map image</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Drag and drop a PNG, JPG, or SVG (max {MAX_UPLOAD_MB}MB) here, or click
        to browse.
      </p>
      <Button
        className="mt-4"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Uploading...
          </>
        ) : (
          "Choose file"
        )}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        className="hidden"
        onChange={onPick}
      />
    </div>
  );
}

async function readImageSize(
  file: File,
): Promise<{ width: number; height: number } | null> {
  if (file.type === "image/svg+xml") {
    return readSvgSize(file);
  }
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || 0;
      const height = img.naturalHeight || 0;
      URL.revokeObjectURL(url);
      if (width > 0 && height > 0) {
        resolve({ width, height });
      } else {
        resolve(null);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

async function readSvgSize(
  file: File,
): Promise<{ width: number; height: number } | null> {
  try {
    const text = await file.text();
    const root = text.slice(0, 4096);
    const viewBoxMatch = root.match(/viewBox\s*=\s*"([^"]+)"/i);
    if (viewBoxMatch) {
      const parts = viewBoxMatch[1].trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
        const [, , w, h] = parts;
        if (w > 0 && h > 0) return { width: w, height: h };
      }
    }
    const widthMatch = root.match(/\bwidth\s*=\s*"([\d.]+)/i);
    const heightMatch = root.match(/\bheight\s*=\s*"([\d.]+)/i);
    if (widthMatch && heightMatch) {
      const w = parseFloat(widthMatch[1]);
      const h = parseFloat(heightMatch[1]);
      if (w > 0 && h > 0) return { width: w, height: h };
    }
  } catch {
    return null;
  }
  return null;
}
