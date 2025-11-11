import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface VisitorArrivalEmailProps {
  hostName: string;
  visitorName: string;
  visitorCompany: string;
  visitorEmail: string;
  visitorPhone: string;
  reasonForVisit: string;
  checkInTime: string;
  visitorId: string;
  acceptUrl?: string;
  declineUrl?: string;
}

export const VisitorArrivalEmail = ({
  hostName = 'John Doe',
  visitorName = 'Jane Smith',
  visitorCompany = 'ABC Corporation',
  visitorEmail = 'jane.smith@abc.com',
  visitorPhone = '+1-555-0100',
  reasonForVisit = 'Meeting',
  checkInTime = 'November 5, 2025 at 10:30 AM',
  visitorId = 'xxx',
  acceptUrl = 'https://yourdomain.com/employee/respond?token=xxx&action=accept',
  declineUrl = 'https://yourdomain.com/employee/respond?token=xxx&action=decline',
}: VisitorArrivalEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Visitor {visitorName} has checked in to see you</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Visitor Arrival Notification</Heading>
          <Text style={text}>
            Hi <strong>{hostName}</strong>,
          </Text>
          <Text style={text}>
            A visitor has checked in at the front desk and is waiting to see you.
          </Text>

          <Section style={detailsSection}>
            <Heading as="h2" style={h2}>
              Visitor Details
            </Heading>
            <table style={table}>
              <tr>
                <td style={labelCell}>Name:</td>
                <td style={valueCell}>{visitorName}</td>
              </tr>
              <tr>
                <td style={labelCell}>Company:</td>
                <td style={valueCell}>{visitorCompany}</td>
              </tr>
              <tr>
                <td style={labelCell}>Email:</td>
                <td style={valueCell}>
                  <Link href={`mailto:${visitorEmail}`} style={link}>
                    {visitorEmail}
                  </Link>
                </td>
              </tr>
              <tr>
                <td style={labelCell}>Phone:</td>
                <td style={valueCell}>
                  <Link href={`tel:${visitorPhone}`} style={link}>
                    {visitorPhone}
                  </Link>
                </td>
              </tr>
              <tr>
                <td style={labelCell}>Reason:</td>
                <td style={valueCell}>{reasonForVisit}</td>
              </tr>
              <tr>
                <td style={labelCell}>Check-In Time:</td>
                <td style={valueCell}>{checkInTime}</td>
              </tr>
            </table>
          </Section>

          <Section style={actionSection}>
            <Heading as="h2" style={h2}>
              Will you meet with this visitor?
            </Heading>
            <table style={buttonTable}>
              <tr>
                <td style={buttonCell}>
                  <Button href={acceptUrl} style={acceptButton}>
                    ✓ Accept Meeting
                  </Button>
                </td>
                <td style={buttonCell}>
                  <Button href={declineUrl} style={declineButton}>
                    ✗ Decline Meeting
                  </Button>
                </td>
              </tr>
            </table>
            <Text style={smallText}>
              Or respond from your{' '}
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/employee/dashboard`} style={link}>
                employee dashboard
              </Link>
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Syncco Visitor Management System
            <br />
            © {new Date().getFullYear()} Lantern Cybersecurity. All rights reserved.
            <br />
            <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/help`} style={footerLink}>
              Need help?
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default VisitorArrivalEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 40px',
};

const h2 = {
  color: '#374151',
  fontSize: '18px',
  fontWeight: '600',
  margin: '20px 0 12px',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
};

const detailsSection = {
  padding: '20px 40px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  margin: '20px 40px',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const labelCell = {
  padding: '8px 16px 8px 0',
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '500',
  verticalAlign: 'top',
  width: '140px',
};

const valueCell = {
  padding: '8px 0',
  color: '#1f2937',
  fontSize: '14px',
  verticalAlign: 'top',
};

const link = {
  color: '#2563eb',
  textDecoration: 'none',
};

const actionSection = {
  padding: '20px 40px',
};

const buttonTable = {
  width: '100%',
  margin: '20px 0',
};

const buttonCell = {
  padding: '0 8px',
};

const acceptButton = {
  backgroundColor: '#10b981',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  width: '100%',
};

const declineButton = {
  backgroundColor: '#ef4444',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  width: '100%',
};

const smallText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  textAlign: 'center' as const,
  marginTop: '16px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const footer = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '20px',
  textAlign: 'center' as const,
  padding: '0 40px',
};

const footerLink = {
  color: '#2563eb',
  textDecoration: 'none',
};

