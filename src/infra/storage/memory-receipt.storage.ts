import { IReceiptStorage, StoredReceiptFile, isValidReceiptKey } from "../../domain/ports/receipt-storage.port";

export class MemoryReceiptStorage implements IReceiptStorage {
  private files = new Map<string, { data: Uint8Array; contentType: string }>();

  async saveReceipt(orderId: number, data: Uint8Array, _extension: string = "pdf"): Promise<string> {
    const id = crypto.randomUUID();
    const key = `receipts/${orderId}/${id}.pdf`;
    this.files.set(key, { data: new Uint8Array(data), contentType: "application/pdf" });
    return key;
  }

  async getReceipt(key: string): Promise<StoredReceiptFile | null> {
    if (!isValidReceiptKey(key)) return null;
    const file = this.files.get(key);
    if (!file) return null;
    return {
      data: file.data,
      stream: new Response(file.data as unknown as BodyInit).body,
      contentType: file.contentType,
      size: file.data.byteLength,
    };
  }

  async deleteReceipt(key: string): Promise<void> {
    this.files.delete(key);
  }

  clear(): void {
    this.files.clear();
  }

  has(key: string): boolean {
    return this.files.has(key);
  }

  size(): number {
    return this.files.size;
  }
}
