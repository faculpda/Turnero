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
  const heroGridClass =
    tenant.heroLayout === "image-left" ? "tenant-hero-grid tenant-hero-grid-image-left" : "tenant-hero-grid";
  const bookingHref = tenantHref(tenant, "/reservar", useSlugRoutes);
  const profileLink = tenantHref(tenant, "/ingresar", useSlugRoutes);

  return (
    <main className="shell grid tenant-public" style={buildTenantStyle(tenant)}>
      <section className="hero tenant-hero">
        <div className={heroGridClass}>
          <div>
            <div className="tenant-brand-row">
              {tenant.logoUrl ? (
                <img alt={tenant.siteTitle ?? tenant.name} className="tenant-logo" src={tenant.logoUrl} />
              ) : (
                <div className="tenant-logo-placeholder">{tenant.name.charAt(0)}</div>
              )}
              <div>
                <span className="eyebrow">Reserva online clara</span>
                <strong>{tenant.siteTitle ?? tenant.name}</strong>
              </div>
            </div>

            <h1>{tenant.headline}</h1>
            <p className="muted hero-copy">{tenant.description}</p>
            <div className="actions">
              <Link className="button primary tenant-primary-button" href={bookingHref}>
                {tenant.ctaLabel ?? "Quiero pedir mi turno"}
              </Link>
              <Link className="button secondary" href={profileLink}>
                Ingresar a mi perfil
              </Link>
            </div>

            <div className="tenant-public-steps">
              <article className="tenant-public-step-card">
                <span className="tenant-step-number">Paso 1</span>
                <strong>Elegi el servicio</strong>
                <p className="muted">Mira opciones simples y toca la que mejor se adapte a lo que necesitas.</p>
              </article>
              <article className="tenant-public-step-card">
                <span className="tenant-step-number">Paso 2</span>
                <strong>Selecciona profesional y horario</strong>
                <p className="muted">Te mostramos solo horarios realmente disponibles para evitar confusiones.</p>
              </article>
              <article className="tenant-public-step-card">
                <span className="tenant-step-number">Paso 3</span>
                <strong>Confirma tu turno</strong>
                <p className="muted">Revisas un resumen claro y confirmas en pocos segundos.</p>
              </article>
            </div>
          </div>

          <aside className="tenant-hero-media">
            {tenant.heroImageUrl ? (
              <img alt={tenant.siteTitle ?? tenant.name} className="tenant-cover" src={tenant.heroImageUrl} />
            ) : (
              <div className="tenant-cover-placeholder">
                <strong>Tu turno, paso a paso</strong>
                <p className="muted">
                  Este espacio se adapta para que pedir turno sea rapido, claro y facil de entender.
                </p>
              </div>
            )}
          </aside>
        </div>
      </section>

      <SiteBlocksRenderer blocks={tenant.siteBlocks} tenant={tenant} useSlugRoutes={useSlugRoutes} />

      <section className="grid cols-2">
        <article className="panel">
          <div className="panel-heading-row">
            <div>
              <h2>Elegi lo que necesitas</h2>
              <p className="muted">Cada opcion te lleva despues al formulario guiado para pedir el turno.</p>
            </div>
            <Link className="button secondary" href={bookingHref}>
              Empezar reserva
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
                <Link className="button tertiary service-chip-cta" href={bookingHref}>
                  Quiero este servicio
                </Link>
              </div>
            ))}
          </div>
        </article>

        <article className="panel tenant-public-booking-panel">
          <h2>Horarios que puedes pedir hoy</h2>
          <p className="muted">La reserva esta pensada para que avances sin dudas y sepas siempre que toca hacer.</p>
          <div className="tenant-public-booking-checklist">
            <div className="tenant-public-booking-item">
              <strong>Formulario por pasos</strong>
              <p className="muted">No necesitas completar todo de una vez. Vas eligiendo una cosa por vez.</p>
            </div>
            <div className="tenant-public-booking-item">
              <strong>Resumen antes de confirmar</strong>
              <p className="muted">Antes de reservar ves servicio, profesional y horario seleccionado.</p>
            </div>
          </div>
          <div className="slot-list">
            {tenant.nextSlots.map((slot) => (
              <div className="slot" key={slot}>
                {slot}
              </div>
            ))}
          </div>
          <Link className="button primary tenant-primary-button" href={bookingHref}>
            Ver horarios disponibles
          </Link>
        </article>
      </section>
    </main>
  );
}
