import { Prisma } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { canManageTenant, getCurrentSession, hasCustomerAccess } from "@/lib/auth/session";
import { generateAvailableSlotsForService } from "@/lib/availability";
import {
  buildAppointmentActiveFilter,
  buildMercadoPagoReturnUrls,
  createMercadoPagoPreference,
  decryptTenantSecret,
  getBaseUrlFromRequest,
  getPaymentHoldExpiration,
  isMercadoPagoReady,
} from "@/lib/payments/mercadopago";
import { prisma } from "@/lib/prisma";

const createAppointmentSchema = z.object({
  tenantSlug: z.string().min(1),
  serviceId: z.string().min(1),
  startsAt: z.string().datetime(),
  redirectTo: z.string().min(1).optional(),
});

const updateAppointmentStatusSchema = z.object({
  tenantSlug: z.string().min(1),
  appointmentId: z.string().min(1),
  status: z.enum(["COMPLETED", "CANCELLED"]),
});

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
            const now = new Date();
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
                      where: buildAppointmentActiveFilter(now),
                      select: {
                        startsAt: true,
                        endsAt: true,
                        status: true,
                        paymentExpiresAt: true,
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
                startsAt: {
                  lt: endsAt,
                },
                endsAt: {
                  gt: startsAt,
                },
                ...buildAppointmentActiveFilter(now),
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

            const requiresOnlinePayment =
              isMercadoPagoReady(service.tenant) && (service.priceCents ?? 0) > 0;
            const createdAppointment = await tx.appointment.create({
              data: {
                tenantId: service.tenantId,
                serviceId: service.id,
                customerProfileId: customerProfile.id,
                startsAt,
                endsAt,
                status: requiresOnlinePayment ? "PENDING" : "CONFIRMED",
                paymentProvider: requiresOnlinePayment ? "MERCADO_PAGO" : null,
                paymentStatus: requiresOnlinePayment ? "PENDING" : "NOT_REQUIRED",
                paymentAmountCents: service.priceCents,
                paymentExternalReference: requiresOnlinePayment ? undefined : null,
                paymentExpiresAt: requiresOnlinePayment ? getPaymentHoldExpiration(now) : null,
              },
              select: {
                id: true,
                startsAt: true,
                paymentExpiresAt: true,
                service: {
                  select: {
                    name: true,
                    priceCents: true,
                  },
                },
                tenant: {
                  select: {
                    slug: true,
                    name: true,
                    mercadoPagoEnabled: true,
                    mercadoPagoAccessToken: true,
                  },
                },
              },
            });

            return {
              ok: true as const,
              appointmentId: createdAppointment.id,
              requiresOnlinePayment,
              tenantName: createdAppointment.tenant.name,
              serviceName: createdAppointment.service.name,
              servicePriceCents: createdAppointment.service.priceCents,
              mercadoPagoAccessToken: createdAppointment.tenant.mercadoPagoAccessToken,
              paymentExpiresAt: createdAppointment.paymentExpiresAt?.toISOString() ?? null,
            };
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );

        if ("error" in appointment) {
          return NextResponse.json({ error: appointment.error }, { status: appointment.status });
        }

        if (!appointment.requiresOnlinePayment) {
          return NextResponse.json({
            ok: true,
            appointmentId: appointment.appointmentId,
            redirectTo,
          });
        }

        const accessToken = decryptTenantSecret(appointment.mercadoPagoAccessToken);

        if (!accessToken || !appointment.servicePriceCents) {
          await prisma.appointment.update({
            where: {
              id: appointment.appointmentId,
            },
            data: {
              status: "CANCELLED",
              paymentStatus: "CANCELLED",
              paymentExpiresAt: null,
            },
          });

          return NextResponse.json(
            { error: "El tenant no tiene Mercado Pago configurado correctamente." },
            { status: 400 },
          );
        }

        const baseUrl = getBaseUrlFromRequest(request);
        const returnUrls = buildMercadoPagoReturnUrls(
          baseUrl,
          payload.tenantSlug,
          appointment.appointmentId,
        );

        try {
          const preference = await createMercadoPagoPreference({
            accessToken,
            externalReference: appointment.appointmentId,
            notificationUrl: returnUrls.notificationUrl,
            successUrl: returnUrls.successUrl,
            pendingUrl: returnUrls.pendingUrl,
            failureUrl: returnUrls.failureUrl,
            item: {
              title: `${appointment.serviceName} - ${appointment.tenantName}`,
              quantity: 1,
              unit_price: appointment.servicePriceCents / 100,
              currency_id: "ARS",
            },
          });

          await prisma.appointment.update({
            where: {
              id: appointment.appointmentId,
            },
            data: {
              paymentPreferenceId: preference.id,
              paymentExternalReference: appointment.appointmentId,
            },
          });

          return NextResponse.json({
            ok: true,
            appointmentId: appointment.appointmentId,
            redirectTo,
            checkoutUrl: preference.init_point,
            paymentRequired: true,
            paymentExpiresAt: appointment.paymentExpiresAt,
          });
        } catch {
          await prisma.appointment.update({
            where: {
              id: appointment.appointmentId,
            },
            data: {
              status: "CANCELLED",
              paymentStatus: "CANCELLED",
              paymentExpiresAt: null,
            },
          });

          return NextResponse.json(
            { error: "No se pudo iniciar el pago con Mercado Pago." },
            { status: 502 },
          );
        }
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

export async function PATCH(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Necesitas iniciar sesion." }, { status: 401 });
    }

    const payload = updateAppointmentStatusSchema.parse(await request.json());

    if (!(await canManageTenant(payload.tenantSlug))) {
      return NextResponse.json(
        { error: "No tienes permisos para gestionar turnos de este tenant." },
        { status: 403 },
      );
    }

    const appointment = await prisma.appointment.findUnique({
      where: {
        id: payload.appointmentId,
      },
      include: {
        tenant: {
          select: {
            slug: true,
          },
        },
      },
    });

    if (!appointment || appointment.tenant.slug !== payload.tenantSlug) {
      return NextResponse.json(
        { error: "El turno seleccionado no pertenece a este tenant." },
        { status: 404 },
      );
    }

    if (appointment.status !== "PENDING" && appointment.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "Solo se pueden actualizar turnos pendientes o confirmados." },
        { status: 400 },
      );
    }

    const updatedAppointment = await prisma.appointment.update({
      where: {
        id: appointment.id,
      },
      data: {
        status: payload.status,
        paymentExpiresAt: payload.status === "CANCELLED" ? null : appointment.paymentExpiresAt,
        paymentStatus:
          payload.status === "CANCELLED" && appointment.paymentStatus === "PENDING"
            ? "CANCELLED"
            : appointment.paymentStatus,
      },
      include: {
        service: true,
        customerProfile: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      appointment: {
        id: updatedAppointment.id,
        status: updatedAppointment.status,
        paymentStatus: updatedAppointment.paymentStatus,
        serviceName: updatedAppointment.service.name,
        customerName: updatedAppointment.customerProfile.user.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Los datos enviados no son validos." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "No se pudo actualizar el turno en este momento." },
      { status: 500 },
    );
  }
}
