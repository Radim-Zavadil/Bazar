import { asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chats, messages } from "@/db/schemas/chats";
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
// Body: { content: string }
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
  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const senderName = session.user.name;

  const [msg] = await db.insert(messages).values({ chatId, senderName, content }).returning();

  // Update chat updatedAt so it bubbles to top of list
  await db.update(chats).set({ updatedAt: new Date().toISOString() }).where(eq(chats.id, chatId));

  return NextResponse.json(msg, { status: 201 });
}
