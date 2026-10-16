"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, UserPlus, X } from "lucide-react";

interface CreateAdminUserModalProps {
  isOpen: boolean;
  creating: boolean;
  modalError: string | null;
  onClose: () => void;
  onCreate: (data: { name: string; email: string; password: string }) => Promise<void>;
}

export function CreateAdminUserModal({
  isOpen,
  creating,
  modalError,
  onClose,
  onCreate,
}: CreateAdminUserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password || creating) return;
    await onCreate({ name, email, password });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-admin-heading"
      onKeyDown={(e) => {
        if (e.key === "Escape" && !creating) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
    >
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          aria-label="Cerrar modal de alta de administrador"
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 p-1 rounded-lg focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-center"
            aria-hidden="true"
          >
            <UserPlus size={18} />
          </div>
          <div>
            <h3 id="create-admin-heading" className="font-semibold text-sm text-zinc-100">
              Dar de alta nuevo Administrador
            </h3>
            <p className="text-[11px] text-zinc-400">
              Tendrá acceso como Administrador secundario al panel.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="adminNameInput"
              className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1.5"
            >
              Nombre y Apellido
            </label>
            <input
              id="adminNameInput"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Sofía Herrera"
              disabled={creating}
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400"
              required
            />
          </div>

          <div>
            <label
              htmlFor="adminEmailInput"
              className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1.5"
            >
              Correo Electrónico
            </label>
            <input
              id="adminEmailInput"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sofia@aurastudio.com"
              disabled={creating}
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400"
              required
            />
          </div>

          <div>
            <label
              htmlFor="adminPasswordInput"
              className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1.5"
            >
              Contraseña Inicial (mínimo 8 caracteres)
            </label>
            <div className="relative flex items-center">
              <input
                id="adminPasswordInput"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                disabled={creating}
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={creating}
                aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                className="absolute right-2.5 p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff size={15} aria-hidden="true" />
                ) : (
                  <Eye size={15} aria-hidden="true" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">
              Se almacenará hasheada con PBKDF2-HMAC-SHA512 (100.000 iteraciones y salt único).
            </p>
          </div>

          {modalError && (
            <div
              role="alert"
              className="p-2.5 rounded-xl border bg-red-950/40 border-red-800 text-red-200 text-xs"
            >
              {modalError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating || !name.trim() || !email.trim() || password.length < 8}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-200 text-zinc-950 hover:bg-amber-100 active:scale-[0.98] transition-all flex items-center gap-1.5 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            >
              {creating ? (
                <>
                  <Loader2 size={13} className="animate-spin" aria-hidden="true" />
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
  );
}

