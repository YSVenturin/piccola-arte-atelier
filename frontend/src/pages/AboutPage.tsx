import { PageContainer } from "../components/layout/PageContainer";

export function AboutPage() {
  return (
    <section className="py-10 sm:py-14">
      <PageContainer>
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
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