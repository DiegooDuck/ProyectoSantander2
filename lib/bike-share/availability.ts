export type BikeStationLite = {
  id: string;
  name: string;
  lng: number;
  lat: number;
  availableBikes: number;
  availableDocks: number;
};

const EARTH_RADIUS_M = 6371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineMeters(
  a: { lng: number; lat: number },
  b: { lng: number; lat: number },
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * (sinDLng * sinDLng);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_M * c;
}

export function findNearestStationWithDocks(
  from: { lng: number; lat: number },
  stations: BikeStationLite[],
  opts?: { excludeId?: string },
): { station: BikeStationLite; distanceMeters: number } | null {
  const excludeId = opts?.excludeId;

  let best: { station: BikeStationLite; distanceMeters: number } | null = null;
  for (const s of stations) {
    if (excludeId && s.id === excludeId) continue;
    if (s.availableDocks <= 0) continue;
    const d = haversineMeters(from, s);
    if (!best || d < best.distanceMeters) best = { station: s, distanceMeters: d };
  }
  return best;
}

