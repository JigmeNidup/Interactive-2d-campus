import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader
        user={{ name: session.user.name, email: session.user.email }}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
