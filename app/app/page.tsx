import { AccessDenied } from "@/components/auth/access-denied";
import { AddServiceForm } from "@/components/tenant/add-service-form";
import { CustomersPanel } from "@/components/tenant/customers-panel";
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

  const { profile, providers, appointments, blockedTimeSlots, availabilityRules } =
    await getTenantDashboardData(
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
  const customersMap = new Map<
    string,
    {
      id: string;
      name: string;
      email: string;
      phone?: string;
      totalAppointments: number;
      activeAppointments: number;
      pendingPayments: number;
      lastServiceName?: string;
      nextAppointment?: string;
      history: Array<{
        id: string;
        serviceName: string;
        startsAt: string;
        status: string;
        paymentStatus: string;
      }>;
    }
  >();
  const now = Date.now();

  for (const appointment of appointments) {
    const customerKey = appointment.customerEmail.toLowerCase();
    const current =
      customersMap.get(customerKey) ??
      {
        id: customerKey,
        name: appointment.customerName,
        email: appointment.customerEmail,
        phone: appointment.customerPhone,
        totalAppointments: 0,
        activeAppointments: 0,
        pendingPayments: 0,
        lastServiceName: undefined,
        nextAppointment: undefined,
        history: [],
      };

    current.totalAppointments += 1;

    if (appointment.status === "PENDING" || appointment.status === "CONFIRMED") {
      current.activeAppointments += 1;
    }

    if (appointment.paymentStatus === "PENDING") {
      current.pendingPayments += 1;
    }

    const appointmentTimestamp = new Date(appointment.startsAtIso).getTime();

    if (appointmentTimestamp <= now) {
      current.lastServiceName = appointment.serviceName;
    } else if (!current.nextAppointment) {
      current.nextAppointment = appointment.startsAt;
    }

    current.history.push({
      id: appointment.id,
      serviceName: appointment.serviceName,
      startsAt: appointment.startsAt,
      status: appointment.status,
      paymentStatus: appointment.paymentStatus,
    });

    customersMap.set(customerKey, current);
  }

  const customers = Array.from(customersMap.values())
    .map((customer) => ({
      ...customer,
      history: customer.history.slice(0, 6),
    }))
    .sort((a, b) => b.totalAppointments - a.totalAppointments);

  return (
    <TenantDashboardShell
      agenda={
        <TenantAgendaPanel
          availabilityRules={availabilityRules}
          blockedTimeSlots={blockedTimeSlots}
          providers={providers}
          tenantSlug={tenantSlug}
        />
      }
      activeProviders={providers.filter((provider) => provider.isActive).length}
      agendaRulesCount={availabilityRules.filter((rule) => rule.isActive).length}
      appointments={appointments}
      blockedTimeSlots={blockedTimeSlots}
      clientes={<CustomersPanel customers={customers} />}
      providers={providers}
      cobros={<PaymentSettingsForm tenant={profile} />}
      onlinePaymentServices={onlinePaymentServices}
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
          <div className="service-list service-list-stack dashboard-hierarchy-list">
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
