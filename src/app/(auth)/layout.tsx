import Link from "next/link";
import { MapPin } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 font-semibold text-foreground"
      >
        <MapPin className="size-5" />
        <span>Campus Map</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
