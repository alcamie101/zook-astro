import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';

// Create soft circular star sprite texture programmatically with crisp optical core
function createStarTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.25, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.45, 'rgba(240, 248, 255, 0.9)');
  grad.addColorStop(0.7, 'rgba(180, 220, 255, 0.4)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

// Create subtle, ethereal organic fractal nebula cloud texture
function createNebulaCloudTexture(centerHex: string, midHex: string, edgeHex: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, 256, 256);

  const seedRng = [
    { x: 128, y: 128, r: 100, a: 0.30 },
    { x: 105, y: 110, r: 80, a: 0.22 },
    { x: 155, y: 120, r: 85, a: 0.22 },
    { x: 120, y: 150, r: 75, a: 0.18 },
    { x: 145, y: 145, r: 70, a: 0.18 },
    { x: 90, y: 140, r: 65, a: 0.15 },
    { x: 165, y: 105, r: 60, a: 0.15 },
    { x: 130, y: 85, r: 60, a: 0.12 },
    { x: 80, y: 95, r: 50, a: 0.12 },
    { x: 175, y: 145, r: 55, a: 0.12 },
  ];

  seedRng.forEach(lobe => {
    const grad = ctx.createRadialGradient(lobe.x, lobe.y, 0, lobe.x, lobe.y, lobe.r);
    grad.addColorStop(0, centerHex);
    grad.addColorStop(0.4, midHex);
    grad.addColorStop(0.8, edgeHex);
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.globalAlpha = lobe.a;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(lobe.x, lobe.y, lobe.r, 0, Math.PI * 2);
    ctx.fill();
  });

  const borderVignette = ctx.createRadialGradient(128, 128, 65, 128, 128, 128);
  borderVignette.addColorStop(0, 'rgba(0,0,0,1)');
  borderVignette.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = borderVignette;
  ctx.fillRect(0, 0, 256, 256);
  ctx.globalCompositeOperation = 'source-over';

  const texture = new THREE.CanvasTexture(c);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

interface MilkyWayGalaxyProps {
  interactiveParallax?: boolean;
}

export const MilkyWaySceneR3F: React.FC<MilkyWayGalaxyProps> = ({ interactiveParallax = true }) => {
  const { camera } = useThree();
  const galaxyGroupRef = useRef<THREE.Group>(null);
  const nebulaGroupRef = useRef<THREE.Group>(null);
  const cloudMeshesRef = useRef<{ mesh: THREE.Mesh; orbitSpeed: number; orbitRadius: number; orbitAngle: number; baseRotSpeed: number }[]>([]);

  // Mouse Parallax Targets
  const mouseTargetRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 80, z: 240 });

  useEffect(() => {
    if (!interactiveParallax) return;
    const onMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseTargetRef.current = {
        x: nx * 35,
        y: 80 + ny * 20,
        z: 240 + (1 - Math.abs(nx)) * 10
      };
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [interactiveParallax]);

  // Procedural Textures
  const { starTex, cyanNebulaTex, magentaNebulaTex, goldNebulaTex, violetNebulaTex } = useMemo(() => {
    return {
      starTex: createStarTexture(),
      cyanNebulaTex: createNebulaCloudTexture('rgba(56, 189, 248, 0.28)', 'rgba(14, 116, 144, 0.12)', 'rgba(3, 105, 161, 0.02)'),
      magentaNebulaTex: createNebulaCloudTexture('rgba(244, 63, 94, 0.28)', 'rgba(168, 85, 247, 0.12)', 'rgba(91, 33, 182, 0.02)'),
      goldNebulaTex: createNebulaCloudTexture('rgba(251, 191, 36, 0.25)', 'rgba(217, 119, 6, 0.10)', 'rgba(180, 83, 9, 0.02)'),
      violetNebulaTex: createNebulaCloudTexture('rgba(192, 132, 252, 0.24)', 'rgba(126, 34, 206, 0.09)', 'rgba(59, 7, 100, 0.02)'),
    };
  }, []);

  // Cleanup textures on unmount
  useEffect(() => {
    return () => {
      starTex.dispose();
      cyanNebulaTex.dispose();
      magentaNebulaTex.dispose();
      goldNebulaTex.dispose();
      violetNebulaTex.dispose();
    };
  }, [starTex, cyanNebulaTex, magentaNebulaTex, goldNebulaTex, violetNebulaTex]);

  // Nebulae cloud definitions
  const cloudDefs = useMemo(() => [
    { tex: goldNebulaTex, scale: 200, dist: 25, color: 0xffd28a, opacity: 0.11 },
    { tex: violetNebulaTex, scale: 220, dist: 45, color: 0xc084fc, opacity: 0.09 },
    { tex: goldNebulaTex, scale: 180, dist: 70, color: 0xf59e0b, opacity: 0.08 },
    { tex: magentaNebulaTex, scale: 250, dist: 110, color: 0xf43f5e, opacity: 0.10 },
    { tex: magentaNebulaTex, scale: 230, dist: 150, color: 0xe11d48, opacity: 0.09 },
    { tex: violetNebulaTex, scale: 260, dist: 190, color: 0x9333ea, opacity: 0.08 },
    { tex: magentaNebulaTex, scale: 240, dist: 240, color: 0xfb7185, opacity: 0.07 },
    { tex: cyanNebulaTex, scale: 250, dist: 120, color: 0x38bdf8, opacity: 0.10 },
    { tex: cyanNebulaTex, scale: 230, dist: 170, color: 0x06b6d4, opacity: 0.09 },
    { tex: cyanNebulaTex, scale: 260, dist: 220, color: 0x0284c7, opacity: 0.08 },
    { tex: violetNebulaTex, scale: 250, dist: 260, color: 0x7c3aed, opacity: 0.07 },
    { tex: cyanNebulaTex, scale: 270, dist: 85, color: 0x22d3ee, opacity: 0.08 },
    { tex: magentaNebulaTex, scale: 250, dist: 140, color: 0xf43f5e, opacity: 0.07 },
    { tex: goldNebulaTex, scale: 220, dist: 125, color: 0xfbbf24, opacity: 0.08 },
    { tex: violetNebulaTex, scale: 240, dist: 200, color: 0xa855f7, opacity: 0.06 },
  ], [cyanNebulaTex, magentaNebulaTex, goldNebulaTex, violetNebulaTex]);

  // 180,000 Milky Way Stars Geometry
  const starGeo = useMemo(() => {
    const starCount = 180000;
    const geo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    const starAlphas = new Float32Array(starCount);

    const denseClusters = [
      { x: 18, z: 12, r: 14, col: 0xffedd5 },
      { x: -18, z: -14, r: 12, col: 0xfef08a },
      { x: 28, z: -22, r: 15, col: 0xfcd34d },
      { x: -25, z: 20, r: 14, col: 0xffedd5 },
      { x: 78, z: 58, r: 18, col: 0x38bdf8 },
      { x: -82, z: -62, r: 17, col: 0x60a5fa },
      { x: 128, z: -88, r: 20, col: 0x38bdf8 },
      { x: -122, z: 102, r: 19, col: 0x93c5fd },
      { x: 62, z: -118, r: 15, col: 0xf43f5e },
      { x: -68, z: 128, r: 16, col: 0xf43f5e },
      { x: 158, z: 78, r: 22, col: 0xffffff },
      { x: -162, z: -72, r: 20, col: 0xfef08a },
      { x: 192, z: -32, r: 22, col: 0x38bdf8 },
      { x: -188, z: 42, r: 20, col: 0x60a5fa }
    ];

    for (let i = 0; i < starCount; i++) {
      let x = 0, y = 0, z = 0;
      let col = new THREE.Color();
      let isBulge = false;
      const sectorRoll = Math.random();

      if (sectorRoll < 0.25) {
        // [ZONE 0] Dense Star Clusters & Stellar Nurseries (~25% / 45k)
        const cl = denseClusters[i % denseClusters.length];
        const offset = Math.pow(Math.random(), 1.7) * cl.r;
        const angle = Math.random() * Math.PI * 2;
        x = cl.x + Math.cos(angle) * offset;
        z = cl.z + Math.sin(angle) * offset;
        y = (Math.random() - 0.5) * (cl.r * 0.45 * Math.exp(-offset / cl.r));
        col.setHex(cl.col);
        if (Math.random() < 0.25) col.lerp(new THREE.Color(0xffffff), 0.5);
      } else if (sectorRoll < 0.50) {
        // [ZONE A] Galactic Bulge & Sgr A* Nucleus (~25% / 45k)
        isBulge = true;
        const dist = Math.pow(Math.random(), 1.7) * 48;
        const angle = Math.random() * Math.PI * 2;
        const barStretch = 1.35;
        x = (Math.cos(angle) * dist) * barStretch;
        z = Math.sin(angle) * dist;
        y = (Math.random() - 0.5) * (15 * Math.exp(-dist / 28));

        const rType = Math.random();
        if (rType < 0.42) col.setHex(0xfef08a);
        else if (rType < 0.75) col.setHex(0xfcd34d);
        else col.setHex(0xfb923c);

        if (dist < 16) col.lerp(new THREE.Color(0xfff7ed), 0.75);
      } else if (sectorRoll < 0.88) {
        // [ZONE B] 4 Logarithmic Spiral Arm Spines (~38% / ~68k)
        const armIdx = i % 4;
        const armBase = armIdx * (Math.PI / 2);
        const dist = 18 + Math.pow(Math.random(), 0.65) * 360;
        const spiralAngle = Math.log(dist / 16) * 2.1 + armBase;
        const dispersion = (Math.random() - 0.5) * (0.16 + dist * 0.0004);
        const angle = spiralAngle + dispersion;
        const rScatter = (Math.random() - 0.5) * (6 + dist * 0.06);
        const r = Math.max(8, dist + rScatter);

        x = Math.cos(angle) * r;
        z = Math.sin(angle) * r;
        const scaleHeight = 3.8 * Math.exp(-r / 200) + 1.4;
        y = (Math.random() - 0.5) * scaleHeight * 2;

        const pType = Math.random();
        if (pType < 0.10) col.setHex(0xf43f5e);
        else if (pType < 0.40) col.setHex(0x38bdf8);
        else if (pType < 0.70) col.setHex(0xffffff);
        else if (pType < 0.88) col.setHex(0xfef08a);
        else col.setHex(0xfb923c);
      } else {
        // [ZONE C] Diffuse Inter-Arm Disk (~12% / ~22k)
        const dist = 10 + Math.pow(Math.random(), 0.70) * 380;
        const angle = Math.random() * Math.PI * 2;
        x = Math.cos(angle) * dist;
        z = Math.sin(angle) * dist;
        y = (Math.random() - 0.5) * (7.5 * Math.exp(-dist / 220) + 2.2);

        const dType = Math.random();
        if (dType < 0.55) col.setHex(0xffffff);
        else if (dType < 0.82) col.setHex(0xbae6fd);
        else col.setHex(0xfef08a);
      }

      starPositions[i * 3] = x;
      starPositions[i * 3 + 1] = y;
      starPositions[i * 3 + 2] = z;
      starColors[i * 3] = col.r;
      starColors[i * 3 + 1] = col.g;
      starColors[i * 3 + 2] = col.b;

      const tierRoll = Math.random();
      let baseSize: number;
      let alpha: number;

      if (tierRoll < 0.78) {
        baseSize = 0.85 + Math.random() * 0.50;
        alpha = 0.75 + Math.random() * 0.25;
      } else if (tierRoll < 0.95) {
        baseSize = 1.5 + Math.random() * 0.8;
        alpha = 0.88 + Math.random() * 0.12;
      } else {
        baseSize = 2.6 + Math.random() * 1.3;
        alpha = 1.0;
      }

      if (isBulge) {
        alpha = 1.0;
        baseSize *= 1.12;
      }

      starSizes[i] = baseSize;
      starAlphas[i] = alpha;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(starColors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(starAlphas, 1));
    return geo;
  }, []);

  // Custom Point Shader Material
  const starShaderMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: starTex }
      },
      vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aAlpha;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = aColor;
          vAlpha = aAlpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (260.0 / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 0.7, 4.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec4 tex = texture2D(pointTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor, 1.0) * tex.a * vAlpha;
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }, [starTex]);

  // R3F Animation Loop via useFrame
  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();

    // Rotate Galaxy Starfield
    if (galaxyGroupRef.current) {
      galaxyGroupRef.current.rotation.y = elapsed * 0.02;
    }

    // Orbit Nebulae Clouds
    cloudMeshesRef.current.forEach((cloud) => {
      cloud.orbitAngle += cloud.orbitSpeed * 0.02;
      cloud.mesh.position.x = Math.cos(cloud.orbitAngle) * cloud.orbitRadius;
      cloud.mesh.position.z = Math.sin(cloud.orbitAngle) * cloud.orbitRadius;
      cloud.mesh.rotation.z += cloud.baseRotSpeed;
    });

    // Smooth Camera Mouse Parallax
    if (interactiveParallax) {
      camera.position.x += (mouseTargetRef.current.x - camera.position.x) * 0.04;
      camera.position.y += (mouseTargetRef.current.y - camera.position.y) * 0.04;
      camera.position.z += (mouseTargetRef.current.z - camera.position.z) * 0.04;
      camera.lookAt(0, 0, 0);
    }
  });

  return (
    <group rotation={[0.45, 0, 0]}>
      {/* 180,000 Star Points */}
      <points ref={galaxyGroupRef as any} geometry={starGeo} material={starShaderMat} />

      {/* Volumetric Nebulae Clouds */}
      <group ref={nebulaGroupRef}>
        {cloudDefs.map((def, idx) => {
          const angle = (idx / cloudDefs.length) * Math.PI * 2 + (idx % 2 ? 0.35 : 0);
          const x = Math.cos(angle) * def.dist;
          const z = Math.sin(angle) * def.dist;
          const y = (Math.sin(idx * 3.7) * 8);

          return (
            <mesh
              key={idx}
              ref={(el) => {
                if (el && !cloudMeshesRef.current.some(c => c.mesh === el)) {
                  cloudMeshesRef.current.push({
                    mesh: el,
                    baseRotSpeed: (Math.random() - 0.5) * 0.003,
                    orbitSpeed: 0.008 / (1 + def.dist * 0.01),
                    orbitRadius: def.dist,
                    orbitAngle: angle
                  });
                }
              }}
              position={[x, y, z]}
              rotation={[Math.PI / 2 + (idx % 2 ? 0.08 : -0.08), 0, idx * 0.8]}
            >
              <planeGeometry args={[def.scale, def.scale]} />
              <meshBasicMaterial
                map={def.tex}
                color={def.color}
                transparent
                opacity={def.opacity}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
};

export const MilkyWayCanvasR3F: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={className || "w-full h-full"}>
      <Canvas
        camera={{ position: [0, 80, 240], fov: 50, near: 0.1, far: 2500 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ scene }) => {
          scene.fog = new THREE.FogExp2(0x020409, 0.0006);
        }}
      >
        <MilkyWaySceneR3F interactiveParallax={true} />
      </Canvas>
    </div>
  );
};
