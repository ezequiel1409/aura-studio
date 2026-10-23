#!/usr/bin/env node

/**
 * Script de Recuperación y Reseteo de Contraseña de Administrador (Aura Studio)
 * 
 * Uso local:
 *   npm run admin:reset-password -- <email> <nueva_contraseña>
 *   node scripts/reset-admin-password.mjs admin@aurastudio.com MiClave1234
 * 
 * Genera el hash criptográfico PBKDF2-HMAC-SHA512 correspondiente (100.000 iteraciones)
 * y actualiza la base de datos local (local.sqlite) además de generar el comando
 * para ejecutar en Cloudflare D1 si se desea aplicar en producción.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const args = process.argv.slice(2);
const email = args[0]?.trim()?.toLowerCase();
const newPassword = args[1]?.trim();

if (!email || !newPassword) {
  console.log(`
\x1b[33m[Aura Studio - Recuperación de Administrador]\x1b[0m
Uso:
  npm run admin:reset-password -- <email> <nueva_contraseña>

Ejemplo:
  npm run admin:reset-password -- admin@aurastudio.com NuevaContraseñaSegura123
`);
  process.exit(1);
}

if (newPassword.length < 8) {
  console.error("\x1b[31mError: La nueva contraseña debe tener al menos 8 caracteres.\x1b[0m");
  process.exit(1);
}

// 1. Generar salt y derivar hash PBKDF2
const salt = crypto.randomBytes(16).toString("hex");
const saltBytes = Buffer.from(salt, "hex");
const hash = crypto.pbkdf2Sync(newPassword, saltBytes, 100_000, 64, "sha512").toString("hex");
const now = Date.now();

console.log(`\n\x1b[36mCalculando hash criptográfico para:\x1b[0m ${email}`);
console.log(`\x1b[90mSalt:\x1b[0m ${salt}`);
console.log(`\x1b[90mHash:\x1b[0m ${hash.slice(0, 16)}...${hash.slice(-16)}`);

// 2. Actualizar base de datos local si existe
const dbPath = path.resolve(process.cwd(), "local.sqlite");
if (fs.existsSync(dbPath)) {
  try {
    const BetterSqlite = (await import("better-sqlite3")).default;
    const db = new BetterSqlite(dbPath);

    const user = db.prepare("SELECT id, name, role FROM admin_users WHERE email = ?").get(email);

    if (user) {
      db.prepare(
        "UPDATE admin_users SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?"
      ).run(hash, salt, now, user.id);

      console.log(`\n\x1b[32m✔ Contraseña actualizada exitosamente en local.sqlite para ${user.name} (${user.role})\x1b[0m`);
    } else {
      console.log(`\n\x1b[33mAviso: No se encontró un usuario con email '${email}' en local.sqlite.\x1b[0m`);
      console.log("Usuarios existentes en local.sqlite:");
      const existing = db.prepare("SELECT id, email, name, role FROM admin_users").all();
      console.table(existing);
    }

    db.close();
  } catch (err) {
    console.warn("\x1b[33mNo se pudo actualizar local.sqlite directamente:\x1b[0m", err.message);
  }
}

// 3. Imprimir comando directo para Cloudflare D1 en producción
console.log(`
\x1b[35m=== Para aplicar este cambio en Cloudflare D1 (Producción): ===\x1b[0m
Ejecutá el siguiente comando en tu terminal:

wrangler d1 execute aura-studio-db --remote --command="UPDATE admin_users SET password_hash='${hash}', password_salt='${salt}', updated_at=${now} WHERE email='${email}';"
`);

