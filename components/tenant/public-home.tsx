import Link from "next/link";
import type { CSSProperties } from "react";
import { SiteBlocksRenderer } from "@/components/tenant/site-blocks-renderer";
import type { TenantPublicProfile } from "@/lib/types";

type TenantPublicHomeProps = {
  tenant: TenantPublicProfile;
  useSlugRoutes?: boolean;
};

function tenantHref(tenant: TenantPublicProfile, path: string, useSlugRoutes: boolean): string {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  return useSlugRoutes ? `/${tenant.slug}${path === "/" ? "" : path}` : path;
}

function buildTenantStyle(tenant: TenantPublicProfile): CSSProperties {
  return {
    ["--tenant-primary" as never]: tenant.primaryColor ?? "#205fc0",
    ["--tenant-secondary" as never]: tenant.secondaryColor ?? "#dff1ff",
  } as CSSProperties;
}

export function TenantPublicHome({
  tenant,
  useSlugRoutes = true,
}: TenantPublicHomeProps) {
  const onlinePaymentEnabled = tenant.paymentSettings?.mercadoPagoEnabled ?? false;
  const bookingHref = tenantHref(tenant, "/reservar", useSlugRoutes);
  const profileLink = tenantHref(tenant, "/ingresar", useSlugRoutes);
  const galleryImages = tenant.services
    .flatMap((service) =>
      (service.images ?? []).map((image) => ({
        id: image.id,
        url: image.url,
        alt: image.altText ?? service.name,
      })),
    )
    .slice(0, 5);

  return (
    <main className="shell grid tenant-public" style={buildTenantStyle(tenant)}>
      <section className="tenant-public-topbar panel">
        <div className="tenant-public-brand-lockup">
          {tenant.logoUrl ? (
            <img alt={tenant.siteTitle ?? tenant.name} className="tenant-logo" src={tenant.logoUrl} />
          ) : (
            <div className="tenant-logo-placeholder">{tenant.name.charAt(0)}</div>
          )}
          <div>
            <strong>{tenant.siteTitle ?? tenant.name}</strong>
            <p className="muted">Reserva online simple y clara</p>
          </div>
        </div>
        <div className="tenant-public-nav">
          <Link className="tenant-public-nav-link" href="#solicitar-turno">
            Solicitar turno
          </Link>
          <Link className="tenant-public-nav-link" href="#galeria">
            Fotos
          </Link>
          <Link className="tenant-public-nav-link" href={profileLink}>
            Mi cuenta
          </Link>
        </div>
      </section>

      <section className="hero tenant-hero tenant-public-banner">
        <div className="tenant-public-banner-copy">
          <span className="eyebrow">Reserva online clara</span>
          <h1>{tenant.headline}</h1>
          <p className="muted hero-copy">{tenant.description}</p>
          <div className="actions">
            <Link className="button primary tenant-primary-button" href="#solicitar-turno">
              {tenant.ctaLabel ?? "Quiero pedir mi turno"}
            </Link>
            <Link className="button secondary" href={profileLink}>
              Mi cuenta
            </Link>
          </div>
        </div>

        <aside className="tenant-public-banner-media">
          {tenant.heroImageUrl ? (
            <img alt={tenant.siteTitle ?? tenant.name} className="tenant-cover" src={tenant.heroImageUrl} />
          ) : (
            <div className="tenant-cover-placeholder">
              <strong>Tu turno, paso a paso</strong>
              <p className="muted">
                Un recorrido pensado para que cualquier persona entienda rapido como reservar.
              </p>
            </div>
          )}
        </aside>
      </section>

      <section className="tenant-public-info-grid">
        <article className="tenant-public-info-card">
          <span className="tenant-step-number">Info 1</span>
          <strong>Elige sin confundirte</strong>
          <p className="muted">Mostramos solo opciones claras para que la reserva se entienda rapido.</p>
        </article>
        <article className="tenant-public-info-card">
          <span className="tenant-step-number">Info 2</span>
          <strong>Horarios reales</strong>
          <p className="muted">Veras solo horarios disponibles para evitar idas y vueltas innecesarias.</p>
        </article>
        <article className="tenant-public-info-card">
          <span className="tenant-step-number">Info 3</span>
          <strong>Confirmacion simple</strong>
          <p className="muted">Antes de terminar revisas tu resumen y confirmas con tranquilidad.</p>
        </article>
      </section>

      <section className="panel tenant-public-booking-showcase" id="solicitar-turno">
        <div className="tenant-public-booking-copy">
          <span className="eyebrow">Formulario para solicitar un turno</span>
          <h2>Lo mas importante del sitio es que puedas reservar sin pedir ayuda.</h2>
          <p className="muted">
            La reserva se hace en pasos cortos: primero eliges el servicio, despues el profesional, luego el horario y al final confirmas.
          </p>

          <div className="tenant-public-booking-checklist">
            <div className="tenant-public-booking-item">
              <strong>Paso 1. Elige el servicio</strong>
              <p className="muted">Cada servicio muestra duracion, valor y una accion clara para avanzar.</p>
            </div>
            <div className="tenant-public-booking-item">
              <strong>Paso 2. Selecciona horario</strong>
              <p className="muted">Solo te mostramos opciones reales para no perder tiempo ni confundirte.</p>
            </div>
            <div className="tenant-public-booking-item">
              <strong>Paso 3. Confirma el turno</strong>
              <p className="muted">Revisas un resumen final y completas la reserva en pocos segundos.</p>
            </div>
          </div>

          <div className="actions">
            <Link className="button primary tenant-primary-button" href={bookingHref}>
              Empezar a reservar
            </Link>
            <Link className="button secondary" href={profileLink}>
              Ya tengo cuenta
            </Link>
          </div>
        </div>

        <div className="tenant-public-booking-preview">
          <div className="tenant-public-preview-card tenant-public-preview-card-primary">
            <span className="tenant-step-number">Paso 1</span>
            <strong>Servicio</strong>
            <p className="muted">Limpieza dental, control o blanqueamiento.</p>
          </div>
          <div className="tenant-public-preview-card">
            <span className="tenant-step-number">Paso 2</span>
            <strong>Profesional y horario</strong>
            <p className="muted">Solo opciones disponibles para reservar ahora.</p>
          </div>
          <div className="tenant-public-preview-card tenant-public-preview-card-soft">
            <span className="tenant-step-number">Paso 3</span>
            <strong>Confirmacion final</strong>
            <p className="muted">Resumen claro antes de terminar.</p>
          </div>
        </div>
      </section>

      <section className="grid cols-2 tenant-public-services-layout">
        <article className="panel">
          <div className="panel-heading-row">
            <div>
              <h2>Servicios para reservar</h2>
              <p className="muted">Todos estan pensados como puerta de entrada directa a la reserva.</p>
            </div>
            <Link className="button secondary" href={bookingHref}>
              Ver formulario
            </Link>
          </div>
          <div className="service-list">
            {tenant.services.map((service) => (
              <div className="service-chip" key={service.id}>
                <div className="service-chip-header">
                  <strong>{service.name}</strong>
                  <span
                    className={`badge ${
                      onlinePaymentEnabled && (service.priceCents ?? 0) > 0
                        ? "approved"
                        : "pending"
                    }`}
                  >
                    {onlinePaymentEnabled && (service.priceCents ?? 0) > 0
                      ? "Pago online"
                      : "Reserva directa"}
                  </span>
                </div>
                {service.description ? (
                  <div className="muted service-description">{service.description}</div>
                ) : null}
                <div className="muted">
                  {service.durationMin} min - {service.priceLabel}
                </div>
                <Link className="button tertiary service-chip-cta" href={bookingHref}>
                  Reservar este servicio
                </Link>
              </div>
            ))}
          </div>
        </article>

        <article className="panel tenant-public-booking-panel">
          <h2>Horarios listos para pedir</h2>
          <p className="muted">Una vista simple para que el cliente entienda que hay disponibilidad real.</p>
          <div className="slot-list">
            {tenant.nextSlots.map((slot) => (
              <div className="slot" key={slot}>
                {slot}
              </div>
            ))}
          </div>
          <Link className="button primary tenant-primary-button" href={bookingHref}>
            Solicitar mi turno
          </Link>
        </article>
      </section>

      <section className="tenant-public-gallery-section" id="galeria">
        <div className="tenant-public-gallery-heading">
          <span className="eyebrow">Galeria</span>
          <h2>Un poco mas de contexto visual antes de reservar</h2>
        </div>

        <div className="tenant-public-gallery-grid">
          {galleryImages.length > 0 ? (
            <>
              <div className="tenant-public-gallery-main">
                <img
                  alt={galleryImages[0]?.alt}
                  className="tenant-public-gallery-image"
                  src={galleryImages[0]?.url}
                />
              </div>
              <div className="tenant-public-gallery-stack">
                {galleryImages.slice(1).map((image) => (
                  <div className="tenant-public-gallery-tile" key={image.id}>
                    <img alt={image.alt} className="tenant-public-gallery-image" src={image.url} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="panel">
              <p className="muted">Aqui puedes mostrar imagenes del negocio o de los servicios para generar mas confianza.</p>
            </div>
          )}
        </div>
      </section>

      <SiteBlocksRenderer blocks={tenant.siteBlocks} tenant={tenant} useSlugRoutes={useSlugRoutes} />
    </main>
  );
}
