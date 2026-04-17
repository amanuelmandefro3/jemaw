"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBill } from "@/actions/bills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users } from "lucide-react";

const CATEGORIES = [
  "breakfast", "lunch", "dinner", "groceries", "transportation",
  "utilities", "rent", "entertainment", "vacation", "shopping",
  "healthcare", "other",
] as const;

type Member = {
  userId: string;
  user: { id: string; name: string };
};

export function CreateBillForm({
  jemawId,
  members,
  currentUserId,
}: {
  jemawId: string;
  members: Member[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [isPending, startTransition] = useTransition();

  // Always split equally among ALL members — no selection
  const splitUserIds = members.map((m) => m.userId);
  const perPerson =
    amount && !isNaN(parseFloat(amount)) && splitUserIds.length > 0
      ? (parseFloat(amount) / splitUserIds.length).toFixed(2)
      : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const result = await createBill({
          jemawId,
          description,
          amount,
          category: category as (typeof CATEGORIES)[number],
          splitUserIds,
        });
        toast.success(result.message);
        router.push(`/jemaws/${jemawId}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create bill");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="Dinner at restaurant..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="amount">Amount ($)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Split summary — always all members */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Users className="w-4 h-4" />
          Split equally among all {members.length} members
        </div>
        <div className="divide-y">
          {members.map((m) => (
            <div key={m.userId} className="flex justify-between py-1.5 text-sm">
              <span className="text-muted-foreground">
                {m.user.name}
                {m.userId === currentUserId && (
                  <span className="ml-1 text-xs">(you)</span>
                )}
              </span>
              <span className="font-medium tabular-nums">
                {perPerson ? `$${perPerson}` : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.push(`/jemaws/${jemawId}`)}
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? "Adding…" : "Add bill"}
        </Button>
      </div>
    </form>
  );
}
