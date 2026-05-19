"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { db } from "@/db";
import { listings } from "@/db/schemas";

const createListingSchema = z.object({
  title: z.string().min(1, "Název je povinný"),
  description: z.string().min(1, "Popis je povinný"),
  price: z.number().min(0, "Cena nemůže být záporná"),
  category: z.string().min(1, "Kategorie je povinná"),
  itemCondition: z.enum(["Nové", "Použité"]),
  status: z.string().default("Dostupné"),
  imageUrl: z.string().nullable().optional(),
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

  await db.insert(listings).values({
    title: data.title,
    description: data.description,
    sellerName: "Uživatel",
    price: data.price === 0 ? null : data.price,
    category: data.category,
    itemCondition: data.itemCondition,
    status: data.status,
    imageUrl: data.imageUrl ?? null,
  });

  revalidatePath("/");
  revalidatePath("/inzeraty");

  return { success: true };
}
