import { getPendingBillsForUser } from "@/actions/bills";
import { getPendingSettlementsForUser } from "@/actions/settlements";
import { PendingItems } from "./pending-items";

export default async function PendingPage() {
  const [pendingBills, pendingSettlements] = await Promise.all([
    getPendingBillsForUser(),
    getPendingSettlementsForUser(),
  ]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Pending Approvals</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Items waiting for your review
        </p>
      </div>
      <PendingItems pendingBills={pendingBills} pendingSettlements={pendingSettlements} />
    </div>
  );
}
