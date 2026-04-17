import Link from "next/link";
import { notFound } from "next/navigation";
import { getJemawById } from "@/actions/jemaws";
import { getServerSession } from "@/lib/session";
import { CreateSettlementForm } from "./create-settlement-form";
import { ArrowLeft } from "lucide-react";

export default async function NewSettlementPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ receiverId?: string; amount?: string }>;
}) {
  const { id } = await params;
  const { receiverId: defaultReceiverId, amount: defaultAmount } = await searchParams;

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
    <div className="max-w-lg">
      <Link
        href={`/jemaws/${id}`}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to {jemaw.name}
      </Link>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Record a settlement</h1>
        <p className="text-sm text-slate-500 mt-0.5">Upload payment proof for the receiver to confirm</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <CreateSettlementForm
          jemawId={id}
          members={otherMembers}
          currency={jemaw.currency}
          defaultReceiverId={defaultReceiverId}
          defaultAmount={defaultAmount}
        />
      </div>
    </div>
  );
}
