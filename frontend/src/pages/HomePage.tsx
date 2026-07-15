import { Link } from "react-router";
import brandMarkLight from "../assets/images/brand/brand-mark-light.png";
import { PageContainer } from "../components/layout/PageContainer";

import { ROUTES } from "../routes/routePaths";

export function HomePage() {
    return (
        <section className="bg-brand-50 py-16 sm:py-24">
            <PageContainer>
                <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
                    <img
                        src={brandMarkLight}
                        alt="Símbolo da Piccola Arte Atelier"
                        className="size-32 sm:size-40 mb-4"
                    />
                    <p className="text-lg font-sans font-medium uppercase tracking-[0.3rem] text-brand-700">
                        Cerâmica Fria Artesanal
                    </p>

                    <h1 className="mt-3 text-5xl font-display font-bold text-brand-950">
                        Piccola Arte Atelier
                    </h1>

                    <p className="mt-4 mb-4 font-sans text-brand-600-600">
                        Piccole creazioni, grande amore!
                    </p>

                    <Link to={ROUTES.products} className="rounded-full bg-brand-600 font-sans px-7 py-3.5 text-sm font-semibold text-brand-50 hover:bg-brand-700">
                        Testar catalogo
                    </Link>

                    <Link to={ROUTES.about} className="mt-8">
                        Conhecer o atelier
                    </Link>
                </div>
            </PageContainer>
        </section>
    )
}