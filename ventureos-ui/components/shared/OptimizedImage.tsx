'use client';

import Image, { type ImageProps } from 'next/image';

/**
 * OptimizedImage - A wrapper around next/image with sensible defaults
 * for the VentureOS project.
 *
 * Features:
 * - Lazy loading by default for below-the-fold images (loading="lazy")
 * - Optional blur placeholder support via blurDataURL
 * - Enforces alt text (required prop)
 * - Configurable priority for above-the-fold hero images
 *
 * Requirements:
 * - 16.3: Lazy-load images below the fold
 * - 15.5: Provide alternative text for all informational images
 */

export interface OptimizedImageProps extends Omit<ImageProps, 'alt'> {
  /** Required alt text for accessibility (Requirement 15.5) */
  alt: string;
  /** When true, marks the image as above-the-fold (disables lazy loading, enables priority) */
  priority?: boolean;
  /** Optional blur data URL for placeholder. When provided, shows a blurred preview while loading. */
  blurDataURL?: string;
  /** Aspect ratio hint for responsive sizing (e.g., "16/9", "4/3", "1/1") */
  aspectRatio?: string;
}

/**
 * A small transparent 1x1 pixel SVG used as a minimal blur placeholder
 * when no custom blurDataURL is provided but placeholder="blur" behavior
 * is desired.
 */
export const DEFAULT_BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=';

export function OptimizedImage({
  alt,
  priority = false,
  blurDataURL,
  aspectRatio,
  className = '',
  ...rest
}: OptimizedImageProps) {
  // Determine loading strategy: priority images load eagerly, others lazy
  const loading = priority ? undefined : 'lazy';

  // Determine placeholder strategy
  const placeholder = blurDataURL ? 'blur' : 'empty';
  const resolvedBlurDataURL = blurDataURL || undefined;

  // Build aspect ratio style if provided
  const style = aspectRatio
    ? { aspectRatio, ...((rest.style as object) || {}) }
    : rest.style;

  return (
    <Image
      alt={alt}
      loading={loading}
      priority={priority}
      placeholder={placeholder}
      blurDataURL={resolvedBlurDataURL}
      className={`object-cover ${className}`}
      style={style}
      {...rest}
    />
  );
}
