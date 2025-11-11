'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function CalendarConnection() {
  const { toast } = useToast();
  const [connecting, setConnecting] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const { data: calendarStatus, refetch } = trpc.meeting.getCalendarStatus.useQuery();

  const disconnectCalendar = trpc.meeting.disconnectCalendar.useMutation({
    onSuccess: () => {
      toast({
        title: 'Calendar Disconnected',
        description: 'Your calendar has been disconnected successfully.',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleConnect = async (provider: 'google' | 'outlook') => {
    try {
      setConnecting(provider);
      
      // Get OAuth URL using tRPC utils
      const result = await utils.meeting.getCalendarAuthUrl.fetch({ provider });
      
      // Redirect to OAuth
      if (result.authUrl) {
        window.location.href = result.authUrl;
      }
    } catch (error: any) {
      setConnecting(null);
      toast({
        title: 'Connection Error',
        description: error.message || 'Failed to initiate calendar connection.',
        variant: 'destructive',
      });
    }
  };

  const handleDisconnect = (provider: 'google' | 'outlook') => {
    if (confirm(`Are you sure you want to disconnect your ${provider === 'google' ? 'Google' : 'Outlook'} calendar?`)) {
      disconnectCalendar.mutate({ provider });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendar Integration
        </CardTitle>
        <CardDescription>
          Connect your calendar to automatically sync meetings. When you create a meeting, it will be added to your connected calendars.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google Calendar */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold">G</span>
            </div>
            <div>
              <h3 className="font-semibold">Google Calendar</h3>
              <p className="text-sm text-muted-foreground">
                {calendarStatus?.google ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {calendarStatus?.google ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDisconnect('google')}
                  disabled={disconnectCalendar.isLoading}
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleConnect('google')}
                disabled={connecting === 'google'}
              >
                {connecting === 'google' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect'
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Outlook Calendar */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-orange-600 font-bold">O</span>
            </div>
            <div>
              <h3 className="font-semibold">Microsoft Outlook</h3>
              <p className="text-sm text-muted-foreground">
                {calendarStatus?.outlook ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {calendarStatus?.outlook ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDisconnect('outlook')}
                  disabled={disconnectCalendar.isLoading}
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleConnect('outlook')}
                disabled={connecting === 'outlook'}
              >
                {connecting === 'outlook' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect'
                )}
              </Button>
            )}
          </div>
        </div>

        {calendarStatus && (calendarStatus.google || calendarStatus.outlook) && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✓ Your meetings will automatically sync to your connected calendars.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

