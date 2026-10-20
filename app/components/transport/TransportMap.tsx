import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import type { LiveVehicle, TransportRoute } from "~/lib/api";

interface TransportMapProps {
  vehicles: LiveVehicle[];
  routes?: TransportRoute[];
  height?: string;
  selectedVehicleId?: number | null;
  onVehicleSelect?: (vehicleId: number) => void;
}

const vehicleColors = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#0891b2",
  "#65a30d",
  "#ea580c",
  "#4f46e5",
  "#0f766e",
];

const kamakisCenter: [number, number] = [-1.1690359, 36.9698529];

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function getVehicleMarkerIcon(vehicle: LiveVehicle, selected: boolean) {
  const color = vehicleColors[Math.abs(vehicle.vehicle_id) % vehicleColors.length];
  const signalColor = vehicle.speed !== null && vehicle.speed > 0 ? "#22c55e" : "#f59e0b";
  const registration = escapeHtml(vehicle.number || `Bus ${vehicle.vehicle_id}`);
  const border = selected ? "#ffffff" : "rgba(255,255,255,0.7)";
  const shadow = selected
    ? "0 0 0 2px rgba(59,130,246,0.5), 0 2px 6px rgba(15,23,42,0.4)"
    : "0 1px 4px rgba(15,23,42,0.35)";

  return L.divIcon({
    className: "transport-vehicle-marker",
    html: `<div style="display:flex;align-items:center;gap:3px;width:76px;padding:2px 4px;border:1px solid ${border};border-radius:6px;background:${color};box-shadow:${shadow};transform:${selected ? "scale(1.06)" : "scale(1)"};">
      <span style="position:relative;display:flex;align-items:center;justify-content:center;width:17px;height:17px;flex:none;border-radius:3px;background:rgba(15,23,42,0.22);">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2h9A2.5 2.5 0 0 1 19 4.5V18h-1v2a1 1 0 0 1-2 0v-2H8v2a1 1 0 0 1-2 0v-2H5V4.5Z" fill="white"/>
          <path d="M7.5 4h9a.5.5 0 0 1 .5.5V10H7V4.5a.5.5 0 0 1 .5-.5ZM7 12h10v4H7v-4Z" fill="${color}"/>
          <circle cx="8" cy="17" r="1.3" fill="#0f172a"/><circle cx="16" cy="17" r="1.3" fill="#0f172a"/>
        </svg>
        <span style="position:absolute;right:-2px;top:-2px;width:6px;height:6px;border:1px solid white;border-radius:50%;background:${signalColor};"></span>
      </span>
      <span style="min-width:0;overflow:hidden;color:white;font:700 8px/1 system-ui,sans-serif;text-overflow:ellipsis;white-space:nowrap;">${registration}</span>
    </div>`,
    iconSize: [84, 24],
    iconAnchor: [42, 12],
    popupAnchor: [0, -12],
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

function FitToMap({ vehicles, routes }: { vehicles: LiveVehicle[]; routes?: TransportRoute[] }) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [];

    vehicles.forEach((vehicle) => {
      if (typeof vehicle.lat === "number" && typeof vehicle.lng === "number") {
        points.push([vehicle.lat, vehicle.lng]);
      }
    });

    routes?.forEach((route) => {
      route.geofences?.forEach((geofence) => {
        if (geofence.active && typeof geofence.lat === "number" && typeof geofence.lng === "number") {
          points.push([geofence.lat, geofence.lng]);
        }
      });
    });

    if (points.length === 0) {
      map.setView(kamakisCenter, 14);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds.pad(0.2), { maxZoom: 15 });
  }, [map, vehicles, routes]);

  return null;
}

export default function TransportMap({
  vehicles,
  routes = [],
  height = "420px",
  selectedVehicleId = null,
  onVehicleSelect,
}: TransportMapProps) {
  const activeVehicles = vehicles.filter((vehicle) => typeof vehicle.lat === "number" && typeof vehicle.lng === "number");

  const routeGeofences = routes.flatMap((route, routeIndex) =>
    (route.geofences ?? [])
      .filter((geofence) => geofence.active && typeof geofence.lat === "number" && typeof geofence.lng === "number")
      .map((geofence) => ({
        ...geofence,
        routeName: route.name,
        color: ["#60a5fa", "#34d399", "#f59e0b", "#a78bfa", "#f472b6"][routeIndex % 5],
      })),
  );

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-950" style={{ height }}>
      <MapContainer center={kamakisCenter} zoom={14} scrollWheelZoom className="h-full w-full" style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap contributors</a>"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          subdomains="abc"
        />

        <FitToMap vehicles={vehicles} routes={routes} />

        {routeGeofences.map((geofence) => (
          <div key={geofence.id}>
            <Circle
              center={[geofence.lat, geofence.lng]}
              radius={geofence.radius_meters}
              pathOptions={{ color: geofence.color, fillColor: geofence.color, fillOpacity: 0.12, weight: 2 }}
            />
            <Marker
              position={[geofence.lat, geofence.lng]}
              icon={getStopMarkerIcon()}
            >
              <Popup>
                <div className="space-y-1 text-xs text-slate-900">
                  <div className="font-bold text-sm">{geofence.stop_name}</div>
                  <div>Route: {geofence.routeName}</div>
                  <div>Type: {geofence.stop_type}</div>
                  <div>Geofence radius: {geofence.radius_meters} m</div>
                </div>
              </Popup>
            </Marker>
          </div>
        ))}

        {activeVehicles.map((vehicle) => (
          <Marker
            key={vehicle.vehicle_id}
            position={[vehicle.lat as number, vehicle.lng as number]}
            icon={getVehicleMarkerIcon(vehicle, vehicle.vehicle_id === selectedVehicleId)}
            title={`Bus ${vehicle.number}`}
            eventHandlers={{
              click: () => onVehicleSelect?.(vehicle.vehicle_id),
            }}
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
