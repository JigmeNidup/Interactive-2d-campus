import { MapEditor } from "@/components/editor/MapEditor";

export const metadata = { title: "New map - Campus Map" };

export default function NewMapEditorPage() {
  return <MapEditor initialMap={null} />;
}
