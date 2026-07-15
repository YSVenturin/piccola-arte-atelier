import axios from "axios";
import { useState } from "react";
import { Link } from "react-router";
import { getProducts } from "../services/productService";
import type { ProductSummaryDTO } from "../types/product";
import { PageContainer } from "../components/layout/PageContainer";

import { ROUTES } from "../routes/routePaths";

export function ProductListPage() {
    const [products, setProducts] = useState<ProductSummaryDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleLoadProducts() {
        setLoading(true);
        setError(null);

        try {
            const data = await getProducts();
            setProducts(data);
        }
        catch (requestError) {
            console.error("Failed to load the products: ", requestError);

            if (axios.isAxiosError(requestError)) {
                if (!requestError.response) {
                    setError("Could not connect to the backend.");
                }
                else {
                    setError(`Backend response: ${requestError.response.status}.`,);
                }
            }
            else {
                setError("Unexpected error.");
            }
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <section className="bg-brand-50 py-12 sm:py-16">
            <PageContainer>
                <div className="mx-auto max-w-5xl">
                    <Link to={ROUTES.home} className="font-medium text-brand-900 hover:underline">
                        Voltar para o inicio
                    </Link>

                    <div>
                        <h1 className="text-3xl font-bold text-brand-900">
                            Produtos
                        </h1>

                        <button type="button" onClick={handleLoadProducts} disabled={loading} className="mt-2 mb-2 rounded-full bg-brand-900 px-6 py-3 font-medium text-white hover:bg-brand-800">
                            {loading ? "Carregando..." : "Carregar produtos"}
                        </button>
                    </div>

                    {error && (
                        <div role="alert">
                            {error}
                        </div>
                    )}

                    {!loading && !error && products.length > 0 && (
                        <section>
                            <p className="mb-4 text-sm text-brand-600">
                                {products.length} produto(s) recebido(s).
                            </p>

                            <ul className="grid gap-4 grid-cols-3">
                                {products.map((product) => (
                                    <li key={product.id} className="rounded-xl border border-brand-200 bg-brand-50 p-5">
                                        <h2>
                                            {product.name}
                                        </h2>

                                        <p className="font-semibold text-brand-900">
                                            {product.shortDescription}
                                        </p>

                                        <p>
                                            Slug: {product.slug}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            </PageContainer>
        </section>
    )
}

