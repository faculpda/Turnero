"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ServiceSummary } from "@/lib/types";

type ServiceEditorCardProps = {
  tenantSlug: string;
  service: ServiceSummary;
};

type EditableImage = {
  url: string;
  altText: string;
  file: File | null;
};

async function uploadServiceImage(
  tenantSlug: string,
  serviceId: string,
  file: File,
): Promise<string> {
  const formData = new FormData();
  formData.append("tenantSlug", tenantSlug);
  formData.append("serviceId", serviceId);
  formData.append("file", file);

  const response = await fetch("/api/services/assets", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as { ok?: boolean; error?: string; url?: string };

  if (!response.ok || !payload.ok || !payload.url) {
    throw new Error(payload.error ?? "No se pudo subir la imagen del servicio.");
  }

  return payload.url;
}

function buildInitialImages(service: ServiceSummary): EditableImage[] {
  return Array.from({ length: 3 }, (_, index) => {
    const currentImage = service.images?.[index];

    return {
      url: currentImage?.url ?? "",
      altText: currentImage?.altText ?? service.name,
      file: null,
    };
  });
}

export function ServiceEditorCard({ tenantSlug, service }: ServiceEditorCardProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(service.name);
  const [description, setDescription] = useState(service.description ?? "");
  const [durationMin, setDurationMin] = useState(String(service.durationMin));
  const [pricePesos, setPricePesos] = useState(
    String(Math.round((service.priceCents ?? 0) / 100)),
  );
  const [isActive, setIsActive] = useState(service.isActive ?? true);
  const [images, setImages] = useState<EditableImage[]>(() => buildInitialImages(service));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const previewImages = useMemo(
    () =>
      images.map((image) => ({
        ...image,
        previewUrl: image.file ? URL.createObjectURL(image.file) : image.url,
      })),
    [images],
  );

  function updateImage(index: number, nextValue: Partial<EditableImage>) {
    setImages((currentImages) =>
      currentImages.map((image, imageIndex) =>
        imageIndex === index ? { ...image, ...nextValue } : image,
      ),
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const finalImages = [];

      for (const image of images) {
        let finalUrl = image.url.trim();

        if (image.file) {
          finalUrl = await uploadServiceImage(tenantSlug, service.id, image.file);
        }

        if (finalUrl) {
          finalImages.push({
            url: finalUrl,
            altText: image.altText.trim() || title.trim(),
          });
        }
      }

      const response = await fetch("/api/services", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantSlug,
          serviceId: service.id,
          title,
          description,
          durationMin,
          pricePesos,
          isActive,
          images: finalImages,
        }),
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "No se pudo guardar el servicio.");
        setIsSaving(false);
        return;
      }

      setIsSaving(false);
      setIsOpen(false);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar el servicio.");
      setIsSaving(false);
    }
  }

  return (
    <article
      className={`panel service-editor-card dashboard-hierarchy-shell ${
        isOpen ? "service-editor-card-open" : ""
      }`}
    >
      <div className="service-editor-summary">
        <div className="service-editor-summary-main">
          <div className="header-row">
            <div>
              <div className="service-chip-header">
                <h3>{service.name}</h3>
                <span className={`badge ${(service.isActive ?? true) ? "approved" : "cancelled"}`}>
                  {(service.isActive ?? true) ? "Activo" : "Inactivo"}
                </span>
              </div>
              <p className="muted">
                {service.durationMin} min - {service.priceLabel}
              </p>
            </div>
            <button
              className="button secondary"
              onClick={() => setIsOpen((value) => !value)}
              type="button"
            >
              {isOpen ? "Cerrar" : "Editar servicio"}
            </button>
          </div>

          {service.description ? <p className="muted">{service.description}</p> : null}
        </div>

        {service.images && service.images.length > 0 ? (
          <div className="service-editor-hero-media">
            <img
              alt={service.images[0].altText ?? service.name}
              className="service-image-thumb service-image-thumb-hero"
              src={service.images[0].url}
            />
          </div>
        ) : (
          <div className="service-editor-hero-placeholder">
            <span className="dashboard-detail-label">Servicio</span>
            <strong>{service.name}</strong>
          </div>
        )}
      </div>

      {service.images && service.images.length > 0 ? (
        <div className="service-image-grid service-image-grid-secondary">
          {service.images.slice(1).map((image) => (
            <img alt={image.altText ?? service.name} className="service-image-thumb" key={image.id} src={image.url} />
          ))}
        </div>
      ) : null}

      {isOpen ? (
        <form className="service-form-grid service-editor-form dashboard-hierarchy-subpanel" onSubmit={onSubmit}>
          <label className="field">
            <span>Titulo</span>
            <input onChange={(event) => setTitle(event.target.value)} required value={title} />
          </label>

          <label className="field">
            <span>Tiempo del servicio</span>
            <input
              min="5"
              onChange={(event) => setDurationMin(event.target.value)}
              required
              type="number"
              value={durationMin}
            />
          </label>

          <label className="field">
            <span>Valor en pesos</span>
            <input
              min="0"
              onChange={(event) => setPricePesos(event.target.value)}
              required
              step="1"
              type="number"
              value={pricePesos}
            />
          </label>

          <label className="field field-wide">
            <span className="field-checkbox">
              <input
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                type="checkbox"
              />
              <span>Servicio activo y visible para reservas</span>
            </span>
          </label>

          <label className="field field-wide">
            <span>Descripcion</span>
            <textarea
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              value={description}
            />
          </label>

          <div className="field field-wide">
            <span>Imagenes del servicio</span>
            <p className="muted">
              Puedes cargar hasta 3 imagenes. Cada una puede venir por URL o desde archivo local.
            </p>
            <div className="service-image-editor-grid">
              {previewImages.map((image, index) => (
                <div
                  className="panel subtle-panel service-image-slot dashboard-hierarchy-item"
                  key={`${service.id}-${index}`}
                >
                  <strong>Imagen {index + 1}</strong>
                  {image.previewUrl ? (
                    <img
                      alt={image.altText || `${title} ${index + 1}`}
                      className="service-image-thumb"
                      src={image.previewUrl}
                    />
                  ) : (
                    <div className="service-image-placeholder muted">Sin imagen</div>
                  )}
                  <label className="field">
                    <span>URL</span>
                    <input
                      placeholder="https://..."
                      value={image.url}
                      onChange={(event) =>
                        updateImage(index, { url: event.target.value, file: null })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Archivo local</span>
                    <input
                      accept=".png,.jpg,.jpeg,.webp,.svg"
                      onChange={(event) =>
                        updateImage(index, { file: event.target.files?.[0] ?? null })
                      }
                      type="file"
                    />
                  </label>
                  <label className="field">
                    <span>Texto alternativo</span>
                    <input
                      placeholder={`Imagen ${index + 1} de ${title}`}
                      value={image.altText}
                      onChange={(event) => updateImage(index, { altText: event.target.value })}
                    />
                  </label>
                  <button
                    className="button secondary"
                    onClick={() => updateImage(index, { url: "", altText: title, file: null })}
                    type="button"
                  >
                    Limpiar imagen
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error ? <p className="form-error field-wide">{error}</p> : null}

          <div className="actions field-wide">
            <button className="button primary" disabled={isSaving} type="submit">
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      ) : null}
    </article>
  );
}
