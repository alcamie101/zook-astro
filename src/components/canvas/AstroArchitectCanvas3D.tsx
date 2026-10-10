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

    // Background Galactic Starfield & Dust
    const dustCount = 3500;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      // Logarithmic spiral galaxy distribution
      const arm = i % 2 === 0 ? 0 : Math.PI;
      const dist = Math.pow(Math.random(), 0.6) * 450;
      const angle = dist * 0.02 + arm + (Math.random() - 0.5) * 0.6;
      const x = Math.cos(angle) * dist + (Math.random() - 0.5) * 20;
      const z = Math.sin(angle) * dist + (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * (30 * Math.exp(-dist / 200));

      dustPositions[i * 3] = x;
      dustPositions[i * 3 + 1] = y;
      dustPositions[i * 3 + 2] = z;

      // Color variation: Core warm gold -> Outer cyan/azure
      const t = Math.min(1, dist / 400);
      const col = new THREE.Color().lerpColors(
        new THREE.Color(0xffd599),
        new THREE.Color(0x5ca7ff),
        t
      );
      dustColors[i * 3] = col.r;
      dustColors[i * 3 + 1] = col.g;
      dustColors[i * 3 + 2] = col.b;
    }

    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

    const dustMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const dustParticles = new THREE.Points(dustGeo, dustMat);
    scene.add(dustParticles);

    // Galactic Core Glow Disk
    const coreGeo = new THREE.SphereGeometry(18, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffe2aa,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.scale.set(2.5, 0.4, 2.5);
    scene.add(coreMesh);

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

    // Animation Loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      if (!isPaused) {
        timeRef.current += 0.015 * simSpeed;
      }

      // Rotate galaxy dust gently
      dustParticles.rotation.y = timeRef.current * 0.02;

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

    return () => {
      cancelAnimationFrame(animFrameRef.current);
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
