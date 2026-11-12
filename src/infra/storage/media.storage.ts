import fs from "node:fs/promises";
import path from "node:path";
import type { R2BucketLike } from "./r2-receipt.storage";

export const ALLOWED_MEDIA_FOLDERS = [
  "brand",
  "banners",
  "sections",
  "emails",
  "general",
] as const;

export type MediaFolder = (typeof ALLOWED_MEDIA_FOLDERS)[number];

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
};

export const MAX_MEDIA_BYTES = 4 * 1024 * 1024; // 4 MB

export interface StoredMediaFile {
  stream?: ReadableStream | null;
  data?: Uint8Array | null;
  contentType: string;
  size?: number;
}

export interface IMediaStorage {
  saveMedia(
    folder: MediaFolder,
    data: Uint8Array,
    contentType: string
  ): Promise<{ key: string; url: string }>;
  getMedia(key: string): Promise<StoredMediaFile | null>;
}

export function resolveImageExtension(contentType: string): string | null {
  return MIME_TO_EXT[contentType.toLowerCase().trim()] ?? null;
}

export function normalizeMediaFolder(raw?: string | null): MediaFolder {
  const clean = (raw || "").trim().toLowerCase() as MediaFolder;
  return ALLOWED_MEDIA_FOLDERS.includes(clean) ? clean : "general";
}

export function isValidMediaKey(key: string | null | undefined): boolean {
  if (typeof key !== "string" || !key) return false;
  if (key.includes("..") || key.includes("//") || key.includes("\\")) return false;
  return /^media\/(brand|banners|sections|emails|general)\/[a-zA-Z0-9_-]+\.(jpg|png|webp|avif|gif)$/.test(
    key
  );
}

function getContentTypeFromKey(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() || "";
  return EXT_TO_MIME[ext] || "application/octet-stream";
}

export class LocalMediaStorage implements IMediaStorage {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.resolve(process.cwd(), ".local-media");
  }

  async saveMedia(
    folder: MediaFolder,
    data: Uint8Array,
    contentType: string
  ): Promise<{ key: string; url: string }> {
    const ext = resolveImageExtension(contentType);
    if (!ext) {
      throw new Error("Formato de imagen no soportado.");
    }
    const key = `media/${folder}/${crypto.randomUUID()}.${ext}`;
    const fullPath = path.resolve(this.baseDir, key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, data);
    return { key, url: `/api/media/${key}` };
  }

  async getMedia(key: string): Promise<StoredMediaFile | null> {
    if (!isValidMediaKey(key)) return null;
    const fullPath = path.resolve(this.baseDir, key);
    try {
      const buffer = await fs.readFile(fullPath);
      return {
        data: buffer,
        stream: new Response(buffer as unknown as BodyInit).body,
        contentType: getContentTypeFromKey(key),
        size: buffer.byteLength,
      };
    } catch {
      return null;
    }
  }
}

export class R2MediaStorage implements IMediaStorage {
  constructor(private bucket: R2BucketLike) {}

  async saveMedia(
    folder: MediaFolder,
    data: Uint8Array,
    contentType: string
  ): Promise<{ key: string; url: string }> {
    const ext = resolveImageExtension(contentType);
    if (!ext) {
      throw new Error("Formato de imagen no soportado.");
    }
    const key = `media/${folder}/${crypto.randomUUID()}.${ext}`;
    await this.bucket.put(key, data, {
      httpMetadata: { contentType },
    });
    return { key, url: `/api/media/${key}` };
  }

  async getMedia(key: string): Promise<StoredMediaFile | null> {
    if (!isValidMediaKey(key)) return null;
    const object = await this.bucket.get(key);
    if (!object) return null;
    return {
      stream: object.body,
      size: object.size,
      contentType: object.httpMetadata?.contentType || getContentTypeFromKey(key),
    };
  }
}

export class MemoryMediaStorage implements IMediaStorage {
  private files = new Map<string, { data: Uint8Array; contentType: string }>();

  async saveMedia(
    folder: MediaFolder,
    data: Uint8Array,
    contentType: string
  ): Promise<{ key: string; url: string }> {
    const ext = resolveImageExtension(contentType);
    if (!ext) {
      throw new Error("Formato de imagen no soportado.");
    }
    const key = `media/${folder}/${crypto.randomUUID()}.${ext}`;
    this.files.set(key, { data: new Uint8Array(data), contentType });
    return { key, url: `/api/media/${key}` };
  }

  async getMedia(key: string): Promise<StoredMediaFile | null> {
    if (!isValidMediaKey(key)) return null;
    const found = this.files.get(key);
    if (!found) return null;
    return {
      data: found.data,
      contentType: found.contentType,
      size: found.data.byteLength,
    };
  }
}

let cachedLocalMediaStorage: IMediaStorage | null = null;

export function resolveMediaStorage(env?: {
  MEDIA?: R2BucketLike;
  RECEIPTS?: R2BucketLike;
}): IMediaStorage {
  const explicitBucket = env?.MEDIA ?? env?.RECEIPTS;
  if (explicitBucket) {
    return new R2MediaStorage(explicitBucket);
  }

  const isCloudflare =
    typeof (globalThis as unknown as { WebSocketPair?: unknown }).WebSocketPair !==
      "undefined" ||
    (typeof process !== "undefined" && process.env?.NEXT_RUNTIME === "edge");

  if (isCloudflare) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getCloudflareContext } = require("@opennextjs/cloudflare");
      const cf = getCloudflareContext();
      const bucket = (cf?.env?.MEDIA || cf?.env?.RECEIPTS) as R2BucketLike | undefined;
      if (bucket) {
        return new R2MediaStorage(bucket);
      }
    } catch {
      // Fallback en entornos sin contexto de Worker
    }
  }

  if (cachedLocalMediaStorage) return cachedLocalMediaStorage;
  cachedLocalMediaStorage = new LocalMediaStorage();
  return cachedLocalMediaStorage;
}
