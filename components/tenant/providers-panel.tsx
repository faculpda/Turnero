"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ProvidersPanelProps = {
  tenantSlug: string;
  providers: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    color?: string;
    isActive: boolean;
  }>;
};

export function ProvidersPanel({ tenantSlug, providers }: ProvidersPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [color, setColor] = useState("#5d3fd3");

  async function createProvider() {
    setError(null);

    try {
      const response = await fetch("/api/providers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantSlug,
          name,
          email,
          phone,
          color,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "No se pudo crear el prestador.");
        return;
      }

      startTransition(() => {
        setName("");
        setEmail("");
        setPhone("");
        setColor("#5d3fd3");
        router.refresh();
      });
    } catch {
      setError("No se pudo crear el prestador.");
    }
  }

  return (
    <section className="dashboard-section">
      <div className="dashboard-section-header">
        <div>
          <h2>Prestadores</h2>
          <p className="muted">
            Gestiona los profesionales del tenant para asignarlos a cada turno.
          </p>
        </div>
      </div>

      <section className="dashboard-split-grid">
        <article className="panel dashboard-main-card dashboard-hierarchy-shell">
          <div className="dashboard-section-header">
            <div>
              <h2>Agregar prestador</h2>
              <p className="muted">
                Crea prestadores para filtrar la agenda y organizar turnos por profesional.
              </p>
            </div>
          </div>

          <div className="dashboard-block-form dashboard-hierarchy-subpanel">
            <input
              className="dashboard-modal-input"
              onChange={(event) => setName(event.target.value)}
              placeholder="Nombre del prestador"
              value={name}
            />
            <input
              className="dashboard-modal-input"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="mail@ejemplo.com"
              value={email}
            />
            <input
              className="dashboard-modal-input"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Telefono"
              value={phone}
            />
            <input
              className="dashboard-modal-input"
              onChange={(event) => setColor(event.target.value)}
              type="color"
              value={color}
            />
            {error ? <p className="form-error">{error}</p> : null}
            <div className="dashboard-modal-actions">
              <button
                className="button primary"
                disabled={isPending || !name.trim()}
                onClick={createProvider}
                type="button"
              >
                Guardar prestador
              </button>
            </div>
          </div>
        </article>

        <article className="panel dashboard-side-card dashboard-hierarchy-shell dashboard-hierarchy-shell-soft">
          <div className="dashboard-section-header">
            <div>
              <h2>Prestadores activos</h2>
              <p className="muted">Apareceran disponibles para asignar en la agenda.</p>
            </div>
          </div>
          <div className="dashboard-block-list">
            {providers.length > 0 ? (
              providers.map((provider) => (
                <div className="dashboard-provider-item dashboard-hierarchy-item" key={provider.id}>
                  <div className="dashboard-provider-identity">
                    <span
                      className="dashboard-provider-dot"
                      style={{ backgroundColor: provider.color ?? "#5d3fd3" }}
                    />
                    <div>
                      <strong>{provider.name}</strong>
                      {provider.email ? <div className="muted">{provider.email}</div> : null}
                      {provider.phone ? <div className="muted">{provider.phone}</div> : null}
                    </div>
                  </div>
                  <span className={`badge ${provider.isActive ? "approved" : "pending"}`}>
                    {provider.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>
              ))
            ) : (
              <div className="dashboard-calendar-empty">Aun no hay prestadores cargados.</div>
            )}
          </div>
        </article>
      </section>
    </section>
  );
}
