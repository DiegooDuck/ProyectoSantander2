import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("http://datos.santander.es/api/rest/datasets/paradas_bus.json", {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 3600, // cache for 1 hour
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch from Santander API" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy error fetching bus stops:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
