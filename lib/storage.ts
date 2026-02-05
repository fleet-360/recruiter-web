import { supabase } from './supabase';

export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  RESUMES: 'resumes',
  PORTFOLIO: 'portfolio',
  JOB_DOCUMENTS: 'job-documents',
  JOB_IMAGES: 'job-images',
} as const;

export interface UploadResult {
  url: string | null;
  error: Error | null;
}

export async function uploadFile(
  bucket: string,
  file: File,
  path: string,
  userId: string
): Promise<UploadResult> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return { url: null, error: uploadError };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (error) {
    return {
      url: null,
      error: error instanceof Error ? error : new Error('Upload failed'),
    };
  }
}

export async function deleteFile(bucket: string, filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    return !error;
  } catch {
    return false;
  }
}

export async function uploadImage(
  bucket: string,
  file: File,
  userId: string
): Promise<UploadResult> {
  // Validate image type
  if (!file.type.startsWith('image/')) {
    return {
      url: null,
      error: new Error('File must be an image'),
    };
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return {
      url: null,
      error: new Error('Image size must be less than 5MB'),
    };
  }

  return uploadFile(bucket, file, 'images', userId);
}

export async function uploadPDF(
  bucket: string,
  file: File,
  userId: string
): Promise<UploadResult> {
  // Validate PDF type
  if (file.type !== 'application/pdf') {
    return {
      url: null,
      error: new Error('File must be a PDF'),
    };
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return {
      url: null,
      error: new Error('PDF size must be less than 10MB'),
    };
  }

  return uploadFile(bucket, file, 'documents', userId);
}

