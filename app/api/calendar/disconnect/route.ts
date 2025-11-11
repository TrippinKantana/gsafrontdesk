import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/server/db';

// Force dynamic rendering - prevent static analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

/**
 * Disconnect calendar
 * POST /api/calendar/disconnect
 * Body: { provider: 'google' | 'outlook' }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { provider } = body;

    if (!provider || !['google', 'outlook'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be "google" or "outlook"' },
        { status: 400 }
      );
    }

    // Find staff by Clerk user ID
    const staff = await db.staff.findUnique({
      where: { clerkUserId: userId },
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff profile not found' },
        { status: 404 }
      );
    }

    // Disconnect the specified calendar
    const updateData: any = {};
    
    if (provider === 'google') {
      updateData.googleCalendarConnected = false;
      updateData.googleCalendarToken = null;
      updateData.googleCalendarRefreshToken = null;
    } else if (provider === 'outlook') {
      updateData.outlookCalendarConnected = false;
      updateData.outlookCalendarToken = null;
      updateData.outlookCalendarRefreshToken = null;
    }

    await db.staff.update({
      where: { id: staff.id },
      data: updateData,
    });

    console.log(`[Calendar] ${provider} calendar disconnected for staff ${staff.id}`);

    return NextResponse.json({
      success: true,
      message: `${provider} calendar disconnected successfully`,
    });
  } catch (error: any) {
    console.error('[Calendar] Disconnect error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect calendar' },
      { status: 500 }
    );
  }
}

