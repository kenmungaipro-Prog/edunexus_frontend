// ============================================================
// app/components/transport/StudentTripTracker.tsx
// ============================================================
import { useEffect, useState } from "react";
import { api } from "~/lib/api";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
  interface Window {
    Pusher?: typeof Pusher;
  }
}

interface StudentTripTrackerProps {
  studentId: number;
  studentName: string;
}

export default function StudentTripTracker({ studentId, studentName }: StudentTripTrackerProps) {
  const [tripData, setTripData] = useState<any | null>(null);
  const [statusData, setStatusData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const [tripRes, statusRes] = await Promise.all([
          api.portal.transport.studentTrip(studentId),
          api.portal.transport.studentStatus(studentId),
        ]);

        if (!mounted) return;

        setTripData(tripRes.data || null);
        setStatusData(statusRes.data || null);
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to fetch student transport data:", err);
        setError("Unable to load transport information");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [studentId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!statusData?.has_active_trip) return;

    const reverbAppKey = import.meta.env.VITE_REVERB_APP_KEY;
    const reverbHost = import.meta.env.VITE_REVERB_HOST;
    const reverbPort = import.meta.env.VITE_REVERB_PORT ?? "8080";
    const reverbScheme = import.meta.env.VITE_REVERB_SCHEME ?? "https";
    const schoolId = sessionStorage.getItem('school_id') || localStorage.getItem('school_id');

    if (!reverbAppKey || !reverbHost || !schoolId) return;

    window.Pusher = Pusher;

    const echo = new Echo({
      broadcaster: "reverb",
      key: reverbAppKey,
      wsHost: reverbHost,
      wsPort: Number(reverbPort),
      wssPort: Number(reverbPort),
      forceTLS: reverbScheme === "https",
      enabledTransports: ["ws", "wss"],
    });

    const privateChannel = `fleet-delivery.${schoolId}`;

    // Listen for student status updates (boarded, dropped-off)
    echo.private(privateChannel).listen('.student.status.updated', (event: any) => {
      if (event.student?.id === studentId) {
        setStatusData((prev: any) => ({
          ...prev,
          student_status: event.tripStudent?.status,
          status: statusMap[event.tripStudent?.status] || event.tripStudent?.status,
        }));
      }
    });

    // Also listen for vehicle location updates
    echo.private(privateChannel).listen('.vehicle.location.updated', (event: any) => {
      if (tripData?.vehicle?.id === event.vehicle?.vehicle_id) {
        setTripData((prev: any) => ({
          ...prev,
          vehicle: {
            ...prev.vehicle,
            ...event.vehicle,
          },
        }));
      }
    });

    return () => {
      echo.leaveChannel(privateChannel);
    };
  }, [tripData?.vehicle?.id, studentId, statusData?.has_active_trip]);

  const statusMap: Record<string, string> = {
    'pending': 'Waiting to board',
    'boarded': 'On the bus',
    'dropped-off': 'Dropped off',
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="text-center text-slate-400">Loading transport information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="text-center text-rose-400">{error}</div>
      </div>
    );
  }

  if (!statusData?.has_active_trip) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-6">
        <div className="text-center">
          <div className="text-sm font-semibold text-slate-300 mb-2">🚌 No active trips</div>
          <div className="text-xs text-slate-500">{studentName} has no active transport trips at the moment.</div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'boarded':
        return 'bg-emerald-500/10 text-emerald-400';
      case 'dropped-off':
        return 'bg-blue-500/10 text-blue-400';
      default:
        return 'bg-amber-500/10 text-amber-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Student Status Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Student Status</div>
            <div className="text-lg font-semibold text-white mt-1">{studentName}</div>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusColor(statusData?.student_status)}`}>
            {statusData?.status || 'Unknown'}
          </span>
        </div>

        <div className="space-y-2 text-sm text-slate-300">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-slate-800/60 p-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Bus</div>
              <div className="mt-1 font-semibold text-white text-sm">{statusData?.bus_number || 'N/A'}</div>
            </div>

            <div className="rounded-lg bg-slate-800/60 p-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Speed</div>
              <div className="mt-1 font-semibold text-white text-sm">{statusData?.vehicle_speed || 0} km/h</div>
            </div>
          </div>

          <div className="rounded-lg bg-slate-800/60 p-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">GPS Signal</div>
            <div className="mt-1 font-semibold text-white text-sm">
              {statusData?.has_gps ? '🟢 Active' : '🔴 Unavailable'}
            </div>
          </div>
        </div>
      </div>

      {/* Trip Details */}
      {tripData && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Trip Details</div>

          <div className="space-y-2 text-sm text-slate-300">
            {tripData.boarding_stop && (
              <div className="rounded-lg bg-slate-800/60 p-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Boarding Stop</div>
                <div className="mt-1 font-semibold text-white">
                  {tripData.boarding_stop.name}
                  {tripData.boarding_stop.time && (
                    <div className="text-xs text-slate-400 mt-1">
                      {new Date(tripData.boarding_stop.time).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tripData.dropoff_stop && (
              <div className="rounded-lg bg-slate-800/60 p-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Drop-off Stop</div>
                <div className="mt-1 font-semibold text-white">
                  {tripData.dropoff_stop.name}
                  {tripData.dropoff_stop.time && (
                    <div className="text-xs text-slate-400 mt-1">
                      {new Date(tripData.dropoff_stop.time).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tripData.stops && tripData.stops.length > 0 && (
              <div className="rounded-lg bg-slate-800/60 p-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Route Stops</div>
                <div className="space-y-1">
                  {tripData.stops.slice(0, 3).map((stop: any) => (
                    <div key={stop.id} className="text-xs text-slate-400 flex items-center gap-2">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                        stop.status === 'arrived' ? 'bg-emerald-500' :
                        stop.status === 'departed' ? 'bg-blue-500' :
                        'bg-slate-500'
                      }`}></span>
                      {stop.name}
                    </div>
                  ))}
                  {tripData.stops.length > 3 && (
                    <div className="text-xs text-slate-500">+{tripData.stops.length - 3} more stops</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
