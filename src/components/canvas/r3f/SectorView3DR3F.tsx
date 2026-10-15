import React, { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { FilterCategory, StarSystem } from '../../../types/astrophysics';
import { SectorControlsOverlay, SectorTooltip } from '../sector';

// Create radial glow star texture for points
function createStarTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.85)');
    grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.25)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// 1. Concentric Metric Range Rings
const RangeRings: React.FC<{ radiusLy: number }> = ({ radiusLy }) => {
  const ringLines = useMemo(() => {
    const material = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
    });
    return [0.25, 0.5, 0.75, 1.0, 1.25].map((rf) => {
      const geom = new THREE.BufferGeometry();
      const points: THREE.Vector3[] = [];
      const segs = 64;
      const r = radiusLy * rf;
      for (let j = 0; j <= segs; j++) {
        const a = (j / segs) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
      }
      geom.setFromPoints(points);
      return new THREE.Line(geom, material);
    });
  }, [radiusLy]);

  return (
    <group>
      {ringLines.map((lineObj, idx) => (
        <primitive key={idx} object={lineObj} />
      ))}
    </group>
  );
};

// 2. Selection Marker Ring (facing camera)
const SelectionMarker: React.FC<{ selectedStar: StarSystem | null }> = ({ selectedStar }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.quaternion.copy(camera.quaternion);
    }
  });

  if (!selectedStar) return null;

  return (
    <mesh ref={meshRef} position={[selectedStar.x, selectedStar.z, selectedStar.y]}>
      <ringGeometry args={[2.5, 3.2, 32]} />
      <meshBasicMaterial
        color="#38bdf8"
        side={THREE.DoubleSide}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
};

// 3. Sector Star Points with R3F Events
interface StarPointsProps {
  stars: StarSystem[];
  activeFilter: FilterCategory;
  onSelectStar: (star: StarSystem) => void;
  onHoverStar: (star: StarSystem | null, screenPos?: { x: number; y: number } | null) => void;
}

const StarPoints: React.FC<StarPointsProps> = ({
  stars,
  activeFilter,
  onSelectStar,
  onHoverStar,
}) => {
  const { raycaster } = useThree();
  const starTexture = useMemo(() => createStarTexture(), []);

  useEffect(() => {
    // Increase threshold for points picking
    raycaster.params.Points = { threshold: 4.0 };
    return () => {
      starTexture.dispose();
    };
  }, [raycaster, starTexture]);

  const { positions, colors } = useMemo(() => {
    const pos: number[] = [];
    const col: number[] = [];

    stars.forEach((star) => {
      let matches = true;
      if (activeFilter === 'ob') matches = star.colorData.cat === 'ob';
      else if (activeFilter === 'g') matches = star.colorData.cat === 'g';
      else if (activeFilter === 'km') matches = star.colorData.cat === 'km';
      else if (activeFilter === 'remnant') matches = star.starState.isRemnant;
      else if (activeFilter === 'hz') matches = star.hasHZPlanet;

      pos.push(star.x, star.z, star.y);

      if (!matches) {
        col.push(0.2, 0.25, 0.35);
      } else {
        col.push(
          star.colorData.r / 255,
          star.colorData.g / 255,
          star.colorData.b / 255
        );
      }
    });

    return {
      positions: new Float32Array(pos),
      colors: new Float32Array(col),
    };
  }, [stars, activeFilter]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 9.5,
      vertexColors: true,
      map: starTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [starTexture]);

  return (
    <points
      geometry={geometry}
      material={material}
      onClick={(e) => {
        if (e.index !== undefined && stars[e.index]) {
          e.stopPropagation();
          onSelectStar(stars[e.index]);
        }
      }}
      onPointerMove={(e) => {
        if (e.index !== undefined && stars[e.index]) {
          e.stopPropagation();
          onHoverStar(stars[e.index], { x: e.clientX, y: e.clientY });
        }
      }}
      onPointerLeave={() => {
        onHoverStar(null, null);
      }}
    />
  );
};

// 4. Main SectorView3D R3F Component
interface SectorView3DProps {
  stars: StarSystem[];
  selectedStar: StarSystem | null;
  onSelectStar: (star: StarSystem) => void;
  activeFilter: FilterCategory;
  radiusLy: number;
}

export const SectorView3DR3F: React.FC<SectorView3DProps> = ({
  stars,
  selectedStar,
  onSelectStar,
  activeFilter,
  radiusLy,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [hoveredStar, setHoveredStar] = useState<StarSystem | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const handleHoverStar = (star: StarSystem | null, screenPos?: { x: number; y: number } | null) => {
    setHoveredStar(star);
    if (star && screenPos && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: screenPos.x - rect.left + 12,
        y: screenPos.y - rect.top + 12,
      });
    } else {
      setTooltipPos(null);
    }
  };

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const camRadius = radiusLy * 2.2;
  const initCamPos: [number, number, number] = [
    camRadius * Math.sin(Math.PI / 3) * Math.sin(Math.PI / 4),
    camRadius * Math.cos(Math.PI / 3),
    camRadius * Math.sin(Math.PI / 3) * Math.cos(Math.PI / 4),
  ];

  return (
    <div
      ref={containerRef}
      id="section-03-galactic-sector-3d"
      data-section="3D Galactic Sector Viewport"
      className="w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden"
    >
      <Canvas
        camera={{ position: initCamPos, fov: 45, near: 0.1, far: radiusLy * 20 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color('#02040b');
        }}
      >
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.06}
          minDistance={10}
          maxDistance={radiusLy * 8}
        />

        <RangeRings radiusLy={radiusLy} />
        <StarPoints
          stars={stars}
          activeFilter={activeFilter}
          onSelectStar={onSelectStar}
          onHoverStar={handleHoverStar}
        />
        <SelectionMarker selectedStar={selectedStar} />
      </Canvas>

      {/* 3D Navigation Controls HUD */}
      <SectorControlsOverlay
        radiusLy={radiusLy}
        onZoomIn={() => {
          if (controlsRef.current) {
            controlsRef.current.dollyIn(1.25);
            controlsRef.current.update();
          }
        }}
        onZoomOut={() => {
          if (controlsRef.current) {
            controlsRef.current.dollyOut(1.25);
            controlsRef.current.update();
          }
        }}
        onResetCamera={handleResetCamera}
      />

      {/* Hover Tooltip */}
      {hoveredStar && tooltipPos && (
        <SectorTooltip
          hoveredStar={hoveredStar}
          position={tooltipPos}
        />
      )}

      {/* Bottom Footer Info */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400 pointer-events-none z-10">
        <span className="text-slate-500">Left-Drag: Rotate 3D &bull; Right-Drag: Pan &bull; Wheel: Zoom</span>
        <span className="text-slate-400">Click Star to Inspect</span>
      </div>
    </div>
  );
};
