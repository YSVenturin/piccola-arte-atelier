import { Link, Navigate, useParams } from 'react-router';

import { PageContainer } from "../components/layout/PageContainer";
import { ROUTES } from "../routes/routePaths";


interface ProductDetailsParams {
  slug: string;
}

export function ProductDetailsPage() {
    const { slug } = useParams<keyof ProductDetailsParams>();

    if (!slug) {
        return <Navigate to={ROUTES.products} replace />;
    }

    return (
        <section className="py-16 sm:py-24">
            <PageContainer>
                <div className="mx-auto max-w-3xl">
                    <p className="text-sm font-semibold uppercase tracking-[0.25rem] text-brand-600">
                        Detalhes do produto
                    </p>

                    <h1 className="mt-4 font-display text-5xl font-semibold text-brand-900 sm:text-6xl">
                        Produto
                    </h1>

                    <p className="mt-6 leading-8 text-brand-700">
                        Esta página carregará os detalhes do produto usando o slug:
                    </p>

                    <code className="mt-4 inline-block rounded-lg bg-brand-100 px-4 py-2 text-sm text-brand-800">
                        {slug}
                    </code>

                    <div className="mt-8">
                        <Link
                        to={ROUTES.products}
                        className="text-sm font-semibold text-brand-800 underline-offset-4 hover:underline"
                        >
                            Voltar para os produtos
                        </Link>
                    </div>
                </div>
            </PageContainer>
        </section>
    )
}