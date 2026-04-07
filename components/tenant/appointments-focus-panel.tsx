"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AppointmentSummary } from "@/lib/types";

type AppointmentsFocusPanelProps = {
  appointments: AppointmentSummary[];
  tenantSlug: string;
};

type AppointmentFilter = "ALL" | "CONFIRMED" | "PENDING";
type MutableAppointmentStatus = "COMPLETED" | "CANCELLED";

type CalendarDay = {
  key: string;
  label: string;
  dateNumber: string;
  isToday: boolean;
  appointments: AppointmentSummary[];
};

const estadoTurnoLabel: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Completado",
  NO_SHOW: "No asistio",
};

const estadoPagoLabel: Record<string, string> = {
  NOT_REQUIRED: "Sin cobro online",
  PENDING: "Pendiente",
  APPROVED: "Abonado",
  REJECTED: "Rechazado",
  CANCELLED: "Cancelado",
};

const filterLabels: Record<AppointmentFilter, string> = {
  ALL: "Todos",
  CONFIRMED: "Confirmados",
  PENDING: "Pendientes",
};

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date) {
  const next = startOfDay(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(next, diff);
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
  }).format(date);
}

function formatDayNumber(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function formatHour(dateIso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateIso));
}

function formatWeekRange(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6);
  const formatter = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
  });

  return `${formatter.format(weekStart)} al ${formatter.format(weekEnd)}`;
}

