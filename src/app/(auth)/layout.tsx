import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Jemaw</h1>
        <p className="text-muted-foreground text-sm mt-1">Split bills, not friendships</p>
      </div>
      {children}
    </div>
  );
}
