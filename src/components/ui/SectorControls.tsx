import React from 'react';
import { Sliders, RefreshCw } from 'lucide-react';
import { SectorConfiguration, SectorMorphology } from '../../types/astrophysics';

interface SectorControlsProps {
  config: SectorConfiguration;
  onChangeConfig: (newConfig: SectorConfiguration) => void;
  onRegenerate: () => void;
  onNewSeed: () => void;
}

export const SectorControls: React.FC<SectorControlsProps> = ({
  config,
  onChangeConfig,
  onRegenerate,
  onNewSeed,
}) => {
  return (
    <aside
      id="section-02-sector-parameters"
      data-section="Sector Generator Parameters"
      className="lg:col-span-3 rounded-xl glass-hud p-2.5 border border-slate-800/80 flex flex-col gap-2 overflow-y-auto"
    >
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-cyan-400" />
          Sector Parameters
          <span className="text-[9px] font-mono text-slate-500 bg-slate-900/60 px-1 py-0.2 rounded border border-slate-800">
            SEC-02
          </span>
        </span>
        <button
          onClick={onNewSeed}
          className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 underline"
        >
          Seed: <span>{config.seed}</span>
        </button>
      </div>

      {/* Star Count */}
      <div className="flex flex-col gap-1 bg-slate-900/60 p-2 rounded-lg border border-slate-800/70">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-300 font-semibold">Total Star Count</span>
          <span className="font-mono text-cyan-400 font-bold">
            {config.starCount.toLocaleString()}
          </span>
        </div>
        <input
          type="range"
          min="100"
          max="1500"
          step="50"
          value={config.starCount}
          onChange={(e) =>
            onChangeConfig({ ...config, starCount: parseInt(e.target.value) })
          }
          className="w-full"
        />
        <div className="flex justify-between text-[9px] text-slate-500 font-mono">
          <span>100</span>
          <span>1,000</span>
          <span>1,500</span>
        </div>
      </div>

      {/* Sector Morphology */}
      <div className="flex flex-col gap-1 bg-slate-900/60 p-2 rounded-lg border border-slate-800/70">
        <label className="text-slate-300 font-semibold text-xs">
          Galactic Environment
        </label>
        <select
          value={config.morphology}
          onChange={(e) =>
            onChangeConfig({
              ...config,
              morphology: e.target.value as SectorMorphology,
            })
          }
          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-cyan-500 font-mono"
        >
          <option value="disk">Galactic Thin Disk (Exponential)</option>
          <option value="core">Globular Cluster (Dense Core)</option>
          <option value="cluster">Stellar Nursery / Open Cluster</option>
          <option value="halo">Galactic Halo (Diffuse Field)</option>
        </select>
      </div>

      {/* Mean Age */}
      <div className="flex flex-col gap-1 bg-slate-900/60 p-2 rounded-lg border border-slate-800/70">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-300 font-semibold">Sector Mean Age</span>
          <span className="font-mono text-amber-300 font-bold">
            {config.meanAgeGyr >= 1.0
              ? `${config.meanAgeGyr.toFixed(1)} Gyr`
              : `${Math.round(config.meanAgeGyr * 1000)} Myr`}
          </span>
        </div>
        <input
          type="range"
          min="0.02"
          max="12.5"
          step="0.1"
          value={config.meanAgeGyr}
          onChange={(e) =>
            onChangeConfig({ ...config, meanAgeGyr: parseFloat(e.target.value) })
          }
          className="w-full"
        />
        <div className="flex justify-between text-[9px] text-slate-500 font-mono">
          <span>20 Myr</span>
          <span>4.5 Gyr</span>
          <span>12.5 Gyr</span>
        </div>
      </div>

      {/* Starburst Dispersion */}
      <div className="flex flex-col gap-1 bg-slate-900/60 p-2 rounded-lg border border-slate-800/70">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-300 font-semibold">Age Dispersion (&sigma;)</span>
          <span className="font-mono text-slate-200 font-bold">
            {config.ageSigmaGyr.toFixed(1)} Gyr
          </span>
        </div>
        <input
          type="range"
          min="0.0"
          max="4.0"
          step="0.1"
          value={config.ageSigmaGyr}
          onChange={(e) =>
            onChangeConfig({ ...config, ageSigmaGyr: parseFloat(e.target.value) })
          }
          className="w-full"
        />
      </div>

      {/* Metallicity [Fe/H] */}
      <div className="flex flex-col gap-1 bg-slate-900/60 p-2 rounded-lg border border-slate-800/70">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-300 font-semibold">Metallicity [Fe/H]</span>
          <span className="font-mono text-emerald-400 font-bold">
            {config.metallicityDex >= 0 ? '+' : ''}
            {config.metallicityDex.toFixed(2)} dex
          </span>
        </div>
        <input
          type="range"
          min="-2.0"
          max="0.5"
          step="0.05"
          value={config.metallicityDex}
          onChange={(e) =>
            onChangeConfig({
              ...config,
              metallicityDex: parseFloat(e.target.value),
            })
          }
          className="w-full"
        />
      </div>

      {/* Sector Radius */}
      <div className="flex flex-col gap-1 bg-slate-900/60 p-2 rounded-lg border border-slate-800/70">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-300 font-semibold">Sector Radius</span>
          <span className="font-mono text-cyan-400 font-bold">
            {config.radiusLy} Light-Years
          </span>
        </div>
        <input
          type="range"
          min="40"
          max="300"
          step="10"
          value={config.radiusLy}
          onChange={(e) =>
            onChangeConfig({ ...config, radiusLy: parseInt(e.target.value) })
          }
          className="w-full"
        />
      </div>

      {/* Regenerate Button */}
      <button
        onClick={onRegenerate}
        className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition mt-auto"
      >
        <RefreshCw className="w-4 h-4" />
        Regenerate Sector
      </button>
    </aside>
  );
};
