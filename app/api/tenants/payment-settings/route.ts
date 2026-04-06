import { z } from "zod";
import { NextResponse } from "next/server";
import { canManageTenant, getCurrentSession } from "@/lib/auth/session";
import { encryptTenantSecret } from "@/lib/payments/mercadopago";
import { prisma } from "@/lib/prisma";

const paymentSettingsSchema = z.object({
  tenantSlug: z.string().min(1),
  mercadoPagoEnabled: z.boolean(),
  mercadoPagoPublicKey: z.string().max(200).optional().or(z.literal("")),
  mercadoPagoAccessToken: z.string().max(300).optional().or(z.literal("")),
  mercadoPagoWebhookSecret: z.string().max(300).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Necesitas iniciar sesion." }, { status: 401 });
    }

    const payload = paymentSettingsSchema.parse(await request.json());

    if (!(await canManageTenant(payload.tenantSlug))) {
      return NextResponse.json(
        { error: "No tienes permisos para modificar los cobros de este tenant." },
        { status: 403 },
      );
    }

    const currentTenant = await prisma.tenant.findUnique({
      where: {
        slug: payload.tenantSlug,
      },
      select: {
        id: true,
        mercadoPagoAccessToken: true,
        mercadoPagoWebhookSecret: true,
      },
    });

    if (!currentTenant) {
      return NextResponse.json({ error: "Tenant no encontrado." }, { status: 404 });
    }

    const nextPublicKey = payload.mercadoPagoPublicKey?.trim() || null;
    const nextAccessToken = payload.mercadoPagoAccessToken?.trim()
      ? encryptTenantSecret(payload.mercadoPagoAccessToken.trim())
      : currentTenant.mercadoPagoAccessToken;
    const nextWebhookSecret = payload.mercadoPagoWebhookSecret?.trim()
      ? encryptTenantSecret(payload.mercadoPagoWebhookSecret.trim())
      : currentTenant.mercadoPagoWebhookSecret;

    if (payload.mercadoPagoEnabled && (!nextPublicKey || !nextAccessToken)) {
      return NextResponse.json(
        {
          error:
            "Para activar Mercado Pago debes completar al menos la Public Key y el Access Token.",
        },
        { status: 400 },
      );
    }

    await prisma.tenant.update({
      where: {
        id: currentTenant.id,
      },
      data: {
        mercadoPagoEnabled: payload.mercadoPagoEnabled,
        mercadoPagoPublicKey: nextPublicKey,
        mercadoPagoAccessToken: nextAccessToken,
        mercadoPagoWebhookSecret: nextWebhookSecret,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Revisa los datos de Mercado Pago antes de guardar." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "No se pudo guardar la configuracion de cobros." },
      { status: 500 },
    );
  }
}
