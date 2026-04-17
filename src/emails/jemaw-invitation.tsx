import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";

interface JemawInvitationEmailProps {
  inviterName: string;
  jemawName: string;
  inviteUrl: string;
}

export function JemawInvitationEmail({
  inviterName,
  jemawName,
  inviteUrl,
}: JemawInvitationEmailProps) {
  const previewText = `${inviterName} invited you to join ${jemawName} on Jemaw`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Jemaw</Heading>
          <Hr style={hr} />

          <Heading as="h2" style={h2}>
            You&apos;ve Been Invited!
          </Heading>

          <Text style={text}>
            <strong>{inviterName}</strong> has invited you to join the group{" "}
            <strong>{jemawName}</strong> on Jemaw, the easy way to split bills
            and track shared expenses.
          </Text>

          <Text style={text}>
            With Jemaw, you can easily track who owes what and settle up when
            convenient.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={inviteUrl}>
              Join {jemawName}
            </Button>
          </Section>

          <Text style={smallText}>
            This invitation will expire in 7 days.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            If you didn&apos;t expect this invitation, you can safely ignore
            this email.
          </Text>

          <Link href={inviteUrl} style={link}>
            {inviteUrl}
          </Link>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "28px",
  fontWeight: "700",
  textAlign: "center" as const,
  margin: "0 0 20px",
};

const h2 = {
  color: "#333",
  fontSize: "20px",
  fontWeight: "600",
  margin: "30px 0 20px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const text = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const smallText = {
  color: "#8898aa",
  fontSize: "14px",
  textAlign: "center" as const,
  margin: "12px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#0070f3",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "24px 0 0",
};

const link = {
  color: "#0070f3",
  fontSize: "12px",
  textDecoration: "underline",
  wordBreak: "break-all" as const,
};

export default JemawInvitationEmail;
