import { IReceiptStorage, StoredReceiptFile, isValidReceiptKey } from "../../domain/ports/receipt-storage.port";

export interface R2BucketLike {
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | ArrayBufferView | string | null | Blob,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<unknown>;
  get(key: string): Promise<{
    body: ReadableStream;
    size: number;
    httpMetadata?: { contentType?: string };
    arrayBuffer(): Promise<ArrayBuffer>;
  } | null>;
  delete(key: string | string[]): Promise<void>;
}

export class R2ReceiptStorage implements IReceiptStorage {
  constructor(private bucket: R2BucketLike) {}

  async saveReceipt(orderId: number, data: Uint8Array, _extension: string = "pdf"): Promise<string> {
    const id = crypto.randomUUID();
    const key = `receipts/${orderId}/${id}.pdf`;
    await this.bucket.put(key, data, {
      httpMetadata: {
        contentType: "application/pdf",
      },
    });
    return key;
  }

  async getReceipt(key: string): Promise<StoredReceiptFile | null> {
    if (!isValidReceiptKey(key)) return null;
    const object = await this.bucket.get(key);
    if (!object) return null;
    return {
      stream: object.body,
      size: object.size,
      contentType: object.httpMetadata?.contentType || "application/pdf",
    };
  }

  async deleteReceipt(key: string): Promise<void> {
    if (!isValidReceiptKey(key)) return;
    await this.bucket.delete(key);
  }
}
