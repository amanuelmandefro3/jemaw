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

  const hasData = stats.totalSpent > 0;

  return (
    <div>
      <Link
        href={`/jemaws/${id}`}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 mb-10 transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        {jemaw.name}
      </Link>

      {/* Narrative header */}
      <div className="mb-12">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-5">
          Group overview
        </p>

        {hasData ? (
          <>
            <h1 className="text-4xl font-bold text-slate-900 leading-snug mb-3">
              Your group has spent{" "}
              <span className="text-indigo-600">
                {formatCurrency(stats.totalSpent, jemaw.currency)}
              </span>{" "}
              together.
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              {stats.myBalance === 0
                ? "You're all settled up — nothing left to pay."
                : stats.myBalance > 0
                ? `You're owed ${formatCurrency(stats.myBalance, jemaw.currency)} across these expenses.`
                : `You owe ${formatCurrency(Math.abs(stats.myBalance), jemaw.currency)} in total.`}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold text-slate-900 leading-snug mb-3">
              Nothing to show yet.
            </h1>
            <p className="text-slate-400 text-base">
              Stats will appear once bills are approved in this group.
            </p>
          </>
        )}
      </div>

      {/* Personal row — inline, no boxes */}
      {hasData && (
        <div className="flex items-start gap-10 pb-10 mb-10 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-400 mb-1">Your share</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(stats.myShare, jemaw.currency)}
            </p>
          </div>
          <div className="w-px self-stretch bg-slate-100" />
          <div>
            <p className="text-xs text-slate-400 mb-1">Net balance</p>
            <p className={`text-2xl font-bold ${
              stats.myBalance > 0 ? "text-emerald-600"
              : stats.myBalance < 0 ? "text-rose-500"
              : "text-slate-300"
            }`}>
              {stats.myBalance === 0
                ? "Settled"
                : `${stats.myBalance > 0 ? "+" : "−"}${formatCurrency(Math.abs(stats.myBalance), jemaw.currency)}`}
            </p>
          </div>
        </div>
      )}

      {hasData && (
        <StatsCharts
          byCategory={stats.byCategory}
          memberBalances={stats.memberBalances}
          totalSpent={stats.totalSpent}
          currency={jemaw.currency}
        />
      )}
    </div>
  );
}
