'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useJobs, useDeleteJob } from '@/hooks/useJobs';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function JobsPage() {
  const { data: jobs, isLoading } = useJobs();
  const deleteJob = useDeleteJob();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredJobs = jobs?.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (jobId: string) => {
    if (confirm('Are you sure you want to delete this job?')) {
      try {
        await deleteJob.mutateAsync(jobId);
      } catch (error) {
        alert('Failed to delete job');
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Jobs</h1>
            <p className="mt-2 text-gray-400">Manage your job postings</p>
          </div>
          <Link
            href="/jobs/new"
            className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Job
          </Link>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs by title or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-600 bg-gray-800 pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        {isLoading ? (
          <div className="text-center text-gray-400 py-12">Loading jobs...</div>
        ) : filteredJobs && filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-lg bg-gray-800 p-6 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                    <p className="mt-1 text-sm text-gray-400">{job.company}</p>
                    {job.location && (
                      <p className="mt-2 text-sm text-gray-500">{job.location}</p>
                    )}
                    {job.salary_range && (
                      <p className="mt-1 text-sm text-green-400">{job.salary_range}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(job.id)}
                    className="flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-gray-800 p-12 text-center">
            <p className="text-gray-400">No jobs found</p>
            <Link
              href="/jobs/new"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create your first job
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

