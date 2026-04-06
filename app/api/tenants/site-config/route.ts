import { z } from "zod";
import { NextResponse } from "next/server";
import { getCurrentSession, hasTenantAccess } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const colorRegex = /^#([A-Fa-f0-9]{6})$/;

const siteConfigSchema = z.object({
  tenantSlug: z.string().min(1),
  siteTitle: z.string().min(2).max(120),
  heroTitle: z.string().min(2).max(140),
  heroDescription: z.string().min(10).max(500),
  publicDescription: z.string().max(500).optional(),
  ctaLabel: z.string().min(2).max(40),
  logoUrl: z.string().url().or(z.literal("")).optional(),
  heroImageUrl: z.string().url().or(z.literal("")).optional(),
  primaryColor: z.string().regex(colorRegex),
  secondaryColor: z.string().regex(colorRegex),
});

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Necesitas iniciar sesion." }, { status: 401 });
    }

    const payload = siteConfigSchema.parse(await request.json());

    if (!(await hasTenantAccess(payload.tenantSlug))) {
      return NextResponse.json(
        { error: "No tienes permisos para modificar este sitio." },
        { status: 403 },
      );
    }

    await prisma.tenant.update({
      where: {
        slug: payload.tenantSlug,
      },
      data: {
        siteTitle: payload.siteTitle.trim(),
        heroTitle: payload.heroTitle.trim(),
        heroDescription: payload.heroDescription.trim(),
        publicDescription: payload.publicDescription?.trim() || null,
        ctaLabel: payload.ctaLabel.trim(),
        logoUrl: payload.logoUrl?.trim() || null,
        heroImageUrl: payload.heroImageUrl?.trim() || null,
        primaryColor: payload.primaryColor,
        secondaryColor: payload.secondaryColor,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Revisa los datos del sitio antes de guardar." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "No se pudo actualizar la configuracion del sitio." },
      { status: 500 },
    );
  }
}
