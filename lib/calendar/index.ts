/**
 * Calendar Integration Service
 * 
 * This module provides unified calendar sync functionality for:
 * - Google Calendar
 * - Microsoft Outlook
 * - Custom calendars (iCal/CalDAV) - Future implementation
 */

import * as googleCalendar from './google-calendar';
import * as outlookCalendar from './outlook-calendar';

export type CalendarProvider = 'google' | 'outlook' | 'custom';

export interface CalendarEvent {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
}

export interface CalendarSyncResult {
  success: boolean;
  eventId?: string;
  provider: CalendarProvider;
  error?: string;
  updatedToken?: any; // For token refresh
}

/**
 * Sync meeting to calendar based on staff's connected calendars
 */
export async function syncMeetingToCalendar(
  provider: CalendarProvider,
  tokenData: any,
  eventData: CalendarEvent
): Promise<CalendarSyncResult> {
  try {
    let eventId: string;
    let updatedToken: any = null;

    switch (provider) {
      case 'google':
        const googleResult = await googleCalendar.createGoogleCalendarEvent(
          tokenData,
          eventData
        );
        eventId = googleResult;
        // Check if token was refreshed
        const googleClient = await googleCalendar.getGoogleCalendarClient(tokenData);
        if (googleClient.updatedToken) {
          updatedToken = googleClient.updatedToken;
        }
        break;

      case 'outlook':
        eventId = await outlookCalendar.createOutlookCalendarEvent(
          tokenData,
          eventData
        );
        break;

      case 'custom':
        // Future implementation for custom calendars
        throw new Error('Custom calendar sync not yet implemented');

      default:
        throw new Error(`Unsupported calendar provider: ${provider}`);
    }

    return {
      success: true,
      eventId,
      provider,
      updatedToken,
    };
  } catch (error: any) {
    console.error(`[Calendar Sync] Error syncing to ${provider}:`, error);
    return {
      success: false,
      provider,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Update meeting in calendar
 */
export async function updateMeetingInCalendar(
  provider: CalendarProvider,
  tokenData: any,
  eventId: string,
  eventData: Partial<CalendarEvent>
): Promise<CalendarSyncResult> {
  try {
    switch (provider) {
      case 'google':
        await googleCalendar.updateGoogleCalendarEvent(tokenData, eventId, eventData);
        break;

      case 'outlook':
        await outlookCalendar.updateOutlookCalendarEvent(tokenData, eventId, eventData);
        break;

      case 'custom':
        throw new Error('Custom calendar sync not yet implemented');

      default:
        throw new Error(`Unsupported calendar provider: ${provider}`);
    }

    return {
      success: true,
      eventId,
      provider,
    };
  } catch (error: any) {
    console.error(`[Calendar Sync] Error updating ${provider} event:`, error);
    return {
      success: false,
      provider,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Delete meeting from calendar
 */
export async function deleteMeetingFromCalendar(
  provider: CalendarProvider,
  tokenData: any,
  eventId: string
): Promise<CalendarSyncResult> {
  try {
    switch (provider) {
      case 'google':
        await googleCalendar.deleteGoogleCalendarEvent(tokenData, eventId);
        break;

      case 'outlook':
        await outlookCalendar.deleteOutlookCalendarEvent(tokenData, eventId);
        break;

      case 'custom':
        throw new Error('Custom calendar sync not yet implemented');

      default:
        throw new Error(`Unsupported calendar provider: ${provider}`);
    }

    return {
      success: true,
      provider,
    };
  } catch (error: any) {
    console.error(`[Calendar Sync] Error deleting ${provider} event:`, error);
    return {
      success: false,
      provider,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Get OAuth authorization URL for calendar provider
 */
export async function getCalendarAuthUrl(
  provider: CalendarProvider,
  staffId: string
): Promise<string> {
  switch (provider) {
    case 'google':
      return googleCalendar.getGoogleAuthUrl(staffId);

    case 'outlook':
      return await outlookCalendar.getOutlookAuthUrl(staffId);

    case 'custom':
      throw new Error('Custom calendar OAuth not yet implemented');

    default:
      throw new Error(`Unsupported calendar provider: ${provider}`);
  }
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCalendarCodeForTokens(
  provider: CalendarProvider,
  code: string
): Promise<any> {
  switch (provider) {
    case 'google':
      return await googleCalendar.exchangeGoogleCodeForTokens(code);

    case 'outlook':
      return await outlookCalendar.exchangeOutlookCodeForTokens(code);

    case 'custom':
      throw new Error('Custom calendar OAuth not yet implemented');

    default:
      throw new Error(`Unsupported calendar provider: ${provider}`);
  }
}

// Re-export individual calendar functions
export { googleCalendar, outlookCalendar };

