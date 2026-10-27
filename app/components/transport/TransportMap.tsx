import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";
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
  const color = vehicle.demo ? "#dc2626" : vehicleColors[Math.abs(vehicle.vehicle_id) % vehicleColors.length];
  const speed = vehicle.demo ? vehicle.demo.speed : vehicle.speed;
  const signalColor = speed !== null && speed > 0 ? "#22c55e" : "#f59e0b";
  const registrationText = vehicle.number?.trim() || "Vehicle";
  const registration = escapeHtml(registrationText);
  const labelWidth = Math.min(Math.max(registrationText.length * 6 + 14, 72), 150);
  const labelLines = Math.max(1, Math.ceil(registrationText.length / 22));
  const markerHeight = 24 + 4 + labelLines * 12 + 4;
  const border = selected ? "#bfdbfe" : "rgba(255,255,255,0.8)";
  const shadow = selected
    ? "0 0 0 2px rgba(59,130,246,0.6), 0 2px 5px rgba(15,23,42,0.35)"
    : "0 1px 4px rgba(15,23,42,0.3)";

  return L.divIcon({
    className: "transport-vehicle-marker",
    html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;width:${labelWidth}px;height:${markerHeight}px;">
      <span style="position:relative;display:flex;align-items:center;justify-content:center;width:24px;height:24px;flex:none;border:1.5px solid ${border};border-radius:7px;background:${color};box-shadow:${shadow};">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5V17h-1v1.5a1.5 1.5 0 0 1-3 0V17H8v1.5a1.5 1.5 0 0 1-3 0V17H4V6.5Z" fill="white"/>
          <path d="M6.5 6h11a.5.5 0 0 1 .5.5V10H6V6.5a.5.5 0 0 1 .5-.5ZM6 12h12v3H6v-3Z" fill="${color}"/>
          <circle cx="8" cy="17" r="1" fill="#0f172a"/><circle cx="16" cy="17" r="1" fill="#0f172a"/>
        </svg>
        <span style="position:absolute;right:-3px;top:-3px;width:7px;height:7px;border:1px solid white;border-radius:50%;background:${signalColor};"></span>
      </span>
      ${vehicle.demo ? '<span style="position:absolute;top:-4px;right:calc(50% - 24px);padding:1px 3px;border:1px solid white;border-radius:4px;background:#b91c1c;color:white;font:700 7px/1.2 system-ui,sans-serif;">DEMO</span>' : ""}
      <span style="box-sizing:border-box;display:block;width:${labelWidth}px;margin-top:3px;padding:2px 5px;border:1px solid rgba(15,23,42,0.12);border-radius:5px;background:rgba(255,255,255,0.94);box-shadow:0 1px 3px rgba(15,23,42,0.25);color:#0f172a;font:700 10px/12px system-ui,sans-serif;text-align:center;overflow-wrap:anywhere;">${registration}</span>
    </div>`,
    iconSize: [labelWidth, markerHeight],
    iconAnchor: [labelWidth / 2, 12],
    popupAnchor: [0, -14],
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
      const position = vehicle.demo ?? vehicle;
      if (typeof position.lat === "number" && typeof position.lng === "number") {
        points.push([position.lat, position.lng]);
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
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    if (vehicles.some((vehicle) => vehicle.demo && new Date(vehicle.demo.expires_at).getTime() <= Date.now())) {
      setClock(Date.now());
      return;
    }

    const nextExpiry = vehicles
      .map((vehicle) => vehicle.demo ? new Date(vehicle.demo.expires_at).getTime() : Infinity)
      .filter((expiresAt) => expiresAt > Date.now())
      .sort((left, right) => left - right)[0];

    if (nextExpiry === undefined) {
      return;
    }

    const timeout = window.setTimeout(() => setClock(Date.now()), Math.max(0, nextExpiry - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [vehicles]);

  const activeVehicles = vehicles
    .map((vehicle) => ({
      ...vehicle,
      demo: vehicle.demo && new Date(vehicle.demo.expires_at).getTime() > clock ? vehicle.demo : null,
    }))
    .filter((vehicle) => {
      const position = vehicle.demo ?? vehicle;
      return typeof position.lat === "number" && typeof position.lng === "number";
    });

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

        <FitToMap vehicles={activeVehicles} routes={routes} />

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

        {activeVehicles.map((vehicle) => {
          const position = vehicle.demo ?? vehicle;
          if (typeof position.lat !== "number" || typeof position.lng !== "number") {
            return null;
          }

          return (
            <Marker
              key={vehicle.vehicle_id}
              position={[position.lat, position.lng]}
              icon={getVehicleMarkerIcon(vehicle, vehicle.vehicle_id === selectedVehicleId)}
              title={`${vehicle.demo ? "DEMO " : ""}${vehicle.number?.trim() || "Vehicle"}`}
              eventHandlers={{
                click: () => onVehicleSelect?.(vehicle.vehicle_id),
              }}
            >
              <Popup>
                <div className="space-y-1 text-xs text-slate-900">
                  {vehicle.demo ? <div className="font-bold text-red-700">DEMO POSITION — NOT REAL TRACKING</div> : null}
                  <div className="font-bold text-sm">{vehicle.number}</div>
                  <div>Route: {vehicle.route || "Unassigned"}</div>
                  <div>Driver: {vehicle.driver || "Unassigned"}</div>
                  <div>Speed: {position.speed !== null ? `${position.speed} km/h` : "N/A"}</div>
                  <div>Updated: {position.updated_at ? new Date(position.updated_at).toLocaleTimeString() : "N/A"}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
