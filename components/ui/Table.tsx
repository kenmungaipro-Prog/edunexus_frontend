// ============================================================
// app/components/ui/Table.tsx
// ============================================================
import type { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function Table<T extends Record<string, unknown>>({ columns, data, onRowClick, isLoading, emptyMessage = "No records found." }: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500">
        <div className="text-center">
          <div className="text-2xl mb-2 animate-spin">⟳</div>
          <div className="text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            {columns.map(col => (
              <th key={col.key} className={`text-left py-2.5 px-3 text-xs text-slate-500 uppercase font-semibold tracking-wide ${col.className ?? ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-12 text-slate-500">{emptyMessage}</td>
            </tr>
          ) : data.map((item, i) => (
            <tr
              key={i}
              className={`border-b border-slate-700/50 ${onRowClick ? "hover:bg-slate-700/30 cursor-pointer" : "hover:bg-slate-800/50"} transition-colors`}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map(col => (
                <td key={col.key} className={`py-3 px-3 text-slate-300 ${col.className ?? ""}`}>
                  {col.render ? col.render(item) : String(item[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
