'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateProfile } from '@/hooks/useProfile';
import { useSubCompanies, useCreateSubCompany, useUpdateSubCompany, useDeleteSubCompany } from '@/hooks/useSubCompanies';
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
  
  // Sub companies
  const { data: subCompanies } = useSubCompanies();
  const createSubCompany = useCreateSubCompany();
  const updateSubCompany = useUpdateSubCompany();
  const deleteSubCompany = useDeleteSubCompany();
  const [showSubCompanyModal, setShowSubCompanyModal] = useState(false);
  const [editingSubCompany, setEditingSubCompany] = useState<any>(null);
  const [subCompanyName, setSubCompanyName] = useState('');
  const [subCompanyLogoUrl, setSubCompanyLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

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
                    unoptimized
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

          {/* Sub Companies Management */}
          <div className="rounded-lg bg-gray-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Sub Companies</h2>
                <p className="text-sm text-gray-400 mt-1">Manage sub companies for your job postings</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingSubCompany(null);
                  setSubCompanyName('');
                  setSubCompanyLogoUrl('');
                  setShowSubCompanyModal(true);
                }}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 transition-colors"
              >
                Add Sub Company
              </button>
            </div>

            {subCompanies && subCompanies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subCompanies.map((subCompany) => (
                  <div key={subCompany.id} className="bg-gray-900 rounded-lg p-4 flex items-center space-x-3">
                    {subCompany.logo_url ? (
                      <Image
                        src={subCompany.logo_url}
                        alt={subCompany.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-lg object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">Logo</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{subCompany.name}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSubCompany(subCompany);
                          setSubCompanyName(subCompany.name);
                          setSubCompanyLogoUrl(subCompany.logo_url || '');
                          setShowSubCompanyModal(true);
                        }}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this sub company?')) {
                            try {
                              await deleteSubCompany.mutateAsync(subCompany.id);
                            } catch (error) {
                              alert('Failed to delete sub company');
                            }
                          }
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No sub companies yet. Create one to get started.</p>
            )}
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

        {/* Sub Company Modal */}
        {showSubCompanyModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  {editingSubCompany ? 'Edit Sub Company' : 'New Sub Company'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowSubCompanyModal(false);
                    setEditingSubCompany(null);
                    setSubCompanyName('');
                    setSubCompanyLogoUrl('');
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Company Name *</label>
                <input
                  type="text"
                  value={subCompanyName}
                  onChange={(e) => setSubCompanyName(e.target.value)}
                  className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Logo</label>
                {subCompanyLogoUrl ? (
                  <div className="space-y-2">
                    <Image
                      src={subCompanyLogoUrl}
                      alt="Logo"
                      width={128}
                      height={128}
                      className="w-32 h-32 rounded-lg object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (!file || !user) return;
                          setUploadingLogo(true);
                          try {
                            const result = await uploadImage(STORAGE_BUCKETS.COMPANY_LOGOS, file, user.id);
                            if (result.url) {
                              setSubCompanyLogoUrl(result.url);
                            } else {
                              alert(result.error?.message || 'Failed to upload logo');
                            }
                          } catch (error) {
                            alert('Failed to upload logo');
                          } finally {
                            setUploadingLogo(false);
                          }
                        };
                        input.click();
                      }}
                      disabled={uploadingLogo}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      Change Logo
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (!file || !user) return;
                        setUploadingLogo(true);
                        try {
                          const result = await uploadImage(STORAGE_BUCKETS.COMPANY_LOGOS, file, user.id);
                          if (result.url) {
                            setSubCompanyLogoUrl(result.url);
                          } else {
                            alert(result.error?.message || 'Failed to upload logo');
                          }
                        } catch (error) {
                          alert('Failed to upload logo');
                        } finally {
                          setUploadingLogo(false);
                        }
                      };
                      input.click();
                    }}
                    disabled={uploadingLogo}
                    className="w-full rounded-md border-2 border-dashed border-gray-600 bg-gray-700 p-8 text-center hover:border-green-500 transition-colors text-gray-400"
                  >
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </button>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubCompanyModal(false);
                    setEditingSubCompany(null);
                    setSubCompanyName('');
                    setSubCompanyLogoUrl('');
                  }}
                  className="flex-1 rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!subCompanyName.trim()) {
                      alert('Please enter a company name');
                      return;
                    }
                    try {
                      if (editingSubCompany) {
                        await updateSubCompany.mutateAsync({
                          id: editingSubCompany.id,
                          name: subCompanyName.trim(),
                          logo_url: subCompanyLogoUrl || null,
                        });
                      } else {
                        await createSubCompany.mutateAsync({
                          name: subCompanyName.trim(),
                          logo_url: subCompanyLogoUrl || null,
                        });
                      }
                      setShowSubCompanyModal(false);
                      setEditingSubCompany(null);
                      setSubCompanyName('');
                      setSubCompanyLogoUrl('');
                    } catch (error) {
                      alert('Failed to save sub company');
                    }
                  }}
                  disabled={createSubCompany.isPending || updateSubCompany.isPending || uploadingLogo}
                  className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {createSubCompany.isPending || updateSubCompany.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

