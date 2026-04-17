"use server";

import { db } from "@/db";
import {
  jemaws,
  jemawMembers,
  jemawInvitations,
  users,
  bills,
  billSplits,
} from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { sendJemawInvitationEmail } from "@/lib/email";
import { eq, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { SUPPORTED_CURRENCIES } from "@/lib/constants";

const createJemawSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  currency: z.enum(SUPPORTED_CURRENCIES).default("USD"),
});

const updateJemawSchema = z.object({
  jemawId: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  currency: z.enum(SUPPORTED_CURRENCIES),
});

const inviteMemberSchema = z.object({
  jemawId: z.string().uuid(),
  email: z.string().email("Invalid email address"),
});

const acceptInvitationSchema = z.object({
  token: z.string().min(1),
});

export type CreateJemawInput = z.infer<typeof createJemawSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export async function createJemaw(input: CreateJemawInput) {
  const session = await requireAuth();
  const userId = session.user.id;

  const validatedData = createJemawSchema.parse(input);

  const result = await db.transaction(async (tx) => {
    const [newJemaw] = await tx
      .insert(jemaws)
      .values({
        name: validatedData.name,
        description: validatedData.description || null,
        currency: validatedData.currency,
        createdById: userId,
      })
      .returning();

    await tx.insert(jemawMembers).values({
      jemawId: newJemaw.id,
      userId,
      isAdmin: true,
      balance: "0.00",
    });

    return newJemaw;
  });

  revalidatePath("/jemaws");
  revalidatePath("/dashboard");

  return { success: true, jemaw: result, message: "Group created successfully" };
}

export async function updateJemaw(input: z.infer<typeof updateJemawSchema>) {
  const session = await requireAuth();
  const userId = session.user.id;

  const { jemawId, name, description, currency } = updateJemawSchema.parse(input);

  const membership = await db.query.jemawMembers.findFirst({
    where: and(eq(jemawMembers.jemawId, jemawId), eq(jemawMembers.userId, userId)),
  });

  if (!membership?.isAdmin) throw new Error("Only admins can edit this group");

  await db
    .update(jemaws)
    .set({ name, description: description || null, currency, updatedAt: new Date() })
    .where(eq(jemaws.id, jemawId));

  revalidatePath(`/jemaws/${jemawId}`);
  revalidatePath("/dashboard");

  return { success: true, message: "Group updated successfully" };
}

export async function deleteJemaw({ jemawId }: { jemawId: string }) {
  const session = await requireAuth();
  const userId = session.user.id;

  const membership = await db.query.jemawMembers.findFirst({
    where: and(eq(jemawMembers.jemawId, jemawId), eq(jemawMembers.userId, userId)),
  });

  if (!membership?.isAdmin) throw new Error("Only admins can delete this group");

  await db.delete(jemaws).where(eq(jemaws.id, jemawId));

  revalidatePath("/dashboard");

  return { success: true, message: "Group deleted successfully" };
}

export async function removeMember({ jemawId, userId: targetUserId }: { jemawId: string; userId: string }) {
  const session = await requireAuth();
  const adminId = session.user.id;

  const adminMembership = await db.query.jemawMembers.findFirst({
    where: and(eq(jemawMembers.jemawId, jemawId), eq(jemawMembers.userId, adminId)),
  });

  if (!adminMembership?.isAdmin) throw new Error("Only admins can remove members");
  if (adminId === targetUserId) throw new Error("Admins cannot remove themselves. Transfer admin rights first.");

  await db
    .delete(jemawMembers)
    .where(and(eq(jemawMembers.jemawId, jemawId), eq(jemawMembers.userId, targetUserId)));

  revalidatePath(`/jemaws/${jemawId}`);

  return { success: true, message: "Member removed from group" };
}

export async function leaveJemaw({ jemawId }: { jemawId: string }) {
  const session = await requireAuth();
  const userId = session.user.id;

  const membership = await db.query.jemawMembers.findFirst({
    where: and(eq(jemawMembers.jemawId, jemawId), eq(jemawMembers.userId, userId)),
  });

  if (!membership) throw new Error("You are not a member of this group");
  if (membership.isAdmin) {
    const allMembers = await db.query.jemawMembers.findMany({
      where: eq(jemawMembers.jemawId, jemawId),
    });
    if (allMembers.length > 1) {
      throw new Error("Transfer admin rights to another member before leaving");
    }
  }

  await db
    .delete(jemawMembers)
    .where(and(eq(jemawMembers.jemawId, jemawId), eq(jemawMembers.userId, userId)));

  revalidatePath("/dashboard");

  return { success: true, message: "You have left the group" };
}

