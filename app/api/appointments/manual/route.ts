import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { PaymentStatus } from "@prisma/client";
import { z } from "zod";
import { canManageTenant, getCurrentSession } from "@/lib/auth/session";
import {
  logAppointmentEvent,
  scheduleAppointmentReminders,
} from "@/lib/appointments";
import { generateAvailableSlotsForService } from "@/lib/availability";
import { buildAppointmentActiveFilter } from "@/lib/payments/mercadopago";
import { prisma } from "@/lib/prisma";

const createManualAppointmentSchema = z.object({
  tenantSlug: z.string().min(1),
  serviceId: z.string().min(1),
  providerId: z.string().min(1).optional(),
  customerName: z.string().min(2).max(120),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().max(40).optional().or(z.literal("")),
  startsAt: z.string().datetime(),
  notes: z.string().max(1000).optional(),
  paymentStatus: z.enum(["NOT_REQUIRED", "PENDING", "APPROVED"]).default("NOT_REQUIRED"),
});

function buildManualPlaceholderEmail(tenantSlug: string) {
  return `manual-${tenantSlug}-${randomBytes(6).toString("hex")}@turnero.local`;
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Necesitas iniciar sesion." }, { status: 401 });
    }

    const payload = createManualAppointmentSchema.parse(await request.json());

    if (!(await canManageTenant(payload.tenantSlug))) {
      return NextResponse.json(
        { error: "No tienes permisos para crear turnos manuales en este tenant." },
        { status: 403 },
      );
    }

    const startsAt = new Date(payload.startsAt);

    if (Number.isNaN(startsAt.getTime())) {
      return NextResponse.json({ error: "La fecha del turno no es valida." }, { status: 400 });
    }

    const service = await prisma.service.findUnique({
      where: {
        id: payload.serviceId,
      },
      include: {
        tenant: {
          include: {
            availability: {
              where: {
                isActive: true,
              },
              orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
            },
            blockedTimeSlots: {
              select: {
                startsAt: true,
                endsAt: true,
              },
            },
            appointments: {
              where: buildAppointmentActiveFilter(),
              select: {
                providerId: true,
                startsAt: true,
                endsAt: true,
                status: true,
                paymentExpiresAt: true,
              },
            },
            providers: {
              where: {
                isActive: true,
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!service || service.tenant.slug !== payload.tenantSlug) {
      return NextResponse.json(
        { error: "El servicio seleccionado no pertenece a este tenant." },
        { status: 400 },
      );
    }

    if (!service.isActive) {
      return NextResponse.json(
        { error: "El servicio seleccionado no esta disponible." },
        { status: 400 },
      );
    }

    if (
      payload.providerId &&
      !service.tenant.providers.some((provider) => provider.id === payload.providerId)
    ) {
      return NextResponse.json(
        { error: "El prestador seleccionado no pertenece a este tenant." },
        { status: 400 },
      );
    }

    const endsAt = new Date(startsAt.getTime() + service.durationMin * 60 * 1000);
    const providerAppointments = payload.providerId
      ? service.tenant.appointments.filter(
          (appointment) => appointment.providerId === payload.providerId,
        )
      : service.tenant.appointments;
    const availableSlots = generateAvailableSlotsForService(
      { durationMin: service.durationMin },
      service.tenant.availability,
      providerAppointments,
      service.tenant.blockedTimeSlots,
      500,
      21,
    );
    const isPublishedSlot = availableSlots.some(
      (slot) => new Date(slot.startsAt).getTime() === startsAt.getTime(),
    );

    if (!isPublishedSlot) {
      return NextResponse.json(
        { error: "Ese horario ya no esta disponible para reservar manualmente." },
        { status: 409 },
      );
    }

    const normalizedEmail = payload.customerEmail?.trim().toLowerCase() || "";
    const normalizedPhone = payload.customerPhone?.trim() || "";
    const userEmail = normalizedEmail || buildManualPlaceholderEmail(payload.tenantSlug);

    const appointment = await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({
        where: {
          email: userEmail,
        },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            name: payload.customerName.trim(),
            email: userEmail,
            globalRole: "CUSTOMER",
          },
        });
      } else if (user.name !== payload.customerName.trim()) {
        user = await tx.user.update({
          where: {
            id: user.id,
          },
          data: {
            name: payload.customerName.trim(),
          },
        });
      }

      const customerProfile = await tx.customerProfile.upsert({
        where: {
          userId_tenantId: {
            userId: user.id,
            tenantId: service.tenantId,
          },
        },
        update: {
          phone: normalizedPhone || undefined,
        },
        create: {
          userId: user.id,
          tenantId: service.tenantId,
          phone: normalizedPhone || undefined,
        },
      });

      return tx.appointment.create({
        data: {
          tenantId: service.tenantId,
          serviceId: service.id,
          providerId: payload.providerId || null,
          customerProfileId: customerProfile.id,
          startsAt,
          endsAt,
          notes: payload.notes?.trim() || null,
          status: "CONFIRMED",
          paymentStatus: payload.paymentStatus as PaymentStatus,
          paymentAmountCents: service.priceCents,
        },
        include: {
          customerProfile: {
            include: {
              user: true,
            },
          },
          service: true,
        },
      });
    });

    await logAppointmentEvent({
      appointmentId: appointment.id,
      tenantId: appointment.tenantId,
      actorUserId: session.userId,
      type: "CREATED",
      title: "Turno manual creado",
      description: `Se cargo manualmente una reserva para ${appointment.customerProfile.user.name}.`,
    });

    await scheduleAppointmentReminders({
      appointmentId: appointment.id,
      tenantId: appointment.tenantId,
      startsAt: appointment.startsAt,
      customerEmail: normalizedEmail || undefined,
      customerPhone: normalizedPhone || undefined,
      customerName: appointment.customerProfile.user.name,
      serviceName: appointment.service.name,
    });

    return NextResponse.json({
      ok: true,
      appointmentId: appointment.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Los datos enviados no son validos." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "No se pudo crear el turno manual." },
      { status: 500 },
    );
  }
}
