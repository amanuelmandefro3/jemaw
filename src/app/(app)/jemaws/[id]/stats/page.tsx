import Link from "next/link";
import { notFound } from "next/navigation";
import { getJemawById, getJemawStats } from "@/actions/jemaws";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="p-6 max-w-4xl mx-auto">
      <Link
        href={`/jemaws/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to {jemaw.name}
      </Link>
      <h1 className="text-xl font-bold mb-6">Spending stats — {jemaw.name}</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total spent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalSpent, jemaw.currency)}</p>
            <p className="text-xs text-muted-foreground mt-1">Approved bills only</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Your share</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.myShare, jemaw.currency)}</p>
            <p className="text-xs text-muted-foreground mt-1">Your portion of all bills</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Your balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${stats.myBalance > 0 ? "text-green-600" : stats.myBalance < 0 ? "text-red-600" : ""}`}>
              {stats.myBalance === 0 ? "Settled" : formatCurrency(Math.abs(stats.myBalance), jemaw.currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.myBalance > 0 ? "You are owed" : stats.myBalance < 0 ? "You owe" : "All square"}
            </p>
          </CardContent>
        </Card>
      </div>

      {stats.totalSpent === 0 ? (
        <p className="text-center text-muted-foreground py-12 text-sm">
          No approved bills yet. Charts will appear once bills are approved.
        </p>
      ) : (
        <StatsCharts
          byCategory={stats.byCategory}
          memberBalances={stats.memberBalances}
          currency={jemaw.currency}
        />
      )}
    </div>
  );
}
