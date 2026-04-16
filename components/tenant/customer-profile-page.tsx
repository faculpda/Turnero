import Link from "next/link";
import { SessionBanner } from "@/components/auth/session-banner";
import type { AuthSession } from "@/lib/auth/session";
import type { CustomerAppointmentSummary, TenantPublicProfile } from "@/lib/types";

type TenantCustomerProfilePageProps = {
  tenant: TenantPublicProfile;
  session: AuthSession;
  appointments: CustomerAppointmentSummary[];
  paymentMessage?: string | null;
  useSlugRoutes?: boolean;
};

const appointmentStatusLabel: Record<CustomerAppointmentSummary["status"], string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Atendido",
  NO_SHOW: "No asistio",
};

const paymentStatusLabel: Record<CustomerAppointmentSummary["paymentStatus"], string> = {
  NOT_REQUIRED: "Sin cobro online",
  PENDING: "Pago pendiente",
  APPROVED: "Pago aprobado",
  REJECTED: "Pago rechazado",
  CANCELLED: "Pago cancelado",
};

function customerBookingHref(tenant: TenantPublicProfile, useSlugRoutes: boolean): string {
  return useSlugRoutes ? `/${tenant.slug}/reservar` : "/reservar";
}

function paymentStatusDescription(appointment: CustomerAppointmentSummary): string {
  switch (appointment.paymentStatus) {
    case "APPROVED":
      return "El pago de este turno ya quedo registrado correctamente.";
    case "PENDING":
      return "Tu solicitud esta cargada y el pago todavia figura pendiente.";
    case "REJECTED":
      return "El intento de pago fue rechazado. Si hace falta, puedes volver a reservar.";
    case "CANCELLED":
      return "El pago se cancelo o ya no esta activo para esta reserva.";
    case "NOT_REQUIRED":
    default:
      return "Este turno no requiere cobro online para quedar registrado.";
  }
}

