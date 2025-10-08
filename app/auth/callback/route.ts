import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Auth callback error:', error);
      // Redirect to home with error (you could add ?error=auth_failed if you want)
      return NextResponse.redirect(`${origin}/`);
    }
    
    // Success - redirect to the next URL or home
    return NextResponse.redirect(`${origin}${next}`);
  }

  // No code provided - redirect to home
  console.error('Auth callback: no code provided');
  return NextResponse.redirect(`${origin}/`);
}

