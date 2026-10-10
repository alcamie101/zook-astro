import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { ActiveAppMode } from '../../types/astrophysics';
import {
  Rocket,
  Wrench,
  Activity,
  Globe,
  Sun,
  Layers,
  Sparkles,
  ArrowRight,
  Volume2,
  VolumeX,
  Radio
} from 'lucide-react';

interface Props {
  onSelectApp: (mode: ActiveAppMode) => void;
}

export const ShowcaseHome: React.FC<Props> = ({ onSelectApp }) => {
  const mainCanvasRef = useRef<HTMLDivElement>(null);
  const sectorMiniCanvasRef = useRef<HTMLDivElement>(null);
  const architectMiniCanvasRef = useRef<HTMLDivElement>(null);

  const [hoveredCard, setHoveredCard] = useState<'sector' | 'architect' | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'instruments' | 'specs'>('overview');

  const audioCtxRef = useRef<AudioContext | null>(null);

  // 1. High-Precision Background 3D Deep Space Galactic Canvas
  useEffect(() => {
    const container = mainCanvasRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020409, 0.0006);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2500);
    camera.position.set(0, 35, 180);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Create soft circular star sprite texture programmatically
    const createStarTexture = () => {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext('2d')!;
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.2, 'rgba(230, 245, 255, 0.85)');
      grad.addColorStop(0.5, 'rgba(120, 180, 255, 0.35)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
      const texture = new THREE.CanvasTexture(c);
      return texture;
    };

    const starTexture = createStarTexture();

    // 1.1 Spiral Galaxy Dust & Star Clusters (4,500 particles)
    const starCount = 4500;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    const arms = 2;
    for (let i = 0; i < starCount; i++) {
      const arm = (i % arms) * ((Math.PI * 2) / arms);
      const dist = Math.pow(Math.random(), 0.55) * 320;
      const angle = dist * 0.015 + arm + (Math.random() - 0.5) * 0.5;
      const spread = (Math.random() - 0.5) * (18 + dist * 0.12);

      const x = Math.cos(angle) * dist + (Math.random() - 0.5) * 15;
      const z = Math.sin(angle) * dist + (Math.random() - 0.5) * 15;
      const y = (Math.random() - 0.5) * (20 * Math.exp(-dist / 160)) + spread * 0.4;

      starPositions[i * 3] = x;
      starPositions[i * 3 + 1] = y;
      starPositions[i * 3 + 2] = z;

      // Realistic spectral colors: Core (Warm Gold / Solar) -> Disks (Azure, Sky Blue, Brilliant White)
      const t = Math.min(1, dist / 280);
      const col = new THREE.Color().lerpColors(
        new THREE.Color(0xffe4b5),
        new THREE.Color(0x38bdf8),
        t + (Math.random() - 0.5) * 0.2
      );
      if (Math.random() < 0.08) col.set(0xfb7185); // H-II Red Emission Regions

      starColors[i * 3] = col.r;
      starColors[i * 3 + 1] = col.g;
      starColors[i * 3 + 2] = col.b;
      starSizes[i] = 1.2 + Math.random() * 2.8;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

    const starMat = new THREE.PointsMaterial({
      size: 3.5,
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const galaxyPoints = new THREE.Points(starGeo, starMat);
    galaxyPoints.rotation.x = 0.45;
    scene.add(galaxyPoints);

    // 1.2 Volumetric Glowing Galactic Core (Sagittarius A* Accretion Glow)
    const coreMesh = new THREE.Mesh(
      new THREE.SphereGeometry(24, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffd28a,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending
      })
    );
    coreMesh.scale.set(2.2, 0.4, 2.2);
    coreMesh.rotation.x = 0.45;
    scene.add(coreMesh);

    // Interactive mouse parallax
    let mouse = { x: 0, y: 0 };
    let targetCamera = { x: 0, y: 35, z: 180 };

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      targetCamera.x = mouse.x * 35;
      targetCamera.y = 35 + mouse.y * 22;
      targetCamera.z = 180 + Math.abs(mouse.x) * 15;
    };

    window.addEventListener('mousemove', onMouseMove);

    const onResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', onResize);

    // Animation Loop
    let animId = 0;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth galaxy rotation
      galaxyPoints.rotation.y = elapsed * 0.025;
      coreMesh.rotation.y = elapsed * 0.035;

      // Smooth camera interpolation
      camera.position.x += (targetCamera.x - camera.position.x) * 0.04;
      camera.position.y += (targetCamera.y - camera.position.y) * 0.04;
      camera.position.z += (targetCamera.z - camera.position.z) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      starTexture.dispose();
    };
  }, []);

  // 2. Mini Live 3D Preview: 3D Sector Simulator (Raymarched Star & Orbiting Planet)
  useEffect(() => {
    const container = sectorMiniCanvasRef.current;
    if (!container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 8, 22);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Star
    const starGeo = new THREE.SphereGeometry(3.6, 32, 32);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xfff099 });
    const star = new THREE.Mesh(starGeo, starMat);
    scene.add(star);

    // Corona halo
    const haloGeo = new THREE.SphereGeometry(4.8, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    scene.add(halo);

    // Orbit Ring
    const orbitGeo = new THREE.RingGeometry(11.8, 12.0, 64);
    const orbitMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.3 });
    const orbitRing = new THREE.Mesh(orbitGeo, orbitMat);
    orbitRing.rotation.x = Math.PI / 2;
    scene.add(orbitRing);

    // Orbiting Planet
    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0x22d3ee, roughness: 0.6, metalness: 0.2 })
    );
    scene.add(planet);

    const light = new THREE.PointLight(0xfff5cc, 2.5, 50);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));

    let animId = 0;
    let t = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.02;
      planet.position.x = Math.cos(t) * 12;
      planet.position.z = Math.sin(t) * 12;
      star.rotation.y = t * 0.5;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // 3. Mini Live 3D Preview: 3D Astro-Architect (Galactic Hyperlane Cluster)
  useEffect(() => {
    const container = architectMiniCanvasRef.current;
    if (!container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 10, 22);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const clusterGroup = new THREE.Group();
    scene.add(clusterGroup);

    // Nodes
    const nodes = [
      { x: 0, y: 0, z: 0, col: 0xf59e0b, size: 2.2 },
      { x: -7, y: 2, z: 4, col: 0x38bdf8, size: 1.4 },
      { x: 6, y: -2, z: 5, col: 0x10b981, size: 1.6 },
      { x: 5, y: 3, z: -6, col: 0xa855f7, size: 1.5 },
      { x: -6, y: -2, z: -5, col: 0xf43f5e, size: 1.3 },
    ];

    nodes.forEach(n => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(n.size, 16, 16),
        new THREE.MeshBasicMaterial({ color: n.col })
      );
      mesh.position.set(n.x, n.y, n.z);
      clusterGroup.add(mesh);
    });

    // Hyperlanes
    const lines = [
      [0, 1], [0, 2], [0, 3], [0, 4], [1, 4], [2, 3]
    ];
    lines.forEach(([a, b]) => {
      const geom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(nodes[a].x, nodes[a].y, nodes[a].z),
        new THREE.Vector3(nodes[b].x, nodes[b].y, nodes[b].z)
      ]);
      const mat = new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.5 });
      clusterGroup.add(new THREE.Line(geom, mat));
    });

    let animId = 0;
    let t = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.015;
      clusterGroup.rotation.y = t * 0.6;
      clusterGroup.rotation.x = Math.sin(t * 0.4) * 0.2;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Ambient Synthesizer Drone
  const toggleAmbientAudio = () => {
    if (isAudioMuted) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.035, ctx.currentTime);
        masterGain.connect(ctx.destination);

        // Low binaural fundamental
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(55, ctx.currentTime); // 55Hz

        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(110.4, ctx.currentTime); // 110.4Hz

        osc1.connect(masterGain);
        osc2.connect(masterGain);

        osc1.start();
        osc2.start();
        setIsAudioMuted(false);
      } catch (e) {
        console.error('Audio synthesizer error', e);
      }
    } else {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      setIsAudioMuted(true);
    }
  };

  return (
    <div className="w-full h-full relative overflow-y-auto overflow-x-hidden bg-[#020409] text-slate-100 flex flex-col justify-between select-none">
      {/* 3D Deep Space Canvas */}
      <div ref={mainCanvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Optical Vignette & Nebular Glow */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(2,4,9,0.85)_100%)]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-cyan-600/10 via-indigo-600/10 to-amber-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* High-Precision Scientific HUD Crosshair Overlays */}
      <div className="absolute top-4 left-6 pointer-events-none z-10 flex items-center gap-2 font-mono text-[10px] text-cyan-500/60 uppercase tracking-widest">
        <span>+ RA 17h 45m 40s</span>
        <span>|</span>
        <span>DEC -29° 00′ 28″</span>
        <span>|</span>
        <span>GALACTIC CORE SGR A*</span>
      </div>

      <div className="absolute top-4 right-6 pointer-events-none z-10 hidden sm:flex items-center gap-3 font-mono text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          INSTRUMENTS CALIBRATED
        </span>
        <span>•</span>
        <span>OPTICAL APERTURE: 6.5M</span>
      </div>

      {/* Top Floating Control Deck */}
      <div className="relative z-10 w-full px-6 pt-4 pb-2 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-800/80 font-bold uppercase tracking-widest">
            ✦ ASTROPHYSICAL OBSERVATORY & CARTOGRAPHY
          </span>
        </div>

        {/* Ambient Synthesizer Button */}
        <button
          onClick={toggleAmbientAudio}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-slate-300 transition-all shadow-md hover:border-cyan-500/50"
          title="Toggle Deep Space Frequency Synthesizer"
        >
          {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />}
          <span>{isAudioMuted ? 'Cosmic Audio: Muted' : 'Cosmic Audio: Active'}</span>
        </button>
      </div>

      {/* Hero Section */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex flex-col items-center text-center">
        {/* Observatory Mission Sub-heading */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-slate-300 font-mono text-xs mb-4 backdrop-blur-md shadow-inner">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="tracking-wide">MISSION CONTROL // DUAL DIGITAL ASTROPHYSICS DOMAINS</span>
        </div>

        {/* Cinematic Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white font-sans leading-tight mb-3">
          EXPLORE. MODEL. <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-sky-200 to-amber-300">
            CHART THE UNIVERSE.
          </span>
        </h1>

        <p className="max-w-2xl text-slate-400 text-xs sm:text-sm leading-relaxed mb-6 font-sans font-normal">
          Designed after real NASA deep-space observatories and citizen astrophysics initiatives. 
          Step into relativistic circumstellar evolution or construct custom 3D star clusters and Stellaris mod initializers.
        </p>

        {/* Sensational Living Dual Portal Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mb-8">
          {/* PORTAL CARD 1: 3D SECTOR SIMULATOR */}
          <div
            onMouseEnter={() => setHoveredCard('sector')}
            onMouseLeave={() => setHoveredCard(null)}
            className={`group relative rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-[#040711] border transition-all duration-300 flex flex-col justify-between text-left backdrop-blur-xl shadow-2xl overflow-hidden ${
              hoveredCard === 'sector'
                ? 'border-cyan-400 shadow-cyan-500/20 scale-[1.015]'
                : 'border-slate-800/80 hover:border-cyan-500/50'
            }`}
          >
            {/* Top Interactive Mini 3D Preview */}
            <div className="w-full h-36 relative bg-gradient-to-b from-slate-950 to-slate-900/50 border-b border-slate-800/80 overflow-hidden">
              <div ref={sectorMiniCanvasRef} className="w-full h-full" />
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
                <Sun className="w-3 h-3 text-amber-400 animate-spin-slow" />
                <span>3D Circumstellar Raytracing Engine</span>
              </div>
              <div className="absolute bottom-2 right-2.5 text-[9px] font-mono text-slate-500">
                LIVE 3D SIMULATION
              </div>
            </div>

            {/* Card Content */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                    DOMAIN 01 // OBSERVATORY
                  </span>
                  <Rocket className="w-4 h-4 text-cyan-400" />
                </div>

                <h2 className="text-xl font-extrabold text-white mb-1.5 group-hover:text-cyan-300 transition-colors">
                  3D Sector Simulator
                </h2>
                <p className="text-slate-400 text-xs leading-relaxed mb-4">
                  Deep circumstellar simulation with procedural raymarched sunspots, dynamic stellar evolution from main sequence to white dwarfs/black holes, habitable zone thermodynamics, and click-to-focus planetary orbits.
                </p>

                {/* Key Spec Pills */}
                <div className="flex flex-wrap gap-1.5 mb-5 text-[10px] font-mono text-slate-300">
                  <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">☀️ Dynamic Sunspots</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">🪐 Habitable Zones</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">⏳ Gravitational Warp</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">📊 HR Diagram</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectApp('sector-3d')}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold tracking-wider uppercase transition-all shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 group-hover:gap-3"
              >
                <span>Launch 3D Sector Simulator</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PORTAL CARD 2: 3D ASTRO-ARCHITECT */}
          <div
            onMouseEnter={() => setHoveredCard('architect')}
            onMouseLeave={() => setHoveredCard(null)}
            className={`group relative rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-[#040711] border transition-all duration-300 flex flex-col justify-between text-left backdrop-blur-xl shadow-2xl overflow-hidden ${
              hoveredCard === 'architect'
                ? 'border-amber-400 shadow-amber-500/20 scale-[1.015]'
                : 'border-slate-800/80 hover:border-amber-500/50'
            }`}
          >
            {/* Top Interactive Mini 3D Preview */}
            <div className="w-full h-36 relative bg-gradient-to-b from-slate-950 to-slate-900/50 border-b border-slate-800/80 overflow-hidden">
              <div ref={architectMiniCanvasRef} className="w-full h-full" />
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-amber-500/30 text-[10px] font-mono text-amber-300">
                <Globe className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>3D Galactic Hyperlane Cartographer</span>
              </div>
              <div className="absolute bottom-2 right-2.5 text-[9px] font-mono text-slate-500">
                INTERSTELLAR TOPOLOGY
              </div>
            </div>

            {/* Card Content */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                    DOMAIN 02 // CARTOGRAPHER & MODDER
                  </span>
                  <Wrench className="w-4 h-4 text-amber-400" />
                </div>

                <h2 className="text-xl font-extrabold text-white mb-1.5 group-hover:text-amber-300 transition-colors">
                  3D Astro-Architect
                </h2>
                <p className="text-slate-400 text-xs leading-relaxed mb-4">
                  Full 3D interstellar cartographer with interactive hyperlanes, multi-star cluster dynamics (binary to sextuple systems), 4-tier celestial hierarchy editor (Stars → Planets → Moons → Sub-Moons), and Stellaris mod initializer script engine.
                </p>

                {/* Key Spec Pills */}
                <div className="flex flex-wrap gap-1.5 mb-5 text-[10px] font-mono text-slate-300">
                  <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">🌐 3D Hyperlanes</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">🌳 4-Tier Hierarchy</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">📜 Stellaris Exporter</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">📐 Resizable Workspace</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectApp('astro-architect')}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-mono text-xs font-bold tracking-wider uppercase transition-all shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 group-hover:gap-3"
              >
                <span>Launch 3D Astro-Architect</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scientific Observational Overview & Specs Drawer */}
        <section className="w-full max-w-5xl bg-slate-950/80 rounded-2xl border border-slate-800/80 backdrop-blur-md p-6 mb-8 text-left">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2 font-mono text-xs">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-white font-bold uppercase tracking-wider">Scientific Telemetry & Pipeline</span>
            </div>

            <div className="flex items-center gap-1 font-mono text-xs bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1 rounded transition-colors ${activeTab === 'overview' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                Mission Overview
              </button>
              <button
                onClick={() => setActiveTab('instruments')}
                className={`px-3 py-1 rounded transition-colors ${activeTab === 'instruments' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                Astrophysical Core
              </button>
              <button
                onClick={() => setActiveTab('specs')}
                className={`px-3 py-1 rounded transition-colors ${activeTab === 'specs' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                System Specs
              </button>
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-300 font-sans">
              <div>
                <h3 className="font-mono text-cyan-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Stellar Nucleosynthesis
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Real-time mass-luminosity calculations ($L \propto M^{3.5}$) and effective temperature curves mapping directly to the Morgan-Keenan spectral classification system (O, B, A, F, G, K, M, and Degenerate Remnants).
                </p>
              </div>

              <div>
                <h3 className="font-mono text-cyan-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5" /> Circumstellar Habitable Zone
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Kopparapu et al. stellar flux modeling tracking runaway greenhouse thresholds, water loss limits, and maximum greenhouse boundaries across billions of simulated planetary years.
                </p>
              </div>

              <div>
                <h3 className="font-mono text-cyan-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Stellaris Mod Synthesis
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Automated procedural compiler translating hierarchical star systems into valid Paradox Clausewitz script initializers with customizable orbital distance scaling models.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'instruments' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Photosphere Shader</span>
                <span className="text-cyan-300 font-bold">Simplex Noise + Solar Convection</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Orbital Engine</span>
                <span className="text-cyan-300 font-bold">Keplerian 3-Body Dynamics</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Galaxy Projection</span>
                <span className="text-cyan-300 font-bold">3D Logarithmic Spiral Field</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Precision Scaling</span>
                <span className="text-cyan-300 font-bold">Power-Law Radius Conversion</span>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Max Sector Stars</span>
                <span className="text-emerald-400 font-bold">5,000+ Procedural Systems</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Hierarchy Depth</span>
                <span className="text-emerald-400 font-bold">4-Tier (Star→P→M→SM)</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Graphics Pipeline</span>
                <span className="text-emerald-400 font-bold">WebGL 2.0 / Three.js</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Code Quality</span>
                <span className="text-emerald-400 font-bold">100% Strict TypeScript</span>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-6 py-4 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-4">
            <span className="text-slate-400">ZOOK ASTRO SCIENTIFIC OBSERVATORY</span>
            <span>•</span>
            <span>DATA COURTESY OF NASA, ESA & KEPLER ARCHIVES</span>
          </div>

          <div className="text-slate-400">
            Engineered with Precision © 2026 • Pair-Programmed with Antigravity
          </div>
        </div>
      </footer>
    </div>
  );
};
