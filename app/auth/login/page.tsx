'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

function ErrorMessage() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  
  if (errorParam === 'not_recruiter') {
    return (
      <div className="rounded-md bg-red-900/50 p-3 text-sm text-red-200">
        Only recruiters can access this dashboard
      </div>
    );
  }
  return null;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      if (data.user) {
        console.log('User logged in:', data.user.id);
        
        // Check if user is recruiter
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          throw profileError;
        }

        if (profile?.role !== 'recruiter') {
          await supabase.auth.signOut();
          setError('Only recruiters can access this dashboard');
          setLoading(false);
          return;
        }

        console.log('Profile verified as recruiter, redirecting...');
        
        // Wait a bit to ensure session is saved to cookies
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Verify session is saved
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('Session confirmed, redirecting to dashboard');
          // Use window.location for a full page reload to ensure session is set
          window.location.href = '/dashboard';
        } else {
          console.error('Session not saved after login');
          setError('Failed to save session. Please try again.');
          setLoading(false);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-800 p-8 shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-white">
            Recruiter Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Sign in to manage your jobs and candidates
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <Suspense fallback={null}>
            <ErrorMessage />
          </Suspense>
          {error && (
            <div className="rounded-md bg-red-900/50 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-400">Don't have an account? </span>
            <Link href="/auth/signup" className="font-medium text-green-400 hover:text-green-300">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

