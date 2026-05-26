import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schemas/chats";
import { listings } from "@/db/schemas/listing.schema";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  const userPayments = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      status: payments.status,
      createdAt: payments.createdAt,
      sellerName: payments.sellerName,
      listingTitle: listings.title,
    })
    .from(payments)
    .leftJoin(listings, eq(payments.listingId, listings.id))
    .where(eq(payments.buyerName, name))
    .orderBy(desc(payments.createdAt));

  return NextResponse.json(userPayments);
}
