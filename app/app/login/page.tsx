import { LoginForm } from "@/components/auth/login-form";

type TenantLoginPageProps = {
  searchParams?: Promise<{
    tenant?: string;
  }>;
};

export default async function TenantLoginPage({ searchParams }: TenantLoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const tenantSlug = resolvedSearchParams?.tenant ?? "dentista";

  return (
    <main className="shell">
      <LoginForm
        allowedRole="TENANT_ADMIN"
        defaultEmail="admin@dentista.com"
        description="Acceso para el profesional o su equipo interno para gestionar agenda y reservas."
        redirectTo={`/app?tenant=${tenantSlug}`}
        tenantSlug={tenantSlug}
        title={`Ingresar al panel de ${tenantSlug}`}
      />
    </main>
  );
}
