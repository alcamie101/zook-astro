export interface CelestialSubMoon {
  id: string;
  name: string;
  size: number;
  dist: number;
  type: string;
}

export interface CelestialMoon {
  id: string;
  name: string;
  size: number;
  dist: number;
  type: string;
  moons: CelestialSubMoon[];
}

export interface CelestialBody {
  id: string;
  name: string;
  sma: number;
  type: string;
  size: number;
  speed: number;
  ring?: boolean;
  randMode?: boolean;
  moons: CelestialMoon[];
  totalDist?: number;
  stepDelta?: number;
}

export interface StarConfig {
  name: string;
  class: string;
  size: number;
  dist?: number;
}

export interface SystemScaling {
  scale: number;
  exponent: number;
  offset: number;
}

export interface ArchitectSystem {
  id: string;
  _galaxyId: string;
  hierarchy: 'single' | 'circumbinary' | 's_type_binary';
  scaling: SystemScaling;
  star: StarConfig;
  star2?: StarConfig;
  bodies: CelestialBody[];
}

export interface GalaxyStarNode {
  dx: number;
  dy: number;
  dz?: number;
  class: string;
  size: number;
  isCenter?: boolean;
}

export interface GalaxySystemNode {
  id: string;
  name: string;
  x: number;
  y: number;
  z?: number;
  presetKey: string | null;
  desc: string;
  stars: GalaxyStarNode[];
}

export type Hyperlane = [string, string];

export type ArchitectViewMode = 'galaxy' | 'orrery' | 'linear';

export const ARCHITECT_CLASS_COLORS: Record<string, string> = {
  pc_b_star: '#7ea4ff',
  pc_a_star: '#b4c9ff',
  pc_f_star: '#f5f7ff',
  pc_g_star: '#fff2a1',
  pc_k_star: '#ffb56b',
  pc_m_star: '#ff6b6b',
  pc_white_dwarf: '#d4ebf2',
  pc_neutron_star: '#00ffff',
  pc_black_hole: '#3a2050',
  pc_continental: '#3ba55d',
  pc_ocean: '#2b7fff',
  pc_arid: '#e09848',
  pc_desert: '#f0c058',
  pc_savannah: '#c4aa48',
  pc_tropical: '#2ea070',
  pc_arctic: '#c8e2ff',
  pc_alpine: '#8a9fa8',
  pc_tundra: '#788878',
  pc_gas_giant: '#d9a05b',
  pc_ice_giant: '#5bc4d9',
  pc_molten: '#ff4820',
  pc_barren: '#8c7e72',
  pc_barren_cold: '#647285',
  pc_toxic: '#84cc16',
  pc_frozen: '#a5f3fc',
  belt: '#94a3b8'
};

export const CELESTIAL_CLASSES = [
  { value: 'pc_continental', label: 'Continental (Habitable)', category: 'Terrestrial' },
  { value: 'pc_ocean', label: 'Ocean World', category: 'Terrestrial' },
  { value: 'pc_arid', label: 'Arid World', category: 'Terrestrial' },
  { value: 'pc_desert', label: 'Desert World', category: 'Terrestrial' },
  { value: 'pc_savannah', label: 'Savannah World', category: 'Terrestrial' },
  { value: 'pc_tropical', label: 'Tropical Jungle', category: 'Terrestrial' },
  { value: 'pc_arctic', label: 'Arctic World', category: 'Terrestrial' },
  { value: 'pc_alpine', label: 'Alpine World', category: 'Terrestrial' },
  { value: 'pc_tundra', label: 'Tundra World', category: 'Terrestrial' },
  { value: 'pc_gas_giant', label: 'Gas Giant (Jupiter/Saturn-class)', category: 'Jovian' },
  { value: 'pc_ice_giant', label: 'Ice Giant (Neptune-class)', category: 'Jovian' },
  { value: 'pc_molten', label: 'Molten World (Volcanic)', category: 'Inhospitable' },
  { value: 'pc_barren', label: 'Barren Rock (Mercury-like)', category: 'Inhospitable' },
  { value: 'pc_barren_cold', label: 'Barren Cold (Moon-like)', category: 'Inhospitable' },
  { value: 'pc_toxic', label: 'Toxic Greenhouse (Venus-like)', category: 'Inhospitable' },
  { value: 'pc_frozen', label: 'Deep Frozen Glacial', category: 'Inhospitable' },
  { value: 'belt', label: 'Asteroid Debris Belt', category: 'Belt' },
  { value: 'pc_b_star', label: 'Star: B-Class Blue Giant', category: 'Stellar' },
  { value: 'pc_a_star', label: 'Star: A-Class White Star', category: 'Stellar' },
  { value: 'pc_f_star', label: 'Star: F-Class Yellow-White', category: 'Stellar' },
  { value: 'pc_g_star', label: 'Star: G-Class Solar Analog', category: 'Stellar' },
  { value: 'pc_k_star', label: 'Star: K-Class Orange Dwarf', category: 'Stellar' },
  { value: 'pc_m_star', label: 'Star: M-Class Red Dwarf', category: 'Stellar' },
  { value: 'pc_white_dwarf', label: 'Star: White Dwarf Remnant', category: 'Stellar' },
  { value: 'pc_neutron_star', label: 'Star: Pulsar / Neutron Star', category: 'Stellar' },
  { value: 'pc_black_hole', label: 'Star: Micro Black Hole', category: 'Stellar' }
];

