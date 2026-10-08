import { eq, sql } from "drizzle-orm";
import { ISettingsRepository } from "../../../domain/ports/repositories.port";
import { DbClient } from "../client";
import { settings } from "../schema";

export class DrizzleSettingsRepository implements ISettingsRepository {
  constructor(private readonly db: DbClient) {}

  async get(key: string): Promise<string | null> {
    const [row] = await this.db
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, key));

    return row ? row.value : null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.db.run(
      sql`INSERT INTO ${settings} (key, value)
          VALUES (${key}, ${value})
          ON CONFLICT(key) DO UPDATE SET value = ${value}`
    );
  }
}

