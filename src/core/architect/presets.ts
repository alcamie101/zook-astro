import { ArchitectSystem, GalaxySystemNode, Hyperlane, computeClusterGeometry } from '../../types/architect';

export const ARCHITECT_PRESETS: Record<string, ArchitectSystem> = {
  sol: {
    id: "sol_system_initializer",
    _galaxyId: "sol",
    hierarchy: "single",
    scaling: { scale: 50, exponent: 0.667, offset: 0 },
    star: { name: "Sol", class: "pc_g_star", size: 30 },
    star2: { name: "Companion B", class: "pc_k_star", size: 20, dist: 14 },
    bodies: [
      { id: "b1", name: "Mercury", sma: 0.387, type: "pc_barren", size: 14, speed: 1.6, randMode: false, moons: [] },
      { id: "b2", name: "Venus", sma: 0.723, type: "pc_toxic", size: 18, speed: 1.2, randMode: false, moons: [] },
      { 
        id: "b3", name: "Earth", sma: 1.000, type: "pc_continental", size: 19, speed: 1.0, randMode: false,
        moons: [{ id: "m1", name: "Luna", type: "pc_barren_cold", size: 8, dist: 3.5, moons: [] }]
      },
      { 
        id: "b4", name: "Mars", sma: 1.524, type: "pc_desert", size: 16, speed: 0.8, randMode: false,
        moons: [
          { id: "m2", name: "Phobos", type: "pc_barren_cold", size: 5, dist: 2.2, moons: [] },
          { id: "m3", name: "Deimos", type: "pc_barren_cold", size: 4, dist: 3.6, moons: [] }
        ]
      },
      { id: "b5", name: "Main Asteroid Belt", sma: 2.700, type: "belt", size: 4, speed: 0.5, randMode: false, moons: [] },
      { 
        id: "b6", name: "Jupiter", sma: 5.204, type: "pc_gas_giant", size: 40, speed: 0.4, ring: true, randMode: false,
        moons: [
          { id: "m4", name: "Io", type: "pc_molten", size: 8, dist: 3.2, moons: [] },
          { id: "m5", name: "Europa", type: "pc_frozen", size: 7, dist: 4.8, moons: [] },
          { id: "m6", name: "Ganymede", type: "pc_frozen", size: 11, dist: 6.5, moons: [] },
          { id: "m7", name: "Callisto", type: "pc_barren_cold", size: 10, dist: 8.5, moons: [] }
        ]
      },
      { 
        id: "b7", name: "Saturn", sma: 9.582, type: "pc_gas_giant", size: 36, speed: 0.3, ring: true, randMode: false,
        moons: [
          { 
            id: "m8", name: "Titan", type: "pc_toxic", size: 10, dist: 5.0,
            moons: [{ id: "sm1", name: "Titan Sub-Probe Alpha", type: "pc_barren_cold", size: 3, dist: 2.0 }]
          },
          { id: "m9", name: "Enceladus", type: "pc_frozen", size: 6, dist: 3.0, moons: [] }
        ]
      },
      { id: "b8", name: "Uranus", sma: 19.20, type: "pc_ice_giant", size: 28, speed: 0.22, ring: true, randMode: false, moons: [] },
      { id: "b9", name: "Neptune", sma: 30.05, type: "pc_ice_giant", size: 28, speed: 0.18, randMode: false, moons: [{ id: "m10", name: "Triton", type: "pc_frozen", size: 8, dist: 4.2, moons: [] }] },
      { id: "b10", name: "Kuiper Belt Ring", sma: 39.5, type: "belt", size: 5, speed: 0.12, randMode: false, moons: [] }
    ]
  },

  alphacentauri: {
    id: "alpha_centauri_system_initializer",
    _galaxyId: "alphacentauri",
    hierarchy: "circumbinary",
    scaling: { scale: 50, exponent: 0.667, offset: 0 },
    star: { name: "α Centauri A (Rigil Kentaurus)", class: "pc_g_star", size: 30 },
    star2: { name: "α Centauri B (Toliman)", class: "pc_k_star", size: 24, dist: 16 },
    bodies: [
      { name: "Inner Circumbinary Dust", sma: 1.25, type: "belt", size: 3, speed: 1.3, id: "ac1", moons: [] },
      { name: "Centauri Primary I", sma: 2.15, type: "pc_desert", size: 17, speed: 1.0, id: "ac2", moons: [] },
      { name: "Centauri Habitable Prime", sma: 3.40, type: "pc_continental", size: 21, speed: 0.8, id: "ac3", moons: [{ id: "acm1", name: "Chiron", type: "pc_barren_cold", size: 7, dist: 3.8, moons: [] }] },
      { 
        name: "Proxima Centauri (Companion)", sma: 26.0, type: "pc_m_star", size: 16, speed: 0.22, id: "ac4",
        moons: [
          { id: "pm1", name: "Proxima b", type: "pc_ocean", size: 18, dist: 3.5, moons: [] },
          { id: "pm2", name: "Proxima d", type: "pc_molten", size: 13, dist: 2.0, moons: [] }
        ]
      }
    ]
  },

  sirius: {
    id: "sirius_system_initializer",
    _galaxyId: "sirius",
    hierarchy: "s_type_binary",
    scaling: { scale: 50, exponent: 0.667, offset: 0 },
    star: { name: "Sirius A", class: "pc_a_star", size: 34 },
    star2: { name: "Sirius B (White Dwarf)", class: "pc_white_dwarf", size: 14, dist: 14 },
    bodies: [
      { id: "s1", name: "Inner Ash Belt", sma: 0.85, type: "belt", size: 4, speed: 1.4, moons: [] },
      { id: "s2", name: "Sirius Ab", sma: 1.85, type: "pc_desert", size: 17, speed: 1.1, moons: [] },
      { id: "s3", name: "Sirius Ac", sma: 3.10, type: "pc_continental", size: 20, speed: 0.85, moons: [{ id: "sm_m1", name: "Sirius Ac I", type: "pc_barren_cold", size: 7, dist: 5, moons: [] }] },
      { id: "s4", name: "Sirius Ad", sma: 4.90, type: "pc_barren", size: 14, speed: 0.65, moons: [] },
      { id: "s5", name: "Sirius B (The Pup)", sma: 19.8, type: "pc_white_dwarf", size: 16, speed: 0.28, moons: [{ id: "sm_m2", name: "Graveyard Remnants", type: "pc_barren_cold", size: 6, dist: 4, moons: [] }] }
    ]
  },

  procyon: {
    id: "procyon_system_initializer",
    _galaxyId: "procyon",
    hierarchy: "s_type_binary",
    scaling: { scale: 50, exponent: 0.667, offset: 0 },
    star: { name: "Procyon A", class: "pc_f_star", size: 32 },
    star2: { name: "Procyon B", class: "pc_white_dwarf", size: 13, dist: 14 },
    bodies: [
      { id: "pr1", name: "Procyon Ab", sma: 0.42, type: "pc_molten", size: 14, speed: 1.55, moons: [] },
      { id: "pr2", name: "Procyon Ac", sma: 0.88, type: "pc_barren", size: 17, speed: 1.15, moons: [] },
      { id: "pr3", name: "Procyon Ad", sma: 1.65, type: "pc_toxic", size: 19, speed: 0.85, moons: [] },
      { id: "pr4", name: "Procyon B", sma: 15.0, type: "pc_white_dwarf", size: 14, speed: 0.30, moons: [] }
    ]
  },

  epsiloneridani: {
    id: "epsilon_eridani_initializer",
    _galaxyId: "epsiloneridani",
    hierarchy: "single",
    scaling: { scale: 50, exponent: 0.667, offset: 0 },
    star: { name: "Epsilon Eridani", class: "pc_k_star", size: 26 },
    bodies: [
      { id: "ee1", name: "Epsilon Eridani I", sma: 0.28, type: "pc_molten", size: 13, speed: 1.75, moons: [] },
      { id: "ee2", name: "Epsilon Eridani II", sma: 0.58, type: "pc_arid", size: 17, speed: 1.25, moons: [] },
      { id: "ee3", name: "Inner Warm Asteroid Belt", sma: 3.00, type: "belt", size: 4, speed: 0.60, moons: [] },
      { id: "ee4", name: "AEgir (b)", sma: 3.48, type: "pc_gas_giant", size: 38, speed: 0.52, ring: true, moons: [] }
    ]
  },

  gliese667: {
    id: "gliese_667_initializer",
    _galaxyId: "gliese667",
    hierarchy: "circumbinary",
    scaling: { scale: 50, exponent: 0.667, offset: 0 },
    star: { name: "Gliese 667 A", class: "pc_k_star", size: 25 },
    star2: { name: "Gliese 667 B", class: "pc_k_star", size: 23, dist: 14 },
    bodies: [
      { id: "g1", name: "Circumbinary Dust Belt", sma: 22.0, type: "belt", size: 4, speed: 0.22, moons: [] },
      { 
        id: "g2", name: "Gliese 667 C", sma: 52.0, type: "pc_m_star", size: 16, speed: 0.08,
        moons: [
          { id: "gm1", name: "Gliese 667 Cb", type: "pc_molten", size: 14, dist: 4.5, moons: [] },
          { id: "gm2", name: "Gliese 667 Cc (Super-Earth)", type: "pc_continental", size: 18, dist: 3.0, moons: [] }
        ]
      }
    ]
  },

  castor: {
    id: "castor_system_initializer",
    _galaxyId: "castor",
    hierarchy: "single",
    scaling: { scale: 45, exponent: 0.667, offset: 0 },
    star: { name: "Castor Aa", class: "pc_a_star", size: 32 },
    bodies: [
      { id: "c1", name: "Castor Ab", sma: 0.12, type: "pc_m_star", size: 12, speed: 2.8, moons: [] },
      { 
        id: "c2", name: "Castor B", sma: 24.5, type: "pc_a_star", size: 30, speed: 0.20,
        moons: [{ id: "c2m", name: "Castor Bb", type: "pc_m_star", size: 11, dist: 4.0, moons: [] }]
      },
      { 
        id: "c3", name: "Castor C (YY Gem)", sma: 56.0, type: "pc_m_star", size: 15, speed: 0.07,
        moons: [{ id: "c3m", name: "YY Geminorum B", type: "pc_m_star", size: 14, dist: 3.5, moons: [] }]
      }
    ]
  },

  arcturus: {
    id: "arcturus_system_initializer",
    _galaxyId: "arcturus",
    hierarchy: "single",
    scaling: { scale: 45, exponent: 0.667, offset: 0 },
    star: { name: "Arcturus", class: "pc_k_star", size: 42 },
    bodies: [
      { id: "ar1", name: "Engulfment Rim", sma: 0.35, type: "belt", size: 4, speed: 2.2, moons: [] },
      { id: "ar2", name: "Arcturus b", sma: 1.10, type: "pc_molten", size: 12, speed: 1.4, moons: [] },
      { id: "ar3", name: "Arcturus e (Sanctuary)", sma: 13.2, type: "pc_continental", size: 22, speed: 0.42, moons: [] }
    ]
  },

  kepler90: {
    id: "kepler_90_initializer",
    _galaxyId: "kepler90",
    hierarchy: "single",
    scaling: { scale: 80, exponent: 0.75, offset: 5 },
    star: { name: "Kepler-90", class: "pc_g_star", size: 30 },
    bodies: [
      { id: "k1", name: "Kepler-90b", sma: 0.074, type: "pc_molten", size: 16, speed: 2.5, moons: [] },
      { id: "k2", name: "Kepler-90c", sma: 0.089, type: "pc_molten", size: 16, speed: 2.3, moons: [] },
      { id: "k3", name: "Kepler-90i", sma: 0.123, type: "pc_toxic", size: 16, speed: 2.0, moons: [] },
      { id: "k4", name: "Kepler-90d", sma: 0.320, type: "pc_continental", size: 23, speed: 1.4, moons: [] },
      { id: "k5", name: "Kepler-90e", sma: 0.420, type: "pc_continental", size: 22, speed: 1.2, moons: [] },
      { id: "k6", name: "Kepler-90f", sma: 0.480, type: "pc_ocean", size: 23, speed: 1.1, moons: [] },
      { id: "k7", name: "Kepler-90g", sma: 0.710, type: "pc_gas_giant", size: 36, speed: 0.9, ring: true, moons: [] },
      { id: "k8", name: "Kepler-90h", sma: 1.010, type: "pc_gas_giant", size: 42, speed: 0.7, ring: false, moons: [] }
    ]
  },

  trappist1: {
    id: "trappist1_system_initializer",
    _galaxyId: "trappist1",
    hierarchy: "single",
    scaling: { scale: 200, exponent: 1.0, offset: 10 },
    star: { name: "TRAPPIST-1", class: "pc_m_star", size: 14 },
    bodies: [
      { id: "t1", name: "TRAPPIST-1b", sma: 0.0115, type: "pc_molten", size: 19, speed: 2.2, moons: [] },
      { id: "t2", name: "TRAPPIST-1c", sma: 0.0158, type: "pc_barren", size: 19, speed: 1.8, moons: [] },
      { id: "t3", name: "TRAPPIST-1d", sma: 0.0223, type: "pc_continental", size: 17, speed: 1.4, moons: [] },
      { id: "t4", name: "TRAPPIST-1e (Earth-like)", sma: 0.0293, type: "pc_continental", size: 18, speed: 1.1, moons: [] },
      { id: "t5", name: "TRAPPIST-1f", sma: 0.0385, type: "pc_frozen", size: 18, speed: 0.9, moons: [] },
      { id: "t6", name: "TRAPPIST-1g", sma: 0.0469, type: "pc_frozen", size: 19, speed: 0.7, moons: [] }
    ]
  },

  denebola: {
    id: "denebola_system_initializer",
    _galaxyId: "denebola",
    hierarchy: "single",
    scaling: { scale: 50, exponent: 0.667, offset: 0 },
    star: { name: "Denebola", class: "pc_a_star", size: 32 },
    bodies: [
      { id: "d1", name: "Scorched Dust Ring", sma: 0.60, type: "belt", size: 4, speed: 1.5, moons: [] },
      { id: "d2", name: "Unity", sma: 2.65, type: "pc_continental", size: 20, speed: 0.7, moons: [] },
      { id: "d3", name: "Debris Belt", sma: 8.00, type: "belt", size: 5, speed: 0.4, moons: [] },
      { id: "d4", name: "Outer Giant", sma: 18.00, type: "pc_gas_giant", size: 36, speed: 0.2, moons: [] }
    ]
  },

  sgra: {
    id: "sagittarius_a_star_initializer",
    _galaxyId: "sgra",
    hierarchy: "single",
    scaling: { scale: 35, exponent: 0.6, offset: 15 },
    star: { name: "Sagittarius A*", class: "pc_black_hole", size: 48 },
    bodies: [
      { id: "sg1", name: "Relativistic Accretion Ring", sma: 0.45, type: "belt", size: 6, speed: 3.5, moons: [] },
      { id: "sg2", name: "S2 Stellar Tracer", sma: 4.8, type: "pc_b_star", size: 24, speed: 1.2, moons: [] },
      { id: "sg3", name: "X-Ray Pulsar Beacon", sma: 12.0, type: "pc_neutron_star", size: 16, speed: 0.8, moons: [] },
      { id: "sg4", name: "Tidal Disruption Cloud", sma: 28.0, type: "belt", size: 5, speed: 0.35, moons: [] }
    ]
  }
};

