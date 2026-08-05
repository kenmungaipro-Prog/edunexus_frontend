// ============================================================
// app/pages/transport/parent-tracker.tsx
// ============================================================
import React, { useEffect, useMemo, useState } from "react";
import { useLoaderData, Link } from "react-router";
import { api, type LiveVehicle, type VehicleTelemetry } from "~/lib/api";
import TransportSubNav from "./TransportSubNav";
import {
  Autocomplete,
  DirectionsRenderer,
  GoogleMap,
  Marker,
  Polyline,
  TrafficLayer,
  useJsApiLoader,
} from "@react-google-maps/api";

const GOOGLE_MAPS_LIBRARIES = ["places"] as const;

const defaultCenter = { lat: -1.2921, lng: 36.8219 };
const containerStyle = { width: "100%", height: "520px" };

export async function clientLoader() {
  try {
    const res = await api.transport.live();
    return { vehicles: res.data };
  } catch (error) {
    console.error("Failed fetching live transport data:", error);
    return { vehicles: [] };
  }
}

export default function ParentTransportTrackerPage() {
  const { vehicles } = useLoaderData<typeof clientLoader>();
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    vehicles.length > 0 ? vehicles[0].vehicle_id : null
  );
  const [routePath, setRoutePath] = useState<google.maps.LatLngLiteral[]>([]);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [showTraffic, setShowTraffic] = useState(true);
  const [mapType, setMapType] = useState<google.maps.MapTypeId>("roadmap");
  const [autoComplete, setAutoComplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [destination, setDestination] = useState<google.maps.PlaceResult | null>(null);
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);
  const [distanceMatrix, setDistanceMatrix] = useState<google.maps.DistanceMatrixResponse | null>(null);

  const selectedVehicle = vehicles.find((vehicle) => vehicle.vehicle_id === selectedVehicleId);

  const center = useMemo(() => {
    if (selectedVehicle?.lat != null && selectedVehicle?.lng != null) {
      return { lat: selectedVehicle.lat, lng: selectedVehicle.lng };
    }
    const first = vehicles.find((vehicle) => vehicle.lat != null && vehicle.lng != null);
    return first ? { lat: first.lat!, lng: first.lng! } : defaultCenter;
  }, [selectedVehicle, vehicles]);

  useEffect(() => {
    if (!selectedVehicleId) {
      setRoutePath([]);
      return;
    }

    api.transport.vehicleTelemetryHistory(selectedVehicleId)
      .then((response) => {
        const points = response.data
          .filter((entry: VehicleTelemetry) => entry.lat != null && entry.lng != null)
          .map((entry: VehicleTelemetry) => ({ lat: entry.lat as number, lng: entry.lng as number }));

        setRoutePath(points);
      })
      .catch(() => {
        setRoutePath([]);
      });
  }, [selectedVehicleId]);

  useEffect(() => {
    if (!destination?.geometry?.location || !selectedVehicle?.lat || !selectedVehicle?.lng) {
      setDirectionsResult(null);
      setDistanceMatrix(null);
      return;
    }

    const origin = { lat: selectedVehicle.lat, lng: selectedVehicle.lng };
    const destinationLatLng = destination.geometry.location;

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin,
        destination: destinationLatLng,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      },
      (result, status) => {
        if (status === "OK" && result) {
          setDirectionsResult(result);
        } else {
          setDirectionsResult(null);
        }
      }
    );

    const distanceService = new google.maps.DistanceMatrixService();
    distanceService.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destinationLatLng],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        if (status === "OK" && response) {
          setDistanceMatrix(response);
        } else {
          setDistanceMatrix(null);
        }
      }
    );
  }, [destination, selectedVehicle]);

  useEffect(() => {
    if (map && selectedVehicle?.lat != null && selectedVehicle?.lng != null) {
      map.panTo({ lat: selectedVehicle.lat, lng: selectedVehicle.lng });
    }
  }, [map, selectedVehicle]);

  const mapKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: mapKey ?? "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const handleLoadAutocomplete = (autocomplete: google.maps.places.Autocomplete) => {
    setAutoComplete(autocomplete);
  };

  const handlePlaceChanged = () => {
    if (!autoComplete) return;
    const place = autoComplete.getPlace();
    setDestination(place);
  };

  const distanceInfo = distanceMatrix?.rows?.[0]?.elements?.[0];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">🚌 Parent Transport Tracker</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Live bus location, route trace, and directions powered by Google Maps.
          </p>
        </div>
        <Link
          to="/transport"
          className="self-start rounded-lg bg-slate-800 px-4 py-2 text-slate-200 text-sm font-medium hover:bg-slate-700 transition"
        >
          ← Back to Transport
        </Link>
      </div>
      <TransportSubNav />

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="space-y-6">
          <div className="relative rounded-3xl overflow-hidden border border-slate-700 bg-slate-950 shadow-xl shadow-black/20">
            <div className="absolute left-4 top-4 z-20 flex flex-col gap-2 p-2 rounded-3xl bg-slate-900/85 border border-slate-700 shadow-lg backdrop-blur">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMapType("roadmap")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${mapType === "roadmap" ? "bg-slate-700 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                >
                  Road
                </button>
                <button
                  type="button"
                  onClick={() => setMapType("hybrid")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${mapType === "hybrid" ? "bg-slate-700 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                >
                  Hybrid
                </button>
                <button
                  type="button"
                  onClick={() => setMapType("satellite")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${mapType === "satellite" ? "bg-slate-700 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                >
                  Satellite
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowTraffic((current) => !current)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${showTraffic ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
              >
                {showTraffic ? "Traffic On" : "Traffic Off"}
              </button>
            </div>

            <div className="absolute right-4 top-4 z-20 w-[min(320px,calc(100%-2rem))]">
              {mapKey && isLoaded ? (
                <Autocomplete onLoad={handleLoadAutocomplete} onPlaceChanged={handlePlaceChanged}>
                  <input
                    type="text"
                    placeholder="Search address or stop"
                    className="w-full rounded-3xl border border-slate-700 bg-slate-900/95 px-4 py-3 text-sm text-slate-100 shadow-lg outline-none transition focus:border-blue-500"
                  />
                </Autocomplete>
              ) : (
                <div className="rounded-3xl border border-slate-700 bg-slate-950/95 px-4 py-3 text-sm text-slate-400">
                  {mapKey ? "Loading place search…" : "Google Maps API key missing"}
                </div>
              )}
            </div>

            <div className="h-[520px] w-full">
              {!mapKey ? (
                <div className="flex h-full items-center justify-center bg-slate-900 text-slate-300 p-6">
                  <div className="max-w-md text-center">
                    <p className="text-lg font-semibold text-white">Google Maps API key not configured</p>
                    <p className="mt-2 text-sm text-slate-400">Set <code className="font-mono">VITE_GOOGLE_MAPS_API_KEY</code> in your environment.</p>
                  </div>
                </div>
              ) : loadError ? (
                <div className="flex h-full items-center justify-center bg-slate-900 text-slate-300 p-6">
                  <div className="max-w-md text-center">
                    <p className="text-lg font-semibold text-white">Map failed to load</p>
                    <p className="mt-2 text-sm text-slate-400">Check your Google Maps API key in <code className="font-mono">VITE_GOOGLE_MAPS_API_KEY</code>.</p>
                  </div>
                </div>
              ) : !isLoaded ? (
                <div className="flex h-full items-center justify-center bg-slate-900 text-slate-400 p-6">
                  Loading map…
                </div>
              ) : (
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={center}
                  zoom={12}
                  onLoad={setMap}
                  mapTypeId={mapType}
                  options={{
                    streetViewControl: true,
                    fullscreenControl: false,
                    zoomControl: true,
                    mapTypeControl: false,
                  }}
                >
                  {showTraffic && <TrafficLayer />}
                  {selectedVehicle && selectedVehicle.lat != null && selectedVehicle.lng != null && (
                    <Marker
                      key={selectedVehicle.vehicle_id}
                      position={{ lat: selectedVehicle.lat, lng: selectedVehicle.lng }}
                      label={{ text: selectedVehicle.number, className: "text-xs font-bold" }}
                      title={`${selectedVehicle.number} • ${selectedVehicle.route ?? "Route not assigned"}`}
                    />
                  )}
                  {routePath.length > 1 && (
                    <Polyline
                      path={routePath}
                      options={{
                        strokeColor: "#38bdf8",
                        strokeOpacity: 0.9,
                        strokeWeight: 6,
                        icons: [
                          {
                            icon: {
                              path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
                              scale: 4,
                              strokeColor: "#93c5fd",
                            },
                            offset: "100%",
                            repeat: "60px",
                          },
                        ],
                      }}
                    />
                  )}
                  {directionsResult && <DirectionsRenderer directions={directionsResult} options={{ suppressMarkers: false }} />}
                </GoogleMap>
              )}
            </div>
          </div> 
          {/* ^ Added missing closing tag for the map container wrapper ^ */}

          <div className="rounded-3xl border border-slate-700 bg-slate-900 p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Live fleet summary</p>
                <p className="text-lg font-semibold text-white">{vehicles.length} vehicles reporting</p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">Updated on page load</span>
            </div>
            <div className="grid gap-3">
              {vehicles.length > 0 ? (
                vehicles.map((vehicle) => {
                  const isSelected = vehicle.vehicle_id === selectedVehicleId;
                  const status = vehicle.speed && vehicle.speed > 0 ? `${vehicle.speed.toFixed(0)} km/h` : "Stationary";
                  return (
                    <button
                      key={vehicle.vehicle_id}
                      type="button"
                      onClick={() => setSelectedVehicleId(vehicle.vehicle_id)}
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                        isSelected ? "border-blue-500 bg-slate-800 shadow-sm" : "border-slate-700 bg-slate-950/80 hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{vehicle.number}</p>
                          <p className="text-xs text-slate-400">{vehicle.route ?? "No route assigned"}</p>
                        </div>
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{status}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
                        <div>Driver: {vehicle.driver ?? "Unassigned"}</div>
                        <div>{vehicle.lat != null && vehicle.lng != null ? `${vehicle.lat.toFixed(4)}, ${vehicle.lng.toFixed(4)}` : "GPS unavailable"}</div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-slate-700 bg-slate-950 p-6 text-center text-sm text-slate-400">
                  No live transport vehicles available. Ensure the driver app is sending telemetry and the route is active.
                </div>
              )}
            </div>
          </div>

          {destination && distanceInfo ? (
            <div className="rounded-3xl border border-slate-700 bg-slate-900 p-5 text-sm text-slate-300">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Route estimate</h2>
              <p className="text-white text-sm font-semibold">{destination.formatted_address || destination.name || "Selected place"}</p>
              <div className="mt-3 space-y-2 text-xs text-slate-400">
                <div>Distance: {distanceInfo.distance?.text ?? "Unknown"}</div>
                <div>ETA: {distanceInfo.duration?.text ?? "Unknown"}</div>
                <div>Status: {distanceInfo.status}</div>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-700 bg-slate-900 p-5 text-sm text-slate-300">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">How this works</h2>
            <p className="leading-6">
              This page displays live vehicle telemetry from the transport backend. Parents can search for a destination, enable traffic, and watch the moving marker and route trace on Google Maps.
            </p>
          </div>

          {selectedVehicle ? (
            <div className="rounded-3xl border border-slate-700 bg-slate-900 p-5 text-sm text-slate-300">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Selected vehicle</h2>
              <div className="space-y-3">
                <div className="text-white text-lg font-semibold">{selectedVehicle.number}</div>
                <div className="text-slate-400 text-sm">Route: {selectedVehicle.route ?? "Not assigned"}</div>
                <div className="grid gap-2 text-xs text-slate-400">
                  <div>Latitude: {selectedVehicle.lat != null ? selectedVehicle.lat.toFixed(6) : "N/A"}</div>
                  <div>Longitude: {selectedVehicle.lng != null ? selectedVehicle.lng.toFixed(6) : "N/A"}</div>
                  <div>Speed: {selectedVehicle.speed != null ? `${selectedVehicle.speed} km/h` : "Unknown"}</div>
                  <div>Driver: {selectedVehicle.driver ?? "Unassigned"}</div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-3xl border border-slate-700 bg-slate-900 p-5 text-sm text-slate-300">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Parent action</h2>
            <p className="leading-6">Share this page with parents so they can track the bus in real time. If the map is not visible, confirm the school’s Google Maps API key is configured.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}