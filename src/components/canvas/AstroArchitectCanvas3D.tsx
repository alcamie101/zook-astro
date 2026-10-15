import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import {
  ArchitectSystem,
  GalaxySystemNode,
  Hyperlane,
  ARCHITECT_CLASS_COLORS,
  ArchitectViewMode,
  isStarClass
} from '../../types/architect';

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

export const AstroArchitectCanvas3D: React.FC<Props> = ({
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
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredSystem, setHoveredSystem] = useState<GalaxySystemNode | null>(null);
  const [hoveredBody, setHoveredBody] = useState<string | null>(null);
  const [hyperlaneStart, setHyperlaneStart] = useState<string | null>(null);
  const [focusedBodyIndex, setFocusedBodyIndex] = useState<number | null>(null);

  // References for render loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number>(0);

  // Groups
  const galaxyGroupRef = useRef<THREE.Group>(new THREE.Group());
  const orreryGroupRef = useRef<THREE.Group>(new THREE.Group());
  const hyperlanesGroupRef = useRef<THREE.Group>(new THREE.Group());

  // Interactive targets for raycasting
  const galaxyHitTargets = useRef<{ mesh: THREE.Mesh; node: GalaxySystemNode }[]>([]);
  const orreryHitTargets = useRef<{ mesh: THREE.Mesh; bodyIndex: number; name: string }[]>([]);

  // Simulation time
  const timeRef = useRef<number>(0);

  // Camera animation target
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 180, 280));
  const targetCamLook = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const currentCamLook = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Initialize Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x04060d);
    scene.fog = new THREE.FogExp2(0x04060d, 0.0006);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 3000);
    cameraRef.current = camera;
    camera.position.set(0, 220, 320);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // Ambient and lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xa5c4ff, 0.8);
    dirLight.position.set(50, 150, 80);
    scene.add(dirLight);

    // Groups
    scene.add(galaxyGroupRef.current);
    scene.add(orreryGroupRef.current);
    scene.add(hyperlanesGroupRef.current);

    // Soft circular star sprite texture with crisp optical core
    const createStarTexture = () => {
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
    };

    // Soft, ethereal organic fractal nebula cloud texture
    const createNebulaCloudTexture = (centerHex: string, midHex: string, edgeHex: string) => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d')!;
      ctx.clearRect(0, 0, 256, 256);

      const seedRng = [
        { x: 128, y: 128, r: 100, a: 0.28 },
        { x: 105, y: 110, r: 80, a: 0.20 },
        { x: 155, y: 120, r: 85, a: 0.20 },
        { x: 120, y: 150, r: 75, a: 0.16 },
        { x: 145, y: 145, r: 70, a: 0.16 },
        { x: 90, y: 140, r: 65, a: 0.14 },
        { x: 165, y: 105, r: 60, a: 0.14 },
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

      // Feather outer perimeter seamlessly to 100% transparent zero alpha
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
    };

    const starTexture = createStarTexture();
    const cyanNebulaTex = createNebulaCloudTexture('rgba(56, 189, 248, 0.25)', 'rgba(14, 116, 144, 0.10)', 'rgba(3, 105, 161, 0.02)');
    const magentaNebulaTex = createNebulaCloudTexture('rgba(244, 63, 94, 0.25)', 'rgba(168, 85, 247, 0.10)', 'rgba(91, 33, 182, 0.02)');
    const goldNebulaTex = createNebulaCloudTexture('rgba(251, 191, 36, 0.22)', 'rgba(217, 119, 6, 0.09)', 'rgba(180, 83, 9, 0.02)');
    const violetNebulaTex = createNebulaCloudTexture('rgba(192, 132, 252, 0.20)', 'rgba(126, 34, 206, 0.08)', 'rgba(59, 7, 100, 0.02)');

    // Volumetric 3D Nebular Cloud System - Delicate, translucent celestial gas filaments
    const nebulaGroup = new THREE.Group();
    scene.add(nebulaGroup);

    interface ArchitectNebula {
      mesh: THREE.Mesh;
      baseRotSpeed: number;
      orbitSpeed: number;
      orbitRadius: number;
      orbitAngle: number;
    }
    const nebulaClouds: ArchitectNebula[] = [];

    const cloudDefs = [
      { tex: goldNebulaTex, scale: 220, dist: 30, color: 0xffd28a, opacity: 0.10 },
      { tex: violetNebulaTex, scale: 240, dist: 50, color: 0xc084fc, opacity: 0.08 },
      { tex: magentaNebulaTex, scale: 260, dist: 120, color: 0xf43f5e, opacity: 0.09 },
      { tex: cyanNebulaTex, scale: 260, dist: 140, color: 0x38bdf8, opacity: 0.09 },
      { tex: violetNebulaTex, scale: 270, dist: 200, color: 0x9333ea, opacity: 0.07 },
      { tex: cyanNebulaTex, scale: 280, dist: 240, color: 0x0284c7, opacity: 0.07 },
      { tex: goldNebulaTex, scale: 230, dist: 160, color: 0xfbbf24, opacity: 0.08 },
      { tex: magentaNebulaTex, scale: 250, dist: 220, color: 0xfb7185, opacity: 0.06 },
    ];

    cloudDefs.forEach((def, idx) => {
      const mat = new THREE.MeshBasicMaterial({
        map: def.tex,
        color: new THREE.Color(def.color),
        transparent: true,
        opacity: def.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(def.scale, def.scale), mat);
      const angle = (idx / cloudDefs.length) * Math.PI * 2;
      const x = Math.cos(angle) * def.dist;
      const z = Math.sin(angle) * def.dist;
      const y = (Math.random() - 0.5) * 12;
      plane.position.set(x, y, z);
      plane.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.1;
      plane.rotation.z = Math.random() * Math.PI * 2;
      nebulaGroup.add(plane);

      nebulaClouds.push({
        mesh: plane,
        baseRotSpeed: (Math.random() - 0.5) * 0.002,
        orbitSpeed: 0.006 / (1 + def.dist * 0.01),
        orbitRadius: def.dist,
        orbitAngle: angle
      });
    });

    // Background Ultra-Dense Fine Milky Way Starfield (140,000 particles)
    const starCount = 140000;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    const starAlphas = new Float32Array(starCount);

    const denseClusters = [
      { x: 20, z: 15, r: 16, col: 0xffedd5 },
      { x: -22, z: -18, r: 14, col: 0xfef08a },
      { x: 32, z: -25, r: 18, col: 0xfcd34d },
      { x: -28, z: 24, r: 16, col: 0xffedd5 },
      { x: 85, z: 65, r: 20, col: 0x38bdf8 },
      { x: -90, z: -70, r: 18, col: 0x60a5fa },
      { x: 135, z: -95, r: 22, col: 0x38bdf8 },
      { x: -130, z: 110, r: 20, col: 0x93c5fd },
      { x: 70, z: -125, r: 16, col: 0xf43f5e },
      { x: -75, z: 135, r: 18, col: 0xf43f5e },
      { x: 170, z: 85, r: 24, col: 0xffffff },
      { x: -175, z: -80, r: 22, col: 0xfef08a },
    ];

    for (let i = 0; i < starCount; i++) {
      let x = 0, y = 0, z = 0;
      let col = new THREE.Color();
      let isBulge = false;

      const sectorRoll = Math.random();

      if (sectorRoll < 0.24) {
        // [ZONE 0] Dense Star Clusters & Nurseries (~24% / ~33,600 stars)
        const cl = denseClusters[i % denseClusters.length];
        const offset = Math.pow(Math.random(), 1.7) * cl.r;
        const angle = Math.random() * Math.PI * 2;
        x = cl.x + Math.cos(angle) * offset;
        z = cl.z + Math.sin(angle) * offset;
        y = (Math.random() - 0.5) * (cl.r * 0.45 * Math.exp(-offset / cl.r));

        col.setHex(cl.col);
        if (Math.random() < 0.25) col.lerp(new THREE.Color(0xffffff), 0.5);
      } else if (sectorRoll < 0.48) {
        // [ZONE A] Central Sgr A* Bulge (~24% / ~33,600 stars)
        isBulge = true;
        const dist = Math.pow(Math.random(), 1.7) * 52;
        const angle = Math.random() * Math.PI * 2;
        x = (Math.cos(angle) * dist) * 1.35;
        z = Math.sin(angle) * dist;
        y = (Math.random() - 0.5) * (16 * Math.exp(-dist / 30));

        const rType = Math.random();
        if (rType < 0.42) col.setHex(0xfef08a);
        else if (rType < 0.75) col.setHex(0xfcd34d);
        else col.setHex(0xfb923c);

        if (dist < 18) col.lerp(new THREE.Color(0xfff7ed), 0.75);
      } else if (sectorRoll < 0.88) {
        // [ZONE B] 4 Logarithmic Spiral Arm Spines (~40% / ~56,000 stars)
        const armIdx = i % 4;
        const armBase = armIdx * (Math.PI / 2);
        const dist = 20 + Math.pow(Math.random(), 0.65) * 420;
        const spiralAngle = Math.log(dist / 16) * 2.1 + armBase;
        const dispersion = (Math.random() - 0.5) * (0.16 + dist * 0.0004);
        const angle = spiralAngle + dispersion;
        const rScatter = (Math.random() - 0.5) * (6 + dist * 0.06);
        const r = Math.max(8, dist + rScatter);

        x = Math.cos(angle) * r;
        z = Math.sin(angle) * r;

        const scaleHeight = 4.0 * Math.exp(-r / 220) + 1.5;
        y = (Math.random() - 0.5) * scaleHeight * 2;

        const pType = Math.random();
        if (pType < 0.10) col.setHex(0xf43f5e);
        else if (pType < 0.40) col.setHex(0x38bdf8);
        else if (pType < 0.70) col.setHex(0xffffff);
        else if (pType < 0.88) col.setHex(0xfef08a);
        else col.setHex(0xfb923c);
      } else {
        // [ZONE C] Diffuse Disk River (~12% / ~16,800 stars)
        const dist = 12 + Math.pow(Math.random(), 0.70) * 440;
        const angle = Math.random() * Math.PI * 2;
        x = Math.cos(angle) * dist;
        z = Math.sin(angle) * dist;
        y = (Math.random() - 0.5) * (8.0 * Math.exp(-dist / 240) + 2.2);

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

      // Fine Star Size Hierarchy (Matching Homepage precision)
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

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('aColor', new THREE.BufferAttribute(starColors, 3));
    starGeo.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1));
    starGeo.setAttribute('aAlpha', new THREE.BufferAttribute(starAlphas, 1));

    const starShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: starTexture }
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
          gl_PointSize = aSize * (240.0 / -mvPosition.z);
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

    const galaxyPoints = new THREE.Points(starGeo, starShaderMat);
    scene.add(galaxyPoints);

    // Orbit Controls Setup (custom pan/zoom/rotate)
    let isUserDragging = false;
    let dragMode: 'rotate' | 'pan' = 'rotate';
    let prevMouse = { x: 0, y: 0 };
    let spherical = { radius: 360, theta: 0.8, phi: 1.1 };

    const onMouseDown = (e: MouseEvent) => {
      isUserDragging = true;
      dragMode = e.button === 2 || e.shiftKey ? 'pan' : 'rotate';
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isUserDragging) {
        const dx = e.clientX - prevMouse.x;
        const dy = e.clientY - prevMouse.y;
        prevMouse = { x: e.clientX, y: e.clientY };

        if (dragMode === 'rotate') {
          spherical.theta -= dx * 0.006;
          spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, spherical.phi + dy * 0.006));
        } else {
          // Pan camera
          const forward = new THREE.Vector3().subVectors(targetCamLook.current, camera.position).normalize();
          const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
          const up = new THREE.Vector3().crossVectors(right, forward).normalize();
          targetCamLook.current.addScaledVector(right, -dx * 0.3);
          targetCamLook.current.addScaledVector(up, dy * 0.3);
        }
      }

      // Raycasting for hover
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      if (viewMode === 'galaxy') {
        const intersects = raycaster.intersectObjects(galaxyHitTargets.current.map(t => t.mesh));
        if (intersects.length > 0) {
          const hit = galaxyHitTargets.current.find(t => t.mesh === intersects[0].object);
          if (hit) setHoveredSystem(hit.node);
        } else {
          setHoveredSystem(null);
        }
      } else {
        const intersects = raycaster.intersectObjects(orreryHitTargets.current.map(t => t.mesh));
        if (intersects.length > 0) {
          const hit = orreryHitTargets.current.find(t => t.mesh === intersects[0].object);
          if (hit) setHoveredBody(hit.name);
        } else {
          setHoveredBody(null);
        }
      }
    };

    const onMouseUp = () => {
      isUserDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius = Math.max(15, Math.min(800, spherical.radius + e.deltaY * 0.35));
    };

    const onClick = (e: MouseEvent) => {
      // Raycasting for click
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      if (viewMode === 'galaxy') {
        const intersects = raycaster.intersectObjects(galaxyHitTargets.current.map(t => t.mesh));
        if (intersects.length > 0) {
          const hit = galaxyHitTargets.current.find(t => t.mesh === intersects[0].object);
          if (hit) {
            if (galaxyTool === 'delete' && onDeleteGalaxySystem) {
              onDeleteGalaxySystem(hit.node.id);
            } else if (galaxyTool === 'hyperlane' && onConnectHyperlane) {
              if (!hyperlaneStart) {
                setHyperlaneStart(hit.node.id);
              } else {
                if (hyperlaneStart !== hit.node.id) {
                  onConnectHyperlane(hyperlaneStart, hit.node.id);
                }
                setHyperlaneStart(null);
              }
            } else {
              onSelectSystemFromGalaxy(hit.node.id);
            }
          }
        } else if (galaxyTool === 'add' && onAddGalaxySystem) {
          // Raycast onto plane Y=0
          const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const intersectPoint = new THREE.Vector3();
          raycaster.ray.intersectPlane(plane, intersectPoint);
          if (intersectPoint) {
            onAddGalaxySystem(Math.round(intersectPoint.x), Math.round(intersectPoint.z), 0);
          }
        }
      } else {
        // Orrery click
        const intersects = raycaster.intersectObjects(orreryHitTargets.current.map(t => t.mesh));
        if (intersects.length > 0) {
          const hit = orreryHitTargets.current.find(t => t.mesh === intersects[0].object);
          if (hit) {
            setFocusedBodyIndex(hit.bodyIndex);
          }
        } else {
          // Click away returns focus to star
          setFocusedBodyIndex(null);
        }
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('click', onClick);
    container.addEventListener('contextmenu', e => e.preventDefault());

    // Resize handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Animation Loop with Modern Web Guidance: Efficient Background Processing
    let isRunning = true;
    const animate = () => {
      if (!isRunning) return;
      animFrameRef.current = requestAnimationFrame(animate);

      if (!isPaused) {
        timeRef.current += 0.015 * simSpeed;
      }

      // Rotate galaxy points gently
      galaxyPoints.rotation.y = timeRef.current * 0.015;

      // Organic orbit for nebulae
      nebulaClouds.forEach((cloud) => {
        cloud.orbitAngle += cloud.orbitSpeed * 0.015;
        cloud.mesh.position.x = Math.cos(cloud.orbitAngle) * cloud.orbitRadius;
        cloud.mesh.position.z = Math.sin(cloud.orbitAngle) * cloud.orbitRadius;
        cloud.mesh.rotation.z += cloud.baseRotSpeed;
      });

      // Update camera target based on spherical coordinates
      const cx = targetCamLook.current.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      const cy = targetCamLook.current.y + spherical.radius * Math.cos(spherical.phi);
      const cz = targetCamLook.current.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);

      targetCamPos.current.set(cx, cy, cz);

      // Smooth camera interpolation
      camera.position.lerp(targetCamPos.current, 0.08);
      currentCamLook.current.lerp(targetCamLook.current, 0.08);
      camera.lookAt(currentCamLook.current);

      renderer.render(scene, camera);
    };

    animate();

    // Modern Web Guidance: Tab visibility change handling
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(animFrameRef.current);
      } else {
        if (!isRunning) {
          isRunning = true;
          animate();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Modern Web Guidance: WebGL context loss recovery
    const canvasElement = renderer.domElement;
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      isRunning = false;
      cancelAnimationFrame(animFrameRef.current);
    };
    const handleContextRestored = () => {
      isRunning = true;
      animate();
    };
    canvasElement.addEventListener('webglcontextlost', handleContextLost);
    canvasElement.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animFrameRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      canvasElement.removeEventListener('webglcontextlost', handleContextLost);
      canvasElement.removeEventListener('webglcontextrestored', handleContextRestored);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('click', onClick);
      container.removeEventListener('contextmenu', e => e.preventDefault());
      resizeObserver.disconnect();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      starGeo.dispose();
      starShaderMat.dispose();
      starTexture.dispose();
      cyanNebulaTex.dispose();
      magentaNebulaTex.dispose();
      goldNebulaTex.dispose();
      violetNebulaTex.dispose();
    };
  }, []);

  // Update view mode camera defaults
  useEffect(() => {
    if (viewMode === 'galaxy') {
      targetCamLook.current.set(0, 0, 0);
      galaxyGroupRef.current.visible = true;
      hyperlanesGroupRef.current.visible = true;
      orreryGroupRef.current.visible = false;
    } else {
      targetCamLook.current.set(0, 0, 0);
      galaxyGroupRef.current.visible = false;
      hyperlanesGroupRef.current.visible = false;
      orreryGroupRef.current.visible = true;
    }
  }, [viewMode]);

  // Camera focus on planet when selected
  useEffect(() => {
    if (focusedBodyIndex !== null && currentSystem?.bodies[focusedBodyIndex]) {
      const body = currentSystem.bodies[focusedBodyIndex];
      const { scale, exponent, offset } = currentSystem.scaling;
      const exactDist = viewMode === 'linear'
        ? offset + (focusedBodyIndex + 1) * 22
        : scale * Math.pow(Math.max(0.001, body.sma), exponent) + offset;
      targetCamLook.current.set(exactDist, 0, 0);
    } else {
      targetCamLook.current.set(0, 0, 0);
    }
  }, [focusedBodyIndex, currentSystem, viewMode]);

  // Rebuild 3D Galaxy Systems & Hyperlanes
  useEffect(() => {
    const galaxyGroup = galaxyGroupRef.current;
    const hyperlanesGroup = hyperlanesGroupRef.current;

    // Clear old
    while (galaxyGroup.children.length > 0) {
      const obj = galaxyGroup.children[0];
      galaxyGroup.remove(obj);
    }
    while (hyperlanesGroup.children.length > 0) {
      const obj = hyperlanesGroup.children[0];
      hyperlanesGroup.remove(obj);
    }
    galaxyHitTargets.current = [];

    // Build Hyperlanes in 3D
    const lineMaterial = new THREE.LineDashedMaterial({
      color: 0x4fa3ff,
      linewidth: 1,
      scale: 1,
      dashSize: 4,
      gapSize: 3,
      transparent: true,
      opacity: 0.45
    });

    hyperlanes.forEach(([idA, idB]) => {
      const nodeA = galaxySystems.find(s => s.id === idA);
      const nodeB = galaxySystems.find(s => s.id === idB);
      if (nodeA && nodeB) {
        const points = [
          new THREE.Vector3(nodeA.x, nodeA.z || 0, nodeA.y),
          new THREE.Vector3(nodeB.x, nodeB.z || 0, nodeB.y)
        ];
        const geom = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geom, lineMaterial);
        line.computeLineDistances();
        hyperlanesGroup.add(line);
      }
    });

    // Build Galaxy Systems
    galaxySystems.forEach(node => {
      const sysGroup = new THREE.Group();
      sysGroup.position.set(node.x, node.z || 0, node.y);

      // Hit sphere for click/hover
      const hitGeo = new THREE.SphereGeometry(7, 16, 16);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      sysGroup.add(hitMesh);
      galaxyHitTargets.current.push({ mesh: hitMesh, node });

      // Selection / Hover Ring
      const isSelected = currentSystem._galaxyId === node.id;
      const ringGeo = new THREE.RingGeometry(isSelected ? 6.5 : 5.5, isSelected ? 7.5 : 6.2, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0x70b5ff : 0x3b82f6,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isSelected ? 0.9 : 0.35
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      sysGroup.add(ringMesh);

      // Render individual stars in the cluster
      node.stars.forEach(st => {
        const colHex = ARCHITECT_CLASS_COLORS[st.class] || '#ffffff';
        const starCol = new THREE.Color(colHex);

        const starGeo = new THREE.SphereGeometry(st.size * 0.7, 16, 16);
        const starMat = new THREE.MeshBasicMaterial({ color: starCol });
        const starMesh = new THREE.Mesh(starGeo, starMat);
        starMesh.position.set(st.dx, st.dz || 0, st.dy);
        sysGroup.add(starMesh);

        // Star corona halo
        const haloGeo = new THREE.SphereGeometry(st.size * 1.5, 16, 16);
        const haloMat = new THREE.MeshBasicMaterial({
          color: starCol,
          transparent: true,
          opacity: 0.35,
          blending: THREE.AdditiveBlending
        });
        const haloMesh = new THREE.Mesh(haloGeo, haloMat);
        haloMesh.position.copy(starMesh.position);
        sysGroup.add(haloMesh);
      });

      // Barycentric Webbing if multi-star
      if (node.stars.length > 1) {
        const webPoints: THREE.Vector3[] = [];
        node.stars.forEach(st => {
          webPoints.push(new THREE.Vector3(st.dx, st.dz || 0, st.dy));
        });
        if (webPoints.length > 0) webPoints.push(webPoints[0]); // close loop
        const webGeo = new THREE.BufferGeometry().setFromPoints(webPoints);
        const webMat = new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.25
        });
        const webLine = new THREE.Line(webGeo, webMat);
        sysGroup.add(webLine);
      }

      galaxyGroup.add(sysGroup);
    });
  }, [galaxySystems, hyperlanes, currentSystem._galaxyId]);

  // Rebuild 3D Orrery & Linear View for active system
  useEffect(() => {
    const orreryGroup = orreryGroupRef.current;
    while (orreryGroup.children.length > 0) {
      const obj = orreryGroup.children[0];
      orreryGroup.remove(obj);
    }
    orreryHitTargets.current = [];

    if (!currentSystem) return;

    // 1. Primary Star
    const starClass = currentSystem.star.class;
    const starColHex = ARCHITECT_CLASS_COLORS[starClass] || '#fff2a1';
    const starColor = new THREE.Color(starColHex);

    const primaryStarGroup = new THREE.Group();
    const starRadius = Math.max(3, currentSystem.star.size * 0.25);
    const starGeo = new THREE.SphereGeometry(starRadius, 32, 32);
    const starMat = new THREE.MeshBasicMaterial({ color: starColor });
    const starMesh = new THREE.Mesh(starGeo, starMat);
    primaryStarGroup.add(starMesh);

    // Glowing Corona
    const coronaGeo = new THREE.SphereGeometry(starRadius * 1.8, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: starColor,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    primaryStarGroup.add(coronaMesh);

    // Star point light
    const starLight = new THREE.PointLight(starColor, 2.5, 800, 0.4);
    primaryStarGroup.add(starLight);

    orreryGroup.add(primaryStarGroup);

    // 2. Circumbinary / S-Type Companion
    if (currentSystem.hierarchy === 'circumbinary' && currentSystem.star2) {
      const s2Dist = currentSystem.star2.dist || 14;
      const s2Class = currentSystem.star2.class;
      const s2Col = new THREE.Color(ARCHITECT_CLASS_COLORS[s2Class] || '#ffb56b');
      const s2Radius = Math.max(2, currentSystem.star2.size * 0.22);

      const s2OrbitGeo = new THREE.RingGeometry(s2Dist - 0.2, s2Dist + 0.2, 64);
      const s2OrbitMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.2
      });
      const s2OrbitRing = new THREE.Mesh(s2OrbitGeo, s2OrbitMat);
      s2OrbitRing.rotation.x = Math.PI / 2;
      orreryGroup.add(s2OrbitRing);

      const s2Mesh = new THREE.Mesh(
        new THREE.SphereGeometry(s2Radius, 24, 24),
        new THREE.MeshBasicMaterial({ color: s2Col })
      );
      s2Mesh.position.set(s2Dist, 0, 0);
      orreryGroup.add(s2Mesh);
    }

    // 3. Celestial Bodies (Planets, Asteroids, Moons)
    const { scale, exponent, offset } = currentSystem.scaling;

    currentSystem.bodies.forEach((body, idx) => {
      const exactDist = viewMode === 'linear'
        ? offset + (idx + 1) * 22
        : scale * Math.pow(Math.max(0.001, body.sma), exponent) + offset;

      const bodyGroup = new THREE.Group();

      if (body.type === 'belt') {
        // Asteroid Belt: Instanced tumbling rocks
        const beltCount = 220;
        const beltGeo = new THREE.DodecahedronGeometry(0.7, 0);
        const beltMat = new THREE.MeshStandardMaterial({
          color: 0x8892a0,
          roughness: 0.9,
          metalness: 0.1
        });
        const instancedBelt = new THREE.InstancedMesh(beltGeo, beltMat, beltCount);
        const dummy = new THREE.Object3D();

        for (let i = 0; i < beltCount; i++) {
          const theta = (i / beltCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
          const r = exactDist + (Math.random() - 0.5) * 6;
          const y = (Math.random() - 0.5) * 2.5;
          dummy.position.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
          dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
          const s = 0.5 + Math.random() * 0.9;
          dummy.scale.set(s, s, s);
          dummy.updateMatrix();
          instancedBelt.setMatrixAt(i, dummy.matrix);
        }
        instancedBelt.instanceMatrix.needsUpdate = true;
        orreryGroup.add(instancedBelt);

        // Thin orbital guide
        const orbitGuideGeo = new THREE.RingGeometry(exactDist - 0.15, exactDist + 0.15, 96);
        const orbitGuideMat = new THREE.MeshBasicMaterial({
          color: 0x64748b,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.15
        });
        const orbitRing = new THREE.Mesh(orbitGuideGeo, orbitGuideMat);
        orbitRing.rotation.x = Math.PI / 2;
        orreryGroup.add(orbitRing);
      } else {
        // Orbit Path Ring
        const orbitGeo = new THREE.RingGeometry(exactDist - 0.2, exactDist + 0.2, 96);
        const orbitMat = new THREE.MeshBasicMaterial({
          color: 0x475569,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.35
        });
        const orbitRing = new THREE.Mesh(orbitGeo, orbitMat);
        orbitRing.rotation.x = Math.PI / 2;
        orreryGroup.add(orbitRing);

        // Planet Body
        const bodyRadius = Math.max(1.4, (body.size || 15) * 0.14);
        const bodyColHex = ARCHITECT_CLASS_COLORS[body.type] || '#94a3b8';
        const bodyColor = new THREE.Color(bodyColHex);

        const planetGeo = new THREE.SphereGeometry(bodyRadius, 32, 32);
        const planetMat = isStarClass(body.type)
          ? new THREE.MeshBasicMaterial({ color: bodyColor })
          : new THREE.MeshStandardMaterial({
              color: bodyColor,
              roughness: 0.7,
              metalness: 0.15
            });

        const planetMesh = new THREE.Mesh(planetGeo, planetMat);
        planetMesh.position.set(exactDist, 0, 0);
        bodyGroup.add(planetMesh);

        // Gas Giant Ring
        if (body.ring) {
          const ringIn = bodyRadius * 1.4;
          const ringOut = bodyRadius * 2.4;
          const saturnRingGeo = new THREE.RingGeometry(ringIn, ringOut, 64);
          const saturnRingMat = new THREE.MeshStandardMaterial({
            color: 0xd4c29d,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.65
          });
          const saturnRing = new THREE.Mesh(saturnRingGeo, saturnRingMat);
          saturnRing.rotation.x = Math.PI / 2.3;
          saturnRing.rotation.y = 0.2;
          planetMesh.add(saturnRing);
        }

        // Hit Target for interactive selection
        const hitGeo = new THREE.SphereGeometry(bodyRadius * 1.5, 16, 16);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitMesh = new THREE.Mesh(hitGeo, hitMat);
        hitMesh.position.copy(planetMesh.position);
        bodyGroup.add(hitMesh);
        orreryHitTargets.current.push({ mesh: hitMesh, bodyIndex: idx, name: body.name });

        // Moons in 3D
        if (body.moons && body.moons.length > 0) {
          let runningMoonDist = bodyRadius + 2.5;

          body.moons.forEach((moon, mi) => {
            runningMoonDist += (moon.dist || 3.0) * 0.8;
            const moonRadius = Math.max(0.6, (moon.size || 7) * 0.08);
            const moonColHex = ARCHITECT_CLASS_COLORS[moon.type] || '#cbd5e1';

            // Moon orbit path around planet
            const moonOrbitGeo = new THREE.RingGeometry(runningMoonDist - 0.08, runningMoonDist + 0.08, 32);
            const moonOrbitMat = new THREE.MeshBasicMaterial({
              color: 0x334155,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.35
            });
            const moonOrbitMesh = new THREE.Mesh(moonOrbitGeo, moonOrbitMat);
            moonOrbitMesh.rotation.x = Math.PI / 2;
            planetMesh.add(moonOrbitMesh);

            // Moon mesh
            const moonMesh = new THREE.Mesh(
              new THREE.SphereGeometry(moonRadius, 16, 16),
              new THREE.MeshStandardMaterial({ color: new THREE.Color(moonColHex) })
            );
            const moonAngle = mi * 1.8;
            moonMesh.position.set(
              Math.cos(moonAngle) * runningMoonDist,
              0,
              Math.sin(moonAngle) * runningMoonDist
            );
            planetMesh.add(moonMesh);

            // Sub-Moons in 3D
            if (moon.moons && moon.moons.length > 0) {
              let runningSubDist = moonRadius + 1.2;
              moon.moons.forEach((subMoon, smi) => {
                runningSubDist += (subMoon.dist || 2.0) * 0.6;
                const subRadius = Math.max(0.35, (subMoon.size || 5) * 0.06);
                const subColHex = ARCHITECT_CLASS_COLORS[subMoon.type] || '#94a3b8';

                const subMesh = new THREE.Mesh(
                  new THREE.SphereGeometry(subRadius, 12, 12),
                  new THREE.MeshStandardMaterial({ color: new THREE.Color(subColHex) })
                );
                const subAngle = smi * 2.4;
                subMesh.position.set(
                  Math.cos(subAngle) * runningSubDist,
                  0,
                  Math.sin(subAngle) * runningSubDist
                );
                moonMesh.add(subMesh);
              });
            }
          });
        }

        orreryGroup.add(bodyGroup);
      }
    });
  }, [currentSystem, viewMode]);

  return (
    <div className="w-full h-full relative overflow-hidden select-none bg-[#04060d]" ref={mountRef}>
      {/* 3D Context Overlays */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-wider bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 uppercase">
            {viewMode === 'galaxy' ? '🌌 3D Galaxy Cartographer' : viewMode === 'orrery' ? '🪐 3D System Orrery' : '📏 3D Linear Track'}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-wider bg-slate-900/80 text-slate-300 border border-slate-700/60">
            {currentSystem?.star?.name || 'Selected System'}
          </span>
        </div>

        {/* Hover Telemetry HUD */}
        {viewMode === 'galaxy' && hoveredSystem && (
          <div className="mt-1 p-2.5 rounded-lg bg-slate-950/90 border border-cyan-500/50 backdrop-blur-md shadow-2xl flex flex-col gap-1 min-w-[200px]">
            <div className="flex items-center justify-between text-xs font-semibold text-cyan-300 font-mono">
              <span>{hoveredSystem.name}</span>
              <span className="text-[10px] text-slate-400 font-normal">{hoveredSystem.stars.length} Star{hoveredSystem.stars.length > 1 ? 's' : ''}</span>
            </div>
            <div className="text-[10px] text-slate-400">{hoveredSystem.desc}</div>
            <div className="mt-1 text-[9px] font-mono text-emerald-400">► Click to Enter System Orrery</div>
          </div>
        )}

        {viewMode !== 'galaxy' && hoveredBody && (
          <div className="mt-1 px-3 py-1.5 rounded-lg bg-slate-950/90 border border-amber-500/50 backdrop-blur-md shadow-xl text-xs font-mono text-amber-300">
            Target Body: <span className="text-white font-bold">{hoveredBody}</span>
          </div>
        )}
      </div>

      {/* Orbit Control Tip */}
      <div className="absolute bottom-3 right-3 z-10 pointer-events-none text-[10px] font-mono text-slate-500 bg-slate-950/70 px-2.5 py-1 rounded border border-slate-800/60 backdrop-blur-sm">
        Drag: Rotate Orbit • Right-Drag / Shift: Pan • Scroll: Zoom
      </div>
    </div>
  );
};
