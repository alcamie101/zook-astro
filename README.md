# Galactic Sector Star System Evolution Simulator (3D)

A modern, modular, production-ready TypeScript + React + Three.js web application that simulates and visualizes the formation, astrophysics, and orbital evolution of an entire galactic sector and its circumstellar planetary systems.

---

## 🚀 Quick Start

Ensure you have [Node.js](https://nodejs.org/) (v18+) installed.

```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Start the interactive development server
npm run dev

# 3. Build for production
npm run build

# 4. Preview the production build
npm run preview
```

The application will launch locally at `http://localhost:3000`.

---

## 🏗️ Architecture & Project Structure

The project has been refactored from a monolithic HTML file into a clean, decoupled, strongly-typed architecture:

```
.
├── index.html                     # Application HTML template
├── package.json                   # Dependencies, scripts, and project metadata
├── tsconfig.json                  # TypeScript compiler options
├── vite.config.ts                 # Vite bundler & Tailwind configuration
├── src/
│   ├── main.tsx                   # React root mount
│   ├── App.tsx                    # Master layout, state orchestrator & event bus
│   ├── index.css                  # Tailwind styles & Glassmorphism HUD design
│   │
│   ├── types/
│   │   └── astrophysics.ts        # Strict TypeScript interfaces (Stars, Planets, Evolution)
│   │
│   ├── core/
│   │   ├── astrophysics/
│   │   │   ├── constants.ts       # Physical constants (Solar, Earth, SI, Kopparapu HZ flux)
│   │   │   ├── classifier.ts      # Pure Morgan-Keenan spectral & Yerkes luminosity classifier
│   │   │   ├── evolution.ts       # Empirical ZAMS grid, Hermite smoothstep, evolutionary tracks
│   │   │   └── colors.ts          # Blackbody effective temperature color & glow mapping
│   │   │
│   │   └── generation/
│   │       ├── prng.ts            # Seeded Lehmer PRNG & Box-Muller Gaussian normal sampler
│   │       ├── imf.ts             # Initial Mass Function piecewise inverse CDF sampler
│   │       ├── morphology.ts      # 3D spatial coordinate distributions (Disk, Core, Cluster, Halo)
│   │       ├── planets.ts         # Multi-planet synthesis & real-time geophysical telemetry
│   │       └── sector.ts          # Master sector generation orchestrator
│   │
│   └── components/
│       ├── ui/
│       │   ├── Header.tsx           # Command bar with live population filter chips & counts
│       │   ├── SectorControls.tsx   # Sidebar controls (sliders for age, mass, radius, metallicity)
│       │   ├── StellarInspector.tsx # Telemetry grid, timeline scrubber, and sub-viewport host
│       │   └── PlanetDossier.tsx    # Exoplanet dossier card & clickable fleet list
│       │
│       └── canvas/
│           ├── SectorView3D.tsx         # Three.js 3D galactic starfield with raycasting & orbit controls
│           ├── CircumstellarView3D.tsx  # Three.js 3D planetary system view with HZ torus & animated orbits
│           └── HRDiagramCanvas.tsx      # Hertzsprung-Russell diagram with instability strip & loci
```

---

## 🔭 Key Features & Enhancements

1. **3D Interactive Three.js Sector Viewport (`SectorView3D.tsx`)**:
   - Orbit controls: Left-click drag to rotate in 3D, right-click drag to pan, wheel to zoom.
   - Concentric metric range rings in light-years.
   - Raycasting selection: Click any 3D star in space to open its circumstellar system.
   - Real-time hover tooltips displaying spectral type, mass, and planet count.
   - Live filter highlighting: O/B, G Sol, K/M, Remnants, and Habitable Zone life candidates.

2. **3D Circumstellar Planetary Viewport (`CircumstellarView3D.tsx`)**:
   - Three.js 3D simulation of host star photosphere with dynamic Stefan-Boltzmann radius $R_*$.
   - Instability Strip pulsation animation.
   - Translucent emerald green 3D Habitable Zone ring ($r_{\text{in}}$ to $r_{\text{out}}$).
   - Dynamic Keplerian orbits that expand adiabatically as the host star sheds mass.
   - 3D planetary spheres shaded with archetype-specific materials.
   - Click canvas to cycle through inspected planets.

3. **Pure Morgan-Keenan Classifier (`classifier.ts`)**:
   - Strict derivation: $\text{Age/Phase} \to (L, T_{\text{eff}}, M(t)) \to \text{Stefan-Boltzmann } R_* \to \text{Pure MK Class}$.
   - Classifies spectral letter (O, B, A, F, G, K, M) and luminosity classes (Ia, Ib, II, III, IV, IV-V, V, VII).

4. **Hertzsprung-Russell Diagram (`HRDiagramCanvas.tsx`)**:
   - Inverted logarithmic temperature axis ($\log_{10} T_{\text{eff}}$ from 50,000 K to 2,000 K).
   - Logarithmic luminosity axis ($\log_{10} L$ from -4.5 to +6.2).
   - Highlights the Cepheid Instability Strip and traces the full evolutionary trajectory curve with current position marker.

5. **Dynamic Drag-to-Resize Split-Pane System**:
   - **Horizontal 3-Column Splitters**: Hover over the vertical divider lines between columns (`SEC-02`, `SEC-03`, `SEC-04`) to see the glowing cyan handle. Click and drag left or right to dynamically resize any column. All Three.js canvases re-render and re-aspect in real time via `ResizeObserver`.
   - **Dual-Pane Canvas Splitter**: Drag the vertical divider between the HR Diagram (`SEC-06`) and the Circumstellar 3D Viewport (`SEC-07`) to allocate more width to either visualizer.
   - **Vertical Canvas Height Handle**: Drag the horizontal pill bar beneath the canvases up or down to expand the canvas height from 90px to over 400px!
   - **Double-Click Reset**: Double-click any divider to instantly reset panels to default balanced proportions.
   - **Layout Persistence**: Custom width and height settings are automatically saved to `localStorage`.

6. **Procedural Planetary Textures & Habitable Zone Biomes (`planetTextures.ts`)**:
   - Replaced flat colors with dynamic, multi-octave 3D cylindrical noise maps with **100% seamless longitudinal wrapping**.
   - **Inward of HZ (Scorched / Lava Worlds)**: Dark volcanic basalt crust with glowing orange magma fissures and lava seas.
   - **Inner Edge of HZ (Runaway Greenhouse)**: High-albedo swirling sulfuric acid and supercritical $\text{CO}_2$ cloud decks.
   - **Inside Habitable Zone (Temperate Ocean Worlds)**: Fractal continents with lush green forests, savannahs, snow-capped mountains, deep blue oceans, polar ice caps, swirling water-vapor cloud decks, ocean specular glint, and nightside coastal bioluminescence/city lights!
   - **Outer Edge of HZ (Cold Deserts)**: Iron-oxide rust regolith, rift valleys, and reflective dry-ice polar caps.
   - **Beyond HZ (Jovian Gas Giants & Ice Giants)**: Zonal atmospheric belts, turbulent shear eddies, anticyclonic storm spots (Great Red Spot analogs), and cyan methane clouds.
   - **Far Outer (Frozen Dwarfs)**: Fractured nitrogen ice crusts with dark reddish tholin patches.

---

## 🏷️ Human-Readable Section Index

Every section across the interface and codebase has been tagged with human-readable IDs, labels, and data attributes for clear, unambiguous identification:

| Code / Badge Tag | Human-Readable Name | HTML `id` / `data-section` | File Location |
| :--- | :--- | :--- | :--- |
| **`SEC-01`** | **Command Bar & Filters** | `section-01-command-bar` | `src/components/ui/Header.tsx` |
| **`SEC-02`** | **Sector Generator Parameters** | `section-02-sector-parameters` | `src/components/ui/SectorControls.tsx` |
| **`SEC-03`** | **3D Galactic Sector Viewport** | `section-03-galactic-sector-3d` | `src/components/canvas/SectorView3D.tsx` |
| **`SEC-04`** | **Stellar Inspector & MK Telemetry** | `section-04-stellar-telemetry` | `src/components/ui/StellarInspector.tsx` |
| **`SEC-05`** | **Evolutionary Timeline Scrubber** | `section-05-timeline-scrubber` | `src/components/ui/StellarInspector.tsx` |
| **`SEC-06`** | **Hertzsprung-Russell Diagram Track** | `section-06-hr-diagram` | `src/components/canvas/HRDiagramCanvas.tsx` |
| **`SEC-07`** | **Circumstellar Solar System 3D Viewport** | `section-07-solar-system-3d` | `src/components/canvas/CircumstellarView3D.tsx` |
| **`SEC-08`** | **Selected Exoplanet Dossier** | `section-08-planet-dossier` | `src/components/ui/PlanetDossier.tsx` |
| **`SEC-09`** | **Planetary Fleet Selector** | `section-09-planet-fleet` | `src/components/ui/PlanetDossier.tsx` |
| **`SEC-10`** | **Expanded 3D Solar System Theater** | `section-10-expanded-solar-system-theater` | `src/components/ui/StellarInspector.tsx` |

