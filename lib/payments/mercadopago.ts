import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { AppointmentStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const MERCADO_PAGO_API_URL = "https://api.mercadopago.com";
const PAYMENT_HOLD_MINUTES = 30;
const ENCRYPTION_PREFIX = "enc:";

type MercadoPagoPreferenceItem = {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: "ARS";
};

type CreatePreferenceInput = {
  accessToken: string;
  externalReference: string;
  notificationUrl?: string;
  successUrl: string;
  pendingUrl: string;
  failureUrl: string;
  item: MercadoPagoPreferenceItem;
};

type MercadoPagoPreferenceResponse = {
  id: string;
  init_point: string;
  sandbox_init_point?: string;
};

type MercadoPagoPaymentResponse = {
  id: number;
  status: string;
  external_reference?: string;
  date_approved?: string | null;
};

function getEncryptionSecret(): string {
  return (
    process.env.PAYMENT_CREDENTIALS_SECRET ??
    process.env.APP_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    process.env.DATABASE_URL ??
    "turnero-local-dev-secret"
  );
}

function buildEncryptionKey(): Buffer {
  return createHash("sha256").update(getEncryptionSecret()).digest();
}

export function encryptTenantSecret(value: string): string {
  if (!value) {
    return value;
  }

  const key = buildEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${ENCRYPTION_PREFIX}${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptTenantSecret(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (!value.startsWith(ENCRYPTION_PREFIX)) {
    return value;
  }

  const payload = value.slice(ENCRYPTION_PREFIX.length);
  const [ivHex, encryptedHex] = payload.split(":");

  if (!ivHex || !encryptedHex) {
    return null;
  }

  const key = buildEncryptionKey();
  const decipher = createDecipheriv("aes-256-cbc", key, Buffer.from(ivHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function getPaymentHoldExpiration(referenceDate = new Date()): Date {
  return new Date(referenceDate.getTime() + PAYMENT_HOLD_MINUTES * 60 * 1000);
}

export function shouldBlockSlot(
  appointment: { status: AppointmentStatus; paymentExpiresAt?: Date | null },
  referenceDate = new Date(),
): boolean {
  if (appointment.status === "CONFIRMED") {
    return true;
  }

  if (appointment.status !== "PENDING") {
    return false;
  }

  if (!appointment.paymentExpiresAt) {
    return true;
  }

  return appointment.paymentExpiresAt > referenceDate;
}

export function isMercadoPagoReady(tenant: {
  mercadoPagoEnabled: boolean;
  mercadoPagoAccessToken?: string | null;
}): boolean {
  return Boolean(tenant.mercadoPagoEnabled && decryptTenantSecret(tenant.mercadoPagoAccessToken));
}

async function mercadoPagoFetch<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${MERCADO_PAGO_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as T & { message?: string };

  if (!response.ok) {
    throw new Error(
      (payload as { message?: string }).message ??
        "No se pudo completar la operacion con Mercado Pago.",
    );
  }

  return payload;
}

export async function createMercadoPagoPreference(
  input: CreatePreferenceInput,
): Promise<MercadoPagoPreferenceResponse> {
  return mercadoPagoFetch<MercadoPagoPreferenceResponse>(
    "/checkout/preferences",
    input.accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        external_reference: input.externalReference,
        notification_url: input.notificationUrl,
        back_urls: {
          success: input.successUrl,
          pending: input.pendingUrl,
          failure: input.failureUrl,
        },
        auto_return: "approved",
        expires: true,
        items: [input.item],
      }),
    },
  );
}

export async function getMercadoPagoPayment(
  accessToken: string,
  paymentId: string | number,
): Promise<MercadoPagoPaymentResponse> {
  return mercadoPagoFetch<MercadoPagoPaymentResponse>(`/v1/payments/${paymentId}`, accessToken, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function mapMercadoPagoStatus(status: string): {
  appointmentStatus: AppointmentStatus;
  paymentStatus: PaymentStatus;
} {
  switch (status) {
    case "approved":
      return {
        appointmentStatus: "CONFIRMED",
        paymentStatus: "APPROVED",
      };
    case "pending":
    case "in_process":
    case "in_mediation":
      return {
        appointmentStatus: "PENDING",
        paymentStatus: "PENDING",
      };
    case "cancelled":
      return {
        appointmentStatus: "CANCELLED",
        paymentStatus: "CANCELLED",
      };
    default:
      return {
        appointmentStatus: "CANCELLED",
        paymentStatus: "REJECTED",
      };
  }
}

export async function syncMercadoPagoAppointmentPayment(params: {
  tenantSlug: string;
  appointmentId: string;
  paymentId: string;
}): Promise<
  | { ok: true; status: PaymentStatus; appointmentStatus: AppointmentStatus }
  | { ok: false; error: string }
> {
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: params.appointmentId,
      tenant: {
        slug: params.tenantSlug,
      },
      paymentProvider: "MERCADO_PAGO",
    },
    include: {
      tenant: true,
    },
  });

  if (!appointment) {
    return { ok: false, error: "No encontramos la reserva asociada al pago." };
  }

  const accessToken = decryptTenantSecret(appointment.tenant.mercadoPagoAccessToken);

  if (!accessToken) {
    return { ok: false, error: "El tenant no tiene configurado Mercado Pago." };
  }

  const payment = await getMercadoPagoPayment(accessToken, params.paymentId);

  if (payment.external_reference && payment.external_reference !== appointment.id) {
    return { ok: false, error: "El pago no coincide con la reserva indicada." };
  }

  const nextState = mapMercadoPagoStatus(payment.status);

  await prisma.appointment.update({
    where: {
      id: appointment.id,
    },
    data: {
      status: nextState.appointmentStatus,
      paymentStatus: nextState.paymentStatus,
      paymentProviderPaymentId: String(payment.id),
      paymentApprovedAt:
        nextState.paymentStatus === "APPROVED" ? payment.date_approved ? new Date(payment.date_approved) : new Date() : null,
      paymentExpiresAt:
        nextState.paymentStatus === "PENDING"
          ? appointment.paymentExpiresAt ?? getPaymentHoldExpiration(appointment.createdAt)
          : null,
    },
  });

  return {
    ok: true,
    status: nextState.paymentStatus,
    appointmentStatus: nextState.appointmentStatus,
  };
}

export function buildMercadoPagoReturnUrls(baseUrl: string, tenantSlug: string, appointmentId: string) {
  const profilePath = `/${tenantSlug}/mi-perfil`;

  return {
    successUrl: `${baseUrl}${profilePath}?appointment=${appointmentId}&payment_result=approved`,
    pendingUrl: `${baseUrl}${profilePath}?appointment=${appointmentId}&payment_result=pending`,
    failureUrl: `${baseUrl}${profilePath}?appointment=${appointmentId}&payment_result=failure`,
    notificationUrl: `${baseUrl}/api/payments/mercadopago/webhook?tenant=${tenantSlug}&appointment=${appointmentId}`,
  };
}

export function getBaseUrlFromRequest(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host") ?? url.host;
  const protocol = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");

  return `${protocol}://${host}`;
}

export function buildAppointmentActiveFilter(now = new Date()): Prisma.AppointmentWhereInput {
  return {
    OR: [
      {
        status: "CONFIRMED",
      },
      {
        status: "PENDING",
        OR: [
          {
            paymentExpiresAt: null,
          },
          {
            paymentExpiresAt: {
              gt: now,
            },
          },
        ],
      },
    ],
  };
}
