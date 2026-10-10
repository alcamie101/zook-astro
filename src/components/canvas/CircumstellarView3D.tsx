import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Maximize2, RotateCcw, Eye, Play, Pause } from 'lucide-react';
import { StarSystem } from '../../types/astrophysics';
import { computePlanetPhysics } from '../../core/generation/planets';
import { createPlanetShaderMaterial } from './PlanetShaderMaterial';
import { createStarShaderMaterial } from './StarShaderMaterial';
import { generateProceduralPlanetTextures } from '../../core/generation/planetTextures';

interface CircumstellarView3DProps {
  selectedStar: StarSystem | null;
  selectedPlanetIndex: number;
  onSelectPlanet: (index: number) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const CircumstellarView3D: React.FC<CircumstellarView3DProps> = ({
  selectedStar,
  selectedPlanetIndex,
  onSelectPlanet,
  isExpanded = false,
  onToggleExpand,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const starMeshRef = useRef<THREE.Mesh | null>(null);
  const starGlowRef = useRef<THREE.Sprite | null>(null);
  const starVisualRadiusRef = useRef<number>(1.0);
  const starLightRef = useRef<THREE.PointLight | null>(null);
  const hzMeshRef = useRef<THREE.Mesh | null>(null);
  const planetMeshesRef = useRef<THREE.Mesh[]>([]);
  const orbitLinesRef = useRef<THREE.Line[]>([]);
  const animTimeRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const isPlayingRef = useRef(true);
  const [speed, setSpeed] = useState(1.0);
  const speedRef = useRef(1.0);

  const togglePlay = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      isPlayingRef.current = next;
      return next;
    });
  };

  const handleSpeedChange = (val: number) => {
    setSpeed(val);
    speedRef.current = val;
  };

  // Keyboard shortcut: Space toggles play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focused Planet Camera Tracking State
  const [focusedPlanet, setFocusedPlanet] = useState<number | null>(null);
  const focusedPlanetIndexRef = useRef<number | null>(null);
  const targetRadiusRef = useRef<number | null>(null);
  const targetSystemRadiusRef = useRef<number | null>(null);
  const targetSystemCenterRef = useRef(new THREE.Vector3(0, 0, 0));
  const dragDistanceRef = useRef(0);

  // 3D Camera Spherical Coordinates
  const sphericalRef = useRef({
    radius: 55,
    theta: Math.PI / 4,
    phi: Math.PI / 3, // ~60 degrees inclination
  });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const isDraggingRef = useRef(false);
  const isRightDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { radius, theta, phi } = sphericalRef.current;
    cameraRef.current.position.x =
      cameraTargetRef.current.x + radius * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y =
      cameraTargetRef.current.y + radius * Math.cos(phi);
    cameraRef.current.position.z =
      cameraTargetRef.current.z + radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(cameraTargetRef.current);
  };

  const focusOnPlanet = (planetIdx: number) => {
    if (!selectedStar) return;
    if (planetIdx < 0) {
      focusOnSun();
      return;
    }
    const p = selectedStar.planets[planetIdx];
    if (!p) return;

    onSelectPlanet(planetIdx);
    focusedPlanetIndexRef.current = planetIdx;
    setFocusedPlanet(planetIdx);
    targetSystemRadiusRef.current = null;

    const pMesh = planetMeshesRef.current[planetIdx];
    const pRadius = pMesh
      ? (pMesh.geometry as THREE.SphereGeometry).parameters.radius
      : 0.8;
    const targetZoomRadius = Math.max(2.4, pRadius * 4.2);
    targetRadiusRef.current = targetZoomRadius;
    sphericalRef.current.radius = targetZoomRadius;

    // Cinematic angle framing both the illuminated dayside and day/night terminator
    sphericalRef.current.theta = p.angle + Math.PI / 3.2;
    sphericalRef.current.phi = Math.PI / 2.7;

    if (pMesh) {
      cameraTargetRef.current.copy(pMesh.position);
    }
    updateCameraPosition();
  };

  const focusOnSun = () => {
    onSelectPlanet(-1);
    focusedPlanetIndexRef.current = null;
    setFocusedPlanet(null);
    targetRadiusRef.current = null;
    targetSystemRadiusRef.current = null;

    cameraTargetRef.current.set(0, 0, 0);

    if (selectedStar) {
      const lastPlanet = selectedStar.planets[selectedStar.planets.length - 1];
      const state = selectedStar.starState;
      const maxAU = Math.max(lastPlanet?.currentA || 3, state.rOutHZ, 3.5);
      const systemRadius = maxAU * 6.0 * (isExpanded ? 1.4 : 1.7);
      sphericalRef.current = {
        radius: systemRadius,
        theta: Math.PI / 4,
        phi: Math.PI / 3,
      };
    }
    updateCameraPosition();
  };

  const unfocusPlanet = () => {
    focusOnSun();
  };

  // Preset camera angle helper
  const setCameraPreset = (preset: 'top' | 'inclined' | 'edge' | 'planet') => {
    if (!selectedStar) return;
    if (preset === 'planet') {
      focusOnPlanet(selectedPlanetIndex);
      return;
    }

    unfocusPlanet();
    const state = selectedStar.starState;
    const lastPlanet = selectedStar.planets[selectedStar.planets.length - 1];
    const maxAU = Math.max(lastPlanet?.currentA || 3, state.rOutHZ, 3.5);
    const baseRadius = maxAU * 6.0 * (isExpanded ? 1.4 : 1.7);

    if (preset === 'top') {
      sphericalRef.current = { radius: baseRadius, theta: 0, phi: 0.05 };
      cameraTargetRef.current.set(0, 0, 0);
    } else if (preset === 'inclined') {
      sphericalRef.current = { radius: baseRadius, theta: Math.PI / 4, phi: Math.PI / 3 };
      cameraTargetRef.current.set(0, 0, 0);
    } else if (preset === 'edge') {
      sphericalRef.current = { radius: baseRadius, theta: 0, phi: Math.PI / 2 - 0.05 };
      cameraTargetRef.current.set(0, 0, 0);
    }
    updateCameraPosition();
  };

  // Helper to generate soft radial star corona sprite texture matching star spectral color
  const createCoronaTexture = (starColor: THREE.Color) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      const r = Math.round(starColor.r * 255);
      const g = Math.round(starColor.g * 255);
      const b = Math.round(starColor.b * 255);

      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.18, `rgba(${r}, ${g}, ${b}, 0.85)`);
      grad.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, 0.35)`);
      grad.addColorStop(0.75, `rgba(${r}, ${g}, ${b}, 0.08)`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#02040b');

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.01,
      2000
    );
    cameraRef.current = camera;
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Deep Space Lighting:
    // Very low ambient light to ensure physical pitch-black nightside shadows
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.03);
    scene.add(ambientLight);

    // Primary Solar Ray point light at (0, 0, 0)
    const starLight = new THREE.PointLight(0xffffff, 3.5, 0, 1.2);
    starLight.position.set(0, 0, 0);
    starLight.castShadow = true;
    scene.add(starLight);
    starLightRef.current = starLight;

    // 2. Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (isPlayingRef.current) {
        const curSpeed = speedRef.current;
        animTimeRef.current += curSpeed;

        // Animate Host Star Photosphere: boiling granulation, sunspots & axial rotation
        if (starMeshRef.current) {
          const mat = starMeshRef.current.material;
          if (mat instanceof THREE.ShaderMaterial && mat.uniforms?.uTime) {
            mat.uniforms.uTime.value = animTimeRef.current * 0.025;
          }
          // Axial differential rotation of the star (drifts sunspots smoothly across the disk)
          starMeshRef.current.rotation.y += 0.002 * curSpeed;

          // Pulse host star if in instability strip, or subtle coronal shimmer
          if (selectedStar?.starState.isPulsating) {
            const pulse = 1.0 + 0.18 * Math.sin(animTimeRef.current * 0.12);
            starMeshRef.current.scale.set(pulse, pulse, pulse);
            if (starGlowRef.current) {
              starGlowRef.current.scale.set(pulse * 3.5, pulse * 3.5, 1);
            }
          } else if (starGlowRef.current) {
            const shimmer = 1.0 + 0.025 * Math.sin(animTimeRef.current * 0.08);
            const baseScale = starVisualRadiusRef.current * 3.8;
            starGlowRef.current.scale.set(baseScale * shimmer, baseScale * shimmer, 1);
          }
        }

        // Advance planetary orbits via Keplerian velocity and rotate spheres on their axis
        if (selectedStar) {
          const state = selectedStar.starState;
          selectedStar.planets.forEach((planet, idx) => {
            const phys = computePlanetPhysics(planet, state, selectedStar.progenitorMass);
            const mesh = planetMeshesRef.current[idx];
            if (!mesh) return;

            if (phys.isEngulfed) {
              mesh.visible = false;
            } else {
              mesh.visible = true;
              // Keplerian orbital revolution around the sun scaled by speed
              planet.angle +=
                0.015 *
                curSpeed *
                Math.sqrt(
                  Math.max(0.1, state.currentMass) / Math.pow(phys.currentA, 3)
                );

              const scaleAU = 6.0;
              const r = phys.currentA * scaleAU;
              const incRad = (planet.incDeg * Math.PI) / 180;

              mesh.position.x = Math.cos(planet.angle) * r;
              mesh.position.z = Math.sin(planet.angle) * r;
              mesh.position.y = Math.sin(planet.angle) * r * Math.sin(incRad);

              // Axial spin: Day/Night terminator naturally sweeps across the planet!
              if (phys.isTidallyLocked) {
                // Synchronous 1:1 rotation: same face continuously faces the star
                mesh.rotation.y = -planet.angle;
              } else {
                // Diurnal planetary spin scaled by speed
                mesh.rotation.y += 0.018 * curSpeed;
              }
            }
          });
        }
      }

      // Planet camera tracking & smooth zoom interpolation
      if (focusedPlanetIndexRef.current !== null) {
        const focusedIdx = focusedPlanetIndexRef.current;
        const focusedMesh = planetMeshesRef.current[focusedIdx];
        if (focusedMesh && focusedMesh.visible) {
          // Continuously track the orbiting planet position
          cameraTargetRef.current.copy(focusedMesh.position);
          // Smoothly ease in zoom distance
          if (targetRadiusRef.current !== null) {
            const diff = targetRadiusRef.current - sphericalRef.current.radius;
            if (Math.abs(diff) > 0.02) {
              sphericalRef.current.radius += diff * 0.12;
            }
          }
          updateCameraPosition();
        }
      } else if (targetSystemRadiusRef.current !== null) {
        // Smooth glide back to system center overview
        cameraTargetRef.current.lerp(targetSystemCenterRef.current, 0.1);
        const rDiff = targetSystemRadiusRef.current - sphericalRef.current.radius;
        sphericalRef.current.radius += rDiff * 0.1;
        if (
          cameraTargetRef.current.distanceTo(targetSystemCenterRef.current) < 0.05 &&
          Math.abs(rDiff) < 0.2
        ) {
          targetSystemRadiusRef.current = null;
          cameraTargetRef.current.set(0, 0, 0);
        }
        updateCameraPosition();
      }

      renderer.render(scene, camera);
    };
    animate();

    // Dynamic ResizeObserver for smooth real-time drag resizing
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Rebuild 3D objects when star, planets, or progress changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !selectedStar) return;

    // Clean previous meshes
    if (starMeshRef.current) {
      scene.remove(starMeshRef.current);
      starMeshRef.current.geometry.dispose();
      (starMeshRef.current.material as THREE.Material).dispose();
      starMeshRef.current = null;
    }
    if (starGlowRef.current) {
      scene.remove(starGlowRef.current);
      starGlowRef.current.material.dispose();
      starGlowRef.current = null;
    }
    if (hzMeshRef.current) {
      scene.remove(hzMeshRef.current);
      hzMeshRef.current.geometry.dispose();
      (hzMeshRef.current.material as THREE.Material).dispose();
      hzMeshRef.current = null;
    }
    planetMeshesRef.current.forEach((m) => {
      scene.remove(m);
      m.geometry.dispose();
      if (Array.isArray(m.material)) {
        m.material.forEach((mat) => mat.dispose());
      } else {
        m.material.dispose();
      }
    });
    planetMeshesRef.current = [];

    orbitLinesRef.current.forEach((l) => {
      scene.remove(l);
      l.geometry.dispose();
      (l.material as THREE.Material).dispose();
    });
    orbitLinesRef.current = [];

    const state = selectedStar.starState;
    const scaleAU = 6.0;

    // Update solar point light color
    if (starLightRef.current) {
      starLightRef.current.color = new THREE.Color(selectedStar.colorData.hex);
    }

    // 1. Central Host Star Photosphere with Animated Granulation & Sunspots
    let starVisualRadius = Math.max(0.65, state.radiusAU * scaleAU);
    if (starVisualRadius > 8.0) starVisualRadius = 8.0;
    starVisualRadiusRef.current = starVisualRadius;

    const starColor = new THREE.Color(selectedStar.colorData.hex);
    const starGeom = new THREE.SphereGeometry(starVisualRadius, 48, 48);
    const starMat = createStarShaderMaterial({
      teff: state.Teff,
      phase: state.phase,
      spectralCat: selectedStar.colorData.cat,
      spectralMK: state.spectralMK,
      baseHex: selectedStar.colorData.hex,
    });
    const starMesh = new THREE.Mesh(starGeom, starMat);
    starMesh.userData = { isSun: true };
    scene.add(starMesh);
    starMeshRef.current = starMesh;

    // Glowing Corona Billboard Sprite
    const coronaTexture = createCoronaTexture(starColor);
    const coronaMat = new THREE.SpriteMaterial({
      map: coronaTexture,
      color: starColor,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const starGlow = new THREE.Sprite(coronaMat);
    const glowScale = starVisualRadius * 3.8;
    starGlow.scale.set(glowScale, glowScale, 1);
    scene.add(starGlow);
    starGlowRef.current = starGlow;

    // 2. Habitable Zone Ring
    if (!state.isSupernova && state.rOutHZ > 0) {
      const innerR = Math.max(0.25, state.rInHZ * scaleAU);
      const outerR = Math.max(innerR + 0.25, state.rOutHZ * scaleAU);
      const hzGeom = new THREE.RingGeometry(innerR, outerR, 64);
      const hzMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.22,
      });
      const hzMesh = new THREE.Mesh(hzGeom, hzMat);
      hzMesh.rotation.x = Math.PI / 2;
      scene.add(hzMesh);
      hzMeshRef.current = hzMesh;
    }

    // 3. Planetary Orbits & Raytraced Shader Planet Spheres
    selectedStar.planets.forEach((planet, idx) => {
      const phys = computePlanetPhysics(planet, state, selectedStar.progenitorMass);
      const r = phys.currentA * scaleAU;
      const incRad = (planet.incDeg * Math.PI) / 180;

      // Orbit Ring Line
      const orbitGeom = new THREE.BufferGeometry();
      const pts: THREE.Vector3[] = [];
      const segs = 64;
      for (let j = 0; j <= segs; j++) {
        const a = (j / segs) * Math.PI * 2;
        pts.push(
          new THREE.Vector3(
            Math.cos(a) * r,
            Math.sin(a) * r * Math.sin(incRad),
            Math.sin(a) * r
          )
        );
      }
      orbitGeom.setFromPoints(pts);
      const isSelected = idx === selectedPlanetIndex;
      const orbitMat = new THREE.LineBasicMaterial({
        color: phys.isEngulfed
          ? 0xef4444
          : isSelected
          ? 0x38bdf8
          : 0x334155,
        transparent: true,
        opacity: isSelected ? 0.85 : 0.35,
      });
      const orbitLine = new THREE.Line(orbitGeom, orbitMat);
      scene.add(orbitLine);
      orbitLinesRef.current.push(orbitLine);

      // Planet Sphere Mesh with Raytraced Solar Shadowing
      const pRadius = Math.max(
        0.32,
        Math.min(1.3, planet.radiusEarth * (isExpanded ? 0.24 : 0.20))
      );
      const pGeom = new THREE.SphereGeometry(pRadius, 32, 32);

      // Procedural Planet Textures tailored to its location relative to Habitable Zone
      const texturePack = generateProceduralPlanetTextures(
        planet.id,
        selectedStar.id * 1000 + planet.id,
        planet.type,
        phys.currentA,
        state.rInHZ,
        state.rOutHZ
      );

      // Custom Raytraced Shader Material calculating exact sunlight ray from (0, 0, 0)
      const pMat = createPlanetShaderMaterial({
        diffuseTexture: texturePack.diffuseTexture,
        specularTexture: texturePack.specularTexture,
        nightTexture: texturePack.nightTexture,
        starColorHex: selectedStar.colorData.hex,
        planetType: planet.type,
        isEngulfed: phys.isEngulfed,
      });

      const pMesh = new THREE.Mesh(pGeom, pMat);
      pMesh.userData = { planetIndex: idx };
      pMesh.position.set(
        Math.cos(planet.angle) * r,
        Math.sin(planet.angle) * r * Math.sin(incRad),
        Math.sin(planet.angle) * r
      );
      scene.add(pMesh);
      planetMeshesRef.current.push(pMesh);
    });

    // Auto-adjust default view distance only if not currently focused on a planet
    if (focusedPlanetIndexRef.current === null) {
      const lastPlanet = selectedStar.planets[selectedStar.planets.length - 1];
      const maxAU = Math.max(lastPlanet?.currentA || 3, state.rOutHZ, 3.5);
      sphericalRef.current.radius = maxAU * scaleAU * (isExpanded ? 1.4 : 1.7);
      updateCameraPosition();
    }
  }, [selectedStar?.id, selectedStar?.progressPct, isExpanded]);

  // Keep orbit line highlight updated with selectedPlanetIndex without rebuilding meshes
  useEffect(() => {
    orbitLinesRef.current.forEach((line, idx) => {
      const mat = line.material as THREE.LineBasicMaterial;
      const isSelected = idx === selectedPlanetIndex;
      mat.color.setHex(isSelected ? 0x38bdf8 : 0x334155);
      mat.opacity = isSelected ? 0.85 : 0.35;
    });
  }, [selectedPlanetIndex]);

  // Keep camera focus aligned with selectedPlanetIndex when in focus mode
  useEffect(() => {
    if (selectedPlanetIndex === -1 && focusedPlanetIndexRef.current !== null) {
      focusOnSun();
    } else if (selectedPlanetIndex >= 0 && focusedPlanetIndexRef.current !== selectedPlanetIndex) {
      focusOnPlanet(selectedPlanetIndex);
    }
  }, [selectedPlanetIndex]);

  // Raycasting to click planets directly in 3D
  const getPlanetUnderCursor = (clientX: number, clientY: number): number | null => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    if (!container || !camera) return null;

    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / container.clientWidth) * 2 - 1,
      -((clientY - rect.top) / container.clientHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Direct mesh geometry intersection
    const intersects = raycaster.intersectObjects(planetMeshesRef.current);
    if (intersects.length > 0 && intersects[0].object.userData.planetIndex !== undefined) {
      return intersects[0].object.userData.planetIndex;
    }

    // Forgiving proximity hit test so clicking smaller/distant planets is effortless
    let closestIdx: number | null = null;
    let closestDist = Infinity;
    planetMeshesRef.current.forEach((m) => {
      if (!m.visible) return;
      const dist = raycaster.ray.distanceToPoint(m.position);
      const geom = m.geometry as THREE.SphereGeometry;
      const hitRadius = Math.max(1.1, (geom?.parameters?.radius || 0.6) * 2.5);
      if (dist < hitRadius && dist < closestDist) {
        closestDist = dist;
        closestIdx = m.userData.planetIndex;
      }
    });

    return closestIdx;
  };

  // Raycasting & 2D screen projection to check if Sun/host star is under cursor
  const isSunUnderCursor = (clientX: number, clientY: number): boolean => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    if (!container || !camera) return false;

    const rect = container.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const starRadius = starVisualRadiusRef.current || 1.0;

    // 1. Exact 2D screen projection of the Sun at (0, 0, 0)
    const sunCenter = new THREE.Vector3(0, 0, 0).project(camera);
    if (sunCenter.z < 1.0) {
      const sunPxX = ((sunCenter.x + 1) / 2) * container.clientWidth;
      const sunPxY = ((-sunCenter.y + 1) / 2) * container.clientHeight;

      // Project the Sun's physical edge to get accurate screen pixel radius
      const sunLimb = new THREE.Vector3(0, starRadius, 0).project(camera);
      const sunLimbPxY = ((-sunLimb.y + 1) / 2) * container.clientHeight;
      const projectedRadiusPx = Math.max(50, Math.abs(sunPxY - sunLimbPxY) * 1.4);

      const pxDist = Math.hypot(mouseX - sunPxX, mouseY - sunPxY);
      if (pxDist <= projectedRadiusPx) {
        return true;
      }
    }

    // 2. Direct 3D Ray-Sphere intersection with host star at (0, 0, 0)
    const mouse = new THREE.Vector2(
      (mouseX / container.clientWidth) * 2 - 1,
      -(mouseY / container.clientHeight) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const sunPos = new THREE.Vector3(0, 0, 0);
    const distToRay = raycaster.ray.distanceToPoint(sunPos);
    if (distToRay <= starRadius * 1.6) {
      const camToSun = sunPos.clone().sub(camera.position);
      if (camToSun.dot(raycaster.ray.direction) > 0) {
        return true;
      }
    }

    if (starMeshRef.current && raycaster.intersectObject(starMeshRef.current).length > 0) {
      return true;
    }

    return false;
  };

  // Mouse drag handlers for 3D rotation and panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) isDraggingRef.current = true;
    if (e.button === 2) isRightDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    dragDistanceRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    if (isDraggingRef.current || isRightDraggingRef.current) {
      dragDistanceRef.current += Math.hypot(deltaX, deltaY);
    }

    // Update cursor when hovering over planets or the Sun
    const hoveredIdx = getPlanetUnderCursor(e.clientX, e.clientY);
    const hoveredSun = isSunUnderCursor(e.clientX, e.clientY);
    if (containerRef.current) {
      if (hoveredIdx !== null || (focusedPlanet !== null && hoveredSun)) {
        containerRef.current.style.cursor = 'pointer';
      } else if (isDraggingRef.current || isRightDraggingRef.current) {
        containerRef.current.style.cursor = 'grabbing';
      } else {
        containerRef.current.style.cursor = 'grab';
      }
    }

    if (isDraggingRef.current) {
      // 3D Orbital rotation around currently focused target (Sun or Planet)
      sphericalRef.current.theta -= deltaX * 0.008;
      sphericalRef.current.phi = Math.max(
        0.05,
        Math.min(Math.PI - 0.05, sphericalRef.current.phi - deltaY * 0.008)
      );
      updateCameraPosition();
    } else if (isRightDraggingRef.current) {
      // 3D Panning - release focus lock if user manually pans away
      if (focusedPlanetIndexRef.current !== null) {
        focusOnSun();
      }
      const panSpeed = sphericalRef.current.radius * 0.0012;
      cameraTargetRef.current.x -= deltaX * panSpeed;
      cameraTargetRef.current.z -= deltaY * panSpeed;
      updateCameraPosition();
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isRightDraggingRef.current = false;
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only count as click if user wasn't dragging
    if (dragDistanceRef.current > 12) return;

    // 1. If Sun was clicked, ALWAYS return to Sun overview!
    if (isSunUnderCursor(e.clientX, e.clientY)) {
      focusOnSun();
      return;
    }

    // 2. Check if user clicked a planet
    const clickedPlanetIdx = getPlanetUnderCursor(e.clientX, e.clientY);
    if (clickedPlanetIdx !== null) {
      if (clickedPlanetIdx !== focusedPlanetIndexRef.current) {
        focusOnPlanet(clickedPlanetIdx);
      } else {
        focusOnSun();
      }
      return;
    }

    // 3. If currently focused on a planet and clicked anywhere else (empty space, background):
    // Take focus off the planet and restore full-screen view centered on the Sun!
    if (focusedPlanetIndexRef.current !== null) {
      focusOnSun();
      return;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.9 : 1.1;
    const newRadius = Math.max(
      1.8,
      Math.min(300, sphericalRef.current.radius * zoomFactor)
    );
    sphericalRef.current.radius = newRadius;
    targetRadiusRef.current = newRadius; // Preserves manual zoom level while tracking!
    updateCameraPosition();
  };

  return (
    <div
      ref={containerRef}
      id={isExpanded ? 'section-10-expanded-solar-system-theater' : 'section-07-solar-system-3d'}
      data-section="Circumstellar Solar System 3D Viewport"
      className="w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden rounded bg-[#02040b]"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top Left Title & Controls Overlay */}
      <div className="absolute top-2 left-2 z-20 flex flex-wrap items-center gap-1.5 pointer-events-auto">
        <span className="text-[9px] font-mono text-cyan-400 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700/80 shadow flex items-center gap-1">
          <Eye className="w-3 h-3 text-emerald-400" />
          Raytraced Solar Shadows
        </span>

        {/* Camera Preset Quick Buttons */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded border border-slate-800 text-[8.5px] font-mono">
          <button
            onClick={() => setCameraPreset('top')}
            className="px-1.5 py-0.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded"
            title="Top-Down Polar View"
          >
            Top
          </button>
          <button
            onClick={() => setCameraPreset('inclined')}
            className="px-1.5 py-0.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded"
            title="Inclined Perspective (45°)"
          >
            45°
          </button>
          <button
            onClick={() => setCameraPreset('edge')}
            className="px-1.5 py-0.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded"
            title="Ecliptic Edge-On View"
          >
            Edge
          </button>
          <button
            onClick={focusOnSun}
            className={`px-1.5 py-0.5 rounded transition ${
              focusedPlanet === null
                ? 'bg-amber-950/80 text-amber-300 border border-amber-600/70 font-bold'
                : 'hover:bg-slate-800 text-amber-400 font-semibold'
            }`}
            title="Full Screen Solar System View centered on the Sun"
          >
            ☀️ Sun
          </button>
          <button
            onClick={() => {
              if (focusedPlanet !== null) {
                focusOnSun();
              } else {
                focusOnPlanet(selectedPlanetIndex);
              }
            }}
            className={`px-1.5 py-0.5 rounded transition ${
              focusedPlanet !== null
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'hover:bg-slate-800 text-cyan-400 font-bold'
            }`}
            title={
              focusedPlanet !== null
                ? 'Unlock Camera / Return to Overview'
                : 'Focus & Zoom on Active Planet'
            }
          >
            {focusedPlanet !== null ? 'Tracking' : 'Target'}
          </button>
          <button
            onClick={() => {
              unfocusPlanet();
              setCameraPreset('inclined');
            }}
            className="p-0.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
            title="Reset to System Overview"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* Active Focused Planet Badge with One-Click Exit & Sun Click Guidance */}
        {focusedPlanet !== null && selectedStar?.planets[focusedPlanet] && (
          <div className="flex items-center gap-1.5 bg-cyan-950/95 text-cyan-200 px-2 py-0.5 rounded border border-cyan-500/80 shadow text-[9px] font-mono">
            <span
              className="w-2 h-2 rounded-full ring-1 ring-cyan-400"
              style={{ backgroundColor: selectedStar.planets[focusedPlanet].color }}
            />
            <span className="font-bold">{selectedStar.planets[focusedPlanet].name}</span>
            <span className="text-cyan-400 hidden sm:inline">
              ({selectedStar.planets[focusedPlanet].type})
            </span>
            <span className="text-amber-400 font-semibold text-[8.5px] border-l border-cyan-800 pl-1.5 ml-0.5 hidden md:inline">
              Click Sun to exit
            </span>
            <button
              onClick={unfocusPlanet}
              className="ml-1 px-1.5 py-0.2 bg-cyan-900/80 hover:bg-rose-900 hover:text-rose-200 rounded text-cyan-300 transition text-[8.5px]"
              title="Return to System Overview (or click on the Sun)"
            >
              Exit Focus
            </button>
          </div>
        )}
      </div>

      {/* Top Right Controls: Play/Pause, Speed Slider, Presets, and Blow Up */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 pointer-events-auto bg-slate-950/85 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-800/90 shadow-xl text-xs font-mono">
        {/* Play / Pause Button */}
        <button
          onClick={togglePlay}
          className={`px-2 py-1 rounded border flex items-center gap-1 text-[11px] font-mono shadow transition select-none ${
            isPlaying
              ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
              : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-600 animate-pulse font-bold'
          }`}
          title={isPlaying ? 'Pause 3D Orbits (Space)' : 'Resume 3D Orbits (Space)'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
              <span>Resume</span>
            </>
          )}
        </button>

        {/* Orbit Speed Slider with Slow-Down Capability */}
        <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2">
          <span className="text-[10px] text-slate-400 select-none">Speed:</span>
          <input
            type="range"
            min="0.05"
            max="3.0"
            step="0.05"
            value={speed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className="w-14 sm:w-20 accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
            title={`Orbit speed multiplier: ${speed.toFixed(2)}x (drag to slow down or speed up)`}
          />
          <span className="text-[10px] text-cyan-400 font-bold tabular-nums w-8 text-right select-none">
            {speed.toFixed(2)}x
          </span>

          {/* Speed Presets */}
          <div className="flex items-center gap-0.5 ml-0.5">
            {[0.2, 1.0, 2.5].map((preset) => (
              <button
                key={preset}
                onClick={() => handleSpeedChange(preset)}
                className={`px-1 py-0.5 text-[8.5px] rounded transition ${
                  Math.abs(speed - preset) < 0.05
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={`Set speed to ${preset}x (${preset < 1 ? 'Slow Motion' : preset === 1 ? 'Real-Time' : 'Fast'})`}
              >
                {preset === 0.2 ? '0.2x' : preset === 1 ? '1x' : `${preset}x`}
              </button>
            ))}
          </div>
        </div>

        {/* Blow Up 3D Button - Only shown when NOT expanded to eliminate duplicate Minimize button */}
        {!isExpanded && onToggleExpand && (
          <button
            onClick={onToggleExpand}
            className="ml-1 px-2 py-1 rounded bg-indigo-900/90 hover:bg-indigo-800 text-indigo-200 border border-indigo-500/50 text-[10px] font-mono shadow flex items-center gap-1 transition"
            title="Blow Up / Expand 3D Solar System"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Blow Up 3D</span>
          </button>
        )}
      </div>

      {/* Bottom Floating Hint Overlay */}
      <div className="absolute bottom-1.5 left-2 right-2 z-10 flex justify-between items-center text-[8.5px] font-mono text-slate-500 pointer-events-none">
        <span>Click planet to zoom &amp; track &bull; Click Sun to exit focus &bull; Drag to orbit</span>
        <span className="text-slate-400">Boiling Sun Photosphere &bull; Active Sunspots</span>
      </div>
    </div>
  );
};
