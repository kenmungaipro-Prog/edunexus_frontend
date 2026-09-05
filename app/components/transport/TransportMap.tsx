import { Circle, MapContainer, Marker, Popup, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import type { LiveVehicle, TransportRoute } from "~/lib/api";

interface TransportMapProps {
  vehicles: LiveVehicle[];
  routes?: TransportRoute[];
  height?: string;
}

function getVehicleMarkerIcon(speed: number | null) {
  const color = speed !== null && speed > 0 ? "#22c55e" : "#f59e0b";

  return L.divIcon({
    className: "transport-vehicle-marker",
    html: `<div style="width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid rgba(255,255,255,0.9);box-shadow:0 0 0 4px rgba(15,23,42,0.2);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  });
}

function getStopMarkerIcon() {
  return L.divIcon({
    className: "transport-stop-marker",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:9999px;background:#f97316;border:2px solid rgba(255,255,255,0.9);box-shadow:0 0 0 4px rgba(249,115,22,0.2);font-size:10px;line-height:1;">📍</div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12],
  });
}

function syntheticRouteCoordinates(route: TransportRoute, index: number): [number, number][] {
  const baseLat = -1.2861;
  const baseLng = 36.8172;

  const points = Array.from({ length: Math.max(route.stops?.length ?? 1, 2) }, (_, stopIndex) => {
    const offsetLat = (index * 0.004) + stopIndex * 0.0024;
    const offsetLng = (index * 0.0055) + stopIndex * 0.0022;

    return [baseLat + offsetLat, baseLng + offsetLng] as [number, number];
  });

  return points;
}

function FitToMap({ vehicles, routes }: { vehicles: LiveVehicle[]; routes?: TransportRoute[] }) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [];

    vehicles.forEach((vehicle) => {
      if (typeof vehicle.lat === "number" && typeof vehicle.lng === "number") {
        points.push([vehicle.lat, vehicle.lng]);
      }
    });

    routes?.forEach((route, routeIndex) => {
      syntheticRouteCoordinates(route, routeIndex).forEach((point) => points.push(point));
    });

    if (points.length === 0) {
      map.setView([-1.2861, 36.8172], 11);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds.pad(0.35));
  }, [map, vehicles, routes]);

  return null;
}

export default function TransportMap({ vehicles, routes = [], height = "420px" }: TransportMapProps) {
  const activeVehicles = vehicles.filter((vehicle) => typeof vehicle.lat === "number" && typeof vehicle.lng === "number");

  const routePolylines = routes.map((route, routeIndex) => {
    const coordinates = syntheticRouteCoordinates(route, routeIndex);
    return {
      id: route.id,
      name: route.name,
      coordinates,
      stops: route.stops ?? [],
      color: ["#60a5fa", "#34d399", "#f59e0b", "#a78bfa", "#f472b6"][routeIndex % 5],
    };
  });

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-950" style={{ height }}>
      <MapContainer center={[-1.2861, 36.8172]} zoom={12} scrollWheelZoom className="h-full w-full" style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitToMap vehicles={vehicles} routes={routes} />

        {routePolylines.map((route) => (
          <div key={route.id}>
            <Polyline positions={route.coordinates} pathOptions={{ color: route.color, weight: 3, opacity: 0.85 }} />

            {route.coordinates.map((point, index) => (
              <Marker
                key={`${route.id}-${index}`}
                position={point}
                icon={getStopMarkerIcon()}
              >
                <Popup>
                  <div className="space-y-1 text-xs text-slate-900">
                    <div className="font-bold text-sm">{route.name}</div>
                    <div>{route.stops[index]?.name ?? `Stop ${index + 1}`}</div>
                    {route.stops[index]?.pickup_time ? <div>Pickup: {route.stops[index].pickup_time}</div> : null}
                    {route.stops[index]?.drop_time ? <div>Dropoff: {route.stops[index].drop_time}</div> : null}
                  </div>
                </Popup>
              </Marker>
            ))}

            <Circle
              center={route.coordinates[Math.floor(route.coordinates.length / 2)]}
              radius={250 + route.id * 15}
              pathOptions={{ color: route.color, fillColor: route.color, fillOpacity: 0.08, weight: 1 }}
            />
          </div>
        ))}

        {activeVehicles.map((vehicle) => (
          <Marker
            key={vehicle.vehicle_id}
            position={[vehicle.lat as number, vehicle.lng as number]}
            icon={getVehicleMarkerIcon(vehicle.speed)}
          >
            <Popup>
              <div className="space-y-1 text-xs text-slate-900">
                <div className="font-bold text-sm">{vehicle.number}</div>
                <div>Route: {vehicle.route || "Unassigned"}</div>
                <div>Driver: {vehicle.driver || "Unassigned"}</div>
                <div>Speed: {vehicle.speed !== null ? `${vehicle.speed} km/h` : "N/A"}</div>
                <div>Updated: {vehicle.updated_at ? new Date(vehicle.updated_at).toLocaleTimeString() : "N/A"}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
