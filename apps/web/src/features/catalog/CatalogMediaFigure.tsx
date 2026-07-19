import { Image, Mountain } from "lucide-react";
import { useState } from "react";
import type { CatalogMedia } from "@/features/catalog/catalog";
import { responsiveImageUrl } from "@/features/catalog/media";

export function CatalogMediaFigure({
  media,
  loading = "lazy",
  sizes = "(max-width: 800px) 100vw, 560px",
  showAttribution = true,
  variant = "hero",
}: {
  media?: CatalogMedia;
  loading?: "eager" | "lazy";
  sizes?: string;
  showAttribution?: boolean;
  variant?: "hero" | "thumbnail";
}) {
  const [failedUrl, setFailedUrl] = useState<string>();
  if (!media || failedUrl === media.imageUrl) {
    return (
      <figure aria-label="Terrain image not yet available" className={`catalog-media catalog-media--${variant} catalog-media--fallback`} role="img">
        <Mountain aria-hidden="true" />
        <figcaption><strong>Terrain image unavailable</strong><span>No verified catalog media yet</span></figcaption>
      </figure>
    );
  }

  return (
    <figure className={`catalog-media catalog-media--${variant}`}>
      <img
        alt={media.alt}
        decoding="async"
        fetchPriority={loading === "eager" ? "high" : "auto"}
        height={media.height}
        loading={loading}
        onError={() => setFailedUrl(media.imageUrl)}
        sizes={sizes}
        src={responsiveImageUrl(media.imageUrl, 960)}
        srcSet={`${responsiveImageUrl(media.imageUrl, 480)} 480w, ${responsiveImageUrl(media.imageUrl, 960)} 960w, ${responsiveImageUrl(media.imageUrl, 1440)} 1440w`}
        width={media.width}
      />
      {showAttribution ? <details className="catalog-media__credit">
        <summary><Image aria-hidden="true" /> Photo credit</summary>
        <span>{media.attributionText}</span>
        <span><a href={media.sourceUrl} rel="noreferrer" target="_blank">Source</a> · <a href={media.attributionUrl} rel="noreferrer" target="_blank">{media.license}</a></span>
      </details> : null}
    </figure>
  );
}
