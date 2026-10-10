import * as THREE from 'three';

/**
 * Generates a soft radial star corona billboard sprite texture matching
 * the star's physical spectral temperature and color.
 */
export function createCoronaTexture(starColor: THREE.Color): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    const r = Math.round(starColor.r * 255);
    const g = Math.round(starColor.g * 255);
    const b = Math.round(starColor.b * 255);

    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.18, `rgba(${r}, ${g}, ${b}, 0.85)`);
    grad.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, 0.35)`);
    grad.addColorStop(0.75, `rgba(${r}, ${g}, ${b}, 0.08)`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
