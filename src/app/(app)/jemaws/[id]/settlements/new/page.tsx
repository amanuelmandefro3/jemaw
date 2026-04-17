import Link from "next/link";
import { notFound } from "next/navigation";
import { getJemawById } from "@/actions/jemaws";
import { getServerSession } from "@/lib/session";
import { CreateSettlementForm } from "./create-settlement-form";
import { ArrowLeft } from "lucide-react";

export default async function NewSettlementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let jemaw;
  try {
    jemaw = await getJemawById(id);
  } catch {
    notFound();
  }

  const session = await getServerSession();
  const currentUserId = session!.user.id;

  const otherMembers = jemaw.members.filter((m) => m.userId !== currentUserId);

  return (
    <div className="p-6 max-w-lg mx-auto">
      <Link
        href={`/jemaws/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to {jemaw.name}
      </Link>
      <h1 className="text-xl font-bold mb-6">Record a settlement</h1>
      <CreateSettlementForm
        jemawId={id}
        members={otherMembers}
      />
    </div>
  );
}
