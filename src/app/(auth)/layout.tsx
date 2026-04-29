import Image from "next/image";
import Link from "next/link";

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
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
