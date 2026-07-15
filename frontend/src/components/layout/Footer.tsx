import { Link } from "react-router";

import logoMarkDark from "../../assets/images/brand/brand-mark-dark.png";
import { PageContainer } from "./PageContainer";

const navigationItems = [
    {
        label: "Início",
        to: "/",
    },
    {
        label: "Produtos",
        to: "/produtos",
    },
    {
        label: "Sobre",
        to: "/sobre",
    },
    {
        label: "Contato",
        to: "/contato",
    },
];

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full bg-brand-900 text-brand-100">
            <PageContainer className="py-5 sm:py-8">
                <div className="grid gap-10 grid-cols-1 md:grid-cols-2 md:gap-16">
                    <div className="max-w-md">
                        <Link to="/" className="inline-flex items-center gap-2">
                            <img
                                src={logoMarkDark}
                                alt=""
                                className="size-16 object-contain"
                            />

                            <span className="flex flex-col">
                                <span className="font-display text-3xl font-semibold tracking-wide">
                                    Piccola Arte
                                </span>
                                <span className="text-xs font-semibold uppercase tracking-[0.3rem] text-brand-300">
                                    Atelier
                                </span>
                            </span>
                        </Link>

                        <p className="mt-6 leading-6 text-brand-200">
                            Pequenas criações feitas à mão para transformar detalhes
                            em lembranças especiais.
                        </p>

                        <p className="mt-3 font-display text-xl italic text-brand-300">
                            Piccole creazioni, grande amore!
                        </p>
                    </div>

                    <div className="items-start md:border-l border-brand-300 md:pl-6">
                        <h2 className="text-sm font-semibold uppercase tracking-[0.2rem] text-brand-300">
                            Navegação
                        </h2>

                        <nav className="mt-5 flex flex-col items-start gap-3">
                            {navigationItems.map((item) => (
                                <Link key={item.to} to={item.to} className="text-sm text-brand-100 transition-colors hover:text-brand-300">
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>

                <div className="mt-12 border-t border-brand-700 pt-6 text-center">
                    <p className="text-sm text-brand-300">
                        © {currentYear} Piccola Arte Atelier. Todos os direitos reservados.
                    </p>
                </div>
            </PageContainer>
        </footer>
    )
}