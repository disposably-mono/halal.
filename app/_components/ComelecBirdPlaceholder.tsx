"use client";

import Image from "next/image";

export function ComelecBirdPlaceholder() {
  return (
    <div className="w-[108px] h-[108px] sm:w-[145px] sm:h-[145px] relative flex items-center justify-center">
      {/* Sun rays */}
      <svg
        viewBox="0 0 128 128"
        className="absolute inset-[0px] w-full h-full opacity-20"
        aria-hidden="true"
      >
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i / 16) * 360;
          const rad = (angle * Math.PI) / 180;
          const x1 = 64 + 28 * Math.cos(rad);
          const y1 = 64 + 28 * Math.sin(rad);
          const x2 = 64 + 60 * Math.cos(rad);
          const y2 = 64 + 60 * Math.sin(rad);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#F5C000"
              strokeWidth={i % 2 === 0 ? 2 : 1}
            />
          );
        })}
        <circle cx="64" cy="64" r="26" fill="none" stroke="#F5C000" strokeWidth="1.5" />
      </svg>
      {/* Try real SVG first, fall back to initials */}
      <div className="relative z-10 w-[63px] h-[63px] sm:w-[81px] sm:h-[81px]">
        <Image
          src="/comelec-bird.svg"
          alt="OLPS COMELEC"
          width={72}
          height={72}
          className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(245,192,0,0.4)]"
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
            const fallback = (e.target as HTMLElement)
              .closest(".bird-container")
              ?.querySelector(".bird-fallback") as HTMLElement | null;
            if (fallback) fallback.style.display = "flex";
          }}
        />
        <div
          className="bird-fallback hidden absolute inset-[0px] items-center justify-center"
          aria-hidden="true"
        >
          <span className="font-heading text-gold text-[27px] font-bold tracking-wider">
            OLPS
          </span>
        </div>
      </div>
    </div>
  );
}
