import { SessionBanner } from "@/components/auth/session-banner";
import type { AuthSession } from "@/lib/auth/session";
import type { CustomerAppointmentSummary, TenantPublicProfile } from "@/lib/types";

type TenantCustomerProfilePageProps = {
  tenant: TenantPublicProfile;
  session: AuthSession;
  appointments: CustomerAppointmentSummary[];
  paymentMessage?: string | null;
};

export function TenantCustomerProfilePage({
  tenant,
  session,
  appointments,
  paymentMessage,
}: TenantCustomerProfilePageProps) {
  return (
    <main className="shell grid">
      <SessionBanner session={session} subtitle={`Perfil del cliente en ${tenant.name}`} />

      <section className="hero">
        <span className="eyebrow">Perfil del cliente final</span>
        <h1>Mis turnos en {tenant.name}</h1>
        <p className="muted">
          Aqui el cliente final puede consultar sus proximas reservas y su historial.
        </p>
        {paymentMessage ? <p className="form-error">{paymentMessage}</p> : null}
      </section>

      <section className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Pago</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td>{appointment.serviceName}</td>
                <td>{appointment.startsAt}</td>
                <td>
                  <span className={`badge ${appointment.status.toLowerCase()}`}>
                    {appointment.status}
                  </span>
                </td>
                <td>
                  <span className={`badge ${appointment.paymentStatus.toLowerCase()}`}>
                    {appointment.paymentStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
