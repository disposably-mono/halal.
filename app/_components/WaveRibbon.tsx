"use client";

export function WaveRibbon() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="none"
      viewBox="0 0 1440 700"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6B1A1A" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#6B1A1A" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6B1A1A" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Diagonal ribbon bands */}
      <path d="M-100 550 L500 -50 L560 -50 L-40 550 Z" fill="url(#ribbonGrad)" />
      <path d="M200 700 L800 100 L830 100 L230 700 Z" fill="#6B1A1A" fillOpacity="0.15" />
      {/* Gold accent lines */}
      <path d="M-100 520 L480 -50" stroke="#F5C000" strokeWidth="0.5" strokeOpacity="0.3" />
      <path d="M220 700 L820 80" stroke="#F5C000" strokeWidth="0.5" strokeOpacity="0.2" />
    </svg>
  );
}
