# Supabase Setup Guide

This directory contains database migrations for the Sora Video Generator authentication and usage tracking system.

## Prerequisites

1. A Supabase account: https://supabase.com
2. A new Supabase project created

## Setup Steps

### 1. Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New project"
3. Choose an organization and project name
4. Set a secure database password (save this!)
5. Select a region close to your users
6. Click "Create new project"

### 2. Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (under "Project API keys")

### 3. Configure Environment Variables

1. Create a `.env.local` file in the project root (it's git-ignored):

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

2. You can use `.env.local.example` as a template

### 4. Run Database Migrations

You have two options:

#### Option A: Using Supabase SQL Editor (Recommended for first time)

1. Go to your Supabase dashboard → **SQL Editor**
2. Click "New query"
3. Copy the contents of `migrations/20250108000000_usage_and_credits.sql`
4. Paste into the editor and click "Run"
5. Verify tables were created in **Database** → **Tables**

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 5. Enable Google OAuth

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click to configure
3. Enable Google provider
4. Add your Google OAuth credentials:
   - Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
5. Copy the Client ID and Client Secret to Supabase
6. Save the configuration

### 6. Configure Auth Settings

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your production domain (e.g., `https://yourdomain.com`)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (for local development)
   - `https://yourdomain.com/auth/callback` (for production)
4. Save changes

### 7. Verify Setup

1. Start your Next.js app: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Click "Sign in" in the top-right corner
4. Test Google sign-in flow
5. After signing in, generate a test video
6. Check Supabase dashboard → **Database** → **Table Editor** → `usage_events`
7. You should see a new row with your video generation logged

## Database Schema

### Tables Created

- **profiles**: Mirrors auth.users for extended user data
- **usage_events**: Logs all video generations for signed-in users
- **credit_ledger**: Foundation for future payment system

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only read their own data
- Users can only insert their own usage events
- Admin queries require service role key

## Troubleshooting

### "Missing environment variables" error
- Ensure `.env.local` exists with correct values
- Restart your Next.js dev server after adding env vars

### Google OAuth not working
- Verify redirect URIs match exactly in Google Console and Supabase
- Check that Google provider is enabled in Supabase Auth settings
- Ensure Site URL is set correctly in Supabase

### Usage not being logged
- Check browser console for errors
- Verify you're signed in (check for email in header)
- Inspect Network tab for failed API calls to Supabase
- Check Supabase logs in dashboard

### RLS Policy Errors
- Ensure you're using the anon key (not service role key) in Next.js
- Verify user is properly authenticated before database operations
- Check Supabase logs for policy violation details

## Security Notes

- Never commit `.env.local` to git (already in `.gitignore`)
- Never expose your Supabase service role key in client code
- The anon key is safe to use in browser code (protected by RLS)
- User OpenAI API keys are NEVER stored in the database
- All database queries are protected by Row Level Security

## Next Steps

Once authentication is working, you can:
1. Add a user dashboard to view usage history
2. Implement the credit purchase system using `credit_ledger`
3. Add usage analytics and cost tracking
4. Enable server-side video generation using pooled API keys
5. Add user profile customization

