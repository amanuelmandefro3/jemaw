import Link from "next/link";
import { notFound } from "next/navigation";
import { getJemawById } from "@/actions/jemaws";
import { getServerSession } from "@/lib/session";
import { CreateBillForm } from "./create-bill-form";
import { ArrowLeft } from "lucide-react";

export default async function NewBillPage({
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
        <h1 className="text-2xl font-bold text-slate-900">Add a bill</h1>
        <p className="text-sm text-slate-500 mt-0.5">Split an expense with group members</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <CreateBillForm
          jemawId={id}
          members={jemaw.members}
          currentUserId={currentUserId}
          currency={jemaw.currency}
        />
      </div>
    </div>
  );
}
