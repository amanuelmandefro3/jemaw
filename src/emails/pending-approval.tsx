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

interface PendingApprovalEmailProps {
  recipientName: string;
  type: "bill" | "settlement";
  description: string;
  amount: string;
  requesterName: string;
  jemawName: string;
  actionUrl: string;
}

export function PendingApprovalEmail({
  recipientName,
  type,
  description,
  amount,
  requesterName,
  jemawName,
  actionUrl,
}: PendingApprovalEmailProps) {
  const previewText =
    type === "bill"
      ? `New bill requires your approval in ${jemawName}`
      : `Settlement request requires your approval in ${jemawName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Jemaw</Heading>
          <Hr style={hr} />

          <Heading as="h2" style={h2}>
            {type === "bill"
              ? "New Bill Awaiting Approval"
              : "Settlement Awaiting Approval"}
          </Heading>

          <Text style={text}>Hi {recipientName},</Text>

          <Text style={text}>
            {type === "bill" ? (
              <>
                <strong>{requesterName}</strong> has added a new bill that
                requires your approval in the group <strong>{jemawName}</strong>
                .
              </>
            ) : (
              <>
                <strong>{requesterName}</strong> claims to have paid you{" "}
                <strong>{amount}</strong> in the group{" "}
                <strong>{jemawName}</strong>. Please confirm if you received
                this payment.
              </>
            )}
          </Text>

          <Section style={detailsSection}>
            <Text style={detailLabel}>
              {type === "bill" ? "Bill Description" : "Settlement Note"}
            </Text>
            <Text style={detailValue}>{description || "No description"}</Text>

            <Text style={detailLabel}>Amount</Text>
            <Text style={detailValue}>{amount}</Text>

            <Text style={detailLabel}>From</Text>
            <Text style={detailValue}>{requesterName}</Text>

            <Text style={detailLabel}>Group</Text>
            <Text style={detailValue}>{jemawName}</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={actionUrl}>
              Review & Approve
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            This email was sent from Jemaw. If you didn&apos;t expect this
            email, you can safely ignore it.
          </Text>

          <Link href={actionUrl} style={link}>
            View in Jemaw
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

const detailsSection = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const detailLabel = {
  color: "#8898aa",
  fontSize: "12px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  margin: "0 0 4px",
};

const detailValue = {
  color: "#1a1a1a",
  fontSize: "16px",
  margin: "0 0 16px",
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
};

export default PendingApprovalEmail;
