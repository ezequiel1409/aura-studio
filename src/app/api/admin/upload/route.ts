import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../infra/auth/guard";
import {
  MAX_MEDIA_BYTES,
  normalizeMediaFolder,
  resolveImageExtension,
  resolveMediaStorage,
} from "../../../../infra/storage/media.storage";
import { logger } from "../../../../lib/logger";

export async function POST(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json(
      { ok: false, error: "No autorizado para subir archivos." },
      { status: 401 }
    );
  }

  try {
    const formData = await req.formData();
    const rawFile = formData.get("file");
    const folderRaw = formData.get("folder");

    if (!rawFile || !(rawFile instanceof Blob)) {
      return NextResponse.json(
        { ok: false, error: "Falta adjuntar un archivo de imagen válido." },
        { status: 400 }
      );
    }

    const contentType = (rawFile.type || "").toLowerCase().trim();
    const extension = resolveImageExtension(contentType);
    if (!extension) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Formato de archivo no permitido. Usá JPG, PNG, WebP, AVIF o GIF.",
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await rawFile.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      return NextResponse.json(
        { ok: false, error: "El archivo de imagen está vacío." },
        { status: 400 }
      );
    }

    if (arrayBuffer.byteLength > MAX_MEDIA_BYTES) {
      return NextResponse.json(
        {
          ok: false,
          error: "La imagen supera el peso máximo permitido de 4 MB.",
        },
        { status: 413 }
      );
    }

    const folder = normalizeMediaFolder(
      typeof folderRaw === "string" ? folderRaw : undefined
    );
    const storage = resolveMediaStorage();
    const { key, url } = await storage.saveMedia(
      folder,
      new Uint8Array(arrayBuffer),
      contentType
    );

    logger.info("ADMIN:MEDIA_UPLOADED", `Imagen subida a ${key}`, {
      folder,
      bytes: arrayBuffer.byteLength,
      contentType,
    });

    return NextResponse.json({ ok: true, key, url });
  } catch (error) {
    logger.error("ADMIN:MEDIA_UPLOAD_ERROR", "Error al subir imagen", error);
    return NextResponse.json(
      { ok: false, error: "No se pudo almacenar la imagen en el servidor." },
      { status: 500 }
    );
  }
}
