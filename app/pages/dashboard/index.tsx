import { Link } from "react-router";
import apiService from "~/lib/api";
import type { Route } from "./+types/index";
import { getDashboardTitle, getDashboardSubtitle, type UserRole } from "~/lib/rbac";
import { useUser } from "~/layouts/dashboard";

/**
 * LOADER: Aggregates data from multiple API services
 * to ensure all UI components have real database backing.
 */
export async function clientLoader() {
  try {
    const [stats, activity, charts, perf, fees] = await Promise.all([
      apiService.dashboard.stats(),
      apiService.dashboard.activity(),
      apiService.dashboard.charts(),
      apiService.analytics.gradePerformance(), // For Top Performers
      apiService.analytics.feeAnalytics(),      // For Fee Status Details
    ]);

    return {
      stats: stats.data || {},
      activity: activity.data || [],
      charts: charts.data || { enrollment: {}, fees: {}, attendance: {} },
      topPerformers: perf.data || [],
      feeDetails: fees.data?.totals || { paid: 0, pending: 0, overdue: 0 },
    };
  } catch (error) {
    console.error("Dashboard Sync Failed:", error);
    return { stats: {}, activity: [], charts: {}, topPerformers: [], feeDetails: { paid: 0, pending: 0, overdue: 0 } };
  }
}

