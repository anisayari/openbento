import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, X } from 'lucide-react';

type ImageCropModalProps = {
  isOpen: boolean;
  src: string;
  title?: string;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
};

const CROP_SIZE = 320; // preview box size (px)
const OUTPUT_SIZE = 512; // exported avatar size (px)
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.05;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const ImageCropModal: React.FC<ImageCropModalProps> = ({ isOpen, src, title, onCancel, onConfirm }) => {
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const mouseDragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const touchDragRef = useRef<{
    id: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setNatural(null);
    setLoadError(null);
    sourceImageRef.current = null;
    dragRef.current = null;
    mouseDragRef.current = null;
    touchDragRef.current = null;
  }, [isOpen, src]);

  useEffect(() => {
    if (!isOpen) return;
    if (!src) return;

    let cancelled = false;
    const img = new Image();

    const finish = () => {
      if (cancelled) return;
      sourceImageRef.current = img;
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    };

    img.onload = finish;
    img.onerror = () => {
      if (cancelled) return;
      setLoadError('Failed to load this image. Try another file.');
    };

    img.src = src;

    if (typeof (img as any).decode === 'function') {
      (img as any).decode().then(finish).catch(() => {
        // ignore (onload/onerror will handle)
      });
    }

    return () => {
      cancelled = true;
    };
  }, [isOpen, src]);

  const baseScale = useMemo(() => {
    if (!natural) return 1;
    return Math.max(CROP_SIZE / natural.w, CROP_SIZE / natural.h);
  }, [natural]);

  const scale = baseScale * zoom;

  const displayed = useMemo(() => {
    if (!natural) return { w: 0, h: 0 };
    return { w: natural.w * scale, h: natural.h * scale };
  }, [natural, scale]);

  const clampOffset = useCallback(
    (next: { x: number; y: number }) => {
      if (!natural) return { x: 0, y: 0 };
      const maxX = Math.max(0, (displayed.w - CROP_SIZE) / 2);
      const maxY = Math.max(0, (displayed.h - CROP_SIZE) / 2);
      return {
        x: clamp(next.x, -maxX, maxX),
        y: clamp(next.y, -maxY, maxY),
      };
    },
    [displayed.w, displayed.h, natural],
  );

  useEffect(() => {
    if (!natural) return;
    setOffset((prev) => clampOffset(prev));
  }, [natural, zoom, clampOffset]);

  useEffect(() => {
    if (!isOpen || !natural) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const step = e.shiftKey ? 24 : 10;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setOffset((prev) => clampOffset({ x: prev.x - step, y: prev.y }));
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setOffset((prev) => clampOffset({ x: prev.x + step, y: prev.y }));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setOffset((prev) => clampOffset({ x: prev.x, y: prev.y - step }));
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setOffset((prev) => clampOffset({ x: prev.x, y: prev.y + step }));
        return;
      }
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom((z) => clamp(Math.round((z + ZOOM_STEP) * 100) / 100, MIN_ZOOM, MAX_ZOOM));
        return;
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoom((z) => clamp(Math.round((z - ZOOM_STEP) * 100) / 100, MIN_ZOOM, MAX_ZOOM));
        return;
      }
      if (e.key === '0') {
        e.preventDefault();
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', onKeyDown as any);
  }, [clampOffset, isOpen, natural]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!natural) return;
    e.preventDefault();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    e.preventDefault();
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    setOffset(clampOffset({ x: drag.originX + dx, y: drag.originY + dy }));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
  };

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragRef.current) return;
    if (!natural) return;
    e.preventDefault();
    mouseDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  };

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (dragRef.current) return;
    if (!natural) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    e.preventDefault();
    touchDragRef.current = {
      id: touch.identifier,
      startX: touch.clientX,
      startY: touch.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  };

  useEffect(() => {
    if (!isOpen) return;

    const onMouseMove = (e: MouseEvent) => {
      const drag = mouseDragRef.current;
      if (!drag) return;
      setOffset(clampOffset({ x: drag.originX + (e.clientX - drag.startX), y: drag.originY + (e.clientY - drag.startY) }));
    };

    const onMouseUp = () => {
      mouseDragRef.current = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      const drag = touchDragRef.current;
      if (!drag) return;
      const touch = Array.from(e.changedTouches).find((t) => t.identifier === drag.id);
      if (!touch) return;
      e.preventDefault();
      setOffset(clampOffset({ x: drag.originX + (touch.clientX - drag.startX), y: drag.originY + (touch.clientY - drag.startY) }));
    };

    const onTouchEnd = (e: TouchEvent) => {
      const drag = touchDragRef.current;
      if (!drag) return;
      const ended = Array.from(e.changedTouches).some((t) => t.identifier === drag.id);
      if (!ended) return;
      touchDragRef.current = null;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove as any);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [clampOffset, isOpen]);

  const adjustZoom = (delta: number) => {
    setZoom((z) => clamp(Math.round((z + delta) * 100) / 100, MIN_ZOOM, MAX_ZOOM));
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    adjustZoom(delta);
  };

  const handleConfirm = () => {
    const source = sourceImageRef.current || imgRef.current;
    if (!source || !natural) return;

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const topLeftX = CROP_SIZE / 2 - displayed.w / 2 + offset.x;
    const topLeftY = CROP_SIZE / 2 - displayed.h / 2 + offset.y;

    const srcX = (-topLeftX) / scale;
    const srcY = (-topLeftY) / scale;
    const srcW = CROP_SIZE / scale;
    const srcH = CROP_SIZE / scale;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(source, srcX, srcY, srcW, srcH, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onConfirm(dataUrl);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden ring-1 ring-gray-900/5"
            role="dialog"
            aria-modal="true"
            aria-label={title || 'Crop image'}
          >
            <div className="p-6 pb-4 flex justify-between items-start border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{title || 'Crop photo'}</h2>
                <p className="text-sm text-gray-500 mt-1">Drag to position, use zoom to crop.</p>
              </div>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                aria-label="Close crop"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-start justify-center">
                <div
                  className="relative bg-gray-100 border border-gray-200 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing"
                  style={{ width: CROP_SIZE, height: CROP_SIZE, touchAction: 'none' }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onMouseDown={onMouseDown}
                  onTouchStart={onTouchStart}
                  onWheel={handleWheel}
                  onDoubleClick={() => {
                    setZoom(1);
                    setOffset({ x: 0, y: 0 });
                  }}
                >
                  {loadError ? (
                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-red-700">
                      {loadError}
                    </div>
                  ) : !natural ? (
                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-gray-500">
                      Loading…
                    </div>
                  ) : (
                    <img
                      ref={imgRef}
                      src={src}
                      alt="Crop source"
                      draggable={false}
                      className="absolute left-1/2 top-1/2 select-none pointer-events-none"
                      style={{
                        width: `${displayed.w}px`,
                        height: `${displayed.h}px`,
                        maxWidth: 'none',
                        maxHeight: 'none',
                        transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
                        transformOrigin: 'center',
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Zoom</span>
                  <span className="text-xs font-semibold text-gray-600">{Math.round(zoom * 100)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => adjustZoom(-ZOOM_STEP)}
                    className="w-10 h-10 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center text-gray-700"
                    aria-label="Zoom out"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="range"
                    min={MIN_ZOOM}
                    max={MAX_ZOOM}
                    step={0.01}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => adjustZoom(ZOOM_STEP)}
                    className="w-10 h-10 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center text-gray-700"
                    aria-label="Zoom in"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  Tip: drag to move · double-click to reset · arrows to nudge (Shift for faster)
                </p>
              </div>
            </div>

            <div className="p-6 pt-4 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onCancel}
                  className="w-full sm:flex-1 py-3.5 bg-white text-gray-900 rounded-2xl font-bold border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!natural || !!loadError}
                  className="w-full sm:flex-1 py-3.5 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Use photo
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default ImageCropModal;
