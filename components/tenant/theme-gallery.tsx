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

type ThemeCard = {
  id: string;
  name: string;
  description: string;
};

const themeCards: ThemeCard[] = [
  {
    id: "tema1",
    name: "Tema 1",
    description: "El tema principal del sistema, pensado para una reserva simple, clara y profesional.",
  },
];

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
  const previewBlocks = buildPreviewBlocks(selectedStyle.id);
  const isSelectedStyleActive = selectedStyle.id === currentStyle.id;

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
        headers: { "Content-Type": "application/json" },
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
        <span className="eyebrow">Temas del sitio</span>
        <h1>Elige un tema para tu pagina</h1>
        <p className="muted">
          Selecciona el tema, prueba un estilo de color y luego personalizalo si quieres ajustar el detalle fino.
        </p>
      </div>

      <div className="site-theme-cards-grid">
        {themeCards.map((theme) => (
          <article className="site-theme-card-item" key={theme.id}>
            <div
              className="site-theme-card-preview"
              style={
                {
                  ["--tenant-primary" as never]: selectedStyle.primaryColor,
                  ["--tenant-secondary" as never]: selectedStyle.secondaryColor,
                } as CSSProperties
              }
            >
              <div className="site-theme-card-preview-shell">
                <div className="site-theme-card-preview-topbar">
                  <div className="site-theme-card-preview-logo" />
                  <div className="site-theme-card-preview-links">
                    <span />
                    <span />
                  </div>
                </div>

                <div className="site-theme-card-preview-banner" />

                <div className="site-theme-card-preview-info-grid">
                  {previewBlocks.map((item) => (
                    <div className="site-theme-card-preview-info" key={item}>
                      <span className="site-theme-card-preview-dot" />
                      <strong>{item}</strong>
                    </div>
                  ))}
                </div>

                <div className="site-theme-card-preview-form">
                  <span>Pedir turno</span>
                  <strong>Formulario principal</strong>
                  <div className="site-theme-card-preview-step is-active">Servicio</div>
                  <div className="site-theme-card-preview-step">Profesional</div>
                  <div className="site-theme-card-preview-step">Horario</div>
                  <div className="site-theme-card-preview-button">Reservar ahora</div>
                </div>
              </div>
            </div>

            <div className="site-theme-card-footer">
              <div className="site-theme-card-title-row">
                <div>
                  <strong>{theme.name}</strong>
                  <p className="muted">{theme.description}</p>
                </div>
                <span className="site-theme-card-badge">Activo</span>
              </div>

              <div className="site-theme-card-style-section">
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

              <div className="site-theme-card-actions">
                {isSelectedStyleActive ? (
                  <span className="site-theme-inline-state">Estilo activo</span>
                ) : (
                  <button className="button primary" disabled={isPending} onClick={activateThemeStyle} type="button">
                    {isPending ? "Activando..." : "Activar"}
                  </button>
                )}
                <Link className="button secondary" href={`/app/personalizar/editor?tenant=${tenant.slug}`}>
                  Personalizar
                </Link>
              </div>

              {error ? <p className="form-error">{error}</p> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
