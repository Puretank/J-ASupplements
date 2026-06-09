"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function login(e) {
    e.preventDefault();
    
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      setError("Contraseña incorrecta");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-900">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-800 p-8">
        <h1 className="mb-2 font-display text-2xl font-bold text-white">
          Acceso Admin
        </h1>
        <p className="mb-6 text-gray-400">
          Ingresa tu contraseña para acceder al panel de administración
        </p>

        <form onSubmit={login}>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-input w-full"
              placeholder="••••••••"
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="admin-btn-primary w-full"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
