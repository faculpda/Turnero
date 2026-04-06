"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TenantPublicProfile } from "@/lib/types";

type PaymentSettingsFormProps = {
  tenant: TenantPublicProfile;
};

export function PaymentSettingsForm({ tenant }: PaymentSettingsFormProps) {
  const router = useRouter();
  const [mercadoPagoEnabled, setMercadoPagoEnabled] = useState(
    tenant.paymentSettings?.mercadoPagoEnabled ?? false,
  );
  const [mercadoPagoPublicKey, setMercadoPagoPublicKey] = useState(
    tenant.paymentSettings?.mercadoPagoPublicKey ?? "",
  );
  const [mercadoPagoAccessToken, setMercadoPagoAccessToken] = useState("");
  const [mercadoPagoWebhookSecret, setMercadoPagoWebhookSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    const response = await fetch("/api/tenants/payment-settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tenantSlug: tenant.slug,
        mercadoPagoEnabled,
        mercadoPagoPublicKey,
        mercadoPagoAccessToken,
        mercadoPagoWebhookSecret,
      }),
    });

    const payload = (await response.json()) as { ok?: boolean; error?: string };

    if (!response.ok || !payload.ok) {
      setError(payload.error ?? "No se pudo guardar la configuracion de cobros.");
      setIsSaving(false);
      return;
    }

    setMercadoPagoAccessToken("");
    setMercadoPagoWebhookSecret("");
    setIsSaving(false);
    router.refresh();
  }

  return (
    <section className="grid">
      <article className="panel">
        <div className="header-row">
          <div>
            <h2>Cobros con Mercado Pago</h2>
            <p className="muted">
              Cada tenant puede conectar su propia cuenta de Mercado Pago Argentina para cobrar
              servicios online desde la reserva.
            </p>
          </div>
        </div>

        <form className="service-form-grid" onSubmit={onSubmit}>
          <label className="field field-wide">
            <span className="field-checkbox">
              <input
                checked={mercadoPagoEnabled}
                onChange={(event) => setMercadoPagoEnabled(event.target.checked)}
                type="checkbox"
              />
              <span>Solicitar pago online al reservar</span>
            </span>
          </label>

          <label className="field field-wide">
            <span>Public Key</span>
            <input
              placeholder="APP_USR-..."
              value={mercadoPagoPublicKey}
              onChange={(event) => setMercadoPagoPublicKey(event.target.value)}
            />
          </label>

          <label className="field field-wide">
            <span>Access Token</span>
            <input
              placeholder={
                tenant.paymentSettings?.hasMercadoPagoAccessToken
                  ? "Dejar vacio para conservar el token actual"
                  : "APP_USR-..."
              }
              value={mercadoPagoAccessToken}
              onChange={(event) => setMercadoPagoAccessToken(event.target.value)}
            />
          </label>

          <label className="field field-wide">
            <span>Webhook Secret</span>
            <input
              placeholder={
                tenant.paymentSettings?.hasMercadoPagoWebhookSecret
                  ? "Dejar vacio para conservar el secret actual"
                  : "Secret de notificaciones de Mercado Pago"
              }
              value={mercadoPagoWebhookSecret}
              onChange={(event) => setMercadoPagoWebhookSecret(event.target.value)}
            />
          </label>

          <div className="panel subtle-panel field-wide">
            <strong>Estado actual</strong>
            <p className="muted">
              Public Key: {tenant.paymentSettings?.mercadoPagoPublicKey ? "configurada" : "sin configurar"}
            </p>
            <p className="muted">
              Access Token: {tenant.paymentSettings?.hasMercadoPagoAccessToken ? "configurado" : "sin configurar"}
            </p>
            <p className="muted">
              Webhook Secret: {tenant.paymentSettings?.hasMercadoPagoWebhookSecret ? "configurado" : "sin configurar"}
            </p>
          </div>

          {error ? <p className="form-error field-wide">{error}</p> : null}

          <div className="actions field-wide">
            <button className="button primary" disabled={isSaving} type="submit">
              {isSaving ? "Guardando..." : "Guardar cobros"}
            </button>
          </div>
        </form>
      </article>
    </section>
  );
}
