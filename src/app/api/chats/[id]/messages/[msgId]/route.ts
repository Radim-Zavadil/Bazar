import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chats, messages, payments } from "@/db/schemas/chats";
import { listings } from "@/db/schemas/listing.schema";
import { auth } from "@/lib/auth";

// PATCH /api/chats/[id]/messages/[msgId]
// Body: { paymentStatus: 'cancelled' | 'declined' }
// Seller can cancel, buyer can decline a pending payment message
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; msgId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: chatIdStr, msgId: msgIdStr } = await params;
  const chatId = Number(chatIdStr);
  const messageId = Number(msgIdStr);

  if (Number.isNaN(chatId) || Number.isNaN(messageId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await request.json();
  const { paymentStatus } = body as { paymentStatus: string };

  if (!["cancelled", "declined"].includes(paymentStatus)) {
    return NextResponse.json({ error: "Invalid paymentStatus" }, { status: 400 });
  }

  // Fetch chat to determine roles
  const [chat] = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);
  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const userName = session.user.name;
  const isSeller = chat.sellerName === userName;
  const isBuyer = chat.buyerName === userName;

  if (paymentStatus === "cancelled" && !isSeller) {
    return NextResponse.json({ error: "Pouze prodejce může zrušit platbu." }, { status: 403 });
  }
  if (paymentStatus === "declined" && !isBuyer) {
    return NextResponse.json({ error: "Pouze kupující může odmítnout platbu." }, { status: 403 });
  }

  // Fetch the message
  const [msg] = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1);
  if (!msg) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }
  if (msg.type !== "payment") {
    return NextResponse.json({ error: "Not a payment message" }, { status: 400 });
  }
  if (msg.paymentStatus !== "pending") {
    return NextResponse.json({ error: "Payment message is no longer pending" }, { status: 400 });
  }

  // Update message paymentStatus
  await db.update(messages).set({ paymentStatus }).where(eq(messages.id, messageId));

  // Reset listing to "Dostupné"
  await db.update(listings).set({ status: "Dostupné", updatedAt: new Date() }).where(eq(listings.id, chat.listingId));

  // Cancel any pending QR payment sessions for this chat
  await db
    .update(payments)
    .set({ status: paymentStatus })
    .where(and(eq(payments.chatId, chatId), eq(payments.status, "pending")));

  return NextResponse.json({ success: true });
}
