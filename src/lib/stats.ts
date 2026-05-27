import { count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schemas/auth";
import { payments } from "@/db/schemas/chats";
import { listings } from "@/db/schemas/listing.schema";

export async function getStats() {
  // 1. User Signups over time (last 30 days)
  const userSignups = await db
    .select({
      date: sql<string>`strftime('%Y-%m-%d', datetime(created_at / 1000, 'unixepoch'))`,
      count: count(),
    })
    .from(user)
    .groupBy(sql`strftime('%Y-%m-%d', datetime(created_at / 1000, 'unixepoch'))`)
    .orderBy(sql`strftime('%Y-%m-%d', datetime(created_at / 1000, 'unixepoch'))`);

  // 2. Sellers vs Buyers
  const totalUsersResult = await db.select({ count: count() }).from(user);
  const totalUsers = totalUsersResult[0].count;

  const sellersResult = await db.select({ count: count(sql`DISTINCT ${listings.userId}`) }).from(listings);
  const sellers = sellersResult[0].count;
  const buyers = totalUsers - sellers;

  // 3. Active Listings over time
  const listingsOverTime = await db
    .select({
      date: sql<string>`strftime('%Y-%m-%d', datetime(created_at, 'unixepoch'))`,
      count: count(),
    })
    .from(listings)
    .where(eq(listings.status, "Dostupné"))
    .groupBy(sql`strftime('%Y-%m-%d', datetime(created_at, 'unixepoch'))`)
    .orderBy(sql`strftime('%Y-%m-%d', datetime(created_at, 'unixepoch'))`);

  // 4. Category breakdown
  const categoryBreakdown = await db
    .select({
      category: listings.category,
      count: count(),
    })
    .from(listings)
    .groupBy(listings.category);

  // 5. Payment method breakdown
  const paymentMethods = await db
    .select({
      method: payments.method,
      count: count(),
    })
    .from(payments)
    .groupBy(payments.method);

  return {
    userSignups,
    sellerStats: {
      total: totalUsers,
      sellers,
      buyers,
    },
    listingsOverTime,
    categoryBreakdown,
    paymentMethods,
  };
}
