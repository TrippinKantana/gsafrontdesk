# Netlify Deployment Guide

This project is configured for deployment on Netlify.

## Configuration Files

### `netlify.toml`
The main Netlify configuration file that specifies:
- Build command: `npm run build`
- Publish directory: `.next`
- Node.js version: 20
- Next.js plugin: `@netlify/plugin-nextjs` (automatically installed)

## Setup Steps

1. **Connect your repository to Netlify:**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git provider (GitHub, GitLab, or Bitbucket)
   - Select your repository

2. **Netlify will auto-detect the settings:**
   - Build command: `npm run build` (from `netlify.toml`)
   - Framework: Next.js (auto-detected)
   
   ⚠️ **CRITICAL**: When using `@netlify/plugin-nextjs`, you MUST NOT set a publish directory:
   - Go to **Site settings** → **Build & deploy** → **Build settings**
   - **Clear/remove** the "Publish directory" field (leave it empty)
   - The Next.js plugin handles the output automatically
   - If publish directory is set, you'll get: "Your publish directory cannot be the same as the base directory"

3. **Set Environment Variables:**
   ⚠️ **CRITICAL**: See [NETLIFY_ENV_SETUP.md](./NETLIFY_ENV_SETUP.md) for detailed instructions.
   
   **Most Important**: Update `NEXT_PUBLIC_APP_URL` to your Netlify URL:
   - Change from: `http://localhost:3000`
   - Change to: `https://your-site.netlify.app` (use HTTPS!)
   
   In Netlify Dashboard → Site settings → Environment variables, add:
   - `DATABASE_URL` - Your Prisma database connection string
   - `NEXT_PUBLIC_APP_URL` - **MUST be your Netlify URL** (e.g., `https://cosmic-cannoli-ea8d1e.netlify.app`)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
   - `CLERK_SECRET_KEY` - Clerk secret key
   - `RESEND_API_KEY` - Resend API key (for emails)
   - `FROM_EMAIL` - Sender email address
   - Any other environment variables your app needs

4. **Prisma Setup:**
   - Add a build command that generates Prisma client:
     ```
     npm install && npx prisma generate && npm run build
     ```
   - Or add `prisma generate` as a postinstall script in `package.json`

5. **Deploy:**
   - Netlify will automatically deploy on every push to your main branch
   - Or trigger a manual deploy from the Netlify dashboard
   
6. **⚠️ After Updating Environment Variables:**
   - **You MUST redeploy** after changing environment variables
   - Go to **Deploys** tab → Click **Trigger deploy** → **Deploy site**
   - Environment variables are only available during build time for `NEXT_PUBLIC_*` variables

## Build Configuration

The `netlify.toml` file includes:
- **Build settings**: Node 20, build command, publish directory
- **Next.js plugin**: Automatically handles routing and serverless functions
- **Security headers**: XSS protection, frame options, content type options
- **Caching headers**: Optimized caching for static assets and images
- **Service worker support**: Proper headers for PWA functionality

## Important Notes

1. **Prisma Client Generation:**
   Netlify needs to generate the Prisma client during build. You may need to:
   - Add `prisma generate` to your build process
   - Or add it as a postinstall script in `package.json`

2. **Environment Variables:**
   Make sure all required environment variables are set in Netlify dashboard

3. **Database Migrations:**
   Run migrations manually or add them to your build process if needed

4. **Build Time:**
   Netlify builds can take 5-10 minutes depending on your project size

## Troubleshooting

- **Build fails with Prisma errors**: Add `npx prisma generate` to build command
- **Environment variables not working**: Check they're set in Netlify dashboard (not just `.env` file)
- **Routing issues**: The Next.js plugin handles this automatically
- **API routes not working**: Ensure they're in the `app/api` directory

## Differences from Vercel

- Netlify uses `netlify.toml` instead of `vercel.json`
- Netlify uses `@netlify/plugin-nextjs` for Next.js support
- Build process is similar but Netlify may have different build environment

