/**
 * BR-07: Compresión y redimensionado de imágenes en el navegador antes de subir.
 * Genera versión miniatura y completa en formato WebP, despojadas de EXIF/geolocalización.
 * El backend/Worker no procesa imágenes pesadas.
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

/**
 * Redimensiona y dibuja una imagen en un Canvas HTML5 limpio,
 * lo cual descarta metadatos EXIF y geolocalización de forma nativa.
 */
function drawScaledToCanvas(
  img: HTMLImageElement,
  maxDimension: number
): HTMLCanvasElement {
  let { width, height } = img;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo obtener el contexto 2D del Canvas");
  }

  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

/**
 * Procesa un archivo de imagen en el cliente generando versiones miniatura y completa (BR-07).
 */
export async function compressImageInBrowser(
  file: File,
  options: CompressOptions = {}
): Promise<CompressedImageResult> {
  const maxThumbDim = options.maxThumbDim ?? 400;
  const maxFullDim = options.maxFullDim ?? 1200;
  const thumbQuality = options.thumbQuality ?? 0.8;
  const fullQuality = options.fullQuality ?? 0.85;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Error al leer el archivo de imagen"));

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error("Error al decodificar la imagen"));

      img.onload = () => {
        try {
          // Generar miniatura limpia
          const thumbCanvas = drawScaledToCanvas(img, maxThumbDim);
          const keyThumb = thumbCanvas.toDataURL("image/webp", thumbQuality);

          // Generar versión completa limpia
          const fullCanvas = drawScaledToCanvas(img, maxFullDim);
          const keyFull = fullCanvas.toDataURL("image/webp", fullQuality);

          resolve({
            keyThumb,
            keyFull,
          });
        } catch (err) {
          reject(err);
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
