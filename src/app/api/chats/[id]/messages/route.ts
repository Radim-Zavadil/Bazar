import { and, asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chats, messages } from "@/db/schemas/chats";
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

    // 2. Cannot send if listing is already sold
    if (listing.status === "Prodáno / předáno") {
      return NextResponse.json({ error: "Inzerát je již prodán." }, { status: 400 });
    }

    // 3. Only one active payment message for each listing
    const [existingPaymentMsg] = await db
      .select()
      .from(messages)
      .innerJoin(chats, eq(messages.chatId, chats.id))
      .where(and(eq(chats.listingId, listing.id), eq(messages.type, "payment")))
      .limit(1);

    if (existingPaymentMsg) {
      return NextResponse.json({ error: "Pro tento inzerát již existuje aktivní platební výzva." }, { status: 400 });
    }
  }

  const senderName = session.user.name;

  const [msg] = await db.insert(messages).values({ chatId, senderName, content, type }).returning();

  // Update chat updatedAt so it bubbles to top of list
  await db.update(chats).set({ updatedAt: new Date().toISOString() }).where(eq(chats.id, chatId));

  return NextResponse.json(msg, { status: 201 });
}
