export function generateSlug(
  name: string,
  fallback: string,
): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || fallback
  );
}

export function generateAvailableSlug(
  name: string,
  usedSlugs: Set<string>,
  fallback: string,
  maxLength: number,
): string {
  const base = generateSlug(name, fallback);

  for (let number = 1; ; number++) {
    const suffix = number === 1 ? "" : `-${number}`;

    const prefix = base
      .slice(0, maxLength - suffix.length)
      .replace(/-+$/g, "");

    const candidate = `${prefix}${suffix}`;

    if (!usedSlugs.has(candidate)) {
      return candidate;
    }
  }
}