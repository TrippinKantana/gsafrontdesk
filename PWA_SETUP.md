# Progressive Web App (PWA) Setup Guide

## Overview

This application is now configured as a Progressive Web App (PWA) that can be installed on tablets, iPads, and mobile devices. When installed, it provides a full-screen, app-like experience without the browser URL bar.

## Features

### For Visitors (Tablet/iPad Kiosk Mode)
- **Full-screen experience** - No browser UI when installed
- **Standalone mode** - Works like a native app
- **Offline capability** - Basic offline support via service worker
- **Touch-optimized** - Large buttons and touch-friendly interface
- **Safe area support** - Respects device notches and safe areas

### For Receptionists (Desktop/Laptop)
- **Regular web experience** - Works in browser
- **Can also be installed** - Optional PWA installation
- **Dashboard optimized** - Full-featured interface

## Installation

### On iPad/Tablet (Visitor Kiosk)

1. **Open Safari** (iOS) or **Chrome** (Android)
2. Navigate to the visitor check-in page: `/visitor`
3. Tap the **Share** button (iOS) or **Menu** (Android)
4. Select **"Add to Home Screen"** or **"Install App"**
5. The app will appear on your home screen
6. Launch it for a full-screen, app-like experience

### On Desktop/Laptop (Receptionist)

1. **Chrome/Edge**: Click the install icon in the address bar when prompted
2. **Or manually**: Settings → Apps → Install this site as an app
3. The app will open in a standalone window

## PWA Configuration

### Manifest (`app/manifest.ts`)
- **Display mode**: `standalone` - Hides browser UI
- **Theme color**: Blue (#3b82f6)
- **Icons**: 192x192 and 512x512 PNG icons needed
- **Shortcuts**: Quick access to Visitor Check-In and Dashboard

### Service Worker (`public/sw.js`)
- Caches essential pages for offline access
- Provides basic offline functionality

### Viewport Configuration
- `viewport-fit: cover` - Supports devices with notches
- `user-scalable: false` - Prevents accidental zoom on tablets
- Safe area insets for iOS devices

## Creating App Icons

You need to create two icon files:

1. **`public/icon-192.png`** - 192x192 pixels
2. **`public/icon-512.png`** - 512x512 pixels

### Quick Icon Generation

You can use online tools or create them manually:

**Option 1: Online Tools**
- https://www.favicon-generator.org/
- https://realfavicongenerator.net/

**Option 2: Manual Creation**
- Create a square logo/icon
- Export as PNG at 192x192 and 512x512
- Place in `public/` folder

**Option 3: Placeholder Icons**
For now, you can use any placeholder images. The app will work without icons, but they're recommended for a polished experience.

## Testing PWA Features

### Desktop (Chrome DevTools)
1. Open DevTools (F12)
2. Go to **Application** tab
3. Check **Manifest** section
4. Test **Service Workers**
5. Use **Lighthouse** to audit PWA features

### Mobile/Tablet
1. Connect device to computer
2. Use Chrome DevTools remote debugging
3. Or test directly on device

## Kiosk Mode Setup

For a true kiosk experience on tablets:

### iPad (iOS)
1. Install the PWA
2. Use **Guided Access** (Settings → Accessibility → Guided Access)
3. Enable Guided Access for the app
4. This prevents users from exiting the app

### Android Tablet
1. Install the PWA
2. Use **Kiosk Mode** apps or device management
3. Or use Android's built-in **Screen Pinning**

## Browser Support

- ✅ **Chrome/Edge** - Full PWA support
- ✅ **Safari (iOS 16.4+)** - Full PWA support
- ✅ **Firefox** - Basic PWA support
- ⚠️ **Safari (older iOS)** - Limited support

## Customization

### Change Theme Color
Edit `app/layout.tsx`:
```typescript
themeColor: '#3b82f6', // Change to your brand color
```

### Modify Manifest
Edit `app/manifest.ts` to customize:
- App name and description
- Icons
- Start URL
- Display mode

### Service Worker
Edit `public/sw.js` to:
- Cache additional resources
- Implement offline functionality
- Add push notifications (future)

## Current Status

✅ PWA manifest configured
✅ Service worker setup
✅ Install prompt component
✅ Safe area support for iOS
✅ Touch-optimized interface
⚠️ Icons need to be added (placeholders can be used)

## Next Steps

1. **Create app icons** - Add `icon-192.png` and `icon-512.png` to `public/` folder
2. **Test installation** - Try installing on a tablet/iPad
3. **Test offline mode** - Verify service worker functionality
4. **Configure kiosk mode** - Set up Guided Access (iOS) or Screen Pinning (Android)
5. **Customize branding** - Update colors, icons, and manifest details

## Troubleshooting

**Install prompt not showing?**
- Ensure you're using HTTPS (or localhost)
- Check browser support (Chrome/Edge/Safari)
- Clear browser cache

**Service worker not registering?**
- Check browser console for errors
- Verify `public/sw.js` exists
- Ensure HTTPS is used

**App not opening full-screen?**
- Check manifest.json is valid
- Verify display mode is "standalone"
- Clear browser cache and reinstall

**Icons not showing?**
- Ensure icon files exist in `public/` folder
- Verify file names match manifest
- Check file sizes are correct
