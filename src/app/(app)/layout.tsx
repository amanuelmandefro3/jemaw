import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { Sidebar } from "./sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    const s = await getServerSession();
    if (!s) redirect("/sign-in");
    session = s;
  } catch {
    redirect("/sign-in");
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
