export function formatPrice(priceCents: number | null | undefined): string {
  if (!priceCents) {
    return "A consultar";
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(priceCents / 100);
}

export function formatAppointmentDate(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
