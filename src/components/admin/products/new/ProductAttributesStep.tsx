"use client";

import { useState } from "react";
import { PlusCircle, Star } from "lucide-react";
import { ProductAttributeDefinition } from "../../../../domain/navigation/types";

interface ProductAttributesStepProps {
  initialStatus: "AVAILABLE" | "RESERVED";
  onStatusChange: (status: "AVAILABLE" | "RESERVED") => void;
  isFeatured: boolean;
  onFeaturedChange: (featured: boolean) => void;
  allowReturn: boolean;
  onAllowReturnChange: (allow: boolean) => void;
  attributes: Record<string, string>;
  onAttributeChange: (key: string, value: string) => void;
  attributeDefinitions: ProductAttributeDefinition[];
  onAttributeDefinitionsChange: (defs: ProductAttributeDefinition[]) => void;
}

export function ProductAttributesStep({
  initialStatus,
  onStatusChange,
  isFeatured,
  onFeaturedChange,
  allowReturn,
  onAllowReturnChange,
  attributes,
  onAttributeChange,
  attributeDefinitions,
  onAttributeDefinitionsChange,
}: ProductAttributesStepProps) {
  const [addingOptionForDefId, setAddingOptionForDefId] = useState<number | null>(null);
  const [newOptionValue, setNewOptionValue] = useState("");
  const [addingOptionLoading, setAddingOptionLoading] = useState(false);

  const handleQuickAddOption = async (def: ProductAttributeDefinition) => {
    const trimmed = newOptionValue.trim();
    if (!trimmed) return;

    if (def.options.some((o) => o.toLowerCase() === trimmed.toLowerCase())) {
      onAttributeChange(def.key, trimmed);
      setAddingOptionForDefId(null);
      setNewOptionValue("");
      return;
    }

    setAddingOptionLoading(true);
    try {
      const updatedOptions = [...def.options, trimmed];
      const res = await fetch("/api/admin/attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: def.id,
          name: def.name || def.label,
          slug: def.slug || def.key,
          options: updatedOptions,
          isFilterable: def.isFilterable,
          position: def.position,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        onAttributeDefinitionsChange(
          attributeDefinitions.map((d) =>
            d.id === def.id ? { ...d, options: updatedOptions } : d
          )
        );
        onAttributeChange(def.key, trimmed);
        setAddingOptionForDefId(null);
        setNewOptionValue("");
      } else {
        alert(data.error || "No se pudo guardar la nueva opción");
      }
    } catch {
      alert("Error de conexión al guardar la opción de atributo.");
    } finally {
      setAddingOptionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Visibilidad inicial */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-zinc-200">
          Estado de publicación
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onStatusChange("AVAILABLE")}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              initialStatus === "AVAILABLE"
                ? "bg-emerald-950/40 border-emerald-500/80 text-emerald-200 ring-1 ring-emerald-500"
                : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <p className="text-xs font-bold">Disponible</p>
            <p className="text-[10px] opacity-80 mt-0.5">Visible en catálogo público</p>
          </button>

          <button
            type="button"
            onClick={() => onStatusChange("RESERVED")}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              initialStatus === "RESERVED"
                ? "bg-amber-950/40 border-amber-500/80 text-amber-200 ring-1 ring-amber-500"
                : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <p className="text-xs font-bold">Borrador / Reservado</p>
            <p className="text-[10px] opacity-80 mt-0.5">Oculto temporalmente</p>
          </button>
        </div>
      </div>

      {/* Switches rápidos: Destacado y Devolución */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-zinc-800/80">
        <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => onFeaturedChange(e.target.checked)}
            className="w-4 h-4 rounded-md accent-amber-400 cursor-pointer"
          />
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
            <Star size={14} className={isFeatured ? "text-amber-300 fill-amber-300" : "text-zinc-500"} />
            <span>Destacar en portada</span>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
          <input
            type="checkbox"
            checked={allowReturn}
            onChange={(e) => onAllowReturnChange(e.target.checked)}
            className="w-4 h-4 rounded-md accent-amber-400 cursor-pointer"
          />
          <div className="text-xs font-semibold text-zinc-200">
            <span>Permite cambios y devoluciones</span>
          </div>
        </label>
      </div>

      {/* Atributos adicionales dinámicos (si existen configurados en la tienda) */}
      {attributeDefinitions.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-zinc-800/80">
          <span className="block text-xs font-bold text-zinc-300">
            Filtros y especificaciones (Opcional):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attributeDefinitions.map((def) => (
              <div key={def.id} className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>{def.label || def.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setAddingOptionForDefId(
                        addingOptionForDefId === def.id ? null : def.id
                      )
                    }
                    className="text-amber-300 hover:underline inline-flex items-center gap-1"
                  >
                    <PlusCircle size={11} />
                    <span>{addingOptionForDefId === def.id ? "Cerrar" : "+ Opción"}</span>
                  </button>
                </div>

                {addingOptionForDefId === def.id ? (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newOptionValue}
                      onChange={(e) => setNewOptionValue(e.target.value)}
                      placeholder={`Nueva opción para ${def.label}...`}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-zinc-100"
                    />
                    <button
                      type="button"
                      disabled={addingOptionLoading || !newOptionValue.trim()}
                      onClick={() => handleQuickAddOption(def)}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-400 text-zinc-950 font-bold text-xs hover:bg-amber-300 disabled:opacity-50"
                    >
                      {addingOptionLoading ? "..." : "Agregar"}
                    </button>
                  </div>
                ) : (
                  <select
                    value={attributes[def.key] || ""}
                    onChange={(e) => onAttributeChange(def.key, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="">(Sin especificar)</option>
                    {def.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

