import { Section } from "@/components/Section";

export function FinalCTA() {
  return (
    <Section variant="compact">
      <div className="relative flex w-full flex-col gap-8 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-600/20 via-zinc-900 to-sky-600/15 p-5 shadow-[0_24px_80px_-30px_rgba(56,189,248,0.35)] sm:rounded-3xl sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:p-11">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl"
        />

        <div className="relative flex w-full flex-col gap-3 lg:max-w-xl">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Lista de espera
          </p>
          <h2 className="text-pretty text-[1.625rem] font-bold leading-snug tracking-tight text-white sm:text-3xl">
            Únete al acceso anticipado
          </h2>
          <p className="text-[0.9375rem] leading-relaxed text-zinc-300 sm:text-lg">
            Te avisamos cuando abramos nuevas ciudades. Sin spam: solo
            lanzamientos y mejoras que importan en ruta.
          </p>
        </div>

        <div className="relative flex w-full flex-col gap-3 lg:max-w-sm lg:shrink-0">
          <a
            href="#"
            className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-white px-5 text-base font-semibold text-zinc-950 shadow-lg transition hover:bg-zinc-100 active:scale-[0.98] md:rounded-xl md:hover:shadow-xl"
          >
            Solicitar invitación
          </a>
          <p className="text-center text-[0.6875rem] leading-relaxed text-zinc-500 text-pretty sm:text-left sm:text-xs">
            Al continuar aceptas recibir novedades sobre Smart Route.
          </p>
        </div>
      </div>
    </Section>
  );
}
