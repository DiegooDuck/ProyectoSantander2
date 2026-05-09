import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("https://datos.santander.es/api/rest/datasets/sensores_ambientales.json", {
      next: { revalidate: 300 },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.resources && data.resources.length > 0) {
        return NextResponse.json(data);
      }
    }
  } catch (error) {
    console.error("Failed to fetch real air quality data, falling back to mock.", error);
  }

  // Graceful Mock Data - GeoJSON FeatureCollection
  const mockFeatures = [
    {
      type: "Feature",
      properties: { id: "AQ1", name: "Paseo de Pereda", aqi: 85, pollutant: "NO2" }, // High pollution
      geometry: { type: "Point", coordinates: [-3.8020, 43.4620] },
    },
    {
      type: "Feature",
      properties: { id: "AQ2", name: "Valdecilla", aqi: 75, pollutant: "PM2.5" },
      geometry: { type: "Point", coordinates: [-3.8250, 43.4560] },
    },
    {
      type: "Feature",
      properties: { id: "AQ3", name: "Cuatro Caminos", aqi: 95, pollutant: "NO2" }, // Very high pollution
      geometry: { type: "Point", coordinates: [-3.8180, 43.4580] },
    },
    {
      type: "Feature",
      properties: { id: "AQ4", name: "El Sardinero", aqi: 20, pollutant: "None" }, // Clean air
      geometry: { type: "Point", coordinates: [-3.7910, 43.4770] },
    },
    {
      type: "Feature",
      properties: { id: "AQ5", name: "Parque de las Llamas", aqi: 15, pollutant: "None" }, // Clean air
      geometry: { type: "Point", coordinates: [-3.8000, 43.4750] },
    }
  ];

  return NextResponse.json({
    type: "FeatureCollection",
    features: mockFeatures,
  });
}
