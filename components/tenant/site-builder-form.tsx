"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TenantPublicProfile } from "@/lib/types";

type SiteBuilderFormProps = {
  tenant: TenantPublicProfile;
};

export function SiteBuilderForm({ tenant }: SiteBuilderFormProps) {
  const router = useRouter();
  const [siteTitle, setSiteTitle] = useState(tenant.siteTitle ?? tenant.name);
  const [heroTitle, setHeroTitle] = useState(tenant.headline);
  const [heroDescription, setHeroDescription] = useState(tenant.description);
  const [publicDescription, setPublicDescription] = useState(tenant.description);
  const [ctaLabel, setCtaLabel] = useState(tenant.ctaLabel ?? "Reservar turno");
  const [logoUrl, setLogoUrl] = useState(tenant.logoUrl ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(tenant.heroImageUrl ?? "");
  const [primaryColor, setPrimaryColor] = useState(tenant.primaryColor ?? "#205fc0");
  const [secondaryColor, setSecondaryColor] = useState(tenant.secondaryColor ?? "#dff1ff");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    const response = await fetch("/api/tenants/site-config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tenantSlug: tenant.slug,
        siteTitle,
        heroTitle,
        heroDescription,
        publicDescription,
        ctaLabel,
        logoUrl,
        heroImageUrl,
        primaryColor,
        secondaryColor,
      }),
    });

    const payload = (await response.json()) as { ok?: boolean; error?: string };

    if (!response.ok || !payload.ok) {
      setError(payload.error ?? "No se pudo guardar la configuracion del sitio.");
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    router.refresh();
  }

  return (
    <form className="panel site-builder-form" onSubmit={onSubmit}>
      <div className="header-row">
        <div>
          <h2>Constructor del sitio</h2>
          <p className="muted">
            Personaliza la portada publica del negocio sin afectar la reserva de turnos.
          </p>
        </div>
      </div>

      <div className="service-form-grid">
        <label className="field">
          <span>Titulo del sitio</span>
          <input value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} required />
        </label>

        <label className="field">
          <span>Texto del boton principal</span>
          <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} required />
        </label>

        <label className="field field-wide">
          <span>Titulo principal</span>
          <input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} required />
        </label>

        <label className="field field-wide">
          <span>Descripcion principal</span>
          <textarea
            rows={4}
            value={heroDescription}
            onChange={(e) => setHeroDescription(e.target.value)}
            required
          />
        </label>

        <label className="field field-wide">
          <span>Descripcion secundaria</span>
          <textarea
            rows={3}
            value={publicDescription}
            onChange={(e) => setPublicDescription(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Logo principal (URL)</span>
          <input
            placeholder="https://..."
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Imagen de cabecera (URL)</span>
          <input
            placeholder="https://..."
            value={heroImageUrl}
            onChange={(e) => setHeroImageUrl(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Color principal</span>
          <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
        </label>

        <label className="field">
          <span>Color secundario</span>
          <input
            type="color"
            value={secondaryColor}
            onChange={(e) => setSecondaryColor(e.target.value)}
          />
        </label>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="actions">
        <button className="button primary" disabled={isSaving} type="submit">
          {isSaving ? "Guardando..." : "Guardar sitio"}
        </button>
      </div>
    </form>
  );
}
