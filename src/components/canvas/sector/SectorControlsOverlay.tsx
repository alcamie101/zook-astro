import React from 'react';

interface SectorControlsOverlayProps {
  radiusLy: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetCamera: () => void;
}

export const SectorControlsOverlay: React.FC<SectorControlsOverlayProps> = ({
  radiusLy,
  onZoomIn,
  onZoomOut,
  onResetCamera,
}) => {
  return (
    <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 pointer-events-auto">
      <div className="flex items-center bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-700/80 text-[11px] font-mono text-slate-300 shadow">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2"></span>
        Radius: <span className="ml-1 text-cyan-400 font-bold">{radiusLy} ly</span>
        <span className="ml-2 text-[9px] text-slate-500 bg-slate-950 px-1 py-0.2 rounded border border-slate-800">
          SEC-03
        </span>
      </div>
      <button
        onClick={onZoomIn}
        className="w-7 h-7 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-white font-bold border border-slate-700 text-xs shadow flex items-center justify-center transition"
        title="Zoom In"
      >
        +
      </button>
      <button
        onClick={onZoomOut}
        className="w-7 h-7 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-white font-bold border border-slate-700 text-xs shadow flex items-center justify-center transition"
        title="Zoom Out"
      >
        -
      </button>
      <button
        onClick={onResetCamera}
        className="px-2 h-7 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono shadow transition"
      >
        Reset 3D
      </button>
    </div>
  );
};
