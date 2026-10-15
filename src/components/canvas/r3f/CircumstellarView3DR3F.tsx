import React, { useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls as DreiOrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { StarSystem } from '../../../types/astrophysics';
import { computePlanetPhysics } from '../../../core/generation/planets';
import { createPlanetShaderMaterial } from '../PlanetShaderMaterial';
import { createStarShaderMaterial } from '../StarShaderMaterial';
import { generateProceduralPlanetTextures } from '../../../core/generation/planetTextures';
import {
  CircumstellarControlsOverlay,
  CircumstellarCameraPresets,
  createCoronaTexture,
} from '../circumstellar';

interface CircumstellarView3DProps {
  selectedStar: StarSystem | null;
  selectedPlanetIndex: number;
  onSelectPlanet: (index: number) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const SCALE_AU = 6.0;

// 1. Host Star Component with Shaders and Corona
const HostStar: React.FC<{
  star: StarSystem;
  simSpeed: number;
  isPlaying: boolean;
  onClickSun: () => void;
}> = ({ star, simSpeed, isPlaying, onClickSun }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const spriteRef = useRef<THREE.Sprite>(null);
  const state = star.starState;

  let starVisualRadius = Math.max(0.65, state.radiusAU * SCALE_AU);
  if (starVisualRadius > 8.0) starVisualRadius = 8.0;

  const starColor = useMemo(() => new THREE.Color(star.colorData.hex), [star.colorData.hex]);

  const starMaterial = useMemo(() => {
    return createStarShaderMaterial({
      teff: state.Teff,
      phase: state.phase,
      spectralCat: star.colorData.cat,
      spectralMK: state.spectralMK,
      baseHex: star.colorData.hex,
    });
  }, [state.Teff, state.phase, star.colorData.cat, state.spectralMK, star.colorData.hex]);

  const coronaTexture = useMemo(() => createCoronaTexture(starColor), [starColor]);
  const glowScale = starVisualRadius * 3.8;

  const animTimeRef = useRef(0);

  useFrame((_, delta) => {
    if (!isPlaying) return;
    animTimeRef.current += simSpeed * (delta * 60);

    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.ShaderMaterial;
      if (mat.uniforms?.uTime) {
        mat.uniforms.uTime.value = animTimeRef.current * 0.025;
      }
      meshRef.current.rotation.y += 0.002 * simSpeed;

      if (state.isPulsating) {
        const pulse = 1.0 + 0.18 * Math.sin(animTimeRef.current * 0.12);
        meshRef.current.scale.set(pulse, pulse, pulse);
        if (spriteRef.current) {
          spriteRef.current.scale.set(pulse * 3.5, pulse * 3.5, 1);
        }
      } else if (spriteRef.current) {
        const shimmer = 1.0 + 0.025 * Math.sin(animTimeRef.current * 0.08);
        spriteRef.current.scale.set(glowScale * shimmer, glowScale * shimmer, 1);
      }
    }
  });

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onClickSun();
      }}
    >
      {/* Central Host Star Mesh */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[starVisualRadius, 48, 48]} />
        <primitive object={starMaterial} attach="material" />
      </mesh>

      {/* Corona Sprite Billboard */}
      <sprite ref={spriteRef} scale={[glowScale, glowScale, 1]}>
        <spriteMaterial
          map={coronaTexture}
          color={starColor}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      {/* Solar Point Light */}
      <pointLight color={starColor} intensity={3.5} distance={0} decay={1.2} />
    </group>
  );
};

// 2. Habitable Zone Ring
const HabitableZoneRing: React.FC<{ star: StarSystem }> = ({ star }) => {
  const state = star.starState;
  if (state.isSupernova || state.rOutHZ <= 0) return null;

  const innerR = Math.max(0.25, state.rInHZ * SCALE_AU);
  const outerR = Math.max(innerR + 0.25, state.rOutHZ * SCALE_AU);

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[innerR, outerR, 64]} />
      <meshBasicMaterial
        color="#10b981"
        side={THREE.DoubleSide}
        transparent
        opacity={0.22}
        depthWrite={false}
      />
    </mesh>
  );
};

