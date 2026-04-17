import Link from "next/link";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

type JemawWithBalance = {
  id: string;
  name: string;
  description: string | null;
  myBalance: string;
  isAdmin: boolean;
  members: { id?: string; userId: string }[];
};

export function JemawCard({ jemaw }: { jemaw: JemawWithBalance }) {
  const balance = parseFloat(jemaw.myBalance);

  return (
    <Link href={`/jemaws/${jemaw.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">{jemaw.name}</CardTitle>
            {jemaw.isAdmin && (
              <Badge variant="secondary" className="text-xs shrink-0">
                Admin
              </Badge>
            )}
          </div>
          {jemaw.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {jemaw.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            {jemaw.members.length} member{jemaw.members.length !== 1 ? "s" : ""}
          </div>
          <div className="text-sm font-medium">
            {balance === 0 ? (
              <span className="text-muted-foreground">Settled up</span>
            ) : balance > 0 ? (
              <span className="text-green-600">You are owed {formatCurrency(balance)}</span>
            ) : (
              <span className="text-red-600">You owe {formatCurrency(Math.abs(balance))}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
