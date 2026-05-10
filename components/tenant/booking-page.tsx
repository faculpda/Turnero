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
        description="Primero ingresa con tu cuenta de cliente. Despues vas a poder elegir servicio, profesional y horario en un formulario guiado."
        loginHref={loginHref(tenant, useSlugRoutes)}
        title="Primero ingresa para pedir tu turno"
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
        <span className="eyebrow">Reserva guiada</span>
        <h1>Pide tu turno en {tenant.name}</h1>
        <p className="muted">
          Te vamos guiando paso a paso para que reservar sea facil: primero eliges el servicio, despues el profesional, luego el horario y al final confirmas.
        </p>
        {tenant.paymentSettings?.mercadoPagoEnabled ? (
          <p className="muted">
            Este negocio tiene cobro online con Mercado Pago. Si el servicio tiene precio,
            despues de reservar te vamos a redirigir al checkout para completar el pago.
          </p>
        ) : null}
        <div className="booking-hero-steps">
          <div className="booking-hero-step">
            <span className="eyebrow">Paso 1</span>
            <strong>Elige el servicio</strong>
          </div>
          <div className="booking-hero-step">
            <span className="eyebrow">Paso 2</span>
            <strong>Selecciona horario</strong>
          </div>
          <div className="booking-hero-step">
            <span className="eyebrow">Paso 3</span>
            <strong>Confirma con tranquilidad</strong>
          </div>
        </div>
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

        <article className="panel availability-side-panel">
          <div className="availability-side-intro">
            <h2>Ayuda para reservar</h2>
            <p className="muted">Si es tu primera vez, esta vista te ayuda a entender lo que estas eligiendo antes de confirmar.</p>
          </div>

          <div className="booking-help-list">
            <div className="booking-help-item">
              <strong>Ve de a un paso por vez</strong>
              <p className="muted">El formulario te muestra una sola decision importante a la vez.</p>
            </div>
            <div className="booking-help-item">
              <strong>Revisa el resumen final</strong>
              <p className="muted">Antes de reservar siempre veras servicio, profesional y horario seleccionado.</p>
            </div>
          </div>

          <div className="availability-side-intro">
            <h2>Horarios abiertos ahora</h2>
            <p className="muted">Resumen simple de la disponibilidad actual para ayudarte a elegir mas rapido.</p>
          </div>
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
                  {entry.providerAvailabilities.map((providerAvailability) => (
                    <div
                      className="service-provider-availability"
                      key={providerAvailability.providerId ?? providerAvailability.providerName}
                    >
                      <div className="service-provider-header">
                        <strong>{providerAvailability.providerName}</strong>
                        <span
                          className="badge pending"
                          style={
                            providerAvailability.providerColor
                              ? {
                                  borderColor: `${providerAvailability.providerColor}33`,
                                  backgroundColor: `${providerAvailability.providerColor}12`,
                                  color: providerAvailability.providerColor,
                                }
                              : undefined
                          }
                        >
                          {providerAvailability.slots.length} slots
                        </span>
                      </div>
                      <div className="slot-list">
                        {providerAvailability.slots.slice(0, 4).map((slot) => (
                          <div className="slot" key={slot.startsAt}>
                            {slot.label}
                          </div>
                        ))}
                        {providerAvailability.slots.length === 0 ? (
                          <div className="slot muted">Sin horarios disponibles</div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
