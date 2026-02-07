'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useCreateJob } from '@/hooks/useJobs';
import { useSubCompanies } from '@/hooks/useSubCompanies';
import { CitySelector, City } from '@/components/jobs/CitySelector';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { uploadPDF, uploadImage, STORAGE_BUCKETS } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { useDropzone } from 'react-dropzone';

const jobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().optional(),
  salary_range: z.string().optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

export default function NewJobPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const createJob = useCreateJob();
  const { data: subCompanies } = useSubCompanies();
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [jobPdfUrl, setJobPdfUrl] = useState<string>('');
  const [jobImageUrl, setJobImageUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [selectedSubCompanyId, setSelectedSubCompanyId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
  });

  const onDropPDF = async (acceptedFiles: File[]) => {
    console.log('onDropPDF called', { user: !!user, filesCount: acceptedFiles.length });
    if (!user) {
      alert('Please log in to upload files');
      return;
    }
    if (acceptedFiles.length === 0) {
      console.log('No files accepted');
      return;
    }
    setUploading(true);
    try {
      console.log('Starting PDF upload...', acceptedFiles[0].name);
      const result = await uploadPDF(STORAGE_BUCKETS.JOB_DOCUMENTS, acceptedFiles[0], user.id);
      console.log('Upload result:', result);
      if (result.url) {
        setJobPdfUrl(result.url);
      } else {
        alert(result.error?.message || 'Failed to upload PDF');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const onDropRejectedPDF = (fileRejections: any[]) => {
    console.log('PDF rejected:', fileRejections);
    const reasons = fileRejections.map(({ file, errors }) => ({
      file: file.name,
      errors: errors.map((e: any) => e.message),
    }));
    alert('File rejected: ' + JSON.stringify(reasons, null, 2));
  };

  const { getRootProps: getPDFRootProps, getInputProps: getPDFInputProps } = useDropzone({
    onDrop: onDropPDF,
    onDropRejected: onDropRejectedPDF,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  const onDropImage = async (acceptedFiles: File[]) => {
    console.log('onDropImage called', { user: !!user, filesCount: acceptedFiles.length });
    if (!user) {
      alert('Please log in to upload files');
      return;
    }
    if (acceptedFiles.length === 0) {
      console.log('No files accepted');
      return;
    }
    setUploading(true);
    try {
      console.log('Starting image upload...', acceptedFiles[0].name);
      const result = await uploadImage(STORAGE_BUCKETS.JOB_IMAGES, acceptedFiles[0], user.id);
      console.log('Upload result:', result);
      if (result.url) {
        setJobImageUrl(result.url);
      } else {
        alert(result.error?.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const onDropRejectedImage = (fileRejections: any[]) => {
    console.log('Image rejected:', fileRejections);
    const reasons = fileRejections.map(({ file, errors }) => ({
      file: file.name,
      errors: errors.map((e: any) => e.message),
    }));
    alert('File rejected: ' + JSON.stringify(reasons, null, 2));
  };

  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps } = useDropzone({
    onDrop: onDropImage,
    onDropRejected: onDropRejectedImage,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxFiles: 1,
  });

  const onSubmit = async (data: JobFormData) => {
    console.log('onSubmit called', { data, selectedSubCompanyId, profile, subCompanies, errors });
    if (Object.keys(errors).length > 0) {
      console.error('Form validation errors:', errors);
      return;
    }
    try {
      // Determine company name and sub_company_id automatically
      let finalCompanyName: string;
      let finalSubCompanyId: string | null = null;

      if (selectedSubCompanyId) {
        const selectedSubCompany = subCompanies?.find(sc => sc.id === selectedSubCompanyId);
        if (selectedSubCompany) {
          finalCompanyName = selectedSubCompany.name;
          finalSubCompanyId = selectedSubCompany.id;
        } else {
          throw new Error('Selected sub-company not found');
        }
      } else {
        // Using main company
        if (!profile?.company_name) {
          throw new Error('Company name is required. Please set your company name in profile settings.');
        }
        finalCompanyName = profile.company_name;
        finalSubCompanyId = null;
      }

      console.log('Creating job with data:', {
        title: data.title,
        company: finalCompanyName,
        sub_company_id: finalSubCompanyId,
        description: data.description,
        location: selectedCity ? selectedCity.display_name : (data.location || null),
        city_lat: selectedCity ? parseFloat(selectedCity.lat) : null,
        city_lon: selectedCity ? parseFloat(selectedCity.lon) : null,
        salary_range: data.salary_range || null,
        job_pdf_url: jobPdfUrl || null,
        job_image_url: jobImageUrl || null,
      });

      const result = await createJob.mutateAsync({
        title: data.title,
        company: finalCompanyName,
        sub_company_id: finalSubCompanyId,
        description: data.description,
        location: selectedCity ? selectedCity.display_name : (data.location || null),
        city_lat: selectedCity ? parseFloat(selectedCity.lat) : null,
        city_lon: selectedCity ? parseFloat(selectedCity.lon) : null,
        salary_range: data.salary_range || null,
        job_pdf_url: jobPdfUrl || null,
        job_image_url: jobImageUrl || null,
      } as any);
      
      console.log('Job created successfully:', result);
      router.push('/jobs');
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Failed to create job: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Create New Job</h1>
          <p className="mt-2 text-gray-400">Post a new job opening</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="rounded-lg bg-gray-800 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">Job Title *</label>
              <input
                {...register('title')}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="e.g., Senior Software Engineer"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Company</label>
              <select
                value={selectedSubCompanyId || ''}
                onChange={(e) => {
                  setSelectedSubCompanyId(e.target.value || null);
                }}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">Main Company ({profile?.company_name || 'Your Company'})</option>
                {subCompanies?.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-400">
                {selectedSubCompanyId 
                  ? `Selected: ${subCompanies?.find(sc => sc.id === selectedSubCompanyId)?.name || 'Sub-company'}`
                  : `Using: ${profile?.company_name || 'Your Company'}`
                }
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Description *</label>
              <textarea
                {...register('description')}
                rows={6}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Job description..."
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
                placeholder="e.g., $50k - $80k"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Job Document (PDF)</label>
              <div
                {...getPDFRootProps()}
                className="cursor-pointer rounded-md border-2 border-dashed border-gray-600 bg-gray-700 p-4 text-center hover:border-green-500 transition-colors"
              >
                <input {...getPDFInputProps()} />
                {uploading ? (
                  <p className="text-sm text-yellow-400">Uploading...</p>
                ) : jobPdfUrl ? (
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
                {uploading ? (
                  <p className="text-sm text-yellow-400">Uploading...</p>
                ) : jobImageUrl ? (
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
              disabled={createJob.isPending || uploading}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createJob.isPending ? 'Creating...' : 'Create Job'}
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

