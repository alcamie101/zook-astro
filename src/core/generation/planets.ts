import { PRNG } from './prng';
import {
  M_JUP_EARTH,
  SOLAR_FLUX_EARTH,
} from '../astrophysics/constants';
import {
  PlanetArchetype,
  PlanetPhysicsComputed,
  StellarEvolutionState,
} from '../../types/astrophysics';

/**
 * Procedurally generates 4 to 8 diverse planets per star with initial orbital semi-major axes,
 * eccentricities, masses, radii, albedos, and atmospheric compositions.
 */
export function synthesizeMultiPlanetSystem(
  rng: PRNG,
  M0: number,
  starL: number,
  rInHZ: number,
  rOutHZ: number,
  _metallicityDex: number
): PlanetArchetype[] {
  const nPlanets = Math.floor(4 + rng.next() * 5); // 4 to 8 planets
  const planets: PlanetArchetype[] = [];

  // Initial semi-major axis based on stellar progenitor mass
  let currentAU = 0.08 + M0 * 0.25 * (0.5 + rng.next() * 0.8);

  for (let i = 0; i < nPlanets; i++) {
    // Titius-Bode / Hill-stability logarithmic spacing ratio
    const spacingRatio = 1.35 + rng.next() * 0.65;
    const a0 = currentAU;
    currentAU = a0 * spacingRatio;

    const ecc = Math.min(0.28, Math.pow(rng.next(), 2.5) * 0.35);
    const incDeg = (rng.next() - 0.5) * 6.0;

    let type = 'Terrestrial (Silicate)';
    let massEarth = 1.0;
    let radiusEarth = 1.0;
    let albedo = 0.30;
    let greenhouse = 33; // K
    let atmosphere = 'N2, O2, H2O, CO2';
    let color = '#38bdf8';

    const insolationRatio = starL / (a0 * a0);

    if (a0 < 0.25 || insolationRatio > 4.0) {
      type = rng.next() > 0.4 ? 'Scorched Iron / Lava World' : 'Scorched Sub-Earth';
      massEarth = 0.3 + rng.next() * 1.5;
      radiusEarth = Math.pow(massEarth, 0.28);
      albedo = 0.12;
      greenhouse = 0;
      atmosphere = 'Vacuum / Vaporized Rock (Na, SiO)';
      color = '#f97316';
    } else if (a0 >= rInHZ && a0 <= rOutHZ) {
      if (rng.next() < 0.6) {
        type = 'Temperate Ocean World';
        massEarth = 0.8 + rng.next() * 2.2;
        radiusEarth = Math.pow(massEarth, 0.30) * 1.08;
        albedo = 0.29;
        greenhouse = 30 + rng.next() * 15;
        atmosphere = 'N2 (76%), O2 (21%), H2O vapor, CO2';
        color = '#10b981';
      } else {
        type = 'Terrestrial / Super-Earth';
        massEarth = 1.2 + rng.next() * 3.5;
        radiusEarth = Math.pow(massEarth, 0.29);
        albedo = 0.33;
        greenhouse = 40;
        atmosphere = 'CO2, N2, Trace H2O';
        color = '#06b6d4';
      }
    } else if (a0 > rOutHZ && a0 < rOutHZ * 1.8) {
      type = 'Cold Desert World';
      massEarth = 0.2 + rng.next() * 0.9;
      radiusEarth = Math.pow(massEarth, 0.30);
      albedo = 0.25;
      greenhouse = 8;
      atmosphere = 'Thin CO2 (95%), N2, Ar';
      color = '#fb923c';
    } else if (a0 >= rOutHZ * 1.8 && a0 < 5.5) {
      if (rng.next() < 0.5) {
        type = 'Gas Giant (Jovian)';
        massEarth = 60 + rng.next() * 260;
        radiusEarth = massEarth / M_JUP_EARTH > 0.2 ? 8.5 + rng.next() * 3.0 : 6.0;
        albedo = 0.48;
        greenhouse = 0;
        atmosphere = 'H2 (89%), He (10%), CH4, NH3 clouds';
        color = '#eab308';
      } else {
        type = 'Sub-Neptune / Mini-Gas';
        massEarth = 4.0 + rng.next() * 12.0;
        radiusEarth = 2.2 + rng.next() * 1.6;
        albedo = 0.38;
        greenhouse = 0;
        atmosphere = 'H2/He envelope, H2O, CH4';
        color = '#60a5fa';
      }
    } else {
      type = rng.next() > 0.5 ? 'Ice Giant' : 'Frozen Dwarf';
      massEarth = type === 'Ice Giant' ? 12.0 + rng.next() * 18.0 : 0.05 + rng.next() * 0.3;
      radiusEarth = type === 'Ice Giant' ? 3.8 + rng.next() * 0.8 : 0.3 + rng.next() * 0.4;
      albedo = 0.55;
      greenhouse = 2;
      atmosphere = type === 'Ice Giant' ? 'H2, He, CH4 Ice mantle' : 'Tenuous N2, CH4 Frost';
      color = '#c084fc';
    }

    planets.push({
      id: i + 1,
      name: `Planet ${String.fromCharCode(66 + i)}`,
      a0,
      currentA: a0,
      ecc,
      incDeg,
      massEarth,
      radiusEarth,
      albedo,
      greenhouse,
      type,
      atmosphere,
      color,
      angle: rng.next() * Math.PI * 2,
      isEngulfed: false,
      status: 'Active',
    });
  }

  return planets;
}

