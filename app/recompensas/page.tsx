import type { Metadata } from "next";
import Link from "next/link";
import { RewardsPageClient } from "@/components/recompensas/RewardsPageClient";

export const metadata: Metadata = {
  title: "Recompensas · Puntos eco | Smart Route",
  description:
    "Canjea puntos eco por transporte público, TUeBICI, museos y más. Consulta tu nivel, ranking y catálogo de recompensas Smart Route.",
};

function RewardsFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-black/20 px-5 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] pt-10 sm:px-6 lg:px-8 lg:pb-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 text-left sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[1rem] font-semibold text-white">Smart Route · Recompensas</p>
          <p className="mt-2 max-w-md text-[0.875rem] leading-relaxed text-zinc-500">
            Programa conceptual de puntos eco vinculado a tus rutas en la app demostración.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-8 gap-y-2 text-[0.875rem]">
          <a href="#como-ganar" className="text-zinc-400 transition hover:text-white">
            Puntos eco
          </a>
          <a href="#catalogo-canje" className="text-zinc-400 transition hover:text-white">
            Catálogo
          </a>
          <Link href="/" className="font-medium text-emerald-400 hover:text-emerald-300">
            Ir al mapa
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default function RecompensasPage() {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] bg-background/90 px-4 py-3 backdrop-blur-md sm:px-6">
        <Link href="/" className="text-sm font-semibold text-accent-blue hover:underline">
          ← Abrir mapa
        </Link>
        <span className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-zinc-500">
          Santander ciudad demostrador
        </span>
      </div>
      <RewardsPageClient />
      <RewardsFooter />
    </div>
  );
}
