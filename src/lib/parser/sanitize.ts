/**
 * BR-06: Texto seguro. Todo texto se trata como texto plano con UTF-8 completo (emojis incluidos).
 * Remueve etiquetas HTML y scripts para garantizar que nunca se interprete como código.
 */
export function sanitizePlainText(input: string): string {
  if (!input) return "";

  // Normaliza saltos de línea
  let cleaned = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Remueve bloques <script>...</script> y <style>...</style>
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Remueve cualquier otra etiqueta HTML (<tag...>)
  cleaned = cleaned.replace(/<[^>]+>/g, "");

  // Preserva emojis y caracteres Unicode pero elimina caracteres de control no imprimibles
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  return cleaned.trim();
}

