"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getSuggestedSettlements } from "@/actions/jemaws";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { CreateSettlementForm } from "./settlements/new/create-settlement-form";

type Suggestion = {
  payerId: string;
  payerName: string;
  receiverId: string;
  receiverName: string;
  amount: string;
};

type Member = {
  userId: string;
  user: { id: string; name: string };
};

export function SettleUpDialog({
  children,
  jemawId,
  currency,
  members,
}: {
  children: React.ReactNode;
  jemawId: string;
  currency: string;
  members: Member[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<"suggestions" | "form">("suggestions");
  const [selected, setSelected] = useState<{ receiverId: string; amount: string } | null>(null);

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setStep("suggestions");
      setSelected(null);
    }
    if (isOpen && suggestions === null) {
      startTransition(async () => {
        try {
          const results = await getSuggestedSettlements(jemawId);
          setSuggestions(results);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed to load suggestions");
          setOpen(false);
        }
      });
    }
  }

  function handlePay(s: Suggestion) {
    setSelected({ receiverId: s.receiverId, amount: s.amount });
    setStep("form");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        {step === "suggestions" ? (
          <>
            <DialogHeader>
              <DialogTitle>Settle up</DialogTitle>
            </DialogHeader>

            {isPending ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : suggestions === null ? null : suggestions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm font-semibold text-slate-900">Everyone is settled up!</p>
                <p className="text-sm text-slate-400 mt-1">No payments needed right now.</p>
              </div>
            ) : (
              <div className="space-y-2 mt-2">
                <p className="text-sm text-slate-500 mb-4">
                  These payments settle all debts in the fewest transactions.
                </p>
                {suggestions.map((s) => (
                  <div
                    key={`${s.payerId}-${s.receiverId}-${s.amount}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60"
                  >
                    <div className="flex items-center gap-2 text-sm min-w-0">
                      <span className="font-medium text-slate-900 truncate">{s.payerName}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      <span className="font-medium text-slate-900 truncate">{s.receiverName}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-semibold text-sm text-slate-900">
                        {formatCurrency(s.amount, currency)}
                      </span>
                      <Button size="sm" className="h-7 text-xs" onClick={() => handlePay(s)}>
                        Pay
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setStep("suggestions"); setSelected(null); }}
                  className="text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <DialogTitle>Record payment</DialogTitle>
              </div>
            </DialogHeader>
            <CreateSettlementForm
              jemawId={jemawId}
              members={members}
              currency={currency}
              defaultReceiverId={selected?.receiverId}
              defaultAmount={selected?.amount}
              onSuccess={() => {
                setOpen(false);
                setStep("suggestions");
                setSelected(null);
                setSuggestions(null);
                router.refresh();
              }}
              onBack={() => { setStep("suggestions"); setSelected(null); }}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
