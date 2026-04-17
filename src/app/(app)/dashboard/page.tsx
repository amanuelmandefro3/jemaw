import Link from "next/link";
import { getMyJemaws } from "@/actions/jemaws";
import { getPendingBillsForUser } from "@/actions/bills";
import { getPendingSettlementsForUser } from "@/actions/settlements";
import { JemawCard } from "./jemaw-card";
import { CreateJemawDialog } from "./create-jemaw-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Clock } from "lucide-react";

export default async function DashboardPage() {
  const [jemaws, pendingBills, pendingSettlements] = await Promise.all([
    getMyJemaws(),
    getPendingBillsForUser(),
    getPendingSettlementsForUser(),
  ]);

  const pendingCount = pendingBills.length + pendingSettlements.length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Groups</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage shared expenses with your groups
          </p>
        </div>
        <CreateJemawDialog>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Group
          </Button>
        </CreateJemawDialog>
      </div>

      {pendingCount > 0 && (
        <Link
          href="/pending"
          className="flex items-center gap-3 p-4 mb-6 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors"
        >
          <Clock className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">
            You have {pendingCount} item{pendingCount !== 1 ? "s" : ""} pending your approval
          </span>
          <span className="ml-auto text-xs underline">Review →</span>
        </Link>
      )}

      {jemaws.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium mb-1">No groups yet</p>
          <p className="text-sm">Create a group to start splitting expenses</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jemaws.map((jemaw) => (
            <JemawCard key={jemaw.id} jemaw={jemaw} />
          ))}
        </div>
      )}
    </div>
  );
}
