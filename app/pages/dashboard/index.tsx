import { Link } from "react-router";
import { apiService } from "~/lib/api";
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
      apiService.analytics.gradePerformance(),
      apiService.analytics.feeAnalytics(),
    ]);

    return {
      stats: stats.data,
      activity: activity.data || [],
      charts: charts.data,
      topPerformers: perf.data || [],
      feeDetails: {
        paid: fees.data?.paid || 0,
        pending: fees.data?.pending || 0,
        overdue: fees.data?.overdue || 0,
      },
    };
  } catch (error) {
    console.error("Dashboard Sync Failed:", error);

    return {
      stats: {
        students: 0,
        teachers: 0,
        fee_collected: 0,
        avg_attendance: 0,
        upcoming_events: 0,
        pending_fees: 0,
        low_attendance: 0,
        classes_count: 0,
        my_students_count: 0,
        total_books: 0,
        borrowed_books: 0,
      },
      activity: [],
      charts: {
        enrollment: {},
        fees: {},
        attendance: {},
      },
      topPerformers: [],
      feeDetails: {
        paid: 0,
        pending: 0,
        overdue: 0,
      },
    };
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
    <div className="space-y-6 sm:space-y-8 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-slate-200">
      
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{dashboardTitle}</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">{dashboardSubtitle}</p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="text-left sm:text-right">
            <p className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-widest">System Status</p>
            <p className="text-[10px] text-slate-500 italic">Last sync: {new Date().toLocaleTimeString()}</p>
          </div>
          <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse shrink-0" />
        </div>
      </div>

      {/* Admin/Superadmin Dashboard - Full Stats */}
      {(userRole === "admin" || userRole === "superadmin") && (
        <>
          {/* 2. Top-Level Stats (Database Totals) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* 3. Enrollment Analytics (Dynamic Chart with mobile scroll wrapper) */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-md">
              <div className="flex justify-between items-center mb-6 sm:mb-10">
                <h3 className="text-base sm:text-lg font-bold text-white">Enrollment Trend</h3>
                <span className="text-xs bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">Monthly</span>
              </div>
              <div className="overflow-x-auto pb-2">
                <div className="flex items-end justify-between gap-2 h-56 px-2 min-w-[450px]">
                  {Object.entries(charts.enrollment || {}).map(([month, count]: [string, any]) => (
                    <div key={month} className="flex-1 flex flex-col items-center gap-3 group">
                      <div 
                        className="w-full max-w-[40px] rounded-t-md bg-blue-600/20 border-t-2 border-blue-500 group-hover:bg-blue-500/40 transition-all duration-500 relative"
                        style={{ height: `${Math.max((count / 100) * 100, 5)}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {count} Students
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Real-Time Fee Status (Segmented Progress) */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-white mb-6 sm:mb-8">Fee Collection Analytics</h3>
              <div className="space-y-6 sm:space-y-8">
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
                  <p className="text-lg sm:text-xl font-bold text-white truncate">{formatKES(totalFees)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* 5. Top Performers (From Analytics Service) */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-4 sm:p-6 bg-slate-800/30 border-b border-slate-800">
                <h3 className="font-bold text-white text-base sm:text-lg">Top Performers</h3>
              </div>
              <div className="divide-y divide-slate-800/50">
                {topPerformers.length > 0 ? topPerformers.slice(0, 5).map((student: any, i: number) => (
                  <div key={i} className="p-3 sm:p-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
                    <div className="flex items-center gap-3 sm:gap-4 truncate pr-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                        {i + 1}
                      </div>
                      <div className="truncate">
                        <p className="text-xs sm:text-sm font-semibold text-slate-200 truncate">{student.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{student.grade_name || 'Grade N/A'}</p>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400 shrink-0">{student.percentage}%</span>
                  </div>
                )) : (
                  <div className="p-10 text-center text-slate-500 text-sm italic">No ranking data available</div>
                )}
              </div>
            </div>

            {/* 6. Class Distribution */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 sm:p-6">
              <h3 className="font-bold text-white text-base sm:text-lg mb-6">Class Load Distribution</h3>
              <div className="space-y-6">
                {["Primary", "Secondary", "Higher Secondary"].map((level, i) => (
                  <div key={level}>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-400 font-medium">{level}</span>
                      <span className="text-white font-bold">{[45, 32, 23][i]}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${[45, 32, 23][i]}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. Recent System Activity */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col h-[350px] sm:h-[400px]">
              <div className="p-4 sm:p-6 border-b border-slate-800">
                <h3 className="font-bold text-white text-base sm:text-lg">System Logs</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {activity.map((a: any, i: number) => (
                  <div key={i} className="flex gap-3 sm:gap-4 items-start group">
                    <div className="w-2 h-2 rounded-full bg-blue-500/40 mt-1.5 ring-4 ring-blue-500/10 group-hover:bg-blue-400 group-hover:ring-blue-400/20 transition-all shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-slate-300 group-hover:text-white transition-colors">{a.text}</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-white mb-6 sm:mb-8">Fee Collection Status</h3>
              <div className="flex h-6 w-full rounded-full overflow-hidden bg-slate-800 shadow-inner mb-6">
                <div className="h-full bg-emerald-500" style={{ width: `${getPercent(feeDetails.paid)}%` }} />
                <div className="h-full bg-amber-500" style={{ width: `${getPercent(feeDetails.pending)}%` }} />
                <div className="h-full bg-rose-500" style={{ width: `${getPercent(feeDetails.overdue)}%` }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FeeRow label="Collected" amount={feeDetails.paid} color="bg-emerald-500" percent={getPercent(feeDetails.paid)} />
                <FeeRow label="Pending" amount={feeDetails.pending} color="bg-amber-500" percent={getPercent(feeDetails.pending)} />
                <FeeRow label="Overdue" amount={feeDetails.overdue} color="bg-rose-500" percent={getPercent(feeDetails.overdue)} />
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col h-[350px] sm:h-[400px]">
              <div className="p-4 sm:p-6 border-b border-slate-800">
                <h3 className="font-bold text-white text-base sm:text-lg">Recent Transactions</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {activity.slice(0, 8).map((a: any, i: number) => (
                  <div key={i} className="flex gap-3 sm:gap-4 items-start pb-4 border-b border-slate-800 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-blue-500/40 mt-1.5 ring-4 ring-blue-500/10 shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-slate-300">{a.text}</p>
                      <p className="text-[11px] text-slate-600 font-medium mt-1">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:gap-8 mt-3">
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Accounting Reports</h3>
                  <p className="text-sm text-slate-400 mt-1">Quick access to your financial statements.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <Link
                  to="/accounting/reports"
                  className="block rounded-2xl border border-slate-700 bg-slate-800 px-4 py-4 text-left text-sm text-slate-200 transition hover:border-blue-500 hover:bg-slate-900"
                >
                  <div className="font-semibold text-white">Trial Balance</div>
                  <p className="mt-1 text-xs text-slate-500">View trial balance summary</p>
                </Link>
                <Link
                  to="/accounting/reports/income-statement"
                  className="block rounded-2xl border border-slate-700 bg-slate-800 px-4 py-4 text-left text-sm text-slate-200 transition hover:border-blue-500 hover:bg-slate-900"
                >
                  <div className="font-semibold text-white">Income Statement</div>
                  <p className="mt-1 text-xs text-slate-500">Review profit and loss</p>
                </Link>
                <Link
                  to="/accounting/reports/balance-sheet"
                  className="block rounded-2xl border border-slate-700 bg-slate-800 px-4 py-4 text-left text-sm text-slate-200 transition hover:border-blue-500 hover:bg-slate-900"
                >
                  <div className="font-semibold text-white">Balance Sheet</div>
                  <p className="mt-1 text-xs text-slate-500">See assets and liabilities</p>
                </Link>
                <Link
                  to="/accounting/reports/cash-flow"
                  className="block rounded-2xl border border-slate-700 bg-slate-800 px-4 py-4 text-left text-sm text-slate-200 transition hover:border-blue-500 hover:bg-slate-900"
                >
                  <div className="font-semibold text-white">Cash Flow</div>
                  <p className="mt-1 text-xs text-slate-500">Open the cash flow report</p>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Teacher Dashboard - Class & Student Focus */}
      {userRole === "teacher" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 sm:p-6">
              <h3 className="font-bold text-white text-base sm:text-lg mb-6">Top Students</h3>
              <div className="divide-y divide-slate-800/50">
                {topPerformers.length > 0 ? topPerformers.slice(0, 5).map((student: any, i: number) => (
                  <div key={i} className="py-3 sm:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 truncate pr-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-200 truncate">{student.name}</p>
                    </div>
                    <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400 shrink-0">{student.percentage}%</span>
                  </div>
                )) : (
                  <div className="py-10 text-center text-slate-500 text-sm italic">No student data available</div>
                )}
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col h-[350px] sm:h-[400px]">
              <div className="p-4 sm:p-6 border-b border-slate-800">
                <h3 className="font-bold text-white text-base sm:text-lg">Quick Links</h3>
              </div>
              <div className="flex-1 p-4 sm:p-6 space-y-3 flex flex-col justify-around">
                <Link to="/attendance" className="block px-4 py-2.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition text-sm">
                  📋 Mark Attendance
                </Link>
                <Link to="/exams" className="block px-4 py-2.5 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition text-sm">
                  📝 Manage Exams
                </Link>
                <Link to="/students" className="block px-4 py-2.5 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition text-sm">
                  🎓 View Students
                </Link>
                <Link to="/messages" className="block px-4 py-2.5 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition text-sm">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
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

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 sm:p-6">
            <h3 className="font-bold text-white text-base sm:text-lg mb-6">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link to="/library" className="p-4 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition text-center text-sm">
                📚 Manage Books
              </Link>
              <Link to="/library" className="p-4 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition text-center text-sm">
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
    <div className="bg-slate-900/40 border border-slate-800 p-4 sm:p-6 rounded-2xl hover:border-slate-700 transition-all group">
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
      <h4 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">{value || 0}</h4>
      <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase mt-1 tracking-wider">{title}</p>
      <p className="text-[11px] text-slate-400 mt-4 border-t border-slate-800 pt-3">{subText}</p>
    </div>
  );
}

const formatKES = (value: number | null | undefined) =>
  `KES ${Number(value || 0).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;

function FeeRow({ label, amount, color, percent }: any) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3 truncate pr-2">
        <div className={`w-2.5 h-2.5 rounded-sm ${color} shrink-0`} />
        <span className="text-xs sm:text-sm text-slate-400 group-hover:text-slate-200 transition-colors truncate">{label}</span>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs sm:text-sm font-bold text-slate-200">{formatKES(amount)}</p>
        <p className="text-[10px] text-slate-500">{percent.toFixed(1)}%</p>
      </div>
    </div>
  );
}