import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <main className="bg-stone-50">
      <section className="text-center">
        <p className="text-sm font-semibold text-amber-800">
          Erro 404
        </p>

        <h1 className="mt-2 text-3xl font-bold text-stone-900">
          Página não encontrada
        </h1>

        <Link
          to="/"
          className="mt-6 font-medium text-amber-900 hover:underline"
        >
          Voltar para o início
        </Link>
      </section>
    </main>
  );
}