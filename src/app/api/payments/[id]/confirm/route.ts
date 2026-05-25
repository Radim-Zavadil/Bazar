import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schemas/chats";
import { listings } from "@/db/schemas/listing.schema";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const [payment] = await db.select().from(payments).where(eq(payments.sessionId, id)).limit(1);

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "completed") {
      return NextResponse.json({ message: "Already paid" });
    }

    // Update payment status
    await db.update(payments).set({ status: "completed" }).where(eq(payments.sessionId, id));

    // Update listing status
    await db.update(listings).set({ status: "Prodáno / předáno" }).where(eq(listings.id, payment.listingId));

    return NextResponse.json({ message: "Payment confirmed" });
  } catch (error) {
    console.error("Confirmation error:", error);
    return NextResponse.json({ error: "Confirmation failed" }, { status: 500 });
  }
}
