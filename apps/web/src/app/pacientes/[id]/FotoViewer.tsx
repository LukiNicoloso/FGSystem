"use client";

import { useState, useEffect, useRef } from "react";

function parseUrls(url: string): string[] {
  try {
    const parsed = JSON.parse(url);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [url];
}

export default function FotoViewer({ url }: { url: string }) {
  const urls = parseUrls(url);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });

  function resetZoom() {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  function changeIdx(next: number) {
    setIdx(next);
    resetZoom();
  }

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") changeIdx((idx + 1) % urls.length);
      if (e.key === "ArrowLeft") changeIdx((idx - 1 + urls.length) % urls.length);
      if (e.key === "Escape") { setOpen(false); resetZoom(); }
      if (e.key === "+" || e.key === "=") setZoom(z => Math.min(z + 0.5, 4));
      if (e.key === "-") setZoom(z => { const next = Math.max(z - 0.5, 1); if (next === 1) setOffset({ x: 0, y: 0 }); return next; });
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, idx, urls.length]);

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom(z => {
      const next = e.deltaY < 0 ? Math.min(z + 0.25, 4) : Math.max(z - 0.25, 1);
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (zoom <= 1) return;
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    offsetStart.current = { ...offset };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging.current) return;
    setOffset({
      x: offsetStart.current.x + (e.clientX - dragStart.current.x),
      y: offsetStart.current.y + (e.clientY - dragStart.current.y),
    });
  }

  function handleMouseUp() {
    dragging.current = false;
  }

  return (
    <>
      <div className="flex gap-1 flex-wrap">
        {urls.map((u, i) => (
          <button key={i} onClick={() => { setIdx(i); setOpen(true); }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={u}
              alt={`Pisada ${i + 1}`}
              className="w-12 h-12 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
            />
          </button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => { setOpen(false); resetZoom(); }}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] p-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: zoom > 1 ? "grab" : "default" }}
          >
            {/* Cerrar */}
            <button
              onClick={() => { setOpen(false); resetZoom(); }}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90 text-xl leading-none z-10"
            >
              ×
            </button>

            {/* Flechas carrusel — dentro de la imagen */}
            {urls.length > 1 && (
              <>
                <button
                  onClick={() => changeIdx((idx - 1 + urls.length) % urls.length)}
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90 text-lg z-10"
                >
                  ‹
                </button>
                <button
                  onClick={() => changeIdx((idx + 1) % urls.length)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90 text-lg z-10"
                >
                  ›
                </button>
              </>
            )}

            {/* Zoom controls — abajo centrado */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
              {zoom > 1 && (
                <button
                  onClick={resetZoom}
                  className="px-2 h-8 flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90 text-xs"
                >
                  reset
                </button>
              )}
              <button
                onClick={() => { setZoom(z => { const next = Math.max(z - 0.5, 1); if (next === 1) setOffset({ x: 0, y: 0 }); return next; }); }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90 text-lg font-bold"
              >
                −
              </button>
              {urls.length > 1 && (
                <span className="text-white/60 text-xs px-1">{idx + 1} / {urls.length}</span>
              )}
              <button
                onClick={() => setZoom(z => Math.min(z + 0.5, 4))}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90 text-lg font-bold"
              >
                +
              </button>
            </div>

            {/* Imagen */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={urls[idx]}
              alt={`Pisada ${idx + 1}`}
              draggable={false}
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                transition: dragging.current ? "none" : "transform 0.15s ease",
              }}
              className="max-h-[85vh] max-w-full rounded-xl object-contain select-none"
            />
          </div>
        </div>
      )}
    </>
  );
}