// 3. Orbit Line Component
const OrbitLine: React.FC<{
  r: number;
  incRad: number;
  isSelected: boolean;
  isEngulfed: boolean;
}> = ({ r, incRad, isSelected, isEngulfed }) => {
  const lineObject = useMemo(() => {
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
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const color = isEngulfed ? 0xef4444 : isSelected ? 0x38bdf8 : 0x334155;
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: isSelected ? 0.85 : 0.35,
    });
    return new THREE.Line(geom, mat);
  }, [r, incRad, isSelected, isEngulfed]);

  return <primitive object={lineObject} />;
};

// 4. Planet Body Component
const PlanetBody: React.FC<{
  star: StarSystem;
  planet: any;
  idx: number;
  isSelected: boolean;
  isExpanded: boolean;
  simSpeed: number;
  isPlaying: boolean;
  onSelect: (idx: number) => void;
  onPositionUpdate: (idx: number, pos: THREE.Vector3) => void;
}> = ({
  star,
  planet,
  idx,
  isSelected,
  isExpanded,
  simSpeed,
  isPlaying,
  onSelect,
  onPositionUpdate,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const state = star.starState;
  const phys = computePlanetPhysics(planet, state, star.progenitorMass);
  const r = phys.currentA * SCALE_AU;
  const incRad = (planet.incDeg * Math.PI) / 180;

  const pRadius = Math.max(
    0.32,
    Math.min(1.3, planet.radiusEarth * (isExpanded ? 0.24 : 0.20))
  );

  const textures = useMemo(() => {
    return generateProceduralPlanetTextures(
      planet.id,
      star.id * 1000 + planet.id,
      planet.type,
      phys.currentA,
      state.rInHZ,
      state.rOutHZ
    );
  }, [planet.id, star.id, planet.type, phys.currentA, state.rInHZ, state.rOutHZ]);

  const planetMaterial = useMemo(() => {
    return createPlanetShaderMaterial({
      diffuseTexture: textures.diffuseTexture,
      specularTexture: textures.specularTexture,
      nightTexture: textures.nightTexture,
      starColorHex: star.colorData.hex,
      planetType: planet.type,
      isEngulfed: phys.isEngulfed,
    });
  }, [textures, star.colorData.hex, planet.type, phys.isEngulfed]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (phys.isEngulfed) {
      meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;

    if (isPlaying) {
      const curSpeed = simSpeed * (delta * 60);
      planet.angle +=
        0.015 *
        curSpeed *
        Math.sqrt(Math.max(0.1, state.currentMass) / Math.pow(phys.currentA, 3));

      meshRef.current.position.x = Math.cos(planet.angle) * r;
      meshRef.current.position.z = Math.sin(planet.angle) * r;
      meshRef.current.position.y = Math.sin(planet.angle) * r * Math.sin(incRad);

      if (phys.isTidallyLocked) {
        meshRef.current.rotation.y = -planet.angle;
      } else {
        meshRef.current.rotation.y += 0.018 * curSpeed;
      }
    }

    onPositionUpdate(idx, meshRef.current.position);
  });

  return (
    <group>
      <OrbitLine
        r={r}
        incRad={incRad}
        isSelected={isSelected}
        isEngulfed={phys.isEngulfed}
      />
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(idx);
        }}
        position={[
          Math.cos(planet.angle) * r,
          Math.sin(planet.angle) * r * Math.sin(incRad),
          Math.sin(planet.angle) * r,
        ]}
      >
        <sphereGeometry args={[pRadius, 32, 32]} />
        <primitive object={planetMaterial} attach="material" />
      </mesh>
    </group>
  );
};

