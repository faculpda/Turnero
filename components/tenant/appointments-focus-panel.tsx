"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AppointmentSummary, PaymentStatus } from "@/lib/types";

type AppointmentsFocusPanelProps = {
  appointments: AppointmentSummary[];
  blockedTimeSlots: Array<{
    id: string;
    title: string;
    reason?: string;
    startsAt: string;
    startsAtIso: string;
    endsAtIso: string;
  }>;
  services: Array<{
    id: string;
    name: string;
    durationMin: number;
    priceLabel: string;
  }>;
  providers: Array<{
    id: string;
    name: string;
    color?: string;
    isActive: boolean;
  }>;
  tenantSlug: string;
};

type AppointmentFilter = "ALL" | "CONFIRMED" | "PENDING";
type MutableAppointmentStatus = "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
type CalendarView = "WEEK" | "DAY";
type PaymentFilter = "ALL" | PaymentStatus;

type CalendarDay = {
  key: string;
  label: string;
  dateNumber: string;
  isToday: boolean;
  appointments: AppointmentSummary[];
  blockedTimeSlots: AppointmentsFocusPanelProps["blockedTimeSlots"];
};

const estadoTurnoLabel: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Atendido",
  NO_SHOW: "No asistio",
};

const estadoPagoLabel: Record<string, string> = {
  NOT_REQUIRED: "Sin cobro online",
  PENDING: "Pago pendiente",
  APPROVED: "Abonado",
  REJECTED: "Rechazado",
  CANCELLED: "Cancelado",
};

const filterLabels: Record<AppointmentFilter, string> = {
  ALL: "Todos",
  CONFIRMED: "Confirmados",
  PENDING: "Pendientes",
};

const paymentFilterLabels: Record<PaymentFilter, string> = {
  ALL: "Todos los pagos",
  NOT_REQUIRED: "Sin cobro",
  PENDING: "Pendiente",
  APPROVED: "Abonado",
  REJECTED: "Rechazado",
  CANCELLED: "Cancelado",
};

const reminderStatusLabel: Record<string, string> = {
  SCHEDULED: "Programado",
  SENT: "Enviado",
  FAILED: "Fallido",
  CANCELLED: "Cancelado",
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

function formatDateTime(dateIso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateIso));
}

