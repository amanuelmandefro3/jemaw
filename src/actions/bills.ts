"use server";

import { db } from "@/db";
import {
  bills,
  billSplits,
  jemawMembers,
  jemaws,
  users,
} from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { notifyUsersForBillApproval } from "@/lib/email";
import { formatCurrency } from "@/lib/utils";
import { eq, and, sql, ne, inArray } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// Validation schemas
const createBillSchema = z.object({
  jemawId: z.string().uuid(),
  description: z.string().min(1, "Description is required").max(255),
  amount: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Amount must be a positive number" }
  ),
  category: z.enum([
    "breakfast",
    "lunch",
    "dinner",
    "groceries",
    "transportation",
    "utilities",
    "rent",
    "entertainment",
    "vacation",
    "shopping",
    "healthcare",
    "other",
  ]),
  splitUserIds: z.array(z.string()).min(1, "At least one user must be in the split"),
});

const approveBillSchema = z.object({
  billId: z.string().uuid(),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;

export async function createBill(input: CreateBillInput) {
  const session = await requireAuth();
  const userId = session.user.id;

  const validatedData = createBillSchema.parse(input);
  const { jemawId, description, amount, category, splitUserIds } = validatedData;

  // Verify user is a member of the jemaw
  const membership = await db.query.jemawMembers.findFirst({
    where: and(
      eq(jemawMembers.jemawId, jemawId),
      eq(jemawMembers.userId, userId)
    ),
  });

  if (!membership) {
    throw new Error("You are not a member of this group");
  }

  // Verify all split users are members of the jemaw
  const splitMembers = await db.query.jemawMembers.findMany({
    where: and(
      eq(jemawMembers.jemawId, jemawId),
      inArray(jemawMembers.userId, splitUserIds)
    ),
  });

  if (splitMembers.length !== splitUserIds.length) {
    throw new Error("All users in the split must be members of this group");
  }

  // Calculate split amounts (equal split)
  const totalAmount = parseFloat(amount);
  const splitCount = splitUserIds.length;
  const splitAmount = (totalAmount / splitCount).toFixed(2);

  // Create bill and splits in a transaction
  const result = await db.transaction(async (tx) => {
    // Create the bill with pending status
    const [newBill] = await tx
      .insert(bills)
      .values({
        jemawId,
        description,
        amount,
        category,
        paidById: userId,
        status: "pending",
      })
      .returning();

    // Create bill splits
    const splitValues = splitUserIds.map((splitUserId) => ({
      billId: newBill.id,
      userId: splitUserId,
      amount: splitAmount,
    }));

    await tx.insert(billSplits).values(splitValues);

    return newBill;
  });

  // Get jemaw info and eligible approvers for notification
  const jemaw = await db.query.jemaws.findFirst({
    where: eq(jemaws.id, jemawId),
  });

  // Get users who can approve (involved in split but not the payer)
  const eligibleApproverIds = splitUserIds.filter((id) => id !== userId);

  if (eligibleApproverIds.length > 0) {
    const approvers = await db.query.users.findMany({
      where: inArray(users.id, eligibleApproverIds),
    });

    const payer = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    // Send notification emails (fire and forget)
    notifyUsersForBillApproval({
      billId: result.id,
      jemawId,
      jemawName: jemaw?.name || "Unknown Group",
      description,
      amount: formatCurrency(amount),
      paidByName: payer?.name || "Someone",
      eligibleApprovers: approvers.map((a) => ({
        email: a.email,
        name: a.name,
      })),
    }).catch(console.error);
  }

  revalidatePath(`/jemaws/${jemawId}`);

  return {
    success: true,
    bill: result,
    message: "Bill created successfully. Awaiting approval.",
  };
}

export async function approveBill(input: z.infer<typeof approveBillSchema>) {
  const session = await requireAuth();
  const userId = session.user.id;

  const validatedData = approveBillSchema.parse(input);
  const { billId } = validatedData;

  // Get the bill with splits
  const bill = await db.query.bills.findFirst({
    where: eq(bills.id, billId),
    with: {
      splits: true,
      jemaw: true,
    },
  });

  if (!bill) {
    throw new Error("Bill not found");
  }

  // IMMUTABILITY CHECK: Prevent modification of approved bills
  if (bill.status === "approved") {
    throw new Error("This bill has already been approved and cannot be modified");
  }

  if (bill.status === "rejected") {
    throw new Error("This bill has been rejected and cannot be approved");
  }

  // Verify user is a member of the jemaw
  const membership = await db.query.jemawMembers.findFirst({
    where: and(
      eq(jemawMembers.jemawId, bill.jemawId),
      eq(jemawMembers.userId, userId)
    ),
  });

  if (!membership) {
    throw new Error("You are not a member of this group");
  }

  // APPROVAL RULE: The approver must be in the split but NOT the payer
  const isInSplit = bill.splits.some((split) => split.userId === userId);
  const isPayer = bill.paidById === userId;

  if (!isInSplit) {
    throw new Error("Only users involved in this bill can approve it");
  }

  if (isPayer) {
    throw new Error("The person who paid cannot approve their own bill");
  }

  // Approve the bill and update balances in a transaction
  await db.transaction(async (tx) => {
    // Update bill status to approved
    await tx
      .update(bills)
      .set({
        status: "approved",
        approvedById: userId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(bills.id, billId));

    // Update balances for the payer (positive balance - they are owed money)
    // Calculate total owed to payer (exclude their own portion if they're in the split)
    const payerSplit = bill.splits.find((s) => s.userId === bill.paidById);
    const payerOwedAmount = payerSplit
      ? parseFloat(bill.amount) - parseFloat(payerSplit.amount)
      : parseFloat(bill.amount);

    await tx
      .update(jemawMembers)
      .set({
        balance: sql`${jemawMembers.balance} + ${payerOwedAmount.toFixed(2)}`,
      })
      .where(
        and(
          eq(jemawMembers.jemawId, bill.jemawId),
          eq(jemawMembers.userId, bill.paidById)
        )
      );

    // Update balances for split users (negative balance - they owe money)
    // Skip the payer if they're in the split (their positive adjustment handles it)
    for (const split of bill.splits) {
      if (split.userId !== bill.paidById) {
        await tx
          .update(jemawMembers)
          .set({
            balance: sql`${jemawMembers.balance} - ${split.amount}`,
          })
          .where(
            and(
              eq(jemawMembers.jemawId, bill.jemawId),
              eq(jemawMembers.userId, split.userId)
            )
          );
      }
    }
  });

  revalidatePath(`/jemaws/${bill.jemawId}`);

  return {
    success: true,
    message: "Bill approved successfully. Balances have been updated.",
  };
}

export async function rejectBill(input: z.infer<typeof approveBillSchema>) {
  const session = await requireAuth();
  const userId = session.user.id;

  const validatedData = approveBillSchema.parse(input);
  const { billId } = validatedData;

  const bill = await db.query.bills.findFirst({
    where: eq(bills.id, billId),
    with: {
      splits: true,
    },
  });

  if (!bill) {
    throw new Error("Bill not found");
  }

  // IMMUTABILITY CHECK
  if (bill.status === "approved") {
    throw new Error("This bill has already been approved and cannot be rejected");
  }

  if (bill.status === "rejected") {
    throw new Error("This bill has already been rejected");
  }

  // Verify user is in the split but not the payer
  const isInSplit = bill.splits.some((split) => split.userId === userId);
  const isPayer = bill.paidById === userId;

  if (!isInSplit || isPayer) {
    throw new Error("Only users involved in this bill (excluding the payer) can reject it");
  }

  await db
    .update(bills)
    .set({
      status: "rejected",
      updatedAt: new Date(),
    })
    .where(eq(bills.id, billId));

  revalidatePath(`/jemaws/${bill.jemawId}`);

  return {
    success: true,
    message: "Bill rejected.",
  };
}

export async function getBillsByJemaw(jemawId: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  // Verify membership
  const membership = await db.query.jemawMembers.findFirst({
    where: and(
      eq(jemawMembers.jemawId, jemawId),
      eq(jemawMembers.userId, userId)
    ),
  });

  if (!membership) {
    throw new Error("You are not a member of this group");
  }

  const jemawBills = await db.query.bills.findMany({
    where: eq(bills.jemawId, jemawId),
    with: {
      paidBy: true,
      approvedBy: true,
      splits: {
        with: {
          user: true,
        },
      },
    },
    orderBy: (bills, { desc }) => [desc(bills.createdAt)],
  });

  return jemawBills;
}

export async function getPendingBillsForUser() {
  const session = await requireAuth();
  const userId = session.user.id;

  // Get all bill splits for this user where the bill is pending and user is not the payer
  const pendingBills = await db.query.billSplits.findMany({
    where: eq(billSplits.userId, userId),
    with: {
      bill: {
        with: {
          paidBy: true,
          jemaw: true,
          splits: {
            with: {
              user: true,
            },
          },
        },
      },
    },
  });

  // Filter to only pending bills where user is not the payer
  return pendingBills
    .filter(
      (split) =>
        split.bill.status === "pending" && split.bill.paidById !== userId
    )
    .map((split) => split.bill);
}
