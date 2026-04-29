"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CATEGORY_COLORS, type Building } from "@/types";

interface SearchBarProps {
  buildings: Building[];
  onPick: (b: Building) => void;
}

export function SearchBar({ buildings, onPick }: SearchBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label="Search buildings"
          className="w-9 justify-center px-0 text-muted-foreground sm:w-[220px] sm:justify-start sm:px-3"
        >
          <Search className="size-4" />
          <span className="hidden sm:inline">Search buildings...</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(320px,calc(100vw-1.5rem))] p-0"
        align="end"
        sideOffset={6}
      >
        <Command>
          <CommandInput placeholder="Search by name or abbreviation..." />
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>
            <CommandGroup>
              {buildings.map((b) => (
                <CommandItem
                  key={b.id}
                  value={`${b.name} ${b.abbreviation}`}
                  onSelect={() => {
                    onPick(b);
                    setOpen(false);
                  }}
                >
                  <span
                    className="inline-block size-3 shrink-0 rounded-full"
                    style={{ background: b.color ?? CATEGORY_COLORS[b.category] }}
                  />
                  <span className="flex-1 truncate">{b.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {b.abbreviation}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
