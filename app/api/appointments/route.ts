import { Prisma } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { getCurrentSession, hasCustomerAccess } from "@/lib/auth/session";
import { generateAvailableSlotsForService } from "@/lib/availability";
import { prisma } from "@/lib/prisma";

const createAppointmentSchema = z.object({
  tenantSlug: z.string().min(1),
  serviceId: z.string().min(1),
  startsAt: z.string().datetime(),
  redirectTo: z.string().min(1).optional(),
});

const ACTIVE_APPOINTMENT_STATUSES = ["PENDING", "CONFIRMED"] as const;
const MAX_TRANSACTION_RETRIES = 3;

function sanitizeRedirectTo(redirectTo: string | undefined, tenantSlug: string): string {
  if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
    return redirectTo;
  }

  return `/${tenantSlug}/mi-perfil`;
}

function isRetryableTransactionError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Necesitas iniciar sesion." }, { status: 401 });
    }

    const payload = createAppointmentSchema.parse(await request.json());
    const redirectTo = sanitizeRedirectTo(payload.redirectTo, payload.tenantSlug);
    const startsAt = new Date(payload.startsAt);

    if (Number.isNaN(startsAt.getTime())) {
      return NextResponse.json({ error: "La fecha del turno no es valida." }, { status: 400 });
    }

    if (startsAt <= new Date()) {
      return NextResponse.json(
        { error: "No puedes reservar un turno en el pasado." },
        { status: 400 },
      );
    }

    if (!(await hasCustomerAccess(payload.tenantSlug))) {
      return NextResponse.json(
        { error: "No tienes acceso a este tenant como cliente final." },
        { status: 403 },
      );
    }

    for (let attempt = 1; attempt <= MAX_TRANSACTION_RETRIES; attempt += 1) {
      try {
        const appointment = await prisma.$transaction(
          async (tx) => {
            const service = await tx.service.findUnique({
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
                      orderBy: [
                        {
                          dayOfWeek: "asc",
                        },
                        {
                          startTime: "asc",
                        },
                      ],
                    },
                    appointments: {
                      where: {
                        status: {
                          in: ACTIVE_APPOINTMENT_STATUSES,
                        },
                      },
                      select: {
                        startsAt: true,
                        endsAt: true,
                        status: true,
                      },
                    },
                  },
                },
              },
            });

            if (!service || service.tenant.slug !== payload.tenantSlug) {
              return {
                error: "El servicio seleccionado no pertenece a este tenant.",
                status: 400,
              };
            }

            if (!service.isActive) {
              return {
                error: "El servicio seleccionado no esta disponible para reservar.",
                status: 400,
              };
            }

            if (service.tenant.status === "SUSPENDED") {
              return {
                error: "Este negocio no puede recibir reservas en este momento.",
                status: 403,
              };
            }

            const customerProfile = await tx.customerProfile.findUnique({
              where: {
                userId_tenantId: {
                  userId: session.userId,
                  tenantId: service.tenantId,
                },
              },
            });

            if (!customerProfile) {
              return {
                error: "No existe un perfil de cliente para este tenant.",
                status: 400,
              };
            }

            const endsAt = new Date(startsAt.getTime() + service.durationMin * 60 * 1000);
            const availableSlots = generateAvailableSlotsForService(
              { durationMin: service.durationMin },
              service.tenant.availability,
              service.tenant.appointments,
              500,
              21,
            );
            const isPublishedSlot = availableSlots.some(
              (slot) => new Date(slot.startsAt).getTime() === startsAt.getTime(),
            );

            if (!isPublishedSlot) {
              return {
                error: "Ese horario ya no esta disponible. Elige otro slot.",
                status: 409,
              };
            }

            const conflictingAppointment = await tx.appointment.findFirst({
              where: {
                tenantId: service.tenantId,
                status: {
                  in: ACTIVE_APPOINTMENT_STATUSES,
                },
                startsAt: {
                  lt: endsAt,
                },
                endsAt: {
                  gt: startsAt,
                },
              },
              select: {
                id: true,
              },
            });

            if (conflictingAppointment) {
              return {
                error: "Ese horario ya no esta disponible. Elige otro slot.",
                status: 409,
              };
            }

            const createdAppointment = await tx.appointment.create({
              data: {
                tenantId: service.tenantId,
                serviceId: service.id,
                customerProfileId: customerProfile.id,
                startsAt,
                endsAt,
                status: "CONFIRMED",
              },
              select: {
                id: true,
              },
            });

            return {
              ok: true,
              appointmentId: createdAppointment.id,
            };
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );

        if ("error" in appointment) {
          return NextResponse.json({ error: appointment.error }, { status: appointment.status });
        }

        return NextResponse.json({
          ok: true,
          appointmentId: appointment.appointmentId,
          redirectTo,
        });
      } catch (error) {
        if (isRetryableTransactionError(error) && attempt < MAX_TRANSACTION_RETRIES) {
          continue;
        }

        throw error;
      }
    }

    return NextResponse.json(
      { error: "No se pudo confirmar el turno en este momento. Intenta nuevamente." },
      { status: 409 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Los datos enviados no son validos." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "No se pudo crear el turno en este momento." },
      { status: 500 },
    );
  }
}
