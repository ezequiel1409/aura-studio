import { NextRequest, NextResponse } from "next/server";
import {
  isValidMediaKey,
  resolveMediaStorage,
} from "../../../../infra/storage/media.storage";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key: keySegments } = await params;
  const normalizedKey = Array.isArray(keySegments) ? keySegments.join("/") : "";

  if (!isValidMediaKey(normalizedKey)) {
    return NextResponse.json(
      { ok: false, error: "Clave de archivo inválida." },
      { status: 400 }
    );
  }

  const storage = resolveMediaStorage();
  const file = await storage.getMedia(normalizedKey);
  if (!file) {
    return NextResponse.json(
      { ok: false, error: "Imagen no encontrada." },
      { status: 404 }
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": file.contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
  };
  if (file.size) {
    headers["Content-Length"] = String(file.size);
  }

  if (file.stream) {
    return new NextResponse(file.stream, { status: 200, headers });
  }

  return new NextResponse(file.data as unknown as BodyInit, {
    status: 200,
    headers,
  });
}
