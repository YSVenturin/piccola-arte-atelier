import { ROUTES } from "../routes/routePaths";
import type { ProductDetailsDTO } from "../types/product";

export interface PageMetadata {
  title: string;
  description: string;
}

// Edite aqui os títulos e as descrições das páginas públicas fixas.
export const PAGE_METADATA = {
  home: {
    title: "Piccola Arte Atelier | Cerâmica fria artesanal",
    description:
      "Peças artesanais em cerâmica fria para decorar e presentear. Conheça os chaveiros, incensários e outras criações da Piccola Arte Atelier.",
  },
  products: {
    title: "Peças em cerâmica fria | Piccola Arte Atelier",
    description:
      "Explore as peças artesanais da Piccola Arte Atelier. Veja fotos, detalhes, valores informados e disponibilidade para decorar ou presentear.",
  },
  about: {
    title: "O Atelier | Piccola Arte Atelier",
    description:
      "Informações sobre a Piccola Arte Atelier e suas criações artesanais em cerâmica fria, feitas à mão para decorar e presentear.",
  },
  contact: {
    title: "Contato e encomendas | Piccola Arte Atelier",
    description:
      "Fale com a Piccola Arte Atelier pelo WhatsApp ou Instagram para consultar disponibilidade, personalização e prazos de peças artesanais.",
  },
  productLoading: {
    title: "Detalhes da peça | Piccola Arte Atelier",
    description:
      "Consulte as fotos e informações das peças artesanais da Piccola Arte Atelier e encontre uma criação para decorar ou presentear.",
  },
  productNotFound: {
    title: "Peça não encontrada | Piccola Arte Atelier",
    description:
      "A peça procurada não está disponível. Explore o catálogo da Piccola Arte Atelier para conhecer outras criações artesanais.",
  },
  productError: {
    title: "Peça temporariamente indisponível | Piccola Arte Atelier",
    description:
      "Não foi possível carregar esta peça agora. Tente novamente ou entre em contato com a Piccola Arte Atelier para consultar os detalhes.",
  },
  notFound: {
    title: "Página não encontrada | Piccola Arte Atelier",
    description:
      "O endereço procurado não foi encontrado. Visite a Piccola Arte Atelier para conhecer suas peças artesanais em cerâmica fria.",
  },
} as const satisfies Record<string, PageMetadata>;

const PUBLIC_PAGE_METADATA: Record<string, PageMetadata> = {
  [ROUTES.home]: PAGE_METADATA.home,
  [ROUTES.products]: PAGE_METADATA.products,
  [ROUTES.about]: PAGE_METADATA.about,
  [ROUTES.contact]: PAGE_METADATA.contact,
};

const ADMIN_PAGE_TITLES: Record<string, string> = {
  "/admin": "Administração",
  "/admin/login": "Entrar na administração",
  "/admin/categorias": "Administrar categorias",
  "/admin/produtos": "Administrar produtos",
  "/admin/produtos/novo": "Novo produto",
};

export function getRouteMetadata(pathname: string): PageMetadata | null {
  const path = pathname.replace(/\/+$/, "").toLowerCase() || "/";

  // A página de detalhes define os metadados conforme o produto e seu estado.
  if (/^\/produtos\/[^/]+$/.test(path)) return null;

  if (path === "/admin" || path.startsWith("/admin/")) {
    const label = ADMIN_PAGE_TITLES[path] ??
      (/^\/admin\/produtos\/\d+$/.test(path) ? "Editar produto" : "Administração");
    return {
      title: `${label} | Piccola Arte Atelier`,
      description: "Área administrativa da Piccola Arte Atelier para organizar o catálogo, as categorias e as imagens dos produtos.",
    };
  }

  return PUBLIC_PAGE_METADATA[path] ?? PAGE_METADATA.notFound;
}

export function getProductMetadata(
  product: Pick<ProductDetailsDTO, "name" | "shortDescription" | "description">,
): PageMetadata {
  const name = product.name.replace(/\s+/g, " ").trim();
  const description = product.shortDescription?.trim() || product.description?.trim() ||
    `Conheça ${name}, uma peça artesanal da Piccola Arte Atelier. Veja fotos, detalhes e informações para encomendar.`;

  return {
    title: `${name} | Piccola Arte Atelier`,
    description,
  };
}

export function normalizeMetaDescription(description: string): string {
  const text = description.replace(/\s+/g, " ").trim();
  if (text.length <= 160) return text;

  const excerpt = text.slice(0, 159);
  const lastSpace = excerpt.lastIndexOf(" ");
  return `${(lastSpace > 0 ? excerpt.slice(0, lastSpace) : excerpt).trimEnd()}…`;
}
