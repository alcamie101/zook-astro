import * as THREE from 'three';

export interface PlanetShaderOptions {
  diffuseTexture: THREE.CanvasTexture;
  specularTexture: THREE.CanvasTexture;
  nightTexture: THREE.CanvasTexture;
  starColorHex: string;
  planetType: string;
  isEngulfed: boolean;
}

/**
 * Creates a custom raytraced solar illumination shader material for planets.
 * Maps procedural terrain/cloud textures, computes exact incident solar rays
 * from the host star at (0, 0, 0), realistic spherical day/night terminators,
 * ocean specular highlights, atmospheric limb scattering, and deep-space night shadows.
 */
export function createPlanetShaderMaterial(options: PlanetShaderOptions): THREE.ShaderMaterial {
  const sColor = new THREE.Color(options.starColorHex);

  // Type code: 0: Terrestrial/Desert, 1: Habitable Ocean, 2: Lava/Scorched, 3: Gas Giant, 4: Ice
  let typeCode = 0;
  let atmosphereGlow = 0.25;

  if (options.planetType.includes('Lava') || options.planetType.includes('Iron')) {
    typeCode = 2;
    atmosphereGlow = 0.08;
  } else if (options.planetType.includes('Ocean')) {
    typeCode = 1;
    atmosphereGlow = 0.95; // Strong Earth-like atmospheric Rayleigh rim
  } else if (
    options.planetType.includes('Gas') ||
    options.planetType.includes('Jovian') ||
    options.planetType.includes('Neptune')
  ) {
    typeCode = 3;
    atmosphereGlow = 0.65;
  } else if (options.planetType.includes('Ice') || options.planetType.includes('Frozen')) {
    typeCode = 4;
    atmosphereGlow = 0.2;
  }

  const vertexShader = `
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    varying vec2 vUv;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform sampler2D uDiffuseMap;
    uniform sampler2D uSpecularMap;
    uniform sampler2D uNightMap;
    uniform vec3 uSunPosition;
    uniform vec3 uStarColor;
    uniform float uAtmosphereGlow;
    uniform int uPlanetType;
    uniform int uIsEngulfed;

    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    varying vec2 vUv;
    varying vec3 vViewPosition;

    void main() {
      if (uIsEngulfed == 1) {
        // Incinerated molten sphere
        gl_FragColor = vec4(1.0, 0.20, 0.05, 1.0);
        return;
      }

      vec3 N = normalize(vWorldNormal);
      vec3 V = normalize(vViewPosition);

      // Exact ray from surface vertex toward the center of the Sun at (0, 0, 0)
      vec3 L = normalize(uSunPosition - vWorldPosition);
      float NdotL = dot(N, L);

      // Soft spherical terminator penumbra based on finite angular size of the star
      float penumbra = 0.07;
      float daylight = smoothstep(-penumbra, penumbra, NdotL);
      float diffuse = max(0.0, NdotL);

      // Sample procedural textures
      vec4 diffuseSample = texture2D(uDiffuseMap, vUv);
      vec4 specularSample = texture2D(uSpecularMap, vUv);
      vec4 nightSample = texture2D(uNightMap, vUv);

      // Specular ocean / ice glint (reflection of the sun into camera)
      vec3 H = normalize(L + V);
      float NdotH = max(0.0, dot(N, H));
      float specStrength = specularSample.r;
      float specular = pow(NdotH, 48.0) * specStrength * daylight * 1.35;

      // Atmospheric Rayleigh rim scattering along the sunlit limb
      float NdotV = max(0.0, dot(N, V));
      float rim = pow(1.0 - NdotV, 3.8) * max(0.0, NdotL + 0.28) * uAtmosphereGlow;
      vec3 rimColor = (uPlanetType == 1) 
        ? vec3(0.35, 0.8, 1.0) 
        : (uPlanetType == 3 ? vec3(0.95, 0.8, 0.45) : diffuseSample.rgb * 1.3);

      // Deep space night-side ambient shadow + nocturnal lights / volcanic magma
      vec3 nightSide = diffuseSample.rgb * 0.02 + nightSample.rgb * 1.4;

      // Dayside illumination modulated by the star's actual emission spectrum
      vec3 daySide = (diffuseSample.rgb * diffuse + vec3(specular)) * uStarColor * 1.4;

      // Composite final color: day/night terminator blend + atmospheric rim
      vec3 finalColor = mix(nightSide, daySide, daylight) + rim * rimColor;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uDiffuseMap: { value: options.diffuseTexture },
      uSpecularMap: { value: options.specularTexture },
      uNightMap: { value: options.nightTexture },
      uSunPosition: { value: new THREE.Vector3(0, 0, 0) },
      uStarColor: { value: sColor },
      uAtmosphereGlow: { value: atmosphereGlow },
      uPlanetType: { value: typeCode },
      uIsEngulfed: { value: options.isEngulfed ? 1 : 0 },
    },
  });
}