// 5. Camera & Scene Controller with Smooth Tracking
const CircumstellarCameraController: React.FC<{
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  focusedPlanet: number | null;
  selectedStar: StarSystem | null;
  planetPositionsRef: React.MutableRefObject<Map<number, THREE.Vector3>>;
  isExpanded: boolean;
  presetTrigger: { preset: 'top' | 'inclined' | 'edge' | 'planet'; count: number } | null;
}> = ({
  controlsRef,
  focusedPlanet,
  selectedStar,
  planetPositionsRef,
  isExpanded,
  presetTrigger,
}) => {
  const { camera } = useThree();

  // Handle Preset Changes
  useEffect(() => {
    if (!presetTrigger || !controlsRef.current || !selectedStar) return;
    const { preset } = presetTrigger;
    const state = selectedStar.starState;
    const lastPlanet = selectedStar.planets[selectedStar.planets.length - 1];
    const maxAU = Math.max(lastPlanet?.currentA || 3, state.rOutHZ, 3.5);
    const baseRadius = maxAU * SCALE_AU * (isExpanded ? 1.4 : 1.7);

    controlsRef.current.target.set(0, 0, 0);

    if (preset === 'top') {
      camera.position.set(0, baseRadius, 0.001);
    } else if (preset === 'inclined') {
      const phi = Math.PI / 3;
      const theta = Math.PI / 4;
      camera.position.set(
        baseRadius * Math.sin(phi) * Math.sin(theta),
        baseRadius * Math.cos(phi),
        baseRadius * Math.sin(phi) * Math.cos(theta)
      );
    } else if (preset === 'edge') {
      camera.position.set(0, 0.05, baseRadius);
    }
    controlsRef.current.update();
  }, [presetTrigger]);

  useFrame(() => {
    if (!controlsRef.current) return;

    if (focusedPlanet !== null) {
      const pos = planetPositionsRef.current.get(focusedPlanet);
      if (pos) {
        controlsRef.current.target.copy(pos);
      }
    }
  });

  return null;
};

