"use client";

import { useState } from "react";
import { Plus, Percent } from "lucide-react";
import { NavbarItemConfig } from "../../../../services/settings.service";
import { Category } from "../../../../domain/category/types";
import { NavigationSection } from "../../../../domain/navigation/types";

interface NavbarNewItemFormProps {
  onAddItem: (item: Omit<NavbarItemConfig, "id" | "position">) => void;
  onCancel: () => void;
  categories?: Category[];
  sections?: NavigationSection[];
}

export function NavbarNewItemForm({
  onAddItem,
  onCancel,
  categories = [],
  sections = [],
}: NavbarNewItemFormProps) {
  const [label, setLabel] = useState("");
  const [href, setHref] = useState("");
  const [isSale, setIsSale] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !href.trim()) return;

    onAddItem({
      label: label.trim().toUpperCase(),
      href: href.trim(),
      isSale,
    });

    setLabel("");
    setHref("");
    setIsSale(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded-xl bg-zinc-950 border border-amber-400/40 space-y-3 animate-in fade-in duration-150"
    >
      <div className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
        <Plus size={14} />
        <span>Agregar enlace a la barra</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
            Nombre visible (ej: ABRIGOS, REMERAS, SALE)
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ej: OTOÑO 2026"
            required
            className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
            Destino (Ruta o URL)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder="Ej: /mujer o /catalogo"
              required
              className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
            />
            {/* Presets rápidos */}
            <select
              onChange={(e) => {
                if (e.target.value) setHref(e.target.value);
              }}
              defaultValue=""
              className="px-2 py-1 text-xs bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-lg shrink-0"
            >
              <option value="" disabled>
                Elegir de...
              </option>
              <optgroup label="Secciones">
                {sections.map((s) => (
                  <option key={s.slug} value={`/${s.slug}`}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Categorías">
                {categories.map((c) => (
                  <option key={c.slug} value={`/catalogo?categoria=${c.slug}`}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Páginas">
                <option value="/catalogo">Todo el Catálogo</option>
                <option value="/promociones">Promociones</option>
                <option value="/terminos">Términos</option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isSale}
            onChange={(e) => setIsSale(e.target.checked)}
            className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400"
          />
          <span className="text-xs text-zinc-300 flex items-center gap-1">
            <Percent size={12} className="text-rose-400" />
            <span>Destacar como oferta / Sale (color rojo)</span>
          </span>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-lg bg-amber-400 text-zinc-950 text-xs font-bold hover:bg-amber-300 cursor-pointer"
          >
            Agregar
          </button>
        </div>
      </div>
    </form>
  );
}

