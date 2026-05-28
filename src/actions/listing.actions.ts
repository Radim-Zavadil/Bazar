"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import * as z from "zod";
import { db } from "@/db";
import { listings } from "@/db/schemas";
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
  address: z.string().optional().nullable(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type CreateListingResult = { success: true } | { success: false; error: string };

async function geocode(address: string) {
  try {
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(address)}`);
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].geometry.coordinates;
      return { lng, lat };
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }
  return null;
}

export async function createListing(input: CreateListingInput): Promise<CreateListingResult> {
  const parsed = createListingSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Neplatná data",
    };
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      success: false,
      error: "Pro vytvoření inzerátu se musíte přihlásit",
    };
  }

  const data = parsed.data;
  let lat = null;
  let lng = null;

  if (data.address) {
    const coords = await geocode(data.address);
    if (coords) {
      lat = coords.lat;
      lng = coords.lng;
    }
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
    address: data.address ?? null,
    lat,
    lng,
    userId: session.user.id,
    updatedAt: new Date(),
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
  address: z.string().optional().nullable(),
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

  const activeSession = await auth.api.getSession({
    headers: await headers(),
  });

  if (!activeSession?.user) {
    return { success: false, error: "Nejste přihlášen(a)" };
  }

  const existingListing = await db.query.listings.findFirst({
    where: eq(listings.id, listingId),
  });

  if (!existingListing) {
    return { success: false, error: "Inzerát nebyl nalezen" };
  }

  if (existingListing.userId !== activeSession.user.id) {
    return { success: false, error: "Tento inzerát vám nepatří" };
  }

  let lat = existingListing.lat;
  let lng = existingListing.lng;

  if (data.address && data.address !== existingListing.address) {
    const coords = await geocode(data.address);
    if (coords) {
      lat = coords.lat;
      lng = coords.lng;
    }
  } else if (!data.address) {
    lat = null;
    lng = null;
  }

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
      address: data.address ?? null,
      lat,
      lng,
      updatedAt: new Date(),
    })
    .where(eq(listings.id, listingId));

  revalidatePath("/");
  revalidatePath("/inzeraty");

  return { success: true };
}

export async function deleteListing(listingId: number): Promise<CreateListingResult> {
  const activeSession = await auth.api.getSession({
    headers: await headers(),
  });

  if (!activeSession?.user) {
    return { success: false, error: "Nejste přihlášen(a)" };
  }

  const existingListing = await db.query.listings.findFirst({
    where: eq(listings.id, listingId),
  });

  if (!existingListing) {
    return { success: false, error: "Inzerát nebyl nalezen" };
  }

  const isOwner = existingListing.userId === activeSession.user.id;
  const isAdmin = (activeSession.user as { role?: string }).role === "Admin";

  if (!isOwner && !isAdmin) {
    return {
      success: false,
      error: "Nemáte oprávnění ke smazání tohoto inzerátu",
    };
  }

  await db.delete(listings).where(eq(listings.id, listingId));

  revalidatePath("/");
  revalidatePath("/inzeraty");

  return { success: true };
}
