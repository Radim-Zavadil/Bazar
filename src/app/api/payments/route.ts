import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schemas/chats";
import { listings } from "@/db/schemas/listing.schema";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { chatId, listingId, buyerName, sellerName, amount, method } = body as {
    chatId: number;
    listingId: number;
    buyerName: string;
    sellerName: string;
    amount: number;
    method: string;
  };

  if (!chatId || !listingId || !buyerName || !sellerName || amount === undefined || !method) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // 1. Create payment record
    const [payment] = await db
      .insert(payments)
      .values({
        chatId,
        listingId,
        buyerName,
        sellerName,
        amount,
        method,
        status: "completed",
      })
      .returning();

    // 2. Update listing status to "Prodáno / předáno"
    await db.update(listings).set({ status: "Prodáno / předáno" }).where(eq(listings.id, listingId));

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}
