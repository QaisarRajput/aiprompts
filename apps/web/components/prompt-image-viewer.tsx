"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AdaptiveImage } from "./adaptive-image";

type PromptImage = {
  url: string;
  alt?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const ZOOM_STEP = 0.2;

export function PromptImageViewer({
  images,
  promptTitle
}: {
  images: PromptImage[];
  promptTitle: string;
}): JSX.Element {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const activeImage = useMemo(() => {
    if (activeIndex === null) {
      return null;
    }
    return images[activeIndex] ?? null;
  }, [activeIndex, images]);

  useEffect(() => {
    if (!activeImage) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        closeViewer();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeImage]);

  const openViewer = (index: number): void => {
    setActiveIndex(index);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setDragging(false);
  };

  const closeViewer = (): void => {
    setActiveIndex(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setDragging(false);
  };

  const updateZoom = (nextZoom: number): void => {
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
    setZoom(clamped);
    if (clamped === MIN_ZOOM) {
      setPan({ x: 0, y: 0 });
    }
  };

  const handleWheelZoom = (event: React.WheelEvent<HTMLDivElement>): void => {
    if (!activeImage) {
      return;
    }
    event.preventDefault();
    const direction = event.deltaY < 0 ? 1 : -1;
    updateZoom(zoom + direction * ZOOM_STEP);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (!activeImage || zoom <= 1) {
      return;
    }
    event.preventDefault();
    setDragging(true);
    dragStart.current = { x: event.clientX, y: event.clientY };
    panStart.current = pan;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (!dragging || zoom <= 1) {
      return;
    }
    event.preventDefault();
    const deltaX = event.clientX - dragStart.current.x;
    const deltaY = event.clientY - dragStart.current.y;
    setPan({
      x: panStart.current.x + deltaX,
      y: panStart.current.y + deltaY
    });
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (dragging) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  };

  const onShare = async (): Promise<void> => {
    if (!activeImage) {
      return;
    }

    const shareData = {
      title: promptTitle,
      text: `Image from ${promptTitle}`,
      url: activeImage.url
    };

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled or unsupported payload.
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(activeImage.url);
      return;
    }

    window.open(activeImage.url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <div className="space-y-3">
        {images.map((image, idx) => (
          <button
            key={`${image.url}-${idx}`}
            type="button"
            onClick={() => openViewer(idx)}
            className="w-full overflow-hidden rounded-2xl border border-border bg-surface text-left"
          >
            <AdaptiveImage
              src={image.url}
              alt={image.alt || promptTitle}
              className="h-auto w-full"
              fallbackClassName="aspect-[4/5] w-full bg-surface-muted"
              {...(image.width ? { width: image.width } : {})}
              {...(image.height ? { height: image.height } : {})}
            />
          </button>
        ))}
      </div>

      {activeImage ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          className="fixed inset-0 z-50 flex flex-col bg-black/95"
          onClick={closeViewer}
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/15 px-4 py-3 text-white">
            <p className="truncate text-sm font-medium">
              {activeImage.alt || promptTitle}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  updateZoom(zoom - ZOOM_STEP);
                }}
                className="rounded-lg border border-white/25 px-3 py-1.5 text-sm hover:bg-white/10"
              >
                -
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="rounded-lg border border-white/25 px-3 py-1.5 text-sm hover:bg-white/10"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  updateZoom(zoom + ZOOM_STEP);
                }}
                className="rounded-lg border border-white/25 px-3 py-1.5 text-sm hover:bg-white/10"
              >
                +
              </button>
              <a
                href={activeImage.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                onClick={(event) => event.stopPropagation()}
                className="rounded-lg border border-white/25 px-3 py-1.5 text-sm hover:bg-white/10"
              >
                Download
              </a>
              <button
                type="button"
                onClick={async (event) => {
                  event.stopPropagation();
                  await onShare();
                }}
                className="rounded-lg border border-white/25 px-3 py-1.5 text-sm hover:bg-white/10"
              >
                Share
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  closeViewer();
                }}
                className="rounded-lg border border-white/25 px-3 py-1.5 text-sm hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>

          <div
            className="relative flex-1 overflow-hidden"
            onClick={(event) => event.stopPropagation()}
            onWheel={handleWheelZoom}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{
              cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in"
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={activeImage.url}
                alt={activeImage.alt || promptTitle}
                className="max-h-full max-w-full select-none"
                draggable={false}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: "center center",
                  transition: dragging ? "none" : "transform 120ms ease-out"
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
