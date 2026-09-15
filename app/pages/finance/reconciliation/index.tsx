import { useState } from "react";
import { api, type PaymentReconciliationItem, type Student } from "~/lib/api";

export async function clientLoader() {
	const [itemsResponse, studentsResponse] = await Promise.all([
		api.finance.reconciliation({ status: "unmatched", per_page: 100 }),
		api.students.list({ per_page: 100 }),
	]);

	return {
		items: itemsResponse.data.data,
		students: studentsResponse.data.data,
	};
}

export default function ReconciliationPage({ loaderData }: { loaderData: { items: PaymentReconciliationItem[]; students: Student[] } }) {
	const [items, setItems] = useState(loaderData.items);
	const [selectedStudents, setSelectedStudents] = useState<Record<number, number>>({});
	const [busyId, setBusyId] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);

	const resolve = async (item: PaymentReconciliationItem) => {
		const studentId = selectedStudents[item.id];
		if (!studentId) {
			setError("Select a student before resolving a payment.");
			return;
		}

		setBusyId(item.id);
		setError(null);
		try {
			await api.finance.resolveReconciliation(item.id, { student_id: studentId });
			setItems((current) => current.filter((entry) => entry.id !== item.id));
		} catch {
			setError("Unable to resolve this payment. Refresh and try again.");
		} finally {
			setBusyId(null);
		}
	};

	return (
		<div className="space-y-5">
			<div>
				<h1 className="text-xl sm:text-2xl font-bold text-white">Payment Reconciliation</h1>
				<p className="mt-1 text-sm text-slate-400">Match unmatched gateway payments to the correct student account.</p>
			</div>

			{error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}

			<div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-800">
				<table className="w-full min-w-[820px] text-sm">
					<thead>
						<tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-500">
							<th className="p-4">Receipt</th>
							<th className="p-4">Phone</th>
							<th className="p-4">Amount</th>
							<th className="p-4">Received</th>
							<th className="p-4">Student</th>
							<th className="p-4">Action</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-700/60">
						{items.map((item) => (
							<tr key={item.id} className="text-slate-300">
								<td className="p-4 font-mono text-xs text-blue-300">{item.mpesa_receipt_number ?? "-"}</td>
								<td className="p-4">{item.phone_number ?? "-"}</td>
								<td className="p-4 font-semibold text-white">KES {Number(item.amount).toLocaleString("en-KE")}</td>
								<td className="p-4 text-slate-400">{new Date(item.created_at).toLocaleString("en-KE")}</td>
								<td className="p-4">
									<select
										value={selectedStudents[item.id] ?? ""}
										onChange={(event) => setSelectedStudents((current) => ({ ...current, [item.id]: Number(event.target.value) }))}
										className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200"
									>
										<option value="">Select student</option>
										{loaderData.students.map((student) => <option key={student.id} value={student.id}>{student.full_name}</option>)}
									</select>
								</td>
								<td className="p-4">
									<button type="button" onClick={() => resolve(item)} disabled={busyId === item.id} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
										{busyId === item.id ? "Resolving..." : "Resolve"}
									</button>
								</td>
							</tr>
						))}
						{items.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No unmatched payments.</td></tr>}
					</tbody>
				</table>
			</div>
		</div>
	);
}
