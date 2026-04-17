import Link from "next/link";
import { getServerSession } from "@/lib/session";
import { getInvitationByToken } from "@/actions/jemaws";
import { AcceptInvitationClient } from "./accept-invitation-client";
import { Button } from "@/components/ui/button";

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold mb-2">Invalid invitation</h1>
          <p className="text-muted-foreground text-sm mb-4">
            This invitation link is not valid.
          </p>
          <Link href="/sign-in">
            <Button variant="outline">Go to sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (invitation.isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold mb-2">Invitation expired</h1>
          <p className="text-muted-foreground text-sm mb-4">
            This invitation to <strong>{invitation.jemawName}</strong> has expired.
            Ask the group admin to send a new one.
          </p>
          <Link href="/dashboard">
            <Button variant="outline">Go to dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (invitation.isUsed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold mb-2">Already used</h1>
          <p className="text-muted-foreground text-sm mb-4">
            This invitation has already been accepted.
          </p>
          <Link href="/dashboard">
            <Button variant="outline">Go to dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const session = await getServerSession();

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold mb-2">You&apos;ve been invited!</h1>
          <p className="text-muted-foreground text-sm mb-6">
            You&apos;ve been invited to join <strong>{invitation.jemawName}</strong>.
            Sign in or create an account to accept.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href={`/sign-in?redirect=/invitations/${token}`}>
              <Button variant="outline">Sign in</Button>
            </Link>
            <Link href={`/sign-up?redirect=/invitations/${token}`}>
              <Button>Create account</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AcceptInvitationClient token={token} jemawName={invitation.jemawName} />
  );
}
