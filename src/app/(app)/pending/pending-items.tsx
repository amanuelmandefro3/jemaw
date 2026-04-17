"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { approveBill, rejectBill } from "@/actions/bills";
import { approveSettlement, rejectSettlement } from "@/actions/settlements";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { Check, X } from "lucide-react";

type PendingBill = {
  id: string;
  description: string;
  amount: string;
  category: string;
  createdAt: Date;
  paidBy: { name: string };
  jemaw: { name: string };
  splits: { userId: string; user: { name: string } }[];
};

type PendingSettlement = {
  id: string;
  amount: string;
  description: string | null;
  paymentProofUrl: string | null;
  createdAt: Date;
  payer: { name: string };
  jemaw: { name: string };
};

export function PendingItems({
  pendingBills,
  pendingSettlements,
}: {
  pendingBills: PendingBill[];
  pendingSettlements: PendingSettlement[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  function handleBill(action: "approve" | "reject", billId: string) {
    startTransition(async () => {
      try {
        const fn = action === "approve" ? approveBill : rejectBill;
        const result = await fn({ billId });
        toast.success(result.message);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Action failed");
      }
    });
  }

  function handleApproveSettlement(settlementId: string) {
    startTransition(async () => {
      try {
        const result = await approveSettlement({ settlementId });
        toast.success(result.message);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Action failed");
      }
    });
  }

  function handleRejectConfirm() {
    if (!rejectTarget || !rejectReason.trim()) return;
    startTransition(async () => {
      try {
        const result = await rejectSettlement({
          settlementId: rejectTarget,
          reason: rejectReason.trim(),
        });
        toast.success(result.message);
        setRejectTarget(null);
        setRejectReason("");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Action failed");
      }
    });
  }

  const totalCount = pendingBills.length + pendingSettlements.length;

  if (totalCount === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg font-medium mb-1">All caught up!</p>
        <p className="text-sm">No items pending your approval.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {pendingBills.length > 0 && (
          <section>
            <h2 className="text-base font-semibold mb-3">
              Bills ({pendingBills.length})
            </h2>
            <div className="space-y-3">
              {pendingBills.map((bill) => (
                <div key={bill.id} className="p-4 rounded-lg border space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{bill.description}</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {bill.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Paid by {bill.paidBy.name} · in {bill.jemaw.name} ·{" "}
                        {new Date(bill.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Split between: {bill.splits.map((s) => s.user.name).join(", ")}
                      </p>
                    </div>
                    <span className="font-semibold text-sm shrink-0">
                      {formatCurrency(bill.amount)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-700 border-green-300 hover:bg-green-50"
                      disabled={isPending}
                      onClick={() => handleBill("approve", bill.id)}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-700 border-red-300 hover:bg-red-50"
                      disabled={isPending}
                      onClick={() => handleBill("reject", bill.id)}
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {pendingSettlements.length > 0 && (
          <section>
            <h2 className="text-base font-semibold mb-3">
              Settlements ({pendingSettlements.length})
            </h2>
            <div className="space-y-3">
              {pendingSettlements.map((s) => (
                <div key={s.id} className="p-4 rounded-lg border space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{s.payer.name} paid you</p>
                      {s.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {s.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        in {s.jemaw.name} · {new Date(s.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-semibold text-sm shrink-0">
                      {formatCurrency(s.amount)}
                    </span>
                  </div>

                  {s.paymentProofUrl && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Payment proof</p>
                      <a href={s.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={s.paymentProofUrl}
                          alt="Payment proof"
                          className="rounded-md border max-h-48 object-contain bg-muted w-full hover:opacity-90 transition-opacity cursor-zoom-in"
                        />
                      </a>
                      <p className="text-xs text-muted-foreground">Click to view full size</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-700 border-green-300 hover:bg-green-50"
                      disabled={isPending}
                      onClick={() => handleApproveSettlement(s.id)}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Confirm received
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-700 border-red-300 hover:bg-red-50"
                      disabled={isPending}
                      onClick={() => { setRejectTarget(s.id); setRejectReason(""); }}
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Reject dialog */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => { if (!open) { setRejectTarget(null); setRejectReason(""); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject settlement</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              The payer will see your reason. Be specific so they know what to fix.
            </p>
            <Textarea
              placeholder="e.g. The screenshot doesn't match the amount, payment wasn't received, wrong account..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setRejectTarget(null); setRejectReason(""); }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={isPending || !rejectReason.trim()}
            >
              {isPending ? "Rejecting…" : "Confirm rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
