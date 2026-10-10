import React from 'react';
import { Eye, RotateCcw } from 'lucide-react';
import { StarSystem } from '../../../types/astrophysics';

interface CircumstellarCameraPresetsProps {
  onSetCameraPreset: (preset: 'top' | 'inclined' | 'edge') => void;
  onFocusSun: () => void;
  onToggleActivePlanetFocus: () => void;
  focusedPlanet: number | null;
  selectedStar: StarSystem | null;
}

export const CircumstellarCameraPresets: React.FC<CircumstellarCameraPresetsProps> = ({
  onSetCameraPreset,
  onFocusSun,
  onToggleActivePlanetFocus,
  focusedPlanet,
  selectedStar,
}) => {
  return (
    <div className="absolute top-2 left-2 z-20 flex flex-wrap items-center gap-1.5 pointer-events-auto">
      <span className="text-[9px] font-mono text-cyan-400 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700/80 shadow flex items-center gap-1">
        <Eye className="w-3 h-3 text-emerald-400" />
        Raytraced Solar Shadows
      </span>

      {/* Camera Preset Quick Buttons */}
      <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded border border-slate-800 text-[8.5px] font-mono">
        <button
          onClick={() => onSetCameraPreset('top')}
          className="px-1.5 py-0.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded"
          title="Top-Down Polar View"
        >
          Top
        </button>
        <button
          onClick={() => onSetCameraPreset('inclined')}
          className="px-1.5 py-0.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded"
          title="Inclined Perspective (45°)"
        >
          45°
        </button>
        <button
          onClick={() => onSetCameraPreset('edge')}
          className="px-1.5 py-0.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded"
          title="Ecliptic Edge-On View"
        >
          Edge
        </button>
        <button
          onClick={onFocusSun}
          className={`px-1.5 py-0.5 rounded transition ${
            focusedPlanet === null
              ? 'bg-amber-950/80 text-amber-300 border border-amber-600/70 font-bold'
              : 'hover:bg-slate-800 text-amber-400 font-semibold'
          }`}
          title="Full Screen Solar System View centered on the Sun"
        >
          ☀️ Sun
        </button>
        <button
          onClick={onToggleActivePlanetFocus}
          className={`px-1.5 py-0.5 rounded transition ${
            focusedPlanet !== null
              ? 'bg-cyan-500 text-slate-950 font-bold shadow'
              : 'hover:bg-slate-800 text-cyan-400 font-bold'
          }`}
          title={
            focusedPlanet !== null
              ? 'Unlock Camera / Return to Overview'
              : 'Focus & Zoom on Active Planet'
          }
        >
          {focusedPlanet !== null ? 'Tracking' : 'Target'}
        </button>
        <button
          onClick={() => {
            onFocusSun();
            onSetCameraPreset('inclined');
          }}
          className="p-0.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
          title="Reset to System Overview"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {/* Active Focused Planet Badge with One-Click Exit & Sun Click Guidance */}
      {focusedPlanet !== null && selectedStar?.planets[focusedPlanet] && (
        <div className="flex items-center gap-1.5 bg-cyan-950/95 text-cyan-200 px-2 py-0.5 rounded border border-cyan-500/80 shadow text-[9px] font-mono">
          <span
            className="w-2 h-2 rounded-full ring-1 ring-cyan-400"
            style={{ backgroundColor: selectedStar.planets[focusedPlanet].color }}
          />
          <span className="font-bold">{selectedStar.planets[focusedPlanet].name}</span>
          <span className="text-cyan-400 hidden sm:inline">
            ({selectedStar.planets[focusedPlanet].type})
          </span>
          <span className="text-amber-400 font-semibold text-[8.5px] border-l border-cyan-800 pl-1.5 ml-0.5 hidden md:inline">
            Click Sun to exit
          </span>
          <button
            onClick={onFocusSun}
            className="ml-1 px-1.5 py-0.2 bg-cyan-900/80 hover:bg-rose-900 hover:text-rose-200 rounded text-cyan-300 transition text-[8.5px]"
            title="Return to System Overview (or click on the Sun)"
          >
            Exit Focus
          </button>
        </div>
      )}
    </div>
  );
};
