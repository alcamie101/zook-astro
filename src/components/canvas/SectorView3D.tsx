import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FilterCategory, StarSystem } from '../../types/astrophysics';
import { SectorControlsOverlay, SectorTooltip } from './sector';

interface SectorView3DProps {
  stars: StarSystem[];
  selectedStar: StarSystem | null;
  onSelectStar: (star: StarSystem) => void;
  activeFilter: FilterCategory;
  radiusLy: number;
}

export const SectorView3D: React.FC<SectorView3DProps> = ({
  stars,
  selectedStar,
  onSelectStar,
  activeFilter,
  radiusLy,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredStar, setHoveredStar] = useState<StarSystem | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const selectionMarkerRef = useRef<THREE.Mesh | null>(null);

  // Camera interaction state
  const isDraggingRef = useRef(false);
  const isRightDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const sphericalRef = useRef({
    radius: radiusLy * 2.2,
    theta: Math.PI / 4,
    phi: Math.PI / 3,
  });

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

  useEffect(() => {
    sphericalRef.current.radius = radiusLy * 2.2;
    updateCameraPosition();
  }, [radiusLy]);

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
      0.1,
      radiusLy * 20
    );
    cameraRef.current = camera;
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    rendererRef.current = renderer;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Concentric Range Rings (Light-Years Metric)
    const ringGroup = new THREE.Group();
    const ringMaterial = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
    });
    [0.25, 0.5, 0.75, 1.0, 1.25].forEach((rf) => {
      const ringGeom = new THREE.BufferGeometry();
      const points: THREE.Vector3[] = [];
      const segs = 64;
      const r = radiusLy * rf;
      for (let j = 0; j <= segs; j++) {
        const a = (j / segs) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
      }
      ringGeom.setFromPoints(points);
      const ringLine = new THREE.Line(ringGeom, ringMaterial);
      ringGroup.add(ringLine);
    });
    scene.add(ringGroup);

    // 3. Selection Indicator Ring
    const selGeom = new THREE.RingGeometry(2.5, 3.2, 32);
    const selMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const selMarker = new THREE.Mesh(selGeom, selMat);
    selMarker.visible = false;
    scene.add(selMarker);
    selectionMarkerRef.current = selMarker;

    // 4. Animation Loop
    let animId: number;
    let isRunning = true;
    const animate = () => {
      if (!isRunning) return;
      animId = requestAnimationFrame(animate);

      if (selectionMarkerRef.current && cameraRef.current) {
        selectionMarkerRef.current.quaternion.copy(cameraRef.current.quaternion);
      }

      renderer.render(scene, camera);
    };
    animate();

    // Modern Web Guidance: Efficient background processing on tab switch
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(animId);
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
      cancelAnimationFrame(animId);
    };
    const handleContextRestored = () => {
      isRunning = true;
      animate();
    };
    canvasElement.addEventListener('webglcontextlost', handleContextLost);
    canvasElement.addEventListener('webglcontextrestored', handleContextRestored);

    // 5. Real-time Resize Observer for dynamic panel dragging
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
      isRunning = false;
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      canvasElement.removeEventListener('webglcontextlost', handleContextLost);
      canvasElement.removeEventListener('webglcontextrestored', handleContextRestored);
      resizeObserver.disconnect();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Points when stars or filter changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (pointsRef.current) {
      scene.remove(pointsRef.current);
      pointsRef.current.geometry.dispose();
      (pointsRef.current.material as THREE.Material).dispose();
      pointsRef.current = null;
    }

    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];

    // Helper to generate circle texture
    const createStarTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
        grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.25)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    };

    stars.forEach((star) => {
      let matches = true;
      if (activeFilter === 'ob') matches = star.colorData.cat === 'ob';
      else if (activeFilter === 'g') matches = star.colorData.cat === 'g';
      else if (activeFilter === 'km') matches = star.colorData.cat === 'km';
      else if (activeFilter === 'remnant') matches = star.starState.isRemnant;
      else if (activeFilter === 'hz') matches = star.hasHZPlanet;

      positions.push(star.x, star.z, star.y); // Map into Three.js coordinates

      if (!matches) {
        colors.push(0.2, 0.25, 0.35); // Dimmed slate color
        sizes.push(4.0);
      } else {
        const rNorm = star.colorData.r / 255;
        const gNorm = star.colorData.g / 255;
        const bNorm = star.colorData.b / 255;
        colors.push(rNorm, gNorm, bNorm);

        let sz = 7.0;
        if (star.colorData.cat === 'ob') sz = 16.0;
        else if (star.starState.L > 50) sz = 14.0;
        else if (star.colorData.cat === 'g') sz = 9.0;
        if (star.hasHZPlanet) sz += 3.0;

        sizes.push(sz);
      }
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 8,
      vertexColors: true,
      map: createStarTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);
    pointsRef.current = points;
  }, [stars, activeFilter]);

  // Update selection indicator marker
  useEffect(() => {
    if (selectionMarkerRef.current) {
      if (selectedStar) {
        selectionMarkerRef.current.position.set(
          selectedStar.x,
          selectedStar.z,
          selectedStar.y
        );
        selectionMarkerRef.current.visible = true;
      } else {
        selectionMarkerRef.current.visible = false;
      }
    }
  }, [selectedStar]);

  // Raycasting for click selection and hover
  const getStarUnderCursor = (clientX: number, clientY: number): StarSystem | null => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    if (!container || !camera || stars.length === 0) return null;

    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / container.clientWidth) * 2 - 1,
      -((clientY - rect.top) / container.clientHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 4.5 };
    raycaster.setFromCamera(mouse, camera);

    if (!pointsRef.current) return null;
    const intersects = raycaster.intersectObject(pointsRef.current);

    if (intersects.length > 0 && intersects[0].index !== undefined) {
      const idx = intersects[0].index;
      return stars[idx] || null;
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) isDraggingRef.current = true;
    if (e.button === 2) isRightDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

    if (isDraggingRef.current) {
      // Rotate around target
      sphericalRef.current.theta -= deltaX * 0.006;
      sphericalRef.current.phi = Math.max(
        0.05,
        Math.min(Math.PI - 0.05, sphericalRef.current.phi - deltaY * 0.006)
      );
      updateCameraPosition();
    } else if (isRightDraggingRef.current) {
      // Pan target
      const panSpeed = sphericalRef.current.radius * 0.0015;
      cameraTargetRef.current.x -= deltaX * panSpeed;
      cameraTargetRef.current.y += deltaY * panSpeed;
      updateCameraPosition();
    }

    // Hover detection
    const star = getStarUnderCursor(e.clientX, e.clientY);
    if (star) {
      setHoveredStar(star);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltipPos({
          x: e.clientX - rect.left + 12,
          y: e.clientY - rect.top + 12,
        });
      }
    } else {
      setHoveredStar(null);
      setTooltipPos(null);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isRightDraggingRef.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    const star = getStarUnderCursor(e.clientX, e.clientY);
    if (star) {
      onSelectStar(star);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.9 : 1.1;
    sphericalRef.current.radius = Math.max(
      10,
      Math.min(radiusLy * 8, sphericalRef.current.radius * zoomFactor)
    );
    updateCameraPosition();
  };

  const handleResetCamera = () => {
    cameraTargetRef.current.set(0, 0, 0);
    sphericalRef.current = {
      radius: radiusLy * 2.2,
      theta: Math.PI / 4,
      phi: Math.PI / 3,
    };
    updateCameraPosition();
  };

  return (
    <div
      ref={containerRef}
      id="section-03-galactic-sector-3d"
      data-section="3D Galactic Sector Viewport"
      className="w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 3D Navigation Controls HUD */}
      <SectorControlsOverlay
        radiusLy={radiusLy}
        onZoomIn={() => {
          sphericalRef.current.radius = Math.max(10, sphericalRef.current.radius * 0.8);
          updateCameraPosition();
        }}
        onZoomOut={() => {
          sphericalRef.current.radius = Math.min(radiusLy * 8, sphericalRef.current.radius * 1.25);
          updateCameraPosition();
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
      <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400 pointer-events-none">
        <span className="text-slate-500">Left-Drag: Rotate 3D &bull; Right-Drag: Pan &bull; Wheel: Zoom</span>
        <span className="text-slate-400">Click Star to Inspect</span>
      </div>
    </div>
  );
};
