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
    <div className="p-6 max-w-lg mx-auto">
      <Link
        href={`/jemaws/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to {jemaw.name}
      </Link>
      <h1 className="text-xl font-bold mb-6">Add a bill</h1>
      <CreateBillForm
        jemawId={id}
        members={jemaw.members}
        currentUserId={currentUserId}
        currency={jemaw.currency}
      />
    </div>
  );
}
