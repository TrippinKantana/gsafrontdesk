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

interface TicketMessageEmailProps {
  ticketNumber: string;
  ticketTitle: string;
  senderName: string;
  message: string;
  ticketUrl: string;
}

export default function TicketMessageEmail({
  ticketNumber = 'TKT-001',
  ticketTitle = 'Sample Ticket',
  senderName = 'IT Staff',
  message = 'This is a sample message.',
  ticketUrl = 'https://example.com/tickets/123',
}: TicketMessageEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Heading style={styles.heading}>💬 New Message on Your Ticket</Heading>
          </Section>

          <Section style={styles.content}>
            <Text style={styles.greeting}>Hello,</Text>

            <Text style={styles.text}>
              <strong>{senderName}</strong> has replied to your support ticket.
            </Text>

            <Section style={styles.ticketInfo}>
              <Text style={{ ...styles.label, marginBottom: '8px' }}>
                <strong>Ticket:</strong> #{ticketNumber} - {ticketTitle}
              </Text>
            </Section>

            <Section style={styles.messageBox}>
              <Text style={styles.messageLabel}>Message:</Text>
              <Text style={styles.messageText}>{message}</Text>
            </Section>

            <Section style={styles.buttonContainer}>
              <Button style={styles.button} href={ticketUrl}>
                View Full Conversation
              </Button>
            </Section>

            <Hr style={styles.hr} />

            <Text style={styles.footer}>
              Reply directly in the ticket system to continue the conversation.
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
    backgroundColor: '#10b981',
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
    marginBottom: '16px',
  },
  label: {
    fontSize: '14px',
    color: '#374151',
    margin: '0',
  },
  messageBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '6px',
    padding: '16px',
    marginBottom: '24px',
  },
  messageLabel: {
    fontSize: '12px',
    color: '#15803d',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  messageText: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap' as const,
    margin: '0',
  },
  buttonContainer: {
    textAlign: 'center' as const,
    marginBottom: '24px',
  },
  button: {
    backgroundColor: '#10b981',
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

