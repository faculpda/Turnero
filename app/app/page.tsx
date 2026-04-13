import { AccessDenied } from "@/components/auth/access-denied";
import { AddServiceForm } from "@/components/tenant/add-service-form";
import { PaymentSettingsForm } from "@/components/tenant/payment-settings-form";
import { ProvidersPanel } from "@/components/tenant/providers-panel";
import { ServiceEditorCard } from "@/components/tenant/service-editor-card";
import { TenantAgendaPanel } from "@/components/tenant/tenant-agenda-panel";
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

  const { profile, providers, appointments, blockedTimeSlots } = await getTenantDashboardData(
    tenantSlug,
  );
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
        <TenantAgendaPanel
          blockedTimeSlots={blockedTimeSlots}
          onlinePaymentEnabled={onlinePaymentEnabled}
          onlinePaymentServices={onlinePaymentServices}
          pagosPendientes={pagosPendientes}
          services={profile.services}
          tenantSlug={tenantSlug}
        />
      }
      appointments={appointments}
      blockedTimeSlots={blockedTimeSlots}
      providers={providers}
      cobros={<PaymentSettingsForm tenant={profile} />}
      pagosPendientes={pagosPendientes}
      prestadores={<ProvidersPanel providers={providers} tenantSlug={tenantSlug} />}
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
