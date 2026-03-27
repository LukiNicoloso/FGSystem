"use client";

import { useState } from "react";

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
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setOpen(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 text-xl leading-none z-10"
            >
              ×
            </button>

            {urls.length > 1 && (
              <>
                <button
                  onClick={() => setIdx(i => (i - 1 + urls.length) % urls.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 text-lg z-10"
                >
                  ‹
                </button>
                <button
                  onClick={() => setIdx(i => (i + 1) % urls.length)}
                  className="absolute right-10 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 text-lg z-10"
                >
                  ›
                </button>
                <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-xs">
                  {idx + 1} / {urls.length}
                </p>
              </>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={urls[idx]}
              alt={`Pisada ${idx + 1}`}
              className="max-h-[85vh] max-w-full rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
