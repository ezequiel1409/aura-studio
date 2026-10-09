import { SYSTEM_UNCATEGORIZED_NAME, SYSTEM_UNCATEGORIZED_SLUG } from "../../domain/category/types";
import { hashPassword } from "../../lib/crypto/password";
import { DbClient } from "./client";
import {
  adminUsers,
  categories,
  categoryStats,
  counters,
  settings,
} from "./schema";

export interface SeedOptions {
  whatsappNumber?: string;
  brandName?: string;
  reservationHours?: number;
}

/**
 * Seed inicial de categorías, contadores y configuración según BR-19, BR-35 y especificación funcional.
 * Prendas / Indumentaria actúa como categoría raíz con subcategorías (profundidad 2, BR-15).
 */
export async function seedDatabase(db: DbClient, options: SeedOptions = {}): Promise<void> {
  const {
    whatsappNumber = "+5491100000000",
    brandName = "Aura Studio",
    reservationHours = 48,
  } = options;

  // 1. Configuración por defecto (BR-35)
  await db.insert(settings).values([
    { key: "whatsapp_number", value: whatsappNumber },
    { key: "brand_name", value: brandName },
    { key: "reservation_hours", value: String(reservationHours) },
  ]).onConflictDoNothing();

  // 2. Contador atómico de productos (BR-01)
  await db.insert(counters).values({
    name: "product_code",
    value: 0,
  }).onConflictDoNothing();

  // 3. Categoría del sistema "Sin clasificar" (BR-19)
  const uncategorizedRows = await db
    .insert(categories)
    .values({
      parentId: null,
      name: SYSTEM_UNCATEGORIZED_NAME,
      slug: SYSTEM_UNCATEGORIZED_SLUG,
      position: 999,
      isHidden: 0,
      isSystem: 1,
    })
    .onConflictDoNothing()
    .returning();

  if (uncategorizedRows.length > 0) {
    await db.insert(categoryStats).values({
      categoryId: uncategorizedRows[0].id,
      viewsCount: 0,
      lastViewedAt: null,
    }).onConflictDoNothing();
  }

  // 4. Categoría raíz "Prendas" (Garments) e Hijas (BR-15 profundidad máxima 2)
  const [garmentsRoot] = await db
    .insert(categories)
    .values({
      parentId: null,
      name: "Prendas",
      slug: "prendas",
      position: 1,
      isHidden: 0,
      isSystem: 0,
    })
    .onConflictDoNothing()
    .returning();

  if (garmentsRoot) {
    await db.insert(categoryStats).values({
      categoryId: garmentsRoot.id,
      viewsCount: 0,
      lastViewedAt: null,
    }).onConflictDoNothing();

    // Subcategorías de Prendas
    const garmentSubs = [
      { name: "Remeras y Tops", slug: "remeras-y-tops", position: 1 },
      { name: "Camisas y Blusas", slug: "camisas-y-blusas", position: 2 },
      { name: "Buzos y Sweaters", slug: "buzos-y-sweaters", position: 3 },
      { name: "Pantalones", slug: "pantalones", position: 4 },
      { name: "Jeans", slug: "jeans", position: 5 },
      { name: "Shorts y Faldas", slug: "shorts-y-faldas", position: 6 },
      { name: "Vestidos y Enteritos", slug: "vestidos-y-enteritos", position: 7 },
      { name: "Abrigos", slug: "abrigos", position: 8 },
    ];

    for (const sub of garmentSubs) {
      const [insertedSub] = await db
        .insert(categories)
        .values({
          parentId: garmentsRoot.id,
          name: sub.name,
          slug: sub.slug,
          position: sub.position,
          isHidden: 0,
          isSystem: 0,
        })
        .onConflictDoNothing()
        .returning();

      if (insertedSub) {
        await db.insert(categoryStats).values({
          categoryId: insertedSub.id,
          viewsCount: 0,
          lastViewedAt: null,
        }).onConflictDoNothing();
      }
    }
  }

  // 5. Otras categorías de productos: Calzado y Accesorios
  const otherRoots = [
    { name: "Calzado", slug: "calzado", position: 2 },
    { name: "Accesorios", slug: "accesorios", position: 3 },
  ];

  for (const root of otherRoots) {
    const [inserted] = await db
      .insert(categories)
      .values({
        parentId: null,
        name: root.name,
        slug: root.slug,
        position: root.position,
        isHidden: 0,
        isSystem: 0,
      })
      .onConflictDoNothing()
      .returning();

    if (inserted) {
      await db.insert(categoryStats).values({
        categoryId: inserted.id,
        viewsCount: 0,
        lastViewedAt: null,
      }).onConflictDoNothing();
    }
  }

  // 6. Super Admin inicial con contraseña hasheada (PBKDF2-HMAC-SHA512) (BR-08, BR-10)
  const existingUsers = await db.select().from(adminUsers).limit(1);
  if (existingUsers.length === 0) {
    const { hash, salt } = await hashPassword("aura-admin-secret-2026");
    const now = Date.now();
    await db.insert(adminUsers).values({
      email: "admin@aurastudio.com",
      name: "Administradora Principal",
      passwordHash: hash,
      passwordSalt: salt,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    });
  }
}

