'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        console.error('Sign in error:', error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  return (
    <main className="fixed inset-0 bg-zinc-950 text-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Sora Video Generator
          </h1>
          <p className="text-zinc-500 text-sm">
            Create AI videos with OpenAI&apos;s Sora API
          </p>
        </div>

        {/* Sign In Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold mb-2 text-white">Welcome</h2>
          <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
            Sign in to save your video history, track usage, and unlock premium features.
          </p>
          
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full bg-white hover:bg-zinc-100 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-zinc-950 font-semibold py-3.5 px-6 rounded-lg transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-zinc-600 border-t-zinc-300 rounded-full"></div>
                <span>Redirecting...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="mt-6 pt-6 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 text-center mb-3 leading-relaxed">
              You can still use the app without signing in by providing your own OpenAI API key.
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full text-sm text-zinc-400 hover:text-zinc-200 py-2 rounded-lg hover:bg-zinc-800/50 transition-all"
            >
              Continue without signing in →
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-600 mt-6">
          By signing in, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </main>
  );
}

