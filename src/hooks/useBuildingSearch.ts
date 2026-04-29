"use client";

import { useMemo, useState } from "react";
import type { Building } from "@/types";

export function useBuildingSearch(buildings: Building[]) {
  const [queryText, setQueryText] = useState("");

  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return buildings;
    return buildings.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.abbreviation.toLowerCase().includes(q) ||
        (b.description ?? "").toLowerCase().includes(q) ||
        (b.departments ?? []).some((d) => d.toLowerCase().includes(q)),
    );
  }, [buildings, queryText]);

  return {
    query: queryText,
    setQuery: setQueryText,
    filtered,
  };
}
