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
  const firstService = availabilityByService[0];
  const firstProvider = firstService?.providerAvailabilities[0];
  const firstSlot = firstProvider?.slots[0];

  const [serviceId, setServiceId] = useState(firstService?.service.id ?? "");
  const [providerId, setProviderId] = useState(firstProvider?.providerId ?? "");
  const [startsAt, setStartsAt] = useState(firstSlot?.startsAt ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedAvailability = useMemo(
    () => availabilityByService.find((entry) => entry.service.id === serviceId),
    [availabilityByService, serviceId],
  );

  const selectedProviderAvailability = useMemo(() => {
    if (!selectedAvailability) {
      return undefined;
    }

    if (!providerId) {
      return selectedAvailability.providerAvailabilities[0];
    }

    return selectedAvailability.providerAvailabilities.find(
      (availability) => availability.providerId === providerId,
    );
  }, [providerId, selectedAvailability]);

  function applyServiceSelection(nextServiceId: string) {
    const nextServiceAvailability = availabilityByService.find(
      (entry) => entry.service.id === nextServiceId,
    );
    const nextProviderAvailability = nextServiceAvailability?.providerAvailabilities[0];

    setServiceId(nextServiceId);
    setProviderId(nextProviderAvailability?.providerId ?? "");
    setStartsAt(nextProviderAvailability?.slots[0]?.startsAt ?? "");
    setError(null);
  }

  function applyProviderSelection(nextProviderId: string) {
    const nextProviderAvailability =
      selectedAvailability?.providerAvailabilities.find(
        (availability) => (availability.providerId ?? "") === nextProviderId,
      ) ?? selectedAvailability?.providerAvailabilities[0];

    setProviderId(nextProviderId);
    setStartsAt(nextProviderAvailability?.slots[0]?.startsAt ?? "");
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
      <div className="field">
        <span>Servicio</span>
        <select value={serviceId} onChange={(event) => applyServiceSelection(event.target.value)}>
          {availabilityByService.map((entry) => (
            <option key={entry.service.id} value={entry.service.id}>
              {entry.service.name} - {entry.service.durationMin} min - {entry.service.priceLabel}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <span>Prestador</span>
        <select value={providerId} onChange={(event) => applyProviderSelection(event.target.value)}>
          {(selectedAvailability?.providerAvailabilities ?? []).map((availability) => (
            <option key={availability.providerId ?? availability.providerName} value={availability.providerId ?? ""}>
              {availability.providerName}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <span>Horario disponible</span>
        <select value={startsAt} onChange={(event) => setStartsAt(event.target.value)}>
          {(selectedProviderAvailability?.slots ?? []).map((slot) => (
            <option key={slot.startsAt} value={slot.startsAt}>
              {slot.label}
            </option>
          ))}
        </select>
      </div>

      {selectedProviderAvailability && selectedProviderAvailability.slots.length === 0 ? (
        <p className="form-error">
          No hay horarios disponibles para este prestador con el servicio elegido por ahora.
        </p>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}

      <button
        className="button primary"
        disabled={
          isSubmitting ||
          !serviceId ||
          !startsAt ||
          (selectedProviderAvailability?.slots.length ?? 0) === 0
        }
        type="submit"
      >
        {isSubmitting ? "Procesando..." : "Confirmar turno"}
      </button>
    </form>
  );
}
