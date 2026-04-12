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
          <div className="hero-sales-copy">
            <span className="eyebrow">Mas reservas. Menos desorden.</span>
            <h1>La agenda online que hace ver tu negocio mas profesional desde el primer clic.</h1>
            <p className="muted hero-copy">
              Convierte visitas en turnos confirmados con una experiencia clara, moderna y lista
              para vender. Turnero unifica pagina publica, reservas online, agenda y gestion diaria
              en un solo sistema.
            </p>
            <div className="actions hero-sales-actions">
              <Link className="button primary" href="/dentista">
                Quiero ver como se reserva
              </Link>
              <Link className="button secondary" href="/app?tenant=dentista">
                Ver panel del negocio
              </Link>
            </div>
            <div className="hero-proof-row">
              <span>Reserva online 24/7</span>
              <span>Imagen profesional</span>
              <span>Agenda simple de operar</span>
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
                  <span className="showcase-label">Turnos tomados</span>
                  <strong>124</strong>
                </div>
                <div className="showcase-stat">
                  <span className="showcase-label">Confirmados</span>
                  <strong>87%</strong>
                </div>
              </div>
              <div className="showcase-list">
                <div className="showcase-focus-card">
                  <span className="showcase-label">Hoy</span>
                  <strong>12 reservas activas</strong>
                  <p>Todo visible en una agenda clara, lista para atender.</p>
                </div>
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
                <span className="showcase-label">Captacion</span>
                <strong>Tu pagina lista para reservar</strong>
              </div>
              <div className="showcase-card compact">
                <span className="showcase-label">Gestion</span>
                <strong>Tu agenda siempre ordenada</strong>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="panel marketing-band">
        <div className="marketing-band-copy">
          <span className="eyebrow">Pensado para vender mejor</span>
          <h2>Menos explicaciones. Mas turnos concretados.</h2>
          <p className="muted">
            La propuesta comercial es simple: una presencia online prolija para tus clientes y una
            agenda mucho mas clara para tu equipo.
          </p>
        </div>
        <div className="marketing-band-points">
          <strong>Mas confianza</strong>
          <strong>Mas conversion</strong>
          <strong>Mas orden diario</strong>
        </div>
      </section>

      <section className="marketing-grid">
        <article className="metric marketing-card marketing-card-primary">
          <span className="eyebrow">Reservas</span>
          <h2>Una pagina que invita a reservar, no a dudar.</h2>
          <p className="muted">
            Servicios claros, horarios visibles y una accion concreta para convertir visitas en
            turnos.
          </p>
        </article>
        <article className="metric marketing-card">
          <span className="eyebrow">Operacion</span>
          <h2>Un panel simple para atender, confirmar y reprogramar.</h2>
          <p className="muted">
            Todo pensado para que el profesional vea rapido su dia y tome decisiones sin perder
            tiempo.
          </p>
        </article>
        <article className="metric marketing-card">
          <span className="eyebrow">Escala</span>
          <h2>Una base profesional lista para crecer con tu negocio.</h2>
          <p className="muted">
            Multi-tenant, cobros online, prestadores y marca propia dentro de una sola plataforma.
          </p>
        </article>
      </section>

      <section className="panel narrative-band narrative-band-sales">
        <div className="section-heading">
          <span className="eyebrow">Por que se entiende rapido</span>
          <h2>Lo justo y necesario para que un negocio diga: esto me sirve.</h2>
          <p className="muted">
            Sin exceso de informacion, sin ruido visual y con una promesa concreta: ayudarte a
            vender mejor y organizar mejor los turnos.
          </p>
        </div>
        <div className="steps-grid">
          <div className="step-item">
            <strong>1. Mostras una imagen profesional</strong>
            <p className="muted">Tu negocio se presenta mejor y transmite mas confianza.</p>
          </div>
          <div className="step-item">
            <strong>2. El cliente reserva mas facil</strong>
            <p className="muted">Encuentra rapido lo que necesita y concreta el turno online.</p>
          </div>
          <div className="step-item">
            <strong>3. Vos operas con mas claridad</strong>
            <p className="muted">La agenda diaria queda centralizada y lista para trabajar.</p>
          </div>
        </div>
      </section>

      <section className="panel closing-cta">
        <div className="closing-cta-copy">
          <span className="eyebrow">Listo para mostrar</span>
          <h2>Una demo clara hoy. Un sistema vendible mañana.</h2>
          <p className="muted">
            Explora la experiencia completa y revisa como se ve tanto la reserva publica como el
            panel interno del negocio.
          </p>
        </div>
        <div className="actions">
          <Link className="button primary" href="/dentista">
            Ver demo comercial
          </Link>
          <Link className="button secondary" href="/admin/login">
            Ingresar al sistema
          </Link>
        </div>
      </section>
    </main>
  );
}
