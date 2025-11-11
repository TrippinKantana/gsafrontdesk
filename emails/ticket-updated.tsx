import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
  Hr,
} from '@react-email/components';

interface TicketUpdatedEmailProps {
  ticketNumber: string;
  ticketTitle: string;
  oldStatus: string;
  newStatus: string;
  updatedBy: string;
  ticketUrl: string;
}

export default function TicketUpdatedEmail({
  ticketNumber = 'TKT-001',
  ticketTitle = 'Sample Ticket',
  oldStatus = 'Open',
  newStatus = 'In Progress',
  updatedBy = 'IT Staff',
  ticketUrl = 'https://example.com/tickets/123',
}: TicketUpdatedEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Heading style={styles.heading}>📋 Ticket Updated</Heading>
          </Section>

          <Section style={styles.content}>
            <Text style={styles.greeting}>Hello,</Text>

            <Text style={styles.text}>
              Your support ticket has been updated by {updatedBy}.
            </Text>

            <Section style={styles.ticketInfo}>
              <Text style={{ ...styles.label, marginBottom: '8px' }}>
                <strong>Ticket Number:</strong> #{ticketNumber}
              </Text>
              <Text style={{ ...styles.label, marginBottom: '8px' }}>
                <strong>Title:</strong> {ticketTitle}
              </Text>
              <Text style={{ ...styles.label, marginBottom: '8px' }}>
                <strong>Status Changed:</strong> {oldStatus} → {newStatus}
              </Text>
            </Section>

            <Section style={styles.buttonContainer}>
              <Button style={styles.button} href={ticketUrl}>
                View Ticket Details
              </Button>
            </Section>

            <Hr style={styles.hr} />

            <Text style={styles.footer}>
              You will receive notifications when there are updates to your ticket.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  container: {
    margin: '0 auto',
    padding: '20px 0',
    maxWidth: '600px',
  },
  header: {
    backgroundColor: '#f59e0b',
    borderRadius: '8px 8px 0 0',
    padding: '24px',
    textAlign: 'center' as const,
  },
  heading: {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0',
  },
  content: {
    backgroundColor: '#ffffff',
    borderRadius: '0 0 8px 8px',
    padding: '32px',
  },
  greeting: {
    fontSize: '16px',
    color: '#374151',
    marginBottom: '16px',
  },
  text: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  ticketInfo: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '16px',
    marginBottom: '24px',
  },
  label: {
    fontSize: '14px',
    color: '#374151',
    margin: '0',
  },
  buttonContainer: {
    textAlign: 'center' as const,
    marginBottom: '24px',
  },
  button: {
    backgroundColor: '#f59e0b',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    padding: '12px 32px',
    display: 'inline-block',
  },
  hr: {
    border: 'none',
    borderTop: '1px solid #e5e7eb',
    margin: '24px 0',
  },
  footer: {
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'center' as const,
  },
};

