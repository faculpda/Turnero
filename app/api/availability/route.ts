import { NextResponse } from "next/server";
import { z } from "zod";
import { canManageTenant, getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const availabilityRuleSchema = z.object({
  id: z.string().min(1).optional(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotStepMin: z.number().int().min(5).max(180),
  isActive: z.boolean(),
});

const updateAvailabilitySchema = z.object({
  tenantSlug: z.string().min(1),
  rules: z.array(availabilityRuleSchema).max(28),
});

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export async function PUT(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Necesitas iniciar sesion." }, { status: 401 });
    }

    const payload = updateAvailabilitySchema.parse(await request.json());

    if (!(await canManageTenant(payload.tenantSlug))) {
      return NextResponse.json(
        { error: "No tienes permisos para editar la agenda de este tenant." },
        { status: 403 },
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: payload.tenantSlug },
      select: {
        id: true,
        availability: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "El tenant no existe." }, { status: 404 });
    }

    for (const rule of payload.rules) {
      if (timeToMinutes(rule.startTime) >= timeToMinutes(rule.endTime)) {
        return NextResponse.json(
          { error: "Cada horario debe terminar despues de su inicio." },
          { status: 400 },
        );
      }
    }

    const existingIds = new Set(tenant.availability.map((rule) => rule.id));
    const payloadIds = new Set(
      payload.rules.map((rule) => rule.id).filter((value): value is string => Boolean(value)),
    );

    const hasForeignRule = [...payloadIds].some((id) => !existingIds.has(id));

    if (hasForeignRule) {
      return NextResponse.json(
        { error: "Uno de los horarios no pertenece a este tenant." },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      const idsToDelete = tenant.availability
        .map((rule) => rule.id)
        .filter((id) => !payloadIds.has(id));

      if (idsToDelete.length > 0) {
        await tx.availabilityRule.deleteMany({
          where: {
            tenantId: tenant.id,
            id: {
              in: idsToDelete,
            },
          },
        });
      }

      for (const rule of payload.rules) {
        if (rule.id) {
          await tx.availabilityRule.update({
            where: {
              id: rule.id,
            },
            data: {
              dayOfWeek: rule.dayOfWeek,
              startTime: rule.startTime,
              endTime: rule.endTime,
              slotStepMin: rule.slotStepMin,
              isActive: rule.isActive,
            },
          });
          continue;
        }

        await tx.availabilityRule.create({
          data: {
            tenantId: tenant.id,
            dayOfWeek: rule.dayOfWeek,
            startTime: rule.startTime,
            endTime: rule.endTime,
            slotStepMin: rule.slotStepMin,
            isActive: rule.isActive,
          },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Los datos enviados no son validos." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "No se pudo guardar el horario de atencion." },
      { status: 500 },
    );
  }
}
