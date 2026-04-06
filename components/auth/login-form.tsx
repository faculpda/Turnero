"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LoginFormProps = {
  title: string;
  description: string;
  redirectTo: string;
  tenantSlug?: string;
  allowedRole?: "SUPER_ADMIN" | "TENANT_ADMIN" | "STAFF" | "CUSTOMER";
  defaultEmail?: string;
};

export function LoginForm({
  title,
  description,
  redirectTo,
  tenantSlug,
  allowedRole,
  defaultEmail,
}: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        redirectTo,
        tenantSlug,
        allowedRole,
      }),
    });

    const payload = (await response.json()) as { error?: string; ok?: boolean; redirectTo?: string };

    if (!response.ok || !payload.ok) {
      setError(payload.error ?? "No se pudo iniciar sesion.");
      setIsLoading(false);
      return;
    }

    router.push(payload.redirectTo ?? redirectTo);
    router.refresh();
  }

  return (
    <section className="panel auth-panel">
      <span className="eyebrow">Acceso</span>
      <h1>{title}</h1>
      <p className="muted">{description}</p>

      <form className="auth-form" onSubmit={onSubmit}>
        <label className="field">
          <span>Email</span>
          <input
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>

        <label className="field">
          <span>Contrasena</span>
          <input
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button className="button primary" disabled={isLoading} type="submit">
          {isLoading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </section>
  );
}
