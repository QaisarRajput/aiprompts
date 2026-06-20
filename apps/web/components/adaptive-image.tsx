"use client";

import { useState } from "react";

export function AdaptiveImage({
  src,
  alt,
  className,
  width,
  height,
  fallbackClassName,
  fallbackLabel
}: {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fallbackClassName?: string;
  fallbackLabel?: string;
}): JSX.Element {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        aria-label={fallbackLabel ?? "Image unavailable"}
        className={fallbackClassName ?? "aspect-[4/5] w-full bg-surface-muted"}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      width={width}
      height={height}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
