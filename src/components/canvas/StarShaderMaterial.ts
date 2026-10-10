import * as THREE from 'three';
import { SpectralCategory } from '../../types/astrophysics';

export interface StarShaderOptions {
  teff: number;
  phase: string;
  spectralCat: SpectralCategory;
  spectralMK: string;
  baseHex: string;
}

/**
 * Computes scientifically grounded stellar color palettes, granulation parameters,
 * and magnetic starspot characteristics based on the star's spectral classification (OBAFGKM)
 * and evolutionary state.
 */
function getStellarParameters(options: StarShaderOptions) {
  const { teff, phase, spectralCat, baseHex } = options;

  // Remnants check
  if (phase.includes('Black Hole')) {
    return {
      coreColor: new THREE.Color('#000000'),
      baseColor: new THREE.Color('#000000'),
      limbColor: new THREE.Color('#7c3aed'),
      spotUmbraColor: new THREE.Color('#000000'),
      spotPenumbraColor: new THREE.Color('#000000'),
      faculaeColor: new THREE.Color('#a855f7'),
      spotIntensity: 0.0,
      granuleScale: 10.0,
      flowSpeed: 0.2,
      isBlackHole: 1,
    };
  }

  if (phase.includes('Neutron Star')) {
    return {
      coreColor: new THREE.Color('#ffffff'),
      baseColor: new THREE.Color('#38bdf8'),
      limbColor: new THREE.Color('#6366f1'),
      spotUmbraColor: new THREE.Color('#0c4a6e'),
      spotPenumbraColor: new THREE.Color('#0284c7'),
      faculaeColor: new THREE.Color('#ffffff'),
      spotIntensity: 0.0,
      granuleScale: 35.0,
      flowSpeed: 2.8,
      isBlackHole: 0,
    };
  }

  if (phase.includes('White Dwarf')) {
    return {
      coreColor: new THREE.Color('#ffffff'),
      baseColor: new THREE.Color('#e0f2fe'),
      limbColor: new THREE.Color('#93c5fd'),
      spotUmbraColor: new THREE.Color('#38bdf8'),
      spotPenumbraColor: new THREE.Color('#60a5fa'),
      faculaeColor: new THREE.Color('#ffffff'),
      spotIntensity: 0.05,
      granuleScale: 30.0,
      flowSpeed: 0.4,
      isBlackHole: 0,
    };
  }

  // 1. Spectral Class M (Cool Red Dwarfs & Red Supergiants, Teff < 3700 K)
  // Deep convective zones drive massive starspots covering large fractions of the disk
  if (teff < 3700 || spectralCat === 'km' && teff < 4000) {
    return {
      coreColor: new THREE.Color('#ff8a3d'),
      baseColor: new THREE.Color(baseHex || '#dc2626'),
      limbColor: new THREE.Color('#7f1d1d'),
      spotUmbraColor: new THREE.Color('#1c0408'),
      spotPenumbraColor: new THREE.Color('#580a18'),
      faculaeColor: new THREE.Color('#ffb066'),
      spotIntensity: 1.55, // Prominent large starspot complexes
      granuleScale: 12.0, // Large, sluggish convective bubbling
      flowSpeed: 0.55,
      isBlackHole: 0,
    };
  }

  // 2. Spectral Class K (Orange Dwarfs, 3700 K <= Teff < 5200 K)
  // High magnetic flare activity, deep orange/amber photosphere
  if (teff < 5200) {
    return {
      coreColor: new THREE.Color('#fed7aa'),
      baseColor: new THREE.Color(baseHex || '#f59e0b'),
      limbColor: new THREE.Color('#9a3412'),
      spotUmbraColor: new THREE.Color('#290b02'),
      spotPenumbraColor: new THREE.Color('#7c2d12'),
      faculaeColor: new THREE.Color('#fef08a'),
      spotIntensity: 1.25,
      granuleScale: 15.0,
      flowSpeed: 0.75,
      isBlackHole: 0,
    };
  }

  // 3. Spectral Class G (Yellow Solar Analogs, 5200 K <= Teff < 6000 K, e.g. Sun G2V)
  // Golden yellow disk, warm amber limb darkening, crisp umbra/penumbra sunspots and bright faculae
  if (teff < 6000 || spectralCat === 'g') {
    return {
      coreColor: new THREE.Color('#fffbe6'), // Hot convective cell centers
      baseColor: new THREE.Color(baseHex || '#fbbf24'), // Photosphere gold-yellow
      limbColor: new THREE.Color('#ea580c'), // Warm orange-red limb
      spotUmbraColor: new THREE.Color('#260e04'), // Dark cool magnetic core (~4000K)
      spotPenumbraColor: new THREE.Color('#853b11'), // Penumbral filament ring (~5000K)
      faculaeColor: new THREE.Color('#fff7cc'), // Hot magnetic plage boundaries
      spotIntensity: 1.05, // Standard solar sunspot activity
      granuleScale: 18.0, // Fine solar granules (~1000 km scale)
      flowSpeed: 0.9,
      isBlackHole: 0,
    };
  }

  // 4. Spectral Class F (Yellow-White Stars, 6000 K <= Teff < 7500 K, e.g. Procyon)
  if (teff < 7500) {
    return {
      coreColor: new THREE.Color('#ffffff'),
      baseColor: new THREE.Color(baseHex || '#fef3c7'),
      limbColor: new THREE.Color('#d97706'),
      spotUmbraColor: new THREE.Color('#382312'),
      spotPenumbraColor: new THREE.Color('#9a3412'),
      faculaeColor: new THREE.Color('#ffffff'),
      spotIntensity: 0.65,
      granuleScale: 22.0,
      flowSpeed: 1.15,
      isBlackHole: 0,
    };
  }

  // 5. Spectral Class A (White Stars, 7500 K <= Teff < 10000 K, e.g. Sirius, Vega)
  // Dominated by radiative envelope, subtle high-frequency wave patterns
  if (teff < 10000 || spectralCat === 'af') {
    return {
      coreColor: new THREE.Color('#ffffff'),
      baseColor: new THREE.Color(baseHex || '#f0f9ff'),
      limbColor: new THREE.Color('#60a5fa'),
      spotUmbraColor: new THREE.Color('#1e293b'),
      spotPenumbraColor: new THREE.Color('#475569'),
      faculaeColor: new THREE.Color('#ffffff'),
      spotIntensity: 0.25, // Few magnetic spots
      granuleScale: 26.0,
      flowSpeed: 1.45,
      isBlackHole: 0,
    };
  }

  // 6. Spectral Class O / B (Massive Hot Blue Stars, Teff >= 10000 K, e.g. Rigel, Spica)
  // Piercing blue-violet radiation, violent supersonic convective shocks
  return {
    coreColor: new THREE.Color('#ffffff'),
    baseColor: new THREE.Color(baseHex || '#38bdf8'),
    limbColor: new THREE.Color('#1e3a8a'),
    spotUmbraColor: new THREE.Color('#0f172a'),
    spotPenumbraColor: new THREE.Color('#1e293b'),
    faculaeColor: new THREE.Color('#ffffff'),
    spotIntensity: 0.15,
    granuleScale: 32.0,
    flowSpeed: 2.1,
    isBlackHole: 0,
  };
}

