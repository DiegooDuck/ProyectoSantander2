import { redirect } from "next/navigation";

/** La página de información de producto pasa a «Recompensas». */
export default function LandingAliasPage() {
  redirect("/recompensas");
}
