import { Link } from "react-router";

export function HomePage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-stone-50">
            <section className="text-center">
                <p className="text-lg font-medium uppercase text-amber-800">
                    Ceramica Fria Artesanal
                </p>

                <h1 className="mt-3 text-5xl font-bold text-stone-900">
                    Piccola Arte Atelier
                </h1>

                <p className="mt-4 text-stone-600">
                    Piccole creazioni, grande amore!
                </p>

                <Link to="/produtos" className="mt-8 inline-block rounded-full bg-amber-900 px-3 py-3 font-medium text-white hover:bg-amber-800">
                    Testar catalogo
                </Link>
            </section>
        </main>
    )
}