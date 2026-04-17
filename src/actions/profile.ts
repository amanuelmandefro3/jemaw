"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  image: z.string().url().optional().or(z.literal("")),
});

export async function updateProfile(input: z.infer<typeof updateProfileSchema>) {
  const session = await requireAuth();
  const userId = session.user.id;

  const { name, image } = updateProfileSchema.parse(input);

  await db
    .update(users)
    .set({
      name,
      image: image || null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return { success: true, message: "Profile updated successfully" };
}

export async function getProfile() {
  const session = await requireAuth();
  const userId = session.user.id;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) throw new Error("User not found");
  return user;
}
