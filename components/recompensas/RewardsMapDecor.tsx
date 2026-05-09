"use client";

import Link from "next/link";
import Map from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { ArrowRight, MapPinned } from "lucide-react";

/** Centro demostrador (Bahía de Santander), alineado con Smart Route principal. */
const SANTANDER = { lng: -3.80998, lat: 43.46231 };

function staticBackdropUrl(accessToken: string): string {
  const q = encodeURIComponent(accessToken);
  return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${SANTANDER.lng},${SANTANDER.lat},10.95,28,42/2400x1500@2x?access_token=${q}`;
}

/** Capa inferior: foto estática Mapbox + líneas tipo callejero (SVG). */
export function RewardsMapBackdrop({ className = "" }: { className?: string }) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const bgUrl = token ? staticBackdropUrl(token) : null;

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {bgUrl ? (
        <div
          className="absolute inset-[-8%] bg-cover bg-center opacity-[0.2] saturate-[1.12] motion-safe:animate-[rewards-float_72s_linear_infinite] motion-safe:[animation-direction:alternate] [-webkit-mask-image:radial-gradient(ellipse_75%_58%_at_52%_35%,rgba(0,0,0,0.92)_32%,transparent_74%)] [mask-image:radial-gradient(ellipse_75%_58%_at_52%_35%,rgba(0,0,0,0.92)_32%,transparent_74%)]"
          style={{ backgroundImage: `url("${bgUrl}")` }}
        />
      ) : null}
      <svg
        className="absolute inset-0 z-[1] h-full w-full text-emerald-900/55 mix-blend-multiply opacity-90 motion-safe:animate-[rewards-twinkle_22s_ease-in-out_infinite]"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="rewards-street-net" width="72" height="72" patternUnits="userSpaceOnUse">
            <path d="M36 12v48M14 36h44" stroke="currentColor" strokeWidth={0.55} fill="none" opacity={0.45} />
            <circle cx={36} cy={36} r={1.1} fill="currentColor" opacity={0.35} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#rewards-street-net)" opacity={token ? 0.22 : 0.42} />
        <path
          d="M-120 620 Q420 780 940 620 T1540 700"
          stroke="currentColor"
          strokeWidth={7}
          fill="none"
          opacity={0.09}
          strokeLinecap="round"
          className="motion-safe:animate-[rewards-float_42s_linear_infinite] motion-safe:[animation-direction:alternate]"
        />
      </svg>
    </div>
  );
}

/** Mini mapa en vivo solo lectura; la atribución Mapbox/OSM queda visible en el propio lienzo y en el texto. */
export function RewardsMapPreview() {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!token) {
    return (
      <div className="flex min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-[1.125rem] border border-dashed border-slate-300 bg-gradient-to-br from-sky-50/90 via-white to-teal-50/70 px-6 py-10 text-center shadow-inner">
        <MapPinned className="h-11 w-11 text-teal-600 motion-safe:animate-pulse motion-reduce:opacity-95" aria-hidden />
        <p className="text-sm font-bold text-slate-800">Bahía · Santander (demostrador)</p>
        <p className="max-w-[17rem] text-[0.75rem] leading-relaxed text-slate-500">
          Configura{" "}
          <code className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[0.65rem] text-emerald-800">
            NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
          </code>{" "}
          para ver aquí la misma vista Mapbox que en la app principal.
        </p>
      </div>
    );
  }

  return (
    <aside className="flex w-full max-w-xl flex-col overflow-hidden rounded-[1.125rem] border border-teal-200/75 bg-white/95 shadow-[0_26px_64px_-36px_rgba(14,165,233,0.5)] backdrop-blur-sm ring-[3px] ring-teal-100/80 lg:max-w-none">
      <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-4">
        <div>
          <p className="text-[0.6rem] font-extrabold uppercase tracking-[0.22em] text-teal-700">Smart Route</p>
          <p className="mt-1 text-[0.9rem] font-bold text-slate-900">Previsualización del mapa</p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-emerald-900 ring-1 ring-emerald-200">
          Bahía · demo
        </span>
      </div>
      <div className="relative mx-3 mb-2 overflow-hidden rounded-xl border border-slate-200/90 bg-slate-100 shadow-inner animate-rewards-rise">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2] rounded-xl ring-[1.5px] ring-emerald-400/35 motion-safe:animate-[rewards-soft-pulse_6s_ease-in-out_infinite]"
        />
        <div className="aspect-[15/11] min-h-[200px] w-full lg:aspect-[16/11] lg:min-h-[248px]">
          <Map
            mapboxAccessToken={token}
            mapStyle="mapbox://styles/mapbox/light-v11"
            initialViewState={{
              longitude: SANTANDER.lng,
              latitude: SANTANDER.lat,
              zoom: 11.45,
              pitch: 50,
              bearing: -52,
              padding: { top: 6, bottom: 18, left: 6, right: 10 },
            }}
            style={{ width: "100%", height: "100%" }}
            reuseMaps={false}
            dragPan={false}
            dragRotate={false}
            scrollZoom={false}
            keyboard={false}
            doubleClickZoom={false}
            touchZoomRotate={false}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2 border-t border-slate-100/95 bg-gradient-to-br from-white to-emerald-50/35 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="text-[0.72rem] leading-relaxed text-slate-600">
          Cada punto eco lo ganas navegando por esta zona en el mapa interactivo.
        </p>
        <Link
          href="/"
          className="group inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-4 py-2.5 text-[0.75rem] font-bold text-white shadow-md shadow-teal-500/35 transition-[transform,filter] hover:brightness-110 motion-safe:active:scale-[0.98] sm:self-auto"
        >
          Abrir mapa completo
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </aside>
  );
}
