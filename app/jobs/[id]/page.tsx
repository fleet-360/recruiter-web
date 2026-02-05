'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useJob, useUpdateJob, useDeleteJob } from '@/hooks/useJobs';
import { CitySelector, City } from '@/components/jobs/CitySelector';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { uploadPDF, uploadImage, STORAGE_BUCKETS } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { useDropzone } from 'react-dropzone';

const jobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  company: z.string().min(1, 'Company is required'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().optional(),
  salary_range: z.string().optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const { user } = useAuth();
  const { data: job, isLoading } = useJob(jobId);
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [jobPdfUrl, setJobPdfUrl] = useState<string>('');
  const [jobImageUrl, setJobImageUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
  });

  useEffect(() => {
    if (job) {
      reset({
        title: job.title,
        company: job.company,
        description: job.description,
        location: job.location || '',
        salary_range: job.salary_range || '',
      });
      setJobPdfUrl(job.job_pdf_url || '');
      setJobImageUrl(job.job_image_url || '');
      if (job.city_lat && job.city_lon) {
        setSelectedCity({
          display_name: job.location || '',
          name: job.location?.split(',')[0] || '',
          country: job.location?.split(',').pop()?.trim() || '',
          lat: job.city_lat.toString(),
          lon: job.city_lon.toString(),
        });
      }
    }
  }, [job, reset]);

  const onDropPDF = async (acceptedFiles: File[]) => {
    if (!user || acceptedFiles.length === 0) return;
    setUploading(true);
    try {
      const result = await uploadPDF(STORAGE_BUCKETS.JOB_DOCUMENTS, acceptedFiles[0], user.id);
      if (result.url) {
        setJobPdfUrl(result.url);
      } else {
        alert(result.error?.message || 'Failed to upload PDF');
      }
    } catch (error) {
      alert('Failed to upload PDF');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps: getPDFRootProps, getInputProps: getPDFInputProps } = useDropzone({
    onDrop: onDropPDF,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  const onDropImage = async (acceptedFiles: File[]) => {
    if (!user || acceptedFiles.length === 0) return;
    setUploading(true);
    try {
      const result = await uploadImage(STORAGE_BUCKETS.JOB_IMAGES, acceptedFiles[0], user.id);
      if (result.url) {
        setJobImageUrl(result.url);
      } else {
        alert(result.error?.message || 'Failed to upload image');
      }
    } catch (error) {
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps } = useDropzone({
    onDrop: onDropImage,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxFiles: 1,
  });

  const onSubmit = async (data: JobFormData) => {
    try {
      await updateJob.mutateAsync({
        id: jobId,
        title: data.title,
        company: data.company,
        description: data.description,
        location: selectedCity ? selectedCity.display_name : (data.location || null),
        city_lat: selectedCity ? parseFloat(selectedCity.lat) : null,
        city_lon: selectedCity ? parseFloat(selectedCity.lon) : null,
        salary_range: data.salary_range || null,
        job_pdf_url: jobPdfUrl || null,
        job_image_url: jobImageUrl || null,
      });
      router.push('/jobs');
    } catch (error) {
      alert('Failed to update job');
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this job?')) {
      try {
        await deleteJob.mutateAsync(jobId);
        router.push('/jobs');
      } catch (error) {
        alert('Failed to delete job');
      }
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center text-gray-400 py-12">Loading job...</div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="text-center text-gray-400 py-12">Job not found</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Edit Job</h1>
            <p className="mt-2 text-gray-400">Update job details</p>
          </div>
          <button
            onClick={handleDelete}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors"
          >
            Delete Job
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="rounded-lg bg-gray-800 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">Job Title *</label>
              <input
                {...register('title')}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Company *</label>
              <input
                {...register('company')}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              {errors.company && (
                <p className="mt-1 text-sm text-red-400">{errors.company.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Description *</label>
              <textarea
                {...register('description')}
                rows={6}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Location</label>
              <CitySelector
                value={selectedCity?.display_name || ''}
                onSelect={setSelectedCity}
                placeholder="Search for a city..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Salary Range</label>
              <input
                {...register('salary_range')}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Job Document (PDF)</label>
              <div
                {...getPDFRootProps()}
                className="cursor-pointer rounded-md border-2 border-dashed border-gray-600 bg-gray-700 p-4 text-center hover:border-green-500 transition-colors"
              >
                <input {...getPDFInputProps()} />
                {jobPdfUrl ? (
                  <p className="text-sm text-green-400">PDF uploaded: {jobPdfUrl.split('/').pop()}</p>
                ) : (
                  <p className="text-sm text-gray-400">Drop PDF here or click to upload</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Job Image</label>
              <div
                {...getImageRootProps()}
                className="cursor-pointer rounded-md border-2 border-dashed border-gray-600 bg-gray-700 p-4 text-center hover:border-green-500 transition-colors"
              >
                <input {...getImageInputProps()} />
                {jobImageUrl ? (
                  <div className="space-y-2">
                    <img src={jobImageUrl} alt="Job" className="mx-auto h-32 w-auto rounded" />
                    <p className="text-sm text-green-400">Image uploaded</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Drop image here or click to upload</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={updateJob.isPending || uploading}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updateJob.isPending ? 'Updating...' : 'Update Job'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

