import os from "os";
import path from "path";
import fs from "fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  isValidMediaKey,
  LocalMediaStorage,
  MemoryMediaStorage,
  normalizeMediaFolder,
  resolveImageExtension,
} from "../src/infra/storage/media.storage";
import { createSessionToken } from "../src/infra/auth/session";
import { ADMIN_SESSION_COOKIE_NAME } from "../src/infra/auth/guard";
import { getEnv } from "../src/lib/env";

const storageState = vi.hoisted(() => ({
  activeStorage: null as MemoryMediaStorage | null,
}));

vi.mock("../src/infra/storage/media.storage", async () => {
  const actual = await vi.importActual<typeof import("../src/infra/storage/media.storage")>(
    "../src/infra/storage/media.storage"
  );
  return {
    ...actual,
    resolveMediaStorage: () => {
      if (!storageState.activeStorage) {
        storageState.activeStorage = new actual.MemoryMediaStorage();
      }
      return storageState.activeStorage;
    },
  };
});

import { POST as uploadPostHandler } from "../src/app/api/admin/upload/route";
import { GET as mediaGetHandler } from "../src/app/api/media/[...key]/route";

describe("Admin Media Upload & Delivery (/api/admin/upload & /api/media/[...key])", () => {
  const env = getEnv();
  let tempDirs: string[] = [];

  beforeEach(() => {
    storageState.activeStorage = new MemoryMediaStorage();
  });

  afterEach(async () => {
    for (const dir of tempDirs) {
      await fs.rm(dir, { recursive: true, force: true });
    }
    tempDirs = [];
  });

  async function buildAdminRequest(url: string, formData?: FormData) {
    const token = await createSessionToken(
      env.SESSION_SECRET,
      { email: "admin@example.com", role: "SUPER_ADMIN" },
      7200 * 1000
    );
    const req = new NextRequest(url, {
      method: "POST",
      body: formData,
    });
    req.cookies.set(ADMIN_SESSION_COOKIE_NAME, token);
    return req;
  }

  it("valida extensiones, normaliza carpetas y bloquea claves con traversal", () => {
    expect(resolveImageExtension("image/png")).toBe("png");
    expect(resolveImageExtension("image/jpeg")).toBe("jpg");
    expect(resolveImageExtension("image/webp")).toBe("webp");
    expect(resolveImageExtension("application/pdf")).toBeNull();

    expect(normalizeMediaFolder("BANNERS")).toBe("banners");
    expect(normalizeMediaFolder("invalid-folder")).toBe("general");

    expect(isValidMediaKey("media/banners/slide-01.webp")).toBe(true);
    expect(isValidMediaKey("media/brand/logo_v2.png")).toBe(true);
    expect(isValidMediaKey("../secrets.txt")).toBe(false);
    expect(isValidMediaKey("media/banners/../x.png")).toBe(false);
    expect(isValidMediaKey("media/unknown/file.png")).toBe(false);
    expect(isValidMediaKey("media/brand/file.svg")).toBe(false);
  });

  it("LocalMediaStorage persiste y lee archivos de forma aislada", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "store-media-test-"));
    tempDirs.push(tmpDir);

    const storage = new LocalMediaStorage(tmpDir);
    const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const saved = await storage.saveMedia("brand", bytes, "image/png");

    expect(saved.key).toMatch(/^media\/brand\/[a-zA-Z0-9-]+\.png$/);
    expect(saved.url).toBe(`/api/media/${saved.key}`);

    const readBack = await storage.getMedia(saved.key);
    expect(readBack).not.toBeNull();
    expect(readBack?.contentType).toBe("image/png");
    expect(readBack?.size).toBe(bytes.byteLength);
  });

  it("POST /api/admin/upload rechaza peticiones sin sesión (401)", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/upload", {
      method: "POST",
    });
    const res = await uploadPostHandler(req);
    expect(res.status).toBe(401);
  });

  it("POST /api/admin/upload rechaza archivo faltante o MIME inválido (400)", async () => {
    const emptyForm = new FormData();
    const emptyRes = await uploadPostHandler(
      await buildAdminRequest("http://localhost:3000/api/admin/upload", emptyForm)
    );
    expect(emptyRes.status).toBe(400);

    const badForm = new FormData();
    badForm.set("folder", "banners");
    badForm.set(
      "file",
      new File(["<svg></svg>"], "icon.svg", { type: "image/svg+xml" })
    );
    const badRes = await uploadPostHandler(
      await buildAdminRequest("http://localhost:3000/api/admin/upload", badForm)
    );
    expect(badRes.status).toBe(400);
  });

  it("POST /api/admin/upload rechaza imágenes mayores a 4MB (413)", async () => {
    const oversized = new Uint8Array(4 * 1024 * 1024 + 10);
    const form = new FormData();
    form.set("folder", "sections");
    form.set("file", new File([oversized], "huge.png", { type: "image/png" }));

    const res = await uploadPostHandler(
      await buildAdminRequest("http://localhost:3000/api/admin/upload", form)
    );
    expect(res.status).toBe(413);
  });

  it("POST /api/admin/upload sube una imagen válida (200) y GET /api/media/[...key] la entrega con Cache-Control inmutable", async () => {
    const payloadBytes = new Uint8Array([1, 2, 3, 4, 5, 6]);
    const form = new FormData();
    form.set("folder", "banners");
    form.set("file", new File([payloadBytes], "hero.webp", { type: "image/webp" }));

    const uploadRes = await uploadPostHandler(
      await buildAdminRequest("http://localhost:3000/api/admin/upload", form)
    );
    const uploadJson = await uploadRes.json();

    expect(uploadRes.status).toBe(200);
    expect(uploadJson.ok).toBe(true);
    expect(uploadJson.key).toMatch(/^media\/banners\/[a-zA-Z0-9-]+\.webp$/);
    expect(uploadJson.url).toBe(`/api/media/${uploadJson.key}`);

    const getReq = new NextRequest(`http://localhost:3000${uploadJson.url}`);
    const getRes = await mediaGetHandler(getReq, {
      params: Promise.resolve({ key: uploadJson.key.split("/") }),
    });

    expect(getRes.status).toBe(200);
    expect(getRes.headers.get("Content-Type")).toBe("image/webp");
    expect(getRes.headers.get("Cache-Control")).toContain("immutable");

    const servedBytes = new Uint8Array(await getRes.arrayBuffer());
    expect(Array.from(servedBytes)).toEqual(Array.from(payloadBytes));

    // Ruta traversal o inexistente
    const badKeyRes = await mediaGetHandler(getReq, {
      params: Promise.resolve({ key: ["media", "..", "hack.webp"] }),
    });
    expect(badKeyRes.status).toBe(400);

    const missingRes = await mediaGetHandler(getReq, {
      params: Promise.resolve({ key: ["media", "banners", "nonexistent.webp"] }),
    });
    expect(missingRes.status).toBe(404);
  });
});
