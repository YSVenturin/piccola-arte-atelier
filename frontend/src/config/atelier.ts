export const ATELIER = {
  instagramUrl: "https://www.instagram.com/piccolaarte_atelier/",
  instagramHandle: "@piccolaarte_atelier",
  whatsappNumber: "5554991603307",
  phoneDisplay: "(54) 99160-3307",
} as const;

export function getWhatsAppUrl(
  message = "Olá! Vim pelo site da Piccola Arte e gostaria de saber mais sobre as peças.",
): string {
  return `https://wa.me/${ATELIER.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
