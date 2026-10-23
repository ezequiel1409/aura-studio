import { eq, sql } from "drizzle-orm";
import { ISettingsRepository } from "../../../domain/ports/repositories.port";
import { DbClient } from "../client";
import { settings } from "../schema";
import { memoryCache } from "../../cache/memory-cache";

const CACHE_KEY_ALL = "store_settings_all";
const CACHE_TTL_SECONDS = 300; // 5 minutos

export class DrizzleSettingsRepository implements ISettingsRepository {
  constructor(private readonly db: DbClient) {}

  async get(key: string): Promise<string | null> {
    const cachedAll = memoryCache.get<Record<string, string>>(CACHE_KEY_ALL);
    if (cachedAll && key in cachedAll) {
      return cachedAll[key] ?? null;
    }

    const [row] = await this.db
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, key));

    return row ? row.value : null;
  }

  async getAll(): Promise<Record<string, string>> {
    const cached = memoryCache.get<Record<string, string>>(CACHE_KEY_ALL);
    if (cached) {
      return cached;
    }

    const rows = await this.db
      .select({ key: settings.key, value: settings.value })
      .from(settings);

    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }

    memoryCache.set(CACHE_KEY_ALL, map, CACHE_TTL_SECONDS);
    return map;
  }

  async set(key: string, value: string): Promise<void> {
    await this.db.run(
      sql`INSERT INTO ${settings} (key, value)
          VALUES (${key}, ${value})
          ON CONFLICT(key) DO UPDATE SET value = ${value}`
    );
    memoryCache.delete(CACHE_KEY_ALL);
  }
}
