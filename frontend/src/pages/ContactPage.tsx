import { ArrowRight, ArrowUpRight } from "lucide-react";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import { PageContainer } from "../components/layout/PageContainer";
import { ATELIER, getWhatsAppUrl } from "../config/atelier";

export function ContactPage() {
  return (
    <section className="py-10 sm:py-14">
      <PageContainer>
        <div className="min-w-0">
          <header className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
              Contato
            </p>

            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-brand-900 sm:text-5xl lg:text-6xl">
              Contato e encomendas
            </h1>

            <p className="mt-4 text-base leading-7 text-brand-700">
              Quer encomendar uma peça em cerâmica fria ou saber mais sobre uma
              criação? Fale com a Piccola Arte Atelier para consultar
              disponibilidade, personalização e prazos.
            </p>
          </header>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="
                group flex flex-col rounded-3xl bg-brand-900
                p-6 text-brand-50 shadow-sm transition duration-200
                hover:bg-brand-800 hover:shadow-md
                focus-visible:outline-2 focus-visible:outline-offset-4
                focus-visible:outline-brand-700
                motion-safe:hover:-translate-y-1 sm:p-7
              "
            >
              <div className="flex items-center justify-between gap-4">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50/10">
                  <FaWhatsapp className="size-7" aria-hidden="true" />
                </span>

                <ArrowUpRight
                  className="
                    size-5 text-brand-300 transition-transform
                    motion-safe:group-hover:-translate-y-0.5
                    motion-safe:group-hover:translate-x-0.5
                  "
                  aria-hidden="true"
                />
              </div>

              <h2 className="mt-5 font-display text-3xl font-semibold">
                WhatsApp
              </h2>

              <p className="mt-2 text-sm leading-6 text-brand-200">
                Para tirar dúvidas sobre as peças, consultar
                disponibilidade ou conversar sobre uma encomenda.
              </p>

              <p className="mt-4 text-base font-semibold">
                {ATELIER.phoneDisplay}
              </p>

              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
                Conversar pelo WhatsApp
                <ArrowRight
                  className="
                    size-4 transition-transform
                    motion-safe:group-hover:translate-x-1
                  "
                  aria-hidden="true"
                />
              </span>
            </a>

            <a
              href={ATELIER.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="
                group flex flex-col rounded-3xl border
                border-brand-200 bg-white p-6 text-brand-900
                shadow-sm transition duration-200
                hover:border-brand-400 hover:bg-brand-50
                hover:shadow-md
                focus-visible:outline-2 focus-visible:outline-offset-4
                focus-visible:outline-brand-700
                motion-safe:hover:-translate-y-1 sm:p-7
              "
            >
              <div className="flex items-center justify-between gap-4">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-100">
                  <FaInstagram className="size-6" aria-hidden="true" />
                </span>

                <ArrowUpRight
                  className="
                    size-5 text-brand-600 transition-transform
                    motion-safe:group-hover:-translate-y-0.5
                    motion-safe:group-hover:translate-x-0.5
                  "
                  aria-hidden="true"
                />
              </div>

              <h2 className="mt-5 font-display text-3xl font-semibold">
                Instagram
              </h2>

              <p className="mt-2 text-sm leading-6 text-brand-700">
                Acompanhe as novidades, conheça os detalhes das peças
                e descubra um pouco mais do nosso ateliê.
              </p>

              <p className="mt-4 break-all text-base font-semibold">
                {ATELIER.instagramHandle}
              </p>

              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
                Visitar o Instagram
                <ArrowRight
                  className="
                    size-4 transition-transform
                    motion-safe:group-hover:translate-x-1
                  "
                  aria-hidden="true"
                />
              </span>
            </a>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
