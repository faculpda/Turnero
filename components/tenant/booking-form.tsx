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
  const firstServiceId = availabilityByService[0]?.service.id ?? "";
  const [serviceId, setServiceId] = useState(firstServiceId);
  const [startsAt, setStartsAt] = useState(
    availabilityByService[0]?.slots[0]?.startsAt ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedAvailability = useMemo(
    () => availabilityByService.find((entry) => entry.service.id === serviceId),
    [availabilityByService, serviceId],
  );

  function onServiceChange(nextServiceId: string) {
    setServiceId(nextServiceId);
    setStartsAt(
      availabilityByService.find((entry) => entry.service.id === nextServiceId)?.slots[0]
        ?.startsAt ?? "",
    );
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
        startsAt,
        redirectTo,
      }),
    });

    const payload = (await response.json()) as { ok?: boolean; error?: string; redirectTo?: string };

    if (!response.ok || !payload.ok) {
      setError(payload.error ?? "No se pudo reservar el turno.");
      setIsSubmitting(false);
      return;
    }

    router.push(payload.redirectTo ?? redirectTo);
    router.refresh();
  }

  return (
    <form className="booking-form panel" onSubmit={onSubmit}>
      <div className="field">
        <span>Servicio</span>
        <select value={serviceId} onChange={(event) => onServiceChange(event.target.value)}>
          {availabilityByService.map((entry) => (
            <option key={entry.service.id} value={entry.service.id}>
              {entry.service.name} - {entry.service.durationMin} min - {entry.service.priceLabel}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <span>Horario disponible</span>
        <select value={startsAt} onChange={(event) => setStartsAt(event.target.value)}>
          {(selectedAvailability?.slots ?? []).map((slot) => (
            <option key={slot.startsAt} value={slot.startsAt}>
              {slot.label}
            </option>
          ))}
        </select>
      </div>

      {selectedAvailability && selectedAvailability.slots.length === 0 ? (
        <p className="form-error">No hay horarios disponibles para este servicio por ahora.</p>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}

      <button
        className="button primary"
        disabled={isSubmitting || !serviceId || !startsAt || (selectedAvailability?.slots.length ?? 0) === 0}
        type="submit"
      >
        {isSubmitting ? "Reservando..." : "Confirmar turno"}
      </button>
    </form>
  );
}
