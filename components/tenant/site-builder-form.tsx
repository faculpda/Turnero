"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties, DragEvent } from "react";
import type { SiteBuilderBlock, TenantPublicProfile } from "@/lib/types";

type SiteBuilderFormProps = {
  tenant: TenantPublicProfile;
};

type BlockTemplate = SiteBuilderBlock["type"];

type SelectedTarget =
  | { kind: "none" }
  | { kind: "hero"; field: "brand" | "title" | "description" | "image" }
  | { kind: "block"; blockId: string };

const blockTypeLabel: Record<BlockTemplate, string> = {
  text: "Texto",
  image: "Imagen",
  video: "Video",
  columns: "Columnas",
  cta: "Llamado a la accion",
};

const blockTypeDescription: Record<BlockTemplate, string> = {
  text: "Titulos, beneficios y secciones editoriales.",
  image: "Fotos del negocio, del equipo o del servicio.",
  video: "Videos embebidos para presentaciones o demos.",
  columns: "Grillas cortas para ventajas o diferenciales.",
  cta: "Bloques de conversion para invitar a reservar.",
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
        eyebrow: "Seccion destacada",
        title: "Cuenta algo importante sobre tu negocio",
        body: "Puedes usar este bloque para mostrar beneficios, diferenciales o informacion clara para quien visita la pagina.",
        align: "left",
      };
    case "image":
      return {
        id: createId("image"),
        type: "image",
        imageUrl: "",
        altText: "",
        caption: "Agrega una imagen que apoye la propuesta del negocio.",
        layout: "contained",
      };
    case "video":
      return {
        id: createId("video"),
        type: "video",
        title: "Presenta tu negocio en video",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        caption: "Pega un link de YouTube o Vimeo.",
      };
    case "columns":
      return {
        id: createId("columns"),
        type: "columns",
        columns: [
          {
            id: createId("col"),
            title: "Diferencial uno",
            body: "Resume en una frase que hace especial a tu atencion.",
          },
          {
            id: createId("col"),
            title: "Diferencial dos",
            body: "Aclara por que reservar contigo es una buena decision.",
          },
          {
            id: createId("col"),
            title: "Diferencial tres",
            body: "Cierra con una razon concreta para confiar en tu servicio.",
          },
        ],
      };
    case "cta":
      return {
        id: createId("cta"),
        type: "cta",
        title: "Listo para reservar",
        body: "Invita a la accion con un mensaje breve, claro y directo.",
        buttonLabel: "Reservar turno",
        buttonHref: "/reservar",
      };
  }
}

async function uploadAsset(
  tenantSlug: string,
  assetType: "logo" | "hero" | "content",
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

function getVideoEmbedUrl(input: string) {
  try {
    const url = new URL(input);

    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : input;
    }

    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : input;
    }

    if (url.hostname.includes("vimeo.com")) {
      const id = url.pathname.replace("/", "");
      return id ? `https://player.vimeo.com/video/${id}` : input;
    }

    return input;
  } catch {
    return input;
  }
}

function buildPreviewStyle(primaryColor: string, secondaryColor: string): CSSProperties {
  return {
    ["--tenant-primary" as never]: primaryColor,
    ["--tenant-secondary" as never]: secondaryColor,
  } as CSSProperties;
}

