import React, { useEffect, useRef } from 'react';
import { StarSystem } from '../../types/astrophysics';
import { calculateStellarEvolution } from '../../core/astrophysics/evolution';

interface HRDiagramCanvasProps {
  selectedStar: StarSystem | null;
}

export const HRDiagramCanvas: React.FC<HRDiagramCanvasProps> = ({ selectedStar }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedStar) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const renderHR = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;

      ctx.fillStyle = '#02050e';
      ctx.fillRect(0, 0, w, h);

      const logTeffLeft = Math.log10(50000);
      const logTeffRight = Math.log10(2000);
      const logLMin = -4.5;
      const logLMax = 6.2;

      const padL = 26,
        padR = 8,
        padT = 8,
        padB = 14;
      const plotW = w - padL - padR;
      const plotH = h - padT - padB;

      const toXY = (teff: number, lum: number) => {
        const logT = Math.log10(Math.max(1800, teff));
        const logL = Math.log10(Math.max(1e-5, Math.min(1e7, lum)));
        const x = padL + ((logTeffLeft - logT) / (logTeffLeft - logTeffRight)) * plotW;
        const y = padT + ((logLMax - logL) / (logLMax - logLMin)) * plotH;
        return {
          x: Math.max(padL, Math.min(padL + plotW, x)),
          y: Math.max(padT, Math.min(padT + plotH, y)),
        };
      };

      // 1. Grid Lines
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
      ctx.lineWidth = 1;
      for (let p = -4; p <= 6; p += 2) {
        const pt = toXY(10000, Math.pow(10, p));
        ctx.beginPath();
        ctx.moveTo(padL, pt.y);
        ctx.lineTo(padL + plotW, pt.y);
        ctx.stroke();
      }

      // 2. Instability Strip (Pulsator Region)
      const pTopL = toXY(6800, 1e6);
      const pBotR = toXY(5000, 10);
      ctx.fillStyle = 'rgba(244, 63, 94, 0.08)';
      ctx.fillRect(pTopL.x, pTopL.y, pBotR.x - pTopL.x, pBotR.y - pTopL.y);

      // 3. Current Evolutionary Track Locus
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let s = 0; s <= 60; s++) {
        const testState = calculateStellarEvolution(
          selectedStar.progenitorMass,
          (s / 60) * 100.0
        );
        if (testState.Teff > 0) {
          const pt = toXY(testState.Teff, testState.L);
          if (s === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
      }
      ctx.stroke();

      // 4. Current Position Marker
      const cur = toXY(selectedStar.starState.Teff, selectedStar.starState.L);
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(cur.x, cur.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    };

    renderHR();
    const ro = new ResizeObserver(renderHR);
    ro.observe(parent);

    return () => ro.disconnect();
  }, [selectedStar, selectedStar?.progressPct]);

  return (
    <div
      id="section-06-hr-diagram"
      data-section="Hertzsprung-Russell Diagram Track"
      className="w-full h-full min-h-[7rem] bg-[#02050e] rounded border border-slate-800/80 relative overflow-hidden"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
