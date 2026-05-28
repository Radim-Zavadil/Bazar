import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, payments } from "@/db/schemas/chats";
import { listings } from "@/db/schemas/listing.schema";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [payment] = await db.select().from(payments).where(eq(payments.sessionId, id)).limit(1);

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  // Check if pending payment is older than 24 hours
  if (payment.status === "pending" && payment.createdAt) {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const paymentCreated = new Date(payment.createdAt);
    if (paymentCreated < twentyFourHoursAgo) {
      // 1. Update payment status to expired
      await db.update(payments).set({ status: "expired" }).where(eq(payments.sessionId, id));
      payment.status = "expired";

      // 2. Update listing status back to "Dostupné"
      await db.update(listings).set({ status: "Dostupné", updatedAt: now }).where(eq(listings.id, payment.listingId));

      // 3. Mark corresponding payment message as expired
      const [pendingMsg] = await db
        .select()
        .from(messages)
        .where(
          and(eq(messages.chatId, payment.chatId), eq(messages.type, "payment"), eq(messages.paymentStatus, "pending")),
        )
        .limit(1);
      if (pendingMsg) {
        await db.update(messages).set({ paymentStatus: "expired" }).where(eq(messages.id, pendingMsg.id));
      }
    }
  }

  return NextResponse.json(payment);
}
