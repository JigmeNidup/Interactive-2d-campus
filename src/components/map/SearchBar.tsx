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
          className="w-[220px] justify-start text-muted-foreground"
        >
          <Search className="size-4" />
          Search buildings...
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
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
