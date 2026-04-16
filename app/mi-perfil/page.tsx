import { notFound } from "next/navigation";
import { AccessDenied } from "@/components/auth/access-denied";
import { TenantCustomerProfilePage } from "@/components/tenant/customer-profile-page";
import { getCurrentSession, hasCustomerAccess } from "@/lib/auth/session";
import { getPublicTenantProfileByHost, listCustomerAppointments } from "@/lib/data/tenants";
import { syncMercadoPagoAppointmentPayment } from "@/lib/payments/mercadopago";
import { getRequestHost, isPlatformHost } from "@/lib/tenant-context";

type RootCustomerProfilePageProps = {
  searchParams?: Promise<{
    appointment?: string;
    payment_id?: string;
    payment_result?: string;
  }>;
};

export default async function RootCustomerProfilePage({
  searchParams,
}: RootCustomerProfilePageProps) {
  const host = await getRequestHost();

  if (!host || isPlatformHost(host)) {
    notFound();
  }

  const tenant = await getPublicTenantProfileByHost(host);

  if (!tenant) {
    notFound();
  }

  const session = await getCurrentSession();

  if (!session || !(await hasCustomerAccess(tenant.slug))) {
    return (
      <AccessDenied
        description="Necesitas ingresar con tu cuenta de cliente para consultar tus reservas."
        loginHref="/ingresar"
        title="Perfil privado del cliente final"
      />
    );
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  let paymentMessage: string | null = null;

  if (resolvedSearchParams?.appointment && resolvedSearchParams.payment_id) {
    const syncResult = await syncMercadoPagoAppointmentPayment({
      tenantSlug: tenant.slug,
      appointmentId: resolvedSearchParams.appointment,
      paymentId: resolvedSearchParams.payment_id,
    });

    paymentMessage = syncResult.ok
      ? syncResult.status === "APPROVED"
        ? "Pago aprobado. Tu turno ya quedo confirmado."
        : "Recibimos el estado del pago y actualizamos tu reserva."
      : syncResult.error;
  } else if (resolvedSearchParams?.payment_result === "failure") {
    paymentMessage = "El pago no se completo. Puedes intentarlo nuevamente desde una nueva reserva.";
  }

  const appointments = await listCustomerAppointments(session.userId, tenant.slug);

  return (
    <TenantCustomerProfilePage
      appointments={appointments}
      paymentMessage={paymentMessage}
      session={session}
      tenant={tenant}
      useSlugRoutes={false}
    />
  );
}
