"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AddServiceFormProps = {
  tenantSlug: string;
};

export function AddServiceForm({ tenantSlug }: AddServiceFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMin, setDurationMin] = useState("30");
  const [pricePesos, setPricePesos] = useState("25000");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    const response = await fetch("/api/services", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tenantSlug,
        title,
        description,
        durationMin,
        pricePesos,
      }),
    });

    const payload = (await response.json()) as { ok?: boolean; error?: string };

    if (!response.ok || !payload.ok) {
      setError(payload.error ?? "No se pudo crear el servicio.");
      setIsSaving(false);
      return;
    }

    setTitle("");
    setDescription("");
    setDurationMin("30");
    setPricePesos("25000");
    setIsOpen(false);
    setIsSaving(false);
    router.refresh();
  }

  return (
    <div className="service-admin">
      <button className="button secondary" onClick={() => setIsOpen((value) => !value)} type="button">
        {isOpen ? "Cerrar" : "Agregar servicio"}
      </button>

      {isOpen ? (
        <form className="panel service-form" onSubmit={onSubmit}>
          <div className="service-form-grid">
            <div className="panel subtle-panel field-wide">
              <strong>Cobro online del servicio</strong>
              <p className="muted">
                Si el tenant tiene Mercado Pago activo y este servicio tiene un valor mayor a
                cero, el cliente sera redirigido al checkout para pagar al reservar.
              </p>
            </div>

            <label className="field">
              <span>Titulo</span>
              <input
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ej: Consulta inicial"
                required
                type="text"
                value={title}
              />
            </label>

            <label className="field">
              <span>Tiempo del servicio</span>
              <input
                min="5"
                onChange={(event) => setDurationMin(event.target.value)}
                required
                type="number"
                value={durationMin}
              />
            </label>

            <label className="field">
              <span>Valor en pesos</span>
              <input
                min="0"
                onChange={(event) => setPricePesos(event.target.value)}
                required
                step="1"
                type="number"
                value={pricePesos}
              />
            </label>

            <label className="field field-wide">
              <span>Descripcion</span>
              <textarea
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe brevemente en que consiste este servicio."
                rows={4}
                value={description}
              />
            </label>
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="actions">
            <button className="button primary" disabled={isSaving} type="submit">
              {isSaving ? "Guardando..." : "Guardar servicio"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
