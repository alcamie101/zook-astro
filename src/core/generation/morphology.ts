import { PRNG } from './prng';
import { SectorMorphology } from '../../types/astrophysics';

export interface Coordinates3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Samples 3D spatial coordinates (in light-years) according to galactic morphology.
 */
export function sampleCoordinates(
  rng: PRNG,
  morphology: SectorMorphology,
  radiusLy: number
): Coordinates3D {
  if (morphology === 'core') {
    // Globular Cluster / Dense Core (Plummer-like profile)
    const u = rng.next();
    const r = radiusLy * 0.35 * Math.sqrt(u / (1 - u + 1e-4));
    const cappedR = Math.min(radiusLy * 1.2, r);
    const theta = rng.next() * Math.PI * 2;
    const phi = Math.acos(2 * rng.next() - 1); // Spherical
    return {
      x: cappedR * Math.sin(phi) * Math.cos(theta),
      y: cappedR * Math.sin(phi) * Math.sin(theta),
      z: cappedR * Math.cos(phi) * 0.8,
    };
  } else if (morphology === 'cluster') {
    // Open Cluster / Stellar Nursery (3 Gaussian sub-clusters)
    const subCenters = [
      { x: -radiusLy * 0.35, y: -radiusLy * 0.25, z: -radiusLy * 0.1 },
      { x: radiusLy * 0.3, y: -radiusLy * 0.1, z: radiusLy * 0.15 },
      { x: 0, y: radiusLy * 0.35, z: 0 },
    ];
    const center = subCenters[Math.floor(rng.next() * 3)];
    const r = rng.nextGaussian(0, radiusLy * 0.25);
    const theta = rng.next() * Math.PI * 2;
    const zOffset = rng.nextGaussian(0, radiusLy * 0.15);
    return {
      x: center.x + Math.cos(theta) * r,
      y: center.y + Math.sin(theta) * r,
      z: center.z + zOffset,
    };
  } else if (morphology === 'halo') {
    // Diffuse Galactic Halo (Spherical projection)
    const r = Math.pow(rng.next(), 0.5) * radiusLy;
    const theta = rng.next() * Math.PI * 2;
    const phi = Math.acos(2 * rng.next() - 1);
    return {
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta),
      z: r * Math.cos(phi),
    };
  } else {
    // Galactic Thin Disk (Exponential radial falloff + thin scale height)
    const r = -Math.log(1 - rng.next() * 0.92) * (radiusLy * 0.45);
    const theta = rng.next() * Math.PI * 2;
    const z = rng.nextGaussian(0, radiusLy * 0.08); // Thin disk scale height
    return {
      x: Math.cos(theta) * r,
      y: Math.sin(theta) * r,
      z: z,
    };
  }
}
