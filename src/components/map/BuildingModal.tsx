"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  type Building,
} from "@/types";

interface BuildingModalProps {
  building: Building | null;
  onClose: () => void;
}

export function BuildingModal({ building, onClose }: BuildingModalProps) {
  return (
    <Dialog
      open={!!building}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        {building ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span
                  className="inline-block size-3 rounded-full"
                  style={{ background: building.color ?? CATEGORY_COLORS[building.category] }}
                />
                {building.name}
              </DialogTitle>
              <DialogDescription>
                <Badge variant="secondary" className="mr-2">
                  {CATEGORY_LABELS[building.category]}
                </Badge>
                <span className="font-mono text-xs">{building.abbreviation}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-sm">
              {building.description ? (
                <p className="text-muted-foreground">{building.description}</p>
              ) : null}

              <dl className="grid grid-cols-3 gap-y-2 gap-x-4">
                {building.floors !== undefined && building.floors !== null ? (
                  <>
                    <dt className="text-muted-foreground">Floors</dt>
                    <dd className="col-span-2">{building.floors}</dd>
                  </>
                ) : null}

                {building.departments && building.departments.length > 0 ? (
                  <>
                    <dt className="text-muted-foreground">Departments</dt>
                    <dd className="col-span-2 flex flex-wrap gap-1">
                      {building.departments.map((d) => (
                        <Badge key={d} variant="outline">
                          {d}
                        </Badge>
                      ))}
                    </dd>
                  </>
                ) : null}
              </dl>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
