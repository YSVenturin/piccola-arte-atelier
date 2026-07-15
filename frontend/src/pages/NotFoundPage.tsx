import { Link } from "react-router";
import { PageContainer } from "../components/layout/PageContainer";

import { ROUTES } from "../routes/routePaths";

export function NotFoundPage() {
  return (
      <section className="text-center">
        <PageContainer>
          <p className="text-sm font-semibold text-amber-800">
            Erro 404
          </p>

          <h1 className="mt-2 text-3xl font-bold text-stone-900">
            Página não encontrada
          </h1>

          <Link
            to={ROUTES.home}
            className="mt-6 font-medium text-amber-900 hover:underline"
          >
            Voltar para o início
          </Link>
        </PageContainer>
      </section>
  );
}