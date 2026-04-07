import { ReminderChannel, ReminderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type LogAppointmentEventInput = {
  appointmentId: string;
  tenantId: string;
  actorUserId?: string | null;
  type:
    | "CREATED"
    | "CONFIRMED"
    | "COMPLETED"
    | "CANCELLED"
    | "NO_SHOW"
    | "RESCHEDULED"
    | "NOTES_UPDATED"
    | "REMINDER_SCHEDULED"
    | "REMINDER_SENT"
    | "REMINDER_FAILED";
  title: string;
  description?: string | null;
};

type ScheduleAppointmentRemindersInput = {
  appointmentId: string;
  tenantId: string;
  startsAt: Date;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerName: string;
  serviceName: string;
};

const REMINDER_OFFSETS = [
  { hoursBefore: 24, channel: "EMAIL" as ReminderChannel },
  { hoursBefore: 2, channel: "WHATSAPP" as ReminderChannel },
];

export async function logAppointmentEvent(input: LogAppointmentEventInput) {
  await prisma.appointmentEvent.create({
    data: {
      appointmentId: input.appointmentId,
      tenantId: input.tenantId,
      actorUserId: input.actorUserId ?? null,
      type: input.type,
      title: input.title,
      description: input.description ?? null,
    },
  });
}

export async function cancelScheduledAppointmentReminders(appointmentId: string) {
  await prisma.appointmentReminder.updateMany({
    where: {
      appointmentId,
      status: ReminderStatus.SCHEDULED,
    },
    data: {
      status: ReminderStatus.CANCELLED,
    },
  });
}

export async function scheduleAppointmentReminders(input: ScheduleAppointmentRemindersInput) {
  await cancelScheduledAppointmentReminders(input.appointmentId);

  const reminderRows: Prisma.AppointmentReminderCreateManyInput[] = [];

  for (const reminderOffset of REMINDER_OFFSETS) {
    const scheduledFor = new Date(
      input.startsAt.getTime() - reminderOffset.hoursBefore * 60 * 60 * 1000,
    );

    if (scheduledFor <= new Date()) {
      continue;
    }

    const target =
      reminderOffset.channel === "EMAIL" ? input.customerEmail : input.customerPhone;

    if (!target) {
      continue;
    }

    reminderRows.push({
      appointmentId: input.appointmentId,
      tenantId: input.tenantId,
      channel: reminderOffset.channel,
      scheduledFor,
      target,
      message:
        reminderOffset.channel === "EMAIL"
          ? `Recordatorio: ${input.customerName}, tienes ${input.serviceName} programado.`
          : `Recordatorio de turno para ${input.customerName}: ${input.serviceName}.`,
    });
  }

  if (reminderRows.length > 0) {
    await prisma.appointmentReminder.createMany({
      data: reminderRows,
    });

    await logAppointmentEvent({
      appointmentId: input.appointmentId,
      tenantId: input.tenantId,
      type: "REMINDER_SCHEDULED",
      title: "Recordatorios programados",
      description: `Se programaron ${reminderRows.length} recordatorios automaticos.`,
    });
  }
}

export async function processDueAppointmentReminders(tenantId: string) {
  const dueReminders = await prisma.appointmentReminder.findMany({
    where: {
      tenantId,
      status: ReminderStatus.SCHEDULED,
      scheduledFor: {
        lte: new Date(),
      },
    },
    include: {
      appointment: true,
    },
    take: 20,
    orderBy: {
      scheduledFor: "asc",
    },
  });

  for (const reminder of dueReminders) {
    const hasProviderTarget = Boolean(reminder.target);
    const shouldSimulateSuccess = process.env.NODE_ENV !== "production";

    if (hasProviderTarget && shouldSimulateSuccess) {
      await prisma.appointmentReminder.update({
        where: {
          id: reminder.id,
        },
        data: {
          status: ReminderStatus.SENT,
          sentAt: new Date(),
          errorMessage: null,
        },
      });

      await logAppointmentEvent({
        appointmentId: reminder.appointmentId,
        tenantId: reminder.tenantId,
        type: "REMINDER_SENT",
        title: `Recordatorio enviado por ${reminder.channel === "EMAIL" ? "mail" : "WhatsApp"}`,
        description: `Se envio recordatorio automatico a ${reminder.target}.`,
      });
    } else {
      await prisma.appointmentReminder.update({
        where: {
          id: reminder.id,
        },
        data: {
          status: ReminderStatus.FAILED,
          errorMessage: "No hay proveedor configurado para enviar este recordatorio.",
        },
      });

      await logAppointmentEvent({
        appointmentId: reminder.appointmentId,
        tenantId: reminder.tenantId,
        type: "REMINDER_FAILED",
        title: "Fallo el recordatorio automatico",
        description: "No hay proveedor configurado para enviar este recordatorio.",
      });
    }
  }
}
