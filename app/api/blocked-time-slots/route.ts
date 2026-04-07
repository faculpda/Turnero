import { NextResponse } from "next/server";
import { z } from "zod";
import { canManageTenant, getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const createBlockedTimeSlotSchema = z.object({
  tenantSlug: z.string().min(1),
  title: z.string().min(1).max(120),
  reason: z.string().max(400).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

const deleteBlockedTimeSlotSchema = z.object({
  tenantSlug: z.string().min(1),
  blockedTimeSlotId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Necesitas iniciar sesion." }, { status: 401 });
    }

    const payload = createBlockedTimeSlotSchema.parse(await request.json());

    if (!(await canManageTenant(payload.tenantSlug))) {
      return NextResponse.json(
        { error: "No tienes permisos para bloquear horarios de este tenant." },
        { status: 403 },
      );
    }

    const startsAt = new Date(payload.startsAt);
    const endsAt = new Date(payload.endsAt);

    if (startsAt >= endsAt) {
      return NextResponse.json(
        { error: "El fin del bloqueo debe ser posterior al inicio." },
        { status: 400 },
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: {
        slug: payload.tenantSlug,
      },
      select: {
        id: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "El tenant no existe." }, { status: 404 });
    }

    const blockedTimeSlot = await prisma.blockedTimeSlot.create({
      data: {
        tenantId: tenant.id,
        createdByUserId: session.userId,
        title: payload.title.trim(),
        reason: payload.reason?.trim() || null,
        startsAt,
        endsAt,
      },
    });

    return NextResponse.json({
      ok: true,
      blockedTimeSlot: {
        id: blockedTimeSlot.id,
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
      { error: "No se pudo bloquear ese horario." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Necesitas iniciar sesion." }, { status: 401 });
    }

    const payload = deleteBlockedTimeSlotSchema.parse(await request.json());

    if (!(await canManageTenant(payload.tenantSlug))) {
      return NextResponse.json(
        { error: "No tienes permisos para desbloquear horarios de este tenant." },
        { status: 403 },
      );
    }

    const blockedTimeSlot = await prisma.blockedTimeSlot.findUnique({
      where: {
        id: payload.blockedTimeSlotId,
      },
      include: {
        tenant: {
          select: {
            slug: true,
          },
        },
      },
    });

    if (!blockedTimeSlot || blockedTimeSlot.tenant.slug !== payload.tenantSlug) {
      return NextResponse.json(
        { error: "El bloqueo seleccionado no pertenece a este tenant." },
        { status: 404 },
      );
    }

    await prisma.blockedTimeSlot.delete({
      where: {
        id: blockedTimeSlot.id,
      },
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
      { error: "No se pudo desbloquear ese horario." },
      { status: 500 },
    );
  }
}
