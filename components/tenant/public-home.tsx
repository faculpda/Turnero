import Link from "next/link";
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

export function TenantPublicHome({
  tenant,
  useSlugRoutes = true,
}: TenantPublicHomeProps) {
  return (
    <main className="shell grid">
      <section className="hero spotlight">
        <span className="eyebrow">Reserva publica</span>
        <h1>{tenant.name}</h1>
        <p className="muted">{tenant.description}</p>
        <div className="actions">
          <Link className="button primary" href={tenantHref(tenant, "/reservar", useSlugRoutes)}>
            Reservar turno
          </Link>
          <Link className="button secondary" href={tenantHref(tenant, "/ingresar", useSlugRoutes)}>
            Ingresar a mi perfil
          </Link>
          <Link className="button secondary" href={tenantHref(tenant, "/mi-perfil", useSlugRoutes)}>
            Ver area privada
          </Link>
        </div>
      </section>

      <section className="grid cols-2">
        <article className="panel">
          <h2>Servicios disponibles</h2>
          <p className="muted">El cliente final puede elegir el tipo de turno desde aqui.</p>
          <div className="service-list">
            {tenant.services.map((service) => (
              <div className="service-chip" key={service.id}>
                <strong>{service.name}</strong>
                <div className="muted">
                  {service.durationMin} min - {service.priceLabel}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Proximos horarios</h2>
          <p className="muted">Muestra de slots disponibles para el flujo de reservas.</p>
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
