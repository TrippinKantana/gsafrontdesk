import { NextRequest, NextResponse } from 'next/server';
import { exchangeCalendarCodeForTokens } from '@/lib/calendar';
import { db } from '@/server/db';

// Force dynamic rendering - prevent static analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

/**
 * Google Calendar OAuth Callback
 * Handles the OAuth redirect from Google after user authorization
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Contains staffId
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/employee/meetings?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/employee/meetings?error=missing_parameters', request.url)
      );
    }

    const staffId = state;

    // Exchange code for tokens
    const tokenData = await exchangeCalendarCodeForTokens('google', code);

    // Parse token data for storage
    const tokenJson = JSON.stringify(tokenData);

    // Update staff record with calendar connection
    await db.staff.update({
      where: { id: staffId },
      data: {
        googleCalendarConnected: true,
        googleCalendarToken: tokenJson,
        googleCalendarRefreshToken: tokenData.refresh_token,
      },
    });

    console.log(`[Calendar] Google Calendar connected for staff ${staffId}`);

    // Redirect back to meetings page with success message
    return NextResponse.redirect(
      new URL('/employee/meetings?calendar_connected=google', request.url)
    );
  } catch (error: any) {
    console.error('[Calendar] Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(
        `/employee/meetings?error=${encodeURIComponent(error.message || 'oauth_failed')}`,
        request.url
      )
    );
  }
}

