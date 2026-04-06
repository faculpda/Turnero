import Link from "next/link";
import { AccessDenied } from "@/components/auth/access-denied";
import { SessionBanner } from "@/components/auth/session-banner";
import { AddServiceForm } from "@/components/tenant/add-service-form";
import { PanelPestanas } from "@/components/tenant/panel-pestanas";
import { PaymentSettingsForm } from "@/components/tenant/payment-settings-form";
import { ServiceEditorCard } from "@/components/tenant/service-editor-card";
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
    <main className="shell grid dashboard-shell">
      <SessionBanner session={session} subtitle={`Gestion interna de ${profile.name}`} />

      <section className="hero spotlight dashboard-hero">
        <div className="dashboard-hero-copy">
          <div>
            <span className="eyebrow">Panel del tenant</span>
            <h1>{profile.name}</h1>
            <p className="muted">
              Un espacio simple para revisar reservas, mantener tus servicios al dia y ajustar
              la experiencia publica del negocio.
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
        <div className="dashboard-hero-notes">
          <div className="dashboard-note-card">
            <strong>Que puedes hacer aqui</strong>
            <p className="muted">
              Revisar turnos, editar servicios, configurar cobros y personalizar tu pagina.
            </p>
          </div>
          <div className="dashboard-note-card">
            <strong>Foco principal</strong>
            <p className="muted">
              La reserva de turnos sigue siendo el eje central de todo el producto.
            </p>
          </div>
        </div>
      </section>

      <PanelPestanas
        cobros={<PaymentSettingsForm tenant={profile} />}
        personalizar={<SiteBuilderForm tenant={profile} />}
        resumen={
          <>
            <section className="dashboard-section">
              <div className="dashboard-section-header">
                <div>
                  <h2>Resumen general</h2>
                  <p className="muted">
                    Lo mas importante del dia en un solo vistazo.
                  </p>
                </div>
              </div>
              <div className="dashboard-kpi-grid">
                <article className="metric dashboard-kpi-card">
                  <span className="dashboard-kpi-label">Servicios activos</span>
                  <h2>{profile.services.length}</h2>
                  <p className="muted">Oferta publicada para que el cliente reserve.</p>
                </article>
                <article className="metric dashboard-kpi-card">
                  <span className="dashboard-kpi-label">Turnos de hoy</span>
                  <h2>{appointments.length}</h2>
                  <p className="muted">Reservas recientes visibles para seguimiento.</p>
                </article>
                <article className="metric dashboard-kpi-card">
                  <span className="dashboard-kpi-label">Ocupacion semanal</span>
                  <h2>87%</h2>
                  <p className="muted">Indicador visual para medir la carga estimada.</p>
                </article>
              </div>
            </section>

            <section className="dashboard-split-grid">
              <article className="panel dashboard-main-card">
                <div className="dashboard-section-header">
                  <div>
                    <h2>Agenda visible</h2>
                    <p className="muted">
                      Horarios que hoy aparecen disponibles en tu web publica.
                    </p>
                  </div>
                  <button className="button secondary">Editar agenda</button>
                </div>
                <div className="slot-list dashboard-slot-list">
                  {profile.nextSlots.map((slot) => (
                    <div className="slot" key={slot}>
                      {slot}
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel dashboard-side-card">
                <div className="dashboard-section-header">
                  <div>
                    <h2>Cobro online</h2>
                    <p className="muted">
                      Estado actual de Mercado Pago para este tenant.
                    </p>
                  </div>
                  <span
                    className={`badge ${onlinePaymentEnabled ? "approved" : "cancelled"}`}
                  >
                    {onlinePaymentEnabled ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="dashboard-summary-list">
                  <div className="dashboard-summary-row">
                    <span className="muted">Servicios con pago online</span>
                    <strong>{onlinePaymentServices}</strong>
                  </div>
                  <div className="dashboard-summary-row">
                    <span className="muted">Estado de la cuenta</span>
                    <strong>
                      {profile.paymentSettings?.hasMercadoPagoAccessToken
                        ? "Conectada"
                        : "Pendiente"}
                    </strong>
                  </div>
                  <div className="dashboard-summary-row">
                    <span className="muted">Experiencia del cliente</span>
                    <strong>
                      {onlinePaymentEnabled ? "Checkout online activo" : "Reserva sin cobro"}
                    </strong>
                  </div>
                </div>
              </article>
            </section>

            <section className="dashboard-split-grid">
              <article className="panel dashboard-main-card">
                <div className="dashboard-section-header">
                  <div>
                    <h2>Servicios visibles</h2>
                    <p className="muted">
                      Asi se ve hoy la oferta principal del negocio.
                    </p>
                  </div>
                </div>
                <div className="service-list dashboard-service-preview-list">
                  {profile.services.map((service) => (
                    <div className="service-chip dashboard-service-preview-card" key={service.id}>
                      {service.images?.[0] ? (
                        <img
                          alt={service.images[0].altText ?? service.name}
                          className="service-inline-image"
                          src={service.images[0].url}
                        />
                      ) : null}
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

              <article className="panel dashboard-side-card">
                <div className="dashboard-section-header">
                  <div>
                    <h2>Lo que ve el cliente</h2>
                    <p className="muted">
                      Los servicios pagos y los horarios visibles se reflejan automaticamente
                      en la web publica.
                    </p>
                  </div>
                </div>
                <div className="dashboard-summary-list">
                  <div className="dashboard-summary-row">
                    <span className="muted">Web publica</span>
                    <strong>Actualizada</strong>
                  </div>
                  <div className="dashboard-summary-row">
                    <span className="muted">Cobro online</span>
                    <strong>{onlinePaymentEnabled ? "Visible" : "No visible"}</strong>
                  </div>
                  <div className="dashboard-summary-row">
                    <span className="muted">Perfil del cliente final</span>
                    <strong>Disponible</strong>
                  </div>
                </div>
              </article>
            </section>

            <section className="dashboard-section">
              <div className="dashboard-section-header">
                <div>
                  <h2>Turnos recientes</h2>
                  <p className="muted">
                    Ultimos movimientos de agenda para revisar rapidamente.
                  </p>
                </div>
              </div>
              <div className="table-wrap dashboard-table-card">
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
              </div>
            </section>
          </>
        }
        servicios={
          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <div>
                <h2>Servicios</h2>
                <p className="muted">
                  Edita cada servicio con claridad: datos, estado, precio e imagenes.
                </p>
              </div>
              <AddServiceForm tenantSlug={tenantSlug} />
            </div>
            <div className="service-list service-list-stack">
              {profile.services.map((service) => (
                <ServiceEditorCard
                  key={service.id}
                  service={service}
                  tenantSlug={tenantSlug}
                />
              ))}
            </div>
          </section>
        }
      />
    </main>
  );
}
