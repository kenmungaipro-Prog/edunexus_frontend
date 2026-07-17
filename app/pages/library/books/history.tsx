import { Link, useParams } from "react-router";

export default function IssueHistoryPage() {
  const params = useParams();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Issue History</h1>
          <p className="text-slate-400 mt-1">Past borrowing records for this book.</p>
        </div>
        <Link 
          to={`/library/books/${params.id}`}
          className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 transition"
        >
          &larr; Back to Book
        </Link>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <p className="text-slate-400">Historical records will be loaded here...</p>
      </div>
    </div>
  );
}