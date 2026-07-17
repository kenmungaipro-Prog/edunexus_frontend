// ============================================================
// app/pages/settings/index.tsx
// ============================================================
import { Form } from "react-router";
import { api } from "~/lib/api";

export async function clientLoader() {
  const response = await api.get("/settings/school");
  
  // response.data is the Laravel JSON body: { success: true, data: { ... } }
  // response.data.data is the actual School object model
  return { school: response.data.data };
}

export async function clientAction({ request }: { request: Request }) {
  const form = await request.formData();
  await api.put("/settings/school", Object.fromEntries(form.entries()));
  return { success: true };
}

export default function SettingsPage({ loaderData, actionData }: {
  loaderData: { school: Record<string, string> };
  actionData?: { success?: boolean };
}) {
  const { school } = loaderData;

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">⚙️ Settings</h1>
      {actionData?.success && (
        <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm rounded-lg p-3 mb-4">Settings saved successfully.</div>
      )}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-4">🏫 School Information</h2>
          <Form method="post" className="space-y-4">
            {[
              { name: "name",        label: "School Name",   placeholder: "Greenwood International" },
              { name: "principal",   label: "Principal",     placeholder: "Dr. Ananya Krishnan"     },
              { name: "email",       label: "Contact Email", placeholder: "admin@school.edu.in"     },
              { name: "phone",       label: "Phone",         placeholder: "+91 80 2345 6789"        },
              { name: "address",     label: "Address",       placeholder: "123, Main St, City"      },
              { name: "board",       label: "Board",         placeholder: "CBSE"                   },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">{f.label}</label>
                <input name={f.name} defaultValue={school?.[f.name]} placeholder={f.placeholder}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500" />
              </div>
            ))}
            <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition mt-2">
              💾 Save Changes
            </button>
          </Form>
        </div>
        <div className="space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4">🎨 Preferences</h2>
            <div className="space-y-3">
              {[
                { label: "Dark Mode", sub: "Current theme", enabled: true },
                { label: "Email Notifications", sub: "Alerts and reports", enabled: true },
                { label: "SMS Alerts", sub: "For fee dues and low attendance", enabled: false },
                { label: "Two-Factor Auth", sub: "Extra login security", enabled: false },
              ].map(pref => (
                <div key={pref.label} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div>
                    <p className="text-sm font-medium">{pref.label}</p>
                    <p className="text-xs text-slate-500">{pref.sub}</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${pref.enabled ? "bg-blue-500" : "bg-slate-600"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${pref.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4">🔐 Security</h2>
            <div className="space-y-2">
              <button className="w-full text-left p-3 bg-slate-900/50 rounded-lg border border-slate-700 text-sm hover:border-blue-500 transition">
                🔑 Change Password
              </button>
              <button className="w-full text-left p-3 bg-slate-900/50 rounded-lg border border-slate-700 text-sm hover:border-blue-500 transition">
                📋 View Login History
              </button>
              <button className="w-full text-left p-3 bg-red-500/5 rounded-lg border border-red-500/20 text-sm text-red-400 hover:border-red-500/40 transition">
                🚪 Logout All Devices
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}