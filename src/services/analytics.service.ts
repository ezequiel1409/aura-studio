import { sql } from "drizzle-orm";
import { categoryStats, productStats } from "../infra/db/schema";
import { getDb } from "../infra/db/connection";
import { DbClient } from "../infra/db/client";

export type AnalyticsEventType = "product_view" | "whatsapp_click" | "category_view";

export interface TrackEventInput {
  type: AnalyticsEventType;
  productId?: number;
  categoryId?: number;
  sessionId?: string;
  isAdmin?: boolean;
}

// Cache en memoria para debouncing de 30 minutos por sesión (BR-39)
const recentEvents = new Map<string, number>();
const DEBOUNCE_WINDOW_MS = 30 * 60 * 1000;

function isDebounced(key: string, now: number): boolean {
  const lastTime = recentEvents.get(key);
  if (lastTime && now - lastTime < DEBOUNCE_WINDOW_MS) {
    return true;
  }
  recentEvents.set(key, now);

  // Limpieza periódica si la caché crece
  if (recentEvents.size > 10000) {
    for (const [k, timestamp] of recentEvents.entries()) {
      if (now - timestamp > DEBOUNCE_WINDOW_MS) {
        recentEvents.delete(k);
      }
    }
  }

  return false;
}

/**
 * AR-07 y BR-39: Registro asíncrono y desacoplado de telemetría y conversión.
 * Aplica debouncing de 30 minutos y exclusión de administradores.
 */
export async function trackAnalyticsEvent(event: TrackEventInput, customDb?: DbClient): Promise<boolean> {
  // Exclusión de actividad de administradora (BR-39)
  if (event.isAdmin) {
    return false;
  }

  const now = Date.now();
  const session = event.sessionId || "anonymous";

  // Clave de debounce única por sesión y recurso
  let debounceKey = "";
  if (event.type === "product_view" && event.productId) {
    debounceKey = `${session}:pview:${event.productId}`;
  } else if (event.type === "whatsapp_click" && event.productId) {
    debounceKey = `${session}:waclick:${event.productId}`;
  } else if (event.type === "category_view" && event.categoryId) {
    debounceKey = `${session}:cview:${event.categoryId}`;
  }

  if (debounceKey && isDebounced(debounceKey, now)) {
    return false; // Ignora evento duplicado dentro de la ventana de 30 min
  }

  const db = customDb || getDb();

  try {
    if (event.type === "product_view" && event.productId) {
      await db.run(
        sql`INSERT INTO ${productStats} (product_id, views_count, whatsapp_clicks, last_viewed_at)
            VALUES (${event.productId}, 1, 0, ${now})
            ON CONFLICT(product_id) DO UPDATE SET
              views_count = ${productStats}.views_count + 1,
              last_viewed_at = ${now}`
      );
      return true;
    }

    if (event.type === "whatsapp_click" && event.productId) {
      await db.run(
        sql`INSERT INTO ${productStats} (product_id, views_count, whatsapp_clicks, last_viewed_at)
            VALUES (${event.productId}, 0, 1, ${now})
            ON CONFLICT(product_id) DO UPDATE SET
              whatsapp_clicks = ${productStats}.whatsapp_clicks + 1,
              last_viewed_at = ${now}`
      );
      return true;
    }

    if (event.type === "category_view" && event.categoryId) {
      await db.run(
        sql`INSERT INTO ${categoryStats} (category_id, views_count, last_viewed_at)
            VALUES (${event.categoryId}, 1, ${now})
            ON CONFLICT(category_id) DO UPDATE SET
              views_count = ${categoryStats}.views_count + 1,
              last_viewed_at = ${now}`
      );
      return true;
    }
  } catch (err) {
    console.error("Error al registrar evento de analítica desacoplado:", err);
  }

  return false;
}
