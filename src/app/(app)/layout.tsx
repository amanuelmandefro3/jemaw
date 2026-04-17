import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { Header } from "./header";

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
    <div className="min-h-screen bg-slate-50">
      <Header user={user} />
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
