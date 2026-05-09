import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("https://datos.santander.es/api/rest/datasets/incidencias.json", {
      next: { revalidate: 300 },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.resources && data.resources.length > 0) {
        return NextResponse.json(data);
      }
    }
  } catch (error) {
    console.error("Failed to fetch real incidents data, falling back to mock.", error);
  }

  // Graceful Mock Data - GeoJSON FeatureCollection
  const mockFeatures = [
    {
      type: "Feature",
      properties: { id: "INC1", type: "Obras", description: "Obras de asfaltado en Calle San Fernando. Calle cortada.", severity: "high" },
      geometry: { type: "Point", coordinates: [-3.8150, 43.4600] },
    },
    {
      type: "Feature",
      properties: { id: "INC2", type: "Evento", description: "Corte por evento deportivo en Calle Castilla.", severity: "high" },
      geometry: { type: "Point", coordinates: [-3.8120, 43.4550] },
    },
    {
      type: "Feature",
      properties: { id: "INC3", type: "Mantenimiento", description: "Mantenimiento de semáforos, carril derecho cortado.", severity: "medium" },
      geometry: { type: "Point", coordinates: [-3.8080, 43.4640] },
    }
  ];

  return NextResponse.json({
    type: "FeatureCollection",
    features: mockFeatures,
  });
}
