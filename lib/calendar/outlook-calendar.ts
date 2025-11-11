import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication, AuthenticationResult } from '@azure/msal-node';

export interface OutlookCalendarToken {
  accessToken: string;
  refreshToken: string;
  expiresOn: number;
  scope: string;
}

/**
 * Create MSAL client for Outlook
 */
export function createMsalClient(): ConfidentialClientApplication {
  const clientId = process.env.OUTLOOK_CLIENT_ID;
  const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
  const redirectUri = process.env.OUTLOOK_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/outlook/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Outlook OAuth credentials not configured. Please set OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET in .env');
  }

  return new ConfidentialClientApplication({
    auth: {
      clientId,
      clientSecret,
      authority: 'https://login.microsoftonline.com/common',
      redirectUri,
    },
  });
}

/**
 * Get Outlook OAuth authorization URL
 */
export async function getOutlookAuthUrl(staffId: string): Promise<string> {
  const msalClient = createMsalClient();

  const scopes = [
    'https://graph.microsoft.com/Calendars.ReadWrite',
    'https://graph.microsoft.com/User.Read',
  ];

  const authUrl = await msalClient.getAuthCodeUrl({
    scopes,
    state: staffId, // Pass staff ID in state for callback
    prompt: 'consent', // Force consent to get refresh token
  });

  return authUrl;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeOutlookCodeForTokens(code: string): Promise<OutlookCalendarToken> {
  const msalClient = createMsalClient();
  const redirectUri = process.env.OUTLOOK_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/outlook/callback`;

  const result: AuthenticationResult | null = await msalClient.acquireTokenByCode({
    code,
    redirectUri,
    scopes: [
      'https://graph.microsoft.com/Calendars.ReadWrite',
      'https://graph.microsoft.com/User.Read',
    ],
  });

  if (!result || !result.accessToken) {
    throw new Error('Failed to acquire access token from Microsoft');
  }

  // Calculate expiry time (tokens typically expire in 1 hour)
  const expiresOn = result.expiresOn ? result.expiresOn.getTime() : Date.now() + 3600000;

  return {
    accessToken: result.accessToken,
    refreshToken: result.account?.idTokenClaims?.refresh_token || '', // Note: MSAL handles refresh differently
    expiresOn,
    scope: result.scopes?.join(' ') || '',
  };
}

/**
 * Get authenticated Microsoft Graph client
 */
export async function getOutlookCalendarClient(tokenData: OutlookCalendarToken): Promise<any> {
  // Check if token is expired and refresh if needed
  if (Date.now() >= tokenData.expiresOn) {
    // For production, implement token refresh logic
    // For now, we'll throw an error suggesting re-authentication
    throw new Error('Token expired. Please reconnect your Outlook calendar.');
  }

  const client = Client.init({
    authProvider: (done) => {
      done(null, tokenData.accessToken);
    },
  });

  return client;
}

/**
 * Create calendar event in Outlook Calendar
 */
export async function createOutlookCalendarEvent(
  tokenData: OutlookCalendarToken,
  eventData: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    attendees?: string[]; // Email addresses
  }
): Promise<string> {
  const client = await getOutlookCalendarClient(tokenData);

  const event = {
    subject: eventData.title,
    body: {
      contentType: 'HTML',
      content: eventData.description || '',
    },
    start: {
      dateTime: eventData.startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: eventData.endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    location: {
      displayName: eventData.location || '',
    },
    attendees: eventData.attendees?.map(email => ({
      emailAddress: {
        address: email,
        name: email,
      },
      type: 'required',
    })) || [],
    isReminderOn: true,
    reminderMinutesBeforeStart: 15,
  };

  const response = await client.api('/me/calendar/events').post(event);
  return response.id || '';
}

/**
 * Update calendar event in Outlook Calendar
 */
export async function updateOutlookCalendarEvent(
  tokenData: OutlookCalendarToken,
  eventId: string,
  eventData: {
    title?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
    location?: string;
    attendees?: string[];
  }
): Promise<void> {
  const client = await getOutlookCalendarClient(tokenData);

  const updateData: any = {};
  
  if (eventData.title) updateData.subject = eventData.title;
  if (eventData.description) {
    updateData.body = {
      contentType: 'HTML',
      content: eventData.description,
    };
  }
  if (eventData.startTime) {
    updateData.start = {
      dateTime: eventData.startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }
  if (eventData.endTime) {
    updateData.end = {
      dateTime: eventData.endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }
  if (eventData.location) {
    updateData.location = {
      displayName: eventData.location,
    };
  }
  if (eventData.attendees) {
    updateData.attendees = eventData.attendees.map(email => ({
      emailAddress: {
        address: email,
        name: email,
      },
      type: 'required',
    }));
  }

  await client.api(`/me/calendar/events/${eventId}`).patch(updateData);
}

/**
 * Delete calendar event from Outlook Calendar
 */
export async function deleteOutlookCalendarEvent(
  tokenData: OutlookCalendarToken,
  eventId: string
): Promise<void> {
  const client = await getOutlookCalendarClient(tokenData);

  await client.api(`/me/calendar/events/${eventId}`).delete();
}

