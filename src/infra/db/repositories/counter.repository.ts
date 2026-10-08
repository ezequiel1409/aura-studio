import { sql } from "drizzle-orm";
import { ICounterRepository } from "../../../domain/ports/repositories.port";
import { DbClient } from "../client";
import { counters } from "../schema";

export class DrizzleCounterRepository implements ICounterRepository {
  constructor(private readonly db: DbClient) {}

  /**
   * BR-01: Incremento atómico en base de datos sin MAX()+1.
   * Garantiza correlatividad única y que nunca se reutilizan números tras purga.
   */
  async getNextSequence(counterName: string): Promise<number> {
    await this.db.run(
      sql`INSERT INTO ${counters} (name, value)
          VALUES (${counterName}, 1)
          ON CONFLICT(name) DO UPDATE SET value = ${counters}.value + 1`
    );

    const rows = await this.db
      .select({ value: counters.value })
      .from(counters)
      .where(sql`${counters.name} = ${counterName}`);

    if (rows.length > 0) {
      return rows[0].value;
    }

    return 1;
  }
}

