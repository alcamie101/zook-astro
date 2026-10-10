import { MorganKeenanResult } from '../../types/astrophysics';

/**
 * Morgan-Keenan spectral classification scale (Mamajek 2022 dwarf scale)
 */
export const MK_TEFF_GRID = [
  { class: 'O2', teff: 48000 },
  { class: 'O3', teff: 44000 },
  { class: 'O5', teff: 40000 },
  { class: 'O8', teff: 35000 },
  { class: 'B0', teff: 31400 },
  { class: 'B2', teff: 22000 },
  { class: 'B5', teff: 15700 },
  { class: 'B8', teff: 12500 },
  { class: 'A0', teff: 9700 },
  { class: 'A2', teff: 9000 },
  { class: 'A5', teff: 8180 },
  { class: 'A7', teff: 7850 },
  { class: 'F0', teff: 7280 },
  { class: 'F2', teff: 7000 },
  { class: 'F5', teff: 6510 },
  { class: 'F6', teff: 6350 },
  { class: 'F8', teff: 6170 },
  { class: 'G0', teff: 5930 },
  { class: 'G1', teff: 5860 },
  { class: 'G2', teff: 5770 },
  { class: 'G5', teff: 5660 },
  { class: 'G8', teff: 5440 },
  { class: 'K0', teff: 5280 },
  { class: 'K2', teff: 5040 },
  { class: 'K3', teff: 4840 },
  { class: 'K5', teff: 4450 },
  { class: 'K7', teff: 4050 },
  { class: 'M0', teff: 3850 },
  { class: 'M1', teff: 3700 },
  { class: 'M2', teff: 3550 },
  { class: 'M3', teff: 3410 },
  { class: 'M4', teff: 3200 },
  { class: 'M5', teff: 3030 },
  { class: 'M6', teff: 2800 },
  { class: 'M7', teff: 2600 },
  { class: 'M8', teff: 2500 },
  { class: 'M9', teff: 2300 },
];

/**
 * PURE FUNCTION: Derives Morgan-Keenan Spectral Class & Yerkes Luminosity Class
 * Strictly from instantaneous Teff, log10(L), and Stefan-Boltzmann radius R*.
 * Example: 5870 K with R=1.48 Rsun evaluates strictly to G0IV-V or G1IV, NEVER F6V.
 */
export function deriveMorganKeenanClass(
  Teff: number,
  logL: number,
  radiusRsun: number,
  phase: string
): MorganKeenanResult {
  if (phase.includes('Black Hole')) {
    return { full: 'BH (Singularity)', sub: 'Stellar-Mass Black Hole', pillColor: '#000000' };
  }
  if (phase.includes('Neutron Star')) {
    return { full: 'NS (Degenerate)', sub: 'Pulsar / Neutron Star', pillColor: '#e0f2fe' };
  }
  if (phase.includes('White Dwarf')) {
    return { full: 'DA/DB VII', sub: 'Degenerate White Dwarf', pillColor: '#f0f9ff' };
  }

  // 1. Spectral Type from Teff
  let subtype = 'M9';
  if (Teff >= MK_TEFF_GRID[0].teff) {
    subtype = 'O2';
  } else {
    for (let i = 0; i < MK_TEFF_GRID.length - 1; i++) {
      const upper = MK_TEFF_GRID[i];
      const lower = MK_TEFF_GRID[i + 1];
      if (Teff <= upper.teff && Teff >= lower.teff) {
        const mid = (upper.teff + lower.teff) / 2;
        subtype = Teff >= mid ? upper.class : lower.class;
        break;
      }
    }
  }

  // 2. Luminosity Class via Yerkes classification from log(L) & R*
  let lumClass = 'V';
  if (radiusRsun > 120 || logL > 4.8) {
    lumClass = logL > 5.2 ? 'Ia' : 'Ib'; // Supergiant
  } else if (radiusRsun > 40 || (logL > 3.2 && Teff < 5000)) {
    lumClass = 'II'; // Bright Giant
  } else if (radiusRsun > 8.0 || (logL > 1.8 && Teff < 5200)) {
    lumClass = 'III'; // Giant
  } else if (radiusRsun > 1.35 || (logL > 0.4 && Teff < 6200 && phase.includes('Subgiant'))) {
    lumClass = radiusRsun > 1.7 ? 'IV' : 'IV-V'; // Subgiant / Evolving Dwarf
  } else if (radiusRsun < 0.6 && Teff < 4000) {
    lumClass = 'V'; // Main Sequence M/K dwarf
  }

  const fullClass = `${subtype}${lumClass}`;
  let descriptive = `${fullClass} Star`;
  if (lumClass.includes('IV')) descriptive = `${subtype} Subgiant / Evolving Dwarf`;
  else if (lumClass === 'III') descriptive = `${subtype} Giant`;
  else if (lumClass === 'V') descriptive = `${subtype} Main Sequence Dwarf`;
  else if (lumClass.includes('I')) descriptive = `${subtype} Supergiant`;

  return { full: fullClass, sub: descriptive };
}
