import fs from "node:fs/promises";
import path from "node:path";
import { IReceiptStorage, StoredReceiptFile, isValidReceiptKey } from "../../domain/ports/receipt-storage.port";

export class LocalReceiptStorage implements IReceiptStorage {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.resolve(process.cwd(), ".local-receipts");
  }

  async saveReceipt(orderId: number, data: Uint8Array, _extension: string = "pdf"): Promise<string> {
    const id = crypto.randomUUID();
    const key = `receipts/${orderId}/${id}.pdf`;
    const fullPath = path.resolve(this.baseDir, key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, data);
    return key;
  }

  async getReceipt(key: string): Promise<StoredReceiptFile | null> {
    if (!isValidReceiptKey(key)) return null;
    const fullPath = path.resolve(this.baseDir, key);
    try {
      const buffer = await fs.readFile(fullPath);
      return {
        data: buffer,
        stream: new Response(buffer as unknown as BodyInit).body,
        contentType: "application/pdf",
        size: buffer.byteLength,
      };
    } catch {
      return null;
    }
  }

  async deleteReceipt(key: string): Promise<void> {
    if (!isValidReceiptKey(key)) return;
    const fullPath = path.resolve(this.baseDir, key);
    try {
      await fs.unlink(fullPath);
    } catch {
      // Ignorar si el archivo no existe
    }
  }
}
