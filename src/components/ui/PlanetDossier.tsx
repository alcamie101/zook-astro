import React from 'react';
import { M_JUP_EARTH, R_JUP_EARTH } from '../../core/astrophysics/constants';
import { computePlanetPhysics } from '../../core/generation/planets';
import { StarSystem } from '../../types/astrophysics';

interface PlanetDossierProps {
  selectedStar: StarSystem;
  selectedPlanetIndex: number;
  onSelectPlanet: (index: number) => void;
}

export const PlanetDossier: React.FC<PlanetDossierProps> = ({
  selectedStar,
  selectedPlanetIndex,
  onSelectPlanet,
}) => {
  const curPlanet = selectedStar.planets[selectedPlanetIndex] || selectedStar.planets[0];
  if (!curPlanet) return null;

  const pPhys = computePlanetPhysics(
    curPlanet,
    selectedStar.starState,
    selectedStar.progenitorMass
  );

  const getBadgeStyle = (status: string, isEngulfed: boolean) => {
    if (isEngulfed) {
      return 'bg-rose-950 text-rose-300 border-rose-800';
    }
    if (status === 'Candidate Habitable') {
      return 'bg-emerald-950 text-emerald-300 border-emerald-700 animate-pulse';
    }
    if (status.includes('Scorched') || status.includes('Runaway')) {
      return 'bg-orange-950 text-orange-300 border-orange-800';
    }
    return 'bg-slate-900 text-slate-300 border-slate-750';
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Active Planet Dossier Card */}
      <div
        id="section-08-planet-dossier"
        data-section="Selected Exoplanet Dossier"
        className="bg-slate-900/90 rounded-lg border border-cyan-800/60 p-2 flex flex-col gap-1 shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: curPlanet.color }}
            />
            <span className="text-xs font-bold text-white font-mono">
              {curPlanet.name}
            </span>
            <span className="text-[9.5px] font-mono text-cyan-400">
              {curPlanet.type}
            </span>
            <span className="text-[8px] font-mono text-slate-500 bg-slate-950 px-1 py-0.2 rounded border border-slate-800">
              SEC-08
            </span>
          </div>
          <span
            className={`px-2 py-0.2 rounded text-[9px] font-mono border font-bold ${getBadgeStyle(
              pPhys.status,
              pPhys.isEngulfed
            )}`}
          >
            {pPhys.status}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-x-2 gap-y-0.5 text-[9.5px] font-mono pt-0.5">
          <div>
            <span className="text-slate-400">Orbit a(t):</span>{' '}
            <span className="text-slate-200 font-bold">
              {pPhys.currentA.toFixed(2)} AU
            </span>
          </div>
          <div>
            <span className="text-slate-400">Period:</span>{' '}
            <span className="text-slate-200">
              {pPhys.periodDays >= 1000
                ? `${(pPhys.periodDays / 365.25).toFixed(1)} yr`
                : `${Math.round(pPhys.periodDays)} d`}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Eccentricity:</span>{' '}
            <span className="text-slate-200">{curPlanet.ecc.toFixed(3)}</span>
          </div>

          <div>
            <span className="text-slate-400">Mass:</span>{' '}
            <span className="text-slate-200">
              {curPlanet.massEarth >= 10
                ? `${(curPlanet.massEarth / M_JUP_EARTH).toFixed(2)} MJ (${curPlanet.massEarth.toFixed(1)} M⊕)`
                : `${curPlanet.massEarth.toFixed(2)} M⊕`}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Radius:</span>{' '}
            <span className="text-slate-200">
              {curPlanet.radiusEarth >= 6
                ? `${(curPlanet.radiusEarth / R_JUP_EARTH).toFixed(2)} RJ`
                : `${curPlanet.radiusEarth.toFixed(2)} R⊕`}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Gravity:</span>{' '}
            <span className="text-slate-200">{pPhys.gravityG} g</span>
          </div>

          <div>
            <span className="text-slate-400">Insolation:</span>{' '}
            <span className="text-slate-200">
              {Math.round(pPhys.fluxWm2).toLocaleString()} W/m² (
              {pPhys.fluxRatio.toFixed(2)} S☉)
            </span>
          </div>
          <div>
            <span className="text-slate-400">Equil Teq:</span>{' '}
            <span className="text-slate-200">{pPhys.teq} K</span>
          </div>
          <div>
            <span className="text-slate-400">Surface T:</span>{' '}
            <span className="text-amber-300 font-bold">
              {pPhys.tsurf} K ({pPhys.tsurfC}°C)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[9px] font-mono bg-slate-950/70 px-2 py-1 rounded border border-slate-800 mt-0.5">
          <span className="text-slate-400">
            Atmosphere:{' '}
            <strong className="text-slate-200">{curPlanet.atmosphere}</strong>
          </span>
          <span className="text-amber-400 font-bold">
            {pPhys.isTidallyLocked
              ? 'Tidally Locked (1:1)'
              : 'Standard Diurnal Rotation'}
          </span>
        </div>
      </div>

      {/* Planetary Fleet List */}
      <div
        id="section-09-planet-fleet"
        data-section="Planetary Fleet Selector"
        className="flex flex-col gap-1"
      >
        <span className="text-[9.5px] font-mono text-slate-400 uppercase tracking-wider font-semibold flex items-center justify-between">
          <span>Select Planet to Inspect:</span>
          <span className="text-[8px] font-mono text-slate-500 bg-slate-950 px-1 py-0.2 rounded border border-slate-800">
            SEC-09
          </span>
        </span>
        <div className="max-h-28 overflow-y-auto flex flex-col gap-1 pr-1">
          {selectedStar.planets.map((p, idx) => {
            const phys = computePlanetPhysics(
              p,
              selectedStar.starState,
              selectedStar.progenitorMass
            );
            const isCurrent = idx === selectedPlanetIndex;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPlanet(idx)}
                className={`px-2 py-1 rounded ${
                  isCurrent
                    ? 'bg-cyan-950/80 border-cyan-500'
                    : 'bg-slate-900/60 border-slate-800/80'
                } border flex items-center justify-between text-[9.5px] font-mono transition hover:bg-slate-800 text-left`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-slate-200 font-bold">{p.name}</span>
                  <span className="text-slate-400">
                    ({phys.currentA.toFixed(2)} AU)
                  </span>
                </div>
                <span
                  className={`px-1.5 py-0.2 rounded text-[8px] border ${getBadgeStyle(
                    phys.status,
                    phys.isEngulfed
                  )}`}
                >
                  {phys.status}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
