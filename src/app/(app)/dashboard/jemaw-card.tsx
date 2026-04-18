import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

type JemawWithBalance = {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  myBalance: string;
  isAdmin: boolean;
  members: { id?: string; userId: string }[];
};

const PALETTE = [
  { bg: "bg-violet-500",  dot: "bg-violet-400"  },
  { bg: "bg-indigo-500",  dot: "bg-indigo-400"  },
  { bg: "bg-sky-500",     dot: "bg-sky-400"     },
  { bg: "bg-emerald-500", dot: "bg-emerald-400" },
  { bg: "bg-amber-500",   dot: "bg-amber-400"   },
  { bg: "bg-rose-500",    dot: "bg-rose-400"    },
  { bg: "bg-cyan-500",    dot: "bg-cyan-400"    },
  { bg: "bg-orange-500",  dot: "bg-orange-400"  },
];

const MEMBER_DOT_COLORS = [
  "bg-indigo-400", "bg-violet-400", "bg-sky-400",
  "bg-emerald-400", "bg-amber-400", "bg-rose-400",
];

function getPalette(name: string) {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % PALETTE.length;
  return PALETTE[hash];
}

export function JemawRow({ jemaw }: { jemaw: JemawWithBalance }) {
  const balance = parseFloat(jemaw.myBalance);
  const palette = getPalette(jemaw.name);
  const initial = jemaw.name.charAt(0).toUpperCase();
  const visibleMembers = jemaw.members.slice(0, 5);
  const extraCount = jemaw.members.length - visibleMembers.length;

  return (
    <Link href={`/jemaws/${jemaw.id}`} className="group">
      <div className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/80 transition-colors">
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-xl ${palette.bg} flex items-center justify-center shrink-0 shadow-sm`}>
          <span className="text-white font-bold text-sm leading-none">{initial}</span>
        </div>

        {/* Name + members */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-slate-900 truncate">{jemaw.name}</p>
            {jemaw.isAdmin && (
              <span className="text-[10px] font-medium text-indigo-500 shrink-0">Admin</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1">
              {visibleMembers.map((m, i) => (
                <div
                  key={m.userId}
                  className={`w-3.5 h-3.5 rounded-full border border-white ${MEMBER_DOT_COLORS[i % MEMBER_DOT_COLORS.length]}`}
                />
              ))}
            </div>
            <span className="text-xs text-slate-400">
              {jemaw.members.length} member{jemaw.members.length !== 1 ? "s" : ""}
              {extraCount > 0 && ` +${extraCount}`}
            </span>
          </div>
        </div>

        {/* Balance */}
        <div className="text-right shrink-0 mr-1">
          {balance === 0 ? (
            <span className="text-xs text-slate-300 font-medium">Settled</span>
          ) : balance > 0 ? (
            <span className="text-sm font-bold text-emerald-600">
              +{formatCurrency(balance, jemaw.currency)}
            </span>
          ) : (
            <span className="text-sm font-bold text-rose-500">
              −{formatCurrency(Math.abs(balance), jemaw.currency)}
            </span>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-slate-400 transition-colors shrink-0" />
      </div>
    </Link>
  );
}
