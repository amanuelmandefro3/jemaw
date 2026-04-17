"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { acceptInvitation } from "@/actions/jemaws";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

export function AcceptInvitationClient({
  token,
  jemawName,
}: {
  token: string;
  jemawName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    startTransition(async () => {
      try {
        const result = await acceptInvitation({ token });
        toast.success(result.message);
        router.push(`/jemaws/${result.jemawId}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to accept invitation");
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Users className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold mb-2">You&apos;ve been invited!</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Join <strong>{jemawName}</strong> to start splitting expenses together.
        </p>
        <Button onClick={handleAccept} disabled={isPending} className="w-full">
          {isPending ? "Joining…" : `Join ${jemawName}`}
        </Button>
      </div>
    </div>
  );
}
