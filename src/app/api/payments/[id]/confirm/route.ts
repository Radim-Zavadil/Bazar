import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, payments } from "@/db/schemas/chats";
import { listings } from "@/db/schemas/listing.schema";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const [payment] = await db.select().from(payments).where(eq(payments.sessionId, id)).limit(1);

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Idempotency: already completed → return gracefully (prevents double-scan)
    if (payment.status === "completed") {
      return NextResponse.json({ message: "Already paid", alreadyPaid: true });
    }

    // Reject if payment was cancelled or declined
    if (["cancelled", "declined", "expired"].includes(payment.status)) {
      return NextResponse.json({ error: "Tato platba byla zrušena nebo odmítnuta." }, { status: 400 });
    }

    // Update payment status to completed
    await db.update(payments).set({ status: "completed" }).where(eq(payments.sessionId, id));

    // Update listing status to "Prodáno / předáno"
    await db
      .update(listings)
      .set({ status: "Prodáno / předáno", updatedAt: new Date() })
      .where(eq(listings.id, payment.listingId));

    // Mark the pending payment message as completed
    const [pendingMsg] = await db
      .select()
      .from(messages)
      .where(
        and(eq(messages.chatId, payment.chatId), eq(messages.type, "payment"), eq(messages.paymentStatus, "pending")),
      )
      .limit(1);

    if (pendingMsg) {
      await db.update(messages).set({ paymentStatus: "completed" }).where(eq(messages.id, pendingMsg.id));
    }

    return NextResponse.json({ message: "Payment confirmed" });
  } catch (error) {
    console.error("Confirmation error:", error);
    return NextResponse.json({ error: "Confirmation failed" }, { status: 500 });
  }
}
