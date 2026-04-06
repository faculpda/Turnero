import { SessionBanner } from "@/components/auth/session-banner";
import type { AuthSession } from "@/lib/auth/session";
import type { TenantPublicProfile } from "@/lib/types";

type TenantCustomerProfilePageProps = {
  tenant: TenantPublicProfile;
  session: AuthSession;
};

export function TenantCustomerProfilePage({
  tenant,
  session,
}: TenantCustomerProfilePageProps) {
  return (
    <main className="shell grid">
      <SessionBanner session={session} subtitle={`Perfil del cliente en ${tenant.name}`} />

      <section className="hero">
        <span className="eyebrow">Perfil del cliente final</span>
        <h1>Mis turnos en {tenant.name}</h1>
        <p className="muted">
          Aqui el cliente final podra consultar sus proximas reservas, reprogramar o
          cancelar segun las reglas del tenant.
        </p>
      </section>

      <section className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Limpieza dental</td>
              <td>Martes 7 - 09:00</td>
              <td>
                <span className="badge confirmed">CONFIRMED</span>
              </td>
              <td>
                <button className="button secondary">Reprogramar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}
