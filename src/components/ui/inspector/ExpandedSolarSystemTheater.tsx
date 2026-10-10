import React from 'react';
import { Compass, Minimize2, X, Globe } from 'lucide-react';
import { StarSystem } from '../../../types/astrophysics';
import { computePlanetPhysics } from '../../../core/generation/planets';
import { CircumstellarView3D } from '../../canvas/CircumstellarView3D';

interface ExpandedSolarSystemTheaterProps {
  selectedStar: StarSystem;
  selectedPlanetIndex: number;
  onSelectPlanet: (index: number) => void;
  onClose: () => void;
}

export const ExpandedSolarSystemTheater: React.FC<ExpandedSolarSystemTheaterProps> = ({
  selectedStar,
  selectedPlanetIndex,
  onSelectPlanet,
  onClose,
}) => {
  const state = selectedStar.starState;
  const curPlanet =
    selectedPlanetIndex >= 0 ? selectedStar.planets[selectedPlanetIndex] : null;
  const curPhys = curPlanet
    ? computePlanetPhysics(curPlanet, state, selectedStar.progenitorMass)
    : null;

  return (
    <div
      id="section-10-expanded-solar-system-theater"
      data-section="Expanded 3D Solar System Theater"
      className="fixed inset-3 z-50 rounded-2xl glass-hud border border-cyan-500/50 shadow-2xl flex flex-col p-3 backdrop-blur-2xl bg-slate-950/95 animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Theater Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-700 flex items-center justify-center">
            <Compass className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-mono">
                {selectedStar.name} &bull; 3D Circumstellar Solar System
              </h2>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700">
                {state.spectralMK}
              </span>
              <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                SEC-10: Expanded 3D Theater
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {state.phase} &bull; Mass: {state.currentMass.toFixed(2)} M☉ &bull; Lum:{' '}
              {state.L >= 100 ? Math.round(state.L).toLocaleString() : state.L.toFixed(2)} L☉ &bull;
              HZ: {state.rInHZ.toFixed(2)} - {state.rOutHZ.toFixed(2)} AU
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 mr-2">
            Press{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">
              Esc
            </kbd>{' '}
            to exit
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 flex items-center gap-1.5 font-mono text-xs shadow transition"
          >
            <Minimize2 className="w-4 h-4 text-cyan-400" />
            Minimize
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 flex items-center justify-center transition shadow"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main 3D High-Res Viewport */}
      <div className="flex-1 relative w-full h-full min-h-0 rounded-xl overflow-hidden border border-slate-800 my-2 shadow-inner">
        <CircumstellarView3D
          selectedStar={selectedStar}
          selectedPlanetIndex={selectedPlanetIndex}
          onSelectPlanet={onSelectPlanet}
          isExpanded={true}
          onToggleExpand={onClose}
        />
      </div>

      {/* Theater Bottom Quick Planet Selector & Live Telemetry Bar */}
      <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">
            Focus:
          </span>
          <button
            onClick={() => onSelectPlanet(-1)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono flex items-center gap-1.5 transition ${
              selectedPlanetIndex === -1
                ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-lg shadow-amber-500/20 font-bold'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
            title="Full Screen Solar System View centered on the Sun"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shadow-sm"
              style={{ backgroundColor: selectedStar.colorData.hex }}
            />
            <span>☀️ Sun / Star</span>
          </button>
          {selectedStar.planets.map((p, idx) => {
            const isSelected = idx === selectedPlanetIndex;
            const phys = computePlanetPhysics(p, state, selectedStar.progenitorMass);
            return (
              <button
                key={p.id}
                onClick={() => onSelectPlanet(idx)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono flex items-center gap-1.5 transition ${
                  isSelected
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-lg shadow-cyan-500/20 font-bold'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span>{p.name}</span>
                <span className="text-[9.5px] text-slate-400">
                  ({phys.currentA.toFixed(2)} AU)
                </span>
              </button>
            );
          })}
        </div>

        {curPlanet && curPhys && (
          <div className="flex items-center gap-4 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-[10.5px]">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-white font-bold">{curPlanet.name}:</span>
              <span className="text-cyan-300">{curPlanet.type}</span>
            </div>
            <div className="text-slate-300">
              Surface T:{' '}
              <strong className="text-amber-300">
                {curPhys.tsurf} K ({curPhys.tsurfC}°C)
              </strong>
            </div>
            <div className="text-slate-300">
              Status:{' '}
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                  curPhys.isEngulfed
                    ? 'bg-rose-950 text-rose-300 border-rose-800'
                    : curPhys.status === 'Candidate Habitable'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700 animate-pulse'
                    : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                {curPhys.status}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
