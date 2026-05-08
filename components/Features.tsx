import { Section } from "@/components/Section";

const items = [
  {
    title: "Rutas en tiempo real",
    body: "Recálculo automático ante incidentes, obras o cambios en el tráfico.",
    accent: "from-sky-500/20 to-cyan-500/10",
    dot: "bg-sky-400",
  },
  {
    title: "Multi-modal",
    body: "Combina caminar, bici, metro y ride sin perder el hilo del viaje.",
    accent: "from-violet-500/20 to-fuchsia-500/10",
    dot: "bg-violet-400",
  },
  {
    title: "ETA fiable",
    body: "Estimaciones entrenadas con patrones locales, no solo distancias.",
    accent: "from-emerald-500/20 to-teal-500/10",
    dot: "bg-emerald-400",
  },
];

export function Features() {
  return (
    <Section
      id="features"
      className="border-t border-white/[0.06] bg-zinc-950/50"
    >
      <header className="mb-8 flex w-full flex-col gap-2.5 lg:mb-11">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-emerald-400/90">
          Producto
        </p>
        <h2 className="text-pretty text-[1.625rem] font-bold leading-snug tracking-tight text-white sm:text-3xl lg:text-4xl">
          Diseñada para moverte, no para complicarte
        </h2>
        <p className="max-w-2xl text-[0.9375rem] leading-relaxed text-zinc-400 sm:text-lg">
          Tres pilares que transforman cómo navegas la ciudad, desde el primer
          toque.
        </p>
      </header>

      <div className="flex w-full flex-col gap-3.5 md:grid md:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-6">
        {items.map((f) => (
          <article
            key={f.title}
            className="group relative flex w-full flex-col gap-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent p-5 transition duration-300 sm:p-6 md:hover:border-white/[0.14] md:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
          >
            <div
              aria-hidden
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${f.accent} opacity-60 transition duration-300 md:group-hover:opacity-100`}
            />
            <div className="relative flex w-full flex-col gap-2.5">
              <span
                className={`inline-flex h-2.5 w-2.5 rounded-full ${f.dot} ring-4 ring-white/5`}
              />
              <h3 className="text-[1.0625rem] font-semibold leading-snug text-white sm:text-xl">
                {f.title}
              </h3>
              <p className="text-[0.9375rem] leading-relaxed text-zinc-400 sm:text-base">
                {f.body}
              </p>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
