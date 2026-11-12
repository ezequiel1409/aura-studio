"use client";

import { useId, useState } from "react";
import { AlertCircle, Loader2, Trash2, Upload } from "lucide-react";

export type AdminMediaFolder = "brand" | "banners" | "sections" | "emails" | "general";

export const MAX_ADMIN_MEDIA_BYTES = 4 * 1024 * 1024; // 4 MB

export const ACCEPTED_ADMIN_IMAGE_TYPES =
  "image/jpeg,image/png,image/webp,image/avif,image/gif";

const ALLOWED_MIME_SET = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

export interface AdminUploadResult {
  key: string;
  url: string;
}

/**
 * Sube una imagen al endpoint administrativo `/api/admin/upload`
 * devolviendo la clave persistida y su URL servida vía `/api/media/...`.
 */
export async function uploadAdminMedia(
  file: File,
  folder: AdminMediaFolder
): Promise<AdminUploadResult> {
  const normalizedType = (file.type || "").toLowerCase().trim();
  if (!ALLOWED_MIME_SET.has(normalizedType)) {
    throw new Error("Formato no compatible. Usá JPG, PNG, WebP, AVIF o GIF.");
  }

  if (file.size <= 0) {
    throw new Error("El archivo seleccionado está vacío.");
  }

  if (file.size > MAX_ADMIN_MEDIA_BYTES) {
    throw new Error("La imagen supera el peso máximo permitido de 4 MB.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const res = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData,
  });

  let data: { ok?: boolean; key?: string; url?: string; error?: string } | null = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok || !data?.ok || !data.url) {
    throw new Error(data?.error || "No se pudo subir la imagen al servidor.");
  }

  return {
    key: data.key || data.url,
    url: data.url,
  };
}

export interface AdminImageUploadFieldProps {
  id?: string;
  label?: string;
  requiredLabel?: boolean;
  value: string;
  onChange: (url: string) => void;
  folder: AdminMediaFolder;
  allowUrlInput?: boolean;
  urlPlaceholder?: string;
  urlRequired?: boolean;
  uploadLabel?: string;
  clearLabel?: string;
  hint?: string;
  previewVariant?: "wide" | "portrait" | "logo" | "none";
  previewAlt?: string;
  previewBadge?: string;
  onError?: (message: string) => void;
}

/**
 * Campo reutilizable de carga de imágenes para el backoffice.
 * Reemplaza por completo la lectura local Base64 (`FileReader.readAsDataURL`)
 * subiendo archivos directamente al almacenamiento del servidor.
 */
export function AdminImageUploadField({
  id,
  label,
  requiredLabel = false,
  value,
  onChange,
  folder,
  allowUrlInput = true,
  urlPlaceholder = "https://... o /api/media/...",
  urlRequired = false,
  uploadLabel = "Subir imagen",
  clearLabel = "Quitar",
  hint,
  previewVariant = "wide",
  previewAlt = "Vista previa de imagen",
  previewBadge,
  onError,
}: AdminImageUploadFieldProps) {
  const generatedId = useId();
  const inputId = id || `${generatedId}-url`;
  const fileInputId = `${generatedId}-file`;

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input so selecting the same file again still triggers onChange
    e.target.value = "";
    if (!file) return;

    setUploadError(null);
    setUploading(true);
    try {
      const uploaded = await uploadAdminMedia(file, folder);
      onChange(uploaded.url);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Error inesperado al subir la imagen.";
      setUploadError(msg);
      onError?.(msg);
    } finally {
      setUploading(false);
    }
  };

  const renderPreview = () => {
    if (previewVariant === "none" || !value) return null;

    if (previewVariant === "logo") {
      return (
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={previewAlt}
            className="max-h-12 max-w-[160px] object-contain rounded bg-white/5 p-1"
          />
          {previewBadge && (
            <span className="text-[11px] text-zinc-400 font-medium">{previewBadge}</span>
          )}
        </div>
      );
    }

    const containerClass =
      previewVariant === "portrait"
        ? "relative h-24 w-20 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900"
        : "relative h-24 w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900";

    return (
      <div className={containerClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt={previewAlt} className="h-full w-full object-cover" />
        {previewBadge && (
          <span className="absolute bottom-1 right-1 text-[9px] bg-black/75 text-zinc-300 px-1.5 py-0.5 rounded">
            {previewBadge}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {label ? (
          <label
            htmlFor={allowUrlInput ? inputId : fileInputId}
            className="text-xs font-medium text-zinc-200"
          >
            {label}
            {requiredLabel && <span className="text-rose-400 ml-0.5">*</span>}
          </label>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          <label
            htmlFor={fileInputId}
            aria-disabled={uploading}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 text-[11px] font-semibold transition-colors ${
              uploading ? "opacity-60 pointer-events-none" : "cursor-pointer"
            }`}
          >
            {uploading ? (
              <Loader2 size={12} className="animate-spin text-amber-400" />
            ) : (
              <Upload size={12} className="text-amber-400" />
            )}
            <span>{uploading ? "Subiendo..." : uploadLabel}</span>
          </label>

          {value && (
            <button
              type="button"
              onClick={() => {
                setUploadError(null);
                onChange("");
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-rose-400 hover:bg-rose-950/40 text-[11px] font-medium transition-colors cursor-pointer"
            >
              <Trash2 size={12} />
              <span>{clearLabel}</span>
            </button>
          )}
        </div>

        <input
          id={fileInputId}
          type="file"
          accept={ACCEPTED_ADMIN_IMAGE_TYPES}
          onChange={handleFileChange}
          disabled={uploading}
          className="sr-only"
        />
      </div>

      {hint && <p className="text-[11px] text-zinc-400 leading-relaxed">{hint}</p>}

      {allowUrlInput && (
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => {
            setUploadError(null);
            onChange(e.target.value);
          }}
          placeholder={urlPlaceholder}
          required={urlRequired}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:border-amber-400 focus:outline-none"
        />
      )}

      {uploadError && (
        <div
          role="alert"
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-950/50 border border-rose-800/70 text-[11px] text-rose-300"
        >
          <AlertCircle size={13} className="shrink-0 text-rose-400" />
          <span>{uploadError}</span>
        </div>
      )}

      {renderPreview()}
    </div>
  );
}
