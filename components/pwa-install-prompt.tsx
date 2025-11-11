'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // Check if user has dismissed before (using localStorage)
    const hasDismissed = localStorage.getItem('pwa-install-dismissed') === 'true';
    const hasInstalled = localStorage.getItem('pwa-installed') === 'true';
    
    if (isStandalone || hasInstalled) {
      localStorage.setItem('pwa-installed', 'true');
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt immediately for first-time visitors (unless dismissed)
      if (!hasDismissed) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 2000); // Show after 2 seconds
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS, show a custom message after a delay
    if (isIOS && !hasDismissed) {
      setTimeout(() => {
        if (!isStandalone && !hasInstalled) {
          setShowPrompt(true);
        }
      }, 3000);
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        localStorage.setItem('pwa-installed', 'true');
        setShowPrompt(false);
      }
      
      setDeferredPrompt(null);
    } else {
      // iOS or manual installation
      setShowPrompt(false);
      localStorage.setItem('pwa-installed', 'true');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Show for iOS even without beforeinstallprompt
  if (!showPrompt) {
    return null;
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const hasInstallPrompt = !!deferredPrompt;

  return (
    <Dialog open={showPrompt} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Install Syncco App</DialogTitle>
          <DialogDescription className="pt-2">
            {hasInstallPrompt ? (
              <>
                Install this app on your device for a better experience. It will work offline and can be launched from your home screen.
              </>
            ) : isIOS ? (
              <>
                To install this app on your iOS device, tap the Share button <span className="font-semibold">(</span> below) and select <span className="font-semibold">"Add to Home Screen"</span>.
              </>
            ) : (
              <>
                Install this app for a better experience. Look for the install icon in your browser's address bar.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 pt-4">
          {hasInstallPrompt && (
            <Button onClick={handleInstall} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Install App
            </Button>
          )}
          <Button variant="outline" onClick={handleDismiss} className={hasInstallPrompt ? '' : 'flex-1'}>
            {hasInstallPrompt ? 'Not Now' : 'Got It'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
