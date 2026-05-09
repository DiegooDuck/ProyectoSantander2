import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Attempt to fetch from real API
    const response = await fetch("https://datos.santander.es/api/rest/datasets/parkings_publicos.json", {
      next: { revalidate: 60 },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.resources && data.resources.length > 0) {
        return NextResponse.json(data);
      }
    }
  } catch (error) {
    console.error("Failed to fetch real parking data, falling back to mock.", error);
  }

  // Graceful Mock Data
  const mockResources = [
    { id: "P1", name: "Parking Plaza Pombo", lat: 43.4630, lng: -3.8045, capacity: 300, free_spots: Math.floor(Math.random() * 50) + 5 },
    { id: "P2", name: "Parking Alfonso XIII", lat: 43.4615, lng: -3.8058, capacity: 450, free_spots: Math.floor(Math.random() * 20) }, // Almost full
    { id: "P3", name: "Parking Numancia", lat: 43.4610, lng: -3.8130, capacity: 200, free_spots: Math.floor(Math.random() * 100) + 50 },
    { id: "P4", name: "Parking Machichaco", lat: 43.4600, lng: -3.8000, capacity: 550, free_spots: Math.floor(Math.random() * 200) + 10 },
  ];

  return NextResponse.json({
    summary: { items: mockResources.length, source: "mocked" },
    resources: mockResources,
  });
}
