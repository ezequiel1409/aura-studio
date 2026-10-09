"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Crown,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from "lucide-react";
import { SafeAdminUser } from "../../domain/auth/types";

export function AdminUsersClient() {
  const [users, setUsers] = useState<SafeAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(true);

  // Modal de creación
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Estado de acción toggle
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) {
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "No se pudo cargar la lista de administradores.");
        return;
      }
      setUsers(data.users || []);
    } catch {
      setError("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password || creating) return;

    if (password.length < 8) {
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
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setModalError(data.error || "No se pudo crear el usuario.");
        return;
      }

      setShowModal(false);
      setName("");
      setEmail("");
      setPassword("");
      setSuccessToast(`Administrador "${data.user.name}" creado exitosamente.`);
      setTimeout(() => setSuccessToast(null), 4000);
      fetchUsers();
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
        alert(data.error || "Error al actualizar el estado del usuario.");
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
      alert("Error de conexión al actualizar el estado.");
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
          Esta sección está reservada exclusivamente para la administradora principal (SUPER_ADMIN) para gestionar el equipo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast de Éxito */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-emerald-950/90 border border-emerald-700 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl text-xs backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
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
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-200 text-zinc-950 hover:bg-amber-100 active:scale-[0.98] transition-all shadow-md shadow-amber-950/20 shrink-0"
        >
          <UserPlus size={15} />
          <span>Nuevo Administrador</span>
        </button>
      </div>

      {/* Estado de Carga / Error */}
      {loading ? (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-400">
          <Loader2 size={24} className="animate-spin mx-auto text-amber-200 mb-2" />
          <p className="text-xs">Cargando administradores...</p>
        </div>
      ) : error ? (
        <div className="bg-red-950/20 border border-red-800/80 rounded-2xl p-6 text-center text-red-200 text-xs">
          {error}
        </div>
      ) : (
        /* Lista de Administradores */
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/60 shadow-lg">
          {users.map((user) => {
            const isSuper = user.role === "SUPER_ADMIN";
            const isSuspended = user.status === "SUSPENDED";
            const isBusy = togglingId === user.id;

            return (
              <div
                key={user.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/60 transition-colors"
              >
                {/* Datos del usuario */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isSuper
                        ? "bg-amber-950/40 border-amber-700/60 text-amber-300"
                        : isSuspended
                        ? "bg-zinc-900 border-zinc-800 text-zinc-600"
                        : "bg-zinc-800/80 border-zinc-700 text-zinc-300"
                    }`}
                  >
                    {isSuper ? <Crown size={18} /> : <Shield size={18} />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-zinc-100">
                        {user.name}
                      </span>
                      {/* Badge Rol */}
                      {isSuper ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          <Crown size={10} />
                          Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                          Admin
                        </span>
                      )}

                      {/* Badge Estado */}
                      {isSuspended ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-950/60 text-red-300 border border-red-800/80">
                          <UserX size={10} />
                          Suspendido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/50 text-emerald-300 border border-emerald-800/60">
                          <UserCheck size={10} />
                          Activo
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Mail size={12} className="text-zinc-500" />
                        {user.email}
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-[11px] text-zinc-500">
                        Alta: {new Date(user.createdAt).toLocaleDateString("es-AR")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {isSuper ? (
                    <span className="text-xs text-zinc-500 italic px-2">
                      Cuenta principal
                    </span>
                  ) : (
                    <button
                      onClick={() => handleToggleStatus(user)}
                      disabled={isBusy}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        isSuspended
                          ? "bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-800"
                          : "bg-red-950/40 hover:bg-red-900/60 text-red-200 border border-red-800"
                      } disabled:opacity-50`}
                      title={
                        isSuspended
                          ? "Reactivar acceso a este administrador"
                          : "Dar de baja o suspender a este administrador"
                      }
                    >
                      {isBusy ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : isSuspended ? (
                        <>
                          <ShieldCheck size={13} />
                          <span>Reactivar</span>
                        </>
                      ) : (
                        <>
                          <UserX size={13} />
                          <span>Suspender</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Crear Administrador */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 p-1"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-center">
                <UserPlus size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-zinc-100">
                  Dar de alta nuevo Administrador
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Tendrá acceso como Administrador secundario al panel.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1.5">
                  Nombre y Apellido
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Sofía Herrera"
                  disabled={creating}
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1.5">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sofia@aurastudio.com"
                  disabled={creating}
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1.5">
                  Contraseña Inicial (mínimo 8 caracteres)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    disabled={creating}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    required
                  />
                  <KeyRound size={14} className="absolute right-3.5 top-3 text-zinc-500 pointer-events-none" />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Se almacenará hasheada con PBKDF2-HMAC-SHA512 (100.000 iteraciones y salt único).
                </p>
              </div>

              {modalError && (
                <div className="p-2.5 rounded-xl border bg-red-950/40 border-red-800 text-red-200 text-xs">
                  {modalError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={creating}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || !name.trim() || !email.trim() || password.length < 8}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-200 text-zinc-950 hover:bg-amber-100 active:scale-[0.98] transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Creando...</span>
                    </>
                  ) : (
                    <span>Dar de Alta</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

