import { and, asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chats, messages, payments } from "@/db/schemas/chats";
import { listings } from "@/db/schemas/listing.schema";
import { auth } from "@/lib/auth";

// GET /api/chats/[id]/messages
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const chatId = Number(id);
  if (Number.isNaN(chatId)) {
    return NextResponse.json({ error: "Invalid chat id" }, { status: 400 });
  }

  // Check for expired reservations for this chat's listing
  const now = new Date();
  const [chat] = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);
  if (chat) {
    const [listing] = await db.select().from(listings).where(eq(listings.id, chat.listingId)).limit(1);
    if (listing && listing.status === "Rezervováno") {
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      let shouldExpire = false;

      // Find any pending payment message in this chat
      const [pendingMsg] = await db
        .select()
        .from(messages)
        .where(and(eq(messages.chatId, chatId), eq(messages.type, "payment"), eq(messages.paymentStatus, "pending")))
        .limit(1);

      if (pendingMsg) {
        const msgCreated = new Date(pendingMsg.createdAt);
        if (msgCreated < twentyFourHoursAgo) {
          shouldExpire = true;
        }
      } else {
        // If no pending payment message but listing is still reserved,
        // and either listing.updatedAt is null or older than 24 hours (covers seed/old data)
        if (!listing.updatedAt || listing.updatedAt < twentyFourHoursAgo) {
          shouldExpire = true;
        }
      }

      if (shouldExpire) {
        if (pendingMsg) {
          // Expire any pending payment message for this chat
          await db.update(messages).set({ paymentStatus: "expired" }).where(eq(messages.id, pendingMsg.id));

          // Cancel any pending payments in the payments table
          await db
            .update(payments)
            .set({ status: "expired" })
            .where(and(eq(payments.chatId, chatId), eq(payments.status, "pending")));
        }
        // Reset listing to Dostupné
        await db.update(listings).set({ status: "Dostupné", updatedAt: now }).where(eq(listings.id, listing.id));
      }
    }
  }

  const rows = await db.select().from(messages).where(eq(messages.chatId, chatId)).orderBy(asc(messages.createdAt));

  return NextResponse.json(rows);
}

// POST /api/chats/[id]/messages
// Body: { content: string, type?: string }
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const chatId = Number(id);
  if (Number.isNaN(chatId)) {
    return NextResponse.json({ error: "Invalid chat id" }, { status: 400 });
  }

  const body = await request.json();
  const content = (body.content as string)?.trim();
  const type = (body.type as string) || "text";

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  // Fetch chat and listing info for validation
  const [chat] = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);
  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const [listing] = await db.select().from(listings).where(eq(listings.id, chat.listingId)).limit(1);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (type === "payment") {
    // 1. Only seller can post payment message
    if (listing.userId !== session.user.id) {
      return NextResponse.json({ error: "Pouze prodejce může poslat výzvu k platbě." }, { status: 403 });
    }

    // 2. Cannot send if listing is already sold or reserved
    if (listing.status !== "Dostupné") {
      return NextResponse.json(
        {
          error: `Inzerát je ve stavu: ${listing.status}. Platební výzvu nelze odeslat.`,
        },
        { status: 400 },
      );
    }

    // 3. Only one active PENDING payment message per listing
    const [existingPaymentMsg] = await db
      .select()
      .from(messages)
      .innerJoin(chats, eq(messages.chatId, chats.id))
      .where(and(eq(chats.listingId, listing.id), eq(messages.type, "payment"), eq(messages.paymentStatus, "pending")))
      .limit(1);

    if (existingPaymentMsg) {
      return NextResponse.json({ error: "Pro tento inzerát již existuje aktivní platební výzva." }, { status: 400 });
    }

    // 4. Set listing status to Rezervováno immediately
    const now = new Date();
    await db.update(listings).set({ status: "Rezervováno", updatedAt: now }).where(eq(listings.id, listing.id));
  }

  const senderName = session.user.name;

  // For payment messages, explicitly set paymentStatus to 'pending'
  const paymentStatus = type === "payment" ? "pending" : undefined;
  const [msg] = await db
    .insert(messages)
    .values({ chatId, senderName, content, type, ...(paymentStatus !== undefined ? { paymentStatus } : {}) })
    .returning();

  // Update chat updatedAt so it bubbles to top of list
  await db.update(chats).set({ updatedAt: new Date().toISOString() }).where(eq(chats.id, chatId));

  return NextResponse.json(msg, { status: 201 });
}
