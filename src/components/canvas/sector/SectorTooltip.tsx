import React from 'react';
import { StarSystem } from '../../../types/astrophysics';

interface SectorTooltipProps {
  hoveredStar: StarSystem;
  position: { x: number; y: number };
}

export const SectorTooltip: React.FC<SectorTooltipProps> = ({
  hoveredStar,
  position,
}) => {
  return (
    <div
      className="absolute z-30 pointer-events-none bg-slate-950/95 border border-cyan-500/60 rounded-lg p-2 text-xs shadow-2xl font-mono text-slate-200"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <div className="font-bold text-cyan-400 flex items-center gap-1.5 text-[11px]">
        {hoveredStar.name}
      </div>
      <div className="text-[10px] text-slate-300">
        {hoveredStar.starState.spectralMK} &bull; {hoveredStar.progenitorMass.toFixed(2)} M☉
      </div>
      <div className="text-[9.5px] text-emerald-400">
        {hoveredStar.planets.length} Exoplanets {hoveredStar.hasHZPlanet ? '(HZ Life!)' : ''}
      </div>
    </div>
  );
};
