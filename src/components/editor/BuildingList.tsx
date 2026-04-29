"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Lock } from "lucide-react";

import { useEditorStore } from "@/stores/editor-store";
import { CATEGORY_COLORS, type Building } from "@/types";
import { cn } from "@/lib/utils";

export function BuildingList() {
  const buildings = useEditorStore((s) => s.buildings);
  const selectedId = useEditorStore((s) => s.drawing.selectedBuildingId);
  const selectBuilding = useEditorStore((s) => s.selectBuilding);
  const reorderBuildings = useEditorStore((s) => s.reorderBuildings);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = buildings.map((b) => b.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(ids, oldIndex, newIndex);
    reorderBuildings(next);
  }

  if (buildings.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        No buildings yet. Pick the polygon or rectangle tool to draw one.
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={buildings.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-1">
          {buildings.map((b) => (
            <SortableItem
              key={b.id}
              building={b}
              selected={selectedId === b.id}
              onSelect={() => selectBuilding(b.id)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({
  building,
  selected,
  onSelect,
}: {
  building: Building;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: building.id });

  const color = building.color ?? CATEGORY_COLORS[building.category];

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "flex items-center gap-2 rounded-md border bg-background p-2 text-sm",
        isDragging && "opacity-60",
        selected && "border-primary ring-2 ring-primary/30",
      )}
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground hover:text-foreground"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span
        className="inline-block size-3 shrink-0 rounded-full"
        style={{ background: color }}
      />
      <button
        type="button"
        onClick={onSelect}
        className="flex flex-1 items-center justify-between gap-2 truncate text-left"
      >
        <span className="truncate font-medium">{building.name}</span>
        <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          {building.locked ? (
            <Lock
              className="size-3 text-muted-foreground"
              aria-label="Locked"
            />
          ) : null}
          {building.abbreviation}
        </span>
      </button>
    </li>
  );
}
