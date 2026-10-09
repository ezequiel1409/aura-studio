"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Edit2,
  EyeOff,
  Folder,
  FolderPlus,
  Info,
  Plus,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { CategoryTreeNode } from "../../services/category.service";

interface CategoryManagerClientProps {
  initialTree: CategoryTreeNode[];
}

export function CategoryManagerClient({
  initialTree,
}: CategoryManagerClientProps) {
  const router = useRouter();
  const [tree, setTree] = useState<CategoryTreeNode[]>(initialTree);

  // Estados de modales
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<number | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryHidden, setNewCategoryHidden] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<CategoryTreeNode | null>(null);
  const [editName, setEditName] = useState("");
  const [editHidden, setEditHidden] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingNode, setDeletingNode] = useState<CategoryTreeNode | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<number | "">("");

  // Estado de carga y feedback amigable accesible (sin alert() bloqueante)
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<{
    text: string;
    type: "info" | "error" | "success";
  } | null>(null);

  const showNotice = (
    text: string,
    type: "info" | "error" | "success" = "info"
  ) => {
    setFeedbackNotice({ text, type });
  };

  // Obtener lista plana de nodos hoja válidos para reasignar prendas (BR-15)
  const leafNodes = tree.flatMap((root) => {
    if (root.children.length === 0) return [root];
    return root.children;
  });

  const refreshTree = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (res.ok && data.ok) {
        setTree(data.categories);
      }
    } catch {
      // Ignorar fallo de refresco
    }
  };

  // Crear categoría (BR-15, BR-17)
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          parentId: createParentId,
          isHidden: newCategoryHidden,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo crear la categoría.");
      }

      setCreateModalOpen(false);
      setNewCategoryName("");
      setCreateParentId(null);
      setNewCategoryHidden(false);
      await refreshTree();
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al crear categoría";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Editar / renombrar categoría (BR-17, BR-38)
  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNode || !editName.trim()) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/categories/${editingNode.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          isHidden: editHidden,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo actualizar la categoría.");
      }

      setEditModalOpen(false);
      setEditingNode(null);
      await refreshTree();
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Reordenar categorías (BR-17)
  const handleMoveOrder = async (
    items: CategoryTreeNode[],
    index: number,
    direction: "up" | "down"
  ) => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === items.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const current = items[index];
    const target = items[targetIndex];

    const currentPos = current.position;
    const targetPos = target.position;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            { id: current.id, position: targetPos },
            { id: target.id, position: currentPos },
          ],
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        await refreshTree();
        router.refresh();
      }
    } catch {
      showNotice(
        "No se pudo reordenar las categorías. Por favor, intentá nuevamente.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Abrir diálogo de eliminación con protección (BR-18, BR-19)
  const handleInitiateDelete = (node: CategoryTreeNode) => {
    if (node.isSystem) {
      showNotice(
        "La categoría del sistema 'Sin clasificar' no puede ser eliminada porque contiene prendas por defecto (BR-19).",
        "info"
      );
      return;
    }
    if (node.children.length > 0) {
      showNotice(
        `La categoría '${node.name}' tiene ${node.children.length} subcategoría(s). Es necesario mover o eliminar las subcategorías primero (BR-18).`,
        "info"
      );
      return;
    }

    setDeletingNode(node);
    setReassignTargetId("");
    setErrorMessage(null);
    setDeleteModalOpen(true);
  };

  // Confirmar eliminación (BR-18)
  const handleConfirmDelete = async () => {
    if (!deletingNode) return;

    if (deletingNode.productsCount > 0 && !reassignTargetId) {
      setErrorMessage(
        "Debe seleccionar una categoría de destino para reasignar las prendas (BR-18)."
      );
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(
        `/api/admin/categories/${deletingNode.id}${
          reassignTargetId ? `?reassignTo=${reassignTargetId}` : ""
        }`,
        { method: "DELETE" }
      );

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo eliminar la categoría.");
      }

      setDeleteModalOpen(false);
      setDeletingNode(null);
      await refreshTree();
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Cabecera & Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 md:p-6 backdrop-blur-sm">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
            Catálogo y Navegación (BR-15, BR-17, BR-18, BR-38)
          </span>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-zinc-100 mt-1">
            Gestión de Categorías
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Organizá la jerarquía de 2 niveles, reordená el menú público y visualizá visitas acumuladas (BR-39).
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCreateParentId(null);
            setNewCategoryName("");
            setNewCategoryHidden(false);
            setErrorMessage(null);
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-200 text-zinc-950 font-bold text-xs hover:bg-amber-100 active:scale-95 transition-all shadow-sm shrink-0"
        >
          <FolderPlus size={16} />
          <span>+ Nueva Categoría Raíz</span>
        </button>
      </div>

      {/* Banner de feedback amigable y accesible */}
      {feedbackNotice && (
        <div
          role={feedbackNotice.type === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`flex items-start justify-between gap-3 p-4 rounded-xl text-xs border ${
            feedbackNotice.type === "error"
              ? "bg-rose-950/40 border-rose-800 text-rose-300"
              : feedbackNotice.type === "success"
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
              : "bg-amber-950/40 border-amber-800/80 text-amber-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackNotice.type === "error" ? (
              <AlertCircle size={16} className="shrink-0 text-rose-400" aria-hidden="true" />
            ) : feedbackNotice.type === "success" ? (
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" aria-hidden="true" />
            ) : (
              <Info size={16} className="shrink-0 text-amber-300" aria-hidden="true" />
            )}
            <p className="font-medium leading-relaxed">{feedbackNotice.text}</p>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackNotice(null)}
            aria-label="Cerrar aviso informativo"
            className="p-1 rounded-lg hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Árbol Visual de Categorías */}
      <div className="space-y-4">
        {tree.map((root, rootIdx) => {
          const hasChildren = root.children.length > 0;
          const canAddSubcategory = !root.isSystem && root.productsCount === 0;

          return (
            <div
              key={root.id}
              className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 md:p-5 space-y-3 backdrop-blur-sm transition-all"
            >
              {/* Nodo Raíz */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-200 shrink-0">
                    <Folder size={18} aria-hidden="true" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-zinc-100 truncate">
                        {root.name}
                      </h3>

                      {root.isSystem && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                          <Shield size={10} aria-hidden="true" />
                          <span>Sistema (BR-19)</span>
                        </span>
                      )}

                      {root.isHidden && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/40 text-rose-300 border border-rose-800">
                          <EyeOff size={10} aria-hidden="true" />
                          <span>Oculta</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono mt-0.5">
                      <span>/{root.slug}</span>
                      <span aria-hidden="true">•</span>
                      <span className="text-zinc-300">{root.productsCount} prendas</span>
                      <span aria-hidden="true">•</span>
                      <span className="text-emerald-400">{root.viewsCount} visitas</span>
                    </div>
                  </div>
                </div>

                {/* Acciones de la Raíz */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Reordenar */}
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(tree, rootIdx, "up")}
                    disabled={rootIdx === 0 || loading}
                    aria-label={`Subir posición de la categoría ${root.name}`}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                    title="Subir posición"
                  >
                    <ArrowUp size={14} aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMoveOrder(tree, rootIdx, "down")}
                    disabled={rootIdx === tree.length - 1 || loading}
                    aria-label={`Bajar posición de la categoría ${root.name}`}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                    title="Bajar posición"
                  >
                    <ArrowDown size={14} aria-hidden="true" />
                  </button>

                  {/* Agregar Subcategoría (BR-15, BR-18) */}
                  {!root.isSystem && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!canAddSubcategory) {
                          showNotice(
                            `La categoría '${root.name}' tiene ${root.productsCount} prenda(s) asignadas directamente. Debés reasignar esas prendas antes de asignarle subcategorías (BR-18).`,
                            "info"
                          );
                          return;
                        }
                        setCreateParentId(root.id);
                        setNewCategoryName("");
                        setNewCategoryHidden(false);
                        setErrorMessage(null);
                        setCreateModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-amber-200 hover:bg-zinc-800 transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                      title="Agregar subcategoría"
                      aria-label={`Agregar subcategoría dentro de ${root.name}`}
                    >
                      <Plus size={15} aria-hidden="true" />
                    </button>
                  )}

                  {/* Editar */}
                  {!root.isSystem && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNode(root);
                        setEditName(root.name);
                        setEditHidden(root.isHidden);
                        setErrorMessage(null);
                        setEditModalOpen(true);
                      }}
                      aria-label={`Editar categoría ${root.name}`}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                      title="Editar categoría"
                    >
                      <Edit2 size={14} aria-hidden="true" />
                    </button>
                  )}

                  {/* Eliminar */}
                  {!root.isSystem && (
                    <button
                      type="button"
                      onClick={() => handleInitiateDelete(root)}
                      aria-label={`Eliminar categoría ${root.name}`}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                      title="Eliminar categoría"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              {/* Subcategorías (Nivel 2, BR-15) */}
              {hasChildren && (
                <div className="pl-6 md:pl-8 border-l-2 border-zinc-800 ml-4 space-y-2 pt-1">
                  {root.children.map((sub, subIdx) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-all"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-zinc-200 truncate">
                            {sub.name}
                          </span>
                          {sub.isHidden && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-950/40 text-rose-300 border border-rose-800">
                              Oculta
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                          <span>/{sub.slug}</span>
                          <span aria-hidden="true">•</span>
                          <span>{sub.productsCount} prendas</span>
                          <span aria-hidden="true">•</span>
                          <span className="text-emerald-400">{sub.viewsCount} visitas</span>
                        </div>
                      </div>

                      {/* Acciones Subcategoría */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(root.children, subIdx, "up")}
                          disabled={subIdx === 0 || loading}
                          aria-label={`Subir posición de la subcategoría ${sub.name}`}
                          title={`Subir posición de ${sub.name}`}
                          className="p-1 rounded text-zinc-400 hover:text-zinc-100 disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                        >
                          <ArrowUp size={13} aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMoveOrder(root.children, subIdx, "down")}
                          disabled={subIdx === root.children.length - 1 || loading}
                          aria-label={`Bajar posición de la subcategoría ${sub.name}`}
                          title={`Bajar posición de ${sub.name}`}
                          className="p-1 rounded text-zinc-400 hover:text-zinc-100 disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                        >
                          <ArrowDown size={13} aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingNode(sub);
                            setEditName(sub.name);
                            setEditHidden(sub.isHidden);
                            setErrorMessage(null);
                            setEditModalOpen(true);
                          }}
                          aria-label={`Editar subcategoría ${sub.name}`}
                          title={`Editar subcategoría ${sub.name}`}
                          className="p-1 rounded text-zinc-400 hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                        >
                          <Edit2 size={13} aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleInitiateDelete(sub)}
                          aria-label={`Eliminar subcategoría ${sub.name}`}
                          title={`Eliminar subcategoría ${sub.name}`}
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                        >
                          <Trash2 size={13} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Crear Categoría / Subcategoría */}
      {createModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-category-heading"
          onKeyDown={(e) => {
            if (e.key === "Escape") setCreateModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="create-category-heading" className="font-serif text-lg font-bold text-zinc-100">
                {createParentId ? "Nueva Subcategoría" : "Nueva Categoría Raíz"}
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                aria-label="Cerrar modal de creación de categoría"
                className="text-zinc-400 hover:text-zinc-100 p-1 rounded-lg focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="newCategoryNameInput" className="text-xs text-zinc-400">
                  Nombre
                </label>
                <input
                  id="newCategoryNameInput"
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ej: Remeras, Calzado, Carteras"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="newHidden"
                  checked={newCategoryHidden}
                  onChange={(e) => setNewCategoryHidden(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-950 text-amber-300 focus-visible:ring-2 focus-visible:ring-amber-400"
                />
                <label htmlFor="newHidden" className="text-xs text-zinc-300 cursor-pointer">
                  Ocultar del menú público (BR-38)
                </label>
              </div>

              {errorMessage && (
                <p role="alert" className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800">
                  {errorMessage}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-amber-200 text-zinc-950 font-bold text-xs hover:bg-amber-100 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                >
                  {loading ? "Creando..." : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar / Renombrar Categoría */}
      {editModalOpen && editingNode && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-category-heading"
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="edit-category-heading" className="font-serif text-lg font-bold text-zinc-100">
                Editar Categoría
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                aria-label="Cerrar modal de edición de categoría"
                className="text-zinc-400 hover:text-zinc-100 p-1 rounded-lg focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleEditCategory} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="editCategoryNameInput" className="text-xs text-zinc-400">
                  Nombre
                </label>
                <input
                  id="editCategoryNameInput"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="editCategorySlugInput" className="text-xs text-zinc-400">
                  Slug permanente (BR-38)
                </label>
                <input
                  id="editCategorySlugInput"
                  type="text"
                  disabled
                  value={editingNode.slug}
                  className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-500 cursor-not-allowed"
                />
                <p className="text-[10px] text-zinc-500">
                  El slug no cambia al renombrar para preservar enlaces estables (BR-38).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editHidden"
                  checked={editHidden}
                  onChange={(e) => setEditHidden(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-950 text-amber-300 focus-visible:ring-2 focus-visible:ring-amber-400"
                />
                <label htmlFor="editHidden" className="text-xs text-zinc-300 cursor-pointer">
                  Ocultar del menú público (BR-38)
                </label>
              </div>

              {errorMessage && (
                <p role="alert" className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800">
                  {errorMessage}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-amber-200 text-zinc-950 font-bold text-xs hover:bg-amber-100 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                >
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Eliminar Categoría con Reasignación (BR-18, BR-37) */}
      {deleteModalOpen && deletingNode && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-category-heading"
          onKeyDown={(e) => {
            if (e.key === "Escape") setDeleteModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="delete-category-heading" className="font-serif text-lg font-bold text-rose-300">
                Eliminar Categoría
              </h3>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                aria-label="Cerrar modal de eliminación de categoría"
                className="text-zinc-400 hover:text-zinc-100 p-1 rounded-lg focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              ¿Estás segura de eliminar la categoría{" "}
              <strong className="text-zinc-100">&apos;{deletingNode.name}&apos;</strong>?
            </p>

            {deletingNode.productsCount > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/60 space-y-2 text-xs">
                <p className="text-amber-200 font-semibold">
                  Esta categoría contiene {deletingNode.productsCount} prenda(s).
                </p>
                <label htmlFor="reassignTargetSelect" className="block text-zinc-400">
                  Para eliminarla protegida (BR-18), debés seleccionar a qué categoría mover esas prendas:
                </label>

                <select
                  id="reassignTargetSelect"
                  aria-label="Seleccionar categoría de destino para reasignar prendas"
                  value={reassignTargetId}
                  onChange={(e) => setReassignTargetId(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400"
                >
                  <option value="">-- Seleccionar categoría de destino --</option>
                  {leafNodes
                    .filter((n) => n.id !== deletingNode.id)
                    .map((leaf) => (
                      <option key={leaf.id} value={leaf.id}>
                        {leaf.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {errorMessage && (
              <p role="alert" className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800">
                {errorMessage}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
              >
                {loading ? "Eliminando..." : "Confirmar Eliminación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
