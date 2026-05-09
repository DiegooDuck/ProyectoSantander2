import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("http://datos.santander.es/api/rest/datasets/carril_bici.json");
    if (!res.ok) throw new Error("Failed to fetch bike lanes from Santander API");
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Bike lanes API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
