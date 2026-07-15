const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
    throw new Error(
        "A variável VITE_API_BASE_URL não foi definida.",
    );
}

const backendOrigin = new URL(apiBaseUrl).origin;

export function resolveImageUrl(imageUrl: string | null | undefined): string | null {
    if (!imageUrl) {
        return null;
    }

    return new URL(imageUrl, backendOrigin).toString();
}