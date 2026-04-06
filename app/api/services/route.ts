import { z } from "zod";
import { NextResponse } from "next/server";
import { canManageTenant, getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const createServiceSchema = z.object({
  tenantSlug: z.string().min(1),
  title: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  durationMin: z.coerce.number().int().min(5).max(480),
  pricePesos: z.coerce.number().min(0).max(100000000),
});

const serviceImageSchema = z.object({
  url: z.string().url(),
  altText: z.string().max(160).optional(),
});

const updateServiceSchema = z.object({
  tenantSlug: z.string().min(1),
  serviceId: z.string().min(1),
  title: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  durationMin: z.coerce.number().int().min(5).max(480),
  pricePesos: z.coerce.number().min(0).max(100000000),
  isActive: z.boolean(),
  images: z.array(serviceImageSchema).max(3).default([]),
});

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Necesitas iniciar sesion." }, { status: 401 });
    }

    const payload = createServiceSchema.parse(await request.json());

    if (!(await canManageTenant(payload.tenantSlug))) {
      return NextResponse.json(
        { error: "No tienes permisos para gestionar este tenant." },
        { status: 403 },
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: {
        slug: payload.tenantSlug,
      },
      include: {
        services: {
          orderBy: {
            sortOrder: "desc",
          },
          take: 1,
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant no encontrado." }, { status: 404 });
    }

    const nextSortOrder = (tenant.services[0]?.sortOrder ?? 0) + 1;

    await prisma.service.create({
      data: {
        tenantId: tenant.id,
        name: payload.title.trim(),
        description: payload.description?.trim() || null,
        durationMin: payload.durationMin,
        priceCents: Math.round(payload.pricePesos * 100),
        sortOrder: nextSortOrder,
        isActive: true,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Revisa los datos del servicio antes de guardar." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "No se pudo crear el servicio en este momento." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Necesitas iniciar sesion." }, { status: 401 });
    }

    const payload = updateServiceSchema.parse(await request.json());

    if (!(await canManageTenant(payload.tenantSlug))) {
      return NextResponse.json(
        { error: "No tienes permisos para gestionar este tenant." },
        { status: 403 },
      );
    }

    const service = await prisma.service.findUnique({
      where: {
        id: payload.serviceId,
      },
      include: {
        tenant: true,
        images: true,
      },
    });

    if (!service || service.tenant.slug !== payload.tenantSlug) {
      return NextResponse.json({ error: "Servicio no encontrado." }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.service.update({
        where: {
          id: service.id,
        },
        data: {
          name: payload.title.trim(),
          description: payload.description?.trim() || null,
          durationMin: payload.durationMin,
          priceCents: Math.round(payload.pricePesos * 100),
          isActive: payload.isActive,
        },
      }),
      prisma.serviceImage.deleteMany({
        where: {
          serviceId: service.id,
        },
      }),
      ...(payload.images.length > 0
        ? [
            prisma.serviceImage.createMany({
              data: payload.images.map((image, index) => ({
                serviceId: service.id,
                url: image.url,
                altText: image.altText?.trim() || null,
                sortOrder: index + 1,
              })),
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Revisa los datos del servicio antes de guardar." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "No se pudo actualizar el servicio en este momento." },
      { status: 500 },
    );
  }
}
