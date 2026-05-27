import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const listings = sqliteTable("listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  sellerName: text("seller_name").notNull().default("Uživatel"),
  contactEmail: text("contact_email"),
  price: integer("price"), // null means "Zdarma"
  category: text("category").notNull(),
  status: text("status").notNull(), // "Dostupné", "Rezervováno", "Prodáno / předáno"
  itemCondition: text("item_condition").notNull().default("Nové"), // "Nové", "Použité"
  imageUrl: text("image_url"),
  address: text("address"),
  lat: real("lat"),
  lng: real("lng"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});
