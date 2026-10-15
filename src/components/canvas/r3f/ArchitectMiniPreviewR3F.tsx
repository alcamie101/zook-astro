import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';

const nodes = [
  { x: 0, y: 0, z: 0, col: '#f59e0b', size: 2.2 },
  { x: -7, y: 2, z: 4, col: '#38bdf8', size: 1.4 },
  { x: 6, y: -2, z: 5, col: '#10b981', size: 1.6 },
  { x: 5, y: 3, z: -6, col: '#a855f7', size: 1.5 },
  { x: -6, y: -2, z: -5, col: '#f43f5e', size: 1.3 },
];

const connectionPairs = [
  [0, 1], [0, 2], [0, 3], [0, 4], [1, 4], [2, 3]
];

const ArchitectMiniScene: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  const hyperlanes = useMemo(() => {
    return connectionPairs.map(([a, b]) => {
      const p1 = new THREE.Vector3(nodes[a].x, nodes[a].y, nodes[a].z);
      const p2 = new THREE.Vector3(nodes[b].x, nodes[b].y, nodes[b].z);
      const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const mat = new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.55 });
      return new THREE.Line(geo, mat);
    });
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.45;
      groupRef.current.rotation.x = Math.sin(t * 0.3) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Node Spheres */}
      {nodes.map((n, i) => (
        <mesh key={i} position={[n.x, n.y, n.z]}>
          <sphereGeometry args={[n.size, 16, 16]} />
          <meshBasicMaterial color={n.col} />
        </mesh>
      ))}

      {/* Hyperlane Links */}
      {hyperlanes.map((lineMesh, i) => (
        <primitive key={i} object={lineMesh} />
      ))}
    </group>
  );
};

export const ArchitectMiniPreviewR3F: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={className || "w-full h-full"}>
      <Canvas
        camera={{ position: [0, 10, 22], fov: 45, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ArchitectMiniScene />
      </Canvas>
    </div>
  );
};
