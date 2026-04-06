import { notFound } from "next/navigation";
import { AccessDenied } from "@/components/auth/access-denied";
import { TenantCustomerProfilePage } from "@/components/tenant/customer-profile-page";
import { getCurrentSession, hasCustomerAccess } from "@/lib/auth/session";
import { getPublicTenantProfile, listCustomerAppointments } from "@/lib/data/tenants";

type CustomerProfilePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CustomerProfilePage({
  params,
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

  const appointments = await listCustomerAppointments(session.userId, slug);

  return (
    <TenantCustomerProfilePage
      appointments={appointments}
      session={session}
      tenant={tenant}
    />
  );
}
