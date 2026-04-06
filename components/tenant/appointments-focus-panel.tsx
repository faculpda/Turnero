"use client";

import { useMemo, useState } from "react";
import type { AppointmentSummary } from "@/lib/types";

type AppointmentsFocusPanelProps = {
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
  NOT_REQUIRED: "No requerido",
  PENDING: "Pendiente",
  APPROVED: "Abonado",
  REJECTED: "Rechazado",
  CANCELLED: "Cancelado",
};

const estadoPagoResumenLabel: Record<string, string> = {
  NOT_REQUIRED: "Sin cobro online",
  PENDING: "Pago pendiente",
  APPROVED: "Abonado",
  REJECTED: "Pago rechazado",
  CANCELLED: "Pago cancelado",
};

export function AppointmentsFocusPanel({
  appointments,
}: AppointmentsFocusPanelProps) {
  const turnosVisibles = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          appointment.status === "PENDING" || appointment.status === "CONFIRMED",
      ),
    [appointments],
  );

  const [turnoActivoId, setTurnoActivoId] = useState<string | undefined>(
    turnosVisibles[0]?.id,
  );

  const turnoActivo =
    turnosVisibles.find((appointment) => appointment.id === turnoActivoId) ?? turnosVisibles[0];

  const confirmados = turnosVisibles.filter((appointment) => appointment.status === "CONFIRMED");
  const pendientes = turnosVisibles.filter((appointment) => appointment.status === "PENDING");

  if (turnosVisibles.length === 0) {
    return (
      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>Turnos del dia</h2>
            <p className="muted">
              Aqui apareceran solo los turnos confirmados y pendientes para operar con foco.
            </p>
          </div>
        </div>
        <article className="panel dashboard-turnos-card">
          <div className="dashboard-empty-state">
            <strong>No hay turnos pendientes ni confirmados.</strong>
            <p className="muted">
              Cuando entren nuevas reservas o confirmaciones, se van a mostrar primero en esta vista.
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
          <h2>Turnos del dia</h2>
          <p className="muted">
            La portada del tenant queda dedicada a los turnos activos para que puedas revisar cada
            reserva con contexto completo.
          </p>
        </div>
      </div>

      <div className="dashboard-kpi-grid dashboard-turnos-kpi-grid">
        <article className="metric dashboard-kpi-card dashboard-kpi-card-highlight">
          <span className="dashboard-kpi-label">Turnos activos</span>
          <h2>{turnosVisibles.length}</h2>
          <p className="muted">Suma de reservas pendientes y confirmadas visibles en portada.</p>
        </article>
        <article className="metric dashboard-kpi-card">
          <span className="dashboard-kpi-label">Confirmados</span>
          <h2>{confirmados.length}</h2>
          <p className="muted">Listos para atencion sin acciones extra.</p>
        </article>
        <article className="metric dashboard-kpi-card">
          <span className="dashboard-kpi-label">Pendientes</span>
          <h2>{pendientes.length}</h2>
          <p className="muted">Reservas que conviene revisar o terminar de validar.</p>
        </article>
      </div>

      <div className="dashboard-priority-grid">
        <article className="panel dashboard-turnos-card">
          <div className="dashboard-section-header">
            <div>
              <h2>Lista de turnos</h2>
              <p className="muted">Selecciona un turno para ver todos los datos relevantes.</p>
            </div>
          </div>
          <div className="dashboard-turnos-list">
            {turnosVisibles.map((appointment) => {
              const activo = appointment.id === turnoActivo?.id;

              return (
                <button
                  key={appointment.id}
                  className={`dashboard-turno-item dashboard-turno-button ${activo ? "active" : ""}`}
                  onClick={() => setTurnoActivoId(appointment.id)}
                  type="button"
                >
                  <div className="dashboard-turno-main">
                    <strong>{appointment.customerName}</strong>
                    <span className="muted">{appointment.serviceName}</span>
                  </div>
                  <div className="dashboard-turno-meta">
                    <strong>{appointment.startsAt}</strong>
                    <div className="dashboard-turno-badges">
                      <span className={`badge ${appointment.status.toLowerCase()}`}>
                        {estadoTurnoLabel[appointment.status] ?? appointment.status}
                      </span>
                      <span className={`badge ${appointment.paymentStatus.toLowerCase()}`}>
                        {estadoPagoResumenLabel[appointment.paymentStatus] ?? appointment.paymentStatus}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </article>

        <article className="panel dashboard-side-card dashboard-turno-detail-card">
          <div className="dashboard-section-header">
            <div>
              <h2>Detalle del turno</h2>
              <p className="muted">
                Informacion del paciente y del servicio para atender o contactar rapido.
              </p>
            </div>
          </div>

          {turnoActivo ? (
            <div className="dashboard-turno-detail">
              <div className="dashboard-turno-detail-block">
                <span className="dashboard-detail-label">Paciente</span>
                <strong>{turnoActivo.customerName}</strong>
              </div>
              <div className="dashboard-turno-detail-block">
                <span className="dashboard-detail-label">Telefono</span>
                <strong>{turnoActivo.customerPhone ?? "No informado"}</strong>
              </div>
              <div className="dashboard-turno-detail-block">
                <span className="dashboard-detail-label">Mail</span>
                <strong>{turnoActivo.customerEmail}</strong>
              </div>
              <div className="dashboard-turno-detail-block">
                <span className="dashboard-detail-label">Servicio</span>
                <strong>{turnoActivo.serviceName}</strong>
              </div>
              <div className="dashboard-turno-detail-block">
                <span className="dashboard-detail-label">Horario</span>
                <strong>{turnoActivo.startsAt}</strong>
              </div>
              <div className="dashboard-turno-detail-block">
                <span className="dashboard-detail-label">Estado del turno</span>
                <span className={`badge ${turnoActivo.status.toLowerCase()}`}>
                  {estadoTurnoLabel[turnoActivo.status] ?? turnoActivo.status}
                </span>
              </div>
              <div className="dashboard-turno-detail-block">
                <span className="dashboard-detail-label">Estado del pago</span>
                <span className={`badge ${turnoActivo.paymentStatus.toLowerCase()}`}>
                  {estadoPagoLabel[turnoActivo.paymentStatus] ?? turnoActivo.paymentStatus}
                </span>
              </div>
              <div className="dashboard-turno-detail-block">
                <span className="dashboard-detail-label">Observaciones</span>
                <strong>{turnoActivo.notes ?? "Sin observaciones."}</strong>
              </div>
            </div>
          ) : null}
        </article>
      </div>
    </section>
  );
}
