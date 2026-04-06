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
  const turnosDestacados = appointments.slice(0, 5);
  const turnosConfirmados = appointments.filter((appointment) => appointment.status === "CONFIRMED");
  const turnosPendientes = appointments.filter((appointment) => appointment.status === "PENDING");
  const pagosPendientes = appointments.filter(
    (appointment) => appointment.paymentStatus === "PENDING",
  );

  const estadoTurnoLabel: Record<string, string> = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmado",
    CANCELLED: "Cancelado",
  };

  const estadoPagoLabel: Record<string, string> = {
    NOT_REQUIRED: "Sin cobro",
    PENDING: "Pendiente",
    APPROVED: "Aprobado",
    REJECTED: "Rechazado",
    CANCELLED: "Cancelado",
  };

  return (
    <main className="shell grid dashboard-shell">
      <SessionBanner session={session} subtitle={`Gestion interna de ${profile.name}`} />

      <section className="hero spotlight dashboard-hero">
        <div className="dashboard-hero-copy">
          <div>
            <span className="eyebrow">Panel del tenant</span>
            <h1>{profile.name}</h1>
            <p className="muted">
              Prioriza tu agenda del dia, controla reservas activas y deja el resto de la
              configuracion en un segundo plano cuando haga falta.
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
            <strong>{appointments.length} turnos para seguir</strong>
            <p className="muted">
              Ten a mano las reservas confirmadas, los pendientes y los pagos que necesitan
              atencion.
            </p>
          </div>
          <div className="dashboard-note-card">
            <span className="dashboard-note-label">Contexto rapido</span>
            <strong>{profile.services.length} servicios visibles para reservar</strong>
            <p className="muted">
              Edita la oferta, ajusta cobros y personaliza la pagina sin perder de vista la agenda.
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
                    Una vista clara para entrar al panel y entender rapido que necesita accion.
                  </p>
                </div>
              </div>
              <div className="dashboard-kpi-grid">
                <article className="metric dashboard-kpi-card dashboard-kpi-card-highlight">
                  <span className="dashboard-kpi-label">Turnos de hoy</span>
                  <h2>{appointments.length}</h2>
                  <p className="muted">Reservas visibles para seguimiento inmediato.</p>
                </article>
                <article className="metric dashboard-kpi-card">
                  <span className="dashboard-kpi-label">Confirmados</span>
                  <h2>{turnosConfirmados.length}</h2>
                  <p className="muted">Turnos listos para atender sin friccion.</p>
                </article>
                <article className="metric dashboard-kpi-card">
                  <span className="dashboard-kpi-label">Pendientes</span>
                  <h2>{turnosPendientes.length}</h2>
                  <p className="muted">Reservas o pagos que conviene revisar cuanto antes.</p>
                </article>
              </div>
            </section>

            <section className="dashboard-priority-grid">
              <article className="panel dashboard-turnos-card">
                <div className="dashboard-section-header">
                  <div>
                    <h2>Turnos a la vista</h2>
                    <p className="muted">
                      La agenda reservada queda primero para que puedas decidir y actuar sin buscar.
                    </p>
                  </div>
                  <Link className="button secondary" href={`/${profile.slug}`}>
                    Ver pagina publica
                  </Link>
                </div>
                <div className="dashboard-turnos-list">
                  {turnosDestacados.length > 0 ? (
                    turnosDestacados.map((appointment) => (
                      <article className="dashboard-turno-item" key={appointment.id}>
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
                              {estadoPagoLabel[appointment.paymentStatus] ?? appointment.paymentStatus}
                            </span>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="dashboard-empty-state">
                      <strong>Aun no hay turnos reservados.</strong>
                      <p className="muted">
                        Cuando entren nuevas reservas las veras destacadas aqui, antes que en el
                        resto del panel.
                      </p>
                    </div>
                  )}
                </div>
              </article>

              <div className="dashboard-priority-side">
                <article className="panel dashboard-side-card dashboard-compact-card">
                  <div className="dashboard-section-header">
                    <div>
                      <h2>Agenda visible</h2>
                      <p className="muted">
                        Horarios publicados hoy en tu web para recibir nuevas reservas.
                      </p>
                    </div>
                  </div>
                  <div className="slot-list dashboard-slot-list">
                    {profile.nextSlots.map((slot) => (
                      <div className="slot" key={slot}>
                        {slot}
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel dashboard-side-card dashboard-compact-card">
                  <div className="dashboard-section-header">
                    <div>
                      <h2>Control rapido</h2>
                      <p className="muted">
                        Indicadores operativos y de cobro para no salir del resumen.
                      </p>
                    </div>
                  </div>
                  <div className="dashboard-summary-list">
                    <div className="dashboard-summary-row">
                      <span className="muted">Servicios activos</span>
                      <strong>{profile.services.length}</strong>
                    </div>
                    <div className="dashboard-summary-row">
                      <span className="muted">Pagos pendientes</span>
                      <strong>{pagosPendientes.length}</strong>
                    </div>
                    <div className="dashboard-summary-row">
                      <span className="muted">Cobro online</span>
                      <strong>{onlinePaymentEnabled ? "Activo" : "Inactivo"}</strong>
                    </div>
                    <div className="dashboard-summary-row">
                      <span className="muted">Cuenta Mercado Pago</span>
                      <strong>
                        {profile.paymentSettings?.hasMercadoPagoAccessToken
                          ? "Conectada"
                          : "Pendiente"}
                      </strong>
                    </div>
                  </div>
                </article>
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
                            {estadoTurnoLabel[appointment.status] ?? appointment.status}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${appointment.paymentStatus.toLowerCase()}`}>
                            {estadoPagoLabel[appointment.paymentStatus] ?? appointment.paymentStatus}
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
