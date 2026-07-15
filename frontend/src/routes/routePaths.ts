export const ROUTE_SEGMENTS = {
  products: "produtos",
  productDetails: "produtos/:slug",
  about: "sobre",
  contact: "contato",
} as const;

export const ROUTES = {
  home: "/",
  products: `/${ROUTE_SEGMENTS.products}`,
  about: `/${ROUTE_SEGMENTS.about}`,
  contact: `/${ROUTE_SEGMENTS.contact}`,
} as const;

export function getProductDetailsPath(slug: string): string {
  return `${ROUTES.products}/${encodeURIComponent(slug)}`;
}

export function getProductsByCategoryPath(categorySlug: string): string {
  const searchParams = new URLSearchParams({categoria: categorySlug});

  return `${ROUTES.products}?${searchParams.toString()}`;
}