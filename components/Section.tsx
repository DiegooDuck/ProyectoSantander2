export function Section({
  id,
  children,
  variant = "default",
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  variant?: "default" | "compact";
  className?: string;
}) {
  const shell = "mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8";

  const y =
    variant === "compact"
      ? "py-10 sm:py-12 lg:py-14"
      : "py-12 sm:py-14 lg:py-20";

  return (
    <section id={id} className={`${y} ${className}`.trim()}>
      <div className={shell}>{children}</div>
    </section>
  );
}
