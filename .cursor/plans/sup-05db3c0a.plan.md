<!-- 05db3c0a-fd1e-46e0-a0a2-1b43419bd868 5eead88c-fd85-4216-ac86-7d5537ff32a2 -->
# Supabase Google OAuth (SSR) + Optional Usage History

## What we’ll add

- Google-only sign-in via Supabase using `@supabase/ssr` (cookie-based sessions).
- Minimal auth UI (Login/Logout) in site header; keeps current flow working without login.
- `/auth/callback` route to exchange OAuth code → session cookies (SSR-aware).
- DB tables for per-user usage history and a credits ledger (future payments), with strict RLS.
- API instrumentation to log usage when a session exists; never store user OpenAI API keys.
- Ensure `.gitignore` and update `CHANGELOG.md` per your rules.

## Dependencies

- Install: `@supabase/supabase-js`, `@supabase/ssr`

## Environment & Secrets

- Create `.env.local` (git-ignored):
  - `NEXT_PUBLIC_SUPABASE_URL=`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=`

## Supabase Console Setup

- Enable Google provider (Auth → Providers).
- Set Site URL to your domain (and `http://localhost:3000` for dev).
- Add Redirect URL: `http[s]://.../auth/callback`.

## Supabase SSR clients

- `lib/supabase/server.ts` (server): createServerClient with `cookies()` to persist session.
- `lib/supabase/client.ts` (browser): createBrowserClient for client-side calls.

## Auth routes/UI (App Router)

- `app/auth/callback/route.ts` (server): exchange `code` for a session, then redirect home.
```ts
// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  if (!code) return NextResponse.redirect(new URL('/', request.url));
  const supabase = createClient();
  await supabase.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL('/', request.url));
}
```

- `app/login/page.tsx` (client): one button to sign in with Google using redirect to `/auth/callback`.
```tsx
'use client';
import { createClient } from '@/lib/supabase/client';

export default function Login() {
  const handleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };
  return <button onClick={handleSignIn}>Sign in with Google</button>;
}
```

- `app/(auth)/actions.ts` (server action): sign out.
```ts
'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/');
}
```

- `components/HeaderAuth.tsx` (server component): read user and render Login/Logout.
```tsx
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/(auth)/actions';

export default async function HeaderAuth() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? (
    <form action={signOut}><button>Sign out</button></form>
  ) : (
    <Link href="/login">Sign in</Link>
  );
}
```

- Update `app/layout.tsx`: render `HeaderAuth` above `{children}`.

## DB schema and RLS (in `/supabase/migrations/`)

- `usage_events` for history; `credit_ledger` for future payments; optional `profiles` mirror.
```sql
-- 01_usage_and_credits.sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

create table if not exists public.usage_events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id text not null,
  model text not null,
  resolution text not null,
  seconds int not null,
  cost_usd numeric(12,4) not null,
  prompt text,
  created_at timestamp with time zone default now()
);

create table if not exists public.credit_ledger (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  delta_usd numeric(12,4) not null,
  reason text,
  ref_id text,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;
alter table public.usage_events enable row level security;
alter table public.credit_ledger enable row level security;

create policy "profiles self read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "usage self read"
  on public.usage_events for select
  using (auth.uid() = user_id);

create policy "usage self insert"
  on public.usage_events for insert
  with check (auth.uid() = user_id);

create policy "credits self read"
  on public.credit_ledger for select
  using (auth.uid() = user_id);
```


## API usage logging (only when user is signed in)

- In `app/api/generate/route.ts`: after successful create, get `user` via server client and insert a `usage_events` row with `videoId`, `model`, `size→resolution`, `seconds`, `cost` from `calculateCost` (already in `lib/pricing.ts`). Do not log/store API keys.
```ts
// inside POST success block
import { createClient } from '@/lib/supabase/server';
import { calculateCost } from '@/lib/pricing';
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  const resolution = size === '1280x720' || size === '720x1280' ? '720p' : (size.includes('1920') ? '1080p' : '1792p');
  const cost = calculateCost(model, resolution as any, Number(seconds));
  await supabase.from('usage_events').insert({
    user_id: user.id,
    video_id: video.id,
    model,
    resolution,
    seconds: Number(seconds),
    cost_usd: cost,
    prompt,
  });
}
```

- No changes to current UX: users can keep using their own API key without logging in.

## Repo hygiene

- Ensure `.gitignore` exists and ignores `.env*`, `node_modules`, build artifacts, etc.
- Add a new entry to `CHANGELOG.md` describing auth + DB + logging.

## Testing

- Local: `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` in `.env.local`; run site; click Sign in → Google → back to `/` signed in; generate a video; confirm a new row in `usage_events` with your `user_id`.

### To-dos

- [ ] Create local branch feat/supabase-google-auth (no push)
- [ ] Install @supabase/supabase-js and @supabase/ssr
- [ ] Add .env.local with Supabase URL and anon key
- [ ] Enable Google provider and add /auth/callback redirect
- [ ] Create lib/supabase/server.ts and lib/supabase/client.ts
- [ ] Add app/auth/callback/route.ts to exchange code for session
- [ ] Add login page and HeaderAuth; wire in layout
- [ ] Add usage_events, credit_ledger, profiles with RLS in /supabase
- [ ] Log usage in app/api/generate when user present
- [ ] Ensure .gitignore updates and CHANGELOG.md entry

### To-dos

- [ ] Create local branch feat/supabase-google-auth (no push)
- [ ] Install @supabase/supabase-js and @supabase/ssr
- [ ] Add .env.local with Supabase URL and anon key
- [ ] Enable Google provider and add /auth/callback redirect
- [ ] Create lib/supabase/server.ts and lib/supabase/client.ts
- [ ] Add app/auth/callback/route.ts to exchange code for session
- [ ] Add login page and HeaderAuth; wire in layout
- [ ] Add usage_events, credit_ledger, profiles with RLS in /supabase
- [ ] Log usage in app/api/generate when user present
- [ ] Ensure .gitignore updates and CHANGELOG.md entry