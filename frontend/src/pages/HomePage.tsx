import { Link } from "react-router";
import brandMarkLight from "../assets/images/brand/brand-mark-light.png";

export function HomePage() {
    return (
        <main className="min-h-screen items-center justify-center bg-brand-50">
            <section className="mx-auto flex flex-col items-center text-center">
                <img
                    src={brandMarkLight}
                    alt="Símbolo da Piccola Arte Atelier"
                    className="size-32 sm:size-40"
                />
                <p className="text-lg font-medium uppercase text-brand-700">
                    Ceramica Fria Artesanal
                </p>

                <h1 className="mt-3 text-5xl font-bold text-brand-950">
                    Piccola Arte Atelier
                </h1>

                <p className="mt-4 text-brand-600-600">
                    Piccole creazioni, grande amore!
                </p>

                <Link to="/produtos" className="rounded-full bg-brand-600 px-7 py-3.5 text-sm font-semibold text-brand-50 hover:bg-brand-700">
                    Testar catalogo
                </Link>

                <Link to="/sobre" className="mt-8">
                    Conhecer o atelier
                </Link>
            </section>
        </main>
    )
}