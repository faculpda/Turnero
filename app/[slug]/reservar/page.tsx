import { notFound } from "next/navigation";
import { getPublicTenantProfile } from "@/lib/tenant";

type BookingPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function BookingPage({ params }: BookingPageProps) {
  const { slug } = await params;
  const tenant = getPublicTenantProfile(slug);

  if (!tenant) {
    notFound();
  }

  return (
    <main className="shell grid">
      <section className="hero">
        <span className="eyebrow">Flujo de reserva</span>
        <h1>Reservar en {tenant.name}</h1>
        <p className="muted">
          Esta pantalla representa el siguiente paso del MVP: seleccionar servicio,
          fecha, horario y confirmar el turno.
        </p>
      </section>

      <section className="grid cols-2">
        <article className="panel">
          <h2>1. Elegir servicio</h2>
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
          <h2>2. Elegir horario</h2>
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