/**
 * Computes instantaneous real-time geophysical telemetry for an exoplanet
 * considering stellar mass loss, luminosity, and photospheric expansion.
 */
export function computePlanetPhysics(
  planet: PlanetArchetype,
  starState: StellarEvolutionState,
  progenitorMass: number
): PlanetPhysicsComputed {
  // 1. Adiabatic Orbital Expansion: a(t) = a0 * (M0 / M*(t))
  const massRatio = progenitorMass / Math.max(0.08, starState.currentMass);
  const currentA = planet.a0 * massRatio;
  planet.currentA = currentA;

  // 2. Orbital Period via Kepler's 3rd Law: P = sqrt(a^3 / M*)
  const periodYrs = Math.sqrt(
    Math.pow(currentA, 3) / Math.max(0.08, starState.currentMass)
  );
  const periodDays = periodYrs * 365.25;

  // 3. Stellar Engulfment & Shock Check
  let status = planet.status;
  let isEngulfed = false;

  if (starState.radiusAU >= currentA) {
    isEngulfed = true;
    status = 'Engulfed (Vaporized)';
  } else if (starState.isSupernova && starState.snShockRadiusAU >= currentA) {
    isEngulfed = true;
    status = 'Sterilized (Supernova Shock)';
  } else {
    isEngulfed = false;
    if (currentA >= starState.rInHZ && currentA <= starState.rOutHZ) {
      status = 'Candidate Habitable';
    } else if (currentA < starState.rInHZ) {
      status = currentA < starState.rInHZ * 0.4 ? 'Scorched' : 'Runaway Greenhouse';
    } else if (currentA <= starState.rOutHZ * 1.5) {
      status = 'Cold Desert';
    } else {
      status = 'Deep Frozen';
    }
  }

  planet.isEngulfed = isEngulfed;
  planet.status = status;

  // 4. Insolation Flux & Equilibrium Temperature
  const fluxRatio = starState.L / (currentA * currentA);
  const fluxWm2 = SOLAR_FLUX_EARTH * fluxRatio;

  const teq =
    starState.Teff > 0
      ? starState.Teff *
        Math.sqrt(starState.radiusAU / (2 * currentA)) *
        Math.pow(1 - planet.albedo, 0.25)
      : 0;

  const tsurf = teq + (isEngulfed ? 1500 : planet.greenhouse);
  const tsurfC = Math.round(tsurf - 273.15);

  // 5. Surface Gravity (Earth g)
  const gravityG = (planet.massEarth / Math.pow(planet.radiusEarth, 2)).toFixed(2);

  // 6. Tidal locking threshold heuristic
  const isTidallyLocked = currentA < 0.22 * Math.pow(starState.currentMass, 1 / 3);

  return {
    currentA,
    periodDays,
    periodYrs,
    fluxWm2,
    fluxRatio,
    teq: Math.round(teq),
    tsurf: Math.round(tsurf),
    tsurfC,
    gravityG,
    isTidallyLocked,
    status,
    isEngulfed,
  };
}
