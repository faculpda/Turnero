type AvailabilityRuleShape = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotStepMin: number;
};

type ExistingAppointmentShape = {
  startsAt: Date;
  endsAt: Date;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
  paymentExpiresAt?: Date | null;
};

type BlockedPeriodShape = {
  startsAt: Date;
  endsAt: Date;
};

type ServiceShape = {
  durationMin: number;
};

type BookingSlotResult = {
  startsAt: string;
  endsAt: string;
  label: string;
};

const ACTIVE_APPOINTMENT_STATUSES = new Set(["PENDING", "CONFIRMED"]);

function toMinutes(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function setTimeOnDate(date: Date, totalMinutes: number): Date {
  const result = new Date(date);
  result.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
  return result;
}

function formatSlotLabel(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function overlaps(
  slotStart: Date,
  slotEnd: Date,
  appointments: ExistingAppointmentShape[],
  blockedPeriods: BlockedPeriodShape[],
): boolean {
  const now = new Date();

  const overlapsAppointment = appointments.some((appointment) => {
    if (!ACTIVE_APPOINTMENT_STATUSES.has(appointment.status)) {
      return false;
    }

    if (
      appointment.status === "PENDING" &&
      appointment.paymentExpiresAt &&
      appointment.paymentExpiresAt <= now
    ) {
      return false;
    }

    return slotStart < appointment.endsAt && slotEnd > appointment.startsAt;
  });

  if (overlapsAppointment) {
    return true;
  }

  return blockedPeriods.some(
    (blockedPeriod) => slotStart < blockedPeriod.endsAt && slotEnd > blockedPeriod.startsAt,
  );
}

export function generateAvailableSlotsForService(
  service: ServiceShape,
  availabilityRules: AvailabilityRuleShape[],
  existingAppointments: ExistingAppointmentShape[],
  blockedPeriods: BlockedPeriodShape[] = [],
  maxSlots = 12,
  daysAhead = 21,
): BookingSlotResult[] {
  const slots: BookingSlotResult[] = [];
  const now = new Date();

  for (let offset = 0; offset < daysAhead; offset += 1) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(now.getDate() + offset);

    const dayRules = availabilityRules.filter((rule) => rule.dayOfWeek === date.getDay());

    for (const rule of dayRules) {
      const startMinutes = toMinutes(rule.startTime);
      const endMinutes = toMinutes(rule.endTime);

      for (
        let cursor = startMinutes;
        cursor + service.durationMin <= endMinutes;
        cursor += rule.slotStepMin
      ) {
        const slotStart = setTimeOnDate(date, cursor);
        const slotEnd = setTimeOnDate(date, cursor + service.durationMin);

        if (slotStart <= now) {
          continue;
        }

        if (overlaps(slotStart, slotEnd, existingAppointments, blockedPeriods)) {
          continue;
        }

        slots.push({
          startsAt: slotStart.toISOString(),
          endsAt: slotEnd.toISOString(),
          label: formatSlotLabel(slotStart),
        });

        if (slots.length >= maxSlots) {
          return slots;
        }
      }
    }
  }

  return slots;
}
