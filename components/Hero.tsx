export function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-white/[0.04] pb-12 pt-[calc(2.25rem+env(safe-area-inset-top,0px))] sm:pb-16 sm:pt-14 lg:pb-20 lg:pt-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(56,189,248,0.18),transparent_55%),radial-gradient(ellipse_80%_50%_at_100%_50%,rgba(167,139,250,0.12),transparent_50%),radial-gradient(ellipse_60%_40%_at_0%_80%,rgba(52,211,153,0.1),transparent_45%)]"
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-5 sm:gap-8 sm:px-6 lg:gap-10 lg:px-8">
        <p className="animate-fade-up inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[0.8125rem] font-medium leading-none tracking-wide text-zinc-300 shadow-sm backdrop-blur-sm sm:py-1.5 sm:text-sm">
          <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          <span className="text-pretty">Movilidad urbana · tiempo real</span>
        </p>

        <div className="flex w-full flex-col gap-4 sm:gap-5">
          <h1 className="animate-fade-up text-pretty text-[2.25rem] font-bold leading-[1.06] tracking-[-0.02em] text-white [animation-delay:60ms] sm:text-5xl sm:tracking-tight lg:text-6xl lg:leading-[1.05]">
            Rutas más inteligentes para tu ciudad
          </h1>
          <p className="animate-fade-up max-w-2xl text-[0.9375rem] leading-[1.65] text-zinc-400 [animation-delay:120ms] sm:text-lg sm:leading-relaxed">
            <span className="font-semibold text-zinc-200">Smart Route</span>{" "}
            optimiza cada trayecto con datos en vivo: tráfico, transporte
            público y micro-movilidad en una sola app clara y rápida.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 animate-fade-up [animation-delay:180ms] md:flex-row md:flex-wrap md:items-center md:gap-4">
          <a
            href="/"
            className="flex min-h-14 w-full shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 px-5 text-base font-semibold text-zinc-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 hover:shadow-cyan-500/30 active:scale-[0.98] md:w-auto md:min-w-[12rem] md:rounded-xl"
          >
            Abrir mapa
          </a>
          <a
            href="#beneficios"
            className="flex min-h-14 w-full shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.03] px-5 text-base font-semibold text-zinc-100 transition hover:border-white/25 hover:bg-white/[0.06] active:scale-[0.98] md:w-auto md:min-w-[12rem] md:rounded-xl"
          >
            Ver beneficios
          </a>
        </div>
      </div>
    </section>
  );
}
