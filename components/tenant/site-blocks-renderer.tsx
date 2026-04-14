import Link from "next/link";
import type { SiteBlockVisibility, SiteBuilderBlock, TenantPublicProfile } from "@/lib/types";

type SiteBlocksRendererProps = {
  blocks?: SiteBuilderBlock[];
  tenant: Pick<TenantPublicProfile, "slug">;
  useSlugRoutes?: boolean;
  preview?: boolean;
};

function buildHref(slug: string, href: string, useSlugRoutes: boolean) {
  if (!href.startsWith("/")) {
    return href;
  }

  return useSlugRoutes ? `/${slug}${href === "/" ? "" : href}` : href;
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

function visibilityClassName(visibility?: SiteBlockVisibility) {
  const safeVisibility = visibility ?? {
    desktop: true,
    tablet: true,
    mobile: true,
  };

  return [
    !safeVisibility.desktop ? "site-hidden-desktop" : "",
    !safeVisibility.tablet ? "site-hidden-tablet" : "",
    !safeVisibility.mobile ? "site-hidden-mobile" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function SiteBlocksRenderer({
  blocks = [],
  tenant,
  useSlugRoutes = true,
  preview = false,
}: SiteBlocksRendererProps) {
  if (blocks.length === 0) {
    return null;
  }

  return (
    <section className={`site-blocks-stack ${preview ? "is-preview" : ""}`}>
      {blocks.map((block) => {
        if (block.type === "text") {
          return (
            <article
              className={`site-block site-block-text ${block.align === "center" ? "align-center" : ""} site-text-scale-${block.titleSize ?? "lg"} site-body-scale-${block.bodySize ?? "md"} site-tone-${block.tone ?? "dark"} site-width-${block.width ?? "normal"} ${visibilityClassName(block.visibility)}`}
              key={block.id}
            >
              {block.eyebrow ? <span className="eyebrow">{block.eyebrow}</span> : null}
              <h2>{block.title}</h2>
              <p className="muted">{block.body}</p>
            </article>
          );
        }

        if (block.type === "image") {
          return (
            <figure
              className={`site-block site-block-image ${block.layout === "wide" ? "is-wide" : ""} site-image-height-${block.height ?? "medium"} ${visibilityClassName(block.visibility)}`}
              key={block.id}
            >
              {block.imageUrl ? (
                <img alt={block.altText ?? "Imagen del sitio"} src={block.imageUrl} />
              ) : (
                <div className="tenant-cover-placeholder">
                  <strong>Imagen pendiente</strong>
                  <p className="muted">
                    Sube una imagen o pega una URL para completar este bloque visual.
                  </p>
                </div>
              )}
              {block.caption ? <figcaption className="muted">{block.caption}</figcaption> : null}
            </figure>
          );
        }

        if (block.type === "video") {
          return (
            <article className={`site-block site-block-video site-width-${block.width ?? "normal"} ${visibilityClassName(block.visibility)}`} key={block.id}>
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
            </article>
          );
        }

        if (block.type === "columns") {
          return (
            <section className={`site-block site-block-columns site-columns-layout-${block.layout ?? "equal"} ${visibilityClassName(block.visibility)}`} key={block.id}>
              {block.columns.map((column) => (
                <article className="site-column-card" key={column.id}>
                  <h3>{column.title}</h3>
                  <p className="muted">{column.body}</p>
                </article>
              ))}
            </section>
          );
        }

        return (
          <article className={`site-block site-block-cta site-text-scale-${block.titleSize ?? "lg"} site-body-scale-${block.bodySize ?? "md"} site-cta-theme-${block.theme ?? "soft"} site-width-${block.width ?? "normal"} ${visibilityClassName(block.visibility)}`} key={block.id}>
            <div>
              <h2>{block.title}</h2>
              <p className="muted">{block.body}</p>
            </div>
            {preview ? (
              <button className="button primary tenant-primary-button" type="button">
                {block.buttonLabel}
              </button>
            ) : (
              <Link
                className="button primary tenant-primary-button"
                href={buildHref(tenant.slug, block.buttonHref, useSlugRoutes)}
              >
                {block.buttonLabel}
              </Link>
            )}
          </article>
        );
      })}
    </section>
  );
}
