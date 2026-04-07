import { NextResponse } from "next/server";
import { z } from "zod";
import { canManageTenant, getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const createProviderSchema = z.object({
  tenantSlug: z.string().min(1),
  name: z.string().min(2).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Necesitas iniciar sesion." }, { status: 401 });
    }

    const payload = createProviderSchema.parse(await request.json());

    if (!(await canManageTenant(payload.tenantSlug))) {
      return NextResponse.json(
        { error: "No tienes permisos para gestionar prestadores de este tenant." },
        { status: 403 },
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

    const provider = await prisma.serviceProvider.create({
      data: {
        tenantId: tenant.id,
        name: payload.name.trim(),
        email: payload.email?.trim().toLowerCase() || null,
        phone: payload.phone?.trim() || null,
        color: payload.color?.trim() || null,
      },
    });

    return NextResponse.json({
      ok: true,
      provider: {
        id: provider.id,
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
      { error: "No se pudo crear el prestador." },
      { status: 500 },
    );
  }
}
