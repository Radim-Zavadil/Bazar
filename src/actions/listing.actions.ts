"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import * as z from "zod";
import { db } from "@/db";
import { listings } from "@/db/schemas";
import { session as sessionTable, user as userTable } from "@/db/schemas/auth";
import { auth } from "@/lib/auth";

const createListingSchema = z.object({
  title: z.string().min(1, "Název je povinný"),
  description: z.string().min(1, "Popis je povinný"),
  price: z.number().min(0, "Cena nemůže být záporná"),
  category: z.string().min(1, "Kategorie je povinná"),
  itemCondition: z.enum(["Nové", "Použité"]),
  status: z.string().default("Dostupné"),
  imageUrl: z.string().nullable().optional(),
  contactName: z.string().min(1, "Jméno kontaktu je povinné"),
  contactEmail: z.string().email("Neplatný e-mail").or(z.string().length(0)).nullable().optional(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type CreateListingResult = { success: true } | { success: false; error: string };

export async function createListing(input: CreateListingInput): Promise<CreateListingResult> {
  const parsed = createListingSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Neplatná data",
    };
  }

  const data = parsed.data;

  // Get active session
  const activeSession = await auth.api.getSession({
    headers: await headers(),
  });

  let userId: string;

  if (activeSession?.user) {
    userId = activeSession.user.id;
  } else {
    // Anonymous creation requires email
    if (!data.contactEmail) {
      return {
        success: false,
        error: "E-mail je povinný pro anonymní vytvoření inzerátu",
      };
    }

    const email = data.contactEmail.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await db.query.user.findFirst({
      where: eq(userTable.email, email),
    });

    if (existingUser) {
      userId = existingUser.id;
    } else {
      userId = crypto.randomUUID();
      await db.insert(userTable).values({
        id: userId,
        name: data.contactName,
        email: email,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Auto-login: create session and set cookie
    const token = crypto.randomUUID();
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

    await db.insert(sessionTable).values({
      id: sessionId,
      token: token,
      userId: userId,
      expiresAt: expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const cookieStore = await cookies();
    cookieStore.set("better-auth.session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
  }

  await db.insert(listings).values({
    title: data.title,
    description: data.description,
    sellerName: data.contactName,
    contactEmail: data.contactEmail || null,
    price: data.price === 0 ? null : data.price,
    category: data.category,
    itemCondition: data.itemCondition,
    status: data.status,
    imageUrl: data.imageUrl ?? null,
    userId: userId,
  });

  revalidatePath("/");
  revalidatePath("/inzeraty");

  return { success: true };
}

const updateListingSchema = z.object({
  title: z.string().min(1, "Název je povinný"),
  description: z.string().min(1, "Popis je povinný"),
  price: z.number().min(0, "Cena nemůže být záporná"),
  category: z.string().min(1, "Kategorie je povinná"),
  itemCondition: z.enum(["Nové", "Použité"]),
  status: z.string().min(1, "Stav je povinný"),
  imageUrl: z.string().nullable().optional(),
  contactName: z.string().min(1, "Jméno kontaktu je povinné"),
  contactEmail: z.string().email("Neplatný e-mail").or(z.string().length(0)).nullable().optional(),
});

export type UpdateListingInput = z.infer<typeof updateListingSchema>;

export async function updateListing(listingId: number, input: UpdateListingInput): Promise<CreateListingResult> {
  const parsed = updateListingSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Neplatná data",
    };
  }

  const data = parsed.data;

  // Retrieve current session
  const activeSession = await auth.api.getSession({
    headers: await headers(),
  });

  if (!activeSession?.user) {
    return { success: false, error: "Nejste přihlášen(a)" };
  }

  // Find the listing
  const existingListing = await db.query.listings.findFirst({
    where: eq(listings.id, listingId),
  });

  if (!existingListing) {
    return { success: false, error: "Inzerát nebyl nalezen" };
  }

  // Check ownership
  if (existingListing.userId !== activeSession.user.id) {
    return { success: false, error: "Tento inzerát vám nepatří" };
  }

  // Update
  await db
    .update(listings)
    .set({
      title: data.title,
      description: data.description,
      sellerName: data.contactName,
      contactEmail: data.contactEmail || null,
      price: data.price === 0 ? null : data.price,
      category: data.category,
      itemCondition: data.itemCondition,
      status: data.status,
      imageUrl: data.imageUrl ?? null,
    })
    .where(eq(listings.id, listingId));

  revalidatePath("/");
  revalidatePath("/inzeraty");

  return { success: true };
}
