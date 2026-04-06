import type { TenantPublicProfile } from "@/lib/types";

type TenantBookingPageProps = {
  tenant: TenantPublicProfile;
};

export function TenantBookingPage({ tenant }: TenantBookingPageProps) {
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
                  {service.durationMin} min - {service.priceLabel}
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
