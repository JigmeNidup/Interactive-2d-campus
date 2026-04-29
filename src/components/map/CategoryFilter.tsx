"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  BUILDING_CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  type BuildingCategory,
} from "@/types";

interface CategoryFilterProps {
  visible: Set<BuildingCategory>;
  onChange: (next: Set<BuildingCategory>) => void;
}

export function CategoryFilter({ visible, onChange }: CategoryFilterProps) {
  return (
    <ToggleGroup
      type="multiple"
      size="sm"
      value={[...visible]}
      onValueChange={(values) => {
        onChange(new Set(values as BuildingCategory[]));
      }}
      className="flex flex-wrap gap-1"
    >
      {BUILDING_CATEGORIES.map((cat) => (
        <ToggleGroupItem
          key={cat}
          value={cat}
          aria-label={`Toggle ${CATEGORY_LABELS[cat]}`}
          className="gap-1.5"
        >
          <span
            className="inline-block size-2.5 rounded-full"
            style={{ background: CATEGORY_COLORS[cat] }}
          />
          <span className="text-xs">{CATEGORY_LABELS[cat]}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
