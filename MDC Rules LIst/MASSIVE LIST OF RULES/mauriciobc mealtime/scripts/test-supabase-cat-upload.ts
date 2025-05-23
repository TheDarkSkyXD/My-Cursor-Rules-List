import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// Usage: node scripts/test-supabase-cat-upload.js <filePath> <userId>
const [,, filePath, userId] = process.argv;

if (!filePath || !userId) {
  console.error('Usage: node scripts/test-supabase-cat-upload.js <filePath> <userId>');
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function uploadCatImage() {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).replace('.', '') || 'jpg';
    const fileName = `${userId}/${uuidv4()}.${ext}`;
    const mimeType = `image/${ext}`;

    console.log(`Uploading to bucket 'cats' as ${fileName}...`);
    const { data, error } = await supabase.storage
      .from('cats')
      .upload(fileName, fileBuffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      process.exit(1);
    }

    const { data: publicUrlData } = supabase.storage.from('cats').getPublicUrl(fileName);
    console.log('Upload successful! Public URL:', publicUrlData.publicUrl);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

uploadCatImage(); 