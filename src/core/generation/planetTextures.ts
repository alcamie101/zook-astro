import * as THREE from 'three';
import { Noise3D } from '../textures/noise';


export interface GeneratedPlanetTexturePack {
  diffuseTexture: THREE.CanvasTexture;
  specularTexture: THREE.CanvasTexture;
  nightTexture: THREE.CanvasTexture;
}

// In-memory cache to prevent regenerating identical planet textures
const textureCache = new Map<string, GeneratedPlanetTexturePack>();

/**
 * Procedurally generates high-fidelity, seamless 2D equirectangular textures
 * tailored to the planet's archetype, seed, and location relative to the Habitable Zone.
 */
export function generateProceduralPlanetTextures(
  planetId: number,
  planetSeed: number,
  planetType: string,
  currentA: number,
  rInHZ: number,
  rOutHZ: number
): GeneratedPlanetTexturePack {
  const cacheKey = `${planetId}_${planetSeed}_${planetType}_${currentA.toFixed(2)}_${rInHZ.toFixed(2)}_${rOutHZ.toFixed(2)}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const width = 512;
  const height = 256;

  // 1. Diffuse Albedo Canvas
  const dCanvas = document.createElement('canvas');
  dCanvas.width = width;
  dCanvas.height = height;
  const dCtx = dCanvas.getContext('2d')!;
  const dImgData = dCtx.createImageData(width, height);
  const dData = dImgData.data;

  // 2. Specular / Ocean Reflection Canvas
  const sCanvas = document.createElement('canvas');
  sCanvas.width = width;
  sCanvas.height = height;
  const sCtx = sCanvas.getContext('2d')!;
  const sImgData = sCtx.createImageData(width, height);
  const sData = sImgData.data;

  // 3. Nighttime Emission Canvas (city lights, lava fissures, auroral glow)
  const nCanvas = document.createElement('canvas');
  nCanvas.width = width;
  nCanvas.height = height;
  const nCtx = nCanvas.getContext('2d')!;
  const nImgData = nCtx.createImageData(width, height);
  const nData = nImgData.data;

  const noise = new Noise3D(planetSeed + planetId * 7919);
  const detailNoise = new Noise3D(planetSeed * 3 + 12345);

  // Determine climate realm based on position relative to Habitable Zone
  const isInsideHZ = currentA >= rInHZ && currentA <= rOutHZ;
  const isScorched = currentA < rInHZ * 0.45;
  const isRunaway = currentA >= rInHZ * 0.45 && currentA < rInHZ;
  const isColdDesert = currentA > rOutHZ && currentA <= rOutHZ * 1.7;
  const isOuterGiant = currentA > rOutHZ * 1.7;

  // Generate pixels with seamless cylindrical mapping
  for (let py = 0; py < height; py++) {
    const v = py / height; // [0, 1] from North Pole to South Pole
    const lat = (v - 0.5) * Math.PI; // [-pi/2, pi/2]
    const sinLat = Math.sin(lat);

    // Polar distance metric for ice caps
    const polarFactor = Math.pow(Math.abs(sinLat), 3.5);

    for (let px = 0; px < width; px++) {
      const u = px / width; // [0, 1] longitude
      const lon = u * Math.PI * 2;

      // 3D coordinates on a cylinder for 100% seamless longitudinal wrapping
      const nx = Math.cos(lon) * 1.5;
      const ny = Math.sin(lon) * 1.5;
      const nz = v * 3.0;

      const idx = (py * width + px) * 4;

      // Primary terrain / atmospheric noise
      const n1 = noise.fBm(nx * 1.2, ny * 1.2, nz * 1.2, 5, 0.5);
      const nDetail = detailNoise.fBm(nx * 4.0, ny * 4.0, nz * 4.0, 3, 0.5);

      let r = 0, g = 0, b = 0;
      let spec = 0; // Specular reflectivity
      let nightR = 0, nightG = 0, nightB = 0;

      if (isScorched || planetType.includes('Lava') || planetType.includes('Iron')) {
        // SCORCHED LAVA & BASALT WORLD
        // Dark blackened crust with glowing incandescent magma lakes and cracks
        const crust = Math.pow(n1, 1.4);
        if (crust < 0.42) {
          // Molten incandescent magma river / lake
          const heat = 1.0 - crust / 0.42;
          r = Math.min(255, 255);
          g = Math.min(255, Math.floor(70 + heat * 160));
          b = Math.floor(heat * 40);
          spec = Math.floor(180 * heat); // Molten liquid reflectiveness

          // Nightside intense volcanic glow
          nightR = 255;
          nightG = Math.floor(60 + heat * 140);
          nightB = Math.floor(heat * 30);
        } else {
          // Solid basaltic volcanic crust with craters
          const c = Math.floor(30 + crust * 45 + nDetail * 20);
          r = c + 15;
          g = c;
          b = c - 5;
          spec = 15;
        }
      } else if (isRunaway) {
        // RUNAWAY GREENHOUSE (VENUS ANALOG)
        // High-albedo swirling dense sulfuric acid and supercritical CO2 cloud decks
        const clouds = noise.fBm(nx * 2.0 + ny * 0.5, ny * 2.0 - nx * 0.5, nz * 1.5, 4, 0.5);
        r = Math.floor(215 + clouds * 35);
        g = Math.floor(180 + clouds * 40);
        b = Math.floor(100 + clouds * 30);
        spec = 60;
      } else if (isInsideHZ && (planetType.includes('Ocean') || planetType.includes('Terrestrial'))) {
        // TEMPERATE HABITABLE OCEAN WORLD (EARTH ANALOG)
        const seaLevel = 0.52;
        const elevation = n1 * 0.7 + nDetail * 0.3;

        // Ice caps at extreme poles
        if (polarFactor > 0.45 && elevation > 0.35) {
          // Glacial ice sheets
          r = 230 + Math.floor(nDetail * 25);
          g = 240 + Math.floor(nDetail * 15);
          b = 255;
          spec = 160;
        } else if (elevation < seaLevel) {
          // Liquid Oceans (Deep oceanic blue to turquoise shallow shelves)
          const depth = (seaLevel - elevation) / seaLevel;
          r = Math.floor(12 + (1 - depth) * 25);
          g = Math.floor(60 + (1 - depth) * 75);
          b = Math.floor(140 + (1 - depth) * 90);
          spec = 255; // Maximum specular liquid reflection
        } else {
          // Continental Landmass (Forests, grasslands, savannahs, and mountain peaks)
          const altitude = (elevation - seaLevel) / (1 - seaLevel);
          if (altitude < 0.25) {
            // Coastal plains & temperate forests
            r = Math.floor(35 + nDetail * 30);
            g = Math.floor(115 + nDetail * 40);
            b = Math.floor(50 + nDetail * 20);
          } else if (altitude < 0.65) {
            // Elevated highlands & arid savannahs
            r = Math.floor(140 + nDetail * 40);
            g = Math.floor(130 + nDetail * 30);
            b = Math.floor(75 + nDetail * 20);
          } else {
            // Rugged snow-capped mountain peaks
            r = Math.floor(160 + altitude * 85);
            g = Math.floor(155 + altitude * 85);
            b = Math.floor(155 + altitude * 95);
          }
          spec = 35; // Matte rock / soil

          // Nocturnal City Lights / Bioluminescence on coastal landmasses
          if (altitude < 0.4 && nDetail > 0.68) {
            const cityIntensity = (nDetail - 0.68) / 0.32;
            nightR = Math.min(255, Math.floor(255 * cityIntensity));
            nightG = Math.min(255, Math.floor(215 * cityIntensity));
            nightB = Math.min(255, Math.floor(130 * cityIntensity));
          }
        }

        // Swirling dynamic water-vapor cloud overlay
        const cloudNoise = detailNoise.fBm(nx * 1.8 + 5.0, ny * 1.8 + 5.0, nz * 1.8, 4, 0.5);
        if (cloudNoise > 0.58) {
          const cloudDensity = (cloudNoise - 0.58) / 0.42;
          const cw = Math.floor(cloudDensity * 220);
          r = Math.min(255, r + cw);
          g = Math.min(255, g + cw);
          b = Math.min(255, b + cw);
          spec = Math.max(20, spec * (1 - cloudDensity * 0.7)); // Clouds diffuse specular glint
        }
      } else if (isColdDesert || planetType.includes('Desert')) {
        // COLD DESERT / MARS ANALOG
        // Iron-oxide red/ochre deserts, dark basaltic canyon rifts, and polar CO2 dry-ice caps
        if (polarFactor > 0.55) {
          // Dry-ice polar cap
          r = 245;
          g = 240;
          b = 248;
          spec = 130;
        } else {
          const regolith = n1 * 0.65 + nDetail * 0.35;
          r = Math.floor(170 + regolith * 75);
          g = Math.floor(80 + regolith * 50);
          b = Math.floor(45 + regolith * 30);
          spec = 20;
        }
      } else if (isOuterGiant && (planetType.includes('Gas') || planetType.includes('Jovian'))) {
        // JOVIAN GAS GIANT (JUPITER/SATURN ANALOG)
        // Zonal belts, turbulent shear eddies, and cyclonic Great Red Spot storm
        const latFreq = 28.0;
        const shear = Math.sin(lat * latFreq + nDetail * 2.2);
        const turbulence = noise.fBm(nx * 3.0, ny * 3.0, nz * 1.2, 4, 0.5);

        // Base banding color palette (rich ochre, creams, terracotta, and umber)
        const bandVal = (shear * 0.5 + 0.5) * 0.6 + turbulence * 0.4;
        r = Math.floor(190 + bandVal * 60);
        g = Math.floor(135 + bandVal * 65);
        b = Math.floor(75 + bandVal * 55);

        // Great Anticyclonic Storm Oval
        const stormLat = -0.38; // Southern hemisphere
        const stormLon = 0.45;
        const dStorm = Math.hypot((u - stormLon) * 2.5, lat - stormLat);
        if (dStorm < 0.22) {
          const stormEdge = (0.22 - dStorm) / 0.22;
          r = Math.min(255, Math.floor(r + stormEdge * 75));
          g = Math.max(0, Math.floor(g - stormEdge * 45));
          b = Math.max(0, Math.floor(b - stormEdge * 35));
        }
        spec = 50;
      } else if (planetType.includes('Sub-Neptune') || planetType.includes('Mini-Gas')) {
        // SUB-NEPTUNE (HAZY ATMOSPHERIC ENVELOPE)
        const haze = noise.fBm(nx * 1.5, ny * 1.5, nz * 2.0, 3, 0.5);
        r = Math.floor(70 + haze * 45);
        g = Math.floor(140 + haze * 60);
        b = Math.floor(215 + haze * 40);
        spec = 70;
      } else {
        // ICE GIANT & FROZEN PLUTO/EUROPA ANALOGS
        if (planetType.includes('Ice Giant')) {
          // Deep cyan methane atmosphere
          const bands = Math.sin(lat * 16.0 + nDetail * 1.5);
          const val = bands * 0.5 + 0.5;
          r = Math.floor(50 + val * 40);
          g = Math.floor(175 + val * 55);
          b = Math.floor(225 + val * 30);
          spec = 80;
        } else {
          // Cryogenic fractured ice crust with dark tholin patches
          const ice = n1 * 0.7 + nDetail * 0.3;
          if (ice < 0.32) {
            // Dark reddish-brown tholin hydrocarbons
            r = Math.floor(140 + nDetail * 40);
            g = Math.floor(75 + nDetail * 30);
            b = Math.floor(55 + nDetail * 20);
            spec = 35;
          } else {
            // Bright reflective nitrogen / methane ice sheets
            r = Math.floor(215 + ice * 35);
            g = Math.floor(225 + ice * 30);
            b = Math.floor(240 + ice * 15);
            spec = 140;
          }
        }
      }

      // Write Diffuse Pixel
      dData[idx] = Math.max(0, Math.min(255, r));
      dData[idx + 1] = Math.max(0, Math.min(255, g));
      dData[idx + 2] = Math.max(0, Math.min(255, b));
      dData[idx + 3] = 255;

      // Write Specular Pixel
      sData[idx] = spec;
      sData[idx + 1] = spec;
      sData[idx + 2] = spec;
      sData[idx + 3] = 255;

      // Write Night Emission Pixel
      nData[idx] = Math.max(0, Math.min(255, nightR));
      nData[idx + 1] = Math.max(0, Math.min(255, nightG));
      nData[idx + 2] = Math.max(0, Math.min(255, nightB));
      nData[idx + 3] = 255;
    }
  }

  dCtx.putImageData(dImgData, 0, 0);
  sCtx.putImageData(sImgData, 0, 0);
  nCtx.putImageData(nImgData, 0, 0);

  const diffuseTexture = new THREE.CanvasTexture(dCanvas);
  diffuseTexture.wrapS = THREE.RepeatWrapping;
  diffuseTexture.wrapT = THREE.ClampToEdgeWrapping;
  diffuseTexture.needsUpdate = true;

  const specularTexture = new THREE.CanvasTexture(sCanvas);
  specularTexture.wrapS = THREE.RepeatWrapping;
  specularTexture.wrapT = THREE.ClampToEdgeWrapping;
  specularTexture.needsUpdate = true;

  const nightTexture = new THREE.CanvasTexture(nCanvas);
  nightTexture.wrapS = THREE.RepeatWrapping;
  nightTexture.wrapT = THREE.ClampToEdgeWrapping;
  nightTexture.needsUpdate = true;

  const result: GeneratedPlanetTexturePack = {
    diffuseTexture,
    specularTexture,
    nightTexture,
  };

  textureCache.set(cacheKey, result);
  return result;
}
