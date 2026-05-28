import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Chats table – one chat per listing between buyer and seller
export const chats = sqliteTable("chats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listingId: integer("listing_id").notNull(),
  listingTitle: text("listing_title").notNull(),
  listingImage: text("listing_image"), // optional URL
  listingPrice: integer("listing_price"),
  buyerName: text("buyer_name").notNull(),
  sellerName: text("seller_name").notNull(),
  createdAt: text("created_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});

// Messages table – individual messages inside a chat
export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chatId: integer("chat_id").notNull(),
  senderName: text("sender_name").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("text"),
  // Payment status lifecycle: pending | completed | cancelled | declined | expired
  paymentStatus: text("payment_status").notNull().default("pending"),
  createdAt: text("created_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});

export type Chat = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

// Payments table
export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chatId: integer("chat_id").notNull(),
  listingId: integer("listing_id").notNull(),
  buyerName: text("buyer_name").notNull(),
  sellerName: text("seller_name").notNull(),
  amount: integer("amount").notNull(),
  method: text("method").notNull(), // 'card' or 'qr'
  status: text("status").notNull().default("completed"), // 'pending', 'completed', 'cancelled', 'declined', 'expired'
  sessionId: text("session_id").unique(),
  createdAt: text("created_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
