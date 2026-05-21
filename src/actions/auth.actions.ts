"use server";

import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import * as z from "zod";
import { db } from "@/db";
import { account, user } from "@/db/schemas/auth";

const registerSchema = z.object({
  email: z.string().email("Neplatný e-mail"),
  password: z.string().min(8, "Heslo musí mít alespoň 8 znaků"),
  name: z.string().min(1, "Jméno je povinné"),
});

export async function registerUser(input: z.infer<typeof registerSchema>) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Neplatná data" };
  }

  const { email, password, name } = parsed.data;

  // 1. Check if user already exists
  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  if (existingUser) {
    // Check if they already have a credentials account
    const existingAccount = await db.query.account.findFirst({
      where: eq(account.userId, existingUser.id),
    });

    if (existingAccount) {
      return { success: false, error: "Uživatel s tímto e-mailem již existuje." };
    }

    // They exist anonymously (created via listing). Link a credentials account to this existing user.
    const hashedPassword = await hashPassword(password);
    await db.update(user).set({ name }).where(eq(user.id, existingUser.id));
    await db.insert(account).values({
      id: crypto.randomUUID(),
      userId: existingUser.id,
      accountId: email,
      providerId: "credential",
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { success: true, needsSignIn: true };
  }

  // User does not exist, standard Better Auth sign up will proceed on the client side
  return { success: true, needsStandardSignUp: true };
}
