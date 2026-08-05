import { NavLink } from "react-router";
import React from "react";

const navItems = [
  { to: "/transport", label: "Overview" },
  { to: "/transport/tracker", label: "Tracker" },
  { to: "/transport/live", label: "Live Map" },
  { to: "/transport/analytics", label: "Analytics" },
  { to: "/transport/playback", label: "Playback" },
  { to: "/transport/notifications", label: "Notifications" },
];

export default function TransportSubNav() {
  return (
    <div className="border-b border-slate-800/80 bg-[#0f1424] px-4 py-3 sm:px-7 mb-6">
      <div className="flex min-w-0 overflow-x-auto pb-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/transport"}
            className={({ isActive }) =>
              `inline-flex flex-shrink-0 items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-xs sm:text-sm font-semibold transition mr-2 whitespace-nowrap ${isActive ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
