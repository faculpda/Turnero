"use client";

import { useEffect, useState } from "react";

type GalleryImage = {
  id: string;
  url: string;
  alt: string;
};

type TenantPublicGalleryLightboxProps = {
  images: GalleryImage[];
};

export function TenantPublicGalleryLightbox({ images }: TenantPublicGalleryLightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveIndex(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex]);

  const activeImage = activeIndex !== null ? images[activeIndex] : null;

  return (
    <>
      <div className="tenant-public-gallery-grid">
        <button
          className="tenant-public-gallery-main tenant-public-gallery-button"
          onClick={() => setActiveIndex(0)}
          type="button"
        >
          <img alt={images[0]?.alt} className="tenant-public-gallery-image" src={images[0]?.url} />
          <span className="tenant-public-gallery-zoom">Ver foto</span>
        </button>

        <div className="tenant-public-gallery-stack">
          {images.slice(1).map((image, index) => (
            <button
              className="tenant-public-gallery-tile tenant-public-gallery-button"
              key={image.id}
              onClick={() => setActiveIndex(index + 1)}
              type="button"
            >
              <img alt={image.alt} className="tenant-public-gallery-image" src={image.url} />
              <span className="tenant-public-gallery-zoom">Ver foto</span>
            </button>
          ))}
        </div>
      </div>

      {activeImage ? (
        <div
          aria-modal="true"
          className="tenant-public-lightbox-backdrop"
          onClick={() => setActiveIndex(null)}
          role="dialog"
        >
          <div className="tenant-public-lightbox-card" onClick={(event) => event.stopPropagation()}>
            <button
              aria-label="Cerrar foto"
              className="tenant-public-lightbox-close"
              onClick={() => setActiveIndex(null)}
              type="button"
            >
              Cerrar
            </button>
            <img alt={activeImage.alt} className="tenant-public-lightbox-image" src={activeImage.url} />
          </div>
        </div>
      ) : null}
    </>
  );
}
