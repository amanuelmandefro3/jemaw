import { getPendingBillsForUser } from "@/actions/bills";
import { getPendingSettlementsForUser } from "@/actions/settlements";
import { PendingItems } from "./pending-items";

export default async function PendingPage() {
  const [pendingBills, pendingSettlements] = await Promise.all([
    getPendingBillsForUser(),
    getPendingSettlementsForUser(),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Pending Approvals</h1>
        <p className="text-sm text-slate-500 mt-0.5">Items waiting for your review</p>
      </div>
      <PendingItems pendingBills={pendingBills} pendingSettlements={pendingSettlements} />
    </div>
  );
}
