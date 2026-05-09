import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { RewardsPageClient } from "@/components/recompensas/RewardsPageClient";

export const metadata: Metadata = {
  title: "Recompensas · Puntos eco | Smart Route",
  description:
    "Canjea puntos eco por transporte público, TUeBICI, museos y más. Consulta tu nivel, ranking y catálogo de recompensas Smart Route.",
};

function RewardsFooter() {
  return (
    <footer className="relative border-t border-slate-200/90 bg-white/70 px-5 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] pt-11 backdrop-blur-xl sm:px-6 lg:px-8 lg:pb-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 text-left sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[1rem] font-bold text-slate-900">Smart Route · Recompensas</p>
          <p className="mt-2 max-w-md text-[0.875rem] leading-relaxed text-slate-600">
            Programa conceptual de puntos eco vinculado a tus rutas en esta demostración.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-8 gap-y-2 text-[0.875rem] font-semibold">
          <a href="#como-ganar" className="text-slate-600 transition hover:text-emerald-700">
            Puntos eco
          </a>
          <a href="#catalogo-canje" className="text-slate-600 transition hover:text-emerald-700">
            Catálogo
          </a>
          <Link href="/" className="rounded-lg text-emerald-700 underline-offset-4 hover:text-emerald-900 hover:underline">
            Ir al mapa
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default function RecompensasPage() {
  return (
    <div className="relative flex min-h-full flex-col overflow-x-hidden bg-[linear-gradient(165deg,#f0fdf4_0%,#ecfdf5_18%,#f8fafc_42%,#e0f2fe_72%,#f0fdf4_100%)] text-slate-800">
      <div className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-white/75 px-4 py-3 shadow-[0_8px_32px_-20px_rgba(15,118,110,0.35)] backdrop-blur-2xl sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl border border-transparent px-2 py-1 text-sm font-bold text-sky-700 transition hover:border-sky-200 hover:bg-white/80 hover:text-sky-900"
        >
          ← Abrir mapa
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50 px-4 py-1.5 text-[0.6875rem] font-extrabold uppercase tracking-[0.18em] text-emerald-800">
          <Sparkles className="h-4 w-4 shrink-0 text-emerald-500 motion-safe:animate-pulse motion-reduce:hidden" aria-hidden />
          Movilidad brillante · demo
        </span>
      </div>
      <RewardsPageClient />
      <RewardsFooter />
    </div>
  );
}
