"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { findThemeOneStyle, themeOneStyles } from "@/lib/theme-presets";
import type { SiteBuilderBlock, TenantPublicProfile } from "@/lib/types";

type ThemeGalleryProps = {
  tenant: TenantPublicProfile;
};

function buildPreviewBlocks(styleId: string) {
  if (styleId === "tema1_rosa") {
    return ["Atencion cuidada", "Reserva simple", "Recordatorios claros"];
  }

  if (styleId === "tema1_grafito") {
    return ["Imagen profesional", "Agenda ordenada", "Confirmacion inmediata"];
  }

  if (styleId === "tema1_verde") {
    return ["Calma visual", "Horarios reales", "Reserva sin vueltas"];
  }

  if (styleId === "tema1_indigo") {
    return ["Estilo premium", "Turnos online", "Proceso confiable"];
  }

  if (styleId === "tema1_terracota") {
    return ["Atencion cercana", "Reserva clara", "Experiencia humana"];
  }

  return ["Reserva rapida", "Horarios reales", "Confirmacion simple"];
}

export function ThemeGallery({ tenant }: ThemeGalleryProps) {
  const router = useRouter();
  const currentStyle = useMemo(
    () =>
      findThemeOneStyle(
        tenant.primaryColor ?? "#205fc0",
        tenant.secondaryColor ?? "#eef4ff",
      ) ?? themeOneStyles[0],
    [tenant.primaryColor, tenant.secondaryColor],
  );
  const [selectedStyleId, setSelectedStyleId] = useState(currentStyle.id);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedStyle =
    themeOneStyles.find((style) => style.id === selectedStyleId) ?? themeOneStyles[0];

  const isSelectedStyleActive = selectedStyle.id === currentStyle.id;
  const previewBlocks = buildPreviewBlocks(selectedStyle.id);

  async function activateThemeStyle() {
    setError(null);

    const payload: {
      tenantSlug: string;
      siteTitle: string;
      heroTitle: string;
      heroDescription: string;
      publicDescription: string;
      ctaLabel: string;
      logoUrl: string;
      heroImageUrl: string;
      heroLayout: "content-left" | "image-left";
      primaryColor: string;
      secondaryColor: string;
      siteBlocks: SiteBuilderBlock[];
    } = {
      tenantSlug: tenant.slug,
      siteTitle: tenant.siteTitle ?? tenant.name,
      heroTitle: tenant.headline,
      heroDescription: tenant.description,
      publicDescription: tenant.description,
      ctaLabel: tenant.ctaLabel ?? "Reservar turno",
      logoUrl: tenant.logoUrl ?? "",
      heroImageUrl: tenant.heroImageUrl ?? "",
      heroLayout: tenant.heroLayout ?? "content-left",
      primaryColor: selectedStyle.primaryColor,
      secondaryColor: selectedStyle.secondaryColor,
      siteBlocks: tenant.siteBlocks ?? [],
    };

    startTransition(async () => {
      const response = await fetch("/api/tenants/site-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        setError(result.error ?? "No se pudo activar el estilo.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <section className="site-theme-gallery">
      <div className="site-theme-gallery-head">
        <div>
          <span className="eyebrow">Temas del sitio</span>
          <h1>Elige como se vera tu pagina</h1>
          <p className="muted">
            Primero eliges el tema general. Despues, si quieres, lo personalizas en detalle.
          </p>
        </div>
      </div>

      <div className="site-theme-grid">
        <article className="site-theme-browser-card">
            <div className="site-theme-browser-preview" style={{
              ["--tenant-primary" as never]: selectedStyle.primaryColor,
              ["--tenant-secondary" as never]: selectedStyle.secondaryColor,
            } as CSSProperties}>
            <div className="site-theme-preview-frame">
              <div className="site-theme-preview-topbar">
                <div className="site-theme-preview-logo" />
                <div className="site-theme-preview-links">
                  <span />
                  <span />
                </div>
              </div>
              <div className="site-theme-preview-hero">
                <div className="site-theme-preview-banner" />
              </div>
              <div className="site-theme-preview-info-row">
                {previewBlocks.map((item) => (
                  <div className="site-theme-preview-info" key={item}>
                    <span className="site-theme-preview-dot" />
                    <strong>{item}</strong>
                  </div>
                ))}
              </div>
              <div className="site-theme-preview-form">
                <div className="site-theme-preview-form-head">
                  <span>Pedir turno</span>
                  <strong>Formulario principal</strong>
                </div>
                <div className="site-theme-preview-form-step is-active">Servicio</div>
                <div className="site-theme-preview-form-step">Profesional</div>
                <div className="site-theme-preview-form-step">Horario</div>
                <div className="site-theme-preview-form-action">Reservar ahora</div>
              </div>
            </div>
          </div>

          <div className="site-theme-browser-footer">
            <div className="site-theme-browser-title-row">
              <div>
                <strong>Tema 1</strong>
                <p className="muted">
                  El tema principal del sistema, pensado para reservas claras y una experiencia simple.
                </p>
              </div>
              <span className="site-theme-status-badge">Activo</span>
            </div>

            <div className="site-theme-style-picker">
              <span className="site-theme-style-label">Estilos</span>
              <div className="site-theme-style-options">
                {themeOneStyles.map((style) => (
                  <button
                    className={`site-theme-style-option ${selectedStyle.id === style.id ? "is-selected" : ""}`}
                    key={style.id}
                    onClick={() => setSelectedStyleId(style.id)}
                    type="button"
                  >
                    <div className="site-theme-style-option-swatches">
                      <span
                        className="site-template-swatch"
                        style={{ backgroundColor: style.primaryColor }}
                      />
                      <span
                        className="site-template-swatch"
                        style={{ backgroundColor: style.secondaryColor }}
                      />
                    </div>
                    <strong>{style.name}</strong>
                    <span className="muted">{style.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="site-theme-browser-actions">
              {isSelectedStyleActive ? (
                <span className="site-theme-inline-state">Estilo activo</span>
              ) : (
                <button className="button primary" disabled={isPending} onClick={activateThemeStyle} type="button">
                  {isPending ? "Activando..." : "Activar estilo"}
                </button>
              )}
              <Link className="button secondary" href={`/app/personalizar/editor?tenant=${tenant.slug}`}>
                Personalizar
              </Link>
            </div>

            {error ? <p className="form-error">{error}</p> : null}
          </div>
        </article>
      </div>
    </section>
  );
}
