import Link from "next/link";
import { AccessDenied } from "@/components/auth/access-denied";
import { LogoutButton } from "@/components/auth/logout-button";
import { SiteBuilderForm } from "@/components/tenant/site-builder-form";
import { getCurrentSession, hasTenantAccess } from "@/lib/auth/session";
import { getTenantDashboardData } from "@/lib/data/tenants";

type TenantSiteBuilderPageProps = {
  searchParams?: Promise<{
    tenant?: string;
  }>;
};

export default async function TenantSiteBuilderEditorPage({
  searchParams,
}: TenantSiteBuilderPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const tenantSlug = resolvedSearchParams?.tenant ?? "dentista";
  const session = await getCurrentSession();

  if (!session || !(await hasTenantAccess(tenantSlug))) {
    return (
      <AccessDenied
        description="Necesitas ingresar con una cuenta del tenant o con una cuenta super admin."
        loginHref={`/app/login?tenant=${tenantSlug}`}
        title="Editor visual del sitio"
      />
    );
  }

  const { profile } = await getTenantDashboardData(tenantSlug);

  return (
    <main className="site-builder-page">
      <header className="site-builder-page-topbar">
        <div className="site-builder-page-brand">
          <div className="site-builder-page-badge">Editor visual</div>
          <div>
            <strong>{profile.name}</strong>
            <p>Personaliza tu tema activo y ajusta el contenido en tiempo real.</p>
          </div>
        </div>

        <div className="site-builder-page-actions">
          <Link className="button secondary" href={`/app/personalizar?tenant=${tenantSlug}`}>
            Volver a temas
          </Link>
          <Link className="button secondary" href={`/${profile.slug}`}>
            Ver pagina publica
          </Link>
          <div className="site-builder-page-user">
            <div>
              <strong>{session.name}</strong>
              <span>{session.email}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <SiteBuilderForm tenant={profile} />
    </main>
  );
}
