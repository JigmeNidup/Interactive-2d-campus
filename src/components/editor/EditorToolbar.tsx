"use client";

import {
  MousePointer2,
  Pentagon,
  RectangleHorizontal,
  Hand,
  Undo2,
  Redo2,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEditorStore } from "@/stores/editor-store";
import type { EditorTool } from "@/types";

export function EditorToolbar() {
  const tool = useEditorStore((s) => s.drawing.tool);
  const setTool = useEditorStore((s) => s.setTool);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.history.past.length > 0);
  const canRedo = useEditorStore((s) => s.history.future.length > 0);

  return (
    <div className="flex items-center gap-1 rounded-md border bg-background p-1 shadow-sm">
      <ToggleGroup
        type="single"
        value={tool}
        onValueChange={(v) => v && setTool(v as EditorTool)}
        size="sm"
      >
        <ToolItem value="select" label="Select (V)" icon={<MousePointer2 className="size-4" />} />
        <ToolItem value="polygon" label="Polygon (P)" icon={<Pentagon className="size-4" />} />
        <ToolItem value="rectangle" label="Rectangle (R)" icon={<RectangleHorizontal className="size-4" />} />
        <ToolItem value="pan" label="Pan (H)" icon={<Hand className="size-4" />} />
      </ToggleGroup>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={!canUndo}
            onClick={undo}
            aria-label="Undo"
          >
            <Undo2 className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Undo</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={!canRedo}
            onClick={redo}
            aria-label="Redo"
          >
            <Redo2 className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Redo</TooltipContent>
      </Tooltip>
    </div>
  );
}

function ToolItem({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ToggleGroupItem value={value} aria-label={label} className="size-8">
          {icon}
        </ToggleGroupItem>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
