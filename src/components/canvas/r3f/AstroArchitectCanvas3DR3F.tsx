import React, { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  ArchitectSystem,
  GalaxySystemNode,
  Hyperlane,
  ARCHITECT_CLASS_COLORS,
  ArchitectViewMode,
  isStarClass,
  CelestialBody
} from '../../../types/architect';
import { MilkyWaySceneR3F } from './MilkyWayGalaxyR3F';

interface Props {
  currentSystem: ArchitectSystem;
  galaxySystems: GalaxySystemNode[];
  hyperlanes: Hyperlane[];
  viewMode: ArchitectViewMode;
  simSpeed: number;
  isPaused: boolean;
  onSelectSystemFromGalaxy: (sysId: string) => void;
  onAddGalaxySystem?: (x: number, y: number, z: number) => void;
  galaxyTool?: 'select' | 'add' | 'hyperlane' | 'delete';
  onDeleteGalaxySystem?: (sysId: string) => void;
  onConnectHyperlane?: (sysA: string, sysB: string) => void;
}

// 1. Galaxy Map Systems & Hyperlanes
const GalaxyMapScene: React.FC<{
  galaxySystems: GalaxySystemNode[];
  hyperlanes: Hyperlane[];
  currentSystemId?: string | null;
  onNodeClick: (nodeId: string) => void;
  onPointerOverNode: (node: GalaxySystemNode) => void;
  onPointerOutNode: () => void;
  onPlaneClick?: (x: number, y: number) => void;
}> = ({
  galaxySystems,
  hyperlanes,
  currentSystemId,
  onNodeClick,
  onPointerOverNode,
  onPointerOutNode,
  onPlaneClick
}) => {
  // Dashed Hyperlane Lines
  const hyperlaneObjects = useMemo(() => {
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x4fa3ff,
      linewidth: 1,
      scale: 1,
      dashSize: 4,
      gapSize: 3,
      transparent: true,
      opacity: 0.5
    });

    return hyperlanes.map(([idA, idB]) => {
      const nodeA = galaxySystems.find(s => s.id === idA);
      const nodeB = galaxySystems.find(s => s.id === idB);
      if (nodeA && nodeB) {
        const points = [
          new THREE.Vector3(nodeA.x, nodeA.z || 0, nodeA.y),
          new THREE.Vector3(nodeB.x, nodeB.z || 0, nodeB.y)
        ];
        const geom = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geom, lineMat);
        line.computeLineDistances();
        return line;
      }
      return null;
    }).filter(Boolean) as THREE.Line[];
  }, [hyperlanes, galaxySystems]);

  return (
    <group>
      {/* Hyperlanes */}
      {hyperlaneObjects.map((line, i) => (
        <primitive key={i} object={line} />
      ))}

      {/* Galaxy System Nodes */}
      {galaxySystems.map((node) => {
        const isSelected = currentSystemId === node.id;
        return (
          <group
            key={node.id}
            position={[node.x, node.z || 0, node.y]}
            onClick={(e) => {
              e.stopPropagation();
              onNodeClick(node.id);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              onPointerOverNode(node);
            }}
            onPointerOut={() => onPointerOutNode()}
          >
            {/* Selection / Identification Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[isSelected ? 6.5 : 5.5, isSelected ? 7.5 : 6.2, 32]} />
              <meshBasicMaterial
                color={isSelected ? '#70b5ff' : '#3b82f6'}
                side={THREE.DoubleSide}
                transparent
                opacity={isSelected ? 0.95 : 0.4}
              />
            </mesh>

            {/* Stars in System */}
            {node.stars.map((st, sIdx) => {
              const colHex = ARCHITECT_CLASS_COLORS[st.class] || '#ffffff';
              return (
                <group key={sIdx} position={[st.dx, st.dz || 0, st.dy]}>
                  {/* Star Sphere */}
                  <mesh>
                    <sphereGeometry args={[st.size * 0.7, 16, 16]} />
                    <meshBasicMaterial color={colHex} />
                  </mesh>
                  {/* Star Corona Halo */}
                  <mesh>
                    <sphereGeometry args={[st.size * 1.5, 16, 16]} />
                    <meshBasicMaterial
                      color={colHex}
                      transparent
                      opacity={0.35}
                      blending={THREE.AdditiveBlending}
                    />
                  </mesh>
                </group>
              );
            })}
          </group>
        );
      })}

      {/* Galactic Plane Click Target (for adding systems) */}
      {onPlaneClick && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onPlaneClick(Math.round(e.point.x), Math.round(e.point.z));
          }}
        >
          <planeGeometry args={[4000, 4000]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
};

