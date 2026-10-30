export const ATELIER = {
  name: "Piccola Arte Atelier",
  legalName: "69.851.899 GABRIELA PIAZZA MARSILIO",
  cnpj: "69.851.899/0001-52",
  email: "contato@piccolaarteatelier.com.br",
  instagramUrl: "https://www.instagram.com/piccolaarte_atelier/",
  instagramHandle: "@piccolaarte_atelier",
  whatsappNumber: "5554992449588",
  phoneDisplay: "(54) 99244-9588",
} as const;

export function getWhatsAppUrl(
  message = "Olá! Vim pelo site da Piccola Arte Atelier e gostaria de saber mais sobre as peças.",
): string {
  return `https://wa.me/${ATELIER.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
