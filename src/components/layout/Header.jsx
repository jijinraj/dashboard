import React from "react";

export default function Header({ right }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/75 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="h-9 w-9 rounded-full border border-white/15 bg-white/[0.04] overflow-hidden"
          >
            <img
              src="https://static.vecteezy.com/system/resources/thumbnails/046/449/142/small/plaster-statue-of-davids-head-isolated-ancient-greek-hero-sculpture-png.png"
              alt=""
            />
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold tracking-tight">
              SpartaRocket 🚀
            </div>
            <div className="text-xs text-white/60">Dashboard</div>
          </div>
        </div>

        <div className="flex items-center gap-2">{right}</div>
      </div>
    </header>
  );
}
