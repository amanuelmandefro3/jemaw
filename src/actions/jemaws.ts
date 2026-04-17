"use server";

import { db } from "@/db";
import { jemaws, jemawMembers, jemawInvitations, users } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { sendJemawInvitationEmail } from "@/lib/email";
import { eq, and, or } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

const createJemawSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
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

  // Create jemaw and add creator as admin member
  const result = await db.transaction(async (tx) => {
    const [newJemaw] = await tx
      .insert(jemaws)
      .values({
        name: validatedData.name,
        description: validatedData.description || null,
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

  return {
    success: true,
    jemaw: result,
    message: "Group created successfully",
  };
}

export async function inviteMember(input: InviteMemberInput) {
  const session = await requireAuth();
  const userId = session.user.id;

  const validatedData = inviteMemberSchema.parse(input);
  const { jemawId, email } = validatedData;

  // Verify user is a member (preferably admin) of the jemaw
  const membership = await db.query.jemawMembers.findFirst({
    where: and(
      eq(jemawMembers.jemawId, jemawId),
      eq(jemawMembers.userId, userId)
    ),
  });

  if (!membership) {
    throw new Error("You are not a member of this group");
  }

  // Check if user with this email already exists and is a member
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    const existingMembership = await db.query.jemawMembers.findFirst({
      where: and(
        eq(jemawMembers.jemawId, jemawId),
        eq(jemawMembers.userId, existingUser.id)
      ),
    });

    if (existingMembership) {
      throw new Error("This user is already a member of the group");
    }
  }

  // Check if there's already a pending invitation for this email
  const existingInvitation = await db.query.jemawInvitations.findFirst({
    where: and(
      eq(jemawInvitations.jemawId, jemawId),
      eq(jemawInvitations.email, email),
      // Not yet accepted
      eq(jemawInvitations.acceptedAt, null as unknown as Date)
    ),
  });

  if (existingInvitation && existingInvitation.expiresAt > new Date()) {
    throw new Error("An invitation has already been sent to this email");
  }

  // Get jemaw and inviter info
  const jemaw = await db.query.jemaws.findFirst({
    where: eq(jemaws.id, jemawId),
  });

  const inviter = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!jemaw || !inviter) {
    throw new Error("Group or user not found");
  }

  // Create invitation token
  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  // Create invitation
  const [invitation] = await db
    .insert(jemawInvitations)
    .values({
      jemawId,
      email,
      invitedById: userId,
      token,
      expiresAt,
    })
    .returning();

  // Send invitation email
  await sendJemawInvitationEmail({
    to: email,
    inviterName: inviter.name,
    jemawName: jemaw.name,
    token,
  });

  revalidatePath(`/jemaws/${jemawId}`);

  return {
    success: true,
    invitation,
    message: `Invitation sent to ${email}`,
  };
}

export async function acceptInvitation(input: { token: string }) {
  const session = await requireAuth();
  const userId = session.user.id;

  const validatedData = acceptInvitationSchema.parse(input);
  const { token } = validatedData;

  // Find the invitation
  const invitation = await db.query.jemawInvitations.findFirst({
    where: eq(jemawInvitations.token, token),
    with: {
      jemaw: true,
    },
  });

  if (!invitation) {
    throw new Error("Invalid invitation");
  }

  if (invitation.acceptedAt) {
    throw new Error("This invitation has already been used");
  }

  if (invitation.expiresAt < new Date()) {
    throw new Error("This invitation has expired");
  }

  // Check if user is already a member
  const existingMembership = await db.query.jemawMembers.findFirst({
    where: and(
      eq(jemawMembers.jemawId, invitation.jemawId),
      eq(jemawMembers.userId, userId)
    ),
  });

  if (existingMembership) {
    throw new Error("You are already a member of this group");
  }

  // Accept invitation and add as member
  await db.transaction(async (tx) => {
    // Mark invitation as accepted
    await tx
      .update(jemawInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(jemawInvitations.id, invitation.id));

    // Add user as member
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
          members: {
            with: {
              user: true,
            },
          },
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

  const jemaw = await db.query.jemaws.findFirst({
    where: eq(jemaws.id, jemawId),
    with: {
      createdBy: true,
      members: {
        with: {
          user: true,
        },
      },
      bills: {
        with: {
          paidBy: true,
          splits: {
            with: {
              user: true,
            },
          },
        },
        orderBy: (bills, { desc }) => [desc(bills.createdAt)],
        limit: 10,
      },
      settlements: {
        with: {
          payer: true,
          receiver: true,
        },
        orderBy: (settlements, { desc }) => [desc(settlements.createdAt)],
        limit: 10,
      },
    },
  });

  if (!jemaw) {
    throw new Error("Group not found");
  }

  return {
    ...jemaw,
    myBalance: membership.balance,
    isAdmin: membership.isAdmin,
  };
}

export async function getInvitationByToken(token: string) {
  const invitation = await db.query.jemawInvitations.findFirst({
    where: eq(jemawInvitations.token, token),
    with: {
      jemaw: true,
    },
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

  const members = await db.query.jemawMembers.findMany({
    where: eq(jemawMembers.jemawId, jemawId),
    with: {
      user: true,
    },
  });

  return members;
}
