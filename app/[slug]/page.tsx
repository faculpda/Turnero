import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicTenantProfile } from "@/lib/tenant";

type TenantPublicPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function TenantPublicPage({ params }: TenantPublicPageProps) {
  const { slug } = await params;
  const tenant = getPublicTenantProfile(slug);

  if (!tenant) {
    notFound();
  }

  return (
    <main className="shell grid">
      <section className="hero spotlight">
        <span className="eyebrow">Reserva publica</span>
        <h1>{tenant.name}</h1>
        <p className="muted">{tenant.description}</p>
        <div className="actions">
          <Link className="button primary" href={`/${tenant.slug}/reservar`}>
            Reservar turno
          </Link>
          <Link className="button secondary" href={`/${tenant.slug}/mi-perfil`}>
            Ver mi perfil
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
                  {service.durationMin} min · {service.priceLabel}
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
