import Link from "next/link";
import { getMyJemaws } from "@/actions/jemaws";
import { getPendingBillsForUser } from "@/actions/bills";
import { getPendingSettlementsForUser } from "@/actions/settlements";
import { getServerSession } from "@/lib/session";
import { JemawRow } from "./jemaw-card";
import { CreateJemawDialog } from "./create-jemaw-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Clock, ArrowRight, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const [session, jemaws, pendingBills, pendingSettlements] = await Promise.all([
    getServerSession(),
    getMyJemaws(),
    getPendingBillsForUser(),
    getPendingSettlementsForUser(),
  ]);

  const pendingCount = pendingBills.length + pendingSettlements.length;
  const firstName = session?.user.name.split(" ")[0] ?? "there";

  const byCurrency: Record<string, { owed: number; owe: number }> = {};
  for (const j of jemaws) {
    const bal = parseFloat(j.myBalance);
    if (!byCurrency[j.currency]) byCurrency[j.currency] = { owed: 0, owe: 0 };
    if (bal > 0) byCurrency[j.currency].owed += bal;
    else if (bal < 0) byCurrency[j.currency].owe += Math.abs(bal);
  }
  const currencies = Object.keys(byCurrency);
  const primaryCurrency = currencies[0] ?? "ETB";
  const isSingleCurrency = currencies.length <= 1;
  const totalOwedToMe = isSingleCurrency ? (byCurrency[primaryCurrency]?.owed ?? 0) : 0;
  const totalIOwe = isSingleCurrency ? (byCurrency[primaryCurrency]?.owe ?? 0) : 0;
  const netBalance = totalOwedToMe - totalIOwe;

  return (
    <div className="space-y-6">

      {/* Top: greeting + balance — no container, raw typography */}
      <div className="pb-6 border-b border-slate-100">
        <p className="text-sm text-slate-500 mb-3">
          Hello,{" "}
          <span className="text-slate-800 font-medium">{firstName}</span>
        </p>

        {isSingleCurrency ? (
          <>
            <div className="flex items-baseline gap-2.5 mb-4">
              <span className={`text-5xl font-bold tracking-tight ${
                netBalance > 0 ? "text-slate-900" : netBalance < 0 ? "text-rose-500" : "text-slate-300"
              }`}>
                {netBalance > 0
                  ? `+${formatCurrency(netBalance, primaryCurrency)}`
                  : netBalance < 0
                  ? `−${formatCurrency(Math.abs(netBalance), primaryCurrency)}`
                  : formatCurrency(0, primaryCurrency)}
              </span>
              <span className="text-slate-400 text-sm">net balance</span>
            </div>

            <div className="flex items-center gap-4 text-sm flex-wrap">
              {totalOwedToMe > 0 && (
                <span>
                  <span className="font-semibold text-emerald-600">+{formatCurrency(totalOwedToMe, primaryCurrency)}</span>
                  <span className="text-slate-400 ml-1">owed to you</span>
                </span>
              )}
              {totalOwedToMe > 0 && totalIOwe > 0 && (
                <span className="text-slate-200">·</span>
              )}
              {totalIOwe > 0 && (
                <span>
                  <span className="font-semibold text-rose-500">{formatCurrency(totalIOwe, primaryCurrency)}</span>
                  <span className="text-slate-400 ml-1">you owe</span>
                </span>
              )}
              {(totalOwedToMe > 0 || totalIOwe > 0) && (
                <span className="text-slate-200">·</span>
              )}
              <span>
                <span className="font-semibold text-slate-700">{jemaws.length}</span>
                <span className="text-slate-400 ml-1">group{jemaws.length !== 1 ? "s" : ""}</span>
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-2.5 mb-4">
              <span className="text-5xl font-bold tracking-tight text-slate-900">{jemaws.length}</span>
              <span className="text-slate-400 text-sm">active groups</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap text-sm">
              {currencies.map((cur) => (
                <span key={cur}>
                  {byCurrency[cur].owed > 0 && (
                    <span className="text-emerald-600 font-semibold">+{formatCurrency(byCurrency[cur].owed, cur)}</span>
                  )}
                  {byCurrency[cur].owe > 0 && (
                    <span className="text-rose-500 font-semibold ml-1">−{formatCurrency(byCurrency[cur].owe, cur)}</span>
                  )}
                  <span className="text-slate-400 ml-1">{cur}</span>
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pending notice — slim, not a fat card */}
      {pendingCount > 0 && (
        <Link href="/pending" className="block">
          <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-5 py-3 hover:bg-amber-100 transition-colors">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-sm font-medium text-amber-800">
                {pendingCount} item{pendingCount !== 1 ? "s" : ""} need your review
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </div>
        </Link>
      )}

      {/* Groups */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Groups
            {jemaws.length > 0 && (
              <span className="ml-2 text-xs font-normal text-slate-400">{jemaws.length}</span>
            )}
          </h2>
          <CreateJemawDialog>
            <Button size="sm" className="h-7 text-xs gap-1 px-3">
              <Plus className="w-3 h-3" />
              New
            </Button>
          </CreateJemawDialog>
        </div>

        {jemaws.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
              <Users className="w-4 h-4 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">No groups yet</p>
            <p className="text-xs text-slate-400 mb-5">Create a group to start splitting expenses</p>
            <CreateJemawDialog>
              <Button size="sm" className="h-8 text-xs gap-1 px-4">
                <Plus className="w-3 h-3" />
                Create your first group
              </Button>
            </CreateJemawDialog>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
            {jemaws.map((jemaw) => (
              <JemawRow key={jemaw.id} jemaw={jemaw} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
