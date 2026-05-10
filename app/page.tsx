import Link from "next/link";
import { notFound } from "next/navigation";
import { TenantPublicHome } from "@/components/tenant/public-home";
import { getTenantBookingDataByHost } from "@/lib/data/tenants";
import { getRequestHost, isPlatformHost } from "@/lib/tenant-context";

export default async function HomePage() {
  const host = await getRequestHost();

  if (host && !isPlatformHost(host)) {
    const bookingData = await getTenantBookingDataByHost(host);

    if (!bookingData) {
      notFound();
    }

    return (
      <TenantPublicHome
        availabilityByService={bookingData.availabilityByService}
        tenant={bookingData.profile}
        useSlugRoutes={false}
      />
    );
  }

  return (
    <main className="shell landing-page landing-page-editorial">
      <section className="landing-hero">
        <div className="hero-topbar landing-topbar">
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

        <div className="landing-hero-grid">
          <div className="landing-hero-copy">
            <span className="eyebrow">Reservas online claras para negocios que quieren convertir mas</span>
            <h1>Haz que pedir un turno sea tan claro que cualquier cliente pueda hacerlo sin ayuda.</h1>
            <p className="muted landing-lead">
              Turnero combina una pagina publica enfocada en reservar con un panel interno simple
              de operar. Menos dudas para el cliente. Menos caos para el negocio. Mas turnos
              confirmados.
            </p>

            <div className="actions landing-hero-actions">
              <Link className="button primary" href="/dentista">
                Ver experiencia completa
              </Link>
              <Link className="button secondary" href="/app?tenant=dentista">
                Explorar panel
              </Link>
            </div>

            <div className="landing-proof-list">
              <span>Reserva paso a paso</span>
              <span>Horarios claros para elegir</span>
              <span>Agenda facil de operar</span>
            </div>
          </div>

          <aside className="landing-hero-visual" aria-label="Vista previa del producto">
            <div className="product-stage">
              <div className="product-stage-panel">
                <div className="product-stage-bar">
                  <span />
                  <span />
                  <span />
                </div>

                <div className="product-stage-heading">
                  <div>
                    <span className="showcase-label">Reserva guiada</span>
                    <strong>Elegir turno</strong>
                  </div>
                  <div className="product-stage-badge">3 pasos</div>
                </div>

                <div className="product-stage-metrics">
                  <div className="product-metric-card product-metric-card-blue">
                    <span className="showcase-label">Paso 1</span>
                    <strong>Servicio</strong>
                    <small>Elegi que necesitas</small>
                  </div>
                  <div className="product-metric-card product-metric-card-green">
                    <span className="showcase-label">Paso 2</span>
                    <strong>Horario</strong>
                    <small>Ve solo opciones reales</small>
                  </div>
                  <div className="product-metric-card product-metric-card-amber">
                    <span className="showcase-label">Paso 3</span>
                    <strong>Confirmacion</strong>
                    <small>Revisa y reserva</small>
                  </div>
                </div>

                <div className="product-stage-columns">
                  <div className="product-day-column">
                    <span className="product-day-label">Lun</span>
                    <div className="product-slot product-slot-strong">
                      <strong>09:00</strong>
                      <span>Limpieza dental</span>
                    </div>
                    <div className="product-slot">
                      <strong>11:30</strong>
                      <span>Consulta inicial</span>
                    </div>
                  </div>

                  <div className="product-day-column product-day-column-accent">
                    <span className="product-day-label">Mar</span>
                    <div className="product-slot product-slot-accent">
                      <strong>10:00</strong>
                      <span>Blanqueamiento</span>
                    </div>
                    <div className="product-slot">
                      <strong>15:30</strong>
                      <span>Control anual</span>
                    </div>
                  </div>

                  <div className="product-day-column">
                    <span className="product-day-label">Mie</span>
                    <div className="product-slot">
                      <strong>08:30</strong>
                      <span>Ortodoncia</span>
                    </div>
                    <div className="product-slot product-slot-soft">
                      <strong>13:00</strong>
                      <span>Horario bloqueado</span>
                    </div>
                  </div>
                </div>

                <div className="product-stage-footer">
                  <div className="product-mini-chart">
                    <span className="showcase-label">Actividad semanal</span>
                    <div className="product-mini-chart-bars" aria-hidden="true">
                      <span className="bar bar-1" />
                      <span className="bar bar-2" />
                      <span className="bar bar-3" />
                      <span className="bar bar-4" />
                      <span className="bar bar-5" />
                      <span className="bar bar-6" />
                    </div>
                  </div>
                  <div className="product-status-list">
                    <div className="product-status-row">
                      <span className="status-dot status-dot-green" />
                      <span>Recordatorios enviados</span>
                    </div>
                    <div className="product-status-row">
                      <span className="status-dot status-dot-blue" />
                      <span>Turnos confirmados</span>
                    </div>
                    <div className="product-status-row">
                      <span className="status-dot status-dot-amber" />
                      <span>Bloqueos aplicados</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="product-floating-card product-floating-booking">
                <span className="showcase-label">Reserva publica</span>
                <strong>Un cliente entiende enseguida que hacer</strong>
                <p>Todo apunta a elegir, avanzar y confirmar el turno sin perderse.</p>
              </div>

              <div className="product-floating-card product-floating-kpi">
                <span className="showcase-label">Resultado</span>
                <strong>Mas turnos concretados</strong>
                <p>Menos friccion para el cliente y menos explicaciones manuales.</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="landing-sectors">
        <span>Consultorios</span>
        <span>Centros de salud</span>
        <span>Estudios profesionales</span>
        <span>Servicios con agenda</span>
      </section>

      <section className="landing-editorial-grid">
        <div className="landing-editorial-intro">
          <span className="eyebrow">Una propuesta comercial clara</span>
          <h2>No hace falta decir mucho cuando el producto se entiende rapido.</h2>
        </div>

        <div className="landing-editorial-points">
          <article className="editorial-point">
            <span className="editorial-point-number">01</span>
            <div>
              <h3>Mas confianza desde la primera visita</h3>
              <p className="muted">
                Una presencia online prolija mejora la percepcion del negocio y ayuda a que el
                cliente avance con mas seguridad.
              </p>
            </div>
          </article>

          <article className="editorial-point">
            <span className="editorial-point-number">02</span>
            <div>
              <h3>Mas conversion sin friccion</h3>
              <p className="muted">
                La reserva publica muestra solo lo necesario para que elegir servicio y horario sea
                rapido y natural.
              </p>
            </div>
          </article>

          <article className="editorial-point">
            <span className="editorial-point-number">03</span>
            <div>
              <h3>Mas control en la operacion diaria</h3>
              <p className="muted">
                El profesional ve sus turnos, sus bloqueos y sus acciones principales en un entorno
                ordenado y facil de usar.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="landing-value-strip">
        <article className="value-strip-card value-strip-card-dark">
          <span className="eyebrow">Captacion</span>
          <h2>Una web de reservas que se siente parte de la marca, no una plantilla generica.</h2>
        </article>

        <article className="value-strip-card">
          <span className="eyebrow">Operacion</span>
          <h2>Un panel donde las decisiones importantes aparecen primero y se entienden mejor.</h2>
        </article>
      </section>

      <section className="landing-outcomes">
        <div className="section-heading landing-outcomes-heading">
          <span className="eyebrow">Lo que vende</span>
          <h2>Beneficios concretos, mostrados con una estetica mas solida.</h2>
        </div>

        <div className="landing-outcomes-grid">
          <article className="outcome-card outcome-card-accent">
            <strong>Imagen profesional</strong>
            <p className="muted">
              Marca, servicios y reservas dentro de una experiencia mucho mas cuidada.
            </p>
          </article>
          <article className="outcome-card outcome-card-success">
            <strong>Agenda centralizada</strong>
            <p className="muted">Turnos, estados, bloqueos y prestadores visibles en un mismo lugar.</p>
          </article>
          <article className="outcome-card outcome-card-warning">
            <strong>Crecimiento ordenado</strong>
            <p className="muted">
              Base lista para cobrar online, sumar prestadores y escalar sin rehacer el sistema.
            </p>
          </article>
        </div>
      </section>

      <section className="closing-cta closing-cta-editorial">
        <div className="closing-cta-copy">
          <span className="eyebrow">Demo lista para mostrar</span>
          <h2>Una presentacion mas atractiva para vender el producto con mas autoridad.</h2>
          <p className="muted">
            Revisa la web publica y el panel interno para ver el recorrido completo desde la
            captacion hasta la gestion diaria.
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
