import {
  R_SUN_KM,
  R_SUN_AU,
  T_SUN,
  S_EFF_INNER,
  S_EFF_OUTER,
} from './constants';
import { deriveMorganKeenanClass } from './classifier';
import { StellarEvolutionState } from '../../types/astrophysics';

export interface EmpiricalMSPoint {
  mass: number;
  teff: number;
  radius: number;
  lum: number;
}

export const EMPIRICAL_MS_GRID: EmpiricalMSPoint[] = [
  { mass: 0.08, teff: 2400, radius: 0.115, lum: 1.1e-4 },
  { mass: 0.10, teff: 2600, radius: 0.130, lum: 1.8e-4 },
  { mass: 0.15, teff: 2850, radius: 0.175, lum: 5.6e-4 },
  { mass: 0.20, teff: 3100, radius: 0.220, lum: 1.5e-3 },
  { mass: 0.30, teff: 3350, radius: 0.305, lum: 4.8e-3 },
  { mass: 0.40, teff: 3550, radius: 0.385, lum: 1.1e-2 },
  { mass: 0.50, teff: 3800, radius: 0.480, lum: 2.8e-2 },
  { mass: 0.60, teff: 4200, radius: 0.590, lum: 7.2e-2 },
  { mass: 0.70, teff: 4650, radius: 0.690, lum: 0.165 },
  { mass: 0.80, teff: 5050, radius: 0.785, lum: 0.34 },
  { mass: 0.90, teff: 5400, radius: 0.880, lum: 0.61 },
  { mass: 1.00, teff: 5778, radius: 1.000, lum: 1.00 },
  { mass: 1.15, teff: 6100, radius: 1.160, lum: 1.80 },
  { mass: 1.25, teff: 6400, radius: 1.250, lum: 2.50 },
  { mass: 1.50, teff: 7100, radius: 1.450, lum: 5.40 },
  { mass: 2.00, teff: 8800, radius: 1.850, lum: 18.0 },
  { mass: 3.00, teff: 12000, radius: 2.450, lum: 110.0 },
  { mass: 5.00, teff: 16500, radius: 3.400, lum: 750.0 },
  { mass: 8.00, teff: 22000, radius: 4.500, lum: 3800.0 },
  { mass: 15.0, teff: 30000, radius: 6.800, lum: 28000.0 },
  { mass: 30.0, teff: 39000, radius: 10.50, lum: 180000.0 },
  { mass: 60.0, teff: 45000, radius: 15.50, lum: 700000.0 },
  { mass: 100.0, teff: 50000, radius: 21.00, lum: 1800000.0 },
];

/**
 * Interpolates Zero Age Main Sequence (ZAMS) parameters
 * using cubic Hermite smoothstep over logarithmic mass coordinates.
 */
export function interpolateMS(m: number): { teff: number; radius: number; lum: number } {
  if (m <= EMPIRICAL_MS_GRID[0].mass) return EMPIRICAL_MS_GRID[0];
  const last = EMPIRICAL_MS_GRID[EMPIRICAL_MS_GRID.length - 1];
  if (m >= last.mass) return last;

  for (let i = 0; i < EMPIRICAL_MS_GRID.length - 1; i++) {
    const p1 = EMPIRICAL_MS_GRID[i];
    const p2 = EMPIRICAL_MS_GRID[i + 1];
    if (m >= p1.mass && m <= p2.mass) {
      const logM1 = Math.log10(p1.mass);
      const logM2 = Math.log10(p2.mass);
      const t = (Math.log10(m) - logM1) / (logM2 - logM1);
      const s = t * t * (3 - 2 * t); // Cubic Hermite smoothstep
      return {
        teff: p1.teff + (p2.teff - p1.teff) * s,
        radius: p1.radius + (p2.radius - p1.radius) * s,
        lum: Math.pow(10, Math.log10(p1.lum) + (Math.log10(p2.lum) - Math.log10(p1.lum)) * s),
      };
    }
  }
  return EMPIRICAL_MS_GRID[0];
}

/**
 * Calculates hydrogen burning core lifetime in Gigayears.
 */
export function calculateMSLifetimeGyr(m: number): number {
  if (m < 0.35) return 12.0 * Math.pow(m, -2.75);
  if (m < 1.3) {
    const w = (m - 0.35) / (1.3 - 0.35);
    return 12.0 * Math.pow(m, -2.75) * (1 - w) + 10.0 * Math.pow(m, -2.5) * w;
  }
  if (m <= 8.0) return 10.0 * Math.pow(m, -2.5);
  return (35.0 * Math.pow(m / 10.0, -1.35)) / 1000.0;
}

