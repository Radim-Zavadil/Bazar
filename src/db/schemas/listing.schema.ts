import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const listings = sqliteTable("listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  sellerName: text("seller_name").notNull(),
  price: integer("price"), // null means "Zdarma"
  category: text("category").notNull(),
  status: text("status").notNull(), // "Dostupné", "Rezervováno", "Prodáno / předáno"
  imageUrl: text("image_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});
