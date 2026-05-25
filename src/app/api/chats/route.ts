import { and, desc, eq, or } from "drizzle-orm";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chats, messages } from "@/db/schemas/chats";
import { listings } from "@/db/schemas/listing.schema";
import { auth } from "@/lib/auth";

// GET /api/chats?search=...
// Returns all chats where the logged-in user is buyer or seller, with last message
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userName = session.user.name;
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";

  const userChats = await db
    .select({
      id: chats.id,
      listingId: chats.listingId,
      listingTitle: chats.listingTitle,
      listingImage: chats.listingImage,
      listingPrice: listings.price, // Get current price from listings table
      buyerName: chats.buyerName,
      sellerName: chats.sellerName,
      createdAt: chats.createdAt,
      updatedAt: chats.updatedAt,
    })
    .from(chats)
    .leftJoin(listings, eq(chats.listingId, listings.id))
    .where(or(eq(chats.buyerName, userName), eq(chats.sellerName, userName)))
    .orderBy(desc(chats.updatedAt));

  const filtered = search
    ? userChats.filter((c) => c.listingTitle.toLowerCase().includes(search.toLowerCase()))
    : userChats;

  // Attach last message to each chat
  const result = await Promise.all(
    filtered.map(async (chat) => {
      const lastMsgs = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chat.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);
      return { ...chat, lastMessage: lastMsgs[0] ?? null };
    }),
  );

  return NextResponse.json(result);
}

// POST /api/chats
// Body: { listingId, listingTitle, listingImage, listingPrice, sellerName }
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { listingId, listingTitle, listingImage, listingPrice, sellerName } = body as {
    listingId: number;
    listingTitle: string;
    listingImage: string | null;
    listingPrice: number | null;
    sellerName: string;
  };

  if (!listingId || !listingTitle || !sellerName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const buyerName = session.user.name;

  if (buyerName === sellerName) {
    return NextResponse.json({ error: "Cannot chat with yourself" }, { status: 400 });
  }

  // Return existing chat if one already exists
  const existing = await db
    .select()
    .from(chats)
    .where(and(eq(chats.listingId, listingId), eq(chats.buyerName, buyerName), eq(chats.sellerName, sellerName)))
    .limit(1);

  if (existing.length > 0) {
    const chat = existing[0];
    // Update price if it's missing or different
    if (chat.listingPrice !== listingPrice) {
      await db.update(chats).set({ listingPrice }).where(eq(chats.id, chat.id));
      chat.listingPrice = listingPrice;
    }
    return NextResponse.json(chat);
  }

  const [newChat] = await db
    .insert(chats)
    .values({
      listingId,
      listingTitle,
      listingImage: listingImage ?? null,
      listingPrice: listingPrice ?? null,
      buyerName,
      sellerName,
    })
    .returning();

  return NextResponse.json(newChat, { status: 201 });
}