// 6. Main CircumstellarView3DR3F Component
export const CircumstellarView3DR3F: React.FC<CircumstellarView3DProps> = ({
  selectedStar,
  selectedPlanetIndex,
  onSelectPlanet,
  isExpanded = false,
  onToggleExpand,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1.0);
  const [focusedPlanet, setFocusedPlanet] = useState<number | null>(null);
  const [presetTrigger, setPresetTrigger] = useState<{
    preset: 'top' | 'inclined' | 'edge' | 'planet';
    count: number;
  } | null>(null);

  const controlsRef = useRef<OrbitControlsImpl>(null);
  const planetPositionsRef = useRef<Map<number, THREE.Vector3>>(new Map());

  const handlePositionUpdate = (idx: number, pos: THREE.Vector3) => {
    planetPositionsRef.current.set(idx, pos.clone());
  };

  const focusOnPlanet = (planetIdx: number) => {
    if (!selectedStar) return;
    if (planetIdx < 0) {
      focusOnSun();
      return;
    }
    onSelectPlanet(planetIdx);
    setFocusedPlanet(planetIdx);

    const pos = planetPositionsRef.current.get(planetIdx);
    if (pos && controlsRef.current) {
      controlsRef.current.target.copy(pos);
    }
  };

  const focusOnSun = () => {
    onSelectPlanet(-1);
    setFocusedPlanet(null);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
    }
  };

  const setCameraPreset = (preset: 'top' | 'inclined' | 'edge' | 'planet') => {
    if (preset === 'planet') {
      focusOnPlanet(selectedPlanetIndex);
      return;
    }
    setFocusedPlanet(null);
    setPresetTrigger((prev) => ({ preset, count: (prev?.count || 0) + 1 }));
  };

  // Keyboard shortcut: Space toggles play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync selectedPlanetIndex
  useEffect(() => {
    if (selectedPlanetIndex === -1 && focusedPlanet !== null) {
      focusOnSun();
    } else if (selectedPlanetIndex >= 0 && focusedPlanet !== selectedPlanetIndex) {
      focusOnPlanet(selectedPlanetIndex);
    }
  }, [selectedPlanetIndex]);

  // Initial Camera distance
  const initialCamDistance = useMemo(() => {
    if (!selectedStar) return 55;
    const state = selectedStar.starState;
    const lastPlanet = selectedStar.planets[selectedStar.planets.length - 1];
    const maxAU = Math.max(lastPlanet?.currentA || 3, state.rOutHZ, 3.5);
    return maxAU * SCALE_AU * (isExpanded ? 1.4 : 1.7);
  }, [selectedStar?.id, isExpanded]);

  return (
    <div
      id={isExpanded ? 'section-10-expanded-solar-system-theater' : 'section-07-solar-system-3d'}
      data-section="Circumstellar Solar System 3D Viewport"
      className="w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden rounded bg-[#02040b]"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Canvas
        camera={{
          position: [
            initialCamDistance * 0.7,
            initialCamDistance * 0.5,
            initialCamDistance * 0.7,
          ],
          fov: 45,
          near: 0.01,
          far: 2500,
        }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color('#02040b');
        }}
      >
        <ambientLight intensity={0.03} color="#ffffff" />

        <DreiOrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.06}
          minDistance={1.8}
          maxDistance={400}
        />

        <CircumstellarCameraController
          controlsRef={controlsRef}
          focusedPlanet={focusedPlanet}
          selectedStar={selectedStar}
          planetPositionsRef={planetPositionsRef}
          isExpanded={isExpanded}
          presetTrigger={presetTrigger}
        />

        {/* Empty space click target to return to Sun overview */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          onClick={() => {
            if (focusedPlanet !== null) {
              focusOnSun();
            }
          }}
        >
          <planeGeometry args={[1000, 1000]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {selectedStar && (
          <group>
            {/* Host Star */}
            <HostStar
              star={selectedStar}
              simSpeed={speed}
              isPlaying={isPlaying}
              onClickSun={focusOnSun}
            />

            {/* Habitable Zone */}
            <HabitableZoneRing star={selectedStar} />

            {/* Planets */}
            {selectedStar.planets.map((planet, idx) => (
              <PlanetBody
                key={planet.id || idx}
                star={selectedStar}
                planet={planet}
                idx={idx}
                isSelected={idx === selectedPlanetIndex}
                isExpanded={isExpanded}
                simSpeed={speed}
                isPlaying={isPlaying}
                onSelect={(pIdx) => {
                  if (pIdx !== focusedPlanet) {
                    focusOnPlanet(pIdx);
                  } else {
                    focusOnSun();
                  }
                }}
                onPositionUpdate={handlePositionUpdate}
              />
            ))}
          </group>
        )}
      </Canvas>

      {/* Top Left Title & Camera Presets Overlay */}
      <CircumstellarCameraPresets
        onSetCameraPreset={setCameraPreset}
        onFocusSun={focusOnSun}
        onToggleActivePlanetFocus={() => {
          if (focusedPlanet !== null) {
            focusOnSun();
          } else {
            focusOnPlanet(selectedPlanetIndex);
          }
        }}
        focusedPlanet={focusedPlanet}
        selectedStar={selectedStar}
      />

      {/* Top Right Controls: Play/Pause, Speed Slider, Presets, and Blow Up */}
      <CircumstellarControlsOverlay
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        speed={speed}
        onSpeedChange={setSpeed}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
      />

      {/* Bottom Floating Hint Overlay */}
      <div className="absolute bottom-1.5 left-2 right-2 z-10 flex justify-between items-center text-[8.5px] font-mono text-slate-500 pointer-events-none">
        <span>Click planet to zoom &amp; track &bull; Click Sun to exit focus &bull; Drag to orbit</span>
        <span className="text-slate-400">Boiling Sun Photosphere &bull; Active Sunspots</span>
      </div>
    </div>
  );
};
