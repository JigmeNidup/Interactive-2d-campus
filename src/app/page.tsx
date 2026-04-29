import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, Pencil, Eye } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-2 font-semibold">
            <MapPin className="size-5" />
            <span>Campus Map</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="container mx-auto flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
          Build interactive campus maps.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Upload a map image, draw building polygons, attach metadata, and
          publish a beautiful, interactive view for visitors. Search, filter,
          zoom, and explore.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/login">
              <Pencil className="size-4" />
              Open the editor
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/dashboard">
              <Eye className="size-4" />
              Go to dashboard
            </Link>
          </Button>
        </div>

        <div className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-6 text-left md:grid-cols-3">
          <FeatureCard
            title="Polygon editor"
            body="Draw arbitrary polygons or rectangles directly on top of any map image."
          />
          <FeatureCard
            title="Categories & filters"
            body="Tag buildings with categories. Visitors can toggle, search, and zoom."
          />
          <FeatureCard
            title="One-click publish"
            body="Flip a switch to share a public, read-only view of your map."
          />
        </div>
      </section>

      <footer className="border-t">
        <div className="container mx-auto flex h-12 items-center justify-between px-6 text-sm text-muted-foreground">
          <span>Campus Map</span>
          <span>Next.js 16 - PostgreSQL</span>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
