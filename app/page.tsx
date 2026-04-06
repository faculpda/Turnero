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
    <main className="shell landing-page">
      <section className="hero hero-sales">
        <div className="hero-topbar">
          <div className="brand-lockup">
            <span className="brand-dot" />
            <strong>Turnero</strong>
          </div>
          <div className="actions">
            <Link className="button secondary" href="/dentista">
              Ver demo
            </Link>
            <Link className="button primary" href="/admin/login">
              Ingresar
            </Link>
          </div>
        </div>

        <div className="hero-grid">
          <div>
            <span className="eyebrow">Turnero SaaS</span>
            <h1>Un sistema de turnos profesional para negocios que quieren crecer.</h1>
            <p className="muted hero-copy">
              Administra reservas, disponibilidad, servicios y clientes desde una plataforma
              moderna, clara y lista para operar como SaaS profesional.
            </p>
            <div className="actions">
              <Link className="button primary" href="/dentista">
                Explorar experiencia
              </Link>
              <Link className="button secondary" href="/app">
                Ver panel interno
              </Link>
              <Link className="button secondary" href="/admin">
                Ver super admin
              </Link>
            </div>
            <div className="hero-meta">
              <span>Multi-tenant por slug y dominio propio</span>
              <span>Panel del negocio + reserva publica</span>
              <span>Base lista para escalar</span>
            </div>
          </div>

          <aside className="hero-showcase">
            <div className="showcase-window">
              <div className="window-bar">
                <span />
                <span />
                <span />
              </div>
              <div className="showcase-stat-row">
                <div className="showcase-stat">
                  <span className="showcase-label">Reservas</span>
                  <strong>124</strong>
                </div>
                <div className="showcase-stat">
                  <span className="showcase-label">Ocupacion</span>
                  <strong>87%</strong>
                </div>
              </div>
              <div className="showcase-list">
                <div className="showcase-line strong" />
                <div className="showcase-line" />
                <div className="showcase-line" />
                <div className="showcase-calendar">
                  <span className="calendar-block active" />
                  <span className="calendar-block" />
                  <span className="calendar-block" />
                  <span className="calendar-block active" />
                  <span className="calendar-block" />
                  <span className="calendar-block" />
                </div>
              </div>
            </div>
            <div className="showcase-mini-grid">
              <div className="showcase-card compact">
                <span className="showcase-label">Publico</span>
                <strong>turnero.com.ar/dentista</strong>
              </div>
              <div className="showcase-card compact">
                <span className="showcase-label">Dominio propio</span>
                <strong>dentista.com</strong>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="info-grid">
        <article className="panel info-panel">
          <span className="eyebrow">Para quien vende</span>
          <h2>Una web clara para convertir visitas en reservas.</h2>
          <p className="muted">
            Cada cliente del SaaS puede tener su propia presencia publica para mostrar servicios,
            horarios y permitir reservas online de forma simple.
          </p>
        </article>
        <article className="panel info-panel">
          <span className="eyebrow">Para quien administra</span>
          <h2>Un panel interno ordenado para operar sin friccion.</h2>
          <p className="muted">
            El negocio gestiona agenda, clientes, disponibilidad y reservas desde una interfaz
            profesional pensada para el dia a dia.
          </p>
        </article>
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
          <span className="eyebrow">Como funciona</span>
          <h2>Captacion, reserva y administracion en un mismo producto.</h2>
        </div>
        <div className="steps-grid">
          <div className="step-item">
            <strong>1. El negocio contrata</strong>
            <p className="muted">Activa su espacio en la plataforma o conecta su dominio.</p>
          </div>
          <div className="step-item">
            <strong>2. El cliente reserva</strong>
            <p className="muted">Elige servicio, fecha y horario desde una experiencia publica.</p>
          </div>
          <div className="step-item">
            <strong>3. El equipo gestiona</strong>
            <p className="muted">Controla agenda, turnos y clientes desde su panel privado.</p>
          </div>
        </div>
      </section>

      <section className="plans-section">
        <div className="section-heading">
          <span className="eyebrow">Planes</span>
          <h2>Seccion preparada para mostrar los planes comerciales del SaaS.</h2>
          <p className="muted">
            En esta parte vamos a poder incorporar precios, beneficios, comparativas y llamados a
            la accion para convertir visitas en clientes.
          </p>
        </div>

        <div className="plans-grid">
          <article className="panel plan-placeholder">
            <span className="showcase-label">Starter</span>
            <strong>Plan inicial</strong>
            <p className="muted">Base simple para profesionales que empiezan a digitalizar su agenda.</p>
          </article>
          <article className="panel plan-placeholder featured">
            <span className="showcase-label">Professional</span>
            <strong>Plan recomendado</strong>
            <p className="muted">La opcion pensada para negocios que buscan imagen y operacion solida.</p>
          </article>
          <article className="panel plan-placeholder">
            <span className="showcase-label">Scale</span>
            <strong>Plan avanzado</strong>
            <p className="muted">Preparado para equipos, mayor volumen y funciones premium.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
