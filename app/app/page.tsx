import Link from "next/link";
import { AccessDenied } from "@/components/auth/access-denied";
import { AppointmentsFocusPanel } from "@/components/tenant/appointments-focus-panel";
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
  const pagosPendientes = appointments.filter(
    (appointment) => appointment.paymentStatus === "PENDING",
  );

  return (
    <main className="shell grid dashboard-shell">
      <SessionBanner session={session} subtitle={`Gestion interna de ${profile.name}`} />

      <section className="hero spotlight dashboard-hero">
        <div className="dashboard-hero-copy">
          <div>
            <span className="eyebrow">Panel del tenant</span>
            <h1>{profile.name}</h1>
            <p className="muted">
              La portada privada ahora prioriza los turnos activos para que el profesional vea
              primero lo que tiene reservado y pueda actuar rapido.
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
          <div className="dashboard-note-card dashboard-note-priority">
            <span className="dashboard-note-label">Prioridad de hoy</span>
            <strong>{appointments.length} reservas en seguimiento</strong>
            <p className="muted">
              Confirmados y pendientes quedan destacados en la portada para evitar perderlos entre
              configuraciones.
            </p>
          </div>
          <div className="dashboard-note-card">
            <span className="dashboard-note-label">Contexto rapido</span>
            <strong>{profile.services.length} servicios visibles para reservar</strong>
            <p className="muted">
              Agenda, cobros, servicios y personalizacion siguen disponibles en pestañas separadas.
            </p>
          </div>
        </div>
      </section>

      <AppointmentsFocusPanel appointments={appointments} />

      <PanelPestanas
        cobros={<PaymentSettingsForm tenant={profile} />}
        personalizar={<SiteBuilderForm tenant={profile} />}
        resumen={
          <>
            <section className="dashboard-section">
              <div className="dashboard-section-header">
                <div>
                  <h2>Agenda y operacion</h2>
                  <p className="muted">
                    Lo secundario queda agrupado en pestañas para no competir con la vista de turnos.
                  </p>
                </div>
                <Link className="button secondary" href={`/${profile.slug}`}>
                  Ver pagina publica
                </Link>
              </div>
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
                  <div className="dashboard-summary-row">
                    <span className="muted">Servicios con pago online</span>
                    <strong>{onlinePaymentServices}</strong>
                  </div>
                  <div className="dashboard-summary-row">
                    <span className="muted">Pagos pendientes</span>
                    <strong>{pagosPendientes.length}</strong>
                  </div>
                </div>
              </article>
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
