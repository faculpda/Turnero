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
      <section className="hero">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">Turnero SaaS</span>
            <h1>Gestiona reservas para multiples negocios desde una sola plataforma.</h1>
            <p className="muted hero-copy">
              Una experiencia moderna para profesionales, equipos y clientes finales,
              con paneles privados, reservas online y soporte para dominio propio.
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
          </div>

          <aside className="hero-showcase">
            <div className="showcase-card">
              <span className="showcase-label">Hoy</span>
              <strong>24 reservas activas</strong>
              <p className="muted">
                Agenda centralizada, disponibilidad clara y seguimiento del estado de cada turno.
              </p>
            </div>
            <div className="showcase-card">
              <span className="showcase-label">Dominios</span>
              <strong>turnero.com.ar/dentista o dentista.com</strong>
              <p className="muted">
                El mismo tenant puede vivir tanto dentro de la plataforma como en su dominio propio.
              </p>
            </div>
          </aside>
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

      <section className="panel narrative-band">
        <div>
          <span className="eyebrow">Experiencia</span>
          <h2>Un sistema claro, sobrio y preparado para crecer.</h2>
        </div>
        <p className="muted">
          La interfaz esta orientada a transmitir confianza, orden y claridad tanto para el
          negocio que administra su agenda como para el cliente que reserva online.
        </p>
      </section>
    </main>
  );
}
