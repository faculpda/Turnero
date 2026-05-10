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
  clientId?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotStepMin: number;
  isActive: boolean;
};

type GeneralScheduleRule = {
  clientId: string;
  startTime: string;
  endTime: string;
  slotStepMin: number;
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
    clientId: crypto.randomUUID(),
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

function toLocalRule(rule: AvailabilityRuleSummary, index: number): AvailabilityRuleSummary {
  return {
    ...rule,
    clientId: rule.id ?? rule.clientId ?? `local-${index}-${rule.dayOfWeek}`,
  };
}

function getRuleKey(rule: AvailabilityRuleSummary) {
  return rule.id ?? rule.clientId ?? `${rule.dayOfWeek}-${rule.startTime}-${rule.endTime}`;
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
  const [generalSchedule, setGeneralSchedule] = useState<GeneralScheduleRule[]>([
    {
      clientId: crypto.randomUUID(),
      startTime: "09:00",
      endTime: "18:00",
      slotStepMin: 30,
    },
  ]);
  const [title, setTitle] = useState("Bloqueo interno");
  const [reason, setReason] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [rules, setRules] = useState<AvailabilityRuleSummary[]>(
    availabilityRules.length > 0 ? availabilityRules.map(toLocalRule) : dayOptions.map((option) => ({ ...emptyRule(), dayOfWeek: option.value })),
  );

  useEffect(() => {
    const nextRules =
      availabilityRules.length > 0
        ? availabilityRules.map(toLocalRule)
        : dayOptions.map((option) => ({ ...emptyRule(), dayOfWeek: option.value }));

    setRules(nextRules);

    const generalBase = Array.from(
      new Map(
        nextRules
          .filter((rule) => rule.isActive)
          .map((rule) => [
            `${rule.startTime}-${rule.endTime}-${rule.slotStepMin}`,
            {
              clientId: crypto.randomUUID(),
              startTime: rule.startTime,
              endTime: rule.endTime,
              slotStepMin: rule.slotStepMin,
            },
          ]),
      ).values(),
    );

    setGeneralSchedule(
      generalBase.length > 0
        ? generalBase
        : [
            {
              clientId: crypto.randomUUID(),
              startTime: "09:00",
              endTime: "18:00",
              slotStepMin: 30,
            },
          ],
    );
  }, [availabilityRules]);

  const activeRules = rules.filter((rule) => rule.isActive);
  const activeDaysCount = new Set(activeRules.map((rule) => rule.dayOfWeek)).size;
  const activeProviders = providers.filter((provider) => provider.isActive).length;
  const nextBlockedTimeSlot = blockedTimeSlots[0];

  const orderedRulePreview = useMemo(
    () =>
      [...activeRules]
        .sort((left, right) => left.dayOfWeek - right.dayOfWeek || left.startTime.localeCompare(right.startTime))
        .slice(0, 7),
    [activeRules],
  );

  const rulesByDay = useMemo(
    () =>
      dayOptions.map((day) => ({
        ...day,
        rules: rules
          .filter((rule) => rule.dayOfWeek === day.value)
          .sort((left, right) => left.startTime.localeCompare(right.startTime)),
      })),
    [rules],
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
          rules: rules.map((rule) => ({
            id: rule.id,
            dayOfWeek: rule.dayOfWeek,
            startTime: rule.startTime,
            endTime: rule.endTime,
            slotStepMin: rule.slotStepMin,
            isActive: rule.isActive,
          })),
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

  function updateRule(ruleKey: string, patch: Partial<AvailabilityRuleSummary>) {
    setRules((current) =>
      current.map((rule) => (getRuleKey(rule) === ruleKey ? { ...rule, ...patch } : rule)),
    );
  }

  function removeRule(ruleKey: string) {
    setRules((current) => {
      const nextRules = current.filter((rule) => getRuleKey(rule) !== ruleKey);
      return nextRules.length > 0 ? nextRules : dayOptions.map((option) => ({ ...emptyRule(), dayOfWeek: option.value }));
    });
  }

  function addRuleForDay(dayOfWeek: number) {
    const sourceRule = generalSchedule[0] ?? {
      startTime: "09:00",
      endTime: "18:00",
      slotStepMin: 30,
    };

    setRules((current) => [
      ...current,
      {
        clientId: crypto.randomUUID(),
        dayOfWeek,
        startTime: sourceRule.startTime,
        endTime: sourceRule.endTime,
        slotStepMin: sourceRule.slotStepMin,
        isActive: true,
      },
    ]);
  }

  function updateGeneralRule(ruleKey: string, patch: Partial<GeneralScheduleRule>) {
    setGeneralSchedule((current) =>
      current.map((rule) => (rule.clientId === ruleKey ? { ...rule, ...patch } : rule)),
    );
  }

  function addGeneralRule() {
    setGeneralSchedule((current) => [
      ...current,
      {
        clientId: crypto.randomUUID(),
        startTime: "09:00",
        endTime: "18:00",
        slotStepMin: 30,
      },
    ]);
  }

  function removeGeneralRule(ruleKey: string) {
    setGeneralSchedule((current) =>
      current.length === 1
        ? current
        : current.filter((rule) => rule.clientId !== ruleKey),
    );
  }

  function applyGeneralSchedule() {
    setRules(() =>
      dayOptions.flatMap((day) =>
        generalSchedule.map((generalRule, index) => {
          const existingRule = rules
            .filter((rule) => rule.dayOfWeek === day.value)
            [index];

          return {
            id: existingRule?.id,
            clientId: existingRule?.clientId ?? crypto.randomUUID(),
            dayOfWeek: day.value,
            startTime: generalRule.startTime,
            endTime: generalRule.endTime,
            slotStepMin: generalRule.slotStepMin,
            isActive: true,
          };
        }),
      ),
    );
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

      <div className="dashboard-guided-steps">
        <article className="dashboard-guided-step">
          <span className="dashboard-detail-label">Paso 1</span>
          <strong>Define el horario general</strong>
          <p className="muted">Carga una base comun para la semana y despues ajusta casos puntuales.</p>
        </article>
        <article className="dashboard-guided-step">
          <span className="dashboard-detail-label">Paso 2</span>
          <strong>Corrige dia por dia si hace falta</strong>
          <p className="muted">Puedes agregar o quitar franjas individuales sin rehacer toda la agenda.</p>
        </article>
        <article className="dashboard-guided-step">
          <span className="dashboard-detail-label">Paso 3</span>
          <strong>Guarda y agrega bloqueos</strong>
          <p className="muted">Al final revisa pausas, ausencias o feriados para no mostrar horarios incorrectos.</p>
        </article>
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
        <article className="panel dashboard-main-card dashboard-schedule-editor-card">
          <div className="dashboard-section-header">
            <div>
              <h2>Modificar horario</h2>
              <p className="muted">
                Define un horario general para toda la semana y luego ajusta cada dia solo si hace falta.
              </p>
            </div>
          </div>

          <div className="dashboard-schedule-general-card">
            <div className="dashboard-section-header">
              <div>
                <h2>Horario general</h2>
                <p className="muted">Aplica una base comun a toda la semana y luego personaliza dias puntuales.</p>
              </div>
              <div className="dashboard-inline-actions">
                <button className="button secondary" onClick={addGeneralRule} type="button">
                  Agregar franja
                </button>
                <button className="button secondary" onClick={applyGeneralSchedule} type="button">
                  Aplicar a toda la semana
                </button>
              </div>
            </div>

            <div className="dashboard-schedule-general-list">
              {generalSchedule.map((generalRule) => (
                <div className="dashboard-schedule-item dashboard-schedule-item-general" key={generalRule.clientId}>
                  <div className="dashboard-schedule-row dashboard-schedule-row-general">
                    <label className="dashboard-field">
                      <span className="dashboard-detail-label">Desde</span>
                      <input
                        className="dashboard-modal-input"
                        onChange={(event) =>
                          updateGeneralRule(generalRule.clientId, { startTime: event.target.value })
                        }
                        type="time"
                        value={generalRule.startTime}
                      />
                    </label>

                    <label className="dashboard-field">
                      <span className="dashboard-detail-label">Hasta</span>
                      <input
                        className="dashboard-modal-input"
                        onChange={(event) =>
                          updateGeneralRule(generalRule.clientId, { endTime: event.target.value })
                        }
                        type="time"
                        value={generalRule.endTime}
                      />
                    </label>

                    <label className="dashboard-field">
                      <span className="dashboard-detail-label">Intervalo</span>
                      <select
                        className="dashboard-modal-input"
                        onChange={(event) =>
                          updateGeneralRule(generalRule.clientId, {
                            slotStepMin: Number(event.target.value),
                          })
                        }
                        value={generalRule.slotStepMin}
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
                    <div className="muted">Esta franja se copiara a todos los dias al aplicar el horario general.</div>
                    <button
                      className="button secondary"
                      disabled={generalSchedule.length === 1}
                      onClick={() => removeGeneralRule(generalRule.clientId)}
                      type="button"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-schedule-week-grid">
            {rulesByDay.map((day) => (
              <div className="dashboard-schedule-day-card" key={day.value}>
                <div className="dashboard-schedule-day-header">
                  <div>
                    <span className="dashboard-detail-label">Semana completa</span>
                    <strong>{day.label}</strong>
                  </div>
                  <button
                    className="button secondary"
                    onClick={() => addRuleForDay(day.value)}
                    type="button"
                  >
                    Agregar franja
                  </button>
                </div>

                <div className="dashboard-schedule-day-list">
                  {day.rules.length > 0 ? (
                    day.rules.map((rule) => {
                      const ruleKey = getRuleKey(rule);

                      return (
                        <div className="dashboard-schedule-item dashboard-schedule-item-day" key={ruleKey}>
                          <div className="dashboard-schedule-row dashboard-schedule-row-compact">
                            <label className="dashboard-field">
                              <span className="dashboard-detail-label">Desde</span>
                              <input
                                className="dashboard-modal-input"
                                onChange={(event) =>
                                  updateRule(ruleKey, { startTime: event.target.value })
                                }
                                type="time"
                                value={rule.startTime}
                              />
                            </label>

                            <label className="dashboard-field">
                              <span className="dashboard-detail-label">Hasta</span>
                              <input
                                className="dashboard-modal-input"
                                onChange={(event) =>
                                  updateRule(ruleKey, { endTime: event.target.value })
                                }
                                type="time"
                                value={rule.endTime}
                              />
                            </label>

                            <label className="dashboard-field">
                              <span className="dashboard-detail-label">Intervalo</span>
                              <select
                                className="dashboard-modal-input"
                                onChange={(event) =>
                                  updateRule(ruleKey, {
                                    slotStepMin: Number(event.target.value),
                                  })
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
                                onChange={(event) =>
                                  updateRule(ruleKey, { isActive: event.target.checked })
                                }
                                type="checkbox"
                              />
                              <span>{rule.isActive ? "Visible para reservar" : "Pausado"}</span>
                            </label>

                            <button
                              className="button secondary"
                              onClick={() => removeRule(ruleKey)}
                              type="button"
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="dashboard-calendar-empty">Sin horario cargado para este dia.</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {scheduleError ? <p className="form-error">{scheduleError}</p> : null}
          <div className="dashboard-schedule-footer">
            <div className="muted">
              Guarda cuando termines de ajustar el horario general o las excepciones por dia.
            </div>
            <div className="dashboard-modal-actions">
              <button
                className="button primary"
                disabled={isPending || rules.length === 0}
                onClick={saveAvailabilityRules}
                type="button"
              >
                Guardar horario
              </button>
            </div>
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
