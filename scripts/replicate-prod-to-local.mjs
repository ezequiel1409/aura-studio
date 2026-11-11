import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dbPath = path.resolve(process.cwd(), "local.sqlite");
const sqlPath = path.resolve(process.cwd(), "backups/backup-prod.sql");

console.log("Replicando base de datos de producción a:", dbPath);

// Remover archivos wal/shm si quedaron
for (const ext of ["-wal", "-shm"]) {
  const p = dbPath + ext;
  if (fs.existsSync(p)) {
    try {
      fs.unlinkSync(p);
    } catch {
      // Ignorar si no se puede borrar inmediatamente
    }
  }
}

// Eliminar local.sqlite previo para asegurar restauración limpia
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = OFF");

const sql = fs.readFileSync(sqlPath, "utf-8");
const statements = sql
  .split(";\n")
  .map((s) => s.trim())
  .filter(Boolean);

let count = 0;
for (const stmt of statements) {
  try {
    db.exec(stmt);
    count++;
  } catch (err) {
    console.error(`Error en sentencia #${count}:`, (err as Error).message);
    throw err;
  }
}

db.pragma("foreign_keys = ON");

console.log(`Replicación completada con éxito (${count} sentencias ejecutadas).`);

const tables = [
  "products",
  "product_colors",
  "product_color_sizes",
  "product_photos",
  "categories",
  "settings",
  "orders",
  "admin_users",
  "navigation_sections",
  "banks",
];

console.log("\nRegistros sincronizados en local.sqlite:");
for (const table of tables) {
  try {
    const row = db.prepare(`SELECT count(*) as count FROM "${table}"`).get() as { count: number };
    console.log(`- ${table}: ${row.count}`);
  } catch {
    console.log(`- ${table}: (no disponible)`);
  }
}

db.close();
