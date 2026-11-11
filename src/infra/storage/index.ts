import { IReceiptStorage } from "../../domain/ports/receipt-storage.port";
import { LocalReceiptStorage } from "./local-receipt.storage";
import { R2ReceiptStorage, R2BucketLike } from "./r2-receipt.storage";

export * from "../../domain/ports/receipt-storage.port";
export * from "./local-receipt.storage";
export * from "./r2-receipt.storage";
export * from "./memory-receipt.storage";

let cachedStorage: IReceiptStorage | null = null;

export function resolveReceiptStorage(env?: { RECEIPTS?: R2BucketLike }): IReceiptStorage {
  if (env?.RECEIPTS) {
    return new R2ReceiptStorage(env.RECEIPTS);
  }

  const isCloudflare =
    typeof (globalThis as unknown as { WebSocketPair?: unknown }).WebSocketPair !== "undefined" ||
    (typeof process !== "undefined" && process.env?.NEXT_RUNTIME === "edge");

  if (isCloudflare) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getCloudflareContext } = require("@opennextjs/cloudflare");
      const cf = getCloudflareContext();
      if (cf?.env?.RECEIPTS) {
        return new R2ReceiptStorage(cf.env.RECEIPTS as R2BucketLike);
      }
    } catch {
      // Fallback si no se encuentra contexto en tiempo de compilación o preview
    }
  }

  if (cachedStorage) return cachedStorage;
  cachedStorage = new LocalReceiptStorage();
  return cachedStorage;
}
