'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateProfile } from '@/hooks/useProfile';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { uploadImage, STORAGE_BUCKETS } from '@/lib/storage';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

const profileSchema = z.object({
  full_name: z.string().optional(),
  company_name: z.string().optional(),
  company_website: z.string().url().optional().or(z.literal('')),
  bio: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const updateProfile = useUpdateProfile();
  const [avatarUrl, setAvatarUrl] = useState<string>(profile?.avatar_url || '');
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      company_name: profile?.company_name || '',
      company_website: profile?.company_website || '',
      bio: profile?.bio || '',
    },
  });

  const onDropImage = async (acceptedFiles: File[]) => {
    if (!user || acceptedFiles.length === 0) return;
    setUploading(true);
    try {
      const result = await uploadImage(STORAGE_BUCKETS.AVATARS, acceptedFiles[0], user.id);
      if (result.url) {
        setAvatarUrl(result.url);
      } else {
        alert(result.error?.message || 'Failed to upload image');
      }
    } catch (error) {
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: onDropImage,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxFiles: 1,
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync({
        full_name: data.full_name || null,
        company_name: data.company_name || null,
        company_website: data.company_website || null,
        bio: data.bio || null,
        avatar_url: avatarUrl || null,
      });
      await refreshProfile();
      alert('Profile updated successfully');
    } catch (error) {
      alert('Failed to update profile');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
          <p className="mt-2 text-gray-400">Manage your profile information</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="rounded-lg bg-gray-800 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Avatar</label>
              <div
                {...getRootProps()}
                className="cursor-pointer w-32 h-32 rounded-full border-2 border-dashed border-gray-600 bg-gray-700 flex items-center justify-center hover:border-green-500 transition-colors overflow-hidden"
              >
                <input {...getInputProps()} />
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Avatar"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-sm">Upload</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Full Name</label>
              <input
                {...register('full_name')}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Company Name</label>
              <input
                {...register('company_name')}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Company Website</label>
              <input
                {...register('company_website')}
                type="url"
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="https://example.com"
              />
              {errors.company_website && (
                <p className="mt-1 text-sm text-red-400">Invalid URL</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Bio</label>
              <textarea
                {...register('bio')}
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={updateProfile.isPending || uploading}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updateProfile.isPending ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