export function isStarClass(cls?: string): boolean {
  if (!cls) return false;
  return cls.includes('_star') || cls === 'pc_black_hole' || cls === 'pc_neutron_star' || cls === 'pc_white_dwarf';
}

export function computeClusterGeometry(starClasses: string[]): GalaxyStarNode[] {
  const count = starClasses.length;
  if (count <= 1) {
    return [{ dx: 0, dy: 0, dz: 0, class: starClasses[0] || 'pc_g_star', size: 3.2 }];
  }
  if (count === 2) {
    return [
      { dx: -2.8, dy: 0, dz: 0.5, class: starClasses[0], size: 3.0 },
      { dx: 2.8, dy: 0, dz: -0.5, class: starClasses[1], size: 2.4 }
    ];
  }
  if (count === 3) {
    const r = 3.6;
    return [
      { dx: 0, dy: -r, dz: 0.8, class: starClasses[0], size: 3.0 },
      { dx: -r * 0.866, dy: r * 0.5, dz: -0.4, class: starClasses[1], size: 2.5 },
      { dx: r * 0.866, dy: r * 0.5, dz: -0.4, class: starClasses[2], size: 2.2 }
    ];
  }
  if (count === 4) {
    const d = 3.8;
    return [
      { dx: 0, dy: -d, dz: 0.5, class: starClasses[0], size: 2.8 },
      { dx: d, dy: 0, dz: -0.5, class: starClasses[1], size: 2.6 },
      { dx: 0, dy: d, dz: 0.5, class: starClasses[2], size: 2.3 },
      { dx: -d, dy: 0, dz: -0.5, class: starClasses[3], size: 2.1 }
    ];
  }

  // 5+: Primary star in center, remainder in regular polygon ring
  const outerCount = count - 1;
  const ringRadius = 5.0;
  const result: GalaxyStarNode[] = [{ dx: 0, dy: 0, dz: 0, class: starClasses[0], size: 3.2, isCenter: true }];

  for (let i = 0; i < outerCount; i++) {
    const theta = (i * Math.PI * 2) / outerCount - Math.PI / 2;
    result.push({
      dx: Math.cos(theta) * ringRadius,
      dy: Math.sin(theta) * ringRadius,
      dz: Math.sin(i * 1.5) * 1.2,
      class: starClasses[i + 1] || 'pc_m_star',
      size: Math.max(1.6, 2.6 - i * 0.12),
      isCenter: false
    });
  }

  return result;
}

export function calculatePlanetSize(r_earth: number | null, m_earth: number | null): number {
  const R_JUP = 11.209;
  const SQRT_M_JUP = 17.828;
  let x: number | null = null;
  let isFromRadius = true;

  if (r_earth !== null && !isNaN(r_earth) && r_earth > 0) {
    x = r_earth;
    isFromRadius = true;
  } else if (m_earth !== null && !isNaN(m_earth) && m_earth > 0) {
    x = Math.sqrt(m_earth);
    isFromRadius = false;
  }

  if (!x) return 14;
  const threshold = isFromRadius ? R_JUP : SQRT_M_JUP;
  let calculatedSize: number;

  if (x < threshold) {
    calculatedSize = 18 * Math.pow(x, 0.3);
  } else {
    calculatedSize = 40 * Math.pow(x / threshold, 0.3);
  }

  return Math.max(6, Math.min(45, Math.round(calculatedSize)));
}

