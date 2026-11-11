"use client";

import { RefObject, useState } from "react";
import { PlusCircle } from "lucide-react";
import { Category } from "../../../../domain/category/types";

interface BasicDataStepProps {
  title: string;
  onTitleChange: (value: string) => void;
  titleInputRef?: RefObject<HTMLInputElement | null>;
  pricePesos: string;
  onPriceChange: (value: string) => void;
  compareAtPricePesos: string;
  onCompareAtPriceChange: (value: string) => void;
  isConsultPrice: boolean;
  onConsultPriceChange: (checked: boolean) => void;
  categories: Category[];
  selectedCategoryId: number;
  onCategoryChange: (categoryId: number) => void;
  onCategoryCreated: (newCategory: Category) => void;
}

export function BasicDataStep({
  title,
  onTitleChange,
  titleInputRef,
  pricePesos,
  onPriceChange,
  compareAtPricePesos,
  onCompareAtPriceChange,
  isConsultPrice,
  onConsultPriceChange,
  categories,
  selectedCategoryId,
  onCategoryChange,
  onCategoryCreated,
}: BasicDataStepProps) {
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategoryLoading, setCreatingCategoryLoading] = useState(false);

  const handleQuickCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed || creatingCategoryLoading) return;

    setCreatingCategoryLoading(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (res.ok && data.category) {
        onCategoryCreated(data.category);
        onCategoryChange(data.category.id);
        setNewCategoryName("");
        setIsCreatingCategory(false);
      } else {
        alert(data.error || "No se pudo crear la categoría");
      }
    } catch {
      alert("Error de conexión al crear la categoría.");
    } finally {
      setCreatingCategoryLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Título de la Prenda */}
      <div className="space-y-1.5">
        <label
          htmlFor="step-product-title"
          className="block text-xs font-bold text-zinc-200"
        >
          Nombre de la prenda <span className="text-amber-400">*</span>
        </label>
        <input
          ref={titleInputRef}
          id="step-product-title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Ej: Camisa Lino Classic, Sweater Tejido..."
          className="w-full px-3.5 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
          required
        />
      </div>

      {/* Precios: Actual y Anterior */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        <div className="space-y-1.5">
          <label
            htmlFor="step-product-price"
            className="block text-xs font-bold text-zinc-200"
          >
            Precio de venta (ARS) <span className="text-amber-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500 pointer-events-none">
              $
            </span>
            <input
              id="step-product-price"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              disabled={isConsultPrice}
              value={pricePesos}
              onChange={(e) => onPriceChange(e.target.value)}
              placeholder={isConsultPrice ? "Consultar precio" : "0"}
              className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 disabled:opacity-50 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="step-product-compare-price"
            className="block text-xs font-bold text-zinc-200"
          >
            Precio anterior (Opcional - Tachado)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500 pointer-events-none">
              $
            </span>
            <input
              id="step-product-compare-price"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              disabled={isConsultPrice}
              value={compareAtPricePesos}
              onChange={(e) => onCompareAtPriceChange(e.target.value)}
              placeholder="Ej: 35000"
              className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 disabled:opacity-50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Switch Consultar Precio */}
      <div className="flex items-center gap-2 pt-1">
        <input
          id="step-consult-price-toggle"
          type="checkbox"
          checked={isConsultPrice}
          onChange={(e) => onConsultPriceChange(e.target.checked)}
          className="w-4 h-4 rounded-md accent-amber-400 cursor-pointer"
        />
        <label
          htmlFor="step-consult-price-toggle"
          className="text-xs font-medium text-zinc-300 cursor-pointer select-none"
        >
          Ocultar precio y mostrar botón &ldquo;Consultar precio&rdquo;
        </label>
      </div>

      {/* Categoría */}
      <div className="space-y-2 pt-2 border-t border-zinc-800/80">
        <div className="flex items-center justify-between">
          <label
            htmlFor="step-product-cat"
            className="text-xs font-bold text-zinc-200"
          >
            Categoría del catálogo <span className="text-amber-400">*</span>
          </label>
          <button
            type="button"
            onClick={() => setIsCreatingCategory(!isCreatingCategory)}
            className="text-xs font-semibold text-amber-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <PlusCircle size={13} />
            <span>{isCreatingCategory ? "Cancelar" : "+ Nueva categoría"}</span>
          </button>
        </div>

        {isCreatingCategory ? (
          <form
            onSubmit={handleQuickCreateCategory}
            className="flex gap-2"
          >
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nombre de la nueva categoría..."
              className="flex-1 px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
              autoFocus
            />
            <button
              type="submit"
              disabled={creatingCategoryLoading || !newCategoryName.trim()}
              className="px-4 py-2.5 rounded-xl bg-amber-300 text-zinc-950 text-xs font-bold hover:bg-amber-200 disabled:opacity-50 cursor-pointer transition-colors"
            >
              {creatingCategoryLoading ? "Creando..." : "Crear"}
            </button>
          </form>
        ) : (
          <select
            id="step-product-cat"
            value={selectedCategoryId}
            onChange={(e) => onCategoryChange(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
