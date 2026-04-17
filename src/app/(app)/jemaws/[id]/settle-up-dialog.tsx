"use client";

import { useState, useTransition } from "react";
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
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

type Suggestion = {
  payerId: string;
  payerName: string;
  receiverId: string;
  receiverName: string;
  amount: string;
};

export function SettleUpDialog({
  children,
  jemawId,
  currency,
}: {
  children: React.ReactNode;
  jemawId: string;
  currency: string;
}) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
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

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suggested settlements</DialogTitle>
        </DialogHeader>

        {isPending ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : suggestions === null ? null : suggestions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="font-medium">Everyone is settled up!</p>
            <p className="text-sm mt-1">No payments are needed right now.</p>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            <p className="text-sm text-muted-foreground">
              These payments will settle all debts in the fewest transactions possible.
            </p>
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border"
              >
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <span className="font-medium truncate">{s.payerName}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate">{s.receiverName}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold text-sm">
                    {formatCurrency(s.amount, currency)}
                  </span>
                  <Link
                    href={`/jemaws/${jemawId}/settlements/new?receiverId=${s.receiverId}&amount=${s.amount}`}
                    onClick={() => setOpen(false)}
                  >
                    <Button size="sm" variant="outline">Pay</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
