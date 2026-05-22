import { asc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chats, messages } from "@/db/schemas/chats";

// GET /api/chats/[id]/messages
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chatId = Number(id);

  if (Number.isNaN(chatId)) {
    return NextResponse.json({ error: "Neplatné ID" }, { status: 400 });
  }

  try {
    const rows = await db.select().from(messages).where(eq(messages.chatId, chatId)).orderBy(asc(messages.createdAt));

    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Chyba při načítání zpráv" }, { status: 500 });
  }
}

// POST /api/chats/[id]/messages
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chatId = Number(id);

  if (Number.isNaN(chatId)) {
    return NextResponse.json({ error: "Neplatné ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { senderName, content } = body;

    if (!senderName || !content?.trim()) {
      return NextResponse.json({ error: "Chybí zpráva" }, { status: 400 });
    }

    const [message] = await db.insert(messages).values({ chatId, senderName, content: content.trim() }).returning();

    // Update chat's updatedAt so it sorts to top
    await db.update(chats).set({ updatedAt: new Date().toISOString() }).where(eq(chats.id, chatId));

    return NextResponse.json(message, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Chyba při odesílání zprávy" }, { status: 500 });
  }
}
