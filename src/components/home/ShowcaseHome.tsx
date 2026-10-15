import React, { useRef, useEffect, useState } from 'react';
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
import { MilkyWayCanvasR3F } from '../canvas/r3f/MilkyWayGalaxyR3F';
import { SectorMiniPreviewR3F } from '../canvas/r3f/SectorMiniPreviewR3F';
import { ArchitectMiniPreviewR3F } from '../canvas/r3f/ArchitectMiniPreviewR3F';

interface Props {
  onSelectApp: (mode: ActiveAppMode) => void;
}

export const ShowcaseHome: React.FC<Props> = ({ onSelectApp }) => {

  const [hoveredCard, setHoveredCard] = useState<'sector' | 'architect' | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'instruments' | 'specs'>('overview');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioIntervalRef = useRef<any>(null);
  const audioNodesRef = useRef<any>(null);

  // Cleanup ambient soundscape on component unmount
  useEffect(() => {
    return () => {
      if (audioIntervalRef.current) {
        clearTimeout(audioIntervalRef.current);
      }
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
    };
  }, []);

  // Celestial Generative Ambient Soundscape Engine (Web Audio API)
  const toggleAmbientAudio = () => {
    if (isAudioMuted) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        // 1. Master Compression & Soft Limiter
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-24, ctx.currentTime);
        compressor.knee.setValueAtTime(30, ctx.currentTime);
        compressor.ratio.setValueAtTime(12, ctx.currentTime);
        compressor.attack.setValueAtTime(0.003, ctx.currentTime);
        compressor.release.setValueAtTime(0.25, ctx.currentTime);
        compressor.connect(ctx.destination);

        // 2. Master Gain with Smooth Cinematic Fade-In
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
        masterGain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 2.0);
        masterGain.connect(compressor);

        // 3. Deep Space Spatial Delay / Reverb Network
        const delay = ctx.createDelay(2.0);
        delay.delayTime.setValueAtTime(0.52, ctx.currentTime);

        const delayFeedback = ctx.createGain();
        delayFeedback.gain.setValueAtTime(0.44, ctx.currentTime);

        const delayFilter = ctx.createBiquadFilter();
        delayFilter.type = 'lowpass';
        delayFilter.frequency.setValueAtTime(1200, ctx.currentTime);

        delay.connect(delayFilter);
        delayFilter.connect(delayFeedback);
        delayFeedback.connect(delay);
        delayFilter.connect(masterGain);

        // 4. Warm Celestial Drone Pad (D Minor / D Lydian Shimmer)
        const padFilter = ctx.createBiquadFilter();
        padFilter.type = 'lowpass';
        padFilter.frequency.setValueAtTime(260, ctx.currentTime);
        padFilter.Q.setValueAtTime(2.0, ctx.currentTime);
        padFilter.connect(masterGain);
        padFilter.connect(delay);

        // LFO: Slow cosmic breathing filter modulation (~12s cycle)
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.08, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(160, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(padFilter.frequency);
        lfo.start();

        // 4-voice polyphonic interstellar chord: D2 (73.4Hz), A2 (110Hz), E3 (164.8Hz), A3 (220Hz)
        const chordPitches = [73.42, 110.00, 164.81, 220.00];
        chordPitches.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          osc.type = idx === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          osc.detune.setValueAtTime((Math.random() - 0.5) * 8, ctx.currentTime);

          const voiceGain = ctx.createGain();
          voiceGain.gain.setValueAtTime(idx === 0 ? 0.32 : 0.16, ctx.currentTime);

          osc.connect(voiceGain);
          voiceGain.connect(padFilter);
          osc.start();
        });

        // 5. Interstellar Cosmic Wind (Pink-filtered noise shimmer)
        const bufLen = ctx.sampleRate * 2;
        const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const noiseOut = noiseBuf.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufLen; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          noiseOut[i] = (b0 + b1 + b2 + white * 0.05) * 0.08;
        }
        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = noiseBuf;
        noiseSrc.loop = true;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(750, ctx.currentTime);
        noiseFilter.Q.setValueAtTime(1.6, ctx.currentTime);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.012, ctx.currentTime);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);
        noiseSrc.start();

        // 6. Generative Pulsar / Starlight Crystal Chimes
        const playStarlightChime = () => {
          if (!ctx || ctx.state === 'closed') return;
          const now = ctx.currentTime;
          // Celestial D Lydian pentatonic scale
          const chimeFreqs = [293.66, 369.99, 440.00, 554.37, 587.33, 659.25, 880.00, 987.77, 1108.73];
          const freq = chimeFreqs[Math.floor(Math.random() * chimeFreqs.length)];

          const chimeOsc = ctx.createOscillator();
          chimeOsc.type = 'sine';
          chimeOsc.frequency.setValueAtTime(freq, now);

          const chimeGain = ctx.createGain();
          chimeGain.gain.setValueAtTime(0.0001, now);
          chimeGain.gain.linearRampToValueAtTime(0.028, now + 0.06);
          chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);

          chimeOsc.connect(chimeGain);
          chimeGain.connect(masterGain);
          chimeGain.connect(delay); // Drenched in deep space echo

          chimeOsc.start(now);
          chimeOsc.stop(now + 4.5);
        };

        // Schedule periodic celestial chimes every 2.6 - 4.8 seconds
        const triggerChimeLoop = () => {
          playStarlightChime();
          const nextInterval = 2600 + Math.random() * 2200;
          audioIntervalRef.current = setTimeout(triggerChimeLoop, nextInterval);
        };
        // Initial chime after 1.5s
        audioIntervalRef.current = setTimeout(triggerChimeLoop, 1500);

        audioNodesRef.current = { ctx, masterGain };
        setIsAudioMuted(false);
      } catch (e) {
        console.error('Audio soundscape error', e);
      }
    } else {
      if (audioIntervalRef.current) {
        clearTimeout(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
      if (audioNodesRef.current) {
        const { ctx, masterGain } = audioNodesRef.current;
        if (ctx && ctx.state !== 'closed' && masterGain) {
          const now = ctx.currentTime;
          masterGain.gain.setValueAtTime(masterGain.gain.value, now);
          masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
          setTimeout(() => {
            try {
              ctx.close();
            } catch {}
          }, 1300);
        }
      }
      setIsAudioMuted(true);
    }
  };

  return (
    <div className="w-full h-full relative overflow-y-auto overflow-x-hidden bg-[#020409] text-slate-100 flex flex-col justify-between select-none">
      {/* 3D Deep Space Canvas */}
      <MilkyWayCanvasR3F className="absolute inset-0 pointer-events-none z-0" />

      {/* Optical Vignette */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(2,4,9,0.85)_100%)]" />

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
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-slate-300 transition-all shadow-md hover:border-cyan-500/50"
          title="Toggle Deep Space Ambient Soundscape"
        >
          {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />}
          <span>{isAudioMuted ? 'Cosmic Soundscape: Muted' : 'Cosmic Ambient: Live'}</span>
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
              <SectorMiniPreviewR3F className="w-full h-full" />
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
              <ArchitectMiniPreviewR3F className="w-full h-full" />
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
