export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/[0.06] px-5 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] pt-10 sm:px-6 lg:px-8 lg:pb-12 lg:pt-11">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 text-left md:flex-row md:items-start md:justify-between md:gap-10">
        <div className="flex w-full flex-col gap-2 md:max-w-xs">
          <p className="text-[1.0625rem] font-semibold text-white">Smart Route</p>
          <p className="text-[0.9375rem] leading-relaxed text-zinc-500">
            Movilidad urbana con rutas optimizadas en tiempo real.
          </p>
        </div>

        <nav
          aria-label="Pie de página"
          className="flex w-full flex-col gap-2.5 text-[0.9375rem] md:flex-row md:flex-wrap md:justify-end md:gap-x-8 md:gap-y-2"
        >
          <a
            href="#features"
            className="flex min-h-11 items-center text-zinc-400 transition hover:text-white md:min-h-0 md:inline-flex md:hover:underline"
          >
            Producto
          </a>
          <a
            href="#demo"
            className="flex min-h-11 items-center text-zinc-400 transition hover:text-white md:min-h-0 md:inline-flex md:hover:underline"
          >
            Demo
          </a>
          <a
            href="#beneficios"
            className="flex min-h-11 items-center text-zinc-400 transition hover:text-white md:min-h-0 md:inline-flex md:hover:underline"
          >
            Beneficios
          </a>
          <a
            href="#"
            className="flex min-h-11 items-center text-zinc-400 transition hover:text-white md:min-h-0 md:inline-flex md:hover:underline"
          >
            Contacto
          </a>
        </nav>
      </div>

      <p className="mx-auto mt-9 max-w-6xl text-left text-[0.6875rem] leading-relaxed text-zinc-600 text-pretty sm:text-xs">
        © {new Date().getFullYear()} Smart Route. Hecho para ciudades que se
        mueven.
      </p>
    </footer>
  );
}
