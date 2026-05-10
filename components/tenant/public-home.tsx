import Link from "next/link";
import type { CSSProperties } from "react";
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
          <Link className="tenant-public-nav-link" href="#contacto">
            Contacto
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

      <section className="tenant-public-info-grid" id="contacto">
        <article className="tenant-public-info-card">
          <strong>Reserva facil</strong>
          <p className="muted">Un recorrido claro para pedir turno sin confundirte.</p>
        </article>
        <article className="tenant-public-info-card">
          <strong>Horarios reales</strong>
          <p className="muted">Solo vas a ver horarios realmente disponibles.</p>
        </article>
        <article className="tenant-public-info-card">
          <strong>Confirmacion simple</strong>
          <p className="muted">Revisas tu seleccion y confirmas con tranquilidad.</p>
        </article>
      </section>

      <section className="panel tenant-public-booking-showcase" id="solicitar-turno">
        <div className="tenant-public-booking-copy">
          <span className="eyebrow">Formulario para solicitar un turno</span>
          <h2>Lo principal de esta pagina es que puedas solicitar tu turno.</h2>
          <p className="muted">
            Vas a avanzar paso a paso: eliges servicio, profesional, dia, horario y al final confirmas.
          </p>

          <div className="tenant-public-booking-checklist">
            <div className="tenant-public-booking-item">
              <strong>Paso 1</strong>
              <p className="muted">Elige el servicio.</p>
            </div>
            <div className="tenant-public-booking-item">
              <strong>Paso 2</strong>
              <p className="muted">Selecciona dia y horario.</p>
            </div>
            <div className="tenant-public-booking-item">
              <strong>Paso 3</strong>
              <p className="muted">Confirma tu turno.</p>
            </div>
          </div>

          <div className="actions tenant-public-booking-actions">
            <Link className="button primary tenant-primary-button" href={bookingHref}>
              Solicitar un turno
            </Link>
            <Link className="button secondary" href={profileLink}>
              Ya tengo cuenta
            </Link>
          </div>
        </div>

        <div className="tenant-public-booking-preview">
          <div className="tenant-public-form-placeholder">
            <strong>Formulario para solicitar un turno</strong>
          </div>
        </div>
      </section>

      <section className="tenant-public-gallery-section" id="galeria">
        <div className="tenant-public-gallery-heading">
          <span className="eyebrow">Galeria</span>
          <h2>Galeria de fotos</h2>
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
    </main>
  );
}
