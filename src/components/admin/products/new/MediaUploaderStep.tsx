"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  ClipboardPaste,
  ImageIcon,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { compressImageInBrowser } from "../../../../lib/images/compress";

export interface PhotoPreview {
  id: string;
  file?: File;
  keyThumb: string;
  keyFull: string;
}

interface MediaUploaderStepProps {
  photos: PhotoPreview[];
  onPhotosChange: (photos: PhotoPreview[]) => void;
  onError: (msg: string, details?: string) => void;
}

export function MediaUploaderStep({
  photos,
  onPhotosChange,
  onError,
}: MediaUploaderStepProps) {
  const [compressing, setCompressing] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const photosRef = useRef(photos);
  photosRef.current = photos;
  const onPhotosChangeRef = useRef(onPhotosChange);
  onPhotosChangeRef.current = onPhotosChange;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const processFiles = async (fileList: FileList | File[]) => {
    if (!fileList || fileList.length === 0) return;
    setCompressing(true);

    try {
      const newPhotos: PhotoPreview[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (!file.type.startsWith("image/")) continue;
        const compressed = await compressImageInBrowser(file);
        newPhotos.push({
          id: `ph_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`,
          file,
          keyThumb: compressed.keyThumb,
          keyFull: compressed.keyFull,
        });
      }
      if (newPhotos.length > 0) {
        onPhotosChangeRef.current([...photosRef.current, ...newPhotos]);
      }
    } catch (err: unknown) {
      onErrorRef.current(
        "Hubo un error al optimizar una o más fotos en el navegador.",
        err instanceof Error ? err.message : "Comprobá que los archivos sean imágenes válidas JPG, PNG o WebP."
      );
    } finally {
      setCompressing(false);
    }
  };

  const processFilesRef = useRef(processFiles);
  processFilesRef.current = processFiles;

  // Soporte de pegado desde el portapapeles (Ctrl + V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        processFilesRef.current(imageFiles);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  // Soporte de drag and drop en toda la ventana en Desktop
  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        dragCounter++;
        setIsWindowDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        setIsWindowDragging(false);
      }
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsWindowDragging(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        processFilesRef.current(e.dataTransfer.files);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleWindowDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleWindowDrop);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemovePhoto = (id: string) => {
    onPhotosChange(photos.filter((p) => p.id !== id));
  };

  const handleMovePhoto = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= photos.length) return;
    const copy = [...photos];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    onPhotosChange(copy);
  };

  return (
    <div className="space-y-4 relative">
      {/* Overlay global cuando se arrastra un archivo sobre la ventana */}
      {isWindowDragging && (
        <div className="fixed inset-0 z-50 bg-amber-400/15 backdrop-blur-xs border-4 border-dashed border-amber-400 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-zinc-950 border border-amber-400 text-amber-300 flex items-center justify-center mb-3 shadow-2xl">
            <Upload size={30} className="animate-bounce" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-zinc-100">
            Soltá las fotos aquí
          </h3>
          <p className="text-sm text-zinc-300 mt-1">
            Se optimizarán automáticamente para tu catálogo
          </p>
        </div>
      )}

      {/* Inputs nativos ocultos */}
      <input
        ref={cameraInputRef}
        type="file"
        id="camera-capture-input"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="sr-only"
        disabled={compressing}
      />
      <input
        ref={galleryInputRef}
        type="file"
        id="gallery-upload-input"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="sr-only"
        disabled={compressing}
      />

      {/* Disparadores Mobile / Touch (Doble botón ergonómico) */}
      <div className="grid grid-cols-2 gap-3 sm:hidden">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={compressing}
          className="flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 min-h-[54px] cursor-pointer"
        >
          {compressing ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Camera size={18} />
          )}
          <span>Sacar foto</span>
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={compressing}
          className="flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 font-semibold text-xs transition-all active:scale-[0.98] disabled:opacity-50 min-h-[54px] cursor-pointer"
        >
          {compressing ? (
            <Loader2 size={18} className="animate-spin text-amber-400" />
          ) : (
            <ImageIcon size={18} className="text-amber-400" />
          )}
          <span>Elegir de galería</span>
        </button>
      </div>

      {/* Zona de Drop para Desktop con badges de atajos de teclado */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        onClick={() => galleryInputRef.current?.click()}
        className={`hidden sm:flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
          isDraggingOver
            ? "border-amber-400 bg-amber-400/10 scale-[1.01]"
            : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/60"
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-300 mb-2">
          {compressing ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Upload size={20} />
          )}
        </div>
        <p className="text-xs font-bold text-zinc-200">
          {compressing
            ? "Optimizando fotos en segundo plano..."
            : "Arrastrá tus fotos o hacé clic para buscar"}
        </p>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          JPG, PNG o WebP. Se optimizan automáticamente para carga ultra rápida.
        </p>

        {/* Tip Desktop: Pegar desde Portapapeles */}
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300">
          <ClipboardPaste size={12} className="text-amber-400" />
          <span>
            ¿Copiaste una foto de WhatsApp o la web? Pegala directo con{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 font-mono text-amber-300 font-bold border border-zinc-700">
              Ctrl + V
            </kbd>
          </span>
        </div>
      </div>

      {/* Galería de miniaturas */}
      {photos.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>
              {photos.length}{" "}
              {photos.length === 1 ? "foto cargada" : "fotos cargadas"}
            </span>
            <span className="text-[10px] text-zinc-500">
              La primera imagen será la portada
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="group relative aspect-4/5 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-xs"
              >
                <Image
                  src={photo.keyThumb}
                  alt={`Foto ${index + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 640px) 33vw, 120px"
                />

                {index === 0 && (
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-amber-300 text-zinc-950 text-[10px] font-bold shadow-xs z-10">
                    Portada
                  </span>
                )}

                {/* Acciones flotantes con touch target adecuado */}
                <div className="absolute inset-0 bg-zinc-950/70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                  <div className="flex items-center justify-between">
                    {index > 0 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMovePhoto(index, "left");
                        }}
                        className="w-8 h-8 rounded-lg bg-zinc-900/90 text-zinc-200 hover:text-amber-300 flex items-center justify-center cursor-pointer"
                        title="Mover hacia la izquierda"
                        aria-label="Mover foto a la izquierda"
                      >
                        <ChevronLeft size={16} />
                      </button>
                    ) : (
                      <span />
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto(photo.id);
                      }}
                      className="w-8 h-8 rounded-lg bg-rose-950/90 text-rose-300 hover:bg-rose-900 flex items-center justify-center cursor-pointer"
                      title="Eliminar foto"
                      aria-label="Eliminar foto"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {index < photos.length - 1 && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMovePhoto(index, "right");
                        }}
                        className="w-8 h-8 rounded-lg bg-zinc-900/90 text-zinc-200 hover:text-amber-300 flex items-center justify-center cursor-pointer"
                        title="Mover hacia la derecha"
                        aria-label="Mover foto a la derecha"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