export function computeRadialDistances(system: ArchitectSystem): ArchitectSystem {
  const { scale, exponent, offset } = system.scaling;
  let runningDist = offset;

  const updatedBodies = system.bodies.map(b => {
    const exactDist = scale * Math.pow(Math.max(0.001, b.sma), exponent) + offset;
    const stepDelta = Math.max(1, Math.round(exactDist - runningDist));
    runningDist = exactDist;
    return {
      ...b,
      totalDist: Math.round(exactDist),
      stepDelta: stepDelta
    };
  });

  return {
    ...system,
    bodies: updatedBodies
  };
}

export function generateStellarisScript(system: ArchitectSystem): string {
  const { scale, exponent, offset } = system.scaling;
  const sysClass = system.star.class;

  let script = `# Generated by Zook Astro-Architect v2.0\n`;
  script += `# Conversion Model: r = ${scale} * (a_AU ^ ${exponent}) + ${offset}\n\n`;
  script += `${system.id} = {\n`;
  script += `\tname = "NAME_${system.star.name.replace(/\\s+/g, '_')}"\n`;
  script += `\tclass = "${sysClass}"\n\n`;

  // Primary Star
  script += `\tplanet = {\n`;
  script += `\t\tname = "NAME_${system.star.name.replace(/\\s+/g, '_')}"\n`;
  script += `\t\tclass = "${system.star.class}"\n`;
  script += `\t\torbit_distance = 0\n`;
  script += `\t\torbit_angle = 1\n`;
  script += `\t\tsize = ${system.star.size}\n`;
  script += `\t\thas_ring = no\n`;
  script += `\t}\n\n`;

  // Close Circumbinary Pair Companion (P-Type)
  if (system.hierarchy === 'circumbinary' && system.star2) {
    script += `\t# Close Circumbinary Companion\n`;
    script += `\tplanet = {\n`;
    script += `\t\tname = "NAME_${system.star2.name.replace(/\\s+/g, '_')}"\n`;
    script += `\t\tclass = "${system.star2.class}"\n`;
    script += `\t\torbit_distance = ${system.star2.dist || 14}\n`;
    script += `\t\torbit_angle = 180\n`;
    script += `\t\tsize = ${system.star2.size}\n`;
    script += `\t\thas_ring = no\n`;
    script += `\t}\n\n`;
  }

  // Bodies & Moons
  system.bodies.forEach(b => {
    if (b.type === 'belt') {
      script += `\t# Asteroid Belt: ${b.sma} AU (Radius: ${b.totalDist || 20})\n`;
      script += `\tasteroid_belt = {\n`;
      script += `\t\ttype = "rocky_asteroid_belt"\n`;
      script += `\t\tradius = ${b.totalDist || 20}\n`;
      script += `\t}\n\n`;
    } else {
      script += `\t# ${b.name}: ${b.sma} AU (Step: ${b.stepDelta || 10} | Cumulative: ${b.totalDist || 30})\n`;
      script += `\tplanet = {\n`;
      script += `\t\tname = "NAME_${b.name.replace(/\\s+/g, '_')}"\n`;
      script += `\t\tclass = "${b.type}"\n`;
      script += `\t\tsize = ${b.size}\n`;
      script += `\t\torbit_distance = ${b.stepDelta || 10}\n`;
      script += `\t\torbit_angle = { min = 0 max = 360 }\n`;
      if (b.ring) script += `\t\thas_ring = yes\n`;

      if (b.moons && b.moons.length > 0) {
        b.moons.forEach(m => {
          script += `\n\t\tmoon = {\n`;
          script += `\t\t\tname = "NAME_${m.name.replace(/\\s+/g, '_')}"\n`;
          script += `\t\t\tclass = "${m.type}"\n`;
          script += `\t\t\tsize = ${m.size}\n`;
          script += `\t\t\torbit_distance = ${m.dist}\n`;
          script += `\t\t\torbit_angle = { min = 0 max = 360 }\n`;

          if (m.moons && m.moons.length > 0) {
            m.moons.forEach(sm => {
              script += `\n\t\t\tmoon = {\n`;
              script += `\t\t\t\tname = "NAME_${sm.name.replace(/\\s+/g, '_')}"\n`;
              script += `\t\t\t\tclass = "${sm.type}"\n`;
              script += `\t\t\t\tsize = ${sm.size}\n`;
              script += `\t\t\t\torbit_distance = ${sm.dist}\n`;
              script += `\t\t\t\torbit_angle = { min = 0 max = 360 }\n`;
              script += `\t\t\t}\n`;
            });
          }

          script += `\t\t}\n`;
        });
      }

      script += `\t}\n\n`;
    }
  });

  script += `}`;
  return script;
}
