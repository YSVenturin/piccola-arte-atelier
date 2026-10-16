import { Image, Package, Tags } from "lucide-react";

const sections = [
  {
    title: "Produtos",
    icon: Package,
    description:
      "Cadastre peças, ajuste informações e controle o que aparece no catálogo.",
  },
  {
    title: "Categorias",
    icon: Tags,
    description:
      "Organize as peças para facilitar a navegação de quem visita o atelier.",
  },
  {
    title: "Imagens",
    icon: Image,
    description:
      "Escolha a foto principal e organize a galeria de cada produto.",
  },
];

export function AdminDashboardPage() {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
        Seu atelier, organizado
      </p>

      <h1 className="mt-3 font-display text-4xl sm:text-5xl">
        Visão geral
      </h1>

      <p className="mt-4 max-w-2xl leading-7 text-brand-700">
        Este é o espaço de administração da Piccola Arte.
        O acesso já está pronto; as ferramentas de edição
        serão adicionadas nas próximas etapas.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {sections.map(({ title, icon: Icon, description }) => (
          <section
            key={title}
            className="rounded-2xl border border-brand-200 bg-white/60 p-6"
          >
            <Icon
              className="size-6 text-brand-700"
              aria-hidden="true"
            />

            <h2 className="mt-5 font-display text-3xl">
              {title}
            </h2>

            <p className="mt-3 text-sm leading-6 text-brand-700">
              {description}
            </p>

            <p className="mt-5 text-xs font-semibold text-brand-600">
              Disponível em breve
            </p>
          </section>
        ))}
      </div>
    </>
  );
}