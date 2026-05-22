import { desc, like, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chats } from "@/db/schemas/chats";

// GET /api/chats?search=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";

  try {
    const rows = search
      ? await db
          .select()
          .from(chats)
          .where(
            or(
              like(chats.listingTitle, `%${search}%`),
              like(chats.sellerName, `%${search}%`),
              like(chats.buyerName, `%${search}%`),
            ),
          )
          .orderBy(desc(chats.updatedAt))
      : await db.select().from(chats).orderBy(desc(chats.updatedAt));

    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Chyba při načítání zpráv" }, { status: 500 });
  }
}

// POST /api/chats  – create new chat
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, listingTitle, listingImage, buyerName, sellerName } = body;

    if (!listingId || !listingTitle || !buyerName || !sellerName) {
      return NextResponse.json({ error: "Chybí povinná pole" }, { status: 400 });
    }

    const [chat] = await db
      .insert(chats)
      .values({ listingId, listingTitle, listingImage, buyerName, sellerName })
      .returning();

    return NextResponse.json(chat, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Chyba při vytváření chatu" }, { status: 500 });
  }
}