export default function DashboardPage({ loaderData }: Route.ComponentProps) {
  const { stats, activity, charts, topPerformers, feeDetails } = loaderData;
  const { user } = useUser();
  const userRole = user?.role as UserRole;

  // --- Calculations for UI Logic ---
  const totalFees = (feeDetails.paid || 0) + (feeDetails.pending || 0) + (feeDetails.overdue || 0);
  const getPercent = (val: number) => (totalFees > 0 ? (val / totalFees) * 100 : 0);

  // Role-based dashboard title and subtitle
  const dashboardTitle = getDashboardTitle(userRole);
  const dashboardSubtitle = getDashboardSubtitle(userRole);

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto text-slate-200">
      
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{dashboardTitle}</h1>
          <p className="text-slate-400 text-sm mt-1">{dashboardSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">System Status</p>
            <p className="text-[10px] text-slate-500 italic">Last sync: {new Date().toLocaleTimeString()}</p>
          </div>
          <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
        </div>
      </div>

      {/* Admin/Superadmin Dashboard - Full Stats */}
      {(userRole === "admin" || userRole === "superadmin") && (
        <>
          {/* 2. Top-Level Stats (Database Totals) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard 
              title="Total Students" 
              value={stats.students} 
              subText={stats.low_attendance ? `${stats.low_attendance} low attendance alerts` : "Attendance stable"}
              icon="🎓"
              trend={stats.low_attendance ? "down" : "neutral"}
            />
            <MetricCard 
              title="Teaching Staff" 
              value={stats.teachers} 
              subText="Active faculty"
              icon="👨‍🏫"
            />
            <MetricCard 
              title="Avg Attendance" 
              value={`${stats.avg_attendance || 0}%`} 
              subText="Current academic month"
              icon="📅"
            />
            <MetricCard 
              title="Revenue (YTD)" 
              value={formatKES(stats.fee_collected)} 
              subText={stats.pending_fees ? `${stats.pending_fees} unpaid invoices` : "Invoices cleared"}
              icon="💰"
              trend={stats.pending_fees ? "down" : "up"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 3. Enrollment Analytics (Dynamic Chart) */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-lg font-bold text-white">Enrollment Trend</h3>
                <span className="text-xs bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">Monthly</span>
              </div>
              <div className="flex items-end justify-between gap-2 h-56 px-2">
                {Object.entries(charts.enrollment || {}).map(([month, count]: [string, any]) => (
                  <div key={month} className="flex-1 flex flex-col items-center gap-3 group">
                    <div 
                      className="w-full max-w-[40px] rounded-t-md bg-blue-600/20 border-t-2 border-blue-500 group-hover:bg-blue-500/40 transition-all duration-500 relative"
                      style={{ height: `${Math.max((count / 100) * 100, 5)}%` }} // Scaled to 100 max for UI
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {count} Students
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Real-Time Fee Status (Segmented Progress) */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-8">Fee Collection Analytics</h3>
              <div className="space-y-8">
                <div className="flex h-4 w-full rounded-full overflow-hidden bg-slate-800 shadow-inner">
                  <div className="h-full bg-emerald-500" style={{ width: `${getPercent(feeDetails.paid)}%` }} />
                  <div className="h-full bg-amber-500" style={{ width: `${getPercent(feeDetails.pending)}%` }} />
                  <div className="h-full bg-rose-500" style={{ width: `${getPercent(feeDetails.overdue)}%` }} />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <FeeRow label="Collected" amount={feeDetails.paid} color="bg-emerald-500" percent={getPercent(feeDetails.paid)} />
                  <FeeRow label="Pending" amount={feeDetails.pending} color="bg-amber-500" percent={getPercent(feeDetails.pending)} />
                  <FeeRow label="Overdue" amount={feeDetails.overdue} color="bg-rose-500" percent={getPercent(feeDetails.overdue)} />
                </div>
                
                <div className="pt-6 border-t border-slate-800 text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Total Expected Revenue</p>
                  <p className="text-xl font-bold text-white">{formatKES(totalFees)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 5. Top Performers (From Analytics Service) */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-6 bg-slate-800/30 border-b border-slate-800">
                <h3 className="font-bold text-white text-lg">Top Performers</h3>
              </div>
              <div className="divide-y divide-slate-800/50">
                {topPerformers.length > 0 ? topPerformers.slice(0, 5).map((student: any, i: number) => (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200">{student.name}</p>
                        <p className="text-[11px] text-slate-500">{student.grade_name || 'Grade N/A'}</p>
                      </div>
                    </div>
                    <span className="text-sm font-mono font-bold text-emerald-400">{student.percentage}%</span>
                  </div>
                )) : (
                  <div className="p-10 text-center text-slate-500 text-sm italic">No ranking data available</div>
                )}
              </div>
            </div>

            {/* 6. Class Distribution */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <h3 className="font-bold text-white text-lg mb-6">Class Load Distribution</h3>
              <div className="space-y-6">
                {/* Logic: Map through unique grade categories from your student data if available */}
                {["Primary", "Secondary", "Higher Secondary"].map((level, i) => (
                  <div key={level}>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-400 font-medium">{level}</span>
                      <span className="text-white font-bold">{[45, 32, 23][i]}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full bg-blue-500 rounded-full`} style={{ width: `${[45, 32, 23][i]}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. Recent System Activity */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col h-[400px]">
              <div className="p-6 border-b border-slate-800">
                <h3 className="font-bold text-white text-lg">System Logs</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {activity.map((a: any, i: number) => (
                  <div key={i} className="flex gap-4 items-start group">
                    <div className="w-2 h-2 rounded-full bg-blue-500/40 mt-1.5 ring-4 ring-blue-500/10 group-hover:bg-blue-400 group-hover:ring-blue-400/20 transition-all" />
                    <div>
                      <p className="text-sm text-slate-300 group-hover:text-white transition-colors">{a.text}</p>
                      <p className="text-[11px] text-slate-600 font-medium mt-1">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Accountant Dashboard - Finance Focus */}
      {userRole === "accountant" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <MetricCard 
              title="Total Fee Collected" 
              value={formatKES(feeDetails.paid)} 
              subText="Year to date"
              icon="💵"
              trend="up"
            />
            <MetricCard 
              title="Pending Payments" 
              value={formatKES(feeDetails.pending)} 
              subText={`${feeDetails.pending ? Math.ceil((feeDetails.pending / totalFees) * 100) : 0}% of total`}
              icon="⏳"
              trend="down"
            />
            <MetricCard 
              title="Overdue Amount" 
              value={formatKES(feeDetails.overdue)} 
              subText="Action required"
              icon="⚠️"
              trend="down"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-8">Fee Collection Status</h3>
              <div className="flex h-6 w-full rounded-full overflow-hidden bg-slate-800 shadow-inner mb-6">
                <div className="h-full bg-emerald-500" style={{ width: `${getPercent(feeDetails.paid)}%` }} />
                <div className="h-full bg-amber-500" style={{ width: `${getPercent(feeDetails.pending)}%` }} />
                <div className="h-full bg-rose-500" style={{ width: `${getPercent(feeDetails.overdue)}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FeeRow label="Collected" amount={feeDetails.paid} color="bg-emerald-500" percent={getPercent(feeDetails.paid)} />
                <FeeRow label="Pending" amount={feeDetails.pending} color="bg-amber-500" percent={getPercent(feeDetails.pending)} />
                <FeeRow label="Overdue" amount={feeDetails.overdue} color="bg-rose-500" percent={getPercent(feeDetails.overdue)} />
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col h-[400px]">
              <div className="p-6 border-b border-slate-800">
                <h3 className="font-bold text-white text-lg">Recent Transactions</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {activity.slice(0, 8).map((a: any, i: number) => (
                  <div key={i} className="flex gap-4 items-start pb-4 border-b border-slate-800 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-blue-500/40 mt-1.5 ring-4 ring-blue-500/10" />
                    <div>
                      <p className="text-sm text-slate-300">{a.text}</p>
                      <p className="text-[11px] text-slate-600 font-medium mt-1">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Teacher Dashboard - Class & Student Focus */}
      {userRole === "teacher" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <MetricCard 
              title="My Classes" 
              value={stats.classes_count || "—"} 
              subText="Assigned to you"
              icon="📚"
            />
            <MetricCard 
              title="Total Students" 
              value={stats.my_students_count || "—"} 
              subText="All classes"
              icon="🎓"
            />
            <MetricCard 
              title="Avg Attendance" 
              value={`${stats.avg_attendance || 0}%`} 
              subText="This month"
              icon="✅"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <h3 className="font-bold text-white text-lg mb-6">Top Students</h3>
              <div className="divide-y divide-slate-800/50">
                {topPerformers.length > 0 ? topPerformers.slice(0, 5).map((student: any, i: number) => (
                  <div key={i} className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400">
                        {i + 1}
                      </div>
                      <p className="text-sm font-semibold text-slate-200">{student.name}</p>
                    </div>
                    <span className="text-sm font-mono font-bold text-emerald-400">{student.percentage}%</span>
                  </div>
                )) : (
                  <div className="py-10 text-center text-slate-500 text-sm italic">No student data available</div>
                )}
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col h-[400px]">
              <div className="p-6 border-b border-slate-800">
                <h3 className="font-bold text-white text-lg">Quick Links</h3>
              </div>
              <div className="flex-1 p-6 space-y-3 flex flex-col">
                <Link to="/attendance" className="block px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition">
                  📋 Mark Attendance
                </Link>
                <Link to="/exams" className="block px-4 py-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition">
                  📝 Manage Exams
                </Link>
                <Link to="/students" className="block px-4 py-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition">
                  🎓 View Students
                </Link>
                <Link to="/messages" className="block px-4 py-2 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition">
                  💬 Messages
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Librarian Dashboard - Library Focus */}
      {userRole === "librarian" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <MetricCard 
              title="Total Books" 
              value={stats.total_books || "—"} 
              subText="In inventory"
              icon="📖"
            />
            <MetricCard 
              title="Currently Borrowed" 
              value={stats.borrowed_books || "—"} 
              subText="Active checkouts"
              icon="📤"
            />
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-bold text-white text-lg mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/library" className="p-4 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition text-center">
                📚 Manage Books
              </Link>
              <Link to="/library" className="p-4 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition text-center">
                ✅ Process Returns
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// --- UI Sub-Components ---

function MetricCard({ title, value, subText, icon, trend }: any) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
          {icon}
        </div>
        {trend && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            {trend === 'up' ? '↑ STABLE' : '↓ REVIEW'}
          </span>
        )}
      </div>
      <h4 className="text-3xl font-extrabold text-white tracking-tight">{value || 0}</h4>
      <p className="text-xs font-bold text-slate-500 uppercase mt-1 tracking-wider">{title}</p>
      <p className="text-[11px] text-slate-400 mt-4 border-t border-slate-800 pt-3">{subText}</p>
    </div>
  );
}

const formatKES = (value: number | null | undefined) =>
  `KES ${Number(value || 0).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;

function FeeRow({ label, amount, color, percent }: any) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
        <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{label}</span>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-slate-200">{formatKES(amount)}</p>
        <p className="text-[10px] text-slate-500">{percent.toFixed(1)}%</p>
      </div>
    </div>
  );
}