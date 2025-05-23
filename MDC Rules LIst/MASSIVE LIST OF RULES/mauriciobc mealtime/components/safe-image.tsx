"use client";

import Image, { ImageProps } from 'next/image';
import { ErrorBoundary } from '@/lib/context/ErrorContext';
import { useRef, useState, useCallback, useEffect } from 'react';

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}

export function SafeImage({ fallback, className, fill, onError, ...props }: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const errorRef = useRef(false);
  const mountedRef = useRef(true);
  const loadAttempts = useRef(0);

  // Reset error state when src changes
  useEffect(() => {
    errorRef.current = false;
    setHasError(false);
    loadAttempts.current = 0;
    return () => {
      mountedRef.current = false;
    };
  }, [props.src]);

  // Create a wrapper that maintains aspect ratio and positioning
  const imageWrapperStyle = fill ? {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  } as const : undefined;

  const handleImageError = useCallback((error: any) => {
    // Prevent multiple error handling cycles and don't update state if unmounted
    if (errorRef.current || !mountedRef.current) {
      return;
    }

    // Increment load attempts
    loadAttempts.current += 1;

    // Only set error state after 2 attempts
    if (loadAttempts.current >= 2) {
      errorRef.current = true;

      // Log detailed error information
      console.error('[SafeImage] Image loading error after retries:', {
        src: props.src,
        attempts: loadAttempts.current,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof props.src,
        isString: typeof props.src === 'string',
        startsWith: typeof props.src === 'string' ? props.src.startsWith('/') : undefined
      });
      
      // Only update state if mounted and not already in error state
      if (mountedRef.current && !hasError) {
        setHasError(true);
      }
      
      if (onError && mountedRef.current) {
        try {
          const standardError = error instanceof Error ? error : new Error('Image loading failed');
          onError(standardError);
        } catch (handlerError) {
          console.error('[SafeImage] Error in onError handler:', handlerError);
        }
      }
    } else {
      console.warn('[SafeImage] Image load attempt failed, retrying...', {
        src: props.src,
        attempt: loadAttempts.current
      });
    }
  }, [hasError, onError, props.src]);

  const handleImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (errorRef.current || !mountedRef.current || !event.target) {
      return;
    }

    try {
      const img = event.target as HTMLImageElement;
      
      // Log detailed loading information
      console.log('[SafeImage] Image load event triggered:', {
        src: props.src,
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        currentSrc: img.currentSrc,
        loading: img.loading,
        decoded: img.decode !== undefined
      });
      
      // Only check dimensions if the image is not being optimized by Next.js
      if (!img.complete || (
        typeof props.src === 'string' && 
        !props.src.startsWith('/_next/image') && 
        (img.naturalWidth === 0 || img.naturalHeight === 0)
      )) {
        console.warn('[SafeImage] Image loaded but dimensions invalid:', {
          src: props.src,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          currentSrc: img.currentSrc
        });
        handleImageError(new Error('Image dimensions invalid'));
        return;
      }

      // Log successful load
      if (!errorRef.current && mountedRef.current) {
        console.log('[SafeImage] Image loaded successfully:', {
          src: props.src,
          dimensions: `${img.naturalWidth}x${img.naturalHeight}`,
          currentSrc: img.currentSrc
        });
      }

      if (props.onLoad && mountedRef.current) {
        props.onLoad(event);
      }
    } catch (error) {
      handleImageError(error);
    }
  }, [handleImageError, props.onLoad, props.src]);

  const FallbackComponent = (
    <div style={imageWrapperStyle} className={className}>
      {fallback || (
        <div className="w-full h-full flex items-center justify-center bg-purple-100">
          <span className="text-purple-500 text-4xl">Image Error</span>
        </div>
      )}
    </div>
  );

  // If we already know there's an error, show fallback immediately
  if (hasError) {
    return FallbackComponent;
  }

  return (
    <ErrorBoundary fallback={FallbackComponent}>
      <div style={imageWrapperStyle} className={className}>
        <Image 
          {...props} 
          fill={fill} 
          className={`object-cover ${props.className || ''}`}
          onLoad={(event) => {
            // Our internal load handler first
            handleImageLoad(event);
            // Then call the prop if it exists
            if (props.onLoad) {
              props.onLoad(event);
            }
          }}
          onError={() => {
            // Simplified error handling in SafeImage
            if (!errorRef.current && mountedRef.current) {
              handleImageError(new Error('Image failed to load'));
            }
            // Call the original onError prop passed from CatCard
            if (onError) {
              onError(new Error('Image failed to load'));
            }
          }}
          loading={props.priority ? "eager" : "lazy"}
          quality={90}
          sizes={props.sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
        />
      </div>
    </ErrorBoundary>
  );
} 