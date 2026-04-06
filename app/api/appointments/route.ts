import { z } from "zod";
import { NextResponse } from "next/server";
import { getCurrentSession, hasCustomerAccess } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const createAppointmentSchema = z.object({
  tenantSlug: z.string().min(1),
  serviceId: z.string().min(1),
  startsAt: z.string().datetime(),
  redirectTo: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Necesitas iniciar sesion." }, { status: 401 });
    }

    const payload = createAppointmentSchema.parse(await request.json());

    if (!(await hasCustomerAccess(payload.tenantSlug))) {
      return NextResponse.json(
        { error: "No tienes acceso a este tenant como cliente final." },
        { status: 403 },
      );
    }

    const service = await prisma.service.findUnique({
      where: {
        id: payload.serviceId,
      },
      include: {
        tenant: true,
      },
    });

    if (!service || service.tenant.slug !== payload.tenantSlug) {
      return NextResponse.json(
        { error: "El servicio seleccionado no pertenece a este tenant." },
        { status: 400 },
      );
    }

    const customerProfile = await prisma.customerProfile.findUnique({
      where: {
        userId_tenantId: {
          userId: session.userId,
          tenantId: service.tenantId,
        },
      },
    });

    if (!customerProfile) {
      return NextResponse.json(
        { error: "No existe un perfil de cliente para este tenant." },
        { status: 400 },
      );
    }

    const startsAt = new Date(payload.startsAt);
    const endsAt = new Date(startsAt.getTime() + service.durationMin * 60 * 1000);

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        tenantId: service.tenantId,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        startsAt: {
          lt: endsAt,
        },
        endsAt: {
          gt: startsAt,
        },
      },
    });

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: "Ese horario ya no esta disponible. Elige otro slot." },
        { status: 409 },
      );
    }

    await prisma.appointment.create({
      data: {
        tenantId: service.tenantId,
        serviceId: service.id,
        customerProfileId: customerProfile.id,
        startsAt,
        endsAt,
        status: "CONFIRMED",
      },
    });

    return NextResponse.json({
      ok: true,
      redirectTo: payload.redirectTo ?? `/${payload.tenantSlug}/mi-perfil`,
    });
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
