import { useState } from "react";
import { Link, NavLink } from "react-router";

import { Menu, X } from "lucide-react";

import logoMarkLight from "../../assets/images/brand/brand-mark-light.png";
import { PageContainer } from "./PageContainer";

import { ROUTES } from "../../routes/routePaths";

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

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 border-b border-brand-200/80 bg-brand-50/95 backdrop-blur">
            <PageContainer>
                <div className="flex min-h-20 items-center justify-between gap-6">
                    <Link to={ROUTES.home} onClick={() => setIsMenuOpen(false)} className="flex shrink-0 items-center gap-3" aria-label="Ir para a página inicial">
                        <div className="hover:rotate-10">
                            <img
                                src={logoMarkLight}
                                alt=""
                                className="size-12 object-contain"
                            />
                        </div>
                        <span className="flex flex-col">
                            <span className="font-display text-2xl font-bold leading-none tracking-wide text-brand-900">
                                Piccola Arte
                            </span>
                            <span className="mt-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-600">
                                Atelier
                            </span>
                        </span>
                    </Link>

                    <nav className="hidden items-center gap-7 md:flex" aria-label="Navegação principal">
                        {navigationItems.map((item) => (
                            <NavLink key={item.to} to={item.to} end={item.to === "/"}
                            /* refactor this */
                            className={({ isActive }) =>
                                `relative py-1 text-sm font-medium after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-center after:transition-transform after:ease-out ${
                                isActive
                                    ? "text-brand-900 after:scale-x-100 after:bg-brand-900"
                                    : "text-brand-600 after:scale-x-0 after:bg-brand-600 hover:text-brand-900 hover:after:scale-x-100"
                                }`
                            }>
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    <button type="button" onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
                        className="inline-flex size-11 items-center justify-center rounded-full border border-brand-300 text-brand-900 transition hover:bg-brand-100 md:hidden"
                        aria-label="Menu principal"
                        aria-expanded={isMenuOpen}
                        aria-controls="mobile-navigation">

                            {isMenuOpen ? (
                            <X className="size-6 text-currentColor" aria-hidden="true" />
                            ) : (
                            <Menu className="size-6 text-currentColor" aria-hidden="true" />
                            )}

                    </button>
                </div>
            </PageContainer>

            {isMenuOpen && (
                <nav id="mobile-navigation" className="border-t border-brand-200 bg-brand-50 md:hidden">
                    <PageContainer className="flex flex-col gap-1 py-4">
                        {navigationItems.map((item) => (
                            <NavLink key={item.to} to={item.to} end={item.to === "/"} onClick={() => setIsMenuOpen(false)}
                            className={({ isActive }) => `px-3 ${isActive ? "bg-brand-600 rounded-2xl text-brand-50" : ""}`}>
                                {item.label}
                            </NavLink>
                        ))}
                    </PageContainer>
                </nav>
            )}
        </header>
    )
}