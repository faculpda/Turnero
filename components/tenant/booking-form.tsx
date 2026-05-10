"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { BookingSlot, ServiceAvailability } from "@/lib/types";

type TenantBookingFormProps = {
  tenantSlug: string;
  availabilityByService: ServiceAvailability[];
  redirectTo: string;
};

type SlotGroup = {
  key: string;
  label: string;
  slots: BookingSlot[];
};

function buildSlotGroups(slots: BookingSlot[]): SlotGroup[] {
  const formatter = new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  const groups = new Map<string, SlotGroup>();

  for (const slot of slots) {
    const date = new Date(slot.startsAt);
    const key = date.toISOString().slice(0, 10);
    const label = formatter.format(date).replace(".", "");

    if (!groups.has(key)) {
      groups.set(key, { key, label, slots: [] });
    }

    groups.get(key)?.slots.push(slot);
  }

  return Array.from(groups.values());
}

export function TenantBookingForm({
  tenantSlug,
  availabilityByService,
  redirectTo,
}: TenantBookingFormProps) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
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

  const slotGroups = useMemo(
    () => buildSlotGroups(selectedProviderAvailability?.slots ?? []),
    [selectedProviderAvailability],
  );

  const selectedDayGroup = slotGroups.find((group) => group.key === selectedDay);
  const selectedService = selectedAvailability?.service;
  const selectedProviderName = selectedProviderAvailability?.providerName;
  const selectedSlot = selectedDayGroup?.slots.find((slot) => slot.startsAt === startsAt);
  const activeStep = !serviceId ? 1 : !providerId ? 2 : !selectedDay ? 3 : !startsAt ? 4 : 5;

  function applyServiceSelection(nextServiceId: string) {
    setServiceId(nextServiceId);
    setProviderId("");
    setSelectedDay("");
    setStartsAt("");
    setError(null);
  }

  function applyProviderSelection(nextProviderId: string) {
    setProviderId(nextProviderId);
    setSelectedDay("");
    setStartsAt("");
    setError(null);
  }

  function applyDaySelection(nextDay: string) {
    setSelectedDay(nextDay);
    setStartsAt("");
    setError(null);
  }

  function goBackToService() {
    setProviderId("");
    setSelectedDay("");
    setStartsAt("");
    setError(null);
  }

  function goBackToProvider() {
    setSelectedDay("");
    setStartsAt("");
    setError(null);
  }

  function goBackToDay() {
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
    <form className="booking-form panel booking-wizard-form" onSubmit={onSubmit}>
      <div className="booking-wizard-header">
        <span className="eyebrow">Solicitud guiada</span>
        <h2>Solicitar un turno</h2>
        <p className="muted">Vamos paso a paso para que reservar sea claro y muy facil de entender.</p>
      </div>

      <div className="booking-progress-grid" aria-label="Progreso de la reserva">
        {[
          "Servicio",
          "Profesional",
          "Dia",
          "Horario",
          "Confirmar",
        ].map((label, index) => (
          <div
            className={`booking-progress-step ${activeStep === index + 1 ? "is-active" : activeStep > index + 1 ? "is-done" : ""}`}
            key={label}
          >
            <span className="booking-progress-number">{index + 1}</span>
            <strong>{label}</strong>
          </div>
        ))}
      </div>

      <section className={`booking-question-card ${activeStep === 1 ? "is-current" : ""}`}>
        <div className="booking-question-header">
          <div>
            <span className="eyebrow">Paso 1</span>
            <h3>¿Que servicio necesitas?</h3>
            <p className="muted">Elige una opcion para continuar.</p>
          </div>
        </div>

        <div className="booking-service-choice-list">
          {availabilityByService.map((entry) => (
            <button
              className={`booking-large-option ${serviceId === entry.service.id ? "is-selected" : ""}`}
              key={entry.service.id}
              onClick={() => applyServiceSelection(entry.service.id)}
              type="button"
            >
              <div className="booking-large-option-copy">
                <strong>{entry.service.name}</strong>
                {entry.service.description ? <span className="muted">{entry.service.description}</span> : null}
                <span className="booking-large-option-meta">
                  {entry.service.durationMin} min · {entry.service.priceLabel}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {serviceId ? (
        <section className={`booking-question-card ${activeStep === 2 ? "is-current" : ""}`}>
          <div className="booking-question-header">
            <div>
              <span className="eyebrow">Paso 2</span>
              <h3>¿Con quien quieres atenderte?</h3>
              <p className="muted">Primero te mostramos las opciones disponibles para el servicio elegido.</p>
            </div>
            <button className="button tertiary" onClick={goBackToService} type="button">
              Volver
            </button>
          </div>

          <div className="booking-inline-summary">
            <span className="booking-summary-label">Servicio elegido</span>
            <strong>{selectedService?.name}</strong>
            <span className="muted">
              {selectedService?.durationMin} min · {selectedService?.priceLabel}
            </span>
          </div>

          <div className="booking-provider-choice-list">
            {(selectedAvailability?.providerAvailabilities ?? []).map((availability) => (
              <button
                className={`booking-large-option booking-provider-option ${providerId === (availability.providerId ?? "") ? "is-selected" : ""}`}
                key={availability.providerId ?? availability.providerName}
                onClick={() => applyProviderSelection(availability.providerId ?? "")}
                type="button"
              >
                <span
                  className="booking-provider-dot"
                  style={availability.providerColor ? { backgroundColor: availability.providerColor } : undefined}
                />
                <div className="booking-large-option-copy">
                  <strong>{availability.providerName}</strong>
                  <span className="muted">
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
        <section className={`booking-question-card ${activeStep === 3 ? "is-current" : ""}`}>
          <div className="booking-question-header">
            <div>
              <span className="eyebrow">Paso 3</span>
              <h3>¿Que dia prefieres?</h3>
              <p className="muted">Selecciona un dia con disponibilidad para ver sus horarios.</p>
            </div>
            <button className="button tertiary" onClick={goBackToProvider} type="button">
              Volver
            </button>
          </div>

          <div className="booking-inline-summary">
            <span className="booking-summary-label">Atencion elegida</span>
            <strong>{selectedProviderName}</strong>
            <span className="muted">{selectedService?.name}</span>
          </div>

          <div className="booking-day-grid">
            {slotGroups.map((group) => (
              <button
                className={`booking-day-card ${selectedDay === group.key ? "is-selected" : ""}`}
                key={group.key}
                onClick={() => applyDaySelection(group.key)}
                type="button"
              >
                <span className="booking-day-card-label">{group.label}</span>
                <strong>{group.slots.length} horarios</strong>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {selectedDay ? (
        <section className={`booking-question-card ${activeStep === 4 ? "is-current" : ""}`}>
          <div className="booking-question-header">
            <div>
              <span className="eyebrow">Paso 4</span>
              <h3>¿Que horario te queda mejor?</h3>
              <p className="muted">Toca el horario que prefieras para seguir a la confirmacion.</p>
            </div>
            <button className="button tertiary" onClick={goBackToDay} type="button">
              Volver
            </button>
          </div>

          <div className="booking-time-layout">
            <div className="booking-time-day-panel">
              <span className="booking-summary-label">Dia seleccionado</span>
              <strong>{selectedDayGroup?.label}</strong>
              <p className="muted">Estos son los horarios disponibles para esa fecha.</p>
            </div>

            <div className="booking-time-grid">
              {selectedDayGroup?.slots.map((slot) => (
                <button
                  className={`booking-time-chip ${startsAt === slot.startsAt ? "is-selected" : ""}`}
                  key={slot.startsAt}
                  onClick={() => setStartsAt(slot.startsAt)}
                  type="button"
                >
                  {slot.label.split(" - ").at(-1) ?? slot.label}
                </button>
              ))}
            </div>
          </div>

          <div className="booking-tip-box">
            <strong>Tip:</strong> confirma tu turno solo cuando estes seguro del horario elegido.
          </div>
        </section>
      ) : null}

      {startsAt ? (
        <section className="booking-question-card booking-confirmation-panel is-current">
          <div className="booking-question-header">
            <div>
              <span className="eyebrow">Paso 5</span>
              <h3>Revisa y confirma tu turno</h3>
              <p className="muted">Este es el resumen final antes de reservar.</p>
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
              <span className="booking-summary-label">Dia</span>
              <strong>{selectedDayGroup?.label}</strong>
            </div>
            <div className="booking-confirmation-item">
              <span className="booking-summary-label">Horario</span>
              <strong>{selectedSlot?.label.split(" - ").at(-1) ?? selectedSlot?.label}</strong>
            </div>
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="booking-confirmation-actions">
            <button className="button primary booking-submit-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Procesando..." : "Confirmar turno"}
            </button>
            <button className="button tertiary" onClick={goBackToDay} type="button">
              Volver
            </button>
          </div>
        </section>
      ) : null}

      {!availabilityByService.length ? (
        <p className="form-helper">Todavia no hay servicios disponibles para reservar.</p>
      ) : null}
    </form>
  );
}