/**
 * Creates an animated physical stellar photosphere shader.
 * Includes:
 * 1. Convective solar granulation (boiling plasma cells) computed seamlessly in 3D object space
 * 2. Physically distributed sunspots (umbra + penumbra) in active mid-latitude belts
 * 3. Surrounding hot magnetic faculae / plages
 * 4. Eddington / Claret limb darkening with atmospheric coronal edge scattering
 * 5. Accurate color grading matched to Morgan-Keenan spectral classification
 */
export function createStarShaderMaterial(options: StarShaderOptions): THREE.ShaderMaterial {
  const p = getStellarParameters(options);

  const vertexShader = `
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec3 vObjectPosition;
    varying vec3 vViewPosition;

    void main() {
      // Pass local 3D coordinate on sphere for seamless 3D noise (zero polar seams)
      vObjectPosition = position;
      vNormal = normalize(normalMatrix * normal);

      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;

      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;

      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform vec3 uCoreColor;
    uniform vec3 uBaseColor;
    uniform vec3 uLimbColor;
    uniform vec3 uSpotUmbraColor;
    uniform vec3 uSpotPenumbraColor;
    uniform vec3 uFaculaeColor;
    uniform float uSpotIntensity;
    uniform float uGranuleScale;
    uniform float uFlowSpeed;
    uniform int uIsBlackHole;

    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec3 vObjectPosition;
    varying vec3 vViewPosition;

    // Fast 3D Simplex noise by Ian McEwan & Stefan Gustavson (Ashima Arts)
    vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);

      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);

      vec3 x1 = x0 - i1 + 1.0 * C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

      i = mod(i, 289.0);
      vec4 p = permute(permute(permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      float n_ = 0.142857142857;
      vec3  ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);

      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);

      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
    }

    void main() {
      if (uIsBlackHole == 1) {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewPosition);
        float mu = max(0.0, dot(N, V));
        vec3 horizon = mix(vec3(0.0), uLimbColor, pow(1.0 - mu, 6.0));
        gl_FragColor = vec4(horizon, 1.0);
        return;
      }

      vec3 normPos = normalize(vObjectPosition);
      vec3 N = normalize(vNormal);
      vec3 V = normalize(vViewPosition);

      // 1. Solar Convective Granulation (Boiling Plasma Cells)
      float t = uTime * uFlowSpeed;
      vec3 flow1 = normPos * uGranuleScale + vec3(t * 0.12, t * 0.08, t * 0.10);
      vec3 flow2 = normPos * (uGranuleScale * 1.95) - vec3(t * 0.10, -t * 0.07, t * 0.09);

      float n1 = snoise(flow1);
      float n2 = snoise(flow2);

      // Non-linear cellular curve: bright convective cell centers with darker intergranular lanes
      float cell1 = pow(clamp(n1 * 0.5 + 0.5, 0.0, 1.0), 1.3);
      float cell2 = pow(clamp(n2 * 0.5 + 0.5, 0.0, 1.0), 1.8);
      float granulation = cell1 * 0.70 + cell2 * 0.30;

      // 2. Solar Limb Darkening: Eddington / Claret atmospheric model
      float mu = max(0.0, dot(N, V));
      float limbDarkening = clamp(0.32 + 0.68 * pow(mu, 0.75), 0.0, 1.0);

      // 3. Physically Placed Sunspots in Active Latitudinal Belts
      // Spörer's Law: Sunspots predominantly reside in belts around +/- 10° to 35° latitude
      float lat = abs(normPos.y);
      float latBelt = exp(-pow((lat - 0.28) / 0.15, 2.0));

      // Magnetic field active region clustering with bipolar spot pairs
      float spotNoise1 = snoise(normPos * 3.8 + vec3(8.2, 4.3, 11.5));
      float spotNoise2 = snoise(normPos * 10.5 + vec3(t * 0.015, 0.0, t * 0.01));
      float spotSignal = (spotNoise1 * 0.72 + spotNoise2 * 0.28) * latBelt * uSpotIntensity;

      // Sunspot morphology: Umbra, Penumbra, and surrounding hot Faculae
      float umbra = smoothstep(0.38, 0.48, spotSignal);
      float penumbra = smoothstep(0.24, 0.38, spotSignal);
      float faculae = smoothstep(0.14, 0.24, spotSignal) * (1.0 - penumbra);

      // 4. Color Assembly & Compositing
      // Center of convective granules burns toward hot core color, margins to base color
      vec3 granuleColor = mix(uBaseColor, uCoreColor, granulation);

      // Apply limb darkening (cools down toward uLimbColor at glancing angles)
      vec3 surfaceColor = mix(uLimbColor, granuleColor, limbDarkening);

      // Hot magnetic plages / faculae surrounding the spot groups
      surfaceColor = mix(surfaceColor, uFaculaeColor, faculae * 0.65);

      // Striated cooler penumbra ring
      surfaceColor = mix(surfaceColor, uSpotPenumbraColor, penumbra);

      // Deep dark cool magnetic umbra core
      surfaceColor = mix(surfaceColor, uSpotUmbraColor, umbra);

      // Atmospheric / coronal edge grazing shimmer
      float rim = pow(1.0 - mu, 4.5) * 0.55;
      surfaceColor += uCoreColor * rim;

      gl_FragColor = vec4(surfaceColor, 1.0);
    }
  `;

  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0.0 },
      uCoreColor: { value: p.coreColor },
      uBaseColor: { value: p.baseColor },
      uLimbColor: { value: p.limbColor },
      uSpotUmbraColor: { value: p.spotUmbraColor },
      uSpotPenumbraColor: { value: p.spotPenumbraColor },
      uFaculaeColor: { value: p.faculaeColor },
      uSpotIntensity: { value: p.spotIntensity },
      uGranuleScale: { value: p.granuleScale },
      uFlowSpeed: { value: p.flowSpeed },
      uIsBlackHole: { value: p.isBlackHole },
    },
  });
}
