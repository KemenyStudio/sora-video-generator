# Supabase Authentication Setup

This guide will walk you through setting up Google OAuth authentication with Supabase for the Sora Video Generator.

## Quick Start

### 1. Install Dependencies ✅

Dependencies are already installed:
- `@supabase/supabase-js`
- `@supabase/ssr`

### 2. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New project"**
3. Fill in project details:
   - Organization: Choose or create one
   - Project name: e.g., "sora-video-generator"
   - Database password: Use a strong password (save it!)
   - Region: Choose closest to your users
4. Click **"Create new project"** (takes ~2 minutes)

### 3. Get API Credentials

Once your project is created:

1. Go to **Settings** (⚙️ in sidebar) → **API**
2. Copy these two values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long string under "Project API keys"

### 4. Configure Environment Variables

Create `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

⚠️ **Important**: Never commit `.env.local` to git (already in `.gitignore`)

### 5. Run Database Migrations

Go to your Supabase dashboard:

1. Click **SQL Editor** in the sidebar
2. Click **"New query"**
3. Copy the entire contents of `/supabase/migrations/20250108000000_usage_and_credits.sql`
4. Paste into the editor
5. Click **"Run"** or press `Ctrl/Cmd + Enter`
6. Verify success: You should see "Success. No rows returned"

To verify tables were created:
1. Go to **Database** → **Tables** in sidebar
2. You should see: `profiles`, `usage_events`, `credit_ledger`

### 6. Configure Google OAuth

#### A. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **"Create Credentials"** → **"OAuth client ID"**
5. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: "Sora Video Generator"
   - User support email: Your email
   - Developer contact: Your email
   - Save and continue through all steps
6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: "Sora Video Generator"
   - Authorized redirect URIs, add:
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     ```
   - Click **"Create"**
7. Copy the **Client ID** and **Client Secret**

#### B. Enable Google in Supabase

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** in the list
3. Toggle it to **Enabled**
4. Paste your Google **Client ID** and **Client Secret**
5. Click **"Save"**

### 7. Configure Auth URLs

1. In Supabase, go to **Authentication** → **URL Configuration**
2. Set **Site URL**: 
   - For production: `https://your-domain.com`
   - For dev: `http://localhost:3000`
3. Add **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   https://your-domain.com/auth/callback
   ```
4. Click **"Save"**

### 8. Test the Setup

1. Start your Next.js dev server:
   ```bash
   npm run dev
   ```

2. Open `http://localhost:3000`

3. Click **"Sign in"** in the top-right corner

4. Click **"Continue with Google"**

5. Complete Google sign-in flow

6. You should be redirected back to the homepage

7. Verify:
   - Your email should appear in the top-right corner
   - "Sign out" button should be visible

### 9. Test Usage Logging

1. While signed in, generate a test video:
   - Enter your OpenAI API key
   - Fill in a prompt
   - Click "Generate Now"

2. After generation completes, verify logging:
   - Go to Supabase dashboard
   - Navigate to **Database** → **Table Editor** → **usage_events**
   - You should see a row with your video details

## Architecture Overview

### Authentication Flow

```
User clicks "Sign in"
  → Redirects to Google OAuth
  → User authorizes
  → Google redirects to /auth/callback
  → Exchange code for session
  → Set session cookies
  → Redirect to homepage (signed in)
```

### Database Schema

**profiles**
- `id` (uuid, primary key) - References auth.users
- `created_at` (timestamp) - When profile was created

**usage_events**
- `id` (bigserial, primary key)
- `user_id` (uuid) - References auth.users
- `video_id` (text) - OpenAI video ID
- `model` (text) - sora-2 or sora-2-pro
- `resolution` (text) - 720p, 1080p, or 1792p
- `seconds` (int) - Video duration
- `cost_usd` (numeric) - Generation cost
- `prompt` (text) - Video prompt
- `created_at` (timestamp) - When generated

**credit_ledger** (for future payment system)
- `id` (bigserial, primary key)
- `user_id` (uuid) - References auth.users
- `delta_usd` (numeric) - Credit change amount
- `reason` (text) - Purchase, deduction, refund, etc.
- `ref_id` (text) - Reference to related transaction
- `created_at` (timestamp)

All tables have Row Level Security (RLS) enabled - users can only access their own data.

## Important Notes

### Privacy & Security

✅ **We DO store:**
- User email (via Supabase auth)
- Video generation history (video IDs, prompts, costs)
- Usage metadata (model, resolution, duration)

❌ **We NEVER store:**
- User OpenAI API keys (stored only in browser localStorage)
- Video files themselves (stored in OpenAI's cloud)
- Payment information (will use Stripe when implemented)

### Optional Sign-In

- Users can use the app **without signing in**
- Just provide their own OpenAI API key
- No usage logging happens for anonymous users
- History is stored only in browser localStorage

### Future Features (Prepared For)

The database is ready for:
- Credit purchase system (`credit_ledger` table)
- Server-side video generation (using platform API keys)
- Usage analytics and cost tracking
- User dashboards

## Troubleshooting

### "NEXT_PUBLIC_SUPABASE_URL is not defined"
- Ensure `.env.local` exists in project root
- Check that variable names match exactly (including `NEXT_PUBLIC_` prefix)
- Restart Next.js dev server after creating `.env.local`

### Google OAuth Redirect Mismatch
- Verify redirect URI in Google Console matches Supabase exactly
- Check that you've added the redirect URI to Supabase Auth settings
- Ensure no trailing slashes in URLs

### "row-level security policy violation"
- You're likely using the wrong Supabase key
- Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` (not service role key)
- Verify user is authenticated before database operations

### Usage Not Being Logged
- Check browser console for errors
- Verify you're signed in (email should show in header)
- Look at Network tab for failed Supabase requests
- Check Supabase logs: Dashboard → Logs → Postgres

### Database Migration Failed
- Ensure you copied the entire SQL file contents
- Try running the migration in smaller chunks
- Check Supabase logs for specific error messages
- Verify your project has sufficient database resources

## Next Steps

Once authentication is working:

1. **View Usage History**: Create a dashboard page to display `usage_events`
2. **Add Credits System**: Implement purchasing flow with Stripe
3. **Server-Side Generation**: Let users generate videos without their own API key
4. **Usage Analytics**: Track trends, popular models, cost optimization
5. **User Profiles**: Allow users to customize preferences

## Support

For issues:
1. Check Supabase logs: Dashboard → Logs
2. Check browser console for errors
3. Review `/supabase/README.md` for detailed troubleshooting
4. Open an issue on GitHub

---

**Ready to test?** Start your dev server and click "Sign in"! 🚀

