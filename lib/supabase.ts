'use client';

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // During build time, provide placeholder values to prevent build failures
  // These will be replaced with actual values at runtime if set in the deployment environment
  console.error(
    '⚠️ Missing Supabase environment variables!\n' +
    'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment environment.\n' +
    'For Netlify: Go to Site settings → Environment variables → Add the required variables.'
  );
}

// Create client with actual values or placeholders
// The build will succeed, but the app will fail at runtime if variables aren't set
export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

