import Link from "next/link";
import { notFound } from "next/navigation";
import { TenantPublicHome } from "@/components/tenant/public-home";
import { getPublicTenantProfileByHost } from "@/lib/data/tenants";
import { getRequestHost, isPlatformHost } from "@/lib/tenant-context";

export default async function HomePage() {
  const host = await getRequestHost();

  if (host && !isPlatformHost(host)) {
    const tenant = await getPublicTenantProfileByHost(host);

    if (!tenant) {
      notFound();
    }

    return <TenantPublicHome tenant={tenant} useSlugRoutes={false} />;
  }

  return (
    <main className="shell grid">
      <section className="hero spotlight">
        <span className="eyebrow">Turnero SaaS</span>
        <h1>Gestiona reservas para multiples negocios desde una sola plataforma.</h1>
        <p className="muted">
          Cada cliente puede usar su slug en la plataforma o conectar su propio dominio,
          mientras sus usuarios reservan turnos online y consultan su historial.
        </p>
        <div className="actions">
          <Link className="button primary" href="/admin">
            Ver super admin
          </Link>
          <Link className="button secondary" href="/app">
            Ver panel del tenant
          </Link>
          <Link className="button secondary" href="/dentista">
            Ver pagina publica
          </Link>
          <Link className="button secondary" href="/admin/login">
            Login super admin
          </Link>
        </div>
      </section>

      <section className="grid cols-3">
        <article className="metric">
          <h2>Multi-tenant real</h2>
          <p className="muted">
            Soporte por slug y por dominio propio para cada profesional o negocio.
          </p>
        </article>
        <article className="metric">
          <h2>Reserva publica</h2>
          <p className="muted">
            Los clientes finales eligen servicio, fecha y horario desde la web publica.
          </p>
        </article>
        <article className="metric">
          <h2>Paneles separados</h2>
          <p className="muted">
            Super admin, tenant y cliente final con responsabilidades bien divididas.
          </p>
        </article>
      </section>
    </main>
  );
}
