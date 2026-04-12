import { z } from "zod";
import { NextResponse } from "next/server";
import { canManageTenant, getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const colorRegex = /^#([A-Fa-f0-9]{6})$/;

const siteBlockSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string().min(1),
    type: z.literal("text"),
    eyebrow: z.string().max(60).optional(),
    title: z.string().min(2).max(140),
    body: z.string().min(2).max(1200),
    align: z.enum(["left", "center"]).optional(),
    titleSize: z.enum(["md", "lg", "xl"]).optional(),
    bodySize: z.enum(["sm", "md", "lg"]).optional(),
    tone: z.enum(["dark", "brand", "muted"]).optional(),
    width: z.enum(["compact", "normal", "wide", "full"]).optional(),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("image"),
    imageUrl: z.string().url(),
    altText: z.string().max(180).optional(),
    caption: z.string().max(300).optional(),
    layout: z.enum(["contained", "wide"]).optional(),
    height: z.enum(["small", "medium", "large"]).optional(),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("video"),
    title: z.string().max(140).optional(),
    videoUrl: z.string().url(),
    caption: z.string().max(300).optional(),
    width: z.enum(["compact", "normal", "wide", "full"]).optional(),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("columns"),
    layout: z.enum(["equal", "feature-left", "feature-right"]).optional(),
    columns: z
      .array(
        z.object({
          id: z.string().min(1),
          title: z.string().min(2).max(100),
          body: z.string().min(2).max(500),
        }),
      )
      .min(2)
      .max(4),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("cta"),
    title: z.string().min(2).max(140),
    body: z.string().min(2).max(500),
    buttonLabel: z.string().min(2).max(40),
    buttonHref: z.string().min(1).max(200),
    titleSize: z.enum(["md", "lg", "xl"]).optional(),
    bodySize: z.enum(["sm", "md", "lg"]).optional(),
    theme: z.enum(["soft", "solid"]).optional(),
    width: z.enum(["compact", "normal", "wide", "full"]).optional(),
  }),
]);

const siteConfigSchema = z.object({
  tenantSlug: z.string().min(1),
  siteTitle: z.string().min(2).max(120),
  heroTitle: z.string().min(2).max(140),
  heroDescription: z.string().min(10).max(500),
  publicDescription: z.string().max(500).optional(),
  ctaLabel: z.string().min(2).max(40),
  logoUrl: z.string().url().or(z.literal("")).optional(),
  heroImageUrl: z.string().url().or(z.literal("")).optional(),
  heroLayout: z.enum(["content-left", "image-left"]).optional(),
  primaryColor: z.string().regex(colorRegex),
  secondaryColor: z.string().regex(colorRegex),
  siteBlocks: z.array(siteBlockSchema).max(20).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Necesitas iniciar sesion." }, { status: 401 });
    }

    const payload = siteConfigSchema.parse(await request.json());

    if (!(await canManageTenant(payload.tenantSlug))) {
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
        heroLayout: payload.heroLayout ?? "content-left",
        primaryColor: payload.primaryColor,
        secondaryColor: payload.secondaryColor,
        siteBlocks: payload.siteBlocks ?? [],
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
