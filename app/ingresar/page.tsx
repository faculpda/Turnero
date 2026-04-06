import { notFound } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getPublicTenantProfileByHost } from "@/lib/data/tenants";
import { getRequestHost, isPlatformHost } from "@/lib/tenant-context";

export default async function RootCustomerLoginPage() {
  const host = await getRequestHost();

  if (!host || isPlatformHost(host)) {
    notFound();
  }

  const tenant = await getPublicTenantProfileByHost(host);

  if (!tenant) {
    notFound();
  }

  return (
    <main className="shell">
      <LoginForm
        allowedRole="CUSTOMER"
        defaultEmail="maria@example.com"
        description="Acceso para que el cliente final consulte sus reservas y futuras reprogramaciones."
        redirectTo="/mi-perfil"
        tenantSlug={tenant.slug}
        title={`Ingresar a mi perfil en ${tenant.name}`}
      />
    </main>
  );
}
