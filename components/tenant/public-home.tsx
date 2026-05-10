import Link from "next/link";
import type { CSSProperties } from "react";
import { TenantBookingForm } from "@/components/tenant/booking-form";
import type { ServiceAvailability, TenantPublicProfile } from "@/lib/types";

type TenantPublicHomeProps = {
  tenant: TenantPublicProfile;
  availabilityByService: ServiceAvailability[];
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
  availabilityByService,
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
        <article className="tenant-public-info-card tenant-public-info-card-speed">
          <div className="tenant-public-info-icon" aria-hidden="true">
            <svg fill="none" viewBox="0 0 24 24">
              <path
                d="M12 6V12L16 14M20 12A8 8 0 1 1 4 12A8 8 0 0 1 20 12Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </div>
          <strong>Rapidez real</strong>
          <p className="muted">Un recorrido claro para pedir turno sin confundirte.</p>
        </article>
        <article className="tenant-public-info-card tenant-public-info-card-trust">
          <div className="tenant-public-info-icon" aria-hidden="true">
            <svg fill="none" viewBox="0 0 24 24">
              <path
                d="M12 3L18.5 5.5V10.5C18.5 14.6 15.85 18.42 12 19.5C8.15 18.42 5.5 14.6 5.5 10.5V5.5L12 3Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
              <path
                d="M9.5 11.8L11.2 13.5L14.8 9.9"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </div>
          <strong>Seguridad y claridad</strong>
          <p className="muted">Solo vas a ver horarios realmente disponibles.</p>
        </article>
        <article className="tenant-public-info-card tenant-public-info-card-simple">
          <div className="tenant-public-info-icon" aria-hidden="true">
            <svg fill="none" viewBox="0 0 24 24">
              <path
                d="M6.5 6.5H17.5M6.5 12H17.5M6.5 17.5H12.5M5 3.5H19C19.83 3.5 20.5 4.17 20.5 5V19C20.5 19.83 19.83 20.5 19 20.5H5C4.17 20.5 3.5 19.83 3.5 19V5C3.5 4.17 4.17 3.5 5 3.5Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </div>
          <strong>Confirmacion simple</strong>
          <p className="muted">Revisas tu seleccion y confirmas con tranquilidad.</p>
        </article>
      </section>

      <section className="panel tenant-public-booking-showcase" id="solicitar-turno">
        <div className="tenant-public-booking-preview">
          <TenantBookingForm
            availabilityByService={availabilityByService}
            redirectTo={profileLink}
            tenantSlug={tenant.slug}
          />
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
