# Galactic Sector Star System Evolution Simulator
## Complete Technical Specification, Architecture & Mathematical Physics Reference

---

## Categorized Table of Contents

- [1. Executive Overview & System Architecture](#1-executive-overview--system-architecture)
  - [1.1 Purpose and Core Methodology](#11-purpose-and-core-methodology)
  - [1.2 UI & Layout Architecture (Tailwind + Canvas)](#12-ui--layout-architecture-tailwind--canvas)
  - [1.3 Simulation Pipeline Sequence](#13-simulation-pipeline-sequence)
- [2. File Structure & Section Breakdown](#2-file-structure--section-breakdown)
  - [2.1 HTML/DOM & Tailwind CSS Layer](#21-htmldom--tailwind-css-layer)
  - [2.2 Script Block 1: Astrophysical Constants & Dynamic MK Classifier](#22-script-block-1-astrophysical-constants--dynamic-mk-classifier)
  - [2.3 Script Block 2: Procedural Multi-Planet Generator & Exoplanet Dossier](#23-script-block-2-procedural-multi-planet-generator--exoplanet-dossier)
  - [2.4 Script Block 3: Procedural Sector Engine & Galactic Morphology](#24-script-block-3-procedural-sector-engine--galactic-morphology)
  - [2.5 Script Block 4: Sector Canvas & 2D Coordinate Rendering](#25-script-block-4-sector-canvas--2d-coordinate-rendering)
  - [2.6 Script Block 5: Stellar Inspector, HR Diagram & Circumstellar Orbit Map](#26-script-block-5-stellar-inspector-hr-diagram--circumstellar-orbit-map)
  - [2.7 Script Block 6: Master Render Loop & Event Listeners](#27-script-block-6-master-render-loop--event-listeners)
- [3. Mathematical Formulations & Astrophysical Derivations](#3-mathematical-formulations--astrophysical-derivations)
  - [3.1 Statistical Generation & Coordinate Math](#31-statistical-generation--coordinate-math)
    - [3.1.1 Lehmer Linear Congruential PRNG](#311-lehmer-linear-congruential-prng)
    - [3.1.2 Box-Muller Polar Transform for Gaussian Sampling](#312-box-muller-polar-transform-for-gaussian-sampling)
    - [3.1.3 Initial Mass Function (IMF) Piecewise Sampling](#313-initial-mass-function-imf-piecewise-sampling)
    - [3.1.4 Sector Morphology Spatial Probability Densities](#314-sector-morphology-spatial-probability-densities)
  - [3.2 Stellar Astrophysics & Evolution Equations](#32-stellar-astrophysics--evolution-equations)
    - [3.2.1 Main Sequence Grid & Hermite Smoothstep Interpolation](#321-main-sequence-grid--hermite-smoothstep-interpolation)
    - [3.2.2 Main Sequence Lifetime Power Laws](#322-main-sequence-lifetime-power-laws)
    - [3.2.3 Giant Capacity Logistic / Fermi-Dirac Threshold](#323-giant-capacity-logistic--fermi-dirac-threshold)
    - [3.2.4 Piecewise Evolutionary State Track ($M < 8.0\,M_\odot$)](#324-piecewise-evolutionary-state-track-m--80m_odot)
    - [3.2.5 Massive Star Evolution & Supernova Core Collapse ($M \ge 8.0\,M_\odot$)](#325-massive-star-evolution--supernova-core-collapse-m-ge-80m_odot)
    - [3.2.6 Degenerate Remnant Radii (Schwarzschild, NS, White Dwarf)](#326-degenerate-remnant-radii-schwarzschild-ns-white-dwarf)
    - [3.2.7 Stefan-Boltzmann Stellar Radius Derivation](#327-stefan-boltzmann-stellar-radius-derivation)
    - [3.2.8 Dynamic Morgan-Keenan (MK) & Yerkes Classification](#328-dynamic-morgan-keenan-mk--yerkes-classification)
    - [3.2.9 Kopparapu Habitable Zone Boundaries & Water Snowline](#329-kopparapu-habitable-zone-boundaries--water-snowline)
  - [3.3 Planetary Dynamics & Geophysics Equations](#33-planetary-dynamics--geophysics-equations)
    - [3.3.1 Titius-Bode / Logarithmic Orbital Spacing](#331-titius-bode--logarithmic-orbital-spacing)
    - [3.3.2 Planetary Mass-Radius Scaling Laws](#332-planetary-mass-radius-scaling-laws)
    - [3.3.3 Adiabatic Orbital Expansion via Stellar Mass Loss](#333-adiabatic-orbital-expansion-via-stellar-mass-loss)
    - [3.3.4 Kepler's Third Law (Period & Orbital Velocity)](#334-keplers-third-law-period--orbital-velocity)
    - [3.3.5 Insolation Flux & Blackbody Equilibrium Temperature ($T_{\text{eq}}$)](#335-insolation-flux--blackbody-equilibrium-temperature-t_textteq)
    - [3.3.6 Planetary Surface Temperature ($T_{\text{surf}}$) & Greenhouse Model](#336-planetary-surface-temperature-t_textsurf--greenhouse-model)
    - [3.3.7 Surface Gravity](#337-surface-gravity)
    - [3.3.8 Tidal Locking Threshold Distance](#338-tidal-locking-threshold-distance)
    - [3.3.9 Stellar Engulfment & Supernova Shock Criteria](#339-stellar-engulfment--supernova-shock-criteria)
  - [3.4 Graphics, Projections & Viewport Transformations](#34-graphics-projections--viewport-transformations)
    - [3.4.1 Affine Pan-and-Zoom Transform](#341-affine-pan-and-zoom-transform)
    - [3.4.2 Hertzsprung-Russell Logarithmic Inverted Projection](#342-hertzsprung-russell-logarithmic-inverted-projection)
    - [3.4.3 Polar-to-Cartesian Real-Time Orbit Animation](#343-polar-to-cartesian-real-time-orbit-animation)
- [4. Code Symbols & Constants Reference Table](#4-code-symbols--constants-reference-table)

---

## 1. Executive Overview & System Architecture

### 1.1 Purpose and Core Methodology
The **Galactic Sector Star System Evolution Simulator** is an interactive, browser-based astrophysical simulation suite built into a single self-contained HTML/JavaScript application. It procedurally generates an entire galactic sector containing between 100 and 1,500 stars according to user-defined morphology, age distribution, stellar dispersion, and metallicity.

Unlike naive simulators that assign random spectral letters, this engine enforces a **physically strict sequential derivation pipeline**:
$$\text{Progenitor Mass } (M_0) + \text{Age / Evolutionary Progress } (t) \longrightarrow \text{Phase} \longrightarrow (L, T_{\text{eff}}, M(t)) \longrightarrow \text{Stefan-Boltzmann } R_* \longrightarrow \text{Pure Morgan-Keenan (MK) Class}$$

Each star is surrounded by a dynamically computed circumstellar system comprising **4 to 8 exoplanets**. When the user scrubs a star's evolutionary progress from Zero Age Main Sequence ($t=0$) through red giant expansion, supernova explosion, or white dwarf cooling, all circumstellar bodies react in real-time: orbits expand adiabatically as the host star sheds mass, inner planets are engulfed by the expanding photosphere, and climate zones drift dynamically.

### 1.2 UI & Layout Architecture (Tailwind + Canvas)
The graphical interface uses a dark, futuristic HUD theme ("Glass HUD") powered by Tailwind CSS utility classes and custom CSS backdrop filters (`backdrop-filter: blur(14px)`). The viewport is strictly bounded to the browser window (`h-screen w-screen overflow-hidden`) with a 12-column responsive CSS grid:

1. **Top Header Command Bar**: Global sector badges, real-time population filter chips (O/B, G Sol, K/M, Remnants, Habitable Zone stars), and a random interesting target selector.
2. **Left Panel (3 Columns)**: Sector parameter controls (seed generator, star count slider, morphology selector, mean age slider, age dispersion slider, metallicity slider, and sector radius).
3. **Center Panel (4 Columns)**: 2D interactive canvas showing the spatial distribution of the sector, equipped with pan, zoom, scale bar, concentric distance rings, and star selection click detection.
4. **Right Panel (5 Columns)**: Deep Stellar & Planetary Inspector:
   - Real-time evolutionary timeline scrubber ($t \in [0\%, 100\%]$).
   - High-precision telemetry grid ($M_0, M(t), R_*, L, T_{\text{eff}}$, Habitable Zone bounds).
   - Dual lower sub-canvases:
     - **HR Diagram Track**: Plots the star's evolutionary path in $(\log_{10} T_{\text{eff}}, \log_{10} L)$ space, highlighting the Cepheid Instability Strip.
     - **Circumstellar Orbit Canvas**: Visualizes host star photosphere, planetary orbits, Kopparapu Habitable Zone ring, and real-time orbital motion.
   - **Exoplanet Dossier Card**: Physical, thermal, atmospheric, and habitability profile of the selected exoplanet.
   - **Interactive Planetary Fleet List**: List of all planets with live status tags (`Active`, `Candidate Habitable`, `Scorched`, `Engulfed`).

### 1.3 Simulation Pipeline Sequence
The procedural lifecycle unfolds in four distinct stages:

```
[User Seed / Params]
        │
        ▼
[1. Sector Generation] ────► Sample IMF (M0) ────► Sample Spatial Coords (x, y) ────► Sample Age (Gaussian)
        │
        ▼
[2. Stellar Evolution] ────► Compute Lifetime tMS ────► Derive L, Teff, Phase, M(t) ────► Stefan-Boltzmann R*
        │
        ▼
[3. System Synthesis]  ────► Generate 4-8 Planets (Titius-Bode) ────► Compute Kopparapu HZ & Snowline
        │
        ▼
[4. Real-Time Canvas]  ────► Render Sector Viewport + HR Diagram + Orbit Animation Loop (requestAnimationFrame)
```

---

## 2. File Structure & Section Breakdown

The file is organized into an HTML shell followed by six distinct JavaScript modules separated by clear header comments:

### 2.1 HTML/DOM & Tailwind CSS Layer
- **Lines 1–85**: Document `<head>`, Google Font imports (`JetBrains Mono` and `Plus Jakarta Sans`), Tailwind CDN, and custom CSS variables (`--space-bg: #03050c`, glassmorphism `.glass-hud`, styled `<input type="range">` thumbs, and custom scrollbars).
- **Lines 86–122**: `<header>` command bar, title, subtitle, filter buttons (`filter-chip`), and "Random Target" button.
- **Lines 123–208**: `<aside class="lg:col-span-3">` left parameter control panel containing range sliders and select inputs for sector generation.
- **Lines 209–241**: `<section class="lg:col-span-4">` central sector canvas container with zoom buttons (`+`, `-`, `Center`), hover tooltip overlay (`#starHoverTooltip`), and parallax metric scale bar.
- **Lines 242–347**: `<aside class="lg:col-span-5">` right inspector panel housing the star telemetry HUD, timeline scrubber, dual canvas containers (`inspHRCanvas` and `inspSystemCanvas`), planet dossier card, and planet selector buttons.

### 2.2 Script Block 1: Astrophysical Constants & Dynamic MK Classifier
*(Lines 349–591)*
- Defines physical constants in solar, Earth, and SI units ($R_\odot, R_\oplus, M_\oplus, M_{\text{Jup}}, T_\odot, S_\odot$).
- Sets Kopparapu solar flux limits: $S_{\text{eff,inner}} = 1.25$ and $S_{\text{eff,outer}} = 0.38$.
- **`MK_TEFF_GRID`**: Reference table of 37 spectral subclasses from O2 ($48{,}000\,\text{K}$) to M9 ($2{,}300\,\text{K}$) based on the Mamajek dwarf temperature scale.
- **`deriveMorganKeenanClass()`**: Derives spectral letter, numeric subtype, and Yerkes luminosity class (Ia, Ib, II, III, IV, IV-V, V, VII) strictly from instantaneous $T_{\text{eff}}$, $\log_{10}(L)$, and $R_*$.
- **`EMPIRICAL_MS_GRID`**: Empirical Main Sequence isochrone table from $0.08\,M_\odot$ to $100.0\,M_\odot$.
- **`interpolateMS()`**: Interpolates $T_{\text{eff}}, R_*$, and $\log_{10}(L)$ across the mass grid using smoothstep Hermite interpolation.
- **`calculateMSLifetimeGyr()`**: Piecewise power-law model calculating stellar hydrogen-burning lifespans.
- **`calculateStellarEvolution()`**: Core stellar engine calculating phase, age, $L, T_{\text{eff}}, M(t), R_*$, supernova shock wave radius, planetary nebula expansion, and habitable zone boundaries.
- **`getStarColorRGB()`**: Maps effective temperature to realistic blackbody RGB colors and visual glow halos.

### 2.3 Script Block 2: Procedural Multi-Planet Generator & Exoplanet Dossier
*(Lines 593–764)*
- **`class PRNG`**: Seeded Lehmer (Park-Miller) Linear Congruential Generator with uniform and Gaussian distribution generators.
- **`synthesizeMultiPlanetSystem()`**: Generates 4 to 8 planets per star with initial semi-major axes obeying logarithmic spacing, orbital eccentricity, inclination, planetary archetypes (Lava Worlds, Super-Earths, Ocean Worlds, Jovian Gas Giants, Ice Giants), atmospheric compositions, and greenhouse warming factors.
- **`computePlanetPhysics()`**: Real-time geophysical calculation evaluating adiabatic orbit expansion $a(t)$, Keplerian orbital periods, stellar engulfment, insolation flux $S$, equilibrium temperature $T_{\text{eq}}$, surface temperature $T_{\text{surf}}$, surface gravity $g$, and tidal locking status.

### 2.4 Script Block 3: Procedural Sector Engine & Galactic Morphology
*(Lines 766–883)*
- **`sectorConfig`**: Global state configuration dictionary storing active seed, star count, morphology, mean age, age dispersion, metallicity, and radius.
- **`sampleIMF()`**: Piecewise probability density inversion generating progenitor masses following the stellar Initial Mass Function.
- **`sampleCoordinates()`**: 2D spatial coordinate generator producing stellar positions based on four galactic morphologies: Exponential Thin Disk, Globular Cluster Core, Open Cluster / Nursery, and Diffuse Halo.
- **`generateSector()`**: Master generation routine populating the sector array, evaluating each star's age, state, and planetary system, and auto-selecting an initial Solar analog star.
- **`updateFilterCounts()`**: Aggregates star counts across population classes (O/B, G Sol, K/M, Remnants, Habitable Zone hosts) for header filter chips.

### 2.5 Script Block 4: Sector Canvas & 2D Coordinate Rendering
*(Lines 885–1043)*
- **`resizeAllCanvases()`**: Automatically scales HTML5 canvases to match CSS bounding client rectangles multiplied by `window.devicePixelRatio` for retina displays.
- **`renderSectorMap()`**: Draws concentric range rings, stellar photospheres, luminosity glow gradients, and green habitability halos on the 2D sector map.
- **`getStarAtCanvasPos()`**: Fast 2D Euclidean distance picker identifying the star nearest to the mouse cursor for hover tooltips and click selection.

### 2.6 Script Block 5: Stellar Inspector, HR Diagram & Circumstellar Orbit Map
*(Lines 1045–1242)*
- **`updateInspectorView()`**: Updates DOM elements with telemetry, spectral classifications, habitable zone radii, and the selected exoplanet dossier.
- **`selectPlanet()`**: Global callback to switch the inspected planet.
- **`renderInspectorHR()`**: Renders an astronomical Hertzsprung-Russell diagram with inverted logarithmic axes, instability strip region, and the host star's complete evolutionary trajectory curve.
- **`renderInspectorSystem()`**: Animates host star pulsation, circumstellar habitable zone band, expanding planetary orbits, and orbiting planetary spheres according to Keplerian mean motion.

### 2.7 Script Block 6: Master Render Loop & Event Listeners
*(Lines 1244–1377)*
- **`masterLoop()`**: Recursive `requestAnimationFrame` loop driving the real-time simulation at 60 FPS.
- **Event Listeners**: Handles parameter regeneration, random seed generation, slider inputs, filter chip toggles, pan/zoom dragging, mousewheel zoom, timeline scrubber evolution, and canvas click interactions.

---

## 3. Mathematical Formulations & Astrophysical Derivations

### 3.1 Statistical Generation & Coordinate Math

#### 3.1.1 Lehmer Linear Congruential PRNG
The procedural generator avoids `Math.random()` to ensure deterministic sector recreation from a numerical seed. It employs the Lehmer (Park-Miller) multiplicative linear congruential generator:
$$S_{n+1} = (S_n \times a) \pmod m$$
Where:
- Multiplier $a = 16{,}807 = 7^5$
- Modulus $m = 2^{31} - 1 = 2{,}147{,}483{,}647$ (Mersenne prime $M_{31}$)
- Uniform output:
$$U = \frac{S_{n+1} - 1}{m - 1} \in [0, 1)$$

```javascript
this.s = (this.s * 16807) % 2147483647;
return (this.s - 1) / 2147483646;
```

#### 3.1.2 Box-Muller Polar Transform for Gaussian Sampling
To generate stellar ages and cluster dispersions with a normal distribution $\mathcal{N}(\mu, \sigma^2)$, the code uses the Box-Muller transform:
Given two independent random variates $u_1, u_2 \sim \mathcal{U}(0, 1)$:
$$Z = \sqrt{-2 \ln(1 - u_1)} \cos(2\pi u_2)$$
$$X = \mu + Z \cdot \sigma$$

```javascript
let u = 1 - this.next();
let v = this.next();
let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
return mean + z * stdev;
```

#### 3.1.3 Initial Mass Function (IMF) Piecewise Sampling
Stellar progenitor masses $M_0$ are drawn from a 4-part piecewise cumulative distribution function approximating the Kroupa/Chabrier Initial Mass Function:
$$M_0 = \begin{cases}
0.08 + u_2^{1.7} \times 0.42 & \text{if } u_1 < 0.68 \quad (\text{M/K Low-Mass Dwarfs, } 0.08 - 0.50\,M_\odot) \\
0.50 + u_2^{2.2} \times 0.90 & \text{if } 0.68 \le u_1 < 0.92 \quad (\text{Solar-Type G/K Stars, } 0.50 - 1.40\,M_\odot) \\
1.40 + u_2^{2.5} \times 6.60 & \text{if } 0.92 \le u_1 < 0.985 \quad (\text{Intermediate A/F Stars, } 1.40 - 8.00\,M_\odot) \\
8.00 + u_2^{3.0} \times 75.0 & \text{if } u_1 \ge 0.985 \quad (\text{Massive O/B Stars, } 8.00 - 83.00\,M_\odot)
\end{cases}$$
This correctly reproduces the steep drop-off at high stellar masses ($\Gamma \approx -2.35$ Salpeter slope) while maintaining a high fraction of low-mass red dwarfs.

#### 3.1.4 Sector Morphology Spatial Probability Densities
Stars are positioned in 2D polar space $(r, \theta)$ with uniform azimuth $\theta \sim \mathcal{U}(0, 2\pi)$ and radial distances $r$ depending on morphology:

1. **Galactic Thin Disk (Exponential Radial Falloff)**:
   In an exponential surface density profile $\Sigma(r) \propto e^{-r/h_R}$:
   $$r = -\ln(1 - 0.92 u) \cdot (0.45 R_{\text{sec}})$$
2. **Globular Cluster Core (Dense Plummer/King Profile)**:
   $$r = 0.35 R_{\text{sec}} \sqrt{\frac{u}{1 - u + 10^{-4}}}$$
3. **Open Cluster / Stellar Nursery (Multi-Centric Gaussian Clusters)**:
   Three sub-cluster centroids $\vec{c}_k \in \{(-0.35, -0.25), (0.30, -0.10), (0, 0.35)\} \times R_{\text{sec}}$ with Gaussian dispersion:
   $$r \sim \mathcal{N}(0, (0.25 R_{\text{sec}})^2)$$
4. **Galactic Halo (Diffuse Uniform Disk Projection)**:
   $$r = R_{\text{sec}} \sqrt{u}$$

---

### 3.2 Stellar Astrophysics & Evolution Equations

#### 3.2.1 Main Sequence Grid & Hermite Smoothstep Interpolation
For Zero Age Main Sequence (ZAMS) parameters, the simulator looks up values in `EMPIRICAL_MS_GRID` spanning $0.08\,M_\odot$ to $100.0\,M_\odot$. Given mass $M$, the interval $[M_1, M_2]$ is located, and the logarithmic normalized interpolation parameter $t$ is calculated:
$$t = \frac{\log_{10}(M) - \log_{10}(M_1)}{\log_{10}(M_2) - \log_{10}(M_1)} \in [0, 1]$$
To prevent derivative discontinuities at grid boundaries, a **cubic Hermite smoothstep** is applied:
$$s(t) = 3t^2 - 2t^3$$
Effective temperature and radius are linearly blended with $s(t)$, while luminosity is interpolated in logarithmic space:
$$T_{\text{eff}}(M) = T_1 + (T_2 - T_1) s(t)$$
$$R_*(M) = R_1 + (R_2 - R_1) s(t)$$
$$\log_{10} L(M) = \log_{10} L_1 + (\log_{10} L_2 - \log_{10} L_1) s(t) \implies L(M) = 10^{\log_{10} L(M)}$$

#### 3.2.2 Main Sequence Lifetime Power Laws
Hydrogen burning lifetime $t_{\text{MS}}$ is governed by the ratio of nuclear fuel to luminosity: $t_{\text{MS}} \propto M / L$. Because $L \propto M^\alpha$, $t_{\text{MS}} \propto M^{1 - \alpha}$. The simulation models this across mass regimes:

$$t_{\text{MS}}(M) = \begin{cases}
12.0 \cdot M^{-2.75} \text{ Gyr} & M < 0.35\,M_\odot \\
(1 - w) \cdot (12.0 M^{-2.75}) + w \cdot (10.0 M^{-2.5}) \text{ Gyr} & 0.35 \le M < 1.3\,M_\odot \quad \left(w = \frac{M - 0.35}{1.3 - 0.35}\right) \\
10.0 \cdot M^{-2.5} \text{ Gyr} & 1.3 \le M \le 8.0\,M_\odot \\
0.035 \cdot \left(\frac{M}{10}\right)^{-1.35} \text{ Gyr} \quad (= 35 \cdot (M/10)^{-1.35} \text{ Myr}) & M > 8.0\,M_\odot
\end{cases}$$

#### 3.2.3 Giant Capacity Logistic / Fermi-Dirac Threshold
Stars below $M \approx 0.35 - 0.40\,M_\odot$ are fully convective and never develop degenerate helium cores; they transition directly to blue dwarfs and helium white dwarfs without ascending the Red Giant Branch. This physical transition is modeled using a continuous logistic activation function:
$$g(M_0) = \frac{1}{1 + e^{-16(M_0 - 0.38)}} \in [0, 1]$$
- If $g(M_0) \to 0$ ($M_0 \le 0.35\,M_\odot$), giant branch expansion, helium core flashes, and thermal pulses are suppressed.
- If $g(M_0) \to 1$ ($M_0 \ge 0.50\,M_\odot$), the full post-main sequence giant track is unlocked.

#### 3.2.4 Piecewise Evolutionary State Track ($M < 8.0\,M_\odot$)
Evolutionary progress is scrubbed via $p \in [0\%, 100\%]$:

1. **Protostellar Collapse (Hayashi Track, $0 \le p < 6\%$)**:
   Duration $t_{\text{PMS}} = \max(10, 80 M_0^{-1.2})\,\text{Myr}$. Normalized progress $u = p / 6.0$:
   $$L(u) = L_{\text{init}} \cdot \left(\frac{L_{\text{ZAMS}}}{L_{\text{init}}}\right)^u, \quad L_{\text{init}} = L_{\text{ZAMS}} (10 + 15 \sqrt{M_0})$$
   $$T_{\text{eff}}(u) = T_{\text{init}} + (T_{\text{ZAMS}} - T_{\text{init}}) u^{1.5}, \quad T_{\text{init}} = \min(T_{\text{ZAMS}}, 3200\,\text{K})$$

2. **Main Sequence Core Hydrogen Burning ($6\% \le p < 50\%$)**:
   Normalized progress $u = (p - 6) / 44$. The core accumulates helium ash:
   $$L(u) = L_{\text{ZAMS}} \left[1.0 + (0.85 g(M_0) + 0.15) u^{1.2}\right]$$
   $$T_{\text{eff}}(u) = \begin{cases}
   T_{\text{ZAMS}} + 400 (1 - g(M_0)) u^{1.5} & \text{if } g(M_0) < 0.2 \\
   T_{\text{ZAMS}} [1.0 - 0.08 u \cdot g(M_0)] & \text{if } g(M_0) \ge 0.2
   \end{cases}$$

3. **Subgiant Branch (SGB, $50\% \le p < 60\%$)**:
   Normalized progress $u = (p - 50) / 10$:
   $$L_{\text{SGB}} = L_{\text{ZAMS}} (2.0 + 3.0 M_0^{1.2})$$
   $$L(u) = 1.85 L_{\text{ZAMS}} + (L_{\text{SGB}} - 1.85 L_{\text{ZAMS}}) u$$
   $$T_{\text{eff}}(u) = 0.92 T_{\text{ZAMS}} + \left[(3900 + 0.2(T_{\text{ZAMS}} - 3900)) - 0.92 T_{\text{ZAMS}}\right] u$$

4. **Red Giant Branch & Helium Core Flash ($60\% \le p < 70\%$)**:
   Hydrogen burns in a shell above an isothermal degenerate helium core. Luminosity ascends rapidly:
   $$L_{\text{tip}} = 2800 M_0^{0.4} g(M_0)$$
   $$L(u) = 4.0 L_{\text{ZAMS}} \cdot \exp\left[u \ln\left(\max\left(10, \frac{L_{\text{tip}}}{4 L_{\text{ZAMS}}}\right)\right)\right]$$
   $$T_{\text{eff}}(u) = 3900 - 900 \sqrt{u}$$
   $$M(u) = M_0 - 0.15 M_0 u \cdot g(M_0) \quad \text{(Stellar wind mass loss)}$$

5. **Horizontal Branch / Red Clump ($70\% \le p < 78\%$)**:
   Stable core helium fusion:
   $$L(u) = [55 M_0^{0.7} + 15 \sin(\pi u)] g(M_0)$$
   $$T_{\text{eff}}(u) = 4700 + 400 \sin(\pi u)$$

6. **Asymptotic Giant Branch (TP-AGB, $78\% \le p < 85\%$)**:
   Double shell burning (H and He shells) with thermal helium shell flashes:
   $$P_{\text{thermal}} = \max[0, \sin(6\pi u)] \cdot 2500 g(M_0)$$
   $$L(u) = 2200 + 3800 u^{0.8} g(M_0) + P_{\text{thermal}}$$
   $$M_{\text{core}} = 0.50 + 0.12 M_0^{0.6}$$
   $$M(u) = 0.8 M_0 - (0.8 M_0 - M_{\text{core}}) u$$

7. **Post-AGB Core Unveiling & Planetary Nebula ($85\% \le p < 89\%$)**:
   Envelope ejected; degenerate carbon-oxygen core revealed:
   $$L(u) = 3600 (1.0 - 0.5 u)$$
   $$T_{\text{eff}}(u) = 3000 + (135{,}000 - 3000) u^{0.4}$$
   $$R_{\text{nebula}}(u) = 4.5 u \text{ AU}$$

8. **Degenerate White Dwarf Cooling ($89\% \le p \le 100\%$)**:
   Mestel cooling law approximation with cooling time $t_{\text{cool}} = 8.0 u$ Gyr:
   $$L(t_{\text{cool}}) = 0.12 (1 + 2.5 t_{\text{cool}})^{-1.3} \cdot L_\odot$$
   $$R_{\text{WD}} = 0.0125 \left(\frac{M_{\text{WD}}}{0.6}\right)^{-1/3} R_\odot$$
   $$T_{\text{eff}} = \max\left[2200, T_\odot \left(\frac{L}{R_{\text{WD}}^2}\right)^{1/4}\right]$$

#### 3.2.5 Massive Star Evolution & Supernova Core Collapse ($M \ge 8.0\,M_\odot$)
1. **O/B Main Sequence ($0 \le p < 58\%$)**:
   $$L(u) = L_{\text{ZAMS}} (1 + 0.8 u), \quad T_{\text{eff}}(u) = T_{\text{ZAMS}} (1 - 0.12 u), \quad M(u) = M_0 (1 - 0.15 u)$$
2. **Supergiant / Blue Loop / Wolf-Rayet ($58\% \le p < 82\%$)**:
   - $u < 0.35$: Red Supergiant (RSG), $T_{\text{eff}} = 3450\,\text{K}, L = 2.2 L_{\text{ZAMS}}$.
   - $0.35 \le u < 0.72$: Blue Loop excursion. If $5000\,\text{K} \le T_{\text{eff}} \le 6800\,\text{K}$, enters the **Cepheid Instability Strip** (undergoing radial pulsation).
   - $u \ge 0.72$: Stripped-envelope Wolf-Rayet star, $T_{\text{eff}} = 42{,}000 + 30{,}000 \left(\frac{u - 0.72}{0.28}\right)\,\text{K}$.
3. **Core Collapse Supernova Explosion ($82\% \le p < 87\%$)**:
   Type II ($M_0 \le 22\,M_\odot$) or Type Ib/c ($M_0 > 22\,M_\odot$).
   $$L(u) = 10^8 \cdot \sin^{0.5}(\pi u) + 10^4 \quad (\text{Peak Luminosity } \sim 10^8\,L_\odot)$$
   $$R_{\text{shock}}(u) = 35.0 u \text{ AU}$$
4. **Compact Remnant ($87\% \le p \le 100\%$)**:
   - $M_0 \ge 22\,M_\odot$: **Black Hole** ($M_{\text{BH}} = 3.0 + 0.35(M_0 - 22)\,M_\odot, L = 10^{-6} L_\odot, T_{\text{eff}} = 0\,\text{K}$).
   - $8 \le M_0 < 22\,M_\odot$: **Neutron Star / Pulsar** ($M_{\text{NS}} = 1.44\,M_\odot, R = 11.5\,\text{km}$).

#### 3.2.6 Degenerate Remnant Radii (Schwarzschild, NS, White Dwarf)
- **Black Hole (Schwarzschild Radius $R_s$)**:
  $$R_s = \frac{2 G M}{c^2} \approx 2.95 \cdot \left(\frac{M}{M_\odot}\right) \text{ km}$$
- **Neutron Star**:
  $$R_{\text{NS}} \approx 11.5 \text{ km}$$
- **White Dwarf (Non-relativistic electron degeneracy mass-radius relation)**:
  $$R_{\text{WD}} \approx 0.0125 \cdot \left(\frac{M_{\text{WD}}}{0.6\,M_\odot}\right)^{-1/3} R_\odot$$

#### 3.2.7 Stefan-Boltzmann Stellar Radius Derivation
The simulator calculates stellar radius $R_*$ directly from radiative equilibrium:
$$L = 4\pi R_*^2 \sigma T_{\text{eff}}^4$$
Normalized to solar units ($L_\odot = 4\pi R_\odot^2 \sigma T_\odot^4$ where $T_\odot = 5778\,\text{K}$):
$$\frac{L}{L_\odot} = \left(\frac{R_*}{R_\odot}\right)^2 \left(\frac{T_{\text{eff}}}{T_\odot}\right)^4 \implies R_* = \frac{\sqrt{L/L_\odot}}{(T_{\text{eff}} / T_\odot)^2} \, R_\odot$$
Conversion to Astronomical Units (AU) and kilometers:
$$R_* (\text{AU}) = R_* (R_\odot) \times 0.00465047$$
$$R_* (\text{km}) = R_* (R_\odot) \times 696{,}340$$

#### 3.2.8 Dynamic Morgan-Keenan (MK) & Yerkes Classification
Classification is evaluated dynamically from the derived state:
1. **Spectral Subtype**: Derived by scanning `MK_TEFF_GRID` for the closest bracket $[T_{\text{upper}}, T_{\text{lower}}]$ around $T_{\text{eff}}$:
   $$\text{Subtype} = \begin{cases} \text{Class}_{\text{upper}} & \text{if } T_{\text{eff}} \ge \frac{T_{\text{upper}} + T_{\text{lower}}}{2} \\ \text{Class}_{\text{lower}} & \text{otherwise} \end{cases}$$
2. **Yerkes Luminosity Class**:
   $$\text{Class} = \begin{cases}
   \text{Ia} & \text{if } R_* > 120\,R_\odot \text{ or } \log_{10}(L) > 5.2 \\
   \text{Ib} & \text{if } R_* > 120\,R_\odot \text{ or } 4.8 < \log_{10}(L) \le 5.2 \\
   \text{II (Bright Giant)} & \text{if } R_* > 40\,R_\odot \text{ or } (\log_{10} L > 3.2 \text{ and } T_{\text{eff}} < 5000\,\text{K}) \\
   \text{III (Regular Giant)} & \text{if } R_* > 8.0\,R_\odot \text{ or } (\log_{10} L > 1.8 \text{ and } T_{\text{eff}} < 5200\,\text{K}) \\
   \text{IV (Subgiant)} & \text{if } R_* > 1.7\,R_\odot \\
   \text{IV-V (Evolving Dwarf)} & \text{if } 1.35 < R_* \le 1.7\,R_\odot \\
   \text{V (Main Sequence)} & \text{Standard dwarf baseline} \\
   \text{VII} & \text{Degenerate White Dwarf}
   \end{cases}$$

#### 3.2.9 Kopparapu Habitable Zone Boundaries & Water Snowline
Circumstellar habitable zone boundaries follow Kopparapu et al. (2013, 2014) insolation thresholds:
- **Inner Boundary (Moist / Runaway Greenhouse Limit)**: $S_{\text{eff,inner}} = 1.25$
  $$r_{\text{in}} = \sqrt{\frac{L / L_\odot}{S_{\text{eff,inner}}}} = \sqrt{\frac{L}{1.25}} \text{ AU}$$
- **Outer Boundary (Maximum Carbon Dioxide Greenhouse Limit)**: $S_{\text{eff,outer}} = 0.38$
  $$r_{\text{out}} = \sqrt{\frac{L / L_\odot}{S_{\text{eff,outer}}}} = \sqrt{\frac{L}{0.38}} \text{ AU}$$
- **Volatile Snowline ($T_{\text{cond}} \approx 170\,\text{K}$)**:
  $$r_{\text{snow}} = 2.7 \cdot \sqrt{L/L_\odot} \text{ AU}$$

---

### 3.3 Planetary Dynamics & Geophysics Equations

#### 3.3.1 Titius-Bode / Logarithmic Orbital Spacing
Planets form with geometric semi-major axis expansion satisfying mutual Hill-sphere dynamical stability:
$$a_0 = 0.08 + (0.25 M_0)(0.5 + 0.8 u_{\text{rand}})$$
$$a_{i} = a_{i-1} \cdot (1.35 + 0.65 u_{\text{rand}})$$
Orbital eccentricities follow a power-law biased toward near-circular orbits:
$$e = \min(0.28, 0.35 \cdot u_{\text{rand}}^{2.5})$$

#### 3.3.2 Planetary Mass-Radius Scaling Laws
Empirical mass-radius relations for exoplanets (Zeng et al., 2016):
- **Terrestrial & Scorched Silicate/Iron Worlds**:
  $$R_p = M_p^{0.28} \, R_\oplus$$
- **Ocean Worlds & Super-Earths**:
  $$R_p = 1.08 \cdot M_p^{0.30} \, R_\oplus$$
- **Gas Giants (Jovian)**:
  $$R_p = \begin{cases} 8.5 + 3.0 u_{\text{rand}} \, R_\oplus & \text{if } M_p \ge 63.5\,M_\oplus \ (0.2\,M_{\text{Jup}}) \\ 6.0 \, R_\oplus & \text{otherwise} \end{cases}$$
- **Sub-Neptunes**:
  $$R_p = 2.2 + 1.6 u_{\text{rand}} \, R_\oplus, \quad M_p \in [4, 16]\,M_\oplus$$

#### 3.3.3 Adiabatic Orbital Expansion via Stellar Mass Loss
When a star undergoes mass loss via stellar winds, thermal pulses, or planetary nebula ejection, the timescale of mass loss $\tau_{\text{loss}} \gg P_{\text{orbit}}$. According to the adiabatic invariant of celestial mechanics:
$$G M_*(t) a(t) = \text{constant} \implies a(t) = a_0 \left(\frac{M_0}{M_*(t)}\right)$$
As the host star sheds mass from $M_0$ down to core remnant mass $M_*$, every planetary orbit expands outward proportionally to the mass ratio $M_0 / M_*(t)$.

#### 3.3.4 Kepler's Third Law (Period & Orbital Velocity)
For planet orbital distance $a(t)$ and instantaneous stellar mass $M_*(t)$:
$$P = \sqrt{\frac{a(t)^3}{M_*(t)}} \text{ years} = 365.25 \cdot \sqrt{\frac{a(t)^3}{M_*(t)}} \text{ days}$$
Mean orbital angular frequency $\omega$:
$$\omega = \frac{2\pi}{P} \propto \sqrt{\frac{M_*(t)}{a(t)^3}}$$

#### 3.3.5 Insolation Flux & Blackbody Equilibrium Temperature ($T_{\text{eq}}$)
Top-of-Atmosphere stellar flux received by the planet:
$$S = S_\odot \cdot \frac{L / L_\odot}{(a / 1\,\text{AU})^2} = 1361 \cdot \frac{L}{a^2} \text{ W/m}^2$$
Planetary blackbody equilibrium temperature assuming uniform heat redistribution:
$$\pi R_p^2 (1 - A) S = 4\pi R_p^2 \sigma T_{\text{eq}}^4$$
$$T_{\text{eq}} = T_{\text{eff}} \sqrt{\frac{R_* (\text{AU})}{2 a}} (1 - A)^{1/4}$$
Where $A$ is the Bond albedo ($A \in [0.12, 0.55]$ depending on archetype).

#### 3.3.6 Planetary Surface Temperature ($T_{\text{surf}}$) & Greenhouse Model
The actual surface temperature includes atmospheric greenhouse warming $\Delta T_{\text{GH}}$:
$$T_{\text{surf}} = T_{\text{eq}} + \Delta T_{\text{GH}}$$
$$\Delta T_{\text{GH}} = \begin{cases}
0\,\text{K} & \text{Scorched / Lava / Gas Giants} \\
30 - 45\,\text{K} & \text{Ocean Worlds / Earth Analogs} \\
40\,\text{K} & \text{Dense } \text{CO}_2 \text{ Super-Earths} \\
8\,\text{K} & \text{Thin } \text{CO}_2 \text{ Deserts (Mars Analogs)} \\
2\,\text{K} & \text{Cryogenic Ice Dwarfs}
\end{cases}$$

#### 3.3.7 Surface Gravity
Planetary surface acceleration in Earth $g$ units ($g_\oplus = 9.807\,\text{m/s}^2$):
$$g = \frac{G M_p}{R_p^2} \implies g (\text{in } g_\oplus) = \frac{M_p / M_\oplus}{(R_p / R_\oplus)^2}$$

#### 3.3.8 Tidal Locking Threshold Distance
Gravitational tidal despinning scales sharply with orbital distance: $\tau_{\text{lock}} \propto a^6$. The threshold for rapid tidal synchronization within several billion years is approximated by:
$$a_{\text{lock}} \approx 0.22 \cdot \left(\frac{M_*}{M_\odot}\right)^{1/3} \text{ AU}$$
If $a(t) \le a_{\text{lock}}$, the planet is marked as **Tidally Locked (1:1 synchronous resonance)**.

#### 3.3.9 Stellar Engulfment & Supernova Shock Criteria
At each time step, planetary survival is evaluated:
1. **Photospheric Engulfment**:
   $$\text{If } R_* (\text{AU}) \ge a(t) \implies \text{Planet Engulfed (Vaporized)}$$
2. **Supernova Blast Wave Destruction**:
   $$\text{If } \text{isSupernova} \text{ and } R_{\text{shock}} (\text{AU}) \ge a(t) \implies \text{Planet Sterilized / Blown Away}$$

---

### 3.4 Graphics, Projections & Viewport Transformations

#### 3.4.1 Affine Pan-and-Zoom Transform
The 2D sector map converts stellar spatial coordinates $(x_i, y_i)$ in light-years to canvas pixel coordinates $(x_{\text{canvas}}, y_{\text{canvas}})$ via:
$$\begin{bmatrix} x_{\text{canvas}} \\ y_{\text{canvas}} \end{bmatrix} = \begin{bmatrix} \frac{W_{\text{canvas}}}{2} + \text{panX} + x_i \cdot \text{zoom} \\ \frac{H_{\text{canvas}}}{2} + \text{panY} + y_i \cdot \text{zoom} \end{bmatrix}$$
Inverse mouse picker transform:
$$x_{\text{world}} = \frac{x_{\text{mouse}} - \frac{W}{2} - \text{panX}}{\text{zoom}}, \quad y_{\text{world}} = \frac{y_{\text{mouse}} - \frac{H}{2} - \text{panY}}{\text{zoom}}$$

#### 3.4.2 Hertzsprung-Russell Logarithmic Inverted Projection
The Hertzsprung-Russell diagram plots luminosity against effective temperature. In astronomical convention, $T_{\text{eff}}$ increases toward the **left**:
- Temperature domain: $\log_{10}(T_{\text{eff}}) \in [\log_{10}(50{,}000), \log_{10}(2{,}000)] \approx [4.699, 3.301]$
- Luminosity domain: $\log_{10}(L) \in [-4.5, +6.2]$

Mapping functions to pixel bounds $[x_{\text{min}}, x_{\text{max}}]$ and $[y_{\text{min}}, y_{\text{max}}]$:
$$x_{\text{HR}} = x_{\text{min}} + \left(\frac{\log_{10}(50{,}000) - \log_{10}(T_{\text{eff}})}{\log_{10}(50{,}000) - \log_{10}(2{,}000)}\right) (x_{\text{max}} - x_{\text{min}})$$
$$y_{\text{HR}} = y_{\text{min}} + \left(\frac{6.2 - \log_{10}(L)}{6.2 - (-4.5)}\right) (y_{\text{max}} - y_{\text{min}})$$

#### 3.4.3 Polar-to-Cartesian Real-Time Orbit Animation
On the circumstellar canvas, planetary positions advance according to their instantaneous Keplerian orbital velocity:
$$\theta_i(t + \Delta t) = \theta_i(t) + \Delta t \cdot 0.015 \sqrt{\frac{M_*(t)}{a_i(t)^3}}$$
Cartesian screen pixel coordinates:
$$x_{p,i} = c_x + r_{\text{pixel},i} \cos(\theta_i)$$
$$y_{p,i} = c_y + r_{\text{pixel},i} \sin(\theta_i)$$
Where $r_{\text{pixel},i} = a_i(t) \cdot \text{scale}_{\text{AU}}$.

---

## 4. Code Symbols & Constants Reference Table

| Symbol in Code | Physical Quantity | Standard Units | Physical Value / Equation |
| :--- | :--- | :--- | :--- |
| `R_SUN_KM` | Solar Radius | $\text{km}$ | $696{,}340\,\text{km}$ |
| `R_SUN_AU` | Solar Radius in AU | $\text{AU}$ | $0.00465047\,\text{AU}$ |
| `R_EARTH_KM` | Earth Volumetric Radius | $\text{km}$ | $6{,}371\,\text{km}$ |
| `M_EARTH_KG` | Earth Mass | $\text{kg}$ | $5.972 \times 10^{24}\,\text{kg}$ |
| `M_JUP_EARTH` | Jupiter Mass | $M_\oplus$ | $317.8\,M_\oplus$ |
| `R_JUP_EARTH` | Jupiter Radius | $R_\oplus$ | $11.2\,R_\oplus$ |
| `T_SUN` | Solar Effective Temperature | $\text{K}$ | $5{,}778\,\text{K}$ |
| `SOLAR_FLUX_EARTH` | Solar Constant ($S_0$) | $\text{W/m}^2$ | $1{,}361\,\text{W/m}^2$ |
| `S_EFF_INNER` | Runaway Greenhouse Inward Flux | $S_\odot$ | $1.25\,S_\odot$ |
| `S_EFF_OUTER` | Maximum Greenhouse Outward Flux | $S_\odot$ | $0.38\,S_\odot$ |
| `M0` | Stellar Progenitor Mass | $M_\odot$ | Sampled via `sampleIMF(rng)` |
| `tMS_Gyr` | Main Sequence Hydrogen Lifetime | $\text{Gyr}$ | Power-law scaling $M^{-2.75}$ to $M^{-1.35}$ |
| `giantCapacity` | Post-MS Giant Branch Capacity | Unitless $[0, 1]$ | $\frac{1}{1 + e^{-16(M_0 - 0.38)}}$ |
| `radiusRsun` | Stefan-Boltzmann Stellar Radius | $R_\odot$ | $\sqrt{L} / (T_{\text{eff}} / 5778)^2$ |
| `rInHZ` | Inward Habitable Zone Limit | $\text{AU}$ | $\sqrt{L / 1.25}$ |
| `rOutHZ` | Outward Habitable Zone Limit | $\text{AU}$ | $\sqrt{L / 0.38}$ |
| `snowLineAU` | Circumstellar Volatile Snowline | $\text{AU}$ | $2.7 \cdot \sqrt{L}$ |
| `currentA` | Instantaneous Planet Semi-Major Axis | $\text{AU}$ | $a_0 \cdot (M_0 / M_*(t))$ |
| `periodDays` | Planet Orbital Period | Days | $365.25 \cdot \sqrt{a(t)^3 / M_*(t)}$ |
| `fluxWm2` | Top-of-Atmosphere Insolation | $\text{W/m}^2$ | $1361 \cdot (L / a(t)^2)$ |
| `teq` | Equilibrium Blackbody Temperature | $\text{K}$ | $T_{\text{eff}} \sqrt{\frac{R_*(\text{AU})}{2a}} (1 - A)^{1/4}$ |
| `gravityG` | Surface Gravity Acceleration | Earth $g$ | $(M_p / M_\oplus) / (R_p / R_\oplus)^2$ |
| `isTidallyLocked` | Tidal Locking Status | Boolean | $a(t) < 0.22 \cdot M_*(t)^{1/3}$ |
