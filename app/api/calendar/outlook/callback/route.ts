import { NextRequest, NextResponse } from 'next/server';
import { exchangeCalendarCodeForTokens } from '@/lib/calendar';
import { db } from '@/server/db';

// Force dynamic rendering - prevent static analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * Outlook Calendar OAuth Callback
 * Handles the OAuth redirect from Microsoft after user authorization
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Contains staffId
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      const errorMsg = errorDescription || error;
      return NextResponse.redirect(
        new URL(`/employee/meetings?error=${encodeURIComponent(errorMsg)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/employee/meetings?error=missing_parameters', request.url)
      );
    }

    const staffId = state;

    // Exchange code for tokens
    const tokenData = await exchangeCalendarCodeForTokens('outlook', code);

    // Parse token data for storage
    const tokenJson = JSON.stringify(tokenData);

    // Update staff record with calendar connection
    await db.staff.update({
      where: { id: staffId },
      data: {
        outlookCalendarConnected: true,
        outlookCalendarToken: tokenJson,
        outlookCalendarRefreshToken: tokenData.refreshToken,
      },
    });

    console.log(`[Calendar] Outlook Calendar connected for staff ${staffId}`);

    // Redirect back to meetings page with success message
    return NextResponse.redirect(
      new URL('/employee/meetings?calendar_connected=outlook', request.url)
    );
  } catch (error: any) {
    console.error('[Calendar] Outlook OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(
        `/employee/meetings?error=${encodeURIComponent(error.message || 'oauth_failed')}`,
        request.url
      )
    );
  }
}