export async function inviteMember(input: InviteMemberInput) {
  const session = await requireAuth();
  const userId = session.user.id;

  const validatedData = inviteMemberSchema.parse(input);
  const { jemawId, email } = validatedData;

  const membership = await db.query.jemawMembers.findFirst({
    where: and(eq(jemawMembers.jemawId, jemawId), eq(jemawMembers.userId, userId)),
  });

  if (!membership) throw new Error("You are not a member of this group");

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    const existingMembership = await db.query.jemawMembers.findFirst({
      where: and(eq(jemawMembers.jemawId, jemawId), eq(jemawMembers.userId, existingUser.id)),
    });
    if (existingMembership) throw new Error("This user is already a member of the group");
  }

  const existingInvitation = await db.query.jemawInvitations.findFirst({
    where: and(
      eq(jemawInvitations.jemawId, jemawId),
      eq(jemawInvitations.email, email),
      eq(jemawInvitations.acceptedAt, null as unknown as Date)
    ),
  });

  if (existingInvitation && existingInvitation.expiresAt > new Date()) {
    throw new Error("An invitation has already been sent to this email");
  }

  const jemaw = await db.query.jemaws.findFirst({ where: eq(jemaws.id, jemawId) });
  const inviter = await db.query.users.findFirst({ where: eq(users.id, userId) });

  if (!jemaw || !inviter) throw new Error("Group or user not found");

  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const [invitation] = await db
    .insert(jemawInvitations)
    .values({ jemawId, email, invitedById: userId, token, expiresAt })
    .returning();

  await sendJemawInvitationEmail({
    to: email,
    inviterName: inviter.name,
    jemawName: jemaw.name,
    token,
  });

  revalidatePath(`/jemaws/${jemawId}`);

  return { success: true, invitation, message: `Invitation sent to ${email}` };
}

export async function acceptInvitation(input: { token: string }) {
  const session = await requireAuth();
  const userId = session.user.id;

  const { token } = acceptInvitationSchema.parse(input);

  const invitation = await db.query.jemawInvitations.findFirst({
    where: eq(jemawInvitations.token, token),
    with: { jemaw: true },
  });

  if (!invitation) throw new Error("Invalid invitation");
  if (invitation.acceptedAt) throw new Error("This invitation has already been used");
  if (invitation.expiresAt < new Date()) throw new Error("This invitation has expired");

  const existingMembership = await db.query.jemawMembers.findFirst({
    where: and(eq(jemawMembers.jemawId, invitation.jemawId), eq(jemawMembers.userId, userId)),
  });

  if (existingMembership) throw new Error("You are already a member of this group");

  await db.transaction(async (tx) => {
    await tx
      .update(jemawInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(jemawInvitations.id, invitation.id));

    await tx.insert(jemawMembers).values({
      jemawId: invitation.jemawId,
      userId,
      isAdmin: false,
      balance: "0.00",
    });
  });

  revalidatePath("/jemaws");
  revalidatePath(`/jemaws/${invitation.jemawId}`);

  return {
    success: true,
    jemawId: invitation.jemawId,
    jemawName: invitation.jemaw.name,
    message: `You have joined ${invitation.jemaw.name}`,
  };
}

export async function getMyJemaws() {
  const session = await requireAuth();
  const userId = session.user.id;

  const memberships = await db.query.jemawMembers.findMany({
    where: eq(jemawMembers.userId, userId),
    with: {
      jemaw: {
        with: {
          members: { with: { user: true } },
        },
      },
    },
  });

  return memberships.map((m) => ({
    ...m.jemaw,
    myBalance: m.balance,
    isAdmin: m.isAdmin,
  }));
}

export async function getJemawById(jemawId: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  const membership = await db.query.jemawMembers.findFirst({
    where: and(eq(jemawMembers.jemawId, jemawId), eq(jemawMembers.userId, userId)),
  });

  if (!membership) throw new Error("You are not a member of this group");

  const jemaw = await db.query.jemaws.findFirst({
    where: eq(jemaws.id, jemawId),
    with: {
      createdBy: true,
      members: { with: { user: true } },
      bills: {
        with: {
          paidBy: true,
          splits: { with: { user: true } },
        },
        orderBy: (bills, { desc }) => [desc(bills.createdAt)],
        limit: 100,
      },
      settlements: {
        with: { payer: true, receiver: true },
        orderBy: (settlements, { desc }) => [desc(settlements.createdAt)],
        limit: 100,
      },
    },
  });

  if (!jemaw) throw new Error("Group not found");

  return {
    ...jemaw,
    myBalance: membership.balance,
    isAdmin: membership.isAdmin,
  };
}

