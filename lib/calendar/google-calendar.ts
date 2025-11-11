import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleCalendarToken {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  scope: string;
  token_type: string;
}

/**
 * Create Google OAuth2 client
 */
export function createGoogleOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Get Google Calendar OAuth authorization URL
 */
export function getGoogleAuthUrl(staffId: string): string {
  const oauth2Client = createGoogleOAuthClient();
  
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent to get refresh token
    state: staffId, // Pass staff ID in state for callback
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeGoogleCodeForTokens(code: string): Promise<GoogleCalendarToken> {
  const oauth2Client = createGoogleOAuthClient();
  
  const { tokens } = await oauth2Client.getToken(code);
  
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to get refresh token. User may need to re-authorize.');
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date || Date.now() + 3600000, // Default 1 hour
    scope: tokens.scope || '',
    token_type: tokens.token_type || 'Bearer',
  };
}

/**
 * Get authenticated Google Calendar client
 */
export async function getGoogleCalendarClient(tokenData: GoogleCalendarToken): Promise<any> {
  const oauth2Client = createGoogleOAuthClient();
  
  oauth2Client.setCredentials({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expiry_date: tokenData.expiry_date,
  });

  // Auto-refresh token if expired
  if (tokenData.expiry_date && Date.now() >= tokenData.expiry_date) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    
    // Return updated token data
    return {
      calendar: google.calendar({ version: 'v3', auth: oauth2Client }),
      updatedToken: {
        access_token: credentials.access_token!,
        refresh_token: credentials.refresh_token || tokenData.refresh_token,
        expiry_date: credentials.expiry_date || Date.now() + 3600000,
        scope: credentials.scope || tokenData.scope,
        token_type: credentials.token_type || tokenData.token_type,
      },
    };
  }

  return {
    calendar: google.calendar({ version: 'v3', auth: oauth2Client }),
    updatedToken: null,
  };
}

/**
 * Create calendar event in Google Calendar
 */
export async function createGoogleCalendarEvent(
  tokenData: GoogleCalendarToken,
  eventData: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    attendees?: string[]; // Email addresses
  }
): Promise<string> {
  const { calendar } = await getGoogleCalendarClient(tokenData);

  const event = {
    summary: eventData.title,
    description: eventData.description || '',
    location: eventData.location || '',
    start: {
      dateTime: eventData.startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: eventData.endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    attendees: eventData.attendees?.map(email => ({ email })) || [],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 15 }, // 15 minutes before
      ],
    },
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
  });

  return response.data.id || '';
}

/**
 * Update calendar event in Google Calendar
 */
export async function updateGoogleCalendarEvent(
  tokenData: GoogleCalendarToken,
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
  const { calendar } = await getGoogleCalendarClient(tokenData);

  // First, get the existing event
  const existingEvent = await calendar.events.get({
    calendarId: 'primary',
    eventId: eventId,
  });

  const updatedEvent = {
    ...existingEvent.data,
    summary: eventData.title ?? existingEvent.data.summary,
    description: eventData.description ?? existingEvent.data.description,
    location: eventData.location ?? existingEvent.data.location,
    start: eventData.startTime ? {
      dateTime: eventData.startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    } : existingEvent.data.start,
    end: eventData.endTime ? {
      dateTime: eventData.endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    } : existingEvent.data.end,
    attendees: eventData.attendees?.map(email => ({ email })) ?? existingEvent.data.attendees,
  };

  await calendar.events.update({
    calendarId: 'primary',
    eventId: eventId,
    requestBody: updatedEvent,
  });
}

/**
 * Delete calendar event from Google Calendar
 */
export async function deleteGoogleCalendarEvent(
  tokenData: GoogleCalendarToken,
  eventId: string
): Promise<void> {
  const { calendar } = await getGoogleCalendarClient(tokenData);

  await calendar.events.delete({
    calendarId: 'primary',
    eventId: eventId,
  });
}

