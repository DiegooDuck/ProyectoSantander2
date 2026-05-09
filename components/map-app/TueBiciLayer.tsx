"use client";

import { useEffect, useState } from "react";
import { Marker, Popup } from "react-map-gl/mapbox";
import { Zap, Bike, ExternalLink } from "lucide-react";

export type GBFSStation = {
  station_id: string;
  name: string;
  lat: number;
  lon: number;
  capacity: number;
  rental_uris?: {
    android?: string;
    ios?: string;
    web?: string;
  };
};

export function TueBiciLayer({ visible }: { visible: boolean }) {
  const [stations, setStations] = useState<GBFSStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<GBFSStation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStations() {
      try {
        const response = await fetch(
          "https://gbfs.nextbike.net/maps/gbfs/v2/nextbike_ek/es/station_information.json"
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        if (data?.data?.stations) {
          setStations(data.data.stations);
        }
      } catch (err) {
        console.error("Error fetching TUeBICI stations:", err);
        setError("Error loading stations");
      }
    }
    
    if (visible && stations.length === 0 && !error) {
      fetchStations();
    }
  }, [visible, stations.length, error]);

  if (!visible) return null;

  return (
    <>
      {stations.map((station) => (
        <Marker
          key={station.station_id}
          longitude={station.lon}
          latitude={station.lat}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelectedStation(station);
          }}
        >
          <div className="relative group cursor-pointer flex flex-col items-center justify-center transition-transform hover:scale-110 hover:z-10">
            {/* Pulsing effect for electric vibe */}
            <div className="absolute inset-0 bg-cyan-400 rounded-full opacity-30 group-hover:animate-ping"></div>
            
            {/* The marker itself */}
            <div className="relative flex items-center justify-center w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full shadow-lg border-2 border-white">
               <Bike className="w-5 h-5 text-white" />
               <Zap className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 fill-yellow-300 drop-shadow-md" />
            </div>
            
            {/* Small shadow */}
            <div className="mt-1 w-4 h-1 bg-black/30 rounded-full blur-[1px]"></div>
          </div>
        </Marker>
      ))}

      {selectedStation && (
        <Popup
          longitude={selectedStation.lon}
          latitude={selectedStation.lat}
          anchor="top"
          onClose={() => setSelectedStation(null)}
          closeOnClick={false}
          className="z-20"
          maxWidth="280px"
        >
          <div className="p-1 min-w-[200px] font-sans">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-cyan-100 p-1.5 rounded-full">
                 <Zap className="w-4 h-4 text-cyan-600 fill-cyan-600" />
              </div>
              <h3 className="font-bold text-gray-900 leading-tight">
                {selectedStation.name}
              </h3>
            </div>
            
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2 mb-2 border border-gray-100">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Capacidad</span>
              <span className="text-sm font-bold text-gray-900">{selectedStation.capacity} plazas</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="flex flex-col items-center justify-center bg-emerald-50 rounded-lg p-2 border border-emerald-100">
                <span className="text-[9px] font-semibold text-emerald-600 uppercase tracking-wider">Bicis</span>
                <span className="text-sm font-bold text-emerald-700">
                  {Math.floor(selectedStation.capacity * 0.4)}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center bg-blue-50 rounded-lg p-2 border border-blue-100">
                <span className="text-[9px] font-semibold text-blue-600 uppercase tracking-wider">Docks</span>
                <span className="text-sm font-bold text-blue-700">
                  {Math.ceil(selectedStation.capacity * 0.6)}
                </span>
              </div>
            </div>

            <div className="text-[10px] text-gray-400 mb-3 text-center border-t border-gray-100 pt-2">
              ID: {selectedStation.station_id} &bull; {selectedStation.lat.toFixed(4)}, {selectedStation.lon.toFixed(4)}
            </div>

            {selectedStation.rental_uris?.web ? (
              <a
                href={selectedStation.rental_uris.web}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-sm hover:shadow"
              >
                <span>Alquilar / Ver estación</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <p className="text-xs text-center text-gray-400 italic">Enlace de alquiler no disponible</p>
            )}
          </div>
        </Popup>
      )}
    </>
  );
}
