"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { SiteBlocksRenderer } from "@/components/tenant/site-blocks-renderer";
import type { SiteBuilderBlock, TenantPublicProfile } from "@/lib/types";

type SiteBuilderFormProps = {
  tenant: TenantPublicProfile;
};

type BlockTemplate = SiteBuilderBlock["type"];

const blockTypeLabel: Record<BlockTemplate, string> = {
  text: "Texto",
  image: "Imagen",
  video: "Video",
  columns: "Columnas",
  cta: "Llamado a la accion",
};

const blockTypeDescription: Record<BlockTemplate, string> = {
  text: "Titulos, beneficios, propuestas de valor y secciones explicativas.",
  image: "Fotos del negocio, del equipo o de resultados destacados.",
  video: "Presentaciones, recorridos o contenido embebido desde YouTube o Vimeo.",
  columns: "Listas cortas en varias columnas para ventajas, diferenciales o pasos.",
  cta: "Cierres de venta con boton para reservar, consultar o contactar.",
};

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function createBlock(template: BlockTemplate): SiteBuilderBlock {
  switch (template) {
    case "text":
      return {
        id: createId("text"),
        type: "text",
        eyebrow: "Bloque destacado",
        title: "Titulo del bloque",
        body: "Explica un beneficio, una propuesta de valor o una seccion importante del negocio.",
        align: "left",
      };
    case "image":
      return {
        id: createId("image"),
        type: "image",
        imageUrl: "",
        altText: "",
        caption: "Agrega una imagen que refuerce la propuesta del negocio.",
        layout: "contained",
      };
    case "video":
      return {
        id: createId("video"),
        type: "video",
        title: "Presentacion del negocio",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        caption: "Puedes pegar un link de YouTube o Vimeo.",
      };
    case "columns":
      return {
        id: createId("columns"),
        type: "columns",
        columns: [
          {
            id: createId("col"),
            title: "Beneficio uno",
            body: "Resume una ventaja clara para la persona que visita la pagina.",
          },
          {
            id: createId("col"),
            title: "Beneficio dos",
            body: "Explica otra razon por la que conviene reservar o elegir el servicio.",
          },
          {
            id: createId("col"),
            title: "Beneficio tres",
            body: "Aporta contexto y ayuda a que la decision sea mas facil.",
          },
        ],
      };
    case "cta":
      return {
        id: createId("cta"),
        type: "cta",
        title: "Listo para reservar",
        body: "Invita a la persona a pasar a la accion con un mensaje directo y claro.",
        buttonLabel: "Reservar turno",
        buttonHref: "/reservar",
      };
  }
}

function duplicateBlock(block: SiteBuilderBlock): SiteBuilderBlock {
  if (block.type === "columns") {
    return {
      ...block,
      id: createId("columns"),
      columns: block.columns.map((column) => ({
        ...column,
        id: createId("col"),
      })),
    };
  }

  return {
    ...block,
    id: createId(block.type),
  };
}

