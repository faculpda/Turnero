import { notFound } from "next/navigation";
import { AccessDenied } from "@/components/auth/access-denied";
import { TenantCustomerProfilePage } from "@/components/tenant/customer-profile-page";
import { getCurrentSession, hasCustomerAccess } from "@/lib/auth/session";
import { getPublicTenantProfileByHost } from "@/lib/data/tenants";
import { getRequestHost, isPlatformHost } from "@/lib/tenant-context";

export default async function RootCustomerProfilePage() {
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

  return <TenantCustomerProfilePage session={session} tenant={tenant} />;
}
