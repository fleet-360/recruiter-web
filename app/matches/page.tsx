'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useMatches } from '@/hooks/useMatches';
import { MessageSquare, User, Briefcase } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

export default function MatchesPage() {
  const { data: matches, isLoading } = useMatches();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Matches</h1>
          <p className="mt-2 text-gray-400">Your successful matches with candidates</p>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-400 py-12">Loading matches...</div>
        ) : matches && matches.length > 0 ? (
          <div className="space-y-4">
            {matches.map((match) => (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                className="block rounded-lg bg-gray-800 p-6 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {match.candidate?.avatar_url ? (
                    <Image
                      src={match.candidate.avatar_url}
                      alt={match.candidate.full_name || 'Candidate'}
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-700 flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {match.candidate?.full_name || 'Anonymous'}
                        </h3>
                        <div className="mt-1 flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {match.job?.title}
                          </div>
                          {match.created_at && (
                            <span>
                              Matched {format(new Date(match.created_at), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                      <MessageSquare className="h-5 w-5 text-green-400" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-gray-800 p-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-600" />
            <p className="mt-4 text-gray-400">No matches yet</p>
            <p className="mt-2 text-sm text-gray-500">
              Start swiping on candidates to create matches
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

