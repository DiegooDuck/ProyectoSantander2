"use client";

import { useEffect, useState } from "react";
import { Source, Layer } from "react-map-gl/mapbox";

export function AirQualityLayer({ visible }: { visible: boolean }) {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    async function fetchAirQuality() {
      try {
        const response = await fetch("/api/santander/air-quality");
        if (!response.ok) throw new Error("Error loading air quality");
        const data = await response.json();
        setGeoData(data);
      } catch (err) {
        console.error("Failed to fetch air quality:", err);
      }
    }
    
    if (visible && !geoData) {
      fetchAirQuality();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible || !geoData) return null;

  return (
    <Source id="air-quality-source" type="geojson" data={geoData}>
      {/* Heatmap Layer for Pollution */}
      <Layer
        id="air-quality-heatmap"
        type="heatmap"
        paint={{
          // Increase the heatmap weight based on AQI value
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "aqi"],
            0, 0,
            100, 1
          ],
          // Increase the heatmap intensity by zoom level
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0, 1,
            15, 3
          ],
          // Color ramp from Green (good) to Red (bad)
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(34, 197, 94, 0)",      // Transparent green (low pollution density)
            0.2, "rgba(34, 197, 94, 0.4)",    // Emerald-500
            0.4, "rgba(234, 179, 8, 0.6)",    // Yellow-500
            0.6, "rgba(249, 115, 22, 0.8)",   // Orange-500
            0.8, "rgba(239, 68, 68, 0.9)",    // Red-500
            1, "rgba(185, 28, 28, 1)"         // Red-700
          ],
          // Adjust the heatmap radius by zoom level
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 30,
            15, 80
          ],
          "heatmap-opacity": 0.6
        }}
      />
    </Source>
  );
}
