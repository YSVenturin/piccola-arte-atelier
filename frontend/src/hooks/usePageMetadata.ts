import { useEffect } from "react";

import { normalizeMetaDescription } from "../config/pageMetadata";
import type { PageMetadata } from "../config/pageMetadata";

export function usePageMetadata(metadata: PageMetadata | null) {
  const title = metadata?.title;
  const description = metadata?.description;

  useEffect(() => {
    if (title === undefined || description === undefined) return;

    document.title = title;

    // Atualiza a tag existente, inclusive após navegar sem recarregar o site.
    let tag = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.name = "description";
      document.head.appendChild(tag);
    }
    tag.content = normalizeMetaDescription(description);
  }, [title, description]);
}
