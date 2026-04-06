import Link from "next/link";
import { AccessDenied } from "@/components/auth/access-denied";
import { SessionBanner } from "@/components/auth/session-banner";
import { TenantBookingForm } from "@/components/tenant/booking-form";
import type { AuthSession } from "@/lib/auth/session";
import type { ServiceAvailability, TenantPublicProfile } from "@/lib/types";

type TenantBookingPageProps = {
  tenant: TenantPublicProfile;
  availabilityByService: ServiceAvailability[];
  customerSession: AuthSession | null;
  useSlugRoutes?: boolean;
};

function loginHref(tenant: TenantPublicProfile, useSlugRoutes: boolean): string {
  return useSlugRoutes ? `/${tenant.slug}/ingresar` : "/ingresar";
}

function profileHref(tenant: TenantPublicProfile, useSlugRoutes: boolean): string {
  return useSlugRoutes ? `/${tenant.slug}/mi-perfil` : "/mi-perfil";
}

export function TenantBookingPage({
  tenant,
  availabilityByService,
  customerSession,
  useSlugRoutes = true,
}: TenantBookingPageProps) {
  const onlinePaymentEnabled = tenant.paymentSettings?.mercadoPagoEnabled ?? false;

  if (!customerSession || customerSession.globalRole !== "CUSTOMER") {
    return (
      <AccessDenied
        description="Para confirmar un turno primero necesitamos que ingreses con tu cuenta de cliente."
        loginHref={loginHref(tenant, useSlugRoutes)}
        title="Reserva disponible para clientes autenticados"
      />
    );
  }

  return (
    <main className="shell grid">
      <SessionBanner
        session={customerSession}
        subtitle={`Reserva online para ${tenant.name}`}
      />

      <section className="hero">
        <span className="eyebrow">Flujo de reserva</span>
        <h1>Reservar en {tenant.name}</h1>
        <p className="muted">
          Elige el servicio, selecciona un horario disponible y confirma tu turno.
        </p>
        {tenant.paymentSettings?.mercadoPagoEnabled ? (
          <p className="muted">
            Este negocio tiene cobro online con Mercado Pago. Si el servicio tiene precio,
            despues de reservar te vamos a redirigir al checkout para completar el pago.
          </p>
        ) : null}
        <div className="actions">
          <Link className="button secondary" href={profileHref(tenant, useSlugRoutes)}>
            Ver mis turnos
          </Link>
        </div>
      </section>

      <section className="grid cols-2">
        <TenantBookingForm
          availabilityByService={availabilityByService}
          redirectTo={profileHref(tenant, useSlugRoutes)}
          tenantSlug={tenant.slug}
        />

        <article className="panel">
          <h2>Disponibilidad</h2>
          <p className="muted">Resumen de slots abiertos para las proximas reservas.</p>
          <div className="availability-list">
            {availabilityByService.map((entry) => (
              <div className="availability-card" key={entry.service.id}>
                <div className="service-chip-header">
                  <strong>{entry.service.name}</strong>
                  <span
                    className={`badge ${
                      onlinePaymentEnabled && (entry.service.priceCents ?? 0) > 0
                        ? "approved"
                        : "pending"
                    }`}
                  >
                    {onlinePaymentEnabled && (entry.service.priceCents ?? 0) > 0
                      ? "Pago online"
                      : "Sin pago online"}
                  </span>
                </div>
                <div className="muted">
                  {entry.service.durationMin} min - {entry.service.priceLabel}
                </div>
                {entry.service.images && entry.service.images.length > 0 ? (
                  <div className="service-image-grid">
                    {entry.service.images.map((image) => (
                      <img
                        alt={image.altText ?? entry.service.name}
                        className="service-image-thumb"
                        key={image.id}
                        src={image.url}
                      />
                    ))}
                  </div>
                ) : null}
                <div className="slot-list">
                  {entry.slots.slice(0, 4).map((slot) => (
                    <div className="slot" key={slot.startsAt}>
                      {slot.label}
                    </div>
                  ))}
                  {entry.slots.length === 0 ? (
                    <div className="slot muted">Sin horarios disponibles</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
