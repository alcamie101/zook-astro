export type SpectralCategory = 'ob' | 'af' | 'g' | 'km' | 'remnant';

export type SectorMorphology = 'disk' | 'core' | 'cluster' | 'halo';

export type FilterCategory = 'all' | 'ob' | 'g' | 'km' | 'remnant' | 'hz';

export type PlanetStatus =
  | 'Active'
  | 'Candidate Habitable'
  | 'Scorched'
  | 'Runaway Greenhouse'
  | 'Cold Desert'
  | 'Deep Frozen'
  | 'Engulfed (Vaporized)'
  | 'Sterilized (Supernova Shock)';

export interface MorganKeenanResult {
  full: string;
  sub: string;
  pillColor?: string;
}

export interface StarColorData {
  r: number;
  g: number;
  b: number;
  glow: string;
  hex: string;
  cat: SpectralCategory;
}

export interface StellarEvolutionState {
  phase: string;
  spectralMK: string;
  spectralDesc: string;
  ageGyr: number;
  ageText: string;
  L: number;
  Teff: number;
  currentMass: number;
  radiusRsun: number;
  radiusAU: number;
  radiusKm: number;
  rInHZ: number;
  rOutHZ: number;
  snowLineAU: number;
  isPulsating: boolean;
  isSupernova: boolean;
  isPlanetaryNebula: boolean;
  nebulaRadiusAU: number;
  snShockRadiusAU: number;
  isRemnant: boolean;
  remnantType: 'Black Hole' | 'Neutron Star' | 'White Dwarf' | null;
}

export interface PlanetArchetype {
  id: number;
  name: string;
  a0: number;
  currentA: number;
  ecc: number;
  incDeg: number;
  massEarth: number;
  radiusEarth: number;
  albedo: number;
  greenhouse: number;
  type: string;
  atmosphere: string;
  color: string;
  angle: number;
  isEngulfed: boolean;
  status: PlanetStatus;
}

export interface PlanetPhysicsComputed {
  currentA: number;
  periodDays: number;
  periodYrs: number;
  fluxWm2: number;
  fluxRatio: number;
  teq: number;
  tsurf: number;
  tsurfC: number;
  gravityG: string;
  isTidallyLocked: boolean;
  status: PlanetStatus;
  isEngulfed: boolean;
}

export interface StarSystem {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
  progenitorMass: number;
  starAgeGyr: number;
  progressPct: number;
  starState: StellarEvolutionState;
  colorData: StarColorData;
  planets: PlanetArchetype[];
  hasHZPlanet: boolean;
}

export interface SectorConfiguration {
  starCount: number;
  morphology: SectorMorphology;
  meanAgeGyr: number;
  ageSigmaGyr: number;
  metallicityDex: number;
  radiusLy: number;
  seed: number;
}

export type ActiveAppMode = 'home' | 'sector-3d' | 'astro-architect';
