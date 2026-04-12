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

type TemplatePreset = {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  heroLayout: "content-left" | "image-left";
  heroImageUrl: string;
  siteBlocks: SiteBuilderBlock[];
};

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
        titleSize: "lg",
        bodySize: "md",
        tone: "dark",
        width: "normal",
      };
    case "image":
      return {
        id: createId("image"),
        type: "image",
        imageUrl: "",
        altText: "",
        caption: "Agrega una imagen que apoye la propuesta del negocio.",
        layout: "contained",
        height: "medium",
      };
    case "video":
      return {
        id: createId("video"),
        type: "video",
        title: "Presenta tu negocio en video",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        caption: "Pega un link de YouTube o Vimeo.",
        width: "normal",
      };
    case "columns":
      return {
        id: createId("columns"),
        type: "columns",
        layout: "equal",
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
        titleSize: "lg",
        bodySize: "md",
        theme: "soft",
        width: "normal",
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

function textToneClass(tone?: "dark" | "brand" | "muted") {
  return `site-tone-${tone ?? "dark"}`;
}

const widthScale = ["compact", "normal", "wide", "full"] as const;
const heightScale = ["small", "medium", "large"] as const;

function stepWidth(
  current: "compact" | "normal" | "wide" | "full" | undefined,
  direction: "down" | "up",
) {
  const index = widthScale.indexOf(current ?? "normal");
  const nextIndex = direction === "up" ? Math.min(index + 1, widthScale.length - 1) : Math.max(index - 1, 0);
  return widthScale[nextIndex];
}

function stepHeight(
  current: "small" | "medium" | "large" | undefined,
  direction: "down" | "up",
) {
  const index = heightScale.indexOf(current ?? "medium");
  const nextIndex = direction === "up" ? Math.min(index + 1, heightScale.length - 1) : Math.max(index - 1, 0);
  return heightScale[nextIndex];
}

function renderResizeControls(
  options: {
    onWidthDown?: () => void;
    onWidthUp?: () => void;
    onHeightDown?: () => void;
    onHeightUp?: () => void;
  },
) {
  if (!options.onWidthDown && !options.onHeightDown) {
    return null;
  }

  return (
    <div className="site-live-resize-controls">
      {options.onWidthDown || options.onWidthUp ? (
        <div className="site-live-resize-group">
          <span>Ancho</span>
          <button onClick={options.onWidthDown} type="button">
            -
          </button>
          <button onClick={options.onWidthUp} type="button">
            +
          </button>
        </div>
      ) : null}
      {options.onHeightDown || options.onHeightUp ? (
        <div className="site-live-resize-group">
          <span>Alto</span>
          <button onClick={options.onHeightDown} type="button">
            -
          </button>
          <button onClick={options.onHeightUp} type="button">
            +
          </button>
        </div>
      ) : null}
    </div>
  );
}

function buildTemplatePresets(copy: {
  siteTitle: string;
  heroTitle: string;
  heroDescription: string;
  ctaLabel: string;
}): TemplatePreset[] {
  return [
    {
      id: "template_aura",
      name: "Plantilla Aura",
      description: "Limpia, clara y enfocada en transmitir confianza.",
      primaryColor: "#2f5bff",
      secondaryColor: "#e9f0ff",
      heroLayout: "content-left",
      heroImageUrl:
        "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1400&q=80",
      siteBlocks: [
        {
          id: createId("text"),
          type: "text",
          eyebrow: "Atencion profesional",
          title: copy.heroTitle,
          body: copy.heroDescription,
          align: "left",
          titleSize: "xl",
          bodySize: "lg",
          tone: "dark",
          width: "wide",
        },
        {
          id: createId("columns"),
          type: "columns",
          layout: "equal",
          columns: [
            {
              id: createId("col"),
              title: "Reserva clara",
              body: "Tus clientes entienden rapido como reservar y que esperar del servicio.",
            },
            {
              id: createId("col"),
              title: "Imagen cuidada",
              body: "La pagina muestra una presencia profesional sin verse sobrecargada.",
            },
            {
              id: createId("col"),
              title: "Conversion directa",
              body: "Todo acompana para que la persona termine reservando sin friccion.",
            },
          ],
        },
        {
          id: createId("cta"),
          type: "cta",
          title: `${copy.siteTitle} listo para recibir reservas`,
          body: "Invita a la accion con una propuesta clara y un recorrido simple.",
          buttonLabel: copy.ctaLabel,
          buttonHref: "/reservar",
          titleSize: "lg",
          bodySize: "md",
          theme: "solid",
        },
      ],
    },
    {
      id: "template_horizonte",
      name: "Plantilla Horizonte",
      description: "Mas visual, con imagen protagonista y ritmo editorial.",
      primaryColor: "#1543a7",
      secondaryColor: "#eef6ff",
      heroLayout: "image-left",
      heroImageUrl:
        "https://images.unsplash.com/photo-1516549655669-df6c8ca700e9?auto=format&fit=crop&w=1400&q=80",
      siteBlocks: [
        {
          id: createId("image"),
          type: "image",
          imageUrl:
            "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1400&q=80",
          altText: `Espacio visual de ${copy.siteTitle}`,
          caption: "Una imagen fuerte ayuda a que la pagina tenga mas personalidad.",
          layout: "wide",
          height: "large",
        },
        {
          id: createId("text"),
          type: "text",
          eyebrow: "Experiencia digital",
          title: "Presenta tu negocio como una marca moderna y confiable",
          body: "Esta composicion prioriza la imagen, el aire visual y un mensaje corto pero potente.",
          align: "center",
          titleSize: "xl",
          bodySize: "md",
          tone: "brand",
          width: "wide",
        },
        {
          id: createId("cta"),
          type: "cta",
          title: "Convierte visitas en reservas",
          body: "Haz que cada seccion acerque al visitante a la agenda de turnos.",
          buttonLabel: copy.ctaLabel,
          buttonHref: "/reservar",
          titleSize: "xl",
          bodySize: "md",
          theme: "soft",
        },
      ],
    },
    {
      id: "template_editorial",
      name: "Plantilla Editorial",
      description: "Mas narrativa, con contraste y bloques amplios.",
      primaryColor: "#1f3d74",
      secondaryColor: "#f3f7fd",
      heroLayout: "content-left",
      heroImageUrl:
        "https://images.unsplash.com/photo-1511174511562-5f7f18b874f8?auto=format&fit=crop&w=1400&q=80",
      siteBlocks: [
        {
          id: createId("text"),
          type: "text",
          eyebrow: "Propuesta de valor",
          title: `${copy.siteTitle}: una experiencia de reserva que se siente propia`,
          body: "Ideal para negocios que quieren una portada mas de marca, con narrativa y secciones bien diferenciadas.",
          align: "left",
          titleSize: "xl",
          bodySize: "md",
          tone: "dark",
          width: "wide",
        },
        {
          id: createId("columns"),
          type: "columns",
          layout: "feature-left",
          columns: [
            {
              id: createId("col"),
              title: "Diseno flexible",
              body: "Acomoda mensajes, imagenes y llamados a la accion segun tu estilo.",
            },
            {
              id: createId("col"),
              title: "Edicion simple",
              body: "Selecciona cualquier bloque y ajustalo desde el propio lienzo.",
            },
            {
              id: createId("col"),
              title: "Reserva como eje",
              body: "Todo sigue orientado a que el cliente llegue rapido al turno.",
            },
          ],
        },
        {
          id: createId("video"),
          type: "video",
          title: "Muestra tu espacio o tu servicio",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          caption: "Puedes cambiar este video por una presentacion real del negocio.",
          width: "wide",
        },
      ],
    },
  ];
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
  const [heroLayout, setHeroLayout] = useState(tenant.heroLayout ?? "content-left");
  const [primaryColor, setPrimaryColor] = useState(tenant.primaryColor ?? "#205fc0");
  const [secondaryColor, setSecondaryColor] = useState(tenant.secondaryColor ?? "#dff1ff");
  const [siteBlocks, setSiteBlocks] = useState<SiteBuilderBlock[]>(tenant.siteBlocks ?? []);
  const [selectedTarget, setSelectedTarget] = useState<SelectedTarget>({ kind: "hero", field: "title" });
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [draggedHeroPart, setDraggedHeroPart] = useState<"content" | "image" | null>(null);
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
  const templatePresets = useMemo(
    () =>
      buildTemplatePresets({
        siteTitle,
        heroTitle,
        heroDescription,
        ctaLabel,
      }),
    [ctaLabel, heroDescription, heroTitle, siteTitle],
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
          heroLayout,
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

  function onHeroDrop(target: "content" | "image") {
    if (!draggedHeroPart || draggedHeroPart === target) {
      return;
    }

    setHeroLayout(target === "content" ? "image-left" : "content-left");
    setDraggedHeroPart(null);
  }

  function applyTemplatePreset(templateId: string) {
    const template = templatePresets.find((item) => item.id === templateId);

    if (!template) {
      return;
    }

    setPrimaryColor(template.primaryColor);
    setSecondaryColor(template.secondaryColor);
    setHeroLayout(template.heroLayout);
    setHeroImageUrl(template.heroImageUrl);
    setSiteBlocks(template.siteBlocks);
    setSelectedTarget({ kind: "hero", field: "title" });
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
            <button
              className="button secondary"
              onClick={() =>
                setHeroLayout((current) =>
                  current === "content-left" ? "image-left" : "content-left",
                )
              }
              type="button"
            >
              Intercambiar imagen y texto
            </button>
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
            <span>Tamano de titulo</span>
            <select
              onChange={(e) =>
                updateBlock(selectedBlock.id, (current) =>
                  current.type === "text"
                    ? {
                        ...current,
                        titleSize:
                          e.target.value === "md" || e.target.value === "xl" ? e.target.value : "lg",
                      }
                    : current,
                )
              }
              value={selectedBlock.titleSize ?? "lg"}
            >
              <option value="md">Medio</option>
              <option value="lg">Grande</option>
              <option value="xl">Extra grande</option>
            </select>
          </label>
          <label className="field">
            <span>Tamano de texto</span>
            <select
              onChange={(e) =>
                updateBlock(selectedBlock.id, (current) =>
                  current.type === "text"
                    ? {
                        ...current,
                        bodySize:
                          e.target.value === "sm" || e.target.value === "lg" ? e.target.value : "md",
                      }
                    : current,
                )
              }
              value={selectedBlock.bodySize ?? "md"}
            >
              <option value="sm">Pequeno</option>
              <option value="md">Medio</option>
              <option value="lg">Grande</option>
            </select>
          </label>
          <label className="field">
            <span>Tono</span>
            <select
              onChange={(e) =>
                updateBlock(selectedBlock.id, (current) =>
                  current.type === "text"
                    ? {
                        ...current,
                        tone:
                          e.target.value === "brand" || e.target.value === "muted"
                            ? e.target.value
                            : "dark",
                      }
                    : current,
                )
              }
              value={selectedBlock.tone ?? "dark"}
            >
              <option value="dark">Oscuro</option>
              <option value="brand">Marca</option>
              <option value="muted">Suave</option>
            </select>
          </label>
          <label className="field">
            <span>Ancho del bloque</span>
            <select
              onChange={(e) =>
                updateBlock(selectedBlock.id, (current) =>
                  current.type === "text"
                    ? {
                        ...current,
                        width:
                          e.target.value === "compact" ||
                          e.target.value === "wide" ||
                          e.target.value === "full"
                            ? e.target.value
                            : "normal",
                      }
                    : current,
                )
              }
              value={selectedBlock.width ?? "normal"}
            >
              <option value="compact">Compacto</option>
              <option value="normal">Normal</option>
              <option value="wide">Amplio</option>
              <option value="full">Completo</option>
            </select>
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
          <label className="field">
            <span>Altura visual</span>
            <select
              onChange={(e) =>
                updateBlock(selectedBlock.id, (current) =>
                  current.type === "image"
                    ? {
                        ...current,
                        height:
                          e.target.value === "small" || e.target.value === "large"
                            ? e.target.value
                            : "medium",
                      }
                    : current,
                )
              }
              value={selectedBlock.height ?? "medium"}
            >
              <option value="small">Baja</option>
              <option value="medium">Media</option>
              <option value="large">Grande</option>
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
          <label className="field">
            <span>Ancho del bloque</span>
            <select
              onChange={(e) =>
                updateBlock(selectedBlock.id, (current) =>
                  current.type === "video"
                    ? {
                        ...current,
                        width:
                          e.target.value === "compact" ||
                          e.target.value === "wide" ||
                          e.target.value === "full"
                            ? e.target.value
                            : "normal",
                      }
                    : current,
                )
              }
              value={selectedBlock.width ?? "normal"}
            >
              <option value="compact">Compacto</option>
              <option value="normal">Normal</option>
              <option value="wide">Amplio</option>
              <option value="full">Completo</option>
            </select>
          </label>
        </div>
      );
    }

    if (selectedBlock.type === "columns") {
      return (
        <div className="site-live-panel-section">
          <h3>Bloque de columnas</h3>
          <label className="field">
            <span>Distribucion</span>
            <select
              onChange={(e) =>
                updateBlock(selectedBlock.id, (current) =>
                  current.type === "columns"
                    ? {
                        ...current,
                        layout:
                          e.target.value === "feature-left" || e.target.value === "feature-right"
                            ? e.target.value
                            : "equal",
                      }
                    : current,
                )
              }
              value={selectedBlock.layout ?? "equal"}
            >
              <option value="equal">Equilibrada</option>
              <option value="feature-left">Destacada a la izquierda</option>
              <option value="feature-right">Destacada a la derecha</option>
            </select>
          </label>
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
        <label className="field">
          <span>Tamano de titulo</span>
          <select
            onChange={(e) =>
              updateBlock(selectedBlock.id, (current) =>
                current.type === "cta"
                  ? {
                      ...current,
                      titleSize:
                        e.target.value === "md" || e.target.value === "xl" ? e.target.value : "lg",
                    }
                  : current,
              )
            }
            value={selectedBlock.titleSize ?? "lg"}
          >
            <option value="md">Medio</option>
            <option value="lg">Grande</option>
            <option value="xl">Extra grande</option>
          </select>
        </label>
        <label className="field">
          <span>Tamano de texto</span>
          <select
            onChange={(e) =>
              updateBlock(selectedBlock.id, (current) =>
                current.type === "cta"
                  ? {
                      ...current,
                      bodySize:
                        e.target.value === "sm" || e.target.value === "lg" ? e.target.value : "md",
                    }
                  : current,
              )
            }
            value={selectedBlock.bodySize ?? "md"}
          >
            <option value="sm">Pequeno</option>
            <option value="md">Medio</option>
            <option value="lg">Grande</option>
          </select>
        </label>
        <label className="field">
          <span>Estilo</span>
          <select
            onChange={(e) =>
              updateBlock(selectedBlock.id, (current) =>
                current.type === "cta"
                  ? { ...current, theme: e.target.value === "solid" ? "solid" : "soft" }
                  : current,
              )
            }
            value={selectedBlock.theme ?? "soft"}
          >
            <option value="soft">Suave</option>
            <option value="solid">Solido</option>
          </select>
        </label>
        <label className="field">
          <span>Ancho del bloque</span>
          <select
            onChange={(e) =>
              updateBlock(selectedBlock.id, (current) =>
                current.type === "cta"
                  ? {
                      ...current,
                      width:
                        e.target.value === "compact" ||
                        e.target.value === "wide" ||
                        e.target.value === "full"
                          ? e.target.value
                          : "normal",
                    }
                  : current,
              )
            }
            value={selectedBlock.width ?? "normal"}
          >
            <option value="compact">Compacto</option>
            <option value="normal">Normal</option>
            <option value="wide">Amplio</option>
            <option value="full">Completo</option>
          </select>
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
          <h3>Plantillas iniciales</h3>
          <div className="site-template-list">
            {templatePresets.map((template) => (
              <article className="site-template-card" key={template.id}>
                <div className="site-template-swatch-row">
                  <span
                    className="site-template-swatch"
                    style={{ backgroundColor: template.primaryColor }}
                  />
                  <span
                    className="site-template-swatch"
                    style={{ backgroundColor: template.secondaryColor }}
                  />
                </div>
                <strong>{template.name}</strong>
                <p className="muted">{template.description}</p>
                <button
                  className="button secondary"
                  onClick={() => applyTemplatePreset(template.id)}
                  type="button"
                >
                  Usar plantilla
                </button>
              </article>
            ))}
          </div>
        </section>

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
            <div
              className={`tenant-hero-grid ${
                heroLayout === "image-left" ? "tenant-hero-grid-image-left" : ""
              }`}
            >
              <div
                draggable
                onDragEnd={() => setDraggedHeroPart(null)}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={() => setDraggedHeroPart("content")}
                onDrop={() => onHeroDrop("content")}
              >
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
                  <h1
                    contentEditable
                    onBlur={(event) => setHeroTitle(event.currentTarget.textContent ?? heroTitle)}
                    onClick={() => setSelectedTarget({ kind: "hero", field: "title" })}
                    suppressContentEditableWarning
                  >
                    {heroTitle}
                  </h1>
                </button>

                <button
                  className={`site-live-selectable site-live-text-button ${selectedTarget.kind === "hero" && selectedTarget.field === "description" ? "is-selected" : ""}`}
                  onClick={() => setSelectedTarget({ kind: "hero", field: "description" })}
                  type="button"
                >
                  <p
                    className="muted hero-copy"
                    contentEditable
                    onBlur={(event) =>
                      setHeroDescription(event.currentTarget.textContent ?? heroDescription)
                    }
                    onClick={() => setSelectedTarget({ kind: "hero", field: "description" })}
                    suppressContentEditableWarning
                  >
                    {heroDescription}
                  </p>
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
                draggable
                onDragEnd={() => setDraggedHeroPart(null)}
                onDragStart={() => setDraggedHeroPart("image")}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => onHeroDrop("image")}
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

                {selectedTarget.kind === "block" && selectedTarget.blockId === block.id
                  ? renderResizeControls({
                      onWidthDown:
                        block.type === "text" || block.type === "video" || block.type === "cta"
                          ? () =>
                              updateBlock(block.id, (current) => {
                                if (current.type === "text" || current.type === "video" || current.type === "cta") {
                                  return { ...current, width: stepWidth(current.width, "down") };
                                }

                                return current;
                              })
                          : undefined,
                      onWidthUp:
                        block.type === "text" || block.type === "video" || block.type === "cta"
                          ? () =>
                              updateBlock(block.id, (current) => {
                                if (current.type === "text" || current.type === "video" || current.type === "cta") {
                                  return { ...current, width: stepWidth(current.width, "up") };
                                }

                                return current;
                              })
                          : undefined,
                      onHeightDown:
                        block.type === "image"
                          ? () =>
                              updateBlock(block.id, (current) =>
                                current.type === "image"
                                  ? { ...current, height: stepHeight(current.height, "down") }
                                  : current,
                              )
                          : undefined,
                      onHeightUp:
                        block.type === "image"
                          ? () =>
                              updateBlock(block.id, (current) =>
                                current.type === "image"
                                  ? { ...current, height: stepHeight(current.height, "up") }
                                  : current,
                              )
                          : undefined,
                    })
                  : null}

                {block.type === "text" ? (
                  <div
                    className={`site-block site-block-text ${block.align === "center" ? "align-center" : ""} site-text-scale-${block.titleSize ?? "lg"} site-body-scale-${block.bodySize ?? "md"} ${textToneClass(block.tone)} site-width-${block.width ?? "normal"}`}
                  >
                    {block.eyebrow ? <span className="eyebrow">{block.eyebrow}</span> : null}
                    <h2
                      contentEditable
                      onBlur={(event) =>
                        updateBlock(block.id, (current) =>
                          current.type === "text"
                            ? { ...current, title: event.currentTarget.textContent ?? current.title }
                            : current,
                        )
                      }
                      suppressContentEditableWarning
                    >
                      {block.title}
                    </h2>
                    <p
                      className="muted"
                      contentEditable
                      onBlur={(event) =>
                        updateBlock(block.id, (current) =>
                          current.type === "text"
                            ? { ...current, body: event.currentTarget.textContent ?? current.body }
                            : current,
                        )
                      }
                      suppressContentEditableWarning
                    >
                      {block.body}
                    </p>
                  </div>
                ) : null}

                {block.type === "image" ? (
                  <figure className={`site-block site-block-image ${block.layout === "wide" ? "is-wide" : ""} site-image-height-${block.height ?? "medium"}`}>
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
                  <div className={`site-block site-block-video site-width-${block.width ?? "normal"}`}>
                    {block.title ? (
                      <h2
                        contentEditable
                        onBlur={(event) =>
                          updateBlock(block.id, (current) =>
                            current.type === "video"
                              ? { ...current, title: event.currentTarget.textContent ?? current.title }
                              : current,
                          )
                        }
                        suppressContentEditableWarning
                      >
                        {block.title}
                      </h2>
                    ) : null}
                    <div className="site-video-frame">
                      <iframe
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                        src={getVideoEmbedUrl(block.videoUrl)}
                        title={block.title ?? "Video del sitio"}
                      />
                    </div>
                    {block.caption ? (
                      <p
                        className="muted"
                        contentEditable
                        onBlur={(event) =>
                          updateBlock(block.id, (current) =>
                            current.type === "video"
                              ? { ...current, caption: event.currentTarget.textContent ?? current.caption }
                              : current,
                          )
                        }
                        suppressContentEditableWarning
                      >
                        {block.caption}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {block.type === "columns" ? (
                  <div className={`site-block site-block-columns site-columns-layout-${block.layout ?? "equal"}`}>
                    {block.columns.map((column) => (
                      <article className="site-column-card" key={column.id}>
                        <h3
                          contentEditable
                          onBlur={(event) =>
                            updateBlock(block.id, (current) =>
                              current.type === "columns"
                                ? {
                                    ...current,
                                    columns: current.columns.map((item) =>
                                      item.id === column.id
                                        ? { ...item, title: event.currentTarget.textContent ?? item.title }
                                        : item,
                                    ),
                                  }
                                : current,
                            )
                          }
                          suppressContentEditableWarning
                        >
                          {column.title}
                        </h3>
                        <p
                          className="muted"
                          contentEditable
                          onBlur={(event) =>
                            updateBlock(block.id, (current) =>
                              current.type === "columns"
                                ? {
                                    ...current,
                                    columns: current.columns.map((item) =>
                                      item.id === column.id
                                        ? { ...item, body: event.currentTarget.textContent ?? item.body }
                                        : item,
                                    ),
                                  }
                                : current,
                            )
                          }
                          suppressContentEditableWarning
                        >
                          {column.body}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : null}

                {block.type === "cta" ? (
                  <div className={`site-block site-block-cta site-text-scale-${block.titleSize ?? "lg"} site-body-scale-${block.bodySize ?? "md"} site-cta-theme-${block.theme ?? "soft"} site-width-${block.width ?? "normal"}`}>
                    <div>
                      <h2
                        contentEditable
                        onBlur={(event) =>
                          updateBlock(block.id, (current) =>
                            current.type === "cta"
                              ? { ...current, title: event.currentTarget.textContent ?? current.title }
                              : current,
                          )
                        }
                        suppressContentEditableWarning
                      >
                        {block.title}
                      </h2>
                      <p
                        className="muted"
                        contentEditable
                        onBlur={(event) =>
                          updateBlock(block.id, (current) =>
                            current.type === "cta"
                              ? { ...current, body: event.currentTarget.textContent ?? current.body }
                              : current,
                          )
                        }
                        suppressContentEditableWarning
                      >
                        {block.body}
                      </p>
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