function formatWeekRange(weekStart: Date, view: CalendarView) {
  if (view === "DAY") {
    return new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(weekStart);
  }

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
  blockedTimeSlots,
  services,
  providers,
  tenantSlug,
}: AppointmentsFocusPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [rescheduleDraft, setRescheduleDraft] = useState("");
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [filter, setFilter] = useState<AppointmentFilter>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState<string>("ALL");
  const [providerFilter, setProviderFilter] = useState<string>("ALL");
  const [view, setView] = useState<CalendarView>("WEEK");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | undefined>();
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualCustomerName, setManualCustomerName] = useState("");
  const [manualCustomerEmail, setManualCustomerEmail] = useState("");
  const [manualCustomerPhone, setManualCustomerPhone] = useState("");
  const [manualServiceId, setManualServiceId] = useState(services[0]?.id ?? "");
  const [manualProviderId, setManualProviderId] = useState(providers[0]?.id ?? "");
  const [manualStartsAt, setManualStartsAt] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [manualPaymentStatus, setManualPaymentStatus] = useState<
    "NOT_REQUIRED" | "PENDING" | "APPROVED"
  >("NOT_REQUIRED");

  const turnosOperativos = useMemo(
    () =>
      appointments
        .filter(
          (appointment) =>
            appointment.status === "PENDING" ||
            appointment.status === "CONFIRMED" ||
            appointment.status === "COMPLETED" ||
            appointment.status === "NO_SHOW",
        )
        .sort(
          (left, right) =>
            new Date(left.startsAtIso).getTime() - new Date(right.startsAtIso).getTime(),
        ),
    [appointments],
  );

  const serviceOptions = useMemo(() => {
    return Array.from(
      new Map(turnosOperativos.map((appointment) => [appointment.serviceId, appointment.serviceName])).entries(),
    );
  }, [turnosOperativos]);

  const filteredAppointments = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return turnosOperativos.filter((appointment) => {
      const matchesStatus =
        filter === "ALL" ||
        (filter === "CONFIRMED" && appointment.status === "CONFIRMED") ||
        (filter === "PENDING" && appointment.status === "PENDING");
      const matchesPayment =
        paymentFilter === "ALL" || appointment.paymentStatus === paymentFilter;
      const matchesService =
        serviceFilter === "ALL" || appointment.serviceId === serviceFilter;
      const matchesProvider =
        providerFilter === "ALL" || appointment.providerId === providerFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        appointment.customerName.toLowerCase().includes(normalizedSearch) ||
        appointment.customerEmail.toLowerCase().includes(normalizedSearch) ||
        (appointment.customerPhone ?? "").toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesPayment && matchesService && matchesProvider && matchesSearch;
    });
  }, [filter, paymentFilter, providerFilter, searchQuery, serviceFilter, turnosOperativos]);

  const selectedAppointment = turnosOperativos.find(
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

  const referenceDate = filteredAppointments[0]
    ? startOfDay(new Date(filteredAppointments[0].startsAtIso))
    : startOfDay(new Date());

  const visibleDays = useMemo(() => {
    if (view === "DAY") {
      return [startOfDay(weekStart)];
    }

    return Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(weekStart), index));
  }, [view, weekStart]);

  const calendarDays = useMemo<CalendarDay[]>(() => {
    return visibleDays.map((day) => ({
      key: day.toISOString(),
      label: formatDayLabel(day),
      dateNumber: formatDayNumber(day),
      isToday: sameDay(day, new Date()),
      appointments: filteredAppointments.filter((appointment) =>
        sameDay(new Date(appointment.startsAtIso), day),
      ),
      blockedTimeSlots: blockedTimeSlots.filter((blockedTimeSlot) =>
        sameDay(new Date(blockedTimeSlot.startsAtIso), day),
      ),
    }));
  }, [blockedTimeSlots, filteredAppointments, visibleDays]);

  const confirmedAppointments = turnosOperativos.filter(
    (appointment) => appointment.status === "CONFIRMED",
  );
  const pendingAppointments = turnosOperativos.filter(
    (appointment) => appointment.status === "PENDING",
  );
  const paidAppointments = turnosOperativos.filter(
    (appointment) => appointment.paymentStatus === "APPROVED",
  );

  async function submitAppointmentChanges(payload: {
    status?: MutableAppointmentStatus;
    startsAt?: string;
    notes?: string;
    providerId?: string | null;
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

  async function quickConfirm(appointmentId: string) {
    setError(null);

    try {
      const response = await fetch("/api/appointments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantSlug,
          appointmentId,
          status: "CONFIRMED",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "No se pudo confirmar el turno.");
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("No se pudo confirmar el turno.");
    }
  }

  async function createManualAppointment() {
    setError(null);

    try {
      const response = await fetch("/api/appointments/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantSlug,
          customerName: manualCustomerName,
          customerEmail: manualCustomerEmail,
          customerPhone: manualCustomerPhone,
          serviceId: manualServiceId,
          providerId: manualProviderId || undefined,
          startsAt: new Date(manualStartsAt).toISOString(),
          notes: manualNotes,
          paymentStatus: manualPaymentStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "No se pudo crear el turno manual.");
        return;
      }

      startTransition(() => {
        setIsManualModalOpen(false);
        setManualCustomerName("");
        setManualCustomerEmail("");
        setManualCustomerPhone("");
        setManualStartsAt("");
        setManualNotes("");
        setManualPaymentStatus("NOT_REQUIRED");
        router.refresh();
      });
    } catch {
      setError("No se pudo crear el turno manual.");
    }
  }

  if (turnosOperativos.length === 0) {
    return (
      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>Calendario de turnos</h2>
            <p className="muted">
              Aqui apareceran los turnos operativos, bloqueos y recordatorios de la agenda.
            </p>
          </div>
        </div>
        <article className="panel dashboard-turnos-card">
          <div className="dashboard-empty-state">
            <strong>No hay turnos cargados todavia.</strong>
            <p className="muted">
              Cuando empiecen a entrar reservas se van a organizar por dia con filtros y acciones.
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
            Mira los turnos del dia, filtra solo si hace falta y toca cualquier reserva para ver mas detalles.
          </p>
        </div>
        <button
          className="button primary"
          onClick={() => {
            setError(null);
            setIsManualModalOpen(true);
          }}
          type="button"
        >
          Agregar turno manual
        </button>
      </div>

      <div className="dashboard-guided-steps">
        <article className="dashboard-guided-step">
          <span className="dashboard-detail-label">Paso 1</span>
          <strong>Revisa la fecha</strong>
          <p className="muted">Empieza por hoy o cambia entre dia y semana segun lo que necesites ver.</p>
        </article>
        <article className="dashboard-guided-step">
          <span className="dashboard-detail-label">Paso 2</span>
          <strong>Filtra solo si hace falta</strong>
          <p className="muted">Busca por cliente, servicio, pago o prestador para acotar la agenda.</p>
        </article>
        <article className="dashboard-guided-step">
          <span className="dashboard-detail-label">Paso 3</span>
          <strong>Toca el turno para actuar</strong>
          <p className="muted">Desde cada reserva puedes confirmar, completar, cancelar o reprogramar.</p>
        </article>
      </div>

      <div className="dashboard-kpi-grid dashboard-turnos-kpi-grid">
        <article className="metric dashboard-kpi-card dashboard-kpi-card-highlight dashboard-kpi-card-violet">
          <span className="dashboard-kpi-label">Turnos operativos</span>
          <h2>{turnosOperativos.length}</h2>
          <p className="muted">Pendientes, confirmados, atendidos y ausencias visibles en agenda.</p>
        </article>
        <article className="metric dashboard-kpi-card dashboard-kpi-card-blue">
          <span className="dashboard-kpi-label">Confirmados</span>
          <h2>{confirmedAppointments.length}</h2>
          <p className="muted">Reservas listas para atender y enviar recordatorios.</p>
        </article>
        <article className="metric dashboard-kpi-card dashboard-kpi-card-amber">
          <span className="dashboard-kpi-label">Pagos aprobados</span>
          <h2>{paidAppointments.length}</h2>
          <p className="muted">Ayuda a detectar rapido que citas ya tienen cobro resuelto.</p>
        </article>
      </div>

      <article className="panel dashboard-calendar-shell">
        <div className="dashboard-calendar-toolbar">
          <div className="dashboard-calendar-week">
            <strong>{formatWeekRange(weekStart, view)}</strong>
            <span className="muted">Vista principal de turnos y bloqueos del tenant.</span>
          </div>

          <div className="dashboard-calendar-toolbar-actions">
            <div className="dashboard-filter-group" role="tablist" aria-label="Vista calendario">
              {(["DAY", "WEEK"] as CalendarView[]).map((option) => (
                <button
                  key={option}
                  className={`dashboard-filter-chip ${view === option ? "active" : ""}`}
                  onClick={() => setView(option)}
                  type="button"
                >
                  {option === "DAY" ? "Dia" : "Semana"}
                </button>
              ))}
            </div>
            <div className="dashboard-week-nav">
              <button
                onClick={() =>
                  setWeekStart((current) => addDays(current, view === "DAY" ? -1 : -7))
                }
                type="button"
              >
                Anterior
              </button>
              <button onClick={() => setWeekStart(startOfDay(referenceDate))} type="button">
                Hoy
              </button>
              <button
                onClick={() =>
                  setWeekStart((current) => addDays(current, view === "DAY" ? 1 : 7))
                }
                type="button"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>

        <div className="dashboard-calendar-filters">
          <input
            className="dashboard-modal-input"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar por nombre, mail o telefono"
            value={searchQuery}
          />
          <select
            className="dashboard-modal-input"
            onChange={(event) => setServiceFilter(event.target.value)}
            value={serviceFilter}
          >
            <option value="ALL">Todos los servicios</option>
            {serviceOptions.map(([serviceId, serviceName]) => (
              <option key={serviceId} value={serviceId}>
                {serviceName}
              </option>
            ))}
          </select>
          <select
            className="dashboard-modal-input"
            onChange={(event) => setFilter(event.target.value as AppointmentFilter)}
            value={filter}
          >
            {(["ALL", "CONFIRMED", "PENDING"] as AppointmentFilter[]).map((option) => (
              <option key={option} value={option}>
                {filterLabels[option]}
              </option>
            ))}
          </select>
          <select
            className="dashboard-modal-input"
            onChange={(event) => setPaymentFilter(event.target.value as PaymentFilter)}
            value={paymentFilter}
          >
            {(
              ["ALL", "NOT_REQUIRED", "PENDING", "APPROVED", "REJECTED", "CANCELLED"] as PaymentFilter[]
            ).map((option) => (
              <option key={option} value={option}>
                {paymentFilterLabels[option]}
              </option>
            ))}
          </select>
          <select
            className="dashboard-modal-input"
            onChange={(event) => setProviderFilter(event.target.value)}
            value={providerFilter}
          >
            <option value="ALL">Todos los prestadores</option>
            {providers.filter((provider) => provider.isActive).map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <div className={`dashboard-calendar-grid ${view === "DAY" ? "day-view" : ""}`}>
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
                <span className="dashboard-calendar-day-count">
                  {day.appointments.length + day.blockedTimeSlots.length}
                </span>
              </header>

              <div className="dashboard-calendar-day-body">
                {day.blockedTimeSlots.map((blockedTimeSlot) => (
                  <div className="dashboard-calendar-blocked" key={blockedTimeSlot.id}>
                    <strong>{blockedTimeSlot.title}</strong>
                    <span>{formatDateTime(blockedTimeSlot.startsAtIso)}</span>
                  </div>
                ))}

                {day.appointments.length > 0 ? (
                  day.appointments.map((appointment) => (
                    <div className="dashboard-calendar-event-wrap" key={appointment.id}>
                      <button
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
                        {appointment.providerName ? (
                          <span
                            className="dashboard-provider-tag"
                            style={{
                              backgroundColor: `${appointment.providerColor ?? "#5d3fd3"}22`,
                              color: appointment.providerColor ?? "#5d3fd3",
                            }}
                          >
                            {appointment.providerName}
                          </span>
                        ) : null}
                      </div>
                        <div className="dashboard-calendar-event-meta">
                          <span className={`badge ${appointment.status.toLowerCase()}`}>
                            {estadoTurnoLabel[appointment.status] ?? appointment.status}
                          </span>
                          {appointment.isLate ? (
                            <span className="badge pending">Llega tarde</span>
                          ) : null}
                        </div>
                      </button>
                      {appointment.status === "PENDING" ? (
                        <button
                          className="dashboard-quick-action"
                          disabled={isPending}
                          onClick={() => quickConfirm(appointment.id)}
                          type="button"
                        >
                          Confirmar rapido
                        </button>
                      ) : null}
                    </div>
                  ))
                ) : day.blockedTimeSlots.length === 0 ? (
                  <div className="dashboard-calendar-empty">Sin turnos</div>
                ) : null}
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
          <span className="dashboard-detail-label">No asistio</span>
          <strong>{turnosOperativos.filter((item) => item.status === "NO_SHOW").length}</strong>
          <p className="muted">Permite medir ausencias y ajustar recordatorios.</p>
        </div>
        <div className="dashboard-calendar-insight">
          <span className="dashboard-detail-label">Bloqueos</span>
          <strong>{blockedTimeSlots.length}</strong>
          <p className="muted">Pausas internas, ausencias y cierres aplicados a la agenda.</p>
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
          <article className="panel dashboard-modal-card" onClick={(event) => event.stopPropagation()}>
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
                <span className="dashboard-detail-label">Cliente</span>
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
                <span className="dashboard-detail-label">Prestador</span>
                <select
                  className="dashboard-modal-input"
                  onChange={(event) =>
                    submitAppointmentChanges({
                      providerId: event.target.value || null,
                    })
                  }
                  value={selectedAppointment.providerId ?? ""}
                >
                  <option value="">Sin asignar</option>
                  {providers.filter((provider) => provider.isActive).map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
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

            <div className="dashboard-modal-section">
              <div className="dashboard-section-header">
                <div>
                  <h3>Historial del turno</h3>
                </div>
              </div>
              <div className="dashboard-timeline">
                {selectedAppointment.events.length > 0 ? (
                  selectedAppointment.events.map((event) => (
                    <div className="dashboard-timeline-item" key={event.id}>
                      <strong>{event.title}</strong>
                      <span className="muted">{formatDateTime(event.createdAt)}</span>
                      {event.actorName ? (
                        <p className="muted">Realizado por {event.actorName}</p>
                      ) : null}
                      {event.description ? <p className="muted">{event.description}</p> : null}
                    </div>
                  ))
                ) : (
                  <div className="dashboard-calendar-empty">Todavia no hay historial.</div>
                )}
              </div>
            </div>

            <div className="dashboard-modal-section">
              <div className="dashboard-section-header">
                <div>
                  <h3>Recordatorios automaticos</h3>
                </div>
              </div>
              <div className="dashboard-reminder-list">
                {selectedAppointment.reminders.length > 0 ? (
                  selectedAppointment.reminders.map((reminder) => (
                    <div className="dashboard-reminder-item" key={reminder.id}>
                      <div>
                        <strong>{reminder.channel === "EMAIL" ? "Mail" : "WhatsApp"}</strong>
                        <div className="muted">{formatDateTime(reminder.scheduledFor)}</div>
                        <div className="muted">{reminder.target}</div>
                      </div>
                      <span className={`badge ${reminder.status === "SENT" ? "approved" : reminder.status === "FAILED" ? "rejected" : reminder.status === "CANCELLED" ? "cancelled" : "pending"}`}>
                        {reminderStatusLabel[reminder.status] ?? reminder.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="dashboard-calendar-empty">No hay recordatorios programados.</div>
                )}
              </div>
            </div>

            {error ? <p className="form-error">{error}</p> : null}

            <div className="dashboard-modal-actions">
              <button
                className="button secondary"
                disabled={isPending}
                onClick={() => submitAppointmentChanges({ notes: notesDraft })}
                type="button"
              >
                Guardar notas
              </button>
              <button
                className="button secondary"
                disabled={isPending}
                onClick={() =>
                  submitAppointmentChanges({
                    startsAt: new Date(rescheduleDraft).toISOString(),
                    notes: notesDraft,
                  })
                }
                type="button"
              >
                Reprogramar
              </button>
              {selectedAppointment.status === "PENDING" ? (
                <button
                  className="button secondary"
                  disabled={isPending}
                  onClick={() => submitAppointmentChanges({ status: "CONFIRMED" })}
                  type="button"
                >
                  Confirmar
                </button>
              ) : null}
              <button
                className="button secondary"
                disabled={isPending}
                onClick={() => submitAppointmentChanges({ status: "NO_SHOW" })}
                type="button"
              >
                Marcar no asistio
              </button>
              <button
                className="button secondary"
                disabled={isPending}
                onClick={() => submitAppointmentChanges({ status: "CANCELLED" })}
                type="button"
              >
                Cancelar turno
              </button>
              <button
                className="button primary"
                disabled={isPending}
                onClick={() => submitAppointmentChanges({ status: "COMPLETED" })}
                type="button"
              >
                Marcar como completado
              </button>
            </div>
          </article>
        </div>
      ) : null}

      {isManualModalOpen ? (
        <div
          aria-modal="true"
          className="dashboard-modal-backdrop"
          role="dialog"
          onClick={() => {
            if (!isPending) {
              setIsManualModalOpen(false);
              setError(null);
            }
          }}
        >
          <article className="panel dashboard-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="dashboard-section-header">
              <div>
                <h2>Agregar turno manual</h2>
                <p className="muted">
                  Carga reservas tomadas por telefono, WhatsApp o de forma presencial.
                </p>
              </div>
              <button
                className="dashboard-modal-close"
                onClick={() => {
                  if (!isPending) {
                    setIsManualModalOpen(false);
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
                <span className="dashboard-detail-label">Nombre</span>
                <input
                  className="dashboard-modal-input"
                  onChange={(event) => setManualCustomerName(event.target.value)}
                  placeholder="Cliente"
                  value={manualCustomerName}
                />
              </div>
              <div className="dashboard-turno-detail-block">
                <span className="dashboard-detail-label">Mail</span>
                <input
                  className="dashboard-modal-input"
                  onChange={(event) => setManualCustomerEmail(event.target.value)}
                  placeholder="mail@ejemplo.com"
                  value={manualCustomerEmail}
                />
              </div>
              <div className="dashboard-turno-detail-block">
                <span className="dashboard-detail-label">Telefono</span>
                <input
                  className="dashboard-modal-input"
                  onChange={(event) => setManualCustomerPhone(event.target.value)}
                  placeholder="+54..."
                  value={manualCustomerPhone}
                />
              </div>
              <div className="dashboard-turno-detail-block">
                <span className="dashboard-detail-label">Servicio</span>
                <select
                  className="dashboard-modal-input"
                  onChange={(event) => setManualServiceId(event.target.value)}
                  value={manualServiceId}
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {service.priceLabel}
                    </option>
                  ))}
                </select>
              </div>
              <div className="dashboard-turno-detail-block">
                <span className="dashboard-detail-label">Prestador</span>
                <select
                  className="dashboard-modal-input"
                  onChange={(event) => setManualProviderId(event.target.value)}
                  value={manualProviderId}
                >
                  <option value="">Sin asignar</option>
                  {providers.filter((provider) => provider.isActive).map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="dashboard-turno-detail-block">
                <span className="dashboard-detail-label">Fecha y hora</span>
                <input
                  className="dashboard-modal-input"
                  onChange={(event) => setManualStartsAt(event.target.value)}
                  type="datetime-local"
                  value={manualStartsAt}
                />
              </div>
              <div className="dashboard-turno-detail-block">
                <span className="dashboard-detail-label">Cobro</span>
                <select
                  className="dashboard-modal-input"
                  onChange={(event) =>
                    setManualPaymentStatus(
                      event.target.value as "NOT_REQUIRED" | "PENDING" | "APPROVED",
                    )
                  }
                  value={manualPaymentStatus}
                >
                  <option value="NOT_REQUIRED">Sin cobro online</option>
                  <option value="PENDING">Pago pendiente</option>
                  <option value="APPROVED">Pago aprobado</option>
                </select>
              </div>
              <div className="dashboard-turno-detail-block dashboard-turno-detail-block-wide">
                <span className="dashboard-detail-label">Notas</span>
                <textarea
                  className="dashboard-modal-textarea"
                  onChange={(event) => setManualNotes(event.target.value)}
                  rows={4}
                  value={manualNotes}
                />
              </div>
            </div>

            {error ? <p className="form-error">{error}</p> : null}

            <div className="dashboard-modal-actions">
              <button
                className="button primary"
                disabled={isPending || !manualCustomerName.trim() || !manualServiceId || !manualStartsAt}
                onClick={createManualAppointment}
                type="button"
              >
                Guardar turno manual
              </button>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
