import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const sqlPath = path.resolve(process.cwd(), "backups/backup-prod.sql");
const dbName = process.env.D1_DATABASE_NAME || "store-db";

console.log("\n[prepare-build-db] Sincronizando base de datos para la compilación de producción...");

// 1. Intentar descargar el snapshot más reciente de D1 remota (si hay sesión o CLOUDFLARE_API_TOKEN)
try {
  console.log(`[prepare-build-db] Obteniendo último snapshot de D1 remota (${dbName})...`);
  execSync(`npx wrangler d1 export ${dbName} --remote --output backups/backup-prod.sql -y`, {
    stdio: "inherit",
    timeout: 30000,
  });
  console.log("[prepare-build-db] ✔ Snapshot remoto descargado exitosamente.");
} catch (err) {
  console.warn("[prepare-build-db] ⚠️ No se pudo exportar D1 en vivo:", (err as Error).message);
}

// 2. Replicar snapshot si existe, o inicializar localmente con migraciones y seed como respaldo
if (fs.existsSync(sqlPath)) {
  console.log("[prepare-build-db] Utilizando backup existente en backups/backup-prod.sql");
  execSync("node scripts/replicate-prod-to-local.mjs", { stdio: "inherit" });
} else {
  console.log("[prepare-build-db] Sin snapshot disponible. Inicializando local.sqlite con migraciones y seed...");
  execSync("npx tsx src/infra/db/setup-local.ts", { stdio: "inherit" });
}

console.log("[prepare-build-db] ✔ local.sqlite garantizado para la compilación.\n");
