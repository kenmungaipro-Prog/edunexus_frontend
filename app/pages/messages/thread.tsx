import { Link, useParams } from "react-router";

export default function MessageThreadPage() {
  const { id } = useParams();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/messages" className="text-slate-400 hover:text-white text-sm transition">← Back to Messages</Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm">Thread #{id}</span>
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h1 className="text-lg font-semibold mb-3">Message Thread</h1>
        <p className="text-slate-400 text-sm mb-4">This is a placeholder conversation view for thread <span className="font-mono text-blue-300">{id}</span>.</p>
        <div className="space-y-3">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 text-slate-200">Hello! This is the beginning of the conversation.</div>
          <div className="bg-blue-500/15 border border-blue-500/25 rounded-2xl p-4 text-slate-100">Reply from admin goes here.</div>
        </div>
      </div>
    </div>
  );
}
