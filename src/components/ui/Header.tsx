import React from 'react';
import { Sparkles, Compass } from 'lucide-react';
import { FilterCategory, StarSystem } from '../../types/astrophysics';

interface HeaderProps {
  stars: StarSystem[];
  activeFilter: FilterCategory;
  onFilterChange: (filter: FilterCategory) => void;
  onRandomTarget: () => void;
  starCount: number;
  morphologyLabel: string;
}

export const Header: React.FC<HeaderProps> = ({
  stars,
  activeFilter,
  onFilterChange,
  onRandomTarget,
  starCount,
  morphologyLabel,
}) => {
  let countOB = 0,
    countG = 0,
    countKM = 0,
    countRemnant = 0,
    countHZ = 0;

  stars.forEach((s) => {
    if (s.colorData.cat === 'ob') countOB++;
    if (s.colorData.cat === 'g') countG++;
    if (s.colorData.cat === 'km') countKM++;
    if (s.starState.isRemnant) countRemnant++;
    if (s.hasHZPlanet) countHZ++;
  });

  const getChipStyle = (filter: FilterCategory, activeClass: string, inactiveClass: string) => {
    return activeFilter === filter
      ? `px-2 py-1 rounded font-bold text-[10.5px] transition shadow ${activeClass}`
      : `px-2 py-1 rounded text-[10.5px] transition hover:bg-slate-700 ${inactiveClass}`;
  };

  return (
    <header
      id="section-01-command-bar"
      data-section="Command Bar & Filters"
      className="w-full flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl glass-hud border-slate-800/80 relative"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Compass className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
            Galactic Sector Star System Simulator
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
              {starCount.toLocaleString()} Stars &bull; {morphologyLabel}
            </span>
            <span className="text-[9px] font-mono text-slate-500 bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-800">
              SEC-01
            </span>
          </h1>
          <p className="text-[10.5px] text-slate-400">
            Strict Pipeline: Age/Phase &rarr; (L, Teff) &rarr; Stefan-Boltzmann R* &rarr; Pure Morgan-Keenan MK Class &bull; 4&ndash;8 Exoplanets
          </p>
        </div>
      </div>

      {/* Quick Population Filter Chips */}
      <div className="flex items-center gap-1.5 text-xs font-mono flex-wrap">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mr-1">
          Filter:
        </span>
        <button
          onClick={() => onFilterChange('all')}
          className={getChipStyle(
            'all',
            'bg-cyan-700 text-white border border-cyan-400',
            'bg-slate-800 text-slate-300 border border-slate-700'
          )}
        >
          All Stars ({stars.length})
        </button>
        <button
          onClick={() => onFilterChange('ob')}
          className={getChipStyle(
            'ob',
            'bg-blue-700 text-white border border-blue-400',
            'bg-slate-800 text-blue-300 border border-blue-500/30'
          )}
        >
          O/B ({countOB})
        </button>
        <button
          onClick={() => onFilterChange('g')}
          className={getChipStyle(
            'g',
            'bg-yellow-700 text-white border border-yellow-400',
            'bg-slate-800 text-yellow-300 border border-yellow-500/30'
          )}
        >
          G Sol ({countG})
        </button>
        <button
          onClick={() => onFilterChange('km')}
          className={getChipStyle(
            'km',
            'bg-rose-700 text-white border border-rose-400',
            'bg-slate-800 text-rose-300 border border-rose-500/30'
          )}
        >
          K/M ({countKM})
        </button>
        <button
          onClick={() => onFilterChange('remnant')}
          className={getChipStyle(
            'remnant',
            'bg-purple-700 text-white border border-purple-400',
            'bg-slate-800 text-purple-300 border border-purple-500/30'
          )}
        >
          Remnants ({countRemnant})
        </button>
        <button
          onClick={() => onFilterChange('hz')}
          className={getChipStyle(
            'hz',
            'bg-emerald-700 text-white border border-emerald-400',
            'bg-slate-800 text-emerald-300 border border-emerald-500/30'
          )}
        >
          HZ Life ({countHZ})
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onRandomTarget}
          className="px-2.5 py-1.5 rounded-lg bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-500/40 text-[11px] font-mono flex items-center gap-1.5 shadow transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
          Random Target
        </button>
      </div>
    </header>
  );
};
