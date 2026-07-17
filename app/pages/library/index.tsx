import { Link, useSearchParams, useNavigation } from "react-router";
import type { Route as LibRoute } from "./+types/index";
import api, { type Book, type PaginationMeta } from "~/lib/api";

interface LibraryStats {
  total_books: number;
  issued: number;
  returned_today: number;
}

interface LoaderData {
  books: Book[];
  meta: PaginationMeta | null;
  overdueCount: number;
  stats: LibraryStats;
  error?: string;
}

export async function clientLoader({ request }: LibRoute.LoaderArgs): Promise<LoaderData> {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const category = url.searchParams.get("cat") || "";

  try {
    const [booksRes, statsRes] = await Promise.all([
      api.library.list({ search, category, per_page: 20 }),
      // Use the new centralized analytics method
      api.analytics.library().catch(() => ({
        data: { total_books: 0, issued: 0, returned_today: 0, overdue: 0 }
      }))
    ]);

    return {
      books: booksRes.data.data || [],
      meta: booksRes.data.meta || null,
      stats: statsRes.data, // This now contains all your analytics
      overdueCount: statsRes.data.overdue
    };
  } catch (error) {
    console.error("Failed to load library data:", error);
    return {
      books: [],
      meta: null,
      overdueCount: 0,
      stats: { total_books: 0, issued: 0, returned_today: 0 },
      error: "Failed to load library data. Please try again later."
    };
  }
}

export default function LibraryPage({ loaderData }: LibRoute.ComponentProps) {
  const { books, overdueCount, stats, error } = loaderData as LoaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();

  const isSearching = navigation.state === "loading";

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  const analyticsItems = [
    { label: "Total Books", value: stats.total_books, icon: "📚", color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Issued Books", value: stats.issued, icon: "📤", color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Overdue", value: overdueCount, icon: "⚠️", color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Returned Today", value: stats.returned_today, icon: "📥", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">📖 Library Management</h1>
          <p className="text-slate-400 text-sm">Monitor book inventory and circulation</p>
        </div>
        <Link to="/library/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium flex items-center gap-2">
          <span>+</span> Add Book
        </Link>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {analyticsItems.map((item) => (
          <div key={item.label} className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg ${item.bg} flex items-center justify-center text-2xl`}>
              {item.icon}
            </div>
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{item.label}</p>
              <p className={`text-2xl font-bold ${item.color}`}>{item.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-700 flex gap-3">
          <input 
            type="text"
            placeholder="Search books..."
            className="bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setSearchParams(prev => {
              prev.set("search", e.target.value);
              return prev;
            })}
          />
        </div>

        <div className={`transition-opacity duration-200 ${isSearching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          {books.length === 0 ? (
             <div className="p-12 text-center text-slate-400">
               <p>No books found.</p>
             </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium">ID</th>
                  <th className="p-4 font-medium">Book Title</th>
                  <th className="p-4 font-medium">Author</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 text-center font-medium">Available</th>
                  <th className="p-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {books.map((book) => (
                  <tr key={book.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 font-mono text-blue-400 text-sm">{book.book_id}</td>
                    <td className="p-4 text-slate-200 font-medium">{book.title}</td>
                    <td className="p-4 text-slate-400">{book.author}</td>
                    <td className="p-4">
                      <span className="bg-slate-700/50 border border-slate-600 text-slate-300 px-2.5 py-1 rounded-md text-xs">
                        {book.category}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`font-bold ${book.available_copies > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {book.available_copies} / {book.total_copies}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link 
                        to={`/library/books/${book.id}`} 
                        className="text-blue-400 hover:text-blue-300 hover:underline text-sm font-medium transition-colors"
                      >
                        Manage &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}