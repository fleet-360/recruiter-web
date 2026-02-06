'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useCandidate } from '@/hooks/useCandidates';
import { useCreateMatch } from '@/hooks/useMatches';
import { useParams, useRouter } from 'next/navigation';
import { User, MessageSquare, MapPin, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;
  const { data: candidate, isLoading } = useCandidate(candidateId);
  const createMatch = useCreateMatch();

  // For now, we'll need to get the job_id from somewhere - this should be passed as a query param
  // or we need to fetch the swipe info separately
  const handleCreateMatch = async (jobId: string) => {
    try {
      await createMatch.mutateAsync({
        candidate_id: candidateId,
        job_id: jobId,
      });
      router.push(`/matches`);
    } catch (error: any) {
      alert(error.message || 'Failed to create match');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center text-gray-400 py-12">Loading candidate...</div>
      </DashboardLayout>
    );
  }

  if (!candidate) {
    return (
      <DashboardLayout>
        <div className="text-center text-gray-400 py-12">Candidate not found</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Candidate Profile</h1>
          <button
            onClick={() => router.back()}
            className="rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 transition-colors"
          >
            Back
          </button>
        </div>

        <div className="rounded-lg bg-gray-800 p-6">
          <div className="flex items-start gap-6">
            {candidate.avatar_url ? (
              <Image
                src={candidate.avatar_url}
                alt={candidate.full_name || 'Candidate'}
                width={128}
                height={128}
                className="rounded-full"
                unoptimized
              />
            ) : (
              <div className="h-32 w-32 rounded-full bg-gray-700 flex items-center justify-center">
                <User className="h-16 w-16 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">
                {candidate.full_name || 'Anonymous'}
              </h2>
              {candidate.city && (
                <div className="mt-2 flex items-center gap-2 text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span>{candidate.city}</span>
                </div>
              )}
              {candidate.bio && (
                <p className="mt-4 text-gray-300">{candidate.bio}</p>
              )}
            </div>
          </div>

          {candidate.resume_url && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-2">Resume</h3>
              <Link
                href={candidate.resume_url}
                target="_blank"
                className="inline-flex items-center gap-2 text-green-400 hover:text-green-300"
              >
                <LinkIcon className="h-4 w-4" />
                View Resume
              </Link>
            </div>
          )}

          {candidate.portfolio_images && candidate.portfolio_images.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Portfolio</h3>
              <div className="grid grid-cols-3 gap-4">
                {candidate.portfolio_images.map((imageUrl, index) => (
                  <Image
                    key={index}
                    src={imageUrl}
                    alt={`Portfolio ${index + 1}`}
                    width={200}
                    height={200}
                    className="rounded-lg object-cover"
                    unoptimized
                  />
                ))}
              </div>
            </div>
          )}

          {candidate.social_links && candidate.social_links.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-2">Social Links</h3>
              <div className="flex flex-wrap gap-4">
                {candidate.social_links.map((link, index) => (
                  <Link
                    key={index}
                    href={link.url}
                    target="_blank"
                    className="inline-flex items-center gap-2 text-green-400 hover:text-green-300"
                  >
                    <LinkIcon className="h-4 w-4" />
                    {link.platform}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

