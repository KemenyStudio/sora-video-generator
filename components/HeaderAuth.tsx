import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/(auth)/actions';

export default async function HeaderAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? (
    <div className="flex items-center gap-4">
      <span className="text-sm text-zinc-400">
        {user.email}
      </span>
      <form action={signOut}>
        <button
          type="submit"
          className="text-sm text-zinc-400 hover:text-zinc-200 underline"
        >
          Sign out
        </button>
      </form>
    </div>
  ) : (
    <Link
      href="/login"
      className="text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-md transition-colors"
    >
      Sign in
    </Link>
  );
}

