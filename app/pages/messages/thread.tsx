import { Link, useParams } from "react-router";

export default function MessageThreadPage() {
  const { id } = useParams();

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/messages" className="text-slate-400 hover:text-white text-sm transition">← Back to Messages</Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-300">Thread #{id}</span>
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-6 shadow-lg shadow-slate-900/20">
        <h1 className="text-lg sm:text-xl font-semibold mb-3 text-white">Message Thread</h1>
        <p className="text-slate-400 text-sm mb-4">This is a placeholder conversation view for thread <span className="font-mono text-blue-300">{id}</span>.</p>
        <div className="space-y-3">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 text-slate-200 text-sm">Hello! This is the beginning of the conversation.</div>
          <div className="bg-blue-500/15 border border-blue-500/25 rounded-2xl p-4 text-slate-100 text-sm">Reply from admin goes here.</div>
        </div>
      </div>
    </div>
  );
}