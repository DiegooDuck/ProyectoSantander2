"use client";

import { useEffect, useState } from "react";
import { Marker, Popup } from "react-map-gl/mapbox";
import { TriangleAlert, HardHat } from "lucide-react";

export function IncidentsLayer({ visible }: { visible: boolean }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [geoData, setGeoData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

  useEffect(() => {
    async function fetchIncidents() {
      try {
        const response = await fetch("/api/santander/incidents");
        if (!response.ok) throw new Error("Error loading incidents");
        const data = await response.json();
        setGeoData(data);
      } catch (err) {
        console.error("Failed to fetch incidents:", err);
      }
    }
    
    if (visible && !geoData) {
      fetchIncidents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible || !geoData || !geoData.features) return null;

  return (
    <>
      {geoData.features.map((feature: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = feature as any;
        const coords = f.geometry.coordinates;
        const isWorks = f.properties.type === "Obras";
        const Icon = isWorks ? HardHat : TriangleAlert;
        const colorClass = isWorks ? "bg-amber-500 border-amber-300 shadow-amber-500/50" : "bg-rose-500 border-rose-300 shadow-rose-500/50";
        
        return (
          <Marker
            key={f.properties.id}
            longitude={coords[0]}
            latitude={coords[1]}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedIncident(f);
            }}
          >
            <div className="relative group cursor-pointer flex flex-col items-center justify-center transition-transform hover:scale-110 hover:z-10">
              {/* Alert ping */}
              <div className="absolute inset-0 rounded-full opacity-40 group-hover:animate-ping bg-rose-500"></div>
              
              <div className={`relative flex items-center justify-center w-8 h-8 rounded-full shadow-lg border-2 ${colorClass}`}>
                 <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="mt-1 w-4 h-1 bg-black/30 rounded-full blur-[1px]"></div>
            </div>
          </Marker>
        );
      })}

      {selectedIncident && (
        <Popup
          longitude={selectedIncident.geometry.coordinates[0]}
          latitude={selectedIncident.geometry.coordinates[1]}
          anchor="bottom"
          onClose={() => setSelectedIncident(null)}
          closeOnClick={false}
          className="z-20"
          offset={20}
          maxWidth="260px"
        >
          <div className="p-1 min-w-[200px] font-sans">
            <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
              <div className={`p-1.5 rounded-lg ${selectedIncident.properties.type === 'Obras' ? 'bg-amber-100' : 'bg-rose-100'}`}>
                 {selectedIncident.properties.type === 'Obras' ? (
                   <HardHat className="w-4 h-4 text-amber-600" />
                 ) : (
                   <TriangleAlert className="w-4 h-4 text-rose-600" />
                 )}
              </div>
              <h3 className="font-bold text-gray-900 leading-tight">
                {selectedIncident.properties.type}
              </h3>
            </div>
            
            <p className="text-sm text-gray-700 leading-snug">
              {selectedIncident.properties.description}
            </p>
            <div className="mt-2 text-right">
              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                selectedIncident.properties.severity === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
              }`}>
                Severidad: {selectedIncident.properties.severity}
              </span>
            </div>
          </div>
        </Popup>
      )}
    </>
  );
}
