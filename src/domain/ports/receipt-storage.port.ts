export interface StoredReceiptFile {
  stream?: ReadableStream | null;
  data?: Uint8Array | null;
  contentType: string;
  size?: number;
}

export interface IReceiptStorage {
  saveReceipt(orderId: number, data: Uint8Array, extension?: string): Promise<string>;
  getReceipt(key: string): Promise<StoredReceiptFile | null>;
  deleteReceipt?(key: string): Promise<void>;
}

/**
 * Valida que una clave de almacenamiento cumpla estrictamente con el formato canónico
 * receipts/<orderId>/<uuid-o-id>.pdf y previene cualquier ataque de Directory Traversal.
 */
export function isValidReceiptKey(key: string | null | undefined): boolean {
  if (typeof key !== "string" || !key) return false;
  if (key.includes("..") || key.includes("//") || key.includes("\\")) return false;
  const regex = /^receipts\/\d+\/[a-zA-Z0-9_-]+\.pdf$/;
  return regex.test(key);
}