export const INITIAL_GALAXY_SYSTEMS: GalaxySystemNode[] = [
  { 
    id: 'sgra', name: 'Sagittarius A*', x: 0, y: 0, z: 0, presetKey: 'sgra', desc: 'Galactic Center Supermassive Core',
    stars: [{ dx: 0, dy: 0, dz: 0, class: 'pc_black_hole', size: 5.5, isCenter: true }]
  },
  { 
    id: 'sol', name: 'Sol', x: -160, y: 190, z: 12, presetKey: 'sol', desc: 'Solar Core System (8 Planets)',
    stars: [{ dx: 0, dy: 0, dz: 0, class: 'pc_g_star', size: 3.4 }]
  },
  { 
    id: 'alphacentauri', name: 'α Centauri', x: -148, y: 202, z: 10, presetKey: 'alphacentauri', desc: 'Trinary System (G2V + K1V + M5.5V)',
    stars: computeClusterGeometry(['pc_g_star', 'pc_k_star', 'pc_m_star'])
  },
  { 
    id: 'sirius', name: 'Sirius', x: -178, y: 172, z: -8, presetKey: 'sirius', desc: 'Binary Star (A0V + DA2 White Dwarf)',
    stars: computeClusterGeometry(['pc_a_star', 'pc_white_dwarf'])
  },
  { 
    id: 'procyon', name: 'Procyon', x: -136, y: 176, z: 15, presetKey: 'procyon', desc: 'Binary Star (F5IV Subgiant + White Dwarf)',
    stars: computeClusterGeometry(['pc_f_star', 'pc_white_dwarf'])
  },
  { 
    id: 'epsiloneridani', name: 'ε Eridani', x: -190, y: 215, z: -18, presetKey: 'epsiloneridani', desc: 'Active K2V Orange Dwarf + Asteroid Rings',
    stars: computeClusterGeometry(['pc_k_star'])
  },
  { 
    id: 'gliese667', name: 'Gliese 667', x: -110, y: 130, z: 22, presetKey: 'gliese667', desc: 'Trinary System (K3V + K5V + M1.5V)',
    stars: computeClusterGeometry(['pc_k_star', 'pc_k_star', 'pc_m_star'])
  },
  { 
    id: 'castor', name: 'Castor', x: -210, y: 140, z: -12, presetKey: 'castor', desc: 'Sextuple System (Castor A+B+C)',
    stars: computeClusterGeometry(['pc_a_star', 'pc_a_star', 'pc_m_star', 'pc_m_star', 'pc_m_star', 'pc_m_star'])
  },
  { 
    id: 'arcturus', name: 'Arcturus', x: -90, y: 250, z: 35, presetKey: 'arcturus', desc: 'K1.5III Swollen Orange Giant',
    stars: computeClusterGeometry(['pc_k_star'])
  },
  { 
    id: 'kepler90', name: 'Kepler-90', x: -260, y: 70, z: -25, presetKey: 'kepler90', desc: '8-Planet Resonant Solar Analog',
    stars: computeClusterGeometry(['pc_g_star'])
  },
  { 
    id: 'trappist1', name: 'TRAPPIST-1', x: -230, y: 260, z: -15, presetKey: 'trappist1', desc: 'Ultra-Cool M-Dwarf (7 Terrestrial Worlds)',
    stars: computeClusterGeometry(['pc_m_star'])
  },
  { 
    id: 'denebola', name: 'Denebola', x: -60, y: 290, z: 28, presetKey: 'denebola', desc: 'A3V Debris Disk Star',
    stars: computeClusterGeometry(['pc_a_star'])
  },
  { 
    id: 'vega', name: 'Vega', x: -30, y: 190, z: 14, presetKey: null, desc: 'Luminous A0V Standard Star',
    stars: computeClusterGeometry(['pc_a_star'])
  },
  { 
    id: 'altair', name: 'Altair', x: 20, y: 160, z: -10, presetKey: null, desc: 'Rapid Rotator (A7V)',
    stars: computeClusterGeometry(['pc_a_star'])
  },
  { 
    id: 'barnard', name: "Barnard's Star", x: -164, y: 197, z: 8, presetKey: null, desc: 'High Proper Motion M4V Red Dwarf',
    stars: computeClusterGeometry(['pc_m_star'])
  },
  { 
    id: 'alnitak', name: 'Alnitak', x: -280, y: 310, z: -40, presetKey: null, desc: 'O9.7Ib Massive Blue Supergiant Binary',
    stars: computeClusterGeometry(['pc_b_star', 'pc_b_star'])
  }
];

export const INITIAL_HYPERLANES: Hyperlane[] = [
  ['sol', 'alphacentauri'],
  ['sol', 'sirius'],
  ['sol', 'procyon'],
  ['sol', 'epsiloneridani'],
  ['alphacentauri', 'barnard'],
  ['barnard', 'sol'],
  ['sirius', 'castor'],
  ['procyon', 'arcturus'],
  ['arcturus', 'denebola'],
  ['epsiloneridani', 'trappist1'],
  ['castor', 'kepler90'],
  ['kepler90', 'alnitak'],
  ['trappist1', 'alnitak'],
  ['gliese667', 'vega'],
  ['vega', 'altair'],
  ['gliese667', 'sgra'],
  ['procyon', 'gliese667']
];
