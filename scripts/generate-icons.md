# Generate PWA Icons

You need to create two icon files for the PWA:

1. `public/icon-192.png` - 192x192 pixels
2. `public/icon-512.png` - 512x512 pixels

## Quick Options:

### Option 1: Use Online Tool
1. Go to https://realfavicongenerator.net/
2. Upload your logo/icon
3. Download the generated icons
4. Place `android-chrome-192x192.png` as `public/icon-192.png`
5. Place `android-chrome-512x512.png` as `public/icon-512.png`

### Option 2: Create Simple Placeholder
Create a simple colored square with text "FD" (Front Desk) as a temporary icon.

### Option 3: Use ImageMagick (if installed)
```bash
# Create a simple blue square icon
convert -size 192x192 xc:#3b82f6 -gravity center -pointsize 48 -fill white -annotate +0+0 "FD" public/icon-192.png
convert -size 512x512 xc:#3b82f6 -gravity center -pointsize 128 -fill white -annotate +0+0 "FD" public/icon-512.png
```

The app will work without icons, but they're recommended for a polished experience.
