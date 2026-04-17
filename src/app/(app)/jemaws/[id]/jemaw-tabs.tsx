"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { approveBill, rejectBill } from "@/actions/bills";
import { approveSettlement, rejectSettlement } from "@/actions/settlements";
import { removeMember, leaveJemaw } from "@/actions/jemaws";
import { getJemawActivity } from "@/actions/activity";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { Check, X, ArrowRight, AlertCircle, Search, Clock, UserMinus, LogOut } from "lucide-react";

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
  receiptUrl: string | null;
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
  currency: string;
  isAdmin: boolean;
  members: Member[];
  bills: Bill[];
  settlements: Settlement[];
};

type ActivityLog = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: string | null;
  createdAt: Date;
  user: { id: string; name: string };
};

function statusBadge(status: string) {
  if (status === "approved")
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
  if (status === "rejected")
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
  return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>;
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function actionLabel(action: string, metadata: string | null): string {
  const meta = metadata ? JSON.parse(metadata) : {};
  switch (action) {
    case "bill.created": return `added a bill: "${meta.description ?? ""}" — ${meta.amount ?? ""}`;
    case "bill.approved": return `approved bill: "${meta.description ?? ""}"`;
    case "bill.rejected": return `rejected bill: "${meta.description ?? ""}"`;
    case "settlement.created": return `recorded a payment of ${meta.amount ?? ""} to ${meta.receiverName ?? ""}`;
    case "settlement.approved": return `confirmed payment of ${meta.amount ?? ""}`;
    case "settlement.rejected": return `rejected payment of ${meta.amount ?? ""}`;
    default: return action;
  }
}

function MembersTab({
  members,
  currency,
  currentUserId,
  isAdmin,
  jemawId,
}: {
  members: Member[];
  currency: string;
  currentUserId: string;
  isAdmin: boolean;
  jemawId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmLeave, setConfirmLeave] = useState(false);

  function handleRemove(userId: string) {
    startTransition(async () => {
      try {
        const result = await removeMember({ jemawId, userId });
        toast.success(result.message);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to remove member");
      }
    });
  }

  function handleLeave() {
    if (!confirmLeave) { setConfirmLeave(true); return; }
    startTransition(async () => {
      try {
        const result = await leaveJemaw({ jemawId });
        toast.success(result.message);
        router.push("/dashboard");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to leave group");
        setConfirmLeave(false);
      }
    });
  }

  return (
    <div className="space-y-2">
      {members.map((m) => {
        const bal = parseFloat(m.balance);
        const isMe = m.userId === currentUserId;
        return (
          <div key={m.userId} className="flex items-center gap-3 p-3 rounded-lg border">
            <Avatar className="w-9 h-9">
              <AvatarFallback className="text-xs">{initials(m.user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{m.user.name}</span>
                {m.isAdmin && <Badge variant="secondary" className="text-xs py-0">Admin</Badge>}
                {isMe && <span className="text-xs text-muted-foreground">(you)</span>}
              </div>
              <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-sm font-medium">
                {bal === 0 ? (
                  <span className="text-muted-foreground">Settled</span>
                ) : bal > 0 ? (
                  <span className="text-green-600">+{formatCurrency(bal, currency)}</span>
                ) : (
                  <span className="text-red-600">-{formatCurrency(Math.abs(bal), currency)}</span>
                )}
              </div>
              {isAdmin && !isMe && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive h-7 px-2"
                  disabled={isPending}
                  onClick={() => handleRemove(m.userId)}
                >
                  <UserMinus className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {/* Leave group button for non-admins */}
      {!isAdmin && (
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/40 hover:bg-destructive/10"
            disabled={isPending}
            onClick={handleLeave}
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            {confirmLeave ? "Click again to confirm" : "Leave group"}
          </Button>
          {confirmLeave && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-2"
              onClick={() => setConfirmLeave(false)}
            >
              Cancel
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

const BILL_CATEGORIES = [
  "all", "breakfast", "lunch", "dinner", "groceries", "transportation",
  "utilities", "rent", "entertainment", "vacation", "shopping", "healthcare", "other",
];

function BillsTab({
  bills,
  currentUserId,
  currency,
}: {
  bills: Bill[];
  currentUserId: string;
  currency: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const filtered = useMemo(() => {
    return bills.filter((b) => {
      if (catFilter !== "all" && b.category !== catFilter) return false;
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (search && !b.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [bills, catFilter, statusFilter, search]);

  const hasFilters = catFilter !== "all" || statusFilter !== "all" || search;

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search bills…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="h-8 text-sm w-[130px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {BILL_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">
                {c === "all" ? "All categories" : c.charAt(0).toUpperCase() + c.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 text-sm w-[120px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => { setSearch(""); setCatFilter("all"); setStatusFilter("all"); }}
          >
            Clear
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-10 text-sm">
          {bills.length === 0 ? "No bills yet. Add one to get started." : "No bills match your filters."}
        </p>
      ) : (
        filtered.map((bill) => {
          const isInSplit = bill.splits.some((s) => s.userId === currentUserId);
          const isPayer = bill.paidBy.id === currentUserId;
          const canAct = bill.status === "pending" && isInSplit && !isPayer;

          return (
            <div key={bill.id} className="p-4 rounded-lg border space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{bill.description}</span>
                    <Badge variant="outline" className="text-xs capitalize">{bill.category}</Badge>
                    {statusBadge(bill.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Paid by {bill.paidBy.name} · {new Date(bill.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="font-semibold text-sm shrink-0">
                  {formatCurrency(bill.amount, currency)}
                </span>
              </div>

              {bill.splits.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Split between: {bill.splits.map((s) => s.user.name).join(", ")}
                </p>
              )}

              {bill.receiptUrl && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Receipt</p>
                  <a href={bill.receiptUrl} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={bill.receiptUrl}
                      alt="Receipt"
                      className="rounded-md border max-h-40 object-contain bg-muted w-full hover:opacity-90 transition-opacity cursor-zoom-in"
                    />
                  </a>
                </div>
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
        })
      )}
    </div>
  );
}

function SettlementsTab({
  settlements,
  currentUserId,
  currency,
}: {
  settlements: Settlement[];
  currentUserId: string;
  currency: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

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
    if (!rejectTarget || !rejectReason.trim()) return;
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

  const filtered = useMemo(() => {
    return settlements.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !s.payer.name.toLowerCase().includes(q) &&
          !s.receiver.name.toLowerCase().includes(q) &&
          !(s.description?.toLowerCase().includes(q))
        ) return false;
      }
      return true;
    });
  }, [settlements, statusFilter, search]);

  const hasFilters = statusFilter !== "all" || search;

  if (settlements.length === 0) {
    return <p className="text-center text-muted-foreground py-10 text-sm">No settlements yet.</p>;
  }

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 text-sm w-[120px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setSearch(""); setStatusFilter("all"); }}>
            Clear
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-10 text-sm">No settlements match your filters.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
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
                    {formatCurrency(s.amount, currency)}
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
      )}

      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => { if (!open) { setRejectTarget(null); setRejectReason(""); } }}
      >
        <DialogContent>
          <DialogHeader><DialogTitle>Reject settlement</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              The payer will see your reason. Be specific so they know what to fix.
            </p>
            <Textarea
              placeholder="e.g. Screenshot doesn't match amount, payment wasn't received..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(""); }} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={isPending || !rejectReason.trim()}>
              {isPending ? "Rejecting…" : "Confirm rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ActivityTab({ jemawId }: { jemawId: string }) {
  const [logs, setLogs] = useState<ActivityLog[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJemawActivity(jemawId)
      .then((data) => setLogs(data as ActivityLog[]))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [jemawId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center text-sm">
        <Clock className="w-4 h-4 animate-spin" />
        Loading activity…
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-10 text-sm">
        No activity recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-3 py-2 border-b last:border-0">
          <Avatar className="w-7 h-7 mt-0.5 shrink-0">
            <AvatarFallback className="text-xs">{initials(log.user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-medium">{log.user.name}</span>{" "}
              <span className="text-muted-foreground">{actionLabel(log.action, log.metadata)}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(log.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
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
        <TabsTrigger value="members">Members ({jemaw.members.length})</TabsTrigger>
        <TabsTrigger value="bills">Bills ({jemaw.bills.length})</TabsTrigger>
        <TabsTrigger value="settlements">Settlements ({jemaw.settlements.length})</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>
      <TabsContent value="members">
        <MembersTab
          members={jemaw.members}
          currency={jemaw.currency}
          currentUserId={currentUserId}
          isAdmin={jemaw.isAdmin}
          jemawId={jemaw.id}
        />
      </TabsContent>
      <TabsContent value="bills">
        <BillsTab bills={jemaw.bills} currentUserId={currentUserId} currency={jemaw.currency} />
      </TabsContent>
      <TabsContent value="settlements">
        <SettlementsTab settlements={jemaw.settlements} currentUserId={currentUserId} currency={jemaw.currency} />
      </TabsContent>
      <TabsContent value="activity">
        <ActivityTab jemawId={jemaw.id} />
      </TabsContent>
    </Tabs>
  );
}
