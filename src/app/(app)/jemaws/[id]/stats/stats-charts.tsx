"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  LabelList,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

const CAT_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#3b82f6",
  "#8b5cf6", "#f43f5e", "#14b8a6", "#f97316",
];

type CategoryData = { category: string; total: number };
type BalanceData = { name: string; balance: number; userId: string };

function CategoryTooltip({
  active, payload, currency,
}: {
  active?: boolean;
  payload?: { value: number; payload: CategoryData }[];
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl px-3.5 py-2.5 shadow-lg">
      <p className="text-xs text-slate-500 capitalize mb-0.5">{payload[0].payload.category}</p>
      <p className="text-sm font-bold text-slate-900">{formatCurrency(payload[0].value, currency)}</p>
    </div>
  );
}

function BalanceTooltip({
  active, payload, currency,
}: {
  active?: boolean;
  payload?: { value: number; payload: BalanceData }[];
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-white border border-slate-100 rounded-xl px-3.5 py-2.5 shadow-lg">
      <p className="text-xs text-slate-500 mb-0.5">{payload[0].payload.name}</p>
      <p className={`text-sm font-bold ${val > 0 ? "text-emerald-600" : val < 0 ? "text-rose-500" : "text-slate-400"}`}>
        {val === 0 ? "Settled" : `${val > 0 ? "+" : "−"}${formatCurrency(Math.abs(val), currency)}`}
      </p>
    </div>
  );
}

export function StatsCharts({
  byCategory,
  memberBalances,
  totalSpent,
  currency,
}: {
  byCategory: CategoryData[];
  memberBalances: BalanceData[];
  totalSpent: number;
  currency: string;
}) {
  const sortedCats = [...byCategory].sort((a, b) => b.total - a.total);
  const sortedMembers = [...memberBalances].sort((a, b) => b.balance - a.balance);

  return (
    <div className="space-y-16">

      {/* Spending by category */}
      {sortedCats.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-8">
            Where the money went
          </p>

          <ResponsiveContainer width="100%" height={sortedCats.length <= 3 ? 180 : 240}>
            <BarChart
              data={sortedCats}
              margin={{ top: 24, right: 8, left: 8, bottom: 4 }}
              barCategoryGap="40%"
            >
              <XAxis
                dataKey="category"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                tickFormatter={(v: string) => v.charAt(0).toUpperCase() + v.slice(1)}
              />
              <YAxis hide />
              <Tooltip
                content={<CategoryTooltip currency={currency} />}
                cursor={{ fill: "rgba(99,102,241,0.04)", radius: 6 }}
              />
              <Bar dataKey="total" radius={[5, 5, 2, 2]} maxBarSize={52}>
                {sortedCats.map((_, i) => (
                  <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} fillOpacity={0.85} />
                ))}
                <LabelList
                  dataKey="total"
                  position="top"
                  formatter={(v: unknown) => formatCurrency(v as number, currency)}
                  style={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Colour key — inline, minimal */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-2">
            {sortedCats.map((cat, i) => (
              <span key={cat.category} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }}
                />
                <span className="capitalize">{cat.category}</span>
                <span className="text-slate-300 ml-0.5">{Math.round((cat.total / totalSpent) * 100)}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      {sortedCats.length > 0 && sortedMembers.length > 0 && (
        <div className="border-t border-slate-100" />
      )}

      {/* Member balances */}
      {sortedMembers.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-8">
            Who owes what
          </p>

          <ResponsiveContainer width="100%" height={sortedMembers.length * 48 + 20}>
            <BarChart
              layout="vertical"
              data={sortedMembers}
              margin={{ top: 0, right: 90, left: 0, bottom: 0 }}
              barCategoryGap="38%"
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 13, fill: "#475569", fontWeight: 500 }}
                width={88}
              />
              <ReferenceLine x={0} stroke="#e2e8f0" strokeWidth={1} />
              <Tooltip
                content={<BalanceTooltip currency={currency} />}
                cursor={{ fill: "rgba(100,116,139,0.04)", radius: 4 }}
              />
              <Bar dataKey="balance" radius={[2, 4, 4, 2]} maxBarSize={12}>
                {sortedMembers.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.balance > 0 ? "#10b981" : entry.balance < 0 ? "#f43f5e" : "#cbd5e1"}
                    fillOpacity={0.9}
                  />
                ))}
                <LabelList
                  dataKey="balance"
                  position="right"
                  formatter={(v: unknown) => {
                    const n = v as number;
                    return n === 0 ? "Settled" : `${n > 0 ? "+" : "−"}${formatCurrency(Math.abs(n), currency)}`;
                  }}
                  style={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="flex items-center gap-5 mt-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              owed to them
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-5 h-1.5 rounded-full bg-rose-400 inline-block" />
              they owe
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
