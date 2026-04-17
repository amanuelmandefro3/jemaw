import Link from "next/link";
import { notFound } from "next/navigation";
import { getJemawById } from "@/actions/jemaws";
import { getServerSession } from "@/lib/session";
import { JemawTabs } from "./jemaw-tabs";
import { InviteMemberDialog } from "./invite-member-dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Plus, ArrowLeftRight, UserPlus, ArrowLeft } from "lucide-react";

export default async function JemawPage({
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

  const balance = parseFloat(jemaw.myBalance);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to groups
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{jemaw.name}</h1>
            {jemaw.description && (
              <p className="text-muted-foreground text-sm mt-1">{jemaw.description}</p>
            )}
            <div className="mt-2 text-sm font-medium">
              {balance === 0 ? (
                <span className="text-muted-foreground">You are settled up</span>
              ) : balance > 0 ? (
                <span className="text-green-600">You are owed {formatCurrency(balance)}</span>
              ) : (
                <span className="text-red-600">You owe {formatCurrency(Math.abs(balance))}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap justify-end">
            <InviteMemberDialog jemawId={id}>
              <Button variant="outline" size="sm">
                <UserPlus className="w-4 h-4 mr-1.5" />
                Invite
              </Button>
            </InviteMemberDialog>
            <Link href={`/jemaws/${id}/settlements/new`}>
              <Button variant="outline" size="sm">
                <ArrowLeftRight className="w-4 h-4 mr-1.5" />
                Settle up
              </Button>
            </Link>
            <Link href={`/jemaws/${id}/bills/new`}>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Add bill
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <JemawTabs jemaw={jemaw} currentUserId={currentUserId} />
    </div>
  );
}