// 2. Asteroid Belt Instanced Mesh
const AsteroidBelt: React.FC<{ radius: number }> = ({ radius }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 220;

  const matrices = useMemo(() => {
    const d = new THREE.Object3D();
    const mats: THREE.Matrix4[] = [];
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const r = radius + (Math.random() - 0.5) * 6;
      const y = (Math.random() - 0.5) * 2.5;
      d.position.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
      d.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      const s = 0.5 + Math.random() * 0.9;
      d.scale.set(s, s, s);
      d.updateMatrix();
      mats.push(d.matrix.clone());
    }
    return mats;
  }, [radius]);

  useFrame(() => {
    if (meshRef.current && matrices.length > 0) {
      matrices.forEach((mat, i) => {
        meshRef.current?.setMatrixAt(i, mat);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <dodecahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial color="#8892a0" roughness={0.9} metalness={0.1} />
      </instancedMesh>
      {/* Orbital Guide */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.15, radius + 0.15, 96]} />
        <meshBasicMaterial color="#64748b" side={THREE.DoubleSide} transparent opacity={0.15} />
      </mesh>
    </group>
  );
};

// 3. Planetary Body & Moons
const PlanetWithMoons: React.FC<{
  body: CelestialBody;
  dist: number;
  idx: number;
  simTime: number;
  viewMode: ArchitectViewMode;
  onSelect: (idx: number) => void;
  onHover: (name: string | null) => void;
}> = ({ body, dist, idx, simTime, viewMode, onSelect, onHover }) => {
  const planetRef = useRef<THREE.Group>(null);
  const bodyRadius = Math.max(1.4, (body.size || 15) * 0.14);
  const bodyColHex = ARCHITECT_CLASS_COLORS[body.type] || '#94a3b8';

  useFrame(() => {
    if (planetRef.current) {
      if (viewMode === 'orrery') {
        const orbitSpeed = (body.speed || 1.0) * 0.04;
        const angle = simTime * orbitSpeed;
        planetRef.current.position.x = Math.cos(angle) * dist;
        planetRef.current.position.z = Math.sin(angle) * dist;
      } else {
        planetRef.current.position.x = dist;
        planetRef.current.position.z = 0;
      }
      planetRef.current.rotation.y += 0.02;
    }
  });

  return (
    <group>
      {/* Orbit Ring */}
      {viewMode === 'orrery' && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[dist - 0.2, dist + 0.2, 96]} />
          <meshBasicMaterial color="#475569" side={THREE.DoubleSide} transparent opacity={0.35} />
        </mesh>
      )}

      {/* Orbiting Planet Group */}
      <group
        ref={planetRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(idx);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(body.name);
        }}
        onPointerOut={() => onHover(null)}
      >
        <mesh>
          <sphereGeometry args={[bodyRadius, 32, 32]} />
          {isStarClass(body.type) ? (
            <meshBasicMaterial color={bodyColHex} />
          ) : (
            <meshStandardMaterial color={bodyColHex} roughness={0.7} metalness={0.15} />
          )}
        </mesh>

        {/* Gas Giant Rings */}
        {body.ring && (
          <mesh rotation={[Math.PI / 2.3, 0.2, 0]}>
            <ringGeometry args={[bodyRadius * 1.4, bodyRadius * 2.4, 64]} />
            <meshStandardMaterial color="#d4c29d" side={THREE.DoubleSide} transparent opacity={0.65} />
          </mesh>
        )}

        {/* Moons */}
        {body.moons && body.moons.map((moon, mi) => {
          const moonDist = bodyRadius + 2.5 + (moon.dist || 3.0) * 0.8 + mi * 2.0;
          const moonRadius = Math.max(0.6, (moon.size || 7) * 0.08);
          const moonColHex = ARCHITECT_CLASS_COLORS[moon.type] || '#cbd5e1';

          return (
            <group key={mi}>
              {/* Moon Orbit Ring */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[moonDist - 0.08, moonDist + 0.08, 32]} />
                <meshBasicMaterial color="#334155" side={THREE.DoubleSide} transparent opacity={0.3} />
              </mesh>

              {/* Moon Sphere */}
              <mesh position={[moonDist, 0, 0]}>
                <sphereGeometry args={[moonRadius, 16, 16]} />
                <meshStandardMaterial color={moonColHex} roughness={0.8} />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
};

// 4. System Orrery & Linear Mode
const SystemOrreryScene: React.FC<{
  currentSystem: ArchitectSystem;
  viewMode: ArchitectViewMode;
  simTime: number;
  onSelectBody: (idx: number) => void;
  onHoverBody: (name: string | null) => void;
}> = ({ currentSystem, viewMode, simTime, onSelectBody, onHoverBody }) => {
  const starClass = currentSystem.star.class;
  const starColHex = ARCHITECT_CLASS_COLORS[starClass] || '#fff2a1';
  const starRadius = Math.max(3, currentSystem.star.size * 0.25);

  const { scale, exponent, offset } = currentSystem.scaling;

  return (
    <group>
      {/* Primary Star */}
      <mesh>
        <sphereGeometry args={[starRadius, 32, 32]} />
        <meshBasicMaterial color={starColHex} />
      </mesh>
      {/* Corona Glow */}
      <mesh>
        <sphereGeometry args={[starRadius * 1.8, 32, 32]} />
        <meshBasicMaterial
          color={starColHex}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <pointLight color={starColHex} intensity={2.8} distance={800} decay={0.4} />

      {/* Circumbinary Companion */}
      {currentSystem.hierarchy === 'circumbinary' && currentSystem.star2 && (
        <group>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry
              args={[(currentSystem.star2.dist || 14) - 0.2, (currentSystem.star2.dist || 14) + 0.2, 64]}
            />
            <meshBasicMaterial color="#ffaa00" side={THREE.DoubleSide} transparent opacity={0.2} />
          </mesh>
          <mesh position={[currentSystem.star2.dist || 14, 0, 0]}>
            <sphereGeometry args={[Math.max(2, currentSystem.star2.size * 0.22), 24, 24]} />
            <meshBasicMaterial color={ARCHITECT_CLASS_COLORS[currentSystem.star2.class] || '#ffb56b'} />
          </mesh>
        </group>
      )}

      {/* Celestial Bodies */}
      {currentSystem.bodies.map((body, idx) => {
        const exactDist = viewMode === 'linear'
          ? offset + (idx + 1) * 22
          : scale * Math.pow(Math.max(0.001, body.sma), exponent) + offset;

        if (body.type === 'belt') {
          return <AsteroidBelt key={body.id || idx} radius={exactDist} />;
        }

        return (
          <PlanetWithMoons
            key={body.id || idx}
            body={body}
            dist={exactDist}
            idx={idx}
            simTime={simTime}
            viewMode={viewMode}
            onSelect={onSelectBody}
            onHover={onHoverBody}
          />
        );
      })}
    </group>
  );
};

// 5. Main AstroArchitectCanvas3D R3F Component
export const AstroArchitectCanvas3DR3F: React.FC<Props> = ({
  currentSystem,
  galaxySystems,
  hyperlanes,
  viewMode,
  simSpeed,
  isPaused,
  onSelectSystemFromGalaxy,
  onAddGalaxySystem,
  galaxyTool = 'select',
  onDeleteGalaxySystem,
  onConnectHyperlane
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [hoveredSystem, setHoveredSystem] = useState<GalaxySystemNode | null>(null);
  const [hoveredBody, setHoveredBody] = useState<string | null>(null);
  const [hyperlaneStart, setHyperlaneStart] = useState<string | null>(null);
  const [focusedBodyIndex, setFocusedBodyIndex] = useState<number | null>(null);

  // Simulation time
  const [simTime, setSimTime] = useState(0);

  // Animate time in parent state
  useFrameRefSimulation(isPaused, simSpeed, setSimTime);

  const handleNodeClick = (nodeId: string) => {
    if (galaxyTool === 'delete' && onDeleteGalaxySystem) {
      onDeleteGalaxySystem(nodeId);
    } else if (galaxyTool === 'hyperlane' && onConnectHyperlane) {
      if (!hyperlaneStart) {
        setHyperlaneStart(nodeId);
      } else {
        if (hyperlaneStart !== nodeId) {
          onConnectHyperlane(hyperlaneStart, nodeId);
        }
        setHyperlaneStart(null);
      }
    } else {
      onSelectSystemFromGalaxy(nodeId);
    }
  };

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden">
      <Canvas
        camera={{ position: [0, 180, 280], fov: 45, near: 0.5, far: 3000 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color(0x04060d);
          scene.fog = new THREE.FogExp2(0x04060d, 0.0006);
        }}
      >
        <ambientLight intensity={0.45} />
        <directionalLight position={[50, 150, 80]} intensity={0.8} color="#a5c4ff" />

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.06}
          minDistance={15}
          maxDistance={1200}
        />

        {/* Milky Way Starfield & Nebulae Backdrop */}
        <MilkyWaySceneR3F interactiveParallax={false} />

        {/* Galaxy Map Mode */}
        {viewMode === 'galaxy' && (
          <GalaxyMapScene
            galaxySystems={galaxySystems}
            hyperlanes={hyperlanes}
            currentSystemId={currentSystem._galaxyId}
            onNodeClick={handleNodeClick}
            onPointerOverNode={setHoveredSystem}
            onPointerOutNode={() => setHoveredSystem(null)}
            onPlaneClick={
              galaxyTool === 'add' && onAddGalaxySystem
                ? (x, y) => onAddGalaxySystem(x, y, 0)
                : undefined
            }
          />
        )}

        {/* Orrery & Linear Track Mode */}
        {(viewMode === 'orrery' || viewMode === 'linear') && (
          <SystemOrreryScene
            currentSystem={currentSystem}
            viewMode={viewMode}
            simTime={simTime}
            onSelectBody={(idx) => setFocusedBodyIndex(idx)}
            onHoverBody={setHoveredBody}
          />
        )}
      </Canvas>

      {/* Floating HUD Tooltip */}
      {hoveredSystem && viewMode === 'galaxy' && (
        <div className="absolute top-16 right-4 px-3 py-2 rounded bg-slate-900/90 border border-slate-700/80 text-xs font-mono z-20 pointer-events-none shadow-xl">
          <div className="text-cyan-400 font-bold">{hoveredSystem.name}</div>
          <div className="text-slate-400 text-[10px]">{hoveredSystem.desc}</div>
          <div className="text-slate-500 text-[10px] mt-1">Stars: {hoveredSystem.stars.length}</div>
        </div>
      )}

      {hoveredBody && viewMode !== 'galaxy' && (
        <div className="absolute top-16 right-4 px-3 py-2 rounded bg-slate-900/90 border border-amber-500/60 text-xs font-mono z-20 pointer-events-none shadow-xl">
          <div className="text-amber-400 font-bold">{hoveredBody}</div>
          {focusedBodyIndex !== null && currentSystem.bodies[focusedBodyIndex] && (
            <div className="text-slate-400 text-[10px]">
              SMA: {currentSystem.bodies[focusedBodyIndex].sma} AU
            </div>
          )}
        </div>
      )}

      {/* Bottom Status Ribbon */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-1.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400 pointer-events-none z-10">
        <div>
          <span className="text-cyan-400">View:</span> {viewMode.toUpperCase()} &bull;{' '}
          <span className="text-amber-400">System:</span> {currentSystem.star.name}
        </div>
        <div>
          <span>Drag: Orbit &bull; Right-Drag: Pan &bull; Wheel: Zoom</span>
        </div>
      </div>
    </div>
  );
};

// Simulation time stepper hook
function useFrameRefSimulation(isPaused: boolean, simSpeed: number, setSimTime: React.Dispatch<React.SetStateAction<number>>) {
  const timeRef = useRef<number>(0);

  React.useEffect(() => {
    let animId = 0;
    const loop = () => {
      animId = requestAnimationFrame(loop);
      if (!isPaused) {
        timeRef.current += 0.015 * simSpeed;
        setSimTime(timeRef.current);
      }
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, simSpeed, setSimTime]);
}
