import { Link } from "react-router";

import logoMarkDark from "../../assets/images/brand/brand-mark-dark.png";
import { ROUTES } from "../../routes/routePaths";
import { PageContainer } from "./PageContainer";

const navigationItems = [
  {
    label: "Início",
    to: ROUTES.home,
  },
  {
    label: "Produtos",
    to: ROUTES.products,
  },
  {
    label: "Sobre",
    to: ROUTES.about,
  },
  {
    label: "Contato",
    to: ROUTES.contact,
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-brand-900 text-brand-100">
      <PageContainer className="py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-16">
          <div className="max-w-md">
            <Link
              to={ROUTES.home}
              className="inline-flex items-center gap-3"
            >
              <img
                src={logoMarkDark}
                alt=""
                className="size-14 object-contain sm:size-16"
              />

              <span className="flex flex-col">
                <span className="font-display text-2xl font-semibold tracking-wide sm:text-3xl">
                  Piccola Arte
                </span>

                <span className="text-xs font-semibold uppercase tracking-[0.25rem] text-brand-300 sm:tracking-[0.3rem]">
                  Atelier
                </span>
              </span>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-6 text-brand-200 sm:text-base">
              Pequenas criações feitas à mão para transformar detalhes em
              lembranças especiais.
            </p>

            <p className="mt-3 font-display text-lg italic text-brand-300 sm:text-xl">
              Piccole creazioni, grande amore!
            </p>
          </div>

          <div className="border-t border-brand-700 pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2rem] text-brand-300">
              Navegação
            </h2>

            <nav
              aria-label="Navegação do rodapé"
              className="mt-5 flex flex-col items-start gap-3"
            >
              {navigationItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-sm text-brand-100 transition-colors hover:text-brand-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-300"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-8 border-t border-brand-700 pt-5 text-center">
          <p className="text-xs leading-5 text-brand-300 sm:text-sm">
            © {currentYear} Piccola Arte Atelier. Todos os direitos reservados.
          </p>
        </div>
      </PageContainer>
    </footer>
  );
}