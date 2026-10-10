import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { ActiveAppMode } from '../../types/astrophysics';

interface Props {
  onSelectApp: (mode: ActiveAppMode) => void;
}

export const ShowcaseHome: React.FC<Props> = ({ onSelectApp }) => {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const [hoveredCard, setHoveredCard] = useState<'sector' | 'architect' | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioNodesRef = useRef<{ osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null>(null);

  // Background Three.js Starfield / Nebula
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02040a, 0.0008);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    camera.position.set(0, 0, 160);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Deep star particles
    const particleCount = 2800;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 600;
      const y = (Math.random() - 0.5) * 400;
      const z = (Math.random() - 0.5) * 500;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Color tints: Cyan, Deep Gold, Violet, Pure White
      const roll = Math.random();
      let color = new THREE.Color(0xffffff);
      if (roll < 0.35) color = new THREE.Color(0x38bdf8); // Cyan
      else if (roll < 0.65) color = new THREE.Color(0xfbbf24); // Gold
      else if (roll < 0.85) color = new THREE.Color(0xa855f7); // Purple

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const starField = new THREE.Points(geo, mat);
    scene.add(starField);

    // Subtle luminous central nebula glow
    const coreGeo = new THREE.SphereGeometry(30, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x1e3a8a,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.scale.set(3, 1.5, 2);
    scene.add(coreMesh);

    // Mouse parallax
    let mouse = { x: 0, y: 0 };
    let targetCameraPos = { x: 0, y: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      targetCameraPos.x = mouse.x * 25;
      targetCameraPos.y = mouse.y * 15;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId = 0;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      starField.rotation.y = elapsedTime * 0.02;
      starField.rotation.x = elapsedTime * 0.005;

      camera.position.x += (targetCameraPos.x - camera.position.x) * 0.04;
      camera.position.y += (targetCameraPos.y - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Ambient Synthesizer Drone
  const toggleAmbientAudio = () => {
    if (isAudioMuted) {
      // Start audio
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.connect(ctx.destination);

        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(55, ctx.currentTime); // Low A

        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(110.5, ctx.currentTime); // Harmonic with slow binaural beat

        osc1.connect(gain);
        osc2.connect(gain);

        osc1.start();
        osc2.start();

        audioNodesRef.current = { osc1, osc2, gain };
        setIsAudioMuted(false);
      } catch (e) {
        console.error('Audio initialization failed', e);
      }
    } else {
      // Stop audio
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      setIsAudioMuted(true);
    }
  };

  return (
    <div className="w-full h-full relative overflow-y-auto overflow-x-hidden bg-[#02040a] text-slate-100 flex flex-col justify-between select-none">
      {/* Three.js Background Canvas */}
      <div ref={canvasMountRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Atmospheric Radial Gradients */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Floating Telemetry Strip */}
      <div className="relative z-10 w-full px-6 py-2.5 flex items-center justify-between border-b border-white/5 bg-slate-950/30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
            ✦ HIGH-PRECISION DEEP SPACE OBSERVATORY & GALAXY ARCHITECT
          </span>
        </div>

        {/* Status Indicators & Audio Control */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-0.5 rounded-full bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>WebGL 2.0 Ready</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400">60 FPS</span>
          </div>

          <button
            onClick={toggleAmbientAudio}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-[10px] font-mono text-slate-300 transition-all hover:text-white"
            title="Toggle Ambient Space Synthesizer"
          >
            <span>{isAudioMuted ? '🔇' : '🔊'}</span>
            <span>{isAudioMuted ? 'Ambient Drone Off' : 'Ambient Drone On'}</span>
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-10 pb-6 flex flex-col items-center text-center">
        {/* Futuristic Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-300 font-mono text-xs mb-6 backdrop-blur-sm shadow-inner">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>DEEP SPACE SCIENTIFIC SUITE v2.5</span>
        </div>

        {/* World-Class Hero Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 font-sans leading-none mb-6">
          THE COSMOS <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300">
            RE-IMAGINED.
          </span>
        </h1>

        <p className="max-w-2xl text-slate-400 text-sm sm:text-base leading-relaxed mb-10 font-sans">
          Two frontiers of digital astrophysics in one unified platform. Simulate relativistic star life cycles with procedural raymarched corona shaders, or forge intricate multi-tier celestial systems with full 3D galactic cartography.
        </p>

        {/* Dual Sensational Portal Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
          {/* CARD 1: 3D SECTOR SIMULATOR */}
          <div
            onMouseEnter={() => setHoveredCard('sector')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => onSelectApp('sector-3d')}
            className={`group relative rounded-2xl p-8 bg-gradient-to-b from-slate-900/90 to-slate-950/95 border transition-all duration-300 cursor-pointer flex flex-col justify-between text-left backdrop-blur-xl shadow-2xl overflow-hidden ${
              hoveredCard === 'sector'
                ? 'border-cyan-400/80 shadow-cyan-500/20 scale-[1.02]'
                : 'border-white/10 hover:border-cyan-500/50'
            }`}
          >
            {/* Ambient Card Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-500" />

            <div>
              {/* Badge & Icon */}
              <div className="flex items-center justify-between mb-6">
                <span className="px-3 py-1 rounded-md text-[10px] font-mono tracking-widest uppercase bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                  OBSERVATORY // SECTOR SIM
                </span>
                <span className="text-3xl filter drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]">🔭</span>
              </div>

              {/* Title & Tagline */}
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                3D Sector Simulator
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                Real-time circumstellar astrophysics, dynamic raymarched solar shaders with sunspots, habitable zone boundaries, and Hertzsprung-Russell evolution tracking.
              </p>

              {/* Features List */}
              <ul className="space-y-2.5 text-xs text-slate-300 mb-8 font-mono">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span>Animated Raymarched Sun with Procedural Sunspots</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span>Click-to-Focus Planet Camera & Surface Telemetry</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span>Relativistic Time-Warp & Smooth Speed Scrubbing</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span>Sector Morphologies: Disks, Cores, Clusters & Halos</span>
                </li>
              </ul>
            </div>

            {/* Launch CTA Button */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase font-semibold">
                Launch Simulator
              </span>
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 group-hover:bg-cyan-500 text-cyan-300 group-hover:text-black flex items-center justify-center transition-all duration-300 shadow-lg shadow-cyan-500/20 font-bold text-sm">
                →
              </div>
            </div>
          </div>

          {/* CARD 2: 3D ASTRO-ARCHITECT */}
          <div
            onMouseEnter={() => setHoveredCard('architect')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => onSelectApp('astro-architect')}
            className={`group relative rounded-2xl p-8 bg-gradient-to-b from-slate-900/90 to-slate-950/95 border transition-all duration-300 cursor-pointer flex flex-col justify-between text-left backdrop-blur-xl shadow-2xl overflow-hidden ${
              hoveredCard === 'architect'
                ? 'border-amber-400/80 shadow-amber-500/20 scale-[1.02]'
                : 'border-white/10 hover:border-amber-500/50'
            }`}
          >
            {/* Ambient Card Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all duration-500" />

            <div>
              {/* Badge & Icon */}
              <div className="flex items-center justify-between mb-6">
                <span className="px-3 py-1 rounded-md text-[10px] font-mono tracking-widest uppercase bg-amber-950/80 text-amber-300 border border-amber-800/80">
                  CARTOGRAPHER // ASTRO-ARCHITECT
                </span>
                <span className="text-3xl filter drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]">🛠️</span>
              </div>

              {/* Title & Tagline */}
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                3D Astro-Architect
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                Full 3D galactic hyperlane networks, multi-star cluster dynamics (binary to sextuple stars), 4-tier celestial hierarchy editor, and Stellaris mod initializer script engine.
              </p>

              {/* Features List */}
              <ul className="space-y-2.5 text-xs text-slate-300 mb-8 font-mono">
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span>3D Galactic Hyperlane Cartographer & System Routing</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span>4-Tier Hierarchy: Stars → Planets → Moons → Sub-Moons</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span>Real-Time Stellaris Mod Code Generator & Clipboard Export</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span>Full 3D Orrery Projection with Resizable Modular Panels</span>
                </li>
              </ul>
            </div>

            {/* Launch CTA Button */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs font-mono text-amber-400 tracking-wider uppercase font-semibold">
                Launch Architect
              </span>
              <div className="w-10 h-10 rounded-full bg-amber-500/20 group-hover:bg-amber-500 text-amber-300 group-hover:text-black flex items-center justify-center transition-all duration-300 shadow-lg shadow-amber-500/20 font-bold text-sm">
                →
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Telemetry Specs Strip */}
      <footer className="relative z-10 w-full px-6 py-4 border-t border-white/5 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-6">
            <span>CORE: <span className="text-slate-300">REACT 18 + THREE.JS</span></span>
            <span>SHADERS: <span className="text-slate-300">GLSL RAYMARCHING</span></span>
            <span>EXPORT: <span className="text-slate-300">STELLARIS INITIALIZER</span></span>
          </div>

          <div className="text-slate-400">
            Zook Astro Scientific Suite © 2026 • Pair-Programmed with Antigravity
          </div>
        </div>
      </footer>
    </div>
  );
};