function toDateTimeLocalValue(dateIso: string) {
  const date = new Date(dateIso);
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function AppointmentsFocusPanel({
  appointments,
  tenantSlug,
}: AppointmentsFocusPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [rescheduleDraft, setRescheduleDraft] = useState("");

  const turnosActivos = useMemo(
    () =>
      appointments
        .filter(
          (appointment) =>
            appointment.status === "PENDING" || appointment.status === "CONFIRMED",
        )
        .sort(
          (left, right) =>
            new Date(left.startsAtIso).getTime() - new Date(right.startsAtIso).getTime(),
        ),
    [appointments],
  );

  const referencia = turnosActivos[0]
    ? startOfDay(new Date(turnosActivos[0].startsAtIso))
    : startOfDay(new Date());

  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(referencia));
  const [filter, setFilter] = useState<AppointmentFilter>("ALL");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | undefined>();

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  }, [weekStart]);

  const filteredAppointments = useMemo(() => {
    if (filter === "ALL") {
      return turnosActivos;
    }

    return turnosActivos.filter((appointment) => appointment.status === filter);
  }, [filter, turnosActivos]);

  const calendarDays = useMemo<CalendarDay[]>(() => {
    return weekDays.map((day) => {
      const appointmentsForDay = filteredAppointments.filter((appointment) =>
        sameDay(new Date(appointment.startsAtIso), day),
      );

      return {
        key: day.toISOString(),
        label: formatDayLabel(day),
        dateNumber: formatDayNumber(day),
        isToday: sameDay(day, new Date()),
        appointments: appointmentsForDay,
      };
    });
  }, [filteredAppointments, weekDays]);

  const selectedAppointment = turnosActivos.find(
    (appointment) => appointment.id === selectedAppointmentId,
  );

  useEffect(() => {
    if (!selectedAppointment) {
      setNotesDraft("");
      setRescheduleDraft("");
      return;
    }

    setNotesDraft(selectedAppointment.notes ?? "");
    setRescheduleDraft(toDateTimeLocalValue(selectedAppointment.startsAtIso));
  }, [selectedAppointment]);

  const confirmedAppointments = turnosActivos.filter(
    (appointment) => appointment.status === "CONFIRMED",
  );
  const pendingAppointments = turnosActivos.filter(
    (appointment) => appointment.status === "PENDING",
  );
  const paidAppointments = turnosActivos.filter(
    (appointment) => appointment.paymentStatus === "APPROVED",
  );

  async function submitAppointmentChanges(payload: {
    status?: MutableAppointmentStatus;
    startsAt?: string;
    notes?: string;
  }) {
    if (!selectedAppointment) {
      return;
    }

    setError(null);

    try {
      const response = await fetch("/api/appointments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantSlug,
          appointmentId: selectedAppointment.id,
          ...payload,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "No se pudo actualizar el turno.");
        return;
      }

      startTransition(() => {
        setSelectedAppointmentId(undefined);
        router.refresh();
      });
    } catch {
      setError("No se pudo actualizar el turno.");
    }
  }

  async function updateAppointmentStatus(status: MutableAppointmentStatus) {
    await submitAppointmentChanges({ status });
  }

  async function saveNotes() {
    await submitAppointmentChanges({ notes: notesDraft });
  }

  async function rescheduleAppointment() {
    if (!rescheduleDraft) {
      setError("Debes elegir una fecha y hora para reprogramar.");
      return;
    }

    await submitAppointmentChanges({
      startsAt: new Date(rescheduleDraft).toISOString(),
      notes: notesDraft,
    });
  }

  if (turnosActivos.length === 0) {
    return (
      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>Calendario de turnos</h2>
            <p className="muted">
              Aqui apareceran los turnos confirmados y pendientes en formato calendario.
            </p>
          </div>
        </div>
        <article className="panel dashboard-turnos-card">
          <div className="dashboard-empty-state">
            <strong>No hay turnos pendientes ni confirmados.</strong>
            <p className="muted">
              Cuando entren nuevas reservas se van a organizar por dia para que puedas operarlas
              desde esta agenda.
            </p>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="dashboard-section">
      <div className="dashboard-section-header">
        <div>
          <h2>Calendario de turnos</h2>
          <p className="muted">
            Inspirado en dashboards de agenda profesional: filtros rapidos, vista semanal y una
            ventana de detalle para operar cada turno.
          </p>
        </div>
      </div>

      <div className="dashboard-kpi-grid dashboard-turnos-kpi-grid">
        <article className="metric dashboard-kpi-card dashboard-kpi-card-highlight dashboard-kpi-card-violet">
          <span className="dashboard-kpi-label">Turnos activos</span>
          <h2>{turnosActivos.length}</h2>
          <p className="muted">Confirmados y pendientes visibles en la agenda principal.</p>
        </article>
        <article className="metric dashboard-kpi-card dashboard-kpi-card-blue">
          <span className="dashboard-kpi-label">Confirmados</span>
          <h2>{confirmedAppointments.length}</h2>
          <p className="muted">Reservas listas para atender hoy y en la semana.</p>
        </article>
        <article className="metric dashboard-kpi-card dashboard-kpi-card-amber">
          <span className="dashboard-kpi-label">Pagos aprobados</span>
          <h2>{paidAppointments.length}</h2>
          <p className="muted">Turnos que ya tienen el cobro resuelto.</p>
        </article>
      </div>

      <article className="panel dashboard-calendar-shell">
        <div className="dashboard-calendar-toolbar">
          <div className="dashboard-calendar-week">
            <strong>{formatWeekRange(weekStart)}</strong>
            <span className="muted">Vista semanal para gestionar reservas activas.</span>
          </div>

          <div className="dashboard-calendar-toolbar-actions">
            <div className="dashboard-filter-group" role="tablist" aria-label="Filtrar turnos">
              {(["ALL", "CONFIRMED", "PENDING"] as AppointmentFilter[]).map((option) => (
                <button
                  key={option}
                  className={`dashboard-filter-chip ${filter === option ? "active" : ""}`}
                  onClick={() => setFilter(option)}
                  type="button"
                >
                  {filterLabels[option]}
                </button>
              ))}
            </div>

            <div className="dashboard-week-nav">
              <button onClick={() => setWeekStart((current) => addDays(current, -7))} type="button">
                Semana anterior
              </button>
              <button onClick={() => setWeekStart(startOfWeek(referencia))} type="button">
                Esta semana
              </button>
              <button onClick={() => setWeekStart((current) => addDays(current, 7))} type="button">
                Semana siguiente
              </button>
            </div>
          </div>
        </div>

        <div className="dashboard-calendar-grid">
          {calendarDays.map((day) => (
            <section
              key={day.key}
              className={`dashboard-calendar-day ${day.isToday ? "today" : ""}`}
            >
              <header className="dashboard-calendar-day-header">
                <div>
                  <span className="dashboard-calendar-day-label">{day.label}</span>
                  <strong>{day.dateNumber}</strong>
                </div>
                <span className="dashboard-calendar-day-count">{day.appointments.length}</span>
              </header>

              <div className="dashboard-calendar-day-body">
                {day.appointments.length > 0 ? (
                  day.appointments.map((appointment) => (
                    <button
                      key={appointment.id}
                      className={`dashboard-calendar-event ${appointment.status.toLowerCase()}`}
                      onClick={() => {
                        setError(null);
                        setSelectedAppointmentId(appointment.id);
                      }}
                      type="button"
                    >
                      <div className="dashboard-calendar-event-time">
                        {formatHour(appointment.startsAtIso)}
                      </div>
                      <div className="dashboard-calendar-event-main">
                        <strong>{appointment.customerName}</strong>
                        <span>{appointment.serviceName}</span>
                      </div>
                      <div className="dashboard-calendar-event-meta">
                        <span className={`badge ${appointment.status.toLowerCase()}`}>
                          {estadoTurnoLabel[appointment.status] ?? appointment.status}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="dashboard-calendar-empty">Sin turnos</div>
                )}
              </div>
            </section>
          ))}
        </div>
      </article>

      <article className="panel dashboard-calendar-insights">
        <div className="dashboard-calendar-insight">
          <span className="dashboard-detail-label">Pendientes</span>
          <strong>{pendingAppointments.length}</strong>
          <p className="muted">Reservas que conviene confirmar o seguir de cerca.</p>
        </div>
        <div className="dashboard-calendar-insight">
          <span className="dashboard-detail-label">Confirmados</span>
          <strong>{confirmedAppointments.length}</strong>
          <p className="muted">Turnos que ya pueden pasar directo al flujo de atencion.</p>
        </div>
        <div className="dashboard-calendar-insight">
          <span className="dashboard-detail-label">Con pago aprobado</span>
          <strong>{paidAppointments.length}</strong>
          <p className="muted">Ayuda a detectar rapido que citas ya tienen cobro resuelto.</p>
        </div>
      </article>

      {selectedAppointment ? (
        <div
          aria-modal="true"
          className="dashboard-modal-backdrop"
          role="dialog"
          onClick={() => {
            if (!isPending) {
              setSelectedAppointmentId(undefined);
              setError(null);
            }
          }}
        >
          <article
            className="panel dashboard-modal-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="dashboard-section-header">
              <div>
                <h2>{selectedAppointment.customerName}</h2>
                <p className="muted">
                  {selectedAppointment.serviceName} - {selectedAppointment.startsAt}
                </p>
              </div>
              <button
                className="dashboard-modal-close"
                onClick={() => {
                  if (!isPending) {
                    setSelectedAppointmentId(undefined);
                    setError(null);
                  }
                }}
                type="button"
              >
                Cerrar
              </button>
            </div>

            <div className="dashboard-turno-detail-grid">
              <div className="dashboard-turno-detail-block">
                <span className="dashboard-detail-label">Paciente</span>
                <strong>{selectedAppointment.customerName}</strong>
              </div>
              <div className="dashboard-turno-detail-block">
                <span className="dashboard-detail-label">Telefono</span>
                <strong>{selectedAppointment.customerPhone ?? "No informado"}</strong>
              </div>
              <div className="dashboard-turno-detail-block">
                <span className="dashboard-detail-label">Mail</span>
                <strong>{selectedAppointment.customerEmail}</strong>
              </div>
              <div className="dashboard-turno-detail-block">
                <span className="dashboard-detail-label">Servicio</span>
                <strong>{selectedAppointment.serviceName}</strong>
              </div>
              <div className="dashboard-turno-detail-block">
                <span className="dashboard-detail-label">Estado del turno</span>
                <span className={`badge ${selectedAppointment.status.toLowerCase()}`}>
                  {estadoTurnoLabel[selectedAppointment.status] ?? selectedAppointment.status}
                </span>
              </div>
              <div className="dashboard-turno-detail-block">
                <span className="dashboard-detail-label">Estado del pago</span>
                <span className={`badge ${selectedAppointment.paymentStatus.toLowerCase()}`}>
                  {estadoPagoLabel[selectedAppointment.paymentStatus] ?? selectedAppointment.paymentStatus}
                </span>
              </div>
              <div className="dashboard-turno-detail-block dashboard-turno-detail-block-wide">
                <span className="dashboard-detail-label">Observaciones</span>
                <textarea
                  className="dashboard-modal-textarea"
                  onChange={(event) => setNotesDraft(event.target.value)}
                  rows={4}
                  value={notesDraft}
                />
              </div>
              <div className="dashboard-turno-detail-block dashboard-turno-detail-block-wide">
                <span className="dashboard-detail-label">Reprogramar turno</span>
                <input
                  className="dashboard-modal-input"
                  onChange={(event) => setRescheduleDraft(event.target.value)}
                  type="datetime-local"
                  value={rescheduleDraft}
                />
              </div>
            </div>

            {error ? <p className="form-error">{error}</p> : null}

            <div className="dashboard-modal-actions">
              <button
                className="button secondary"
                disabled={isPending}
                onClick={saveNotes}
                type="button"
              >
                Guardar notas
              </button>
              <button
                className="button secondary"
                disabled={isPending}
                onClick={rescheduleAppointment}
                type="button"
              >
                Reprogramar
              </button>
              <button
                className="button secondary"
                disabled={isPending}
                onClick={() => updateAppointmentStatus("CANCELLED")}
                type="button"
              >
                Cancelar turno
              </button>
              <button
                className="button primary"
                disabled={isPending}
                onClick={() => updateAppointmentStatus("COMPLETED")}
                type="button"
              >
                Marcar como completado
              </button>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
