import { Section } from "@/components/Section";

const rows = [
  {
    title: "Menos fricción al salir de casa",
    text: "Un solo flujo para comparar opciones sin saltar entre apps.",
  },
  {
    title: "Privacidad primero",
    text: "Minimizamos datos; tú controlas historial y ubicación aproximada.",
  },
  {
    title: "Modo ahorro y modo prisa",
    text: "Elige si prefieres gastar menos tiempo o menos dinero en cada viaje.",
  },
  {
    title: "Actualizaciones proactivas",
    text: "Alertas suaves antes de que el tráfico te atrape en la salida.",
  },
];

export function Benefits() {
  return (
    <Section
      id="beneficios"
      className="border-t border-white/[0.06] bg-zinc-950/40"
    >
      <header className="mb-8 flex w-full flex-col gap-2.5 lg:mb-11">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-violet-400/90">
          Por qué Smart Route
        </p>
        <h2 className="text-pretty text-[1.625rem] font-bold leading-snug tracking-tight text-white sm:text-3xl lg:text-4xl">
          Beneficios que notas al día uno
        </h2>
        <p className="max-w-2xl text-[0.9375rem] leading-relaxed text-zinc-400 sm:text-lg">
          Una idea por bloque y texto cómodo de escanear en pantallas pequeñas.
        </p>
      </header>

      <ul className="flex w-full flex-col gap-3 sm:gap-3.5">
        {rows.map((b, i) => (
          <li
            key={b.title}
            className="flex w-full flex-col gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 transition duration-300 sm:p-5 md:flex-row md:items-start md:gap-4 md:hover:border-emerald-500/20 md:hover:bg-white/[0.04] lg:gap-5"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center self-start rounded-xl bg-gradient-to-br from-emerald-500/25 to-sky-500/20 text-[0.9375rem] font-bold tabular-nums text-emerald-300 ring-1 ring-white/10">
              {i + 1}
            </span>
            <div className="flex min-w-0 flex-col gap-1.5">
              <h3 className="text-[1.0625rem] font-semibold leading-snug text-white sm:text-lg">
                {b.title}
              </h3>
              <p className="text-[0.9375rem] leading-relaxed text-zinc-400 sm:text-base">
                {b.text}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
