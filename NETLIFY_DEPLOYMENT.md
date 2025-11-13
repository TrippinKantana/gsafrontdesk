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
   - Publish directory: `.next` (from `netlify.toml`)
   - Framework: Next.js (auto-detected)

3. **Set Environment Variables:**
   In Netlify Dashboard → Site settings → Environment variables, add:
   - `DATABASE_URL` - Your Prisma database connection string
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
   - `CLERK_SECRET_KEY` - Clerk secret key
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL` - Usually `/sign-in`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL` - Usually `/sign-up`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` - Usually `/`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` - Usually `/`
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

