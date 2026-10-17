"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, ShieldAlert, UserPlus } from "lucide-react";
import { SafeAdminUser } from "../../domain/auth/types";
import { AdminUserRow } from "./users/AdminUserRow";
import { CreateAdminUserModal } from "./users/CreateAdminUserModal";

interface AdminUsersClientProps {
  initialUsers?: SafeAdminUser[];
  initialIsSuperAdmin?: boolean;
}

export function AdminUsersClient({
  initialUsers,
  initialIsSuperAdmin = true,
}: AdminUsersClientProps = {}) {
  const hasServerData = initialUsers !== undefined;

  const [users, setUsers] = useState<SafeAdminUser[]>(initialUsers || []);
  const [loading, setLoading] = useState(!hasServerData);
  const [error, setError] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(initialIsSuperAdmin);
  const [reloadKey, setReloadKey] = useState(0);

  // Modal de creación
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Estado de acción toggle
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    if (hasServerData && reloadKey === 0) {
      return;
    }

    let ignore = false;
    fetch("/api/admin/users")
      .then((res) => {
        if (res.status === 403) {
          if (!ignore) {
            setIsSuperAdmin(false);
            setLoading(false);
          }
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data || ignore) return;
        if (!data.ok) {
          setError(data.error || "No se pudo cargar la lista de administradores.");
        } else {
          setUsers(data.users || []);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Error al conectar con el servidor.");
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [hasServerData, reloadKey]);

  const handleCreateAdmin = async (input: {
    name: string;
    email: string;
    password: string;
  }) => {
    if (input.password.length < 8) {
      setModalError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setCreating(true);
    setModalError(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: input.name.trim(),
          email: input.email.trim().toLowerCase(),
          password: input.password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setModalError(data.error || "No se pudo crear el usuario.");
        return;
      }

      setShowModal(false);
      setSuccessToast(`Administrador "${data.user.name}" creado exitosamente.`);
      setTimeout(() => setSuccessToast(null), 4000);
      setReloadKey((k) => k + 1);
    } catch {
      setModalError("Error al enviar el formulario.");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (user: SafeAdminUser) => {
    if (togglingId !== null || user.role === "SUPER_ADMIN") return;

    const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const actionLabel = newStatus === "SUSPENDED" ? "suspender" : "reactivar";

    if (
      !confirm(
        `¿Estás seguro de que deseas ${actionLabel} el acceso al administrador "${user.name}"?`
      )
    ) {
      return;
    }

    setTogglingId(user.id);

    try {
      const res = await fetch("/api/admin/users/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: user.id,
          newStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Error al actualizar el estado del usuario.");
        return;
      }

      setSuccessToast(
        newStatus === "SUSPENDED"
          ? `Acceso de "${user.name}" suspendido.`
          : `Acceso de "${user.name}" reactivado.`
      );
      setTimeout(() => setSuccessToast(null), 4000);

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
    } catch {
      setError("Error de conexión al actualizar el estado.");
    } finally {
      setTogglingId(null);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 text-center max-w-md mx-auto my-12">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-800 text-zinc-400 mb-4">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-base font-semibold text-zinc-100">Acceso restringido</h2>
        <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
          Esta sección está reservada exclusivamente para la administradora principal (SUPER_ADMIN)
          para gestionar el equipo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {successToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-emerald-950/90 border border-emerald-700 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl text-xs backdrop-blur-md animate-in fade-in slide-in-from-bottom-2"
        >
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" aria-hidden="true" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-zinc-100">
              Equipo y Administradores
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Super Admin
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Gestión de accesos, roles y suspensiones de administradores de Aura Studio.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          aria-label="Dar de alta nuevo administrador"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-200 text-zinc-950 hover:bg-amber-100 active:scale-[0.98] transition-all shadow-md shadow-amber-950/20 shrink-0 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
        >
          <UserPlus size={15} aria-hidden="true" />
          <span>Nuevo Administrador</span>
        </button>
      </div>

      {/* Estado de Carga / Error / Lista */}
      {loading ? (
        <div
          role="status"
          aria-live="polite"
          className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-400"
        >
          <Loader2
            size={24}
            className="animate-spin mx-auto text-amber-200 mb-2"
            aria-hidden="true"
          />
          <p className="text-xs">Cargando administradores...</p>
        </div>
      ) : error ? (
        <div
          role="alert"
          className="bg-red-950/20 border border-red-800/80 rounded-2xl p-6 text-center text-red-200 text-xs"
        >
          {error}
        </div>
      ) : (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/60 shadow-lg">
          {users.map((user) => (
            <AdminUserRow
              key={user.id}
              user={user}
              isBusy={togglingId === user.id}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      <CreateAdminUserModal
        isOpen={showModal}
        creating={creating}
        modalError={modalError}
        onClose={() => setShowModal(false)}
        onCreate={handleCreateAdmin}
      />
    </div>
  );
}
