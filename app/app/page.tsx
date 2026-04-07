import Link from "next/link";
import { AccessDenied } from "@/components/auth/access-denied";
import { LogoutButton } from "@/components/auth/logout-button";
import { AppointmentsFocusPanel } from "@/components/tenant/appointments-focus-panel";
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
  const reservasActivas = appointments.filter(
    (appointment) => appointment.status === "PENDING" || appointment.status === "CONFIRMED",
  ).length;

  return (
    <main className="dashboard-app-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-brand">
          <div className="dashboard-sidebar-logo">T</div>
          <div>
            <strong>Turnero</strong>
            <div className="dashboard-sidebar-subtitle">Panel profesional</div>
          </div>
        </div>

        <nav className="dashboard-sidebar-nav" aria-label="Secciones del panel">
          <div className="dashboard-sidebar-group">
            <span className="dashboard-sidebar-label">Principal</span>
            <div className="dashboard-sidebar-item active">
              <span className="dashboard-sidebar-icon" />
              <span>Turnos</span>
            </div>
            <div className="dashboard-sidebar-item">
              <span className="dashboard-sidebar-icon" />
              <span>Agenda</span>
            </div>
          </div>

          <div className="dashboard-sidebar-group">
            <span className="dashboard-sidebar-label">Gestion</span>
            <div className="dashboard-sidebar-item">
              <span className="dashboard-sidebar-icon" />
              <span>Servicios</span>
            </div>
            <div className="dashboard-sidebar-item">
              <span className="dashboard-sidebar-icon" />
              <span>Cobros</span>
            </div>
            <div className="dashboard-sidebar-item">
              <span className="dashboard-sidebar-icon" />
              <span>Personalizacion</span>
            </div>
          </div>
        </nav>

        <div className="dashboard-sidebar-footer">
          <span className="dashboard-sidebar-label">Tenant activo</span>
          <strong>{profile.name}</strong>
          <div className="dashboard-sidebar-subtitle">{profile.slug}</div>
        </div>
      </aside>

      <div className="dashboard-workspace">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar-search">
            <span className="dashboard-topbar-search-icon" />
            <span>Buscar turnos, pacientes o servicios</span>
          </div>

          <div className="dashboard-topbar-actions">
            <Link className="button secondary" href={`/${profile.slug}`}>
              Ver pagina publica
            </Link>
            {session.globalRole === "SUPER_ADMIN" ? (
              <Link className="button secondary" href="/admin">
                Ir al super admin
              </Link>
            ) : null}
            <div className="dashboard-topbar-user">
              <div>
                <strong>{session.name}</strong>
                <div className="muted">{session.email}</div>
              </div>
              <LogoutButton />
            </div>
          </div>
        </header>

        <div className="dashboard-content shell">
          <section className="dashboard-overview-header">
            <div>
              <span className="eyebrow">Panel del tenant</span>
              <h1>{profile.name}</h1>
              <p className="muted dashboard-overview-copy">
                Un tablero claro para controlar reservas activas, atender pacientes y dejar la
                configuracion en un segundo nivel.
              </p>
            </div>

            <div className="dashboard-overview-actions">
              <div className="dashboard-overview-chip dashboard-overview-chip-violet">
                <span className="dashboard-overview-chip-label">Turnos activos</span>
                <strong>{reservasActivas}</strong>
              </div>
              <div className="dashboard-overview-chip dashboard-overview-chip-blue">
                <span className="dashboard-overview-chip-label">Servicios visibles</span>
                <strong>{profile.services.length}</strong>
              </div>
              <div className="dashboard-overview-chip dashboard-overview-chip-amber">
                <span className="dashboard-overview-chip-label">Pagos pendientes</span>
                <strong>{pagosPendientes.length}</strong>
              </div>
            </div>
          </section>

          <AppointmentsFocusPanel appointments={appointments} tenantSlug={tenantSlug} />

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
                        Lo secundario queda agrupado en pestanas para no competir con la vista de
                        turnos.
                      </p>
                    </div>
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
        </div>
      </div>
    </main>
  );
}
