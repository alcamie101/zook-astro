import { PRNG } from './prng';
import { sampleIMF } from './imf';
import { sampleCoordinates } from './morphology';
import { synthesizeMultiPlanetSystem } from './planets';
import {
  calculateMSLifetimeGyr,
  calculateStellarEvolution,
} from '../astrophysics/evolution';
import { getStarColorRGB } from '../astrophysics/colors';
import { SectorConfiguration, StarSystem } from '../../types/astrophysics';

/**
 * Generates an entire sector of stars with physical attributes,
 * realistic ages, evolutionary tracks, and multi-planet architectures.
 */
export function generateSectorStars(config: SectorConfiguration): StarSystem[] {
  const rng = new PRNG(config.seed);
  const stars: StarSystem[] = [];

  for (let i = 0; i < config.starCount; i++) {
    const id = i + 1;
    const name = `SEC-${String(id).padStart(4, '0')}`;
    const coords = sampleCoordinates(rng, config.morphology, config.radiusLy);
    const progenitorMass = sampleIMF(rng);

    let starAgeGyr = rng.nextGaussian(config.meanAgeGyr, config.ageSigmaGyr);
    starAgeGyr = Math.max(0.005, Math.min(13.5, starAgeGyr));

    const tMS_Gyr = calculateMSLifetimeGyr(progenitorMass);
    let progressPct = (starAgeGyr / tMS_Gyr) * 50.0;
    if (progressPct > 100.0) progressPct = 100.0;

    const starState = calculateStellarEvolution(progenitorMass, progressPct);
    const colorData = getStarColorRGB(starState.Teff, starState.phase);

    // Procedural planetary system (4 to 8 exoplanets)
    const planets = synthesizeMultiPlanetSystem(
      rng,
      progenitorMass,
      starState.L,
      starState.rInHZ,
      starState.rOutHZ,
      config.metallicityDex
    );

    const hasHZPlanet = planets.some(
      (p) => p.a0 >= starState.rInHZ && p.a0 <= starState.rOutHZ
    );

    stars.push({
      id,
      name,
      x: coords.x,
      y: coords.y,
      z: coords.z,
      progenitorMass,
      starAgeGyr,
      progressPct,
      starState,
      colorData,
      planets,
      hasHZPlanet,
    });
  }

  return stars;
}
