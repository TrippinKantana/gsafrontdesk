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
  Link,
} from '@react-email/components';

interface TicketCreatedEmailProps {
  ticketNumber: string;
  ticketTitle: string;
  requesterName: string;
  priority: string;
  category?: string;
  ticketUrl: string;
}

export default function TicketCreatedEmail({
  ticketNumber = 'TKT-001',
  ticketTitle = 'Sample Ticket',
  requesterName = 'John Doe',
  priority = 'Medium',
  category = 'Software',
  ticketUrl = 'https://example.com/tickets/123',
}: TicketCreatedEmailProps) {
  const priorityColor = priority === 'Critical' || priority === 'High' ? '#ef4444' : '#3b82f6';

  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Heading style={styles.heading}>🎟️ New Support Ticket</Heading>
          </Section>

          <Section style={styles.content}>
            <Text style={styles.greeting}>Hello,</Text>

            <Text style={styles.text}>
              A new IT support ticket has been created and assigned to you.
            </Text>

            <Section style={styles.ticketInfo}>
              <Text style={{ ...styles.label, marginBottom: '8px' }}>
                <strong>Ticket Number:</strong> #{ticketNumber}
              </Text>
              <Text style={{ ...styles.label, marginBottom: '8px' }}>
                <strong>Title:</strong> {ticketTitle}
              </Text>
              <Text style={{ ...styles.label, marginBottom: '8px' }}>
                <strong>Requester:</strong> {requesterName}
              </Text>
              <Text style={{ ...styles.label, marginBottom: '8px' }}>
                <strong>Priority:</strong>{' '}
                <span style={{ color: priorityColor, fontWeight: 'bold' }}>{priority}</span>
              </Text>
              {category && (
                <Text style={{ ...styles.label, marginBottom: '8px' }}>
                  <strong>Category:</strong> {category}
                </Text>
              )}
            </Section>

            <Section style={styles.buttonContainer}>
              <Button style={styles.button} href={ticketUrl}>
                View Ticket
              </Button>
            </Section>

            <Hr style={styles.hr} />

            <Text style={styles.footer}>
              Please respond to this ticket as soon as possible. If you have any questions, contact
              your system administrator.
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
    backgroundColor: '#3b82f6',
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
    backgroundColor: '#3b82f6',
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