export function SiteBuilderForm({ tenant }: SiteBuilderFormProps) {
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const heroInputRef = useRef<HTMLInputElement | null>(null);
  const blockImageInputRef = useRef<HTMLInputElement | null>(null);

  const [siteTitle, setSiteTitle] = useState(tenant.siteTitle ?? tenant.name);
  const [heroTitle, setHeroTitle] = useState(tenant.headline);
  const [heroDescription, setHeroDescription] = useState(tenant.description);
  const [publicDescription, setPublicDescription] = useState(tenant.description);
  const [ctaLabel, setCtaLabel] = useState(tenant.ctaLabel ?? "Reservar turno");
  const [logoUrl, setLogoUrl] = useState(tenant.logoUrl ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(tenant.heroImageUrl ?? "");
  const [primaryColor, setPrimaryColor] = useState(tenant.primaryColor ?? "#205fc0");
  const [secondaryColor, setSecondaryColor] = useState(tenant.secondaryColor ?? "#dff1ff");
  const [siteBlocks, setSiteBlocks] = useState<SiteBuilderBlock[]>(tenant.siteBlocks ?? []);
  const [selectedTarget, setSelectedTarget] = useState<SelectedTarget>({ kind: "hero", field: "title" });
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [pendingImageBlockId, setPendingImageBlockId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedBlock =
    selectedTarget.kind === "block"
      ? siteBlocks.find((block) => block.id === selectedTarget.blockId) ?? null
      : null;

  const previewStyle = useMemo(
    () => buildPreviewStyle(primaryColor, secondaryColor),
    [primaryColor, secondaryColor],
  );

  function updateBlock(blockId: string, updater: (current: SiteBuilderBlock) => SiteBuilderBlock) {
    setSiteBlocks((current) =>
      current.map((block) => (block.id === blockId ? updater(block) : block)),
    );
  }

  function deleteBlock(blockId: string) {
    setSiteBlocks((current) => current.filter((block) => block.id !== blockId));
    setSelectedTarget({ kind: "hero", field: "title" });
  }

  function moveBlock(fromId: string, toId: string) {
    if (fromId === toId) {
      return;
    }

    setSiteBlocks((current) => {
      const fromIndex = current.findIndex((block) => block.id === fromId);
      const toIndex = current.findIndex((block) => block.id === toId);

      if (fromIndex === -1 || toIndex === -1) {
        return current;
      }

      const next = [...current];
      const [dragged] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, dragged);
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
                body: "Describe una idea concreta y facil de entender.",
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

  async function onUploadLogo(file: File) {
    setError(null);

    try {
      const url = await uploadAsset(tenant.slug, "logo", file);
      setLogoUrl(url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir el logo.");
    }
  }

  async function onUploadHero(file: File) {
    setError(null);

    try {
      const url = await uploadAsset(tenant.slug, "hero", file);
      setHeroImageUrl(url);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "No se pudo subir la imagen principal.",
      );
    }
  }

  async function onUploadBlockImage(file: File) {
    if (!pendingImageBlockId) {
      return;
    }

    setError(null);

    try {
      const url = await uploadAsset(tenant.slug, "content", file);
      updateBlock(pendingImageBlockId, (current) =>
        current.type === "image" ? { ...current, imageUrl: url } : current,
      );
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir la imagen.");
    } finally {
      setPendingImageBlockId(null);
    }
  }

  async function onSubmit() {
    setError(null);
    setIsSaving(true);

    try {
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
          siteBlocks,
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
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar la configuracion del sitio.",
      );
      setIsSaving(false);
    }
  }

  function onBlockDragStart(event: DragEvent<HTMLElement>, blockId: string) {
    setDraggedBlockId(blockId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", blockId);
  }

  function onBlockDrop(blockId: string) {
    if (!draggedBlockId) {
      return;
    }

    moveBlock(draggedBlockId, blockId);
    setDraggedBlockId(null);
  }

  function renderInspector() {
    if (selectedTarget.kind === "hero") {
      if (selectedTarget.field === "brand") {
        return (
          <div className="site-live-panel-section">
            <h3>Marca del sitio</h3>
            <label className="field">
              <span>Nombre visible</span>
              <input onChange={(e) => setSiteTitle(e.target.value)} value={siteTitle} />
            </label>
            <label className="field">
              <span>Logo por URL</span>
              <input onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." value={logoUrl} />
            </label>
            <button className="button secondary" onClick={() => logoInputRef.current?.click()} type="button">
              Cambiar logo
            </button>
          </div>
        );
      }

      if (selectedTarget.field === "title") {
        return (
          <div className="site-live-panel-section">
            <h3>Titulo principal</h3>
            <label className="field">
              <span>Titulo</span>
              <textarea onChange={(e) => setHeroTitle(e.target.value)} rows={4} value={heroTitle} />
            </label>
            <label className="field">
              <span>Color principal del sitio</span>
              <div className="color-picker-row">
                <span className="color-swatch" style={{ backgroundColor: primaryColor }} />
                <input onChange={(e) => setPrimaryColor(e.target.value)} type="color" value={primaryColor} />
                <span className="color-value">{primaryColor}</span>
              </div>
            </label>
          </div>
        );
      }

      if (selectedTarget.field === "description") {
        return (
          <div className="site-live-panel-section">
            <h3>Texto descriptivo</h3>
            <label className="field">
              <span>Descripcion principal</span>
              <textarea onChange={(e) => setHeroDescription(e.target.value)} rows={5} value={heroDescription} />
            </label>
            <label className="field">
              <span>Texto del boton principal</span>
              <input onChange={(e) => setCtaLabel(e.target.value)} value={ctaLabel} />
            </label>
            <label className="field">
              <span>Descripcion complementaria</span>
              <textarea onChange={(e) => setPublicDescription(e.target.value)} rows={3} value={publicDescription} />
            </label>
          </div>
        );
      }

      return (
        <div className="site-live-panel-section">
          <h3>Imagen principal</h3>
          <label className="field">
            <span>Imagen por URL</span>
            <input onChange={(e) => setHeroImageUrl(e.target.value)} placeholder="https://..." value={heroImageUrl} />
          </label>
          <button className="button secondary" onClick={() => heroInputRef.current?.click()} type="button">
            Cambiar imagen
          </button>
          <label className="field">
            <span>Color secundario</span>
            <div className="color-picker-row">
              <span className="color-swatch" style={{ backgroundColor: secondaryColor }} />
              <input onChange={(e) => setSecondaryColor(e.target.value)} type="color" value={secondaryColor} />
              <span className="color-value">{secondaryColor}</span>
            </div>
          </label>
        </div>
      );
    }

    if (!selectedBlock) {
      return (
        <div className="site-live-panel-empty">
          <strong>Selecciona un elemento</strong>
          <p className="muted">
            Haz click sobre un texto, imagen o bloque del lienzo para editarlo.
          </p>
        </div>
      );
    }

    if (selectedBlock.type === "text") {
      return (
        <div className="site-live-panel-section">
          <h3>Bloque de texto</h3>
          <label className="field">
            <span>Eyebrow</span>
            <input
              onChange={(e) =>
                updateBlock(selectedBlock.id, (current) =>
                  current.type === "text" ? { ...current, eyebrow: e.target.value } : current,
                )
              }
              value={selectedBlock.eyebrow ?? ""}
            />
          </label>
          <label className="field">
            <span>Titulo</span>
            <textarea
              onChange={(e) =>
                updateBlock(selectedBlock.id, (current) =>
                  current.type === "text" ? { ...current, title: e.target.value } : current,
                )
              }
              rows={3}
              value={selectedBlock.title}
            />
          </label>
          <label className="field">
            <span>Texto</span>
            <textarea
              onChange={(e) =>
                updateBlock(selectedBlock.id, (current) =>
                  current.type === "text" ? { ...current, body: e.target.value } : current,
                )
              }
              rows={5}
              value={selectedBlock.body}
            />
          </label>
          <label className="field">
            <span>Alineacion</span>
            <select
              onChange={(e) =>
                updateBlock(selectedBlock.id, (current) =>
                  current.type === "text"
                    ? { ...current, align: e.target.value === "center" ? "center" : "left" }
                    : current,
                )
              }
              value={selectedBlock.align ?? "left"}
            >
              <option value="left">Izquierda</option>
              <option value="center">Centro</option>
            </select>
          </label>
        </div>
      );
    }

    if (selectedBlock.type === "image") {
      return (
        <div className="site-live-panel-section">
          <h3>Bloque de imagen</h3>
          <label className="field">
            <span>URL de imagen</span>
            <input
              onChange={(e) =>
                updateBlock(selectedBlock.id, (current) =>
                  current.type === "image" ? { ...current, imageUrl: e.target.value } : current,
                )
              }
              placeholder="https://..."
              value={selectedBlock.imageUrl}
            />
          </label>
          <button
            className="button secondary"
            onClick={() => {
              setPendingImageBlockId(selectedBlock.id);
              blockImageInputRef.current?.click();
            }}
            type="button"
          >
            Cambiar imagen
          </button>
          <label className="field">
            <span>Texto alternativo</span>
            <input
              onChange={(e) =>
                updateBlock(selectedBlock.id, (current) =>
                  current.type === "image" ? { ...current, altText: e.target.value } : current,
                )
              }
              value={selectedBlock.altText ?? ""}
            />
          </label>
          <label className="field">
            <span>Texto complementario</span>
            <textarea
              onChange={(e) =>
                updateBlock(selectedBlock.id, (current) =>
                  current.type === "image" ? { ...current, caption: e.target.value } : current,
                )
              }
              rows={4}
              value={selectedBlock.caption ?? ""}
            />
          </label>
          <label className="field">
            <span>Formato</span>
            <select
              onChange={(e) =>
                updateBlock(selectedBlock.id, (current) =>
                  current.type === "image"
                    ? { ...current, layout: e.target.value === "wide" ? "wide" : "contained" }
                    : current,
                )
              }
              value={selectedBlock.layout ?? "contained"}
            >
              <option value="contained">Contenido</option>
              <option value="wide">Ancho completo</option>
            </select>
          </label>
        </div>
      );
    }

    if (selectedBlock.type === "video") {
      return (
        <div className="site-live-panel-section">
          <h3>Bloque de video</h3>
          <label className="field">
            <span>Titulo</span>
            <input
              onChange={(e) =>
                updateBlock(selectedBlock.id, (current) =>
                  current.type === "video" ? { ...current, title: e.target.value } : current,
                )
              }
              value={selectedBlock.title ?? ""}
            />
          </label>
          <label className="field">
            <span>URL de video</span>
            <input
              onChange={(e) =>
                updateBlock(selectedBlock.id, (current) =>
                  current.type === "video" ? { ...current, videoUrl: e.target.value } : current,
                )
              }
              value={selectedBlock.videoUrl}
            />
          </label>
          <label className="field">
            <span>Texto complementario</span>
            <textarea
              onChange={(e) =>
                updateBlock(selectedBlock.id, (current) =>
                  current.type === "video" ? { ...current, caption: e.target.value } : current,
                )
              }
              rows={4}
              value={selectedBlock.caption ?? ""}
            />
          </label>
        </div>
      );
    }

    if (selectedBlock.type === "columns") {
      return (
        <div className="site-live-panel-section">
          <h3>Bloque de columnas</h3>
          <div className="site-live-columns-editor">
            {selectedBlock.columns.map((column, index) => (
              <div className="site-column-editor-card" key={column.id}>
                <div className="site-column-editor-head">
                  <strong>Columna {index + 1}</strong>
                  {selectedBlock.columns.length > 2 ? (
                    <button onClick={() => removeColumn(selectedBlock.id, column.id)} type="button">
                      Quitar
                    </button>
                  ) : null}
                </div>
                <label className="field">
                  <span>Titulo</span>
                  <input
                    onChange={(e) =>
                      updateBlock(selectedBlock.id, (current) =>
                        current.type === "columns"
                          ? {
                              ...current,
                              columns: current.columns.map((item) =>
                                item.id === column.id ? { ...item, title: e.target.value } : item,
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
                      updateBlock(selectedBlock.id, (current) =>
                        current.type === "columns"
                          ? {
                              ...current,
                              columns: current.columns.map((item) =>
                                item.id === column.id ? { ...item, body: e.target.value } : item,
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
          </div>
          {selectedBlock.columns.length < 3 ? (
            <button className="button secondary" onClick={() => addColumn(selectedBlock.id)} type="button">
              Agregar columna
            </button>
          ) : null}
        </div>
      );
    }

    return (
      <div className="site-live-panel-section">
        <h3>Llamado a la accion</h3>
        <label className="field">
          <span>Titulo</span>
          <textarea
            onChange={(e) =>
              updateBlock(selectedBlock.id, (current) =>
                current.type === "cta" ? { ...current, title: e.target.value } : current,
              )
            }
            rows={3}
            value={selectedBlock.title}
          />
        </label>
        <label className="field">
          <span>Texto</span>
          <textarea
            onChange={(e) =>
              updateBlock(selectedBlock.id, (current) =>
                current.type === "cta" ? { ...current, body: e.target.value } : current,
              )
            }
            rows={4}
            value={selectedBlock.body}
          />
        </label>
        <label className="field">
          <span>Texto del boton</span>
          <input
            onChange={(e) =>
              updateBlock(selectedBlock.id, (current) =>
                current.type === "cta" ? { ...current, buttonLabel: e.target.value } : current,
              )
            }
            value={selectedBlock.buttonLabel}
          />
        </label>
        <label className="field">
          <span>Enlace</span>
          <input
            onChange={(e) =>
              updateBlock(selectedBlock.id, (current) =>
                current.type === "cta" ? { ...current, buttonHref: e.target.value } : current,
              )
            }
            value={selectedBlock.buttonHref}
          />
        </label>
      </div>
    );
  }

  return (
    <section className="site-live-builder" style={previewStyle}>
      <input
        accept=".png,.jpg,.jpeg,.webp,.svg"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            void onUploadLogo(file);
          }
          e.currentTarget.value = "";
        }}
        ref={logoInputRef}
        type="file"
      />
      <input
        accept=".png,.jpg,.jpeg,.webp,.svg"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            void onUploadHero(file);
          }
          e.currentTarget.value = "";
        }}
        ref={heroInputRef}
        type="file"
      />
      <input
        accept=".png,.jpg,.jpeg,.webp,.svg"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            void onUploadBlockImage(file);
          }
          e.currentTarget.value = "";
        }}
        ref={blockImageInputRef}
        type="file"
      />

      <aside className="panel site-live-sidebar">
        <div className="site-live-sidebar-head">
          <div>
            <h2>Constructor visual</h2>
            <p className="muted">
              Selecciona un elemento sobre la pagina y editalo en tiempo real.
            </p>
          </div>
          <button className="button primary" disabled={isSaving} onClick={onSubmit} type="button">
            {isSaving ? "Guardando..." : "Guardar sitio"}
          </button>
        </div>

        <section className="site-live-sidebar-section">
          <h3>Agregar bloques</h3>
          <div className="site-block-library site-block-library-compact">
            {(["text", "image", "video", "columns", "cta"] as BlockTemplate[]).map((template) => (
              <button
                className="site-block-library-item"
                key={template}
                onClick={() => {
                  const nextBlock = createBlock(template);
                  setSiteBlocks((current) => [...current, nextBlock]);
                  setSelectedTarget({ kind: "block", blockId: nextBlock.id });
                }}
                type="button"
              >
                <strong>{blockTypeLabel[template]}</strong>
                <span className="muted">{blockTypeDescription[template]}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="site-live-sidebar-section">
          <h3>Estructura de la pagina</h3>
          <div className="site-live-layer-list">
            <button
              className={`site-live-layer-item ${selectedTarget.kind === "hero" ? "active" : ""}`}
              onClick={() => setSelectedTarget({ kind: "hero", field: "title" })}
              type="button"
            >
              Cabecera principal
            </button>
            {siteBlocks.map((block, index) => (
              <button
                className={`site-live-layer-item ${
                  selectedTarget.kind === "block" && selectedTarget.blockId === block.id ? "active" : ""
                }`}
                key={block.id}
                onClick={() => setSelectedTarget({ kind: "block", blockId: block.id })}
                type="button"
              >
                {index + 1}. {blockTypeLabel[block.type]}
              </button>
            ))}
          </div>
        </section>

        {error ? <p className="form-error">{error}</p> : null}
      </aside>

      <div className="site-live-canvas-shell">
        <div className="site-live-canvas-topbar">
          <div>
            <strong>Vista en vivo</strong>
            <span className="muted">Haz click en textos, imagenes o bloques para editarlos.</span>
          </div>
          <span className="site-live-hint">Arrastra un bloque para cambiar el orden</span>
        </div>

        <div className="site-live-canvas">
          <section className="hero tenant-hero">
            <div className="tenant-hero-grid">
              <div>
                <button
                  className={`site-live-selectable ${selectedTarget.kind === "hero" && selectedTarget.field === "brand" ? "is-selected" : ""}`}
                  onClick={() => setSelectedTarget({ kind: "hero", field: "brand" })}
                  type="button"
                >
                  <div className="tenant-brand-row">
                    {logoUrl ? (
                      <img alt={siteTitle} className="tenant-logo" src={logoUrl} />
                    ) : (
                      <div className="tenant-logo-placeholder">{siteTitle.charAt(0)}</div>
                    )}
                    <div>
                      <span className="eyebrow">Marca del negocio</span>
                      <strong>{siteTitle}</strong>
                    </div>
                  </div>
                </button>

                <button
                  className={`site-live-selectable site-live-text-button ${selectedTarget.kind === "hero" && selectedTarget.field === "title" ? "is-selected" : ""}`}
                  onClick={() => setSelectedTarget({ kind: "hero", field: "title" })}
                  type="button"
                >
                  <h1>{heroTitle}</h1>
                </button>

                <button
                  className={`site-live-selectable site-live-text-button ${selectedTarget.kind === "hero" && selectedTarget.field === "description" ? "is-selected" : ""}`}
                  onClick={() => setSelectedTarget({ kind: "hero", field: "description" })}
                  type="button"
                >
                  <p className="muted hero-copy">{heroDescription}</p>
                </button>

                <div className="actions">
                  <button className="button primary tenant-primary-button" type="button">
                    {ctaLabel}
                  </button>
                  <button className="button secondary" type="button">
                    Ingresar a mi perfil
                  </button>
                </div>
              </div>

              <button
                className={`tenant-hero-media site-live-media-button ${selectedTarget.kind === "hero" && selectedTarget.field === "image" ? "is-selected" : ""}`}
                onClick={() => setSelectedTarget({ kind: "hero", field: "image" })}
                type="button"
              >
                {heroImageUrl ? (
                  <img alt={siteTitle} className="tenant-cover" src={heroImageUrl} />
                ) : (
                  <div className="tenant-cover-placeholder">
                    <strong>Imagen principal</strong>
                    <p className="muted">Selecciona este bloque para cargar una imagen.</p>
                  </div>
                )}
              </button>
            </div>
          </section>

          <section className="site-live-block-stack">
            {siteBlocks.map((block) => (
              <article
                className={`site-live-block-wrapper ${
                  selectedTarget.kind === "block" && selectedTarget.blockId === block.id ? "is-selected" : ""
                }`}
                draggable
                key={block.id}
                onClick={() => setSelectedTarget({ kind: "block", blockId: block.id })}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={(event) => onBlockDragStart(event, block.id)}
                onDrop={() => onBlockDrop(block.id)}
              >
                <div className="site-live-block-toolbar">
                  <span>{blockTypeLabel[block.type]}</span>
                  <div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteBlock(block.id);
                      }}
                      type="button"
                    >
                      Quitar
                    </button>
                  </div>
                </div>

                {block.type === "text" ? (
                  <div className={`site-block site-block-text ${block.align === "center" ? "align-center" : ""}`}>
                    {block.eyebrow ? <span className="eyebrow">{block.eyebrow}</span> : null}
                    <h2>{block.title}</h2>
                    <p className="muted">{block.body}</p>
                  </div>
                ) : null}

                {block.type === "image" ? (
                  <figure className={`site-block site-block-image ${block.layout === "wide" ? "is-wide" : ""}`}>
                    {block.imageUrl ? (
                      <img alt={block.altText ?? "Imagen del sitio"} src={block.imageUrl} />
                    ) : (
                      <div className="tenant-cover-placeholder">
                        <strong>Imagen pendiente</strong>
                        <p className="muted">Selecciona este bloque y carga una imagen.</p>
                      </div>
                    )}
                    {block.caption ? <figcaption className="muted">{block.caption}</figcaption> : null}
                  </figure>
                ) : null}

                {block.type === "video" ? (
                  <div className="site-block site-block-video">
                    {block.title ? <h2>{block.title}</h2> : null}
                    <div className="site-video-frame">
                      <iframe
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                        src={getVideoEmbedUrl(block.videoUrl)}
                        title={block.title ?? "Video del sitio"}
                      />
                    </div>
                    {block.caption ? <p className="muted">{block.caption}</p> : null}
                  </div>
                ) : null}

                {block.type === "columns" ? (
                  <div className="site-block site-block-columns">
                    {block.columns.map((column) => (
                      <article className="site-column-card" key={column.id}>
                        <h3>{column.title}</h3>
                        <p className="muted">{column.body}</p>
                      </article>
                    ))}
                  </div>
                ) : null}

                {block.type === "cta" ? (
                  <div className="site-block site-block-cta">
                    <div>
                      <h2>{block.title}</h2>
                      <p className="muted">{block.body}</p>
                    </div>
                    <button className="button primary tenant-primary-button" type="button">
                      {block.buttonLabel}
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </section>
        </div>
      </div>

      <aside className="panel site-live-inspector">
        <div className="site-live-inspector-head">
          <div>
            <h2>Propiedades</h2>
            <p className="muted">Edita el elemento seleccionado y ve el cambio al instante.</p>
          </div>
        </div>

        {renderInspector()}
      </aside>
    </section>
  );
}
