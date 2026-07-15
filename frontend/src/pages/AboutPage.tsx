import { PageContainer } from "../components/layout/PageContainer";

export function AboutPage() {
  return (
    <section className="py-16 sm:py-24">
      <PageContainer>
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-600">
            Nossa história
          </p>

          <h1 className="mt-4 font-display text-5xl font-semibold text-brand-900 sm:text-6xl">
            Sobre o atelier
          </h1>

          <p className="mt-6 leading-8 text-brand-700">
            Esta página será desenvolvida posteriormente.
          </p>
        </div>
      </PageContainer>
    </section>
  );
}