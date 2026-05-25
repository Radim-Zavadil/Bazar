import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schemas/chats";
import { listings } from "@/db/schemas/listing.schema";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const [payment] = await db.select().from(payments).where(eq(payments.sessionId, sessionId)).limit(1);

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  return NextResponse.json({ status: payment.status });
}

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
    const isQr = method === "qr";
    const sessionId = isQr ? `session_${Math.random().toString(36).substring(2, 15)}` : null;
    const status = isQr ? "pending" : "completed";

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
        status,
        sessionId,
      })
      .returning();

    // 2. Update listing status to "Prodáno / předáno" if completed
    if (status === "completed") {
      await db.update(listings).set({ status: "Prodáno / předáno" }).where(eq(listings.id, listingId));
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}
