import { Benefits } from "@/components/Benefits";
import { DemoSection } from "@/components/DemoSection";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { FinalCTA } from "@/components/FinalCTA";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[0.08] bg-background/90 px-4 py-3 backdrop-blur-md sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold text-accent-blue hover:underline"
        >
          ← Abrir app mapa
        </Link>
      </div>
      <Hero />
      <Features />
      <DemoSection />
      <Benefits />
      <FinalCTA />
      <Footer />
    </div>
  );
}
