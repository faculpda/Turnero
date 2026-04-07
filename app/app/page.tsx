import { AccessDenied } from "@/components/auth/access-denied";
import { AddServiceForm } from "@/components/tenant/add-service-form";
import { PaymentSettingsForm } from "@/components/tenant/payment-settings-form";
import { ServiceEditorCard } from "@/components/tenant/service-editor-card";
import { SiteBuilderForm } from "@/components/tenant/site-builder-form";
import { TenantDashboardShell } from "@/components/tenant/tenant-dashboard-shell";
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
  const pagosPendientes = appointments.filter(
    (appointment) => appointment.paymentStatus === "PENDING",
  ).length;
  const reservasActivas = appointments.filter(
    (appointment) => appointment.status === "PENDING" || appointment.status === "CONFIRMED",
  ).length;

  return (
    <TenantDashboardShell
      agenda={
        <>
          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <div>
                <h2>Agenda y operacion</h2>
                <p className="muted">
                  Mantiene a mano la oferta visible y el estado general de la experiencia del cliente.
                </p>
              </div>
            </div>
          </section>

          <section className="dashboard-split-grid">
            <article className="panel dashboard-main-card">
              <div className="dashboard-section-header">
                <div>
                  <h2>Servicios visibles</h2>
                  <p className="muted">Asi se ve hoy la oferta principal del negocio.</p>
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
                    Los servicios pagos y los horarios visibles se reflejan automaticamente en la
                    web publica.
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
                <div className="dashboard-summary-row">
                  <span className="muted">Servicios con pago online</span>
                  <strong>{onlinePaymentServices}</strong>
                </div>
                <div className="dashboard-summary-row">
                  <span className="muted">Pagos pendientes</span>
                  <strong>{pagosPendientes}</strong>
                </div>
              </div>
            </article>
          </section>
        </>
      }
      appointments={appointments}
      cobros={<PaymentSettingsForm tenant={profile} />}
      pagosPendientes={pagosPendientes}
      personalizar={<SiteBuilderForm tenant={profile} />}
      profile={profile}
      reservasActivas={reservasActivas}
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
              <ServiceEditorCard key={service.id} service={service} tenantSlug={tenantSlug} />
            ))}
          </div>
        </section>
      }
      session={{
        name: session.name,
        email: session.email,
        globalRole: session.globalRole,
      }}
      tenantSlug={tenantSlug}
    />
  );
}
