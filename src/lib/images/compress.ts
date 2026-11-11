/**
 * BR-07: Compresión y redimensionado de imágenes en el navegador antes de subir.
 * Genera versión miniatura y completa en formato WebP, despojadas de EXIF/geolocalización.
 * Utiliza createImageBitmap para no bloquear el hilo principal y liberar memoria nativa de inmediato.
 */

export interface CompressedImageResult {
  keyThumb: string;
  keyFull: string;
}

export interface CompressOptions {
  maxThumbDim?: number;
  maxFullDim?: number;
  thumbQuality?: number;
  fullQuality?: number;
}

function calculateScaledDimensions(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      return {
        width: maxDimension,
        height: Math.round((height * maxDimension) / width),
      };
    }
    return {
      width: Math.round((width * maxDimension) / height),
      height: maxDimension,
    };
  }
  return { width, height };
}

/**
 * Procesa un archivo de imagen en el cliente generando versiones miniatura y completa (BR-07).
 * Optimizado para alto rendimiento y bajo uso de memoria con createImageBitmap.
 */
export async function compressImageInBrowser(
  file: File,
  options: CompressOptions = {}
): Promise<CompressedImageResult> {
  const maxThumbDim = options.maxThumbDim ?? 360;
  const maxFullDim = options.maxFullDim ?? 1000;
  const thumbQuality = options.thumbQuality ?? 0.75;
  const fullQuality = options.fullQuality ?? 0.78;

  // Ruta moderna: createImageBitmap (no bloquea el hilo principal y libera memoria nativa con close())
  if (typeof window !== "undefined" && typeof window.createImageBitmap === "function") {
    try {
      const bitmap = await window.createImageBitmap(file);
      const { width: origWidth, height: origHeight } = bitmap;

      const thumbDims = calculateScaledDimensions(origWidth, origHeight, maxThumbDim);
      const fullDims = calculateScaledDimensions(origWidth, origHeight, maxFullDim);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: false });
      if (!ctx) {
        throw new Error("No se pudo obtener el contexto 2D del Canvas");
      }

      // 1. Miniatura
      canvas.width = thumbDims.width;
      canvas.height = thumbDims.height;
      ctx.drawImage(bitmap, 0, 0, thumbDims.width, thumbDims.height);
      const keyThumb = canvas.toDataURL("image/webp", thumbQuality);

      // 2. Completa
      canvas.width = fullDims.width;
      canvas.height = fullDims.height;
      ctx.drawImage(bitmap, 0, 0, fullDims.width, fullDims.height);
      const keyFull = canvas.toDataURL("image/webp", fullQuality);

      // Liberar memoria gráfica inmediatamente
      bitmap.close();

      return { keyThumb, keyFull };
    } catch {
      // Fallback a Image tradicional si createImageBitmap falla con formatos inusuales
    }
  }

  // Fallback con HTMLImageElement
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Error al leer el archivo de imagen"));

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error("Error al decodificar la imagen"));

      img.onload = () => {
        try {
          const thumbDims = calculateScaledDimensions(img.width, img.height, maxThumbDim);
          const fullDims = calculateScaledDimensions(img.width, img.height, maxFullDim);

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            throw new Error("No se pudo obtener el contexto 2D del Canvas");
          }

          canvas.width = thumbDims.width;
          canvas.height = thumbDims.height;
          ctx.drawImage(img, 0, 0, thumbDims.width, thumbDims.height);
          const keyThumb = canvas.toDataURL("image/webp", thumbQuality);

          canvas.width = fullDims.width;
          canvas.height = fullDims.height;
          ctx.drawImage(img, 0, 0, fullDims.width, fullDims.height);
          const keyFull = canvas.toDataURL("image/webp", fullQuality);

          resolve({ keyThumb, keyFull });
        } catch (err) {
          reject(err);
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
