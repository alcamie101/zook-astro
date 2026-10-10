import { PRNG } from './prng';

/**
 * Samples progenitor stellar masses (M0 in Solar Masses) from a piecewise
 * Kroupa/Chabrier Initial Mass Function (IMF).
 */
export function sampleIMF(rng: PRNG): number {
  const p = rng.next();
  // 68% Low-mass M/K dwarfs (0.08 - 0.50 M_sun)
  if (p < 0.68) return 0.08 + Math.pow(rng.next(), 1.7) * 0.42;
  // 24% Solar-type G/K stars (0.50 - 1.40 M_sun)
  if (p < 0.92) return 0.50 + Math.pow(rng.next(), 2.2) * 0.90;
  // 6.5% Intermediate A/F stars (1.40 - 8.00 M_sun)
  if (p < 0.985) return 1.40 + Math.pow(rng.next(), 2.5) * 6.60;
  // 1.5% Massive O/B stars (8.00 - 83.00 M_sun)
  return 8.0 + Math.pow(rng.next(), 3.0) * 75.0;
}
