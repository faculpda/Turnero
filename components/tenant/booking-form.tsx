"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ServiceAvailability } from "@/lib/types";

type TenantBookingFormProps = {
  tenantSlug: string;
  availabilityByService: ServiceAvailability[];
  redirectTo: string;
};

export function TenantBookingForm({
  tenantSlug,
  availabilityByService,
  redirectTo,
}: TenantBookingFormProps) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedAvailability = useMemo(
    () => availabilityByService.find((entry) => entry.service.id === serviceId),
    [availabilityByService, serviceId],
  );

  const selectedProviderAvailability = useMemo(() => {
    if (!selectedAvailability || !providerId) {
      return undefined;
    }

    return selectedAvailability.providerAvailabilities.find(
      (availability) => (availability.providerId ?? "") === providerId,
    );
  }, [providerId, selectedAvailability]);

  const selectedService = selectedAvailability?.service;
  const selectedProviderName = selectedProviderAvailability?.providerName;
  const selectedSlot = selectedProviderAvailability?.slots.find((slot) => slot.startsAt === startsAt);
  const activeStep = !serviceId ? 1 : !providerId ? 2 : !startsAt ? 3 : 4;

  function applyServiceSelection(nextServiceId: string) {
    setServiceId(nextServiceId);
    setProviderId("");
    setStartsAt("");
    setError(null);
  }

  function applyProviderSelection(nextProviderId: string) {
    setProviderId(nextProviderId);
    setStartsAt("");
    setError(null);
  }

  function goBackToService() {
    setProviderId("");
    setStartsAt("");
    setError(null);
  }

  function goBackToProvider() {
    setStartsAt("");
    setError(null);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tenantSlug,
        serviceId,
        providerId: providerId || undefined,
        startsAt,
        redirectTo,
      }),
    });

    const payload = (await response.json()) as {
      ok?: boolean;
      error?: string;
      redirectTo?: string;
      checkoutUrl?: string;
      paymentRequired?: boolean;
    };

    if (!response.ok || !payload.ok) {
      setError(payload.error ?? "No se pudo reservar el turno.");
      setIsSubmitting(false);
      return;
    }

    if (payload.paymentRequired && payload.checkoutUrl) {
      window.location.assign(payload.checkoutUrl);
      return;
    }

    router.push(payload.redirectTo ?? redirectTo);
    router.refresh();
  }

  return (
    <form className="booking-form panel" onSubmit={onSubmit}>
      <div className="booking-stepper">
        {[
          "1. Servicio",
          "2. Profesional",
          "3. Horario",
          "4. Confirmacion",
        ].map((label, index) => (
          <div
            className={`booking-step-pill ${activeStep === index + 1 ? "is-active" : activeStep > index + 1 ? "is-done" : ""}`}
            key={label}
          >
            {label}
          </div>
        ))}
      </div>

      <section className={`booking-step-section ${activeStep === 1 ? "is-current" : ""}`}>
        <div className="booking-step-heading">
          <div>
            <span className="eyebrow">Paso 1</span>
            <h2>Elige el servicio</h2>
            <p className="muted">Primero toca lo que necesitas. Asi te vamos guiando de a una decision por vez.</p>
          </div>
        </div>

        <div className="booking-choice-grid booking-service-grid">
          {availabilityByService.map((entry) => (
            <button
              className={`booking-choice-card ${serviceId === entry.service.id ? "is-selected" : ""}`}
              key={entry.service.id}
              onClick={() => applyServiceSelection(entry.service.id)}
              type="button"
            >
              {entry.service.images && entry.service.images.length > 0 ? (
                <img
                  alt={entry.service.images[0]?.altText ?? entry.service.name}
                  className="booking-choice-image"
                  src={entry.service.images[0]?.url}
                />
              ) : (
                <div className="booking-choice-image booking-choice-image-placeholder">
                  {entry.service.name}
                </div>
              )}
              <div className="booking-choice-copy">
                <strong>{entry.service.name}</strong>
                {entry.service.description ? <p className="muted">{entry.service.description}</p> : null}
                <span className="booking-choice-meta">
                  {entry.service.durationMin} min · {entry.service.priceLabel}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {serviceId ? (
        <section className={`booking-step-section ${activeStep === 2 ? "is-current" : ""}`}>
          <div className="booking-step-heading">
            <div>
              <span className="eyebrow">Paso 2</span>
              <h2>Selecciona el profesional</h2>
              <p className="muted">Ahora elige quien te va a atender con ese servicio.</p>
            </div>
            <button className="button tertiary" onClick={goBackToService} type="button">
              Cambiar servicio
            </button>
          </div>

          <div className="booking-inline-summary">
            <span className="booking-summary-label">Servicio elegido</span>
            <strong>{selectedService?.name}</strong>
            <span className="muted">
              {selectedService?.durationMin} min · {selectedService?.priceLabel}
            </span>
          </div>

          <div className="booking-choice-grid booking-provider-grid">
            {(selectedAvailability?.providerAvailabilities ?? []).map((availability) => (
              <button
                className={`booking-choice-card booking-provider-card ${providerId === (availability.providerId ?? "") ? "is-selected" : ""}`}
                key={availability.providerId ?? availability.providerName}
                onClick={() => applyProviderSelection(availability.providerId ?? "")}
                type="button"
              >
                <div
                  className="booking-provider-badge"
                  style={availability.providerColor ? { color: availability.providerColor } : undefined}
                >
                  {availability.providerName.charAt(0)}
                </div>
                <div className="booking-choice-copy">
                  <strong>{availability.providerName}</strong>
                  <span className="booking-choice-meta">
                    {availability.slots.length > 0
                      ? `${availability.slots.length} horarios disponibles`
                      : "Sin horarios por ahora"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {providerId ? (
        <section className={`booking-step-section ${activeStep === 3 ? "is-current" : ""}`}>
          <div className="booking-step-heading">
            <div>
              <span className="eyebrow">Paso 3</span>
              <h2>Elige el horario</h2>
              <p className="muted">Te mostramos solo horarios realmente disponibles para reservar.</p>
            </div>
            <button className="button tertiary" onClick={goBackToProvider} type="button">
              Cambiar profesional
            </button>
          </div>

          <div className="booking-inline-summary">
            <span className="booking-summary-label">Atencion elegida</span>
            <strong>{selectedProviderName}</strong>
            <span className="muted">{selectedService?.name}</span>
          </div>

          {(selectedProviderAvailability?.slots.length ?? 0) > 0 ? (
            <div className="booking-slot-grid">
              {(selectedProviderAvailability?.slots ?? []).map((slot) => (
                <button
                  className={`booking-slot-button ${startsAt === slot.startsAt ? "is-selected" : ""}`}
                  key={slot.startsAt}
                  onClick={() => setStartsAt(slot.startsAt)}
                  type="button"
                >
                  {slot.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="form-helper">
              No hay horarios disponibles para este profesional con el servicio elegido por ahora.
            </p>
          )}
        </section>
      ) : null}

      {startsAt ? (
        <section className="booking-step-section booking-confirmation-panel is-current">
          <div className="booking-step-heading">
            <div>
              <span className="eyebrow">Paso 4</span>
              <h2>Revisa y confirma tu turno</h2>
              <p className="muted">Antes de reservar, veras un resumen final para confirmar con tranquilidad.</p>
            </div>
          </div>

          <div className="booking-confirmation-grid">
            <div className="booking-confirmation-item">
              <span className="booking-summary-label">Servicio</span>
              <strong>{selectedService?.name}</strong>
            </div>
            <div className="booking-confirmation-item">
              <span className="booking-summary-label">Profesional</span>
              <strong>{selectedProviderName}</strong>
            </div>
            <div className="booking-confirmation-item">
              <span className="booking-summary-label">Horario</span>
              <strong>{selectedSlot?.label}</strong>
            </div>
            <div className="booking-confirmation-item">
              <span className="booking-summary-label">Duracion y valor</span>
              <strong>
                {selectedService?.durationMin} min · {selectedService?.priceLabel}
              </strong>
            </div>
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <button
            className="button primary"
            disabled={
              isSubmitting ||
              !serviceId ||
              !providerId ||
              !startsAt ||
              (selectedProviderAvailability?.slots.length ?? 0) === 0
            }
            type="submit"
          >
            {isSubmitting ? "Procesando..." : "Confirmar turno"}
          </button>
        </section>
      ) : null}

      {!availabilityByService.length ? (
        <p className="form-helper">Todavia no hay servicios disponibles para reservar.</p>
      ) : null}
    </form>
  );
}
