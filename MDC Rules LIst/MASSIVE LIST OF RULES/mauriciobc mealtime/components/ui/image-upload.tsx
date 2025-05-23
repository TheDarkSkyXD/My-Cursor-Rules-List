'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadImage, ImageType } from '@/utils/supabase/storage';
import { toast } from 'sonner';

interface ImageUploadProps {
  type: ImageType;
  userId: string;
  value?: string;
  onChange?: (url: string) => void;
  className?: string;
  maxSizeMB?: number;
}

export function ImageUpload({
  type,
  userId,
  value,
  onChange,
  className,
  maxSizeMB
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const url = await uploadImage(file, type, { userId, maxSizeMB });
      onChange?.(url);
      toast.success('Imagem enviada com sucesso');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Falha ao enviar imagem');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    onChange?.('');
  };

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        className={cn(
          'relative',
          type === 'user' ? 'w-32 aspect-square' : 'w-64 aspect-square',
          'flex items-center justify-center'
        )}
      >
        {value ? (
          <>
            <Image
              src={value}
              alt="Uploaded image"
              fill
              className={cn(
                'rounded-lg object-cover',
                'w-full h-full'
              )}
              style={{ objectFit: 'cover' }}
            />
            <Button
              variant="destructive"
              size="icon"
              type="button"
              className="absolute -top-2 -right-2"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            type="button"
            onClick={handleClick}
            disabled={isUploading}
            className={cn(
              'flex flex-col items-center justify-center gap-2 w-full h-full',
              'absolute inset-0'
            )}
            style={{ borderRadius: '0.5rem' }}
          >
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {isUploading ? 'Uploading...' : `Upload ${type === 'user' ? 'avatar' : 'photo'}`}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
} 