"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import type { TenantPublicProfile } from "@/lib/types";

type SiteBuilderFormProps = {
  tenant: TenantPublicProfile;
};

async function uploadAsset(
  tenantSlug: string,
  assetType: "logo" | "hero",
  file: File,
): Promise<string> {
  const formData = new FormData();
  formData.append("tenantSlug", tenantSlug);
  formData.append("assetType", assetType);
  formData.append("file", file);

  const response = await fetch("/api/tenants/assets", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as { ok?: boolean; error?: string; url?: string };

  if (!response.ok || !payload.ok || !payload.url) {
    throw new Error(payload.error ?? "No se pudo subir el archivo.");
  }

  return payload.url;
}

function buildPreviewStyle(primaryColor: string, secondaryColor: string): CSSProperties {
  return {
    ["--tenant-primary" as never]: primaryColor,
    ["--tenant-secondary" as never]: secondaryColor,
  } as CSSProperties;
}

export function SiteBuilderForm({ tenant }: SiteBuilderFormProps) {
  const router = useRouter();
  const [siteTitle, setSiteTitle] = useState(tenant.siteTitle ?? tenant.name);
  const [heroTitle, setHeroTitle] = useState(tenant.headline);
  const [heroDescription, setHeroDescription] = useState(tenant.description);
  const [publicDescription, setPublicDescription] = useState(tenant.description);
  const [ctaLabel, setCtaLabel] = useState(tenant.ctaLabel ?? "Reservar turno");
  const [logoUrl, setLogoUrl] = useState(tenant.logoUrl ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(tenant.heroImageUrl ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [primaryColor, setPrimaryColor] = useState(tenant.primaryColor ?? "#205fc0");
  const [secondaryColor, setSecondaryColor] = useState(tenant.secondaryColor ?? "#dff1ff");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const previewLogo = useMemo(
    () => (logoFile ? URL.createObjectURL(logoFile) : logoUrl),
    [logoFile, logoUrl],
  );
  const previewHero = useMemo(
    () => (heroFile ? URL.createObjectURL(heroFile) : heroImageUrl),
    [heroFile, heroImageUrl],
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      let finalLogoUrl = logoUrl;
      let finalHeroImageUrl = heroImageUrl;

      if (logoFile) {
        finalLogoUrl = await uploadAsset(tenant.slug, "logo", logoFile);
      }

      if (heroFile) {
        finalHeroImageUrl = await uploadAsset(tenant.slug, "hero", heroFile);
      }

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
          logoUrl: finalLogoUrl,
          heroImageUrl: finalHeroImageUrl,
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

      setLogoUrl(finalLogoUrl);
      setHeroImageUrl(finalHeroImageUrl);
      setLogoFile(null);
      setHeroFile(null);
      setIsSaving(false);
      router.refresh();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "No se pudo guardar la configuracion del sitio.",
      );
      setIsSaving(false);
    }
  }

  return (
    <section className="site-builder-shell">
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
            <span>Logo principal por URL</span>
            <input
              placeholder="https://..."
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Logo principal desde tu equipo</span>
            <input
              accept=".png,.jpg,.jpeg,.webp,.svg"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              type="file"
            />
          </label>

          <label className="field">
            <span>Imagen de cabecera por URL</span>
            <input
              placeholder="https://..."
              value={heroImageUrl}
              onChange={(e) => setHeroImageUrl(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Imagen de cabecera desde tu equipo</span>
            <input
              accept=".png,.jpg,.jpeg,.webp,.svg"
              onChange={(e) => setHeroFile(e.target.files?.[0] ?? null)}
              type="file"
            />
          </label>

          <label className="field">
            <span>Color principal</span>
            <div className="color-picker-row">
              <span
                className="color-swatch"
                style={{ backgroundColor: primaryColor }}
              />
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
              />
              <span className="color-value">{primaryColor}</span>
            </div>
          </label>

          <label className="field">
            <span>Color secundario</span>
            <div className="color-picker-row">
              <span
                className="color-swatch"
                style={{ backgroundColor: secondaryColor }}
              />
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
              />
              <span className="color-value">{secondaryColor}</span>
            </div>
          </label>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="actions">
          <button className="button primary" disabled={isSaving} type="submit">
            {isSaving ? "Guardando..." : "Guardar sitio"}
          </button>
        </div>
      </form>

      <aside className="panel site-preview-panel" style={buildPreviewStyle(primaryColor, secondaryColor)}>
        <div className="header-row">
          <div>
            <h2>Previsualizacion</h2>
            <p className="muted">Vista aproximada de como se vera la portada publica.</p>
          </div>
        </div>

        <div className="site-preview-hero">
          <div className="tenant-brand-row">
            {previewLogo ? (
              <img alt={siteTitle} className="tenant-logo" src={previewLogo} />
            ) : (
              <div className="tenant-logo-placeholder">{siteTitle.charAt(0)}</div>
            )}
            <div>
              <span className="eyebrow preview-eyebrow">Sitio del cliente</span>
              <strong>{siteTitle}</strong>
            </div>
          </div>

          <h2 className="site-preview-title">{heroTitle}</h2>
          <p className="muted">{heroDescription}</p>

          <div className="actions">
            <button className="button primary tenant-primary-button" type="button">
              {ctaLabel}
            </button>
            <button className="button secondary" type="button">
              Mi perfil
            </button>
          </div>

          {previewHero ? (
            <img alt={siteTitle} className="site-preview-image" src={previewHero} />
          ) : (
            <div className="tenant-cover-placeholder site-preview-image">
              <strong>{siteTitle}</strong>
              <p className="muted">{publicDescription}</p>
            </div>
          )}
        </div>
      </aside>
    </section>
  );
}