async function uploadAsset(tenantSlug: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append("tenantSlug", tenantSlug);
  formData.append("assetType", "content");
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
  const [siteBlocks, setSiteBlocks] = useState<SiteBuilderBlock[]>(tenant.siteBlocks ?? []);
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

  function updateBlock(blockId: string, updater: (current: SiteBuilderBlock) => SiteBuilderBlock) {
    setSiteBlocks((current) =>
      current.map((block) => (block.id === blockId ? updater(block) : block)),
    );
  }

  function moveBlock(blockId: string, direction: "up" | "down") {
    setSiteBlocks((current) => {
      const index = current.findIndex((block) => block.id === blockId);

      if (index === -1) {
        return current;
      }

      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [block] = next.splice(index, 1);
      next.splice(targetIndex, 0, block);
      return next;
    });
  }

  function addColumn(blockId: string) {
    updateBlock(blockId, (current) =>
      current.type === "columns" && current.columns.length < 3
        ? {
            ...current,
            columns: [
              ...current.columns,
              {
                id: createId("col"),
                title: `Columna ${current.columns.length + 1}`,
                body: "Agrega un contenido corto y facil de leer.",
              },
            ],
          }
        : current,
    );
  }

  function removeColumn(blockId: string, columnId: string) {
    updateBlock(blockId, (current) =>
      current.type === "columns" && current.columns.length > 2
        ? {
            ...current,
            columns: current.columns.filter((column) => column.id !== columnId),
          }
        : current,
    );
  }

  async function uploadBlockImage(blockId: string, file: File) {
    setError(null);

    try {
      const url = await uploadAsset(tenant.slug, file);

      updateBlock(blockId, (block) =>
        block.type === "image"
          ? {
              ...block,
              imageUrl: url,
            }
          : block,
      );
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir la imagen.");
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      let finalLogoUrl = logoUrl;
      let finalHeroImageUrl = heroImageUrl;

      if (logoFile) {
        finalLogoUrl = await uploadAsset(tenant.slug, logoFile);
      }

      if (heroFile) {
        finalHeroImageUrl = await uploadAsset(tenant.slug, heroFile);
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
          siteBlocks,
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
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar la configuracion del sitio.",
      );
      setIsSaving(false);
    }
  }

  return (
    <section className="site-builder-shell site-builder-shell-advanced">
      <form className="panel site-builder-form" onSubmit={onSubmit}>
        <div className="header-row">
          <div>
            <h2>Constructor visual</h2>
            <p className="muted">
              Edita la portada del negocio con bloques, imagenes, videos y llamadas a la accion.
            </p>
          </div>
        </div>

        <section className="site-builder-section">
          <div className="site-builder-section-head">
            <div>
              <h3>Ajustes generales</h3>
              <p className="muted">
                Estos campos definen la identidad principal del sitio y del bloque de cabecera.
              </p>
            </div>
          </div>

          <div className="service-form-grid">
            <label className="field">
              <span>Titulo del sitio</span>
              <input onChange={(e) => setSiteTitle(e.target.value)} required value={siteTitle} />
            </label>

            <label className="field">
              <span>Texto del boton principal</span>
              <input onChange={(e) => setCtaLabel(e.target.value)} required value={ctaLabel} />
            </label>

            <label className="field field-wide">
              <span>Titulo principal</span>
              <input onChange={(e) => setHeroTitle(e.target.value)} required value={heroTitle} />
            </label>

            <label className="field field-wide">
              <span>Descripcion principal</span>
              <textarea
                onChange={(e) => setHeroDescription(e.target.value)}
                required
                rows={4}
                value={heroDescription}
              />
            </label>

            <label className="field field-wide">
              <span>Descripcion secundaria</span>
              <textarea
                onChange={(e) => setPublicDescription(e.target.value)}
                rows={3}
                value={publicDescription}
              />
            </label>

            <label className="field">
              <span>Logo principal por URL</span>
              <input
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                value={logoUrl}
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
                onChange={(e) => setHeroImageUrl(e.target.value)}
                placeholder="https://..."
                value={heroImageUrl}
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
                <span className="color-swatch" style={{ backgroundColor: primaryColor }} />
                <input onChange={(e) => setPrimaryColor(e.target.value)} type="color" value={primaryColor} />
                <span className="color-value">{primaryColor}</span>
              </div>
            </label>

            <label className="field">
              <span>Color secundario</span>
              <div className="color-picker-row">
                <span className="color-swatch" style={{ backgroundColor: secondaryColor }} />
                <input
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  type="color"
                  value={secondaryColor}
                />
                <span className="color-value">{secondaryColor}</span>
              </div>
            </label>
          </div>
        </section>

        <section className="site-builder-section">
          <div className="site-builder-section-head">
            <div>
              <h3>Biblioteca de bloques</h3>
              <p className="muted">
                Agrega piezas listas para armar una portada mucho mas flexible, tipo builder.
              </p>
            </div>
          </div>

          <div className="site-block-library">
            {(["text", "image", "video", "columns", "cta"] as BlockTemplate[]).map((template) => (
              <button
                className="site-block-library-item"
                key={template}
                onClick={() => setSiteBlocks((current) => [...current, createBlock(template)])}
                type="button"
              >
                <span className="site-block-library-badge">Bloque</span>
                <strong>{blockTypeLabel[template]}</strong>
                <span className="muted">{blockTypeDescription[template]}</span>
                <span className="site-block-library-link">Agregar bloque</span>
              </button>
            ))}
          </div>
        </section>

        <section className="site-builder-section">
          <div className="site-builder-section-head">
            <div>
              <h3>Contenido del sitio</h3>
              <p className="muted">
                Reordena y edita cada bloque. Esta es la base para un constructor estilo builder.
              </p>
            </div>
          </div>

          <div className="site-block-editor-list">
            {siteBlocks.length > 0 ? (
              siteBlocks.map((block, index) => (
                <article className="site-block-editor-card" key={block.id}>
                  <div className="site-block-editor-head">
                    <div>
                      <span className="site-block-type">{blockTypeLabel[block.type]}</span>
                      <strong>Bloque {index + 1}</strong>
                    </div>
                    <div className="site-block-editor-actions">
                      <button onClick={() => moveBlock(block.id, "up")} type="button">
                        Subir
                      </button>
                      <button onClick={() => moveBlock(block.id, "down")} type="button">
                        Bajar
                      </button>
                      <button
                        onClick={() =>
                          setSiteBlocks((current) => [
                            ...current.slice(0, index + 1),
                            duplicateBlock(block),
                            ...current.slice(index + 1),
                          ])
                        }
                        type="button"
                      >
                        Duplicar
                      </button>
                      <button
                        className="danger"
                        onClick={() =>
                          setSiteBlocks((current) => current.filter((item) => item.id !== block.id))
                        }
                        type="button"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>

                  {block.type === "text" ? (
                    <div className="service-form-grid">
                      <label className="field">
                        <span>Eyebrow</span>
                        <input
                          onChange={(e) =>
                            updateBlock(block.id, (current) =>
                              current.type === "text"
                                ? { ...current, eyebrow: e.target.value }
                                : current,
                            )
                          }
                          value={block.eyebrow ?? ""}
                        />
                      </label>
                      <label className="field">
                        <span>Alineacion</span>
                        <select
                          onChange={(e) =>
                            updateBlock(block.id, (current) =>
                              current.type === "text"
                                ? { ...current, align: e.target.value === "center" ? "center" : "left" }
                                : current,
                            )
                          }
                          value={block.align ?? "left"}
                        >
                          <option value="left">Izquierda</option>
                          <option value="center">Centro</option>
                        </select>
                      </label>
                      <label className="field field-wide">
                        <span>Titulo</span>
                        <input
                          onChange={(e) =>
                            updateBlock(block.id, (current) =>
                              current.type === "text" ? { ...current, title: e.target.value } : current,
                            )
                          }
                          value={block.title}
                        />
                      </label>
                      <label className="field field-wide">
                        <span>Texto</span>
                        <textarea
                          onChange={(e) =>
                            updateBlock(block.id, (current) =>
                              current.type === "text" ? { ...current, body: e.target.value } : current,
                            )
                          }
                          rows={4}
                          value={block.body}
                        />
                      </label>
                    </div>
                  ) : null}

                  {block.type === "image" ? (
                    <div className="service-form-grid">
                      <label className="field field-wide">
                        <span>URL de imagen</span>
                        <input
                          onChange={(e) =>
                            updateBlock(block.id, (current) =>
                              current.type === "image"
                                ? { ...current, imageUrl: e.target.value }
                                : current,
                            )
                          }
                          placeholder="https://..."
                          value={block.imageUrl}
                        />
                      </label>
                      <label className="field">
                        <span>Imagen desde tu equipo</span>
                        <input
                          accept=".png,.jpg,.jpeg,.webp,.svg"
                          onChange={(e) => {
                            const file = e.target.files?.[0];

                            if (file) {
                              void uploadBlockImage(block.id, file);
                            }
                          }}
                          type="file"
                        />
                      </label>
                      <label className="field">
                        <span>Formato</span>
                        <select
                          onChange={(e) =>
                            updateBlock(block.id, (current) =>
                              current.type === "image"
                                ? { ...current, layout: e.target.value === "wide" ? "wide" : "contained" }
                                : current,
                            )
                          }
                          value={block.layout ?? "contained"}
                        >
                          <option value="contained">Contenido</option>
                          <option value="wide">Ancho completo</option>
                        </select>
                      </label>
                      <label className="field">
                        <span>Texto alternativo</span>
                        <input
                          onChange={(e) =>
                            updateBlock(block.id, (current) =>
                              current.type === "image"
                                ? { ...current, altText: e.target.value }
                                : current,
                            )
                          }
                          value={block.altText ?? ""}
                        />
                      </label>
                      <label className="field field-wide">
                        <span>Caption</span>
                        <textarea
                          onChange={(e) =>
                            updateBlock(block.id, (current) =>
                              current.type === "image"
                                ? { ...current, caption: e.target.value }
                                : current,
                            )
                          }
                          rows={3}
                          value={block.caption ?? ""}
                        />
                      </label>
                    </div>
                  ) : null}

                  {block.type === "video" ? (
                    <div className="service-form-grid">
                      <label className="field field-wide">
                        <span>Titulo</span>
                        <input
                          onChange={(e) =>
                            updateBlock(block.id, (current) =>
                              current.type === "video" ? { ...current, title: e.target.value } : current,
                            )
                          }
                          value={block.title ?? ""}
                        />
                      </label>
                      <label className="field field-wide">
                        <span>URL de YouTube o Vimeo</span>
                        <input
                          onChange={(e) =>
                            updateBlock(block.id, (current) =>
                              current.type === "video"
                                ? { ...current, videoUrl: e.target.value }
                                : current,
                            )
                          }
                          value={block.videoUrl}
                        />
                      </label>
                      <label className="field field-wide">
                        <span>Texto complementario</span>
                        <textarea
                          onChange={(e) =>
                            updateBlock(block.id, (current) =>
                              current.type === "video"
                                ? { ...current, caption: e.target.value }
                                : current,
                            )
                          }
                          rows={3}
                          value={block.caption ?? ""}
                        />
                      </label>
                    </div>
                  ) : null}

                  {block.type === "columns" ? (
                    <div className="site-columns-editor">
                      {block.columns.map((column, columnIndex) => (
                        <div className="site-column-editor-card" key={column.id}>
                          <div className="site-column-editor-head">
                            <strong>Columna {columnIndex + 1}</strong>
                            {block.columns.length > 2 ? (
                              <button
                                className="site-column-remove"
                                onClick={() => removeColumn(block.id, column.id)}
                                type="button"
                              >
                                Quitar
                              </button>
                            ) : null}
                          </div>
                          <label className="field">
                            <span>Titulo</span>
                            <input
                              onChange={(e) =>
                                updateBlock(block.id, (current) =>
                                  current.type === "columns"
                                    ? {
                                        ...current,
                                        columns: current.columns.map((item) =>
                                          item.id === column.id
                                            ? { ...item, title: e.target.value }
                                            : item,
                                        ),
                                      }
                                    : current,
                                )
                              }
                              value={column.title}
                            />
                          </label>
                          <label className="field">
                            <span>Texto</span>
                            <textarea
                              onChange={(e) =>
                                updateBlock(block.id, (current) =>
                                  current.type === "columns"
                                    ? {
                                        ...current,
                                        columns: current.columns.map((item) =>
                                          item.id === column.id
                                            ? { ...item, body: e.target.value }
                                            : item,
                                        ),
                                      }
                                    : current,
                                )
                              }
                              rows={4}
                              value={column.body}
                            />
                          </label>
                        </div>
                      ))}
                      {block.columns.length < 3 ? (
                        <button
                          className="site-column-add"
                          onClick={() => addColumn(block.id)}
                          type="button"
                        >
                          Agregar columna
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  {block.type === "cta" ? (
                    <div className="service-form-grid">
                      <label className="field field-wide">
                        <span>Titulo</span>
                        <input
                          onChange={(e) =>
                            updateBlock(block.id, (current) =>
                              current.type === "cta" ? { ...current, title: e.target.value } : current,
                            )
                          }
                          value={block.title}
                        />
                      </label>
                      <label className="field field-wide">
                        <span>Texto</span>
                        <textarea
                          onChange={(e) =>
                            updateBlock(block.id, (current) =>
                              current.type === "cta" ? { ...current, body: e.target.value } : current,
                            )
                          }
                          rows={3}
                          value={block.body}
                        />
                      </label>
                      <label className="field">
                        <span>Texto del boton</span>
                        <input
                          onChange={(e) =>
                            updateBlock(block.id, (current) =>
                              current.type === "cta"
                                ? { ...current, buttonLabel: e.target.value }
                                : current,
                            )
                          }
                          value={block.buttonLabel}
                        />
                      </label>
                      <label className="field">
                        <span>Enlace del boton</span>
                        <input
                          onChange={(e) =>
                            updateBlock(block.id, (current) =>
                              current.type === "cta"
                                ? { ...current, buttonHref: e.target.value }
                                : current,
                            )
                          }
                          value={block.buttonHref}
                        />
                      </label>
                    </div>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="dashboard-empty-state">
                <strong>Todavia no agregaste bloques personalizados.</strong>
                <p className="muted">
                  Empieza con texto, una imagen o un llamado a la accion para diferenciar tu sitio.
                </p>
              </div>
            )}
          </div>
        </section>

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

        <SiteBlocksRenderer
          blocks={siteBlocks}
          preview
          tenant={{ slug: tenant.slug }}
          useSlugRoutes
        />
      </aside>
    </section>
  );
}
