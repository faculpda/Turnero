import { LoginForm } from "@/components/auth/login-form";

type CustomerLoginPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CustomerLoginPage({ params }: CustomerLoginPageProps) {
  const { slug } = await params;

  return (
    <main className="shell">
      <LoginForm
        allowedRole="CUSTOMER"
        defaultEmail="maria@example.com"
        description="Acceso para que el cliente final consulte sus reservas y futuras reprogramaciones."
        redirectTo={`/${slug}/mi-perfil`}
        tenantSlug={slug}
        title={`Ingresar a mi perfil en ${slug}`}
      />
    </main>
  );
}
