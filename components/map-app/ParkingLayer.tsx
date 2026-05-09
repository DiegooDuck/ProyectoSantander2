"use client";

import { useEffect, useState } from "react";
import { Marker, Popup } from "react-map-gl/mapbox";
import { SquareParking } from "lucide-react";

export type ParkingStation = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  capacity: number;
  free_spots: number;
};

export function ParkingLayer({ visible }: { visible: boolean }) {
  const [parkings, setParkings] = useState<ParkingStation[]>([]);
  const [selectedParking, setSelectedParking] = useState<ParkingStation | null>(null);

  useEffect(() => {
    async function fetchParkings() {
      try {
        const response = await fetch("/api/santander/parking");
        if (!response.ok) throw new Error("Error loading parking");
        const data = await response.json();
        if (data && data.resources) {
          setParkings(data.resources);
        }
      } catch (err) {
        console.error("Failed to fetch parkings:", err);
      }
    }
    
    if (visible && parkings.length === 0) {
      fetchParkings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      {parkings.map((p) => {
        const pctFree = p.free_spots / p.capacity;
        let colorClass = "bg-emerald-500 border-emerald-300";
        let shadowClass = "shadow-emerald-500/50";
        if (pctFree < 0.1) {
          colorClass = "bg-rose-500 border-rose-300";
          shadowClass = "shadow-rose-500/50";
        } else if (pctFree < 0.3) {
          colorClass = "bg-amber-500 border-amber-300";
          shadowClass = "shadow-amber-500/50";
        }

        return (
          <Marker
            key={p.id}
            longitude={p.lng}
            latitude={p.lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedParking(p);
            }}
          >
            <div className={`relative group cursor-pointer flex flex-col items-center justify-center transition-transform hover:scale-110 hover:z-10`}>
              {/* Pulsing effect */}
              <div className={`absolute inset-0 rounded-full opacity-30 group-hover:animate-ping ${colorClass}`}></div>
              
              {/* The marker itself */}
              <div className={`relative flex items-center justify-center w-8 h-8 rounded-xl shadow-lg border-2 ${colorClass} ${shadowClass}`}>
                 <SquareParking className="w-4 h-4 text-white" />
                 {/* Spots badge */}
                 <div className="absolute -top-2 -right-2 flex items-center justify-center bg-gray-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-gray-700 shadow-sm">
                   {p.free_spots}
                 </div>
              </div>
              
              {/* Small shadow */}
              <div className="mt-1 w-4 h-1 bg-black/30 rounded-full blur-[1px]"></div>
            </div>
          </Marker>
        );
      })}

      {selectedParking && (
        <Popup
          longitude={selectedParking.lng}
          latitude={selectedParking.lat}
          anchor="top"
          onClose={() => setSelectedParking(null)}
          closeOnClick={false}
          className="z-20"
          maxWidth="260px"
        >
          <div className="p-1 min-w-[200px] font-sans">
            <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
              <div className="bg-indigo-100 p-1.5 rounded-lg">
                 <SquareParking className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="font-bold text-gray-900 leading-tight">
                {selectedParking.name}
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-2 border border-gray-200">
                <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Total</span>
                <span className="text-sm font-bold text-gray-700">
                  {selectedParking.capacity}
                </span>
              </div>
              <div className={`flex flex-col items-center justify-center rounded-lg p-2 border ${
                selectedParking.free_spots > 20 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
              }`}>
                <span className={`text-[9px] font-semibold uppercase tracking-wider ${
                  selectedParking.free_spots > 20 ? 'text-emerald-600' : 'text-rose-600'
                }`}>Libres</span>
                <span className={`text-sm font-bold ${
                  selectedParking.free_spots > 20 ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {selectedParking.free_spots}
                </span>
              </div>
            </div>
            
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div className={`h-full rounded-full ${
                  selectedParking.free_spots > 20 ? 'bg-emerald-500' : 'bg-rose-500'
                }`} style={{ width: `${Math.max(5, (1 - (selectedParking.free_spots / selectedParking.capacity)) * 100)}%` }}>
              </div>
            </div>
            <p className="text-[9px] text-gray-400 mt-1 text-right">Ocupación estimada</p>
          </div>
        </Popup>
      )}
    </>
  );
}