export function TenantCustomerProfilePage({
  tenant,
  session,
  appointments,
  paymentMessage,
  useSlugRoutes = true,
}: TenantCustomerProfilePageProps) {
  const orderedAppointments = [...appointments].sort(
    (left, right) =>
      new Date(left.startsAtIso).getTime() - new Date(right.startsAtIso).getTime(),
  );
  const now = new Date();
  const activeAppointments = orderedAppointments.filter((appointment) => {
    const isUpcoming = new Date(appointment.startsAtIso) >= now;
    return isUpcoming && (appointment.status === "PENDING" || appointment.status === "CONFIRMED");
  });
  const pendingPayments = orderedAppointments.filter(
    (appointment) => appointment.paymentStatus === "PENDING",
  );
  const approvedPayments = orderedAppointments.filter(
    (appointment) => appointment.paymentStatus === "APPROVED",
  );
  const paymentTrackedAppointments = [...orderedAppointments].sort(
    (left, right) =>
      new Date(right.startsAtIso).getTime() - new Date(left.startsAtIso).getTime(),
  );

  return (
    <main className="shell grid customer-profile-shell">
      <SessionBanner session={session} subtitle={`Perfil del cliente en ${tenant.name}`} />

      <section className="hero customer-profile-hero">
        <div className="customer-profile-hero-copy">
          <div>
            <span className="eyebrow">Panel del cliente</span>
            <h1>Mis turnos en {tenant.name}</h1>
            <p className="muted hero-copy">
              Consulta tus reservas activas, revisa el estado del pago de cada solicitud y sigue
              tu historial desde un solo lugar.
            </p>
          </div>
          <div className="actions">
            <Link
              className="button primary"
              href={customerBookingHref(tenant, useSlugRoutes)}
            >
              Reservar otro turno
            </Link>
          </div>
        </div>

        {paymentMessage ? (
          <article className="customer-profile-notice">
            <strong>Actualizacion del pago</strong>
            <p className="muted">{paymentMessage}</p>
          </article>
        ) : null}
      </section>

      <section className="dashboard-kpi-grid customer-profile-kpi-grid">
        <article className="metric dashboard-kpi-card dashboard-kpi-card-highlight dashboard-kpi-card-violet">
          <span className="dashboard-kpi-label">Turnos activos</span>
          <h2>{activeAppointments.length}</h2>
          <p className="muted">Reservas pendientes o confirmadas que siguen vigentes.</p>
        </article>
        <article className="metric dashboard-kpi-card dashboard-kpi-card-amber">
          <span className="dashboard-kpi-label">Pagos pendientes</span>
          <h2>{pendingPayments.length}</h2>
          <p className="muted">Solicitudes registradas que aun esperan confirmacion de pago.</p>
        </article>
        <article className="metric dashboard-kpi-card dashboard-kpi-card-blue">
          <span className="dashboard-kpi-label">Pagos aprobados</span>
          <h2>{approvedPayments.length}</h2>
          <p className="muted">Turnos que ya tienen el cobro online resuelto.</p>
        </article>
      </section>

      <section className="customer-profile-grid">
        <article className="panel customer-profile-panel">
          <div className="dashboard-section-header">
            <div>
              <h2>Mis turnos activos</h2>
              <p className="muted">
                Aqui aparecen tus proximas reservas para que sepas que sigue vigente.
              </p>
            </div>
          </div>

          {activeAppointments.length > 0 ? (
            <div className="customer-appointment-list">
              {activeAppointments.map((appointment) => (
                <article className="customer-appointment-card" key={appointment.id}>
                  <div className="customer-appointment-head">
                    <div className="customer-appointment-main">
                      <strong>{appointment.serviceName}</strong>
                      <span className="muted">{appointment.startsAt}</span>
                    </div>
                    <div className="customer-appointment-badges">
                      <span className={`badge ${appointment.status.toLowerCase()}`}>
                        {appointmentStatusLabel[appointment.status]}
                      </span>
                      <span className={`badge ${appointment.paymentStatus.toLowerCase()}`}>
                        {paymentStatusLabel[appointment.paymentStatus]}
                      </span>
                    </div>
                  </div>

                  <div className="customer-appointment-detail-grid">
                    <div className="customer-detail-chip">
                      <span className="customer-detail-label">Prestador</span>
                      <strong>{appointment.providerName ?? "A confirmar"}</strong>
                    </div>
                    <div className="customer-detail-chip">
                      <span className="customer-detail-label">Importe</span>
                      <strong>{appointment.priceLabel}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-state">
              <strong>No tienes turnos activos en este momento.</strong>
              <p className="muted">
                Cuando solicites una nueva reserva la vas a ver aqui junto con su estado.
              </p>
            </div>
          )}
        </article>

        <article className="panel customer-profile-panel">
          <div className="dashboard-section-header">
            <div>
              <h2>Estado de pago</h2>
              <p className="muted">
                Sigue el cobro de cada solicitud para saber si tu reserva ya quedo confirmada.
              </p>
            </div>
          </div>

          {paymentTrackedAppointments.length > 0 ? (
            <div className="customer-payment-list">
              {paymentTrackedAppointments.map((appointment) => (
                <article className="customer-payment-card" key={appointment.id}>
                  <div className="customer-payment-head">
                    <div className="customer-payment-main">
                      <strong>{appointment.serviceName}</strong>
                      <span className="muted">{appointment.startsAt}</span>
                    </div>
                    <span className={`badge ${appointment.paymentStatus.toLowerCase()}`}>
                      {paymentStatusLabel[appointment.paymentStatus]}
                    </span>
                  </div>

                  <div className="customer-payment-meta">
                    <span className={`badge ${appointment.status.toLowerCase()}`}>
                      {appointmentStatusLabel[appointment.status]}
                    </span>
                    <span className="muted">{appointment.priceLabel}</span>
                  </div>

                  <p className="muted customer-payment-description">
                    {paymentStatusDescription(appointment)}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-state">
              <strong>Todavia no tienes pagos asociados.</strong>
              <p className="muted">
                Cuando solicites un turno con cobro online podras seguir su estado desde aqui.
              </p>
            </div>
          )}
        </article>
      </section>

      <section className="table-wrap customer-profile-table-wrap">
        <div className="customer-profile-table-header">
          <div>
            <h2>Historial completo</h2>
            <p className="muted">Todas tus reservas en este tenant, con su estado y pago.</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Fecha</th>
              <th>Prestador</th>
              <th>Estado</th>
              <th>Pago</th>
              <th>Importe</th>
            </tr>
          </thead>
          <tbody>
            {orderedAppointments.length > 0 ? (
              orderedAppointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>{appointment.serviceName}</td>
                  <td>{appointment.startsAt}</td>
                  <td>{appointment.providerName ?? "A confirmar"}</td>
                  <td>
                    <span className={`badge ${appointment.status.toLowerCase()}`}>
                      {appointmentStatusLabel[appointment.status]}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${appointment.paymentStatus.toLowerCase()}`}>
                      {paymentStatusLabel[appointment.paymentStatus]}
                    </span>
                  </td>
                  <td>{appointment.priceLabel}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="muted" colSpan={6}>
                  Todavia no tienes reservas registradas en este tenant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
