const Database = require("better-sqlite3");
const db = new Database("sqlite.db");

try {
  db.exec("ALTER TABLE listings ADD COLUMN item_condition TEXT NOT NULL DEFAULT 'Nové'");
  console.log("Column item_condition added successfully.");
} catch (e) {
  console.log("Note:", e.message);
}

// Also ensure seller_name default works (won't affect existing rows)
console.log("Done.");
db.close();
