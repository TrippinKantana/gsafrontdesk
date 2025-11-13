# Netlify Troubleshooting Guide

## ERR_FAILED Error - Site Can't Be Reached

If you see `ERR_FAILED` or "This site can't be reached", try these steps:

### 1. Check Build Status

1. Go to Netlify Dashboard → Your site → **Deploys** tab
2. Check if the latest deploy shows:
   - ✅ **Published** (green checkmark)
   - ❌ **Failed** (red X)
   - ⏳ **Building** (yellow spinner)

**If build failed:**
- Click on the failed deploy to see error logs
- Common issues:
  - Missing environment variables
  - Prisma client not generated
  - TypeScript errors
  - Build timeout

### 2. Verify Netlify Configuration

Check that `netlify.toml` is correct:

```toml
[build]
  command = "npm run build"
  # Don't set publish directory when using @netlify/plugin-nextjs

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

**Important:** When using `@netlify/plugin-nextjs`, you should NOT set a `publish` directory - the plugin handles it automatically.

### 3. Check Environment Variables

1. Go to **Site settings** → **Environment variables**
2. Verify these are set:
   - `DATABASE_URL` ✅
   - `NEXT_PUBLIC_APP_URL` ✅ (should be your Netlify URL with https)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` ✅
   - `CLERK_SECRET_KEY` ✅
   - `RESEND_API_KEY` ✅
   - `FROM_EMAIL` ✅

3. **After adding/updating environment variables:**
   - You MUST trigger a new deploy
   - Go to **Deploys** → **Trigger deploy** → **Deploy site**

### 4. Check Build Logs

1. Go to **Deploys** tab
2. Click on the latest deploy
3. Expand the build log
4. Look for errors like:
   - `Error: Failed to collect page data`
   - `Module not found`
   - `Prisma Client not generated`
   - `Environment variable not found`

### 5. Verify Next.js Plugin is Installed

The `@netlify/plugin-nextjs` plugin should be automatically installed during build. Check build logs for:

```
Installing @netlify/plugin-nextjs
```

If you see errors about the plugin, you may need to:
1. Check your `package.json` - the plugin is installed automatically by Netlify
2. Verify your `netlify.toml` has the plugin configuration

### 6. Clear Cache and Redeploy

1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Clear cache and deploy site**
3. Wait for build to complete

### 7. Check Function Logs

1. Go to **Functions** tab (if available)
2. Check for any function errors
3. Look for runtime errors in serverless functions

### 8. Verify Domain Configuration

1. Go to **Domain settings**
2. Check that your Netlify subdomain is properly configured
3. If using a custom domain, verify DNS settings

### 9. Test Build Locally

To verify your build works:

```bash
npm install
npm run build
```

If local build fails, fix those errors first before deploying.

### 10. Common Issues and Solutions

#### Issue: "Prisma Client not generated"
**Solution:** Add to `package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

#### Issue: "Environment variable not found"
**Solution:** 
- Add variable in Netlify Dashboard → Environment variables
- Trigger a new deploy after adding

#### Issue: "Module not found"
**Solution:**
- Check that all dependencies are in `package.json`
- Run `npm install` locally to verify
- Check build logs for missing packages

#### Issue: "Build timeout"
**Solution:**
- Netlify free tier has 15-minute build limit
- Optimize build: remove unused dependencies
- Consider upgrading plan if needed

#### Issue: "Failed to collect page data"
**Solution:**
- This is usually a Next.js static analysis issue
- Check that all pages have proper route segment configs
- Verify no client components export route configs

## Still Not Working?

1. **Check Netlify Status:**
   - Visit [status.netlify.com](https://status.netlify.com)
   - Check if there are any service outages

2. **Contact Support:**
   - Netlify Dashboard → Help → Contact support
   - Include:
     - Site URL
     - Build log
     - Error messages
     - Steps you've tried

3. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Check Console tab for JavaScript errors
   - Check Network tab for failed requests

4. **Try Different Browser:**
   - Sometimes browser cache causes issues
   - Try incognito/private mode
   - Clear browser cache

## Quick Checklist

- [ ] Build status shows "Published" (not "Failed")
- [ ] All required environment variables are set
- [ ] `netlify.toml` is configured correctly (no publish directory with plugin)
- [ ] `@netlify/plugin-nextjs` is in plugins section
- [ ] Build logs show no errors
- [ ] Redeployed after changing environment variables
- [ ] Cleared cache and redeployed
- [ ] Local build works (`npm run build`)

