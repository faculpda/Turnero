"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type BlockedTimeSlotSummary = {
  id: string;
  title: string;
  reason?: string;
  startsAt: string;
  startsAtIso: string;
  endsAtIso: string;
};

type TenantAgendaPanelProps = {
  tenantSlug: string;
  onlinePaymentEnabled: boolean;
  onlinePaymentServices: number;
  pagosPendientes: number;
  services: Array<{
    id: string;
    name: string;
    description?: string;
    durationMin: number;
    priceLabel: string;
    priceCents?: number | null;
    images?: Array<{
      id: string;
      url: string;
      altText?: string;
    }>;
  }>;
  blockedTimeSlots: BlockedTimeSlotSummary[];
};

function toDateTimeLocalValue(dateIso: string) {
  const date = new Date(dateIso);
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function TenantAgendaPanel({
  tenantSlug,
  onlinePaymentEnabled,
  onlinePaymentServices,
  pagosPendientes,
  services,
  blockedTimeSlots,
}: TenantAgendaPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("Bloqueo interno");
  const [reason, setReason] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  async function createBlockedTimeSlot() {
    setError(null);

    try {
      const response = await fetch("/api/blocked-time-slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantSlug,
          title,
          reason,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "No se pudo crear el bloqueo.");
        return;
      }

      startTransition(() => {
        setReason("");
        setStartsAt("");
        setEndsAt("");
        router.refresh();
      });
    } catch {
      setError("No se pudo crear el bloqueo.");
    }
  }

  async function deleteBlockedTimeSlot(blockedTimeSlotId: string) {
    setError(null);

    try {
      const response = await fetch("/api/blocked-time-slots", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantSlug,
          blockedTimeSlotId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "No se pudo eliminar el bloqueo.");
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("No se pudo eliminar el bloqueo.");
    }
  }

  return (
    <section className="dashboard-section">
      <div className="dashboard-section-header">
        <div>
          <h2>Agenda y operacion</h2>
          <p className="muted">
            Controla lo que ve el cliente y bloquea horarios por pausas, feriados o ausencias.
          </p>
        </div>
      </div>

      <section className="dashboard-split-grid">
        <article className="panel dashboard-main-card">
          <div className="dashboard-section-header">
            <div>
              <h2>Servicios visibles</h2>
              <p className="muted">Asi se ve hoy la oferta principal del negocio.</p>
            </div>
          </div>
          <div className="service-list dashboard-service-preview-list">
            {services.map((service) => (
              <div className="service-chip dashboard-service-preview-card" key={service.id}>
                {service.images?.[0] ? (
                  <img
                    alt={service.images[0].altText ?? service.name}
                    className="service-inline-image"
                    src={service.images[0].url}
                  />
                ) : null}
                <div className="service-chip-header">
                  <strong>{service.name}</strong>
                  <span
                    className={`badge ${
                      onlinePaymentEnabled && (service.priceCents ?? 0) > 0 ? "approved" : "pending"
                    }`}
                  >
                    {onlinePaymentEnabled && (service.priceCents ?? 0) > 0
                      ? "Pago online"
                      : "Reserva sin cobro"}
                  </span>
                </div>
                {service.description ? (
                  <div className="muted service-description">{service.description}</div>
                ) : null}
                <div className="muted">
                  {service.durationMin} min - {service.priceLabel}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel dashboard-side-card">
          <div className="dashboard-section-header">
            <div>
              <h2>Lo que ve el cliente</h2>
              <p className="muted">
                Los servicios, bloqueos y pagos impactan directamente en la experiencia publica.
              </p>
            </div>
          </div>
          <div className="dashboard-summary-list">
            <div className="dashboard-summary-row">
              <span className="muted">Web publica</span>
              <strong>Actualizada</strong>
            </div>
            <div className="dashboard-summary-row">
              <span className="muted">Cobro online</span>
              <strong>{onlinePaymentEnabled ? "Visible" : "No visible"}</strong>
            </div>
            <div className="dashboard-summary-row">
              <span className="muted">Servicios con pago online</span>
              <strong>{onlinePaymentServices}</strong>
            </div>
            <div className="dashboard-summary-row">
              <span className="muted">Pagos pendientes</span>
              <strong>{pagosPendientes}</strong>
            </div>
            <div className="dashboard-summary-row">
              <span className="muted">Bloqueos activos</span>
              <strong>{blockedTimeSlots.length}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-split-grid">
        <article className="panel dashboard-main-card">
          <div className="dashboard-section-header">
            <div>
              <h2>Bloquear horarios</h2>
              <p className="muted">
                Evita reservas durante pausas internas, feriados, ausencias o cierres puntuales.
              </p>
            </div>
          </div>

          <div className="dashboard-block-form">
            <input
              className="dashboard-modal-input"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Titulo del bloqueo"
              value={title}
            />
            <input
              className="dashboard-modal-input"
              onChange={(event) => setStartsAt(event.target.value)}
              type="datetime-local"
              value={startsAt}
            />
            <input
              className="dashboard-modal-input"
              onChange={(event) => setEndsAt(event.target.value)}
              type="datetime-local"
              value={endsAt}
            />
            <textarea
              className="dashboard-modal-textarea"
              onChange={(event) => setReason(event.target.value)}
              placeholder="Motivo opcional"
              rows={3}
              value={reason}
            />
            {error ? <p className="form-error">{error}</p> : null}
            <div className="dashboard-modal-actions">
              <button
                className="button primary"
                disabled={isPending || !startsAt || !endsAt || !title.trim()}
                onClick={createBlockedTimeSlot}
                type="button"
              >
                Guardar bloqueo
              </button>
            </div>
          </div>
        </article>

        <article className="panel dashboard-side-card">
          <div className="dashboard-section-header">
            <div>
              <h2>Bloqueos actuales</h2>
              <p className="muted">Cada bloqueo ocultara esos horarios de la reserva publica.</p>
            </div>
          </div>
          <div className="dashboard-block-list">
            {blockedTimeSlots.length > 0 ? (
              blockedTimeSlots.map((blockedTimeSlot) => (
                <div className="dashboard-block-item" key={blockedTimeSlot.id}>
                  <div>
                    <strong>{blockedTimeSlot.title}</strong>
                    <div className="muted">{blockedTimeSlot.startsAt}</div>
                    {blockedTimeSlot.reason ? (
                      <div className="muted">{blockedTimeSlot.reason}</div>
                    ) : null}
                  </div>
                  <button
                    className="button secondary"
                    disabled={isPending}
                    onClick={() => deleteBlockedTimeSlot(blockedTimeSlot.id)}
                    type="button"
                  >
                    Quitar
                  </button>
                </div>
              ))
            ) : (
              <div className="dashboard-calendar-empty">No hay bloqueos cargados.</div>
            )}
          </div>
        </article>
      </section>
    </section>
  );
}
