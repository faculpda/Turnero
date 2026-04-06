import Link from "next/link";
import { AccessDenied } from "@/components/auth/access-denied";
import { SessionBanner } from "@/components/auth/session-banner";
import { AddServiceForm } from "@/components/tenant/add-service-form";
import { getCurrentSession, hasTenantAccess } from "@/lib/auth/session";
import { getTenantDashboardData } from "@/lib/data/tenants";

type TenantDashboardPageProps = {
  searchParams?: Promise<{
    tenant?: string;
  }>;
};

export default async function TenantDashboardPage({
  searchParams,
}: TenantDashboardPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const tenantSlug = resolvedSearchParams?.tenant ?? "dentista";
  const session = await getCurrentSession();

  if (!session || !(await hasTenantAccess(tenantSlug))) {
    return (
      <AccessDenied
        description="Necesitas ingresar con una cuenta del tenant o con una cuenta super admin."
        loginHref={`/app/login?tenant=${tenantSlug}`}
        title="Panel privado del negocio"
      />
    );
  }

  const { profile, appointments } = await getTenantDashboardData(tenantSlug);

  return (
    <main className="shell grid">
      <SessionBanner session={session} subtitle={`Gestion interna de ${profile.name}`} />

      <section className="hero spotlight">
        <div className="header-row">
          <div>
            <span className="eyebrow">Panel del tenant</span>
            <h1>{profile.name}</h1>
            <p className="muted">
              Desde aqui el profesional revisa su agenda, sus servicios y los turnos
              reservados por sus clientes.
            </p>
          </div>
          <div className="actions">
            <Link className="button secondary" href="/admin">
              Ir al super admin
            </Link>
            <Link className="button primary" href={`/${profile.slug}`}>
              Ver pagina publica
            </Link>
          </div>
        </div>
      </section>

      <section className="grid cols-3">
        <article className="metric">
          <h2>{profile.services.length}</h2>
          <p className="muted">Servicios activos</p>
        </article>
        <article className="metric">
          <h2>{appointments.length}</h2>
          <p className="muted">Turnos de hoy</p>
        </article>
        <article className="metric">
          <h2>87%</h2>
          <p className="muted">Ocupacion estimada semanal</p>
        </article>
      </section>

      <section className="grid cols-2">
        <article className="panel">
          <div className="header-row">
            <div>
              <h2>Servicios</h2>
              <p className="muted">Configuracion inicial del negocio</p>
            </div>
            <AddServiceForm tenantSlug={tenantSlug} />
          </div>
          <div className="service-list">
            {profile.services.map((service) => (
              <div className="service-chip" key={service.id}>
                <strong>{service.name}</strong>
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

        <article className="panel">
          <div className="header-row">
            <div>
              <h2>Proximos slots</h2>
              <p className="muted">Horarios visibles en la web publica</p>
            </div>
            <button className="button secondary">Editar agenda</button>
          </div>
          <div className="slot-list">
            {profile.nextSlots.map((slot) => (
              <div className="slot" key={slot}>
                {slot}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Servicio</th>
              <th>Horario</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td>{appointment.customerName}</td>
                <td>{appointment.serviceName}</td>
                <td>{appointment.startsAt}</td>
                <td>
                  <span className={`badge ${appointment.status.toLowerCase()}`}>
                    {appointment.status}
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