export async function getSuggestedSettlements(jemawId: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  const membership = await db.query.jemawMembers.findFirst({
    where: and(eq(jemawMembers.jemawId, jemawId), eq(jemawMembers.userId, userId)),
  });

  if (!membership) throw new Error("You are not a member of this group");

  const members = await db.query.jemawMembers.findMany({
    where: eq(jemawMembers.jemawId, jemawId),
    with: { user: true },
  });

  const balances = members.map((m) => ({
    userId: m.userId,
    name: m.user.name,
    balance: parseFloat(m.balance),
  }));

  // Debt simplification: greedy minimum-transaction algorithm
  const creditors = balances
    .filter((b) => b.balance > 0.01)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.balance - a.balance);
  const debtors = balances
    .filter((b) => b.balance < -0.01)
    .map((b) => ({ ...b, balance: Math.abs(b.balance) }))
    .sort((a, b) => b.balance - a.balance);

  const suggestions: {
    payerId: string;
    payerName: string;
    receiverId: string;
    receiverName: string;
    amount: string;
  }[] = [];

  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const payment = Math.min(creditors[ci].balance, debtors[di].balance);
    if (payment > 0.01) {
      suggestions.push({
        payerId: debtors[di].userId,
        payerName: debtors[di].name,
        receiverId: creditors[ci].userId,
        receiverName: creditors[ci].name,
        amount: payment.toFixed(2),
      });
    }
    creditors[ci].balance -= payment;
    debtors[di].balance -= payment;
    if (creditors[ci].balance < 0.01) ci++;
    if (debtors[di].balance < 0.01) di++;
  }

  return suggestions;
}

export async function getJemawStats(jemawId: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  const membership = await db.query.jemawMembers.findFirst({
    where: and(eq(jemawMembers.jemawId, jemawId), eq(jemawMembers.userId, userId)),
  });

  if (!membership) throw new Error("You are not a member of this group");

  const approvedBills = await db.query.bills.findMany({
    where: and(eq(bills.jemawId, jemawId), eq(bills.status, "approved")),
  });

  const totalSpent = approvedBills.reduce((sum, b) => sum + parseFloat(b.amount), 0);

  const categoryMap: Record<string, number> = {};
  for (const bill of approvedBills) {
    categoryMap[bill.category] = (categoryMap[bill.category] || 0) + parseFloat(bill.amount);
  }
  const byCategory = Object.entries(categoryMap)
    .map(([category, total]) => ({ category, total: parseFloat(total.toFixed(2)) }))
    .sort((a, b) => b.total - a.total);

  const members = await db.query.jemawMembers.findMany({
    where: eq(jemawMembers.jemawId, jemawId),
    with: { user: true },
  });

  const memberBalances = members.map((m) => ({
    name: m.user.name,
    balance: parseFloat(m.balance),
    userId: m.userId,
  }));

  let myShare = 0;
  if (approvedBills.length > 0) {
    const mySplits = await db.query.billSplits.findMany({
      where: and(
        eq(billSplits.userId, userId),
        inArray(billSplits.billId, approvedBills.map((b) => b.id))
      ),
    });
    myShare = mySplits.reduce((sum, s) => sum + parseFloat(s.amount), 0);
  }

  return {
    totalSpent: parseFloat(totalSpent.toFixed(2)),
    byCategory,
    memberBalances,
    myShare: parseFloat(myShare.toFixed(2)),
    myBalance: parseFloat(membership.balance),
  };
}

export async function getInvitationByToken(token: string) {
  const invitation = await db.query.jemawInvitations.findFirst({
    where: eq(jemawInvitations.token, token),
    with: { jemaw: true },
  });

  if (!invitation) return null;

  return {
    jemawName: invitation.jemaw.name,
    isExpired: invitation.expiresAt < new Date(),
    isUsed: !!invitation.acceptedAt,
  };
}

export async function getJemawMembers(jemawId: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  const membership = await db.query.jemawMembers.findFirst({
    where: and(eq(jemawMembers.jemawId, jemawId), eq(jemawMembers.userId, userId)),
  });

  if (!membership) throw new Error("You are not a member of this group");

  return db.query.jemawMembers.findMany({
    where: eq(jemawMembers.jemawId, jemawId),
    with: { user: true },
  });
}
