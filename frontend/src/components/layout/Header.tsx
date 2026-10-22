import { InstagramIcon } from "../ui/InstagramIcon";
import { Menu, X } from "lucide-react";
import { useRef, useState } from "react";
import { Link, NavLink } from "react-router";
import { FaWhatsapp } from "react-icons/fa";

import logoMark from "../../assets/images/brand/brand-mark-primary.png";
import { ATELIER, getWhatsAppUrl } from "../../config/atelier";
import { ROUTES } from "../../routes/routePaths";
import { PageContainer } from "./PageContainer";

const navigationItems = [
  { label: "Início", to: ROUTES.home },
  { label: "Peças", to: ROUTES.products },
  { label: "O Atelier", to: ROUTES.about },
  { label: "Contato", to: ROUTES.contact },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-900 text-brand-50 shadow-sm">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-10 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-brand-950"
      >
        Pular para o conteúdo
      </a>
      <PageContainer>
        <div className="flex min-h-18 items-center justify-between gap-3 lg:min-h-20">
          <Link
            to={ROUTES.home}
            onClick={() => setIsMenuOpen(false)}
            className="group flex shrink-0 items-center gap-2.5 rounded-lg"
            aria-label="Piccola Arte Atelier — início"
          >
            <img
              src={logoMark}
              alt=""
              width={48}
              height={48}
              className="size-10 rounded-full object-contain motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:-rotate-6 motion-safe:group-hover:scale-110 motion-safe:group-focus-visible:-translate-y-0.5 motion-safe:group-focus-visible:-rotate-6 motion-safe:group-focus-visible:scale-110 sm:size-12"
            />
            <span className="flex flex-col motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:translate-x-0.5 motion-safe:group-focus-visible:translate-x-0.5">
              <span className="font-display text-2xl font-semibold leading-none tracking-wide transition-colors group-hover:text-brand-200 group-focus-visible:text-brand-200 motion-reduce:transition-none sm:text-3xl">
                Piccola Arte
              </span>
              <span className="mt-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-brand-300">
                Atelier
              </span>
            </span>
          </Link>

          <nav
            className="hidden items-center gap-7 lg:flex"
            aria-label="Navegação principal"
          >
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === ROUTES.home}
                className={({ isActive }) =>
                  `border-b-2 py-2 text-sm font-medium transition-colors ${isActive ? "border-accent-400 text-white" : "border-transparent text-brand-200 hover:border-accent-400/60 hover:text-white"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <a
              href={ATELIER.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram da Piccola Arte (abre em outra aba)"
              className="hidden size-11 items-center justify-center rounded-full text-brand-200 transition-colors hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              <InstagramIcon className="size-5" aria-hidden="true" />
            </a>
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Conversar com a Piccola Arte pelo WhatsApp (abre em outra aba)"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-50 px-3 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-200 sm:px-5"
            >
              <FaWhatsapp className="size-5" aria-hidden="true" />
              <span className="hidden sm:inline">Encomendar</span>
            </a>
            <button
              ref={menuButton}
              type="button"
              onClick={() => setIsMenuOpen((current) => !current)}
              className="inline-flex size-11 items-center justify-center rounded-full border border-white/20 transition-colors hover:bg-white/10 lg:hidden"
              aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
            >
              {isMenuOpen ? (
                <X className="size-5" aria-hidden="true" />
              ) : (
                <Menu className="size-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </PageContainer>

      <nav
        id="mobile-navigation"
        hidden={!isMenuOpen}
        aria-label="Navegação no celular"
        className="border-t border-white/10 bg-brand-900 lg:hidden"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsMenuOpen(false);
            menuButton.current?.focus();
          }
        }}
      >
        <PageContainer>
          <div className="flex flex-col gap-1 py-3">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === ROUTES.home}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-3 text-sm font-medium ${isActive ? "bg-white/10 text-white" : "text-brand-200 hover:bg-white/5"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <a
              href={ATELIER.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 text-sm text-brand-200"
            >
              <InstagramIcon className="size-4" aria-hidden="true" />{" "}
              {ATELIER.instagramHandle}
            </a>
          </div>
        </PageContainer>
      </nav>
    </header>
  );
}
