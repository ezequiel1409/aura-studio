"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  HelpCircle,
  Info,
  Loader2,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { Category } from "../../../domain/category/types";
import {
  generateTemplateCsv,
  IMPORT_TEMPLATE_COLUMNS,
  parseAndValidateImport,
  ValidatedImportItem,
} from "../../../lib/parser/import-template";
import { formatPriceARS } from "../../../lib/format/currency";

interface ProductImportClientProps {
  categories: Category[];
}

export function ProductImportClient({ categories }: ProductImportClientProps) {
  const [fileContent, setFileContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "VALID" | "WARNING" | "ERROR"
  >("ALL");

  const [parsedData, setParsedData] = useState<{
    items: ValidatedImportItem[];
    summary: {
      totalRows: number;
      validCount: number;
      warningCount: number;
      errorCount: number;
    };
  } | null>(null);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    failedCount: number;
    errors: Array<{ rowNumber: number; title: string; error: string }>;
  } | null>(null);

  // Descarga de la plantilla oficial con UTF-8 BOM
  const handleDownloadTemplate = () => {
    const csvData = generateTemplateCsv();
    const blob = new Blob([csvData], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "plantilla_productos_aura_studio.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleProcessText = (text: string, name: string = "archivo.csv") => {
    setFileName(name);
    setFileContent(text);
    const result = parseAndValidateImport(text, categories);
    setParsedData(result);
    setImportResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleProcessText(text, file.name);
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleProcessText(text, file.name);
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleConfirmImport = async () => {
    if (!parsedData || importing) return;
    const itemsToImport = parsedData.items.filter(
      (item) => item.rowStatus !== "ERROR"
    );

    if (itemsToImport.length === 0) {
      alert("No hay filas válidas para importar. Corregí los errores antes de continuar.");
      return;
    }

    setImporting(true);
    try {
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToImport }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Falla al procesar la importación");
      }
      setImportResult({
        importedCount: data.importedCount,
        failedCount: data.failedCount,
        errors: data.errors || [],
      });
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? err.message
          : "Error de red al importar los productos."
      );
    } finally {
      setImporting(false);
    }
  };

  const resetAll = () => {
    setFileContent("");
    setFileName("");
    setParsedData(null);
    setImportResult(null);
  };

  const filteredItems = parsedData
    ? parsedData.items.filter((item) => {
        if (filterStatus === "ALL") return true;
        return item.rowStatus === filterStatus;
      })
    : [];

  return (
    <div className="space-y-6 pb-28">
      {/* 1. Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/productos"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            aria-label="Volver a productos"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <FileSpreadsheet size={15} />
              <span>Carga Masiva</span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-zinc-100 mt-0.5">
              Importar Productos desde Plantilla
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Cargá hasta 500 productos de una vez. La plantilla coincide exactamente con los campos del formulario.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-300 hover:bg-amber-200 text-zinc-950 font-bold text-xs shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Download size={15} />
          <span>Descargar Plantilla CSV (Excel)</span>
        </button>
      </div>

      {/* 2. Éxito de Importación */}
      {importResult && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 text-center max-w-xl mx-auto shadow-2xl animate-in fade-in">
          <div className="w-14 h-14 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 size={30} />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-2xl font-bold text-zinc-100">
              ¡Importación completada!
            </h3>
            <p className="text-sm text-zinc-300">
              Se crearon exitosamente{" "}
              <strong className="text-emerald-400 font-bold">
                {importResult.importedCount}
              </strong>{" "}
              productos en tu catálogo.
            </p>
            {importResult.failedCount > 0 && (
              <p className="text-xs text-amber-300">
                {importResult.failedCount} piezas no pudieron importarse debido a errores.
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Link
              href="/admin/productos"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-300 text-zinc-950 font-bold text-xs hover:bg-amber-200 transition-colors"
            >
              Ver productos en el panel
            </Link>
            <button
              type="button"
              onClick={resetAll}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-xs hover:bg-zinc-700 transition-colors"
            >
              Cargar otro archivo
            </button>
          </div>
        </div>
      )}

      {/* 3. Panel Informativo de Columnas y Correspondencia */}
      {!parsedData && !importResult && (
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
            <HelpCircle size={15} />
            <span>Guía de Columnas y Correspondencia Posicional (ADM-04)</span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            La plantilla contiene las mismas 13 columnas del formulario. Podés cargar valores múltiples separados por coma con correspondencia directa entre talles y stock:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="font-bold text-amber-300 block">
                Talles y Stock alineados
              </span>
              <p className="text-zinc-400 text-[11px]">
                <code>talles: S, M, L</code><br />
                <code>stock: 2, 3, 1</code><br />
                Asigna: S=2 unidades, M=3 unidades, L=1 unidad.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="font-bold text-amber-300 block">
                Colores múltiples
              </span>
              <p className="text-zinc-400 text-[11px]">
                <code>colores: Blanco, Negro</code><br />
                Crea ambas variantes de color con los talles y stock indicados.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="font-bold text-amber-300 block">
                Imágenes y Estado
              </span>
              <p className="text-zinc-400 text-[11px]">
                <code>estado: Disponible / Reservado</code><br />
                <code>destacado: SI / NO</code><br />
                <code>imagenes: URL1, URL2</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Zona de Carga de Archivo */}
      {!parsedData && !importResult && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
            isDragging
              ? "border-amber-400 bg-amber-400/10"
              : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
          }`}
        >
          <input
            type="file"
            id="csv-file-input"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="sr-only"
          />
          <label
            htmlFor="csv-file-input"
            className="flex flex-col items-center justify-center cursor-pointer space-y-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-300 shadow-md">
              <Upload size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-zinc-100">
                Arrastrá tu planilla CSV aquí o hacé clic para seleccionarla
              </p>
              <p className="text-xs text-zinc-400">
                Formatos aceptados: .csv delimitado por comas o punto y coma (UTF-8)
              </p>
            </div>
          </label>
        </div>
      )}

      {/* 5. Tabla de Validación Previa (ADM-04: verde válidas, rojo errores, amarillo advertencias) */}
      {parsedData && !importResult && (
        <div className="space-y-4">
          {/* Barra de Resumen y Filtros */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-zinc-200 block truncate">
                  Archivo: {fileName}
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono text-[11px]">
                    Total: {parsedData.summary.totalRows} filas
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-800 text-emerald-300 font-mono text-[11px] font-bold">
                    ✓ {parsedData.summary.validCount} válidas
                  </span>
                  {parsedData.summary.warningCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-800 text-amber-300 font-mono text-[11px] font-bold">
                      ⚠ {parsedData.summary.warningCount} advertencias
                    </span>
                  )}
                  {parsedData.summary.errorCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-950/70 border border-rose-800 text-rose-300 font-mono text-[11px] font-bold">
                      ✕ {parsedData.summary.errorCount} errores
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetAll}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
              >
                Cambiar archivo
              </button>

              <button
                type="button"
                disabled={
                  importing ||
                  parsedData.summary.validCount +
                    parsedData.summary.warningCount ===
                    0
                }
                onClick={handleConfirmImport}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-300 hover:bg-amber-200 text-zinc-950 font-extrabold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {importing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Importando...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>
                      Confirmar importación (
                      {parsedData.summary.validCount +
                        parsedData.summary.warningCount}
                      )
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Filtros de Tabla */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-500 font-bold mr-1">Filtrar:</span>
            <button
              type="button"
              onClick={() => setFilterStatus("ALL")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                filterStatus === "ALL"
                  ? "bg-zinc-800 text-amber-300"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Todas ({parsedData.items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("VALID")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                filterStatus === "VALID"
                  ? "bg-emerald-950/80 border border-emerald-800 text-emerald-300"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Válidas ({parsedData.summary.validCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("WARNING")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                filterStatus === "WARNING"
                  ? "bg-amber-950/80 border border-amber-800 text-amber-300"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Advertencias ({parsedData.summary.warningCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("ERROR")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                filterStatus === "ERROR"
                  ? "bg-rose-950/80 border border-rose-800 text-rose-300"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Errores ({parsedData.summary.errorCount})
            </button>
          </div>

          {/* Tabla de Filas */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto max-h-[520px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-zinc-950 border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400 font-bold z-10">
                  <tr>
                    <th className="py-2.5 px-3">Fila</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3">Nombre</th>
                    <th className="py-2.5 px-3">Precio</th>
                    <th className="py-2.5 px-3">Categoría</th>
                    <th className="py-2.5 px-3">Para</th>
                    <th className="py-2.5 px-3">Variantes (Colores / Talles / Stock)</th>
                    <th className="py-2.5 px-3">Detalle de Validación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                  {filteredItems.map((item) => {
                    const isError = item.rowStatus === "ERROR";
                    const isWarning = item.rowStatus === "WARNING";

                    return (
                      <tr
                        key={item.rowNumber}
                        className={`transition-colors ${
                          isError
                            ? "bg-rose-950/20 hover:bg-rose-950/30 text-rose-200"
                            : isWarning
                            ? "bg-amber-950/20 hover:bg-amber-950/30 text-amber-200"
                            : "bg-zinc-950/40 hover:bg-zinc-900/50 text-zinc-200"
                        }`}
                      >
                        <td className="py-2.5 px-3 text-zinc-500 font-bold">
                          #{item.rowNumber}
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {isError ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950 border border-rose-800 text-rose-300 text-[10px] font-bold">
                              ✕ Error
                            </span>
                          ) : isWarning ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-300 text-[10px] font-bold">
                              ⚠ Advertencia
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-[10px] font-bold">
                              ✓ Válida
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 font-sans font-bold text-zinc-100 max-w-[180px] truncate">
                          {item.title || (
                            <span className="text-rose-400 italic">
                              [Nombre faltante]
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {item.priceCents !== null
                            ? formatPriceARS(item.priceCents)
                            : "A consultar"}
                        </td>

                        <td className="py-2.5 px-3 font-sans whitespace-nowrap">
                          {item.categoryName}
                        </td>

                        <td className="py-2.5 px-3 font-sans whitespace-nowrap">
                          {item.attributes.para || "-"}
                        </td>

                        <td className="py-2.5 px-3 max-w-[240px] truncate">
                          {item.colors.map((c) => (
                            <span key={c.name} className="mr-2">
                              {c.name}: [
                              {c.sizes.map((s) => `${s.size}=${s.stock}`).join(", ")}
                              ]
                            </span>
                          ))}
                        </td>

                        <td className="py-2.5 px-3 font-sans text-xs">
                          {item.errors.length > 0 ? (
                            <div className="space-y-0.5">
                              {item.errors.map((err, eIdx) => (
                                <p
                                  key={eIdx}
                                  className={`text-[10px] ${
                                    err.severity === "ERROR"
                                      ? "text-rose-400 font-semibold"
                                      : "text-amber-400"
                                  }`}
                                >
                                  <strong>{err.column}:</strong> {err.message}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <span className="text-emerald-400 text-[10px]">
                              Lista para importar
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
