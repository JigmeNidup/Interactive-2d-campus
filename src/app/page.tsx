import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Layers, PencilRuler, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Campus Map",
  description:
    "Build and publish interactive campus maps. Draw building polygons on any image, attach metadata, and share a clean public view with your visitors.",
};

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight"
          >
            <Image
              src="/logo.png"
              alt="Campus Map logo"
              width={28}
              height={28}
              className="size-7 rounded-md object-contain"
              priority
            />
            <span>Campus Map</span>
          </Link>
          <Button asChild size="sm" variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <section className="container mx-auto flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
          Interactive campus maps, made simple
        </span>

        <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          Plan, label, and publish your campus in one place.
        </h1>

        <p className="mt-5 max-w-xl text-balance text-base leading-relaxed text-muted-foreground md:text-lg">
          Upload a map image, outline buildings as polygons, attach details, and
          share a polished public view with search, filters, and zoom.
        </p>

        <div className="mt-8 flex items-center gap-3">
          <Button asChild size="lg">
            <Link href="/dashboard">
              Open dashboard
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <ul className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-6 text-left sm:grid-cols-3">
          <Feature
            icon={<PencilRuler className="size-4" />}
            title="Polygon editor"
            body="Trace any building with polygons or rectangles, snap, edit, and reorder."
          />
          <Feature
            icon={<Layers className="size-4" />}
            title="Categories & search"
            body="Tag buildings, attach images and floor counts, then filter and search."
          />
          <Feature
            icon={<Share2 className="size-4" />}
            title="Publish & share"
            body="Flip a switch and share a public read-only link. Update anytime."
          />
        </ul>
      </section>

    </main>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="space-y-1.5">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="flex size-7 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
          {icon}
        </span>
        {title}
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </li>
  );
}
