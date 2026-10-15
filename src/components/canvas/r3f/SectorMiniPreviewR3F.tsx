import React, { useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';

const SectorMiniScene: React.FC = () => {
  const planetRef = useRef<THREE.Mesh>(null);
  const starRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 1.2;
    if (planetRef.current) {
      planetRef.current.position.x = Math.cos(t) * 12;
      planetRef.current.position.z = Math.sin(t) * 12;
    }
    if (starRef.current) {
      starRef.current.rotation.y = t * 0.4;
    }
  });

  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight position={[0, 0, 0]} intensity={3.0} color="#fff5cc" distance={60} />

      {/* Central Star */}
      <mesh ref={starRef}>
        <sphereGeometry args={[3.6, 32, 32]} />
        <meshBasicMaterial color="#fff099" />
      </mesh>

      {/* Star Corona Halo */}
      <mesh>
        <sphereGeometry args={[4.8, 32, 32]} />
        <meshBasicMaterial
          color="#ffaa00"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Orbit Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[11.8, 12.0, 64]} />
        <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.35} />
      </mesh>

      {/* Orbiting Planet */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[1.2, 24, 24]} />
        <meshStandardMaterial color="#22d3ee" roughness={0.6} metalness={0.2} />
      </mesh>
    </>
  );
};

export const SectorMiniPreviewR3F: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={className || "w-full h-full"}>
      <Canvas
        camera={{ position: [0, 8, 22], fov: 45, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true }}
      >
        <SectorMiniScene />
      </Canvas>
    </div>
  );
};
