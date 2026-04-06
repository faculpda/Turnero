import { NextResponse } from "next/server";
import { syncMercadoPagoAppointmentPayment } from "@/lib/payments/mercadopago";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const tenantSlug = url.searchParams.get("tenant");
    const appointmentId = url.searchParams.get("appointment");
    const payload = (await request.json()) as {
      type?: string;
      action?: string;
      data?: {
        id?: string | number;
      };
    };

    if (!tenantSlug || !appointmentId) {
      return NextResponse.json({ ok: true });
    }

    if (payload.type !== "payment" && payload.action !== "payment.updated") {
      return NextResponse.json({ ok: true });
    }

    if (!payload.data?.id) {
      return NextResponse.json({ ok: true });
    }

    await syncMercadoPagoAppointmentPayment({
      tenantSlug,
      appointmentId,
      paymentId: String(payload.data.id),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
