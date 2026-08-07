
import { quantizeColor, activePaletteName } from './palette.js';

export class ScreenShake {
  constructor() {
    this.intensity = 0;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  addShake(amount) {
    this.intensity = Math.min(15, this.intensity + amount);
  }

  update() {
    if (this.intensity > 0.1) {
      this.offsetX = (Math.random() - 0.5) * this.intensity;
      this.offsetY = (Math.random() - 0.5) * this.intensity;
      this.intensity *= 0.88;
    } else {
      this.intensity = 0;
      this.offsetX = 0;
      this.offsetY = 0;
    }
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  addParticle(x, y, vx, vy, color, size, life) {
    this.particles.push({
      x,
      y,
      vx,
      vy,
      color,
      size,
      life,
      maxLife: life
    });
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 2), p.size, p.size);
    }
    ctx.globalAlpha = 1.0;
  }
}

export class Renderer {
  constructor(width = 320, height = 240) {
    this.width = width;
    this.height = height;

    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
    this.offCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    this.offCtx.imageRendering = 'pixelated';

    this.ditherEnabled = true;
  }

  getCanvas() {
    return this.offscreenCanvas;
  }

  getContext() {
    return this.offCtx;
  }

  clear() {
    this.offCtx.fillStyle = '#05040a';
    this.offCtx.fillRect(0, 0, this.width, this.height);
  }

  drawArenaGrid(arenaBounds) {
    const ctx = this.offCtx;

    ctx.fillStyle = '#0a0814';
    ctx.fillRect(arenaBounds.x, arenaBounds.y, arenaBounds.w, arenaBounds.h);

    ctx.strokeStyle = '#18142a';
    ctx.lineWidth = 1;

    const tileSize = 16;
    for (let x = arenaBounds.x; x < arenaBounds.x + arenaBounds.w; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, arenaBounds.y);
      ctx.lineTo(x, arenaBounds.y + arenaBounds.h);
      ctx.stroke();
    }

    for (let y = arenaBounds.y; y < arenaBounds.y + arenaBounds.h; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(arenaBounds.x, y);
      ctx.lineTo(arenaBounds.x + arenaBounds.w, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 2;
    ctx.strokeRect(arenaBounds.x, arenaBounds.y, arenaBounds.w, arenaBounds.h);
  }

  applyOrderedDithering() {
    if (!this.ditherEnabled) return;

    const imgData = this.offCtx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = (y * this.width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        const quantized = quantizeColor(r, g, b, x, y, activePaletteName, 0.25);

        data[idx] = quantized[0];
        data[idx + 1] = quantized[1];
        data[idx + 2] = quantized[2];
      }
    }

    this.offCtx.putImageData(imgData, 0, 0);
  }

  renderToScreen(screenCtx, mainWidth, mainHeight, screenShake) {
    screenCtx.save();
    screenCtx.clearRect(0, 0, mainWidth, mainHeight);

    screenCtx.imageSmoothingEnabled = false;

    if (screenShake) {
      screenCtx.translate(screenShake.offsetX, screenShake.offsetY);
    }

    screenCtx.drawImage(
      this.offscreenCanvas,
      0, 0, this.width, this.height,
      0, 0, mainWidth, mainHeight
    );

    screenCtx.restore();
  }
}