import { notFound } from "next/navigation";
import { AccessDenied } from "@/components/auth/access-denied";
import { TenantCustomerProfilePage } from "@/components/tenant/customer-profile-page";
import { getCurrentSession, hasCustomerAccess } from "@/lib/auth/session";
import { getPublicTenantProfile, listCustomerAppointments } from "@/lib/data/tenants";
import { syncMercadoPagoAppointmentPayment } from "@/lib/payments/mercadopago";

type CustomerProfilePageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    appointment?: string;
    payment_id?: string;
    payment_result?: string;
  }>;
};

export default async function CustomerProfilePage({
  params,
  searchParams,
}: CustomerProfilePageProps) {
  const { slug } = await params;
  const tenant = await getPublicTenantProfile(slug);
  const session = await getCurrentSession();

  if (!tenant) {
    notFound();
  }

  if (!session || !(await hasCustomerAccess(slug))) {
    return (
      <AccessDenied
        description="Necesitas ingresar con tu cuenta de cliente para consultar tus reservas."
        loginHref={`/${slug}/ingresar`}
        title="Perfil privado del cliente final"
      />
    );
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  let paymentMessage: string | null = null;

  if (resolvedSearchParams?.appointment && resolvedSearchParams.payment_id) {
    const syncResult = await syncMercadoPagoAppointmentPayment({
      tenantSlug: slug,
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

  const appointments = await listCustomerAppointments(session.userId, slug);

  return (
    <TenantCustomerProfilePage
      appointments={appointments}
      paymentMessage={paymentMessage}
      session={session}
      tenant={tenant}
    />
  );
}
