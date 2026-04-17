"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { approveBill, rejectBill } from "@/actions/bills";
import { approveSettlement, rejectSettlement } from "@/actions/settlements";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { Check, X, ArrowRight, AlertCircle } from "lucide-react";

type Member = {
  userId: string;
  balance: string;
  isAdmin: boolean;
  user: { id: string; name: string; email: string };
};

type BillSplit = {
  userId: string;
  amount: string;
  user: { id: string; name: string };
};

type Bill = {
  id: string;
  description: string;
  amount: string;
  category: string;
  status: string;
  createdAt: Date;
  paidBy: { id: string; name: string };
  splits: BillSplit[];
};

type Settlement = {
  id: string;
  amount: string;
  description: string | null;
  paymentProofUrl: string | null;
  rejectionReason: string | null;
  status: string;
  createdAt: Date;
  payer: { id: string; name: string };
  receiver: { id: string; name: string };
};

type JemawData = {
  id: string;
  members: Member[];
  bills: Bill[];
  settlements: Settlement[];
};

function statusBadge(status: string) {
  if (status === "approved")
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
  if (status === "rejected")
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
  return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function MembersTab({ members }: { members: Member[] }) {
  return (
    <div className="space-y-2">
      {members.map((m) => {
        const bal = parseFloat(m.balance);
        return (
          <div
            key={m.userId}
            className="flex items-center gap-3 p-3 rounded-lg border"
          >
            <Avatar className="w-9 h-9">
              <AvatarFallback className="text-xs">{initials(m.user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{m.user.name}</span>
                {m.isAdmin && (
                  <Badge variant="secondary" className="text-xs py-0">Admin</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
            </div>
            <div className="text-sm font-medium shrink-0">
              {bal === 0 ? (
                <span className="text-muted-foreground">Settled</span>
              ) : bal > 0 ? (
                <span className="text-green-600">+{formatCurrency(bal)}</span>
              ) : (
                <span className="text-red-600">-{formatCurrency(Math.abs(bal))}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BillsTab({
  bills,
  currentUserId,
}: {
  bills: Bill[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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

  if (bills.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-10 text-sm">
        No bills yet. Add one to get started.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {bills.map((bill) => {
        const isInSplit = bill.splits.some((s) => s.userId === currentUserId);
        const isPayer = bill.paidBy.id === currentUserId;
        const canAct = bill.status === "pending" && isInSplit && !isPayer;

        return (
          <div key={bill.id} className="p-4 rounded-lg border space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{bill.description}</span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {bill.category}
                  </Badge>
                  {statusBadge(bill.status)}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Paid by {bill.paidBy.name} · {new Date(bill.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="font-semibold text-sm shrink-0">
                {formatCurrency(bill.amount)}
              </span>
            </div>

            {bill.splits.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Split between: {bill.splits.map((s) => s.user.name).join(", ")}
              </p>
            )}

            {canAct && (
              <div className="flex gap-2 pt-1">
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
            )}
          </div>
        );
      })}
    </div>
  );
}

function SettlementsTab({
  settlements,
  currentUserId,
}: {
  settlements: Settlement[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  function handleApprove(settlementId: string) {
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
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    startTransition(async () => {
      try {
        const result = await rejectSettlement({ settlementId: rejectTarget, reason: rejectReason.trim() });
        toast.success(result.message);
        setRejectTarget(null);
        setRejectReason("");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Action failed");
      }
    });
  }

  if (settlements.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-10 text-sm">
        No settlements yet.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {settlements.map((s) => {
          const isReceiver = s.receiver.id === currentUserId;
          const canAct = s.status === "pending" && isReceiver;

          return (
            <div key={s.id} className="p-4 rounded-lg border space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{s.payer.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium">{s.receiver.name}</span>
                    {statusBadge(s.status)}
                  </div>
                  {s.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="font-semibold text-sm shrink-0">
                  {formatCurrency(s.amount)}
                </span>
              </div>

              {/* Payment proof screenshot */}
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

              {/* Rejection reason — shown to payer */}
              {s.status === "rejected" && s.rejectionReason && (
                <div className="flex gap-2 p-3 rounded-md bg-red-50 border border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-red-700">Rejection reason</p>
                    <p className="text-xs text-red-600 mt-0.5">{s.rejectionReason}</p>
                  </div>
                </div>
              )}

              {canAct && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-700 border-green-300 hover:bg-green-50"
                    disabled={isPending}
                    onClick={() => handleApprove(s.id)}
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
              )}
            </div>
          );
        })}
      </div>

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => { if (!open) { setRejectTarget(null); setRejectReason(""); } }}>
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

export function JemawTabs({
  jemaw,
  currentUserId,
}: {
  jemaw: JemawData;
  currentUserId: string;
}) {
  return (
    <Tabs defaultValue="members">
      <TabsList className="mb-4">
        <TabsTrigger value="members">
          Members ({jemaw.members.length})
        </TabsTrigger>
        <TabsTrigger value="bills">
          Bills ({jemaw.bills.length})
        </TabsTrigger>
        <TabsTrigger value="settlements">
          Settlements ({jemaw.settlements.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="members">
        <MembersTab members={jemaw.members} />
      </TabsContent>
      <TabsContent value="bills">
        <BillsTab bills={jemaw.bills} currentUserId={currentUserId} />
      </TabsContent>
      <TabsContent value="settlements">
        <SettlementsTab settlements={jemaw.settlements} currentUserId={currentUserId} />
      </TabsContent>
    </Tabs>
  );
}
