"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type BlockedTimeSlotSummary = {
  id: string;
  title: string;
  reason?: string;
  startsAt: string;
  startsAtIso: string;
  endsAtIso: string;
};

type AvailabilityRuleSummary = {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotStepMin: number;
  isActive: boolean;
};

type TenantAgendaPanelProps = {
  tenantSlug: string;
  availabilityRules: AvailabilityRuleSummary[];
  blockedTimeSlots: BlockedTimeSlotSummary[];
  providers: Array<{
    id: string;
    name: string;
    isActive: boolean;
  }>;
};

const dayOptions = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miercoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sabado" },
  { value: 0, label: "Domingo" },
];

const slotStepOptions = [
  { value: 15, label: "Cada 15 min" },
  { value: 20, label: "Cada 20 min" },
  { value: 30, label: "Cada 30 min" },
  { value: 45, label: "Cada 45 min" },
  { value: 60, label: "Cada 60 min" },
];

function emptyRule(): AvailabilityRuleSummary {
  return {
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "18:00",
    slotStepMin: 30,
    isActive: true,
  };
}

function getDayLabel(dayOfWeek: number) {
  return dayOptions.find((option) => option.value === dayOfWeek)?.label ?? "Dia";
}

export function TenantAgendaPanel({
  tenantSlug,
  availabilityRules,
  blockedTimeSlots,
  providers,
}: TenantAgendaPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [title, setTitle] = useState("Bloqueo interno");
  const [reason, setReason] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [rules, setRules] = useState<AvailabilityRuleSummary[]>(
    availabilityRules.length > 0 ? availabilityRules : [emptyRule()],
  );

  useEffect(() => {
    setRules(availabilityRules.length > 0 ? availabilityRules : [emptyRule()]);
  }, [availabilityRules]);

  const activeRules = rules.filter((rule) => rule.isActive);
  const activeDaysCount = new Set(activeRules.map((rule) => rule.dayOfWeek)).size;
  const activeProviders = providers.filter((provider) => provider.isActive).length;
  const nextBlockedTimeSlot = blockedTimeSlots[0];

  const orderedRulePreview = useMemo(
    () =>
      [...activeRules]
        .sort((left, right) => left.dayOfWeek - right.dayOfWeek || left.startTime.localeCompare(right.startTime))
        .slice(0, 4),
    [activeRules],
  );

  async function saveAvailabilityRules() {
    setScheduleError(null);

    try {
      const response = await fetch("/api/availability", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantSlug,
          rules,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setScheduleError(result.error ?? "No se pudo guardar el horario.");
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setScheduleError("No se pudo guardar el horario.");
    }
  }

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

  function updateRule(index: number, patch: Partial<AvailabilityRuleSummary>) {
    setRules((current) =>
      current.map((rule, ruleIndex) => (ruleIndex === index ? { ...rule, ...patch } : rule)),
    );
  }

  function removeRule(index: number) {
    setRules((current) => (current.length === 1 ? [emptyRule()] : current.filter((_, ruleIndex) => ruleIndex !== index)));
  }

  return (
    <section className="dashboard-section">
      <div className="dashboard-section-header">
        <div>
          <h2>Agenda profesional</h2>
          <p className="muted">
            Define los horarios de atencion, organiza bloqueos y deja la agenda lista para operar sin ruido.
          </p>
        </div>
      </div>

      <section className="dashboard-split-grid">
        <article className="panel dashboard-main-card dashboard-compact-card">
          <div className="dashboard-section-header">
            <div>
              <h2>Horario laboral</h2>
              <p className="muted">Dias activos, franjas configuradas y ritmo de publicacion de slots.</p>
            </div>
          </div>
          <div className="dashboard-agenda-metrics">
            <div className="dashboard-agenda-metric">
              <span className="dashboard-detail-label">Dias con agenda</span>
              <strong>{activeDaysCount}</strong>
              <p className="muted">Se muestran solo los dias con atencion activa.</p>
            </div>
            <div className="dashboard-agenda-metric">
              <span className="dashboard-detail-label">Franjas activas</span>
              <strong>{activeRules.length}</strong>
              <p className="muted">Cada franja define horas visibles para reservar.</p>
            </div>
            <div className="dashboard-agenda-metric">
              <span className="dashboard-detail-label">Prestadores disponibles</span>
              <strong>{activeProviders}</strong>
              <p className="muted">Profesionales hoy listos para tomar agenda.</p>
            </div>
          </div>
        </article>

        <article className="panel dashboard-side-card dashboard-compact-card">
          <div className="dashboard-section-header">
            <div>
              <h2>Resumen de agenda</h2>
              <p className="muted">Un vistazo rapido para saber como esta configurada la semana.</p>
            </div>
          </div>
          <div className="dashboard-summary-list">
            <div className="dashboard-summary-row">
              <span className="muted">Bloqueos activos</span>
              <strong>{blockedTimeSlots.length}</strong>
            </div>
            <div className="dashboard-summary-row">
              <span className="muted">Primer horario visible</span>
              <strong>
                {orderedRulePreview[0]
                  ? `${getDayLabel(orderedRulePreview[0].dayOfWeek)} ${orderedRulePreview[0].startTime}`
                  : "Sin configurar"}
              </strong>
            </div>
            <div className="dashboard-summary-row">
              <span className="muted">Siguiente bloqueo</span>
              <strong>{nextBlockedTimeSlot ? nextBlockedTimeSlot.startsAt : "Sin bloqueos"}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-split-grid">
        <article className="panel dashboard-main-card">
          <div className="dashboard-section-header">
            <div>
              <h2>Modificar horario</h2>
              <p className="muted">
                Ajusta dias, rangos y frecuencia de slots para definir exactamente cuando se puede reservar.
              </p>
            </div>
            <button
              className="button secondary"
              onClick={() => setRules((current) => [...current, emptyRule()])}
              type="button"
            >
              Agregar franja
            </button>
          </div>

          <div className="dashboard-schedule-list">
            {rules.map((rule, index) => (
              <div className="dashboard-schedule-item" key={rule.id ?? `new-${index}`}>
                <div className="dashboard-schedule-row">
                  <label className="dashboard-field">
                    <span className="dashboard-detail-label">Dia</span>
                    <select
                      className="dashboard-modal-input"
                      onChange={(event) =>
                        updateRule(index, { dayOfWeek: Number(event.target.value) })
                      }
                      value={rule.dayOfWeek}
                    >
                      {dayOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="dashboard-field">
                    <span className="dashboard-detail-label">Desde</span>
                    <input
                      className="dashboard-modal-input"
                      onChange={(event) => updateRule(index, { startTime: event.target.value })}
                      type="time"
                      value={rule.startTime}
                    />
                  </label>

                  <label className="dashboard-field">
                    <span className="dashboard-detail-label">Hasta</span>
                    <input
                      className="dashboard-modal-input"
                      onChange={(event) => updateRule(index, { endTime: event.target.value })}
                      type="time"
                      value={rule.endTime}
                    />
                  </label>

                  <label className="dashboard-field">
                    <span className="dashboard-detail-label">Intervalo</span>
                    <select
                      className="dashboard-modal-input"
                      onChange={(event) =>
                        updateRule(index, { slotStepMin: Number(event.target.value) })
                      }
                      value={rule.slotStepMin}
                    >
                      {slotStepOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="dashboard-schedule-actions">
                  <label className="dashboard-toggle">
                    <input
                      checked={rule.isActive}
                      onChange={(event) => updateRule(index, { isActive: event.target.checked })}
                      type="checkbox"
                    />
                    <span>{rule.isActive ? "Visible para reservar" : "Pausado"}</span>
                  </label>

                  <button
                    className="button secondary"
                    onClick={() => removeRule(index)}
                    type="button"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {scheduleError ? <p className="form-error">{scheduleError}</p> : null}
          <div className="dashboard-modal-actions">
            <button className="button primary" disabled={isPending || rules.length === 0} onClick={saveAvailabilityRules} type="button">
              Guardar horario
            </button>
          </div>
        </article>

        <article className="panel dashboard-side-card">
          <div className="dashboard-section-header">
            <div>
              <h2>Semana visible</h2>
              <p className="muted">Asi queda resumida la disponibilidad principal del profesional.</p>
            </div>
          </div>
          <div className="dashboard-block-list">
            {orderedRulePreview.length > 0 ? (
              orderedRulePreview.map((rule, index) => (
                <div className="dashboard-block-item dashboard-schedule-preview-item" key={`${rule.id ?? index}-preview`}>
                  <div>
                    <strong>{getDayLabel(rule.dayOfWeek)}</strong>
                    <div className="muted">
                      {rule.startTime} a {rule.endTime}
                    </div>
                  </div>
                  <span className={`badge ${rule.isActive ? "approved" : "pending"}`}>
                    {rule.slotStepMin} min
                  </span>
                </div>
              ))
            ) : (
              <div className="dashboard-calendar-empty">Todavia no hay horarios activos.</div>
            )}
          </div>
        </article>
      </section>

      <section className="dashboard-split-grid">
        <article className="panel dashboard-main-card">
          <div className="dashboard-section-header">
            <div>
              <h2>Agregar bloqueos de horario</h2>
              <p className="muted">
                Bloquea pausas internas, feriados, ausencias o cierres puntuales para que no entren reservas.
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
              <p className="muted">Cada bloqueo se refleja sobre la agenda publica y la operativa interna.</p>
            </div>
          </div>
          <div className="dashboard-block-list">
            {blockedTimeSlots.length > 0 ? (
              blockedTimeSlots.map((blockedTimeSlot) => (
                <div className="dashboard-block-item" key={blockedTimeSlot.id}>
                  <div>
                    <strong>{blockedTimeSlot.title}</strong>
                    <div className="muted">{blockedTimeSlot.startsAt}</div>
                    {blockedTimeSlot.reason ? <div className="muted">{blockedTimeSlot.reason}</div> : null}
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