/**
 * STRICT STELLAR EVOLUTION PIPELINE:
 * 1. Compute Phase, Age, L, Teff, M(t).
 * 2. Compute Stefan-Boltzmann radius R* = sqrt(L) / (Teff/5778)^2.
 * 3. Compute pure dynamic Morgan-Keenan spectral and luminosity classification.
 * 4. Compute Kopparapu Habitable Zone and Condensation Snowline.
 */
export function calculateStellarEvolution(
  M0: number,
  progressPct: number
): StellarEvolutionState {
  const zams = interpolateMS(M0);
  const tMS_Gyr = calculateMSLifetimeGyr(M0);

  let phase = '';
  let ageGyr = 0;
  let ageText = '';
  let Teff = zams.teff;
  let L = zams.lum;
  let currentMass = M0;
  let isPulsating = false;
  let isSupernova = false;
  let isPlanetaryNebula = false;
  let nebulaRadiusAU = 0;
  let snShockRadiusAU = 0;
  let isRemnant = false;
  let remnantType: 'Black Hole' | 'Neutron Star' | 'White Dwarf' | null = null;

  // Logistic activation for convective low-mass stars vs giant capacity
  const giantCapacity = 1.0 / (1.0 + Math.exp(-(M0 - 0.38) * 16.0));

  if (M0 >= 8.0) {
    // Massive Star Track (O/B Main Sequence -> Supergiant -> Supernova -> Compact Remnant)
    const tMS_Myr = tMS_Gyr * 1000.0;
    if (progressPct < 58.0) {
      phase = 'O/B Main Sequence';
      const u = progressPct / 58.0;
      ageGyr = (u * tMS_Myr) / 1000;
      ageText = `${(u * tMS_Myr).toFixed(2)} Myr`;
      L = zams.lum * (1.0 + 0.8 * u);
      Teff = zams.teff * (1.0 - 0.12 * u);
      currentMass = M0 * (1.0 - 0.15 * u);
    } else if (progressPct < 82.0) {
      const u = (progressPct - 58.0) / 24.0;
      const curMyr = tMS_Myr + u * (tMS_Myr * 0.12);
      ageGyr = curMyr / 1000;
      ageText = `${curMyr.toFixed(2)} Myr`;
      L = zams.lum * 2.2;
      if (u < 0.35) {
        phase = 'Red Supergiant (RSG)';
        Teff = 3450;
      } else if (u < 0.72) {
        const loopProgress = (u - 0.35) / 0.37;
        Teff = 3450 + 4200 * Math.sin(loopProgress * Math.PI);
        if (Teff >= 5000 && Teff <= 6800) {
          phase = 'Instability Strip (Cepheid Pulsator)';
          isPulsating = true;
        } else {
          phase = 'Blue Loop Supergiant';
        }
      } else {
        phase = 'Wolf-Rayet Star (Stripped Core)';
        Teff = 42000 + 30000 * ((u - 0.72) / 0.28);
      }
      currentMass = M0 * (0.85 - 0.4 * u);
    } else if (progressPct < 87.0) {
      const u = (progressPct - 82.0) / 5.0;
      ageGyr = (tMS_Myr * 1.12) / 1000;
      ageText = `+${Math.round(u * 350)} d (SN)`;
      phase =
        M0 > 22
          ? 'Type Ib/c Core Collapse Supernova'
          : 'Type II Core Collapse Supernova';
      isSupernova = true;
      isRemnant = true;
      const isBH = M0 >= 22.0;
      remnantType = isBH ? 'Black Hole' : 'Neutron Star';
      currentMass = isBH ? 3.0 + (M0 - 22) * 0.35 : 1.44;
      L = 1e8 * Math.pow(Math.sin(u * Math.PI), 0.5) + 1e4;
      Teff = 9500 - 4000 * u;
      snShockRadiusAU = u * 35.0;
    } else {
      const u = (progressPct - 87.0) / 13.0;
      ageGyr = (tMS_Myr * 1.12 + u * 50.0) / 1000;
      ageText = `${ageGyr.toFixed(2)} Gyr`;
      isRemnant = true;
      const isBH = M0 >= 22.0;
      remnantType = isBH ? 'Black Hole' : 'Neutron Star';
      currentMass = isBH ? 3.0 + (M0 - 22) * 0.35 : 1.44;
      phase = isBH ? 'Stellar-Mass Black Hole' : 'Neutron Star / Pulsar';
      L = isBH ? 1e-6 : 0.01 * Math.pow(1 + u * 4, -1.4);
      Teff = isBH ? 0 : 500000 * Math.pow(1 + u * 4, -0.3);
      isPlanetaryNebula = true;
      nebulaRadiusAU = 35.0 + u * 45.0;
    }
  } else {
    // Low / Intermediate Mass Star Track
    const tPMS_Myr = Math.max(10, 80 * Math.pow(M0, -1.2));
    if (progressPct < 6.0) {
      const u = progressPct / 6.0;
      ageGyr = (u * tPMS_Myr) / 1000.0;
      ageText = `${(u * tPMS_Myr).toFixed(1)} Myr`;
      phase = 'Protostellar Collapse (Hayashi Track)';
      const L_init = zams.lum * (10.0 + 15.0 * Math.pow(M0, 0.5));
      L = L_init * Math.pow(zams.lum / L_init, u);
      const Teff_init = Math.min(zams.teff, 3200);
      Teff = Teff_init + (zams.teff - Teff_init) * Math.pow(u, 1.5);
    } else if (progressPct < 50.0) {
      const u = (progressPct - 6.0) / 44.0;
      ageGyr = tPMS_Myr / 1000.0 + u * tMS_Gyr;
      ageText =
        ageGyr >= 1000
          ? `${(ageGyr / 1000).toFixed(2)} Tyr`
          : `${ageGyr.toFixed(2)} Gyr`;
      phase = 'Main Sequence';
      L = zams.lum * (1.0 + (0.85 * giantCapacity + 0.15) * Math.pow(u, 1.2));
      if (giantCapacity < 0.2) {
        Teff = zams.teff + 400 * (1 - giantCapacity) * Math.pow(u, 1.5);
      } else {
        Teff = zams.teff * (1.0 - 0.08 * u * giantCapacity);
      }
    } else if (progressPct < 60.0) {
      const u = (progressPct - 50.0) / 10.0;
      ageGyr = tMS_Gyr + u * (0.8 * Math.pow(M0, -2.0));
      ageText =
        ageGyr >= 1000
          ? `${(ageGyr / 1000).toFixed(2)} Tyr`
          : `${ageGyr.toFixed(2)} Gyr`;
      if (giantCapacity > 0.3) {
        phase = 'Subgiant Branch (SGB)';
        const L_sgb = zams.lum * (2.0 + 3.0 * Math.pow(M0, 1.2));
        L = zams.lum * 1.85 + (L_sgb - zams.lum * 1.85) * u;
        Teff =
          zams.teff * 0.92 +
          (3900 + (zams.teff - 3900) * 0.2 - zams.teff * 0.92) * u;
      } else {
        phase = 'Blue Dwarf Transition';
        L = zams.lum * (1.15 + 0.35 * u);
        Teff = zams.teff + 600 * u;
      }
    } else if (progressPct < 70.0) {
      const u = (progressPct - 60.0) / 10.0;
      ageGyr = tMS_Gyr + (0.8 + u * 0.6) * Math.pow(M0, -1.8);
      ageText =
        ageGyr >= 1000
          ? `${(ageGyr / 1000).toFixed(2)} Tyr`
          : `${ageGyr.toFixed(2)} Gyr`;
      if (giantCapacity > 0.3) {
        phase =
          u > 0.92 ? 'RGB Tip (Helium Core Flash)' : 'Red Giant Branch (Shell H)';
        const L_tip = 2800 * Math.pow(M0, 0.4) * giantCapacity;
        L = Math.max(
          zams.lum * 4.0,
          zams.lum * 4.0 * Math.exp(u * Math.log(Math.max(10, L_tip / (zams.lum * 4.0))))
        );
        Teff = 3900 - 900 * Math.pow(u, 0.5);
        currentMass = M0 - 0.15 * M0 * u * giantCapacity;
      } else {
        phase = 'Blue Dwarf Phase';
        L = zams.lum * 1.5;
        Teff = zams.teff + 1200 * u;
      }
    } else if (progressPct < 78.0) {
      const u = (progressPct - 70.0) / 8.0;
      ageGyr = tMS_Gyr + (1.4 + u * 0.12) * Math.pow(M0, -1.5);
      ageText =
        ageGyr >= 1000
          ? `${(ageGyr / 1000).toFixed(2)} Tyr`
          : `${ageGyr.toFixed(2)} Gyr`;
      if (giantCapacity > 0.3) {
        phase = 'Horizontal Branch / Red Clump';
        L = (55 * Math.pow(M0, 0.7) + 15 * Math.sin(u * Math.PI)) * giantCapacity;
        Teff = 4700 + 400 * Math.sin(u * Math.PI);
        currentMass = M0 - 0.2 * M0 * giantCapacity;
      } else {
        phase = 'Helium Dwarf Precursor';
        L = zams.lum * 0.4 * (1 - 0.5 * u);
        Teff = zams.teff + 1500;
      }
    } else if (progressPct < 85.0) {
      const u = (progressPct - 78.0) / 7.0;
      ageGyr = tMS_Gyr + (1.52 + u * 0.025) * Math.pow(M0, -1.5);
      ageText =
        ageGyr >= 1000
          ? `${(ageGyr / 1000).toFixed(2)} Tyr`
          : `${ageGyr.toFixed(2)} Gyr`;
      if (giantCapacity > 0.3) {
        phase = 'Asymptotic Giant (TP-AGB)';
        const pulse =
          Math.max(0, Math.sin(u * Math.PI * 6)) * 2500 * giantCapacity;
        L = 2200 + 3800 * Math.pow(u, 0.8) * giantCapacity + pulse;
        Teff = 3100 - 200 * u;
        const finalCoreMass = 0.5 + 0.12 * Math.pow(M0, 0.6);
        currentMass =
          M0 - 0.2 * M0 - (M0 - 0.2 * M0 - finalCoreMass) * u;
      } else {
        phase = 'Late Degenerate Contraction';
        L = 0.05 * (1 - 0.5 * u);
        Teff = 4500;
      }
    } else if (progressPct < 89.0) {
      const u = (progressPct - 85.0) / 4.0;
      ageGyr = tMS_Gyr + 1.55 * Math.pow(M0, -1.5);
      ageText =
        giantCapacity > 0.3
          ? `+${Math.round(u * 25000).toLocaleString()} yr Post-AGB`
          : `${ageGyr.toFixed(2)} Gyr`;
      if (giantCapacity > 0.3) {
        phase = 'Post-AGB Core Unveiling (CSPN)';
        L = 3600 * (1.0 - 0.5 * u);
        Teff = 3000 + (135000 - 3000) * Math.pow(u, 0.4);
        currentMass = 0.5 + 0.12 * Math.pow(M0, 0.6);
        isPlanetaryNebula = true;
        nebulaRadiusAU = u * 4.5;
      } else {
        phase = 'Helium White Dwarf';
        L = 0.02 * (1 - 0.3 * u);
        Teff = 8500 * (1 - 0.2 * u);
        currentMass = M0 * 0.95;
      }
    } else {
      const u = (progressPct - 89.0) / 11.0;
      const coolingGyr = u * 8.0;
      ageGyr = tMS_Gyr + 1.55 * Math.pow(M0, -1.5) + coolingGyr;
      ageText =
        ageGyr >= 1000
          ? `${(ageGyr / 1000).toFixed(2)} Tyr`
          : `${ageGyr.toFixed(2)} Gyr`;
      phase = 'Degenerate White Dwarf';
      isRemnant = true;
      remnantType = 'White Dwarf';
      currentMass =
        giantCapacity > 0.3 ? 0.5 + 0.12 * Math.pow(M0, 0.6) : M0 * 0.95;
      const rWD = 0.0125 * Math.pow(currentMass / 0.6, -1 / 3);
      L =
        0.12 *
        Math.pow(1 + coolingGyr * 2.5, -1.3) *
        (giantCapacity > 0.3 ? 1.0 : 0.4);
      Teff = Math.max(2200, T_SUN * Math.pow(L / (rWD * rWD), 0.25));
    }
  }

  // STEP 2: Stefan-Boltzmann Radiative Radius
  let radiusRsun: number;
  let radiusKm: number;
  if (isRemnant) {
    if (remnantType === 'Black Hole') {
      radiusKm = 2.95 * currentMass;
      radiusRsun = radiusKm / R_SUN_KM;
    } else if (remnantType === 'Neutron Star') {
      radiusKm = 11.5;
      radiusRsun = radiusKm / R_SUN_KM;
    } else {
      radiusRsun = 0.0125 * Math.pow(currentMass / 0.6, -1 / 3);
      radiusKm = radiusRsun * R_SUN_KM;
    }
  } else {
    radiusRsun = Math.sqrt(Math.max(1e-6, L)) / Math.pow(Teff / T_SUN, 2);
    radiusKm = radiusRsun * R_SUN_KM;
  }
  const radiusAU = radiusRsun * R_SUN_AU;

  // STEP 3: Pure Dynamic Morgan-Keenan Classification
  const mk = deriveMorganKeenanClass(
    Teff,
    Math.log10(Math.max(1e-6, L)),
    radiusRsun,
    phase
  );

  // STEP 4: Kopparapu Habitable Zone & Condensation Snowline
  const rInHZ = isSupernova ? 0 : Math.sqrt(Math.max(1e-6, L) / S_EFF_INNER);
  const rOutHZ = isSupernova ? 0 : Math.sqrt(Math.max(1e-6, L) / S_EFF_OUTER);
  const snowLineAU = isSupernova ? 0 : 2.7 * Math.sqrt(Math.max(1e-6, L));

  return {
    phase,
    spectralMK: mk.full,
    spectralDesc: mk.sub,
    ageGyr,
    ageText,
    L,
    Teff,
    currentMass,
    radiusRsun,
    radiusAU,
    radiusKm,
    rInHZ,
    rOutHZ,
    snowLineAU,
    isPulsating,
    isSupernova,
    isPlanetaryNebula,
    nebulaRadiusAU,
    snShockRadiusAU,
    isRemnant,
    remnantType,
  };
}
