"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Upload, X, Camera, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatErrorMessage, getFallbackImageUrl, isFallbackImage } from "@/lib/image-errors";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
  type?: 'user' | 'cat' | 'thumbnail';
}

export function ImageUpload({ value, onChange, className, type = 'user' }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Update preview when value prop changes
  useEffect(() => {
    setPreview(value);
  }, [value]);

  // Cleanup object URL on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [preview]);

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Cleanup previous object URL if it exists
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    
    setPreview("");
    onChange("");
  };

  // Handles file selection and upload
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.target.files?.[0];
    
    if (!file) {
      return;
    }

    setIsUploading(true);

    try {
      // Cleanup previous object URL if it exists
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      
      // Create new preview URL
      const objectUrl = URL.createObjectURL(file);
      objectUrlRef.current = objectUrl;
      setPreview(objectUrl);
      
      // Create form data and upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      const uploadedUrl = result.url;

      if (!uploadedUrl) {
        throw new Error("Upload succeeded but no URL was returned.");
      }

      onChange(uploadedUrl);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(formatErrorMessage(error));
      // Reset preview on error
      setPreview(value);
    } finally {
      setIsUploading(false);
      // Clear input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      
      {preview ? (
        <div className="relative aspect-square w-32 h-32 rounded-md overflow-hidden border">
          <Image
            src={preview}
            alt="Preview"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={cn(
              "object-cover",
              isFallbackImage(preview) && "opacity-50"
            )}
          />
          {!isFallbackImage(preview) && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-7 w-7"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div className="w-32 h-32 rounded-md border border-dashed flex flex-col items-center justify-center gap-1 bg-muted/30">
          <ImageIcon className="h-10 w-10 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Nenhuma imagem</span>
        </div>
      )}
      
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={handleUploadClick}
          disabled={isUploading}
        >
          <Camera className="h-4 w-4" />
          Câmera
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Disable camera capture to allow gallery selection
            if (fileInputRef.current) {
              fileInputRef.current.removeAttribute("capture");
              fileInputRef.current.click();
              // Restore capture attribute after click
              setTimeout(() => {
                if (fileInputRef.current) {
                  fileInputRef.current.setAttribute("capture", "environment");
                }
              }, 1000);
            }
          }}
          disabled={isUploading}
        >
          <ImageIcon className="h-4 w-4" />
          Galeria
        </Button>
      </div>
    </div>
  );
} 