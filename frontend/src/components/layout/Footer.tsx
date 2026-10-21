import { InstagramIcon } from "../ui/InstagramIcon";
import { FaWhatsapp } from "react-icons/fa";
import { Link } from "react-router";

import logoMark from "../../assets/images/brand/brand-mark-dark.png";
import { ATELIER, getWhatsAppUrl } from "../../config/atelier";
import { ROUTES } from "../../routes/routePaths";
import { PageContainer } from "./PageContainer";

export function Footer() {
  return (
    <footer className="bg-brand-900 text-brand-100">
      <PageContainer>
        <div className="mx-auto max-w-7xl px-2 pb-5 pt-8 sm:px-0">
          <div className="grid gap-7 md:grid-cols-[1.2fr_0.7fr_1fr] md:gap-10">
            <div>
              <Link to={ROUTES.home} className="inline-flex items-center gap-3">
                <img
                  src={logoMark}
                  alt=""
                  width={48}
                  height={48}
                  className="size-11 object-contain"
                />
                <span>
                  <span className="block font-display text-2xl font-semibold text-white">
                    Piccola Arte
                  </span>
                  <span className="text-[0.6rem] uppercase tracking-[0.3em] text-brand-300">
                    Atelier
                  </span>
                </span>
              </Link>
              <p className="mt-3 max-w-xs text-sm leading-6 text-brand-200">
                Cerâmica fria feita à mão. Piccole creazioni, grande amore!
              </p>
            </div>
            <nav aria-label="Navegação do rodapé">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-accent-200">
                Explore
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm md:grid-cols-1">
                {[
                  { label: "Início", to: ROUTES.home },
                  { label: "Peças", to: ROUTES.products },
                  { label: "O Atelier", to: ROUTES.about },
                  { label: "Contato", to: ROUTES.contact },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="w-fit py-1.5 text-brand-100 hover:text-accent-200"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-accent-200">
                Vamos conversar
              </h2>
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-fit items-center gap-2 py-1.5 text-sm text-brand-100 hover:text-accent-200"
              >
                <FaWhatsapp className="size-4" aria-hidden="true" />
                {ATELIER.phoneDisplay}
              </a>
              <a
                href={ATELIER.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-fit items-center gap-2 py-1.5 text-sm text-brand-100 hover:text-accent-200"
              >
                <InstagramIcon className="size-4 shrink-0" aria-hidden="true" />
                {ATELIER.instagramHandle}
              </a>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2 border-t border-white/10 pt-4 text-xs leading-5 text-brand-300 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} Piccola Arte Atelier. Todos os direitos
              reservados.
            </p>
            <a
              href="/privacidade.html"
              className="w-fit underline underline-offset-4 transition hover:text-accent-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-200"
            >
              Política de privacidade
            </a>
          </div>
        </div>
      </PageContainer>
    </footer>
  );
}
