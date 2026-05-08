import Link from "next/link";
import { Section } from "@/components/Section";

export function DemoSection() {
  return (
    <Section id="demo">
      <header className="mb-6 flex w-full flex-col gap-2.5 sm:mb-8 lg:mb-10">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-sky-400/90">
          Demo
        </p>
        <h2 className="text-pretty text-[1.625rem] font-bold leading-snug tracking-tight text-white sm:text-3xl lg:text-4xl">
          Mapa a pantalla completa
        </h2>
        <p className="max-w-2xl text-[0.9375rem] leading-relaxed text-zinc-400 sm:text-lg">
          La experiencia principal vive en la pantalla de inicio: rutas, perfiles,
          capas de bus/bici/tráfico y tres temas visuales. Abre la app para
          probar gestos y overlays tipo Citymapper.
        </p>
      </header>

      <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/60 p-6 sm:p-8">
        <p className="text-center text-sm leading-relaxed text-zinc-400">
          El mapa interactivo ya no se incrusta aquí para mantener esta página
          ligera.{" "}
          <Link
            href="/"
            className="font-semibold text-sky-400 underline-offset-4 hover:underline"
          >
            Volver al mapa principal
          </Link>
          .
        </p>
      </div>
    </Section>
  );
}
