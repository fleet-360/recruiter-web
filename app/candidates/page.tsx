'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useCandidates } from '@/hooks/useCandidates';
import { useCreateMatch } from '@/hooks/useMatches';
import { User, MessageSquare, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';

export default function CandidatesPage() {
  const { data: candidates, isLoading } = useCandidates();
  const createMatch = useCreateMatch();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCandidates = candidates?.filter(
    (candidate) =>
      candidate.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateMatch = async (candidateId: string, jobId: string) => {
    try {
      await createMatch.mutateAsync({
        candidate_id: candidateId,
        job_id: jobId,
      });
      alert('Match created! You can now chat with this candidate.');
    } catch (error) {
      alert('Failed to create match');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Candidates</h1>
          <p className="mt-2 text-gray-400">Review candidates who swiped on your jobs</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-600 bg-gray-800 pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        {isLoading ? (
          <div className="text-center text-gray-400 py-12">Loading candidates...</div>
        ) : filteredCandidates && filteredCandidates.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCandidates.map((candidate) => (
              <div
                key={candidate._uniqueKey || `${candidate.id}-${candidate.swipe_job_id}`}
                className="rounded-lg bg-gray-800 p-6 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {candidate.avatar_url ? (
                    <Image
                      src={candidate.avatar_url}
                      alt={candidate.full_name || 'Candidate'}
                      width={64}
                      height={64}
                      className="rounded-full"
                      unoptimized
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-700 flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">
                      {candidate.full_name || 'Anonymous'}
                    </h3>
                    {candidate.city && (
                      <p className="mt-1 text-sm text-gray-400">{candidate.city}</p>
                    )}
                    {candidate.bio && (
                      <p className="mt-2 text-sm text-gray-300 line-clamp-2">{candidate.bio}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Link
                    href={`/candidates/${candidate.id}`}
                    className="flex-1 flex items-center justify-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    View Profile
                  </Link>
                  {candidate.swipe_job_id && (
                    <button
                      onClick={() => handleCreateMatch(candidate.id, candidate.swipe_job_id!)}
                      disabled={createMatch.isPending}
                      className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Match
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-gray-800 p-12 text-center">
            <p className="text-gray-400">No pending candidates</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

