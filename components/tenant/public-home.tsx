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
  const onlinePaymentEnabled = tenant.paymentSettings?.mercadoPagoEnabled ?? false;

  return (
    <main className="shell grid tenant-public" style={buildTenantStyle(tenant)}>
      <section className="hero tenant-hero">
        <div className="tenant-hero-grid">
          <div>
            <div className="tenant-brand-row">
              {tenant.logoUrl ? (
                <img alt={tenant.siteTitle ?? tenant.name} className="tenant-logo" src={tenant.logoUrl} />
              ) : (
                <div className="tenant-logo-placeholder">{tenant.name.charAt(0)}</div>
              )}
              <div>
                <span className="eyebrow">Sitio del cliente</span>
                <strong>{tenant.siteTitle ?? tenant.name}</strong>
              </div>
            </div>

            <h1>{tenant.headline}</h1>
            <p className="muted hero-copy">{tenant.description}</p>
            <div className="actions">
              <Link className="button primary tenant-primary-button" href={tenantHref(tenant, "/reservar", useSlugRoutes)}>
                {tenant.ctaLabel ?? "Reservar turno"}
              </Link>
              <Link className="button secondary" href={tenantHref(tenant, "/ingresar", useSlugRoutes)}>
                Ingresar a mi perfil
              </Link>
            </div>
          </div>

          <aside className="tenant-hero-media">
            {tenant.heroImageUrl ? (
              <img alt={tenant.siteTitle ?? tenant.name} className="tenant-cover" src={tenant.heroImageUrl} />
            ) : (
              <div className="tenant-cover-placeholder">
                <strong>{tenant.siteTitle ?? tenant.name}</strong>
                <p className="muted">
                  Este espacio puede personalizarse con imagen, logo, colores y textos propios.
                </p>
              </div>
            )}
          </aside>
        </div>
      </section>

      <section className="grid cols-2">
        <article className="panel">
          <h2>Servicios disponibles</h2>
          <p className="muted">Cada servicio puede tener su propia duracion y valor en pesos.</p>
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
                {service.images && service.images.length > 0 ? (
                  <div className="service-image-grid">
                    {service.images.map((image) => (
                      <img
                        alt={image.altText ?? service.name}
                        className="service-image-thumb"
                        key={image.id}
                        src={image.url}
                      />
                    ))}
                  </div>
                ) : null}
                <div className="muted">
                  {service.durationMin} min - {service.priceLabel}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Proximos horarios</h2>
          <p className="muted">La reserva sigue siendo el eje central de toda la experiencia.</p>
          <div className="slot-list">
            {tenant.nextSlots.map((slot) => (
              <div className="slot" key={slot}>
                {slot}
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
