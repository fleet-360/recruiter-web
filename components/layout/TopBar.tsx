'use client';

import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export function TopBar() {
  const { profile, loading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent hydration mismatch by showing consistent content during SSR
  if (!isMounted || loading) {
    return (
      <div className="flex h-16 items-center justify-between border-b border-gray-800 bg-gray-900 px-6">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-white">Loading...</h2>
        </div>
        <div className="h-8 w-8 rounded-full bg-gray-700 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex h-16 items-center justify-between border-b border-gray-800 bg-gray-900 px-6">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-white">
          Welcome, {profile?.full_name || profile?.company_name || 'Recruiter'}
        </h2>
      </div>
      <div className="flex items-center space-x-4">
        {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt="Profile"
            width={32}
            height={32}
            className="rounded-full"
            unoptimized
            priority={false}
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-sm text-gray-300">
              {profile?.full_name?.[0]?.toUpperCase() || profile?.company_name?.[0]?.toUpperCase() || 'R'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

