import { createBrowserClient } from "@supabase/ssr";
import { v4 as uuidv4 } from 'uuid';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type ImageType = 'user' | 'cat' | 'thumbnail';

interface UploadOptions {
  maxSizeMB?: number;
  userId: string;
}

/**
 * Uploads an image to Supabase Storage
 * @param file The file to upload
 * @param type The type of image (user, cat, or thumbnail)
 * @param options Upload options including maxSize and userId
 * @returns The URL of the uploaded image
 */
export async function uploadImage(
  file: File,
  type: ImageType,
  { maxSizeMB = 50, userId }: UploadOptions
) {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Validate file size
  const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
  if (file.size > maxSize) {
    throw new Error(`File size must be less than ${maxSizeMB}MB`);
  }

  const bucket = type === 'user' ? 'avatars' : 'cats';
  const ext = file.name.split('.').pop();
  const fileName = `${userId}/${uuidv4()}.${ext}`;

  // --- BEGIN ADDED LOGGING ---
  console.log(`[uploadImage] Attempting upload:`);
  console.log(`  - Bucket: ${bucket}`);
  console.log(`  - FileName: ${fileName}`);
  console.log(`  - File Size: ${file.size}`);
  console.log(`  - User ID: ${userId}`);
  console.log(`  - Supabase Client URL: ${supabase.supabaseUrl}`); // Check if URL looks correct
  // --- END ADDED LOGGING ---

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Storage upload error:', error);
    throw error;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return publicUrl;
}

/**
 * Deletes an image from Supabase Storage
 * @param url The public URL of the image to delete
 * @param type The type of image (user, cat, or thumbnail)
 */
export async function deleteImage(url: string, type: ImageType) {
  const bucket = type === 'user' ? 'avatars' : 'cats';
  
  // Extract file path from URL
  const urlObj = new URL(url);
  const filePath = urlObj.pathname.split(`/${bucket}/`)[1];

  if (!filePath) {
    throw new Error('Invalid image URL');
  }

  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    console.error('Storage delete error:', error);
    throw error;
  }
}

/**
 * Lists all images for a user
 * @param type The type of images to list (user, cat, or thumbnail)
 * @param userId The ID of the user
 * @returns Array of image URLs
 */
export async function listUserImages(type: ImageType, userId: string) {
  const bucket = type === 'user' ? 'avatars' : 'cats';

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(`${userId}`, {
      sortBy: { column: 'created_at', order: 'desc' }
    });

  if (error) {
    console.error('Storage list error:', error);
    throw error;
  }

  return data.map(file => {
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(`${userId}/${file.name}`);
    return publicUrl;
  });
} 