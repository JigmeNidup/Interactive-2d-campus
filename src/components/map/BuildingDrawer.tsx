"use client";

import Image from "next/image";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  type Building,
} from "@/types";

interface BuildingDrawerProps {
  building: Building | null;
  onClose: () => void;
}

export function BuildingDrawer({ building, onClose }: BuildingDrawerProps) {
  return (
    <Sheet
      open={!!building}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="left"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        {building ? (
          <>
            {building.imageUrl ? (
              <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-muted">
                <Image
                  src={building.imageUrl}
                  alt={building.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 28rem"
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : null}

            <SheetHeader className="space-y-2 px-6 pt-6 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-block size-3 rounded-full ring-1 ring-black/10"
                  style={{
                    background:
                      building.color ?? CATEGORY_COLORS[building.category],
                  }}
                  aria-hidden
                />
                <Badge variant="secondary">
                  {CATEGORY_LABELS[building.category]}
                </Badge>
                <span className="font-mono text-xs text-muted-foreground">
                  {building.abbreviation}
                </span>
              </div>

              <SheetTitle className="pr-8 text-2xl leading-tight tracking-tight">
                {building.name}
              </SheetTitle>

              <SheetDescription className="sr-only">
                Details about {building.name}
              </SheetDescription>
            </SheetHeader>

            <Separator />

            <div className="flex-1 overflow-y-auto px-6 py-5 text-sm">
              {building.description ? (
                <p className="leading-relaxed whitespace-pre-line text-foreground/90">
                  {building.description}
                </p>
              ) : (
                <p className="italic text-muted-foreground">
                  No description provided for this building.
                </p>
              )}

              {(building.floors !== undefined && building.floors !== null) ||
              (building.departments && building.departments.length > 0) ? (
                <>
                  <Separator className="my-5" />
                  <dl className="space-y-3">
                    {building.floors !== undefined &&
                    building.floors !== null ? (
                      <div className="flex items-baseline gap-3">
                        <dt className="w-24 shrink-0 text-xs uppercase tracking-wide text-muted-foreground">
                          Floors
                        </dt>
                        <dd>{building.floors}</dd>
                      </div>
                    ) : null}

                    {building.departments &&
                    building.departments.length > 0 ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-3">
                        <dt className="w-24 shrink-0 text-xs uppercase tracking-wide text-muted-foreground">
                          Departments
                        </dt>
                        <dd className="flex flex-wrap gap-1.5">
                          {building.departments.map((d) => (
                            <Badge key={d} variant="outline">
                              {d}
                            </Badge>
                          ))}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
