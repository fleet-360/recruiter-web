'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useJobs } from '@/hooks/useJobs';
import { useCandidates } from '@/hooks/useCandidates';
import { useMatches } from '@/hooks/useMatches';
import { Briefcase, Users, MessageSquare, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: jobs, isLoading: jobsLoading } = useJobs();
  const { data: candidates, isLoading: candidatesLoading } = useCandidates();
  const { data: matches, isLoading: matchesLoading } = useMatches();

  const stats = [
    {
      name: 'Active Jobs',
      value: jobs?.length || 0,
      icon: Briefcase,
      href: '/jobs',
      color: 'bg-blue-600',
    },
    {
      name: 'Pending Candidates',
      value: candidates?.length || 0,
      icon: Users,
      href: '/candidates',
      color: 'bg-yellow-600',
    },
    {
      name: 'Matches',
      value: matches?.length || 0,
      icon: MessageSquare,
      href: '/matches',
      color: 'bg-green-600',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="mt-2 text-gray-400">Overview of your recruitment activity</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <Link
              key={stat.name}
              href={stat.href}
              className="rounded-lg bg-gray-800 p-6 hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                  <p className="mt-2 text-3xl font-bold text-white">
                    {stat.name === 'Active Jobs' && jobsLoading
                      ? '...'
                      : stat.name === 'Pending Candidates' && candidatesLoading
                      ? '...'
                      : stat.name === 'Matches' && matchesLoading
                      ? '...'
                      : stat.value}
                  </p>
                </div>
                <div className={`${stat.color} rounded-lg p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="rounded-lg bg-gray-800 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/jobs/new"
              className="flex items-center justify-center rounded-md bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-500 transition-colors"
            >
              <Briefcase className="mr-2 h-5 w-5" />
              Create New Job
            </Link>
            <Link
              href="/candidates"
              className="flex items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
            >
              <Users className="mr-2 h-5 w-5" />
              View Candidates
            </Link>
            <Link
              href="/matches"
              className="flex items-center justify-center rounded-md bg-purple-600 px-4 py-3 text-sm font-medium text-white hover:bg-purple-500 transition-colors"
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              View Matches
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

