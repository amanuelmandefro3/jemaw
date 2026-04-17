import Link from "next/link";
import { notFound } from "next/navigation";
import { getJemawById, getJemawStats } from "@/actions/jemaws";
import { ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { StatsCharts } from "./stats-charts";

export default async function StatsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let jemaw;
  let stats;
  try {
    [jemaw, stats] = await Promise.all([getJemawById(id), getJemawStats(id)]);
  } catch {
    notFound();
  }

  return (
    <div>
      <Link
        href={`/jemaws/${id}`}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to {jemaw.name}
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Spending Stats</h1>
        <p className="text-sm text-slate-500 mt-0.5">{jemaw.name}</p>
      </div>

      {/* Summary stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs text-slate-500 mb-2">Total spent</p>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalSpent, jemaw.currency)}</p>
          <p className="text-xs text-slate-400 mt-1">Approved bills only</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs text-slate-500 mb-2">Your share</p>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.myShare, jemaw.currency)}</p>
          <p className="text-xs text-slate-400 mt-1">Your portion of all bills</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs text-slate-500 mb-2">Your balance</p>
          <p className={`text-2xl font-bold ${stats.myBalance > 0 ? "text-emerald-600" : stats.myBalance < 0 ? "text-rose-600" : "text-slate-900"}`}>
            {stats.myBalance === 0 ? "Settled" : formatCurrency(Math.abs(stats.myBalance), jemaw.currency)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {stats.myBalance > 0 ? "You are owed" : stats.myBalance < 0 ? "You owe" : "All square"}
          </p>
        </div>
      </div>

      {stats.totalSpent === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-14 text-center">
          <p className="text-sm text-slate-400">No approved bills yet. Charts will appear once bills are approved.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <StatsCharts byCategory={stats.byCategory} memberBalances={stats.memberBalances} currency={jemaw.currency} />
        </div>
      )}
    </div>
  );
}
