import Link from "next/link";
import { AccessDenied } from "@/components/auth/access-denied";
import { SessionBanner } from "@/components/auth/session-banner";
import { AddServiceForm } from "@/components/tenant/add-service-form";
import { PanelPestanas } from "@/components/tenant/panel-pestanas";
import { PaymentSettingsForm } from "@/components/tenant/payment-settings-form";
import { SiteBuilderForm } from "@/components/tenant/site-builder-form";
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
  const onlinePaymentEnabled = profile.paymentSettings?.mercadoPagoEnabled ?? false;
  const onlinePaymentServices = profile.services.filter(
    (service) => onlinePaymentEnabled && (service.priceCents ?? 0) > 0,
  ).length;

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

      <PanelPestanas
        cobros={<PaymentSettingsForm tenant={profile} />}
        personalizar={<SiteBuilderForm tenant={profile} />}
        resumen={
          <>
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
              <article className="panel payment-status-panel">
                <div className="header-row">
                  <div>
                    <h2>Cobro online</h2>
                    <p className="muted">
                      Estado general de Mercado Pago para este tenant.
                    </p>
                  </div>
                  <span
                    className={`badge ${onlinePaymentEnabled ? "approved" : "cancelled"}`}
                  >
                    {onlinePaymentEnabled ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="hero-meta">
                  <span>{onlinePaymentServices} servicios con pago online</span>
                  <span>
                    {profile.paymentSettings?.hasMercadoPagoAccessToken
                      ? "Cuenta de Mercado Pago conectada"
                      : "Cuenta pendiente de configurar"}
                  </span>
                </div>
              </article>

              <article className="panel">
                <h2>Como se mostrara al cliente</h2>
                <p className="muted">
                  Los servicios pagos muestran una etiqueta clara para indicar que el cobro se
                  realiza online durante la reserva.
                </p>
              </article>
            </section>

            <section className="grid cols-2">
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

              <article className="panel">
                <div className="header-row">
                  <div>
                    <h2>Servicios visibles</h2>
                    <p className="muted">Resumen rapido de la oferta publicada</p>
                  </div>
                </div>
                <div className="service-list">
                  {profile.services.map((service) => (
                    <div className="service-chip" key={service.id}>
                      <div className="service-chip-header">
                        <strong>{service.name}</strong>
                        <span
                          className={`badge ${
                            onlinePaymentEnabled && (service.priceCents ?? 0) > 0
                              ? "approved"
                              : "pending"
                          }`}
                        >
                          {onlinePaymentEnabled && (service.priceCents ?? 0) > 0
                            ? "Pago online"
                            : "Reserva sin cobro"}
                        </span>
                      </div>
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
            </section>

            <section className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Servicio</th>
                    <th>Horario</th>
                    <th>Estado</th>
                    <th>Pago</th>
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
          </>
        }
        servicios={
          <section className="grid">
            <article className="panel">
              <div className="header-row">
                <div>
                  <h2>Servicios</h2>
                  <p className="muted">Configura los servicios que el cliente podra reservar.</p>
                </div>
                <AddServiceForm tenantSlug={tenantSlug} />
              </div>
              <div className="service-list">
                {profile.services.map((service) => (
                  <div className="service-chip" key={service.id}>
                    <div className="service-chip-header">
                      <strong>{service.name}</strong>
                      <span
                        className={`badge ${
                          onlinePaymentEnabled && (service.priceCents ?? 0) > 0
                            ? "approved"
                            : "pending"
                        }`}
                      >
                        {onlinePaymentEnabled && (service.priceCents ?? 0) > 0
                          ? "Pago online"
                          : "Reserva sin cobro"}
                      </span>
                    </div>
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
          </section>
        }
      />
    </main>
  );
}
