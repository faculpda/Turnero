"use client";

import { useMemo, useState } from "react";
import type { AppointmentSummary } from "@/lib/types";

type AppointmentsFocusPanelProps = {
  appointments: AppointmentSummary[];
};

type AppointmentFilter = "ALL" | "CONFIRMED" | "PENDING";

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

export function AppointmentsFocusPanel({
  appointments,
}: AppointmentsFocusPanelProps) {
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
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | undefined>(
    turnosActivos[0]?.id,
  );

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

  const selectedAppointment =
    filteredAppointments.find((appointment) => appointment.id === selectedAppointmentId) ??
    filteredAppointments[0];

  const confirmedAppointments = turnosActivos.filter(
    (appointment) => appointment.status === "CONFIRMED",
  );
  const pendingAppointments = turnosActivos.filter(
    (appointment) => appointment.status === "PENDING",
  );
  const paidAppointments = turnosActivos.filter(
    (appointment) => appointment.paymentStatus === "APPROVED",
  );

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
            Inspirado en dashboards de agenda profesional: filtros rapidos, vista semanal y detalle
            del turno sin perder el contexto del calendario.
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
                  day.appointments.map((appointment) => {
                    const isActive = appointment.id === selectedAppointment?.id;

                    return (
                      <button
                        key={appointment.id}
                        className={`dashboard-calendar-event ${appointment.status.toLowerCase()} ${
                          isActive ? "active" : ""
                        }`}
                        onClick={() => setSelectedAppointmentId(appointment.id)}
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
                    );
                  })
                ) : (
                  <div className="dashboard-calendar-empty">Sin turnos</div>
                )}
              </div>
            </section>
          ))}
        </div>
      </article>

      {selectedAppointment ? (
        <article className="panel dashboard-turno-detail-panel">
          <div className="dashboard-section-header">
            <div>
              <h2>Detalle del turno seleccionado</h2>
              <p className="muted">
                Mantiene toda la informacion importante sin ocupar una columna permanente.
              </p>
            </div>
            <div className="dashboard-turno-detail-badges">
              <span className={`badge ${selectedAppointment.status.toLowerCase()}`}>
                {estadoTurnoLabel[selectedAppointment.status] ?? selectedAppointment.status}
              </span>
              <span className={`badge ${selectedAppointment.paymentStatus.toLowerCase()}`}>
                {estadoPagoLabel[selectedAppointment.paymentStatus] ?? selectedAppointment.paymentStatus}
              </span>
            </div>
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
              <span className="dashboard-detail-label">Horario</span>
              <strong>{selectedAppointment.startsAt}</strong>
            </div>
            <div className="dashboard-turno-detail-block">
              <span className="dashboard-detail-label">Notas</span>
              <strong>{selectedAppointment.notes ?? "Sin observaciones."}</strong>
            </div>
          </div>
        </article>
      ) : null}

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
    </section>
  );
}
