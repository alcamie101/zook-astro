import React from 'react';
import { Play, Pause, Maximize2 } from 'lucide-react';

interface CircumstellarControlsOverlayProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  speed: number;
  onSpeedChange: (val: number) => void;
  isExpanded: boolean;
  onToggleExpand?: () => void;
}

export const CircumstellarControlsOverlay: React.FC<CircumstellarControlsOverlayProps> = ({
  isPlaying,
  onTogglePlay,
  speed,
  onSpeedChange,
  isExpanded,
  onToggleExpand,
}) => {
  return (
    <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 pointer-events-auto bg-slate-950/85 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-800/90 shadow-xl text-xs font-mono">
      {/* Play / Pause Button */}
      <button
        onClick={onTogglePlay}
        className={`px-2 py-1 rounded border flex items-center gap-1 text-[11px] font-mono shadow transition select-none ${
          isPlaying
            ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
            : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-600 animate-pulse font-bold'
        }`}
        title={isPlaying ? 'Pause 3D Orbits (Space)' : 'Resume 3D Orbits (Space)'}
      >
        {isPlaying ? (
          <>
            <Pause className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Pause</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
            <span>Resume</span>
          </>
        )}
      </button>

      {/* Orbit Speed Slider with Slow-Down Capability */}
      <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2">
        <span className="text-[10px] text-slate-400 select-none">Speed:</span>
        <input
          type="range"
          min="0.05"
          max="3.0"
          step="0.05"
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          className="w-14 sm:w-20 accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
          title={`Orbit speed multiplier: ${speed.toFixed(2)}x (drag to slow down or speed up)`}
        />
        <span className="text-[10px] text-cyan-400 font-bold tabular-nums w-8 text-right select-none">
          {speed.toFixed(2)}x
        </span>

        {/* Speed Presets */}
        <div className="flex items-center gap-0.5 ml-0.5">
          {[0.2, 1.0, 2.5].map((preset) => (
            <button
              key={preset}
              onClick={() => onSpeedChange(preset)}
              className={`px-1 py-0.5 text-[8.5px] rounded transition ${
                Math.abs(speed - preset) < 0.05
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={`Set speed to ${preset}x (${
                preset < 1 ? 'Slow Motion' : preset === 1 ? 'Real-Time' : 'Fast'
              })`}
            >
              {preset === 0.2 ? '0.2x' : preset === 1 ? '1x' : `${preset}x`}
            </button>
          ))}
        </div>
      </div>

      {/* Blow Up 3D Button - Only shown when NOT expanded */}
      {!isExpanded && onToggleExpand && (
        <button
          onClick={onToggleExpand}
          className="ml-1 px-2 py-1 rounded bg-indigo-900/90 hover:bg-indigo-800 text-indigo-200 border border-indigo-500/50 text-[10px] font-mono shadow flex items-center gap-1 transition"
          title="Blow Up / Expand 3D Solar System"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Blow Up 3D</span>
        </button>
      )}
    </div>
  );
};
