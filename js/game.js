(function() {
  'use strict';

  // --- 1. CONSTANTS & PALETTES ---
  const BAYER_4X4 = [
    [ 0/16,  8/16,  2/16, 10/16],
    [12/16,  4/16, 14/16,  6/16],
    [ 3/16, 11/16,  1/16,  9/16],
    [15/16,  7/16, 13/16,  5/16]
  ];

  const CYBER_ARCADE_PALETTE = [
    [5, 4, 10],
    [18, 14, 34],
    [45, 20, 75],
    [110, 25, 90],
    [255, 0, 85],
    [255, 60, 120],
    [0, 160, 200],
    [0, 240, 255],
    [0, 255, 170],
    [50, 220, 120],
    [255, 150, 0],
    [255, 183, 0],
    [255, 235, 60],
    [139, 92, 246],
    [200, 200, 220],
    [250, 250, 255]
  ];

  // Fast 32-bit packed color lookup cache (67MB RAM, zero garbage, O(1) access)
  const colorCache32 = new Uint32Array(16777216);
  function quantizeColorFast32(r, g, b, x, y, ditherStrength = 0.22) {
    const ditherValue = BAYER_4X4[y & 3][x & 3] - 0.5;
    const offset = ditherValue * ditherStrength * 255;
    const dr = (r + offset + 0.5) | 0;
    const dg = (g + offset + 0.5) | 0;
    const db = (b + offset + 0.5) | 0;
    const cr = dr < 0 ? 0 : (dr > 255 ? 255 : dr);
    const cg = dg < 0 ? 0 : (dg > 255 ? 255 : dg);
    const cb = db < 0 ? 0 : (db > 255 ? 255 : db);

    const key = (cr << 16) | (cg << 8) | cb;
    let cached = colorCache32[key];
    if (cached !== 0) return cached;

    let closest = CYBER_ARCADE_PALETTE[0];
    let minDistance = 1000000;
    for (let i = 0; i < CYBER_ARCADE_PALETTE.length; i++) {
      const c = CYBER_ARCADE_PALETTE[i];
      const dist = 0.3 * (cr - c[0]) ** 2 + 0.59 * (cg - c[1]) ** 2 + 0.11 * (cb - c[2]) ** 2;
      if (dist < minDistance) {
        minDistance = dist;
        closest = c;
      }
    }
    const packed = (255 << 24) | (closest[2] << 16) | (closest[1] << 8) | closest[0];
    colorCache32[key] = packed;
    return packed;
  }

  function fastRemove(arr, index) {
    const last = arr.pop();
    if (index < arr.length) arr[index] = last;
  }

  // --- 2. AUDIO SYNTHESIZER ---
  class SoundEngine {
    constructor() { this.ctx = null; this.initialized = false; }
    init() {
      if (this.initialized) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.35;
        this.masterGain.connect(this.ctx.destination);
        this.initialized = true;
      } catch (e) {}
    }
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

    playPew() {
      if (!this.initialized) return; this.resume();
      const pitchJitter = 0.92 + Math.random() * 0.16;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650 * pitchJitter, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120 * pitchJitter, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain); gain.connect(this.masterGain);
      osc.start(); osc.stop(this.ctx.currentTime + 0.08);
    }

    playBuild() {
      if (!this.initialized) return; this.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(850, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      osc.connect(gain); gain.connect(this.masterGain);
      osc.start(); osc.stop(this.ctx.currentTime + 0.15);
    }

    playExplosion() {
      if (!this.initialized) return; this.resume();
      const bufSize = (this.ctx.sampleRate * 0.25) | 0;
      const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      noise.connect(gain); gain.connect(this.masterGain);
      noise.start();
    }

    playMine() {
      if (!this.initialized) return; this.resume();
      const pitchJitter = 0.92 + Math.random() * 0.16;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(450 * pitchJitter, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150 * pitchJitter, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain); gain.connect(this.masterGain);
      osc.start(); osc.stop(this.ctx.currentTime + 0.12);
    }
  }
  const soundEngine = new SoundEngine();

  // --- 3. DYNAMIC JUICE CAMERA WITH RECOIL KICK & SCREEN SHAKE ---
  class Camera {
    constructor(width = 320, height = 224) {
      this.x = 0; this.y = 0;
      this.width = width; this.height = height;
      this.shakeTimer = 0; this.shakeMag = 0;
      this.kickX = 0; this.kickY = 0;
    }

    addShake(mag = 2.5, timer = 6) {
      this.shakeMag = Math.max(this.shakeMag, mag);
      this.shakeTimer = Math.max(this.shakeTimer, timer);
    }

    addKick(dirX, dirY, dist = 3.5) {
      this.kickX += dirX * dist;
      this.kickY += dirY * dist;
    }

    follow(targetX, targetY, minX = 0, minY = 0, maxX = MAP_TILES * TILE_SIZE, maxY = MAP_TILES * TILE_SIZE, dt = 1) {
      const destX = targetX - this.width / 2;
      const destY = targetY - this.height / 2;
      this.x += (destX - this.x) * 0.16;
      this.y += (destY - this.y) * 0.16;

      this.kickX *= Math.pow(0.72, dt);
      this.kickY *= Math.pow(0.72, dt);
      this.x += this.kickX;
      this.y += this.kickY;

      if (this.shakeTimer > 0) {
        this.shakeTimer -= dt;
        this.x += (Math.random() - 0.5) * this.shakeMag;
        this.y += (Math.random() - 0.5) * this.shakeMag;
        this.shakeMag *= Math.pow(0.85, dt);
      } else {
        this.shakeMag = 0;
      }

      const clampMinX = minX;
      const clampMaxX = Math.max(minX, maxX - this.width);
      const clampMinY = minY;
      const clampMaxY = Math.max(minY, maxY - this.height);

      this.x = Math.max(clampMinX, Math.min(clampMaxX, this.x));
      this.y = Math.max(clampMinY, Math.min(clampMaxY, this.y));
    }
  }

  // --- 3b. 1:1 CHUNKY 3x5 PIXEL BITMAP FONT (PURE HARDWARE PIXELS, NO ANTI-ALIASING) ---
  const FONT_3X5 = {
    'A': [0b010, 0b101, 0b111, 0b101, 0b101],
    'B': [0b110, 0b101, 0b110, 0b101, 0b110],
    'C': [0b011, 0b100, 0b100, 0b100, 0b011],
    'D': [0b110, 0b101, 0b101, 0b101, 0b110],
    'E': [0b111, 0b100, 0b110, 0b100, 0b111],
    'F': [0b111, 0b100, 0b110, 0b100, 0b100],
    'G': [0b011, 0b100, 0b101, 0b101, 0b011],
    'H': [0b101, 0b101, 0b111, 0b101, 0b101],
    'I': [0b111, 0b010, 0b010, 0b010, 0b111],
    'J': [0b001, 0b001, 0b001, 0b101, 0b010],
    'K': [0b101, 0b110, 0b100, 0b110, 0b101],
    'L': [0b100, 0b100, 0b100, 0b100, 0b111],
    'M': [0b101, 0b111, 0b101, 0b101, 0b101],
    'N': [0b101, 0b111, 0b111, 0b101, 0b101],
    'O': [0b010, 0b101, 0b101, 0b101, 0b010],
    'P': [0b110, 0b101, 0b110, 0b100, 0b100],
    'Q': [0b010, 0b101, 0b101, 0b110, 0b011],
    'R': [0b110, 0b101, 0b110, 0b101, 0b101],
    'S': [0b011, 0b100, 0b010, 0b001, 0b110],
    'T': [0b111, 0b010, 0b010, 0b010, 0b010],
    'U': [0b101, 0b101, 0b101, 0b101, 0b111],
    'V': [0b101, 0b101, 0b101, 0b101, 0b010],
    'W': [0b101, 0b101, 0b101, 0b111, 0b101],
    'X': [0b101, 0b101, 0b010, 0b101, 0b101],
    'Y': [0b101, 0b101, 0b010, 0b010, 0b010],
    'Z': [0b111, 0b001, 0b010, 0b100, 0b111],
    '0': [0b111, 0b101, 0b101, 0b101, 0b111],
    '1': [0b010, 0b110, 0b010, 0b010, 0b111],
    '2': [0b110, 0b001, 0b010, 0b100, 0b111],
    '3': [0b110, 0b001, 0b010, 0b001, 0b110],
    '4': [0b101, 0b101, 0b111, 0b001, 0b001],
    '5': [0b111, 0b100, 0b110, 0b001, 0b110],
    '6': [0b011, 0b100, 0b110, 0b101, 0b010],
    '7': [0b111, 0b001, 0b010, 0b010, 0b010],
    '8': [0b010, 0b101, 0b010, 0b101, 0b010],
    '9': [0b010, 0b101, 0b011, 0b001, 0b110],
    ':': [0b000, 0b010, 0b000, 0b010, 0b000],
    '-': [0b000, 0b000, 0b111, 0b000, 0b000],
    '+': [0b000, 0b010, 0b111, 0b010, 0b000],
    '%': [0b101, 0b001, 0b010, 0b100, 0b101],
    '&': [0b010, 0b101, 0b010, 0b101, 0b011],
    '*': [0b000, 0b101, 0b010, 0b101, 0b000],
    '#': [0b101, 0b111, 0b101, 0b111, 0b101],
    '>': [0b100, 0b010, 0b001, 0b010, 0b100],
    '<': [0b001, 0b010, 0b100, 0b010, 0b001],
    '.': [0b000, 0b000, 0b000, 0b000, 0b010],
    ',': [0b000, 0b000, 0b000, 0b010, 0b100],
    '!': [0b010, 0b010, 0b010, 0b000, 0b010],
    '?': [0b110, 0b001, 0b010, 0b000, 0b010],
    '[': [0b110, 0b100, 0b100, 0b100, 0b110],
    ']': [0b011, 0b001, 0b001, 0b001, 0b011],
    '(': [0b010, 0b100, 0b100, 0b100, 0b010],
    ')': [0b010, 0b001, 0b001, 0b001, 0b010],
    '/': [0b001, 0b001, 0b010, 0b100, 0b100],
    '|': [0b010, 0b010, 0b010, 0b010, 0b010],
    '=': [0b000, 0b111, 0b000, 0b111, 0b000],
    '•': [0b000, 0b000, 0b010, 0b000, 0b000],
    '▼': [0b000, 0b111, 0b111, 0b010, 0b000],
    '∞': [0b000, 0b111, 0b101, 0b111, 0b000],
    ' ': [0b000, 0b000, 0b000, 0b000, 0b000]
  };

  class PixelFont {
    static getTextWidth(str, scale = 1) {
      if (!str) return 0;
      const clean = str.replace(/🧪|🔬|📦|⚠️|👾/g, '#');
      return clean.length * (4 * scale);
    }

    static draw(ctx, str, startX, startY, color = '#ffffff', scale = 1, align = 'left', shadow = true) {
      if (!str) return;
      const upper = str.toUpperCase().replace(/🧪/g, '%').replace(/🔬|📦|⚠️|👾/g, '*');
      const totalW = upper.length * (4 * scale) - scale;
      
      let curX = Math.floor(startX);
      if (align === 'center') curX -= Math.floor(totalW / 2);
      else if (align === 'right') curX -= totalW;
      const curY = Math.floor(startY);

      for (let i = 0; i < upper.length; i++) {
        const char = upper[i];
        const glyph = FONT_3X5[char] || FONT_3X5['?'] || [0, 0, 0, 0, 0];

        // Draw shadow
        if (shadow) {
          ctx.fillStyle = '#040308';
          for (let row = 0; row < 5; row++) {
            const bits = glyph[row];
            if (bits & 0b100) ctx.fillRect(curX + scale, curY + (row * scale) + scale, scale, scale);
            if (bits & 0b010) ctx.fillRect(curX + scale + scale, curY + (row * scale) + scale, scale, scale);
            if (bits & 0b001) ctx.fillRect(curX + 2 * scale + scale, curY + (row * scale) + scale, scale, scale);
          }
        }

        // Draw main char
        ctx.fillStyle = color;
        for (let row = 0; row < 5; row++) {
          const bits = glyph[row];
          if (bits & 0b100) ctx.fillRect(curX, curY + (row * scale), scale, scale);
          if (bits & 0b010) ctx.fillRect(curX + scale, curY + (row * scale), scale, scale);
          if (bits & 0b001) ctx.fillRect(curX + 2 * scale, curY + (row * scale), scale, scale);
        }

        curX += 4 * scale;
      }
    }

    static drawStretched(ctx, str, centerX, startY, targetWidth, color = '#ffffff', scale = 1, shadow = true) {
      if (!str) return;
      const upper = str.toUpperCase();
      const n = upper.length;
      if (n === 0) return;
      const glyphW = 3 * scale;
      const totalGlyphW = n * glyphW;
      const totalGap = Math.max(0, targetWidth - totalGlyphW);
      const gap = n > 1 ? totalGap / (n - 1) : 0;

      const curY = Math.floor(startY);
      const startX = Math.floor(centerX - targetWidth / 2);

      for (let i = 0; i < n; i++) {
        const char = upper[i];
        const glyph = FONT_3X5[char] || FONT_3X5['?'] || [0, 0, 0, 0, 0];
        const curX = Math.floor(startX + i * (glyphW + gap));

        if (shadow) {
          ctx.fillStyle = '#040308';
          for (let row = 0; row < 5; row++) {
            const bits = glyph[row];
            if (bits & 0b100) ctx.fillRect(curX + scale, curY + (row * scale) + scale, scale, scale);
            if (bits & 0b010) ctx.fillRect(curX + scale + scale, curY + (row * scale) + scale, scale, scale);
            if (bits & 0b001) ctx.fillRect(curX + 2 * scale + scale, curY + (row * scale) + scale, scale, scale);
          }
        }

        ctx.fillStyle = color;
        for (let row = 0; row < 5; row++) {
          const bits = glyph[row];
          if (bits & 0b100) ctx.fillRect(curX, curY + (row * scale), scale, scale);
          if (bits & 0b010) ctx.fillRect(curX + scale, curY + (row * scale), scale, scale);
          if (bits & 0b001) ctx.fillRect(curX + 2 * scale, curY + (row * scale), scale, scale);
        }
      }
    }
  }

  // --- 4. A* PATHFINDING ENGINE ---
  const TILE_SIZE = 32;
  const MAP_TILES = 48; // 48x48 = 1536x1536 world pixels

  const astarNodes = new Int32Array(MAP_TILES * MAP_TILES * 3);
  const astarRunId = new Int32Array(MAP_TILES * MAP_TILES);
  const astarInOpen = new Int32Array(MAP_TILES * MAP_TILES);
  let currentRunId = 0;

  class AStarPathfinder {
    static findPath(startX, startY, targetX, targetY, mapGrid) {
      const stx = Math.max(0, Math.min(MAP_TILES - 1, (startX / TILE_SIZE) | 0));
      const sty = Math.max(0, Math.min(MAP_TILES - 1, (startY / TILE_SIZE) | 0));
      const ttx = Math.max(0, Math.min(MAP_TILES - 1, (targetX / TILE_SIZE) | 0));
      const tty = Math.max(0, Math.min(MAP_TILES - 1, (targetY / TILE_SIZE) | 0));

      if (stx === ttx && sty === tty) return [];

      currentRunId++;
      const runId = currentRunId;
      
      const openSet = [];
      const startIdx = sty * MAP_TILES + stx;
      
      astarRunId[startIdx] = runId;
      astarNodes[startIdx * 3] = 0;
      astarNodes[startIdx * 3 + 1] = Math.abs(stx - ttx) + Math.abs(sty - tty);
      astarNodes[startIdx * 3 + 2] = -1;
      astarInOpen[startIdx] = runId;
      
      openSet.push(startIdx);

      let iterations = 0;
      const maxIterations = 160;

      while (openSet.length > 0 && iterations++ < maxIterations) {
        let minF = 9999999;
        let openArrIdx = -1;
        for (let i = 0; i < openSet.length; i++) {
          const idx = openSet[i];
          const f = astarNodes[idx * 3 + 1];
          if (f < minF) {
            minF = f;
            openArrIdx = i;
          }
        }

        const currIdx = openSet[openArrIdx];
        const cx = currIdx % MAP_TILES;
        const cy = (currIdx / MAP_TILES) | 0;

        if (cx === ttx && cy === tty) {
          const path = [];
          let currTrace = currIdx;
          while (currTrace !== -1 && currTrace !== startIdx) {
            const tx = currTrace % MAP_TILES;
            const ty = (currTrace / MAP_TILES) | 0;
            path.push({ x: tx * TILE_SIZE + 16, y: ty * TILE_SIZE + 16 });
            currTrace = astarNodes[currTrace * 3 + 2];
          }
          return path.reverse();
        }

        const last = openSet.pop();
        if (openArrIdx < openSet.length) openSet[openArrIdx] = last;
        astarInOpen[currIdx] = 0;

        const neighbors = [
          currIdx + 1,
          currIdx - 1,
          currIdx + MAP_TILES,
          currIdx - MAP_TILES
        ];

        const cg = astarNodes[currIdx * 3];

        for (let i = 0; i < 4; i++) {
          const nIdx = neighbors[i];
          if (nIdx < 0 || nIdx >= MAP_TILES * MAP_TILES) continue;
          
          const nx = nIdx % MAP_TILES;
          const ny = (nIdx / MAP_TILES) | 0;
          
          if (i === 0 && nx === 0) continue;
          if (i === 1 && nx === MAP_TILES - 1) continue;

          if (WFCLevelGenerator.isSolid(mapGrid[ny][nx])) continue;

          const ng = cg + 1;

          if (astarRunId[nIdx] !== runId) {
            astarRunId[nIdx] = runId;
            astarNodes[nIdx * 3] = ng;
            astarNodes[nIdx * 3 + 1] = ng + Math.abs(nx - ttx) + Math.abs(ny - tty);
            astarNodes[nIdx * 3 + 2] = currIdx;
            
            openSet.push(nIdx);
            astarInOpen[nIdx] = runId;
          } else if (ng < astarNodes[nIdx * 3]) {
            astarNodes[nIdx * 3] = ng;
            astarNodes[nIdx * 3 + 1] = ng + Math.abs(nx - ttx) + Math.abs(ny - tty);
            astarNodes[nIdx * 3 + 2] = currIdx;
            
            if (astarInOpen[nIdx] !== runId) {
              openSet.push(nIdx);
              astarInOpen[nIdx] = runId;
            }
          }
        }
      }

      return [{ x: targetX, y: targetY }];
    }
  }

  // --- 5. PARTICLE JUICE ENGINE WITH ZERO-ALLOCATION OBJECT POOL ---
  const MAX_POOLED_PARTICLES = 800;
  class ParticleManager {
    constructor() {
      this.particles = [];
      this.pool = [];
      for (let i = 0; i < MAX_POOLED_PARTICLES; i++) {
        this.pool.push({
          x: 0, y: 0, vx: 0, vy: 0, color: '#ffffff', size: 1, life: 0, maxLife: 0,
          isSmoke: false, isShockwave: false, isFireball: false, growth: 0,
          type: 'normal', baseColor: null, lineW: 2.0, curl: 0, isBg: false,
          seed: 0, extra: null, z: 0, vz: 0, bounces: 0
        });
      }
    }

    obtain(x, y, vx, vy, color, size, life, isSmoke = false, growth = 0, isShockwave = false, isFireball = false, type = 'normal', baseColor = null, lineW = 2.0, curl = 0, isBg = false, extra = null) {
      const p = this.pool.pop() || { x, y, vx, vy, color, size, life, maxLife: life, isSmoke, growth, isShockwave, isFireball, type, baseColor, lineW, curl, isBg, seed: 0, extra: null, z: 0, vz: 0, bounces: 0 };
      p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.color = color; p.size = size; p.life = life; p.maxLife = life;
      p.isSmoke = isSmoke; p.growth = growth; p.isShockwave = isShockwave; p.isFireball = isFireball;
      p.type = type; p.baseColor = baseColor; p.lineW = lineW; p.curl = curl; p.isBg = isBg;
      p.seed = (Math.random() * 100) | 0;
      p.extra = extra;
      p.z = 0;
      p.vz = 0;
      p.bounces = 0;
      return p;
    }

    release(p) {
      if (this.pool.length < MAX_POOLED_PARTICLES) this.pool.push(p);
    }

    addSparks(x, y, color = '#33ff66', count = 6) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.0 + Math.random() * 3.5;
        this.particles.push(this.obtain(
          x, y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          color,
          1.2 + Math.random() * 1.8,
          8 + Math.floor(Math.random() * 10)
        ));
      }
    }

    addTrail(x, y, color = '#00ffaa', size = 2) {
      this.particles.push(this.obtain(x, y, 0, 0, color, size, 6));
    }

    addRocketTrail(x, y, vx, vy, flightTime = 0) {
      // Fluid-Advection Wobble & Noise Turbulence (inspired by fire.html fluid flow)
      const n = Math.sin(flightTime * 0.43) * 0.5 + Math.sin(flightTime * 1.1 + 1.7) * 0.3 + Math.cos(flightTime * 2.3 - 0.5) * 0.2;
      const wobbleAngle = n * 0.55 + (Math.random() - 0.5) * 0.12;
      const baseAngle = Math.atan2(vy, vx);
      const baseExhaustAngle = baseAngle + Math.PI;
      const exhaustAngle = baseExhaustAngle + wobbleAngle;

      const nozzleX = x - Math.cos(baseAngle) * 5;
      const nozzleY = y - Math.sin(baseAngle) * 5;

      const flameLen = 6.0 + Math.random() * 5.5;
      const flameTipX = nozzleX + Math.cos(exhaustAngle) * flameLen;
      const flameTipY = nozzleY + Math.sin(exhaustAngle) * flameLen;

      // 1. Fluid Plasma Flame Puff (fire.html 3-tier heat: White -> Gold #ffbf00 -> Orange #f21a0d -> Crimson #660505)
      const flameSpeed = 0.4 + Math.random() * 0.6;
      this.particles.push(this.obtain(
        nozzleX + (Math.random() - 0.5) * 1.5,
        nozzleY + (Math.random() - 0.5) * 1.5,
        Math.cos(exhaustAngle) * flameSpeed,
        Math.sin(exhaustAngle) * flameSpeed,
        '#ffbf00',
        2.5 + Math.random() * 2.0,
        7 + Math.floor(Math.random() * 5),
        false,
        0.12,
        false,
        true,
        'fireLobe',
        null, 2.0,
        (Math.random() - 0.5) * 0.08
      ));

      // 2. Soft airy smoke clouds seamlessly birthed at flame tip (dissolves from ash -> slate -> dusk)
      if (Math.random() < 0.88) {
        const puffSpeed = (0.12 + Math.random() * 0.28) * 0.5;
        const puffLife = 40 + Math.floor(Math.random() * 100);
        this.particles.push(this.obtain(
          flameTipX + (Math.random() - 0.5) * 2,
          flameTipY + (Math.random() - 0.5) * 2,
          Math.cos(exhaustAngle) * puffSpeed,
          Math.sin(exhaustAngle) * puffSpeed,
          '#968ea6',
          4.0 + Math.random() * 4.0,
          puffLife,
          true,
          0.16 + Math.random() * 0.16,
          false, false,
          'combo',
          null, 2.0, 0, false
        ));
      }

      // 3. Expanding fluid donut rings
      if (Math.random() < 0.28) {
        const ringSpeed = (0.24 + Math.random() * 0.18) * 0.5;
        const ringLife = 35 + Math.floor(Math.random() * 55);
        this.particles.push(this.obtain(
          flameTipX - Math.cos(baseAngle) * 2,
          flameTipY - Math.sin(baseAngle) * 2,
          Math.cos(exhaustAngle) * ringSpeed,
          Math.sin(exhaustAngle) * ringSpeed,
          '#aaa0bc',
          3.5 + Math.random() * 2.0,
          ringLife,
          false,
          0.20 + Math.random() * 0.12,
          false, false,
          'donut',
          null, 2.0, 0, false
        ));
      }
    }

    addExplosion(x, y, color = '#ff3355', count = 14) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.0 + Math.random() * 4.5;
        this.particles.push(this.obtain(
          x, y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          Math.random() < 0.5 ? color : '#ffb700',
          2.0 + Math.random() * 2.5,
          12 + Math.floor(Math.random() * 12)
        ));
      }
    }

    addEpicBlast(x, y, gameRef) {
      // 1. Initial White-Hot Optical Flash Core
      this.particles.push(this.obtain(x, y, 0, 0, '#ffffff', 10, 3, false, 2.0, false, true, 'flash'));

      // 2. Central Mega Fireball (Full solid filled plasma sphere)
      this.particles.push(this.obtain(
        x, y, 0, 0, '#ffbf00', 8.0, 16, false, 0.85, false, true, 'solidFireball'
      ));

      // 3. 10 Expanding Multi-Offset Full Red-Orange Fireball Circles (Full circles, not outlines!)
      const circleCount = 10;
      for (let i = 0; i < circleCount; i++) {
        const ang = (i / circleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
        const dist = 2 + Math.random() * 6;
        const speed = 0.5 + Math.random() * 1.5;
        const life = 12 + Math.floor(Math.random() * 10);
        const baseSize = 6.0 + Math.random() * 5.0;

        this.particles.push(this.obtain(
          x + Math.cos(ang) * dist,
          y + Math.sin(ang) * dist,
          Math.cos(ang) * speed,
          Math.sin(ang) * speed,
          '#ffbf00',
          baseSize,
          life,
          false,
          0.50 + Math.random() * 0.35,
          false,
          true,
          'solidFireball'
        ));
      }

      // 4. Heavy Molten Burning Embers & Sparks
      for (let i = 0; i < 24; i++) {
        const ang = Math.random() * Math.PI * 2;
        const speed = 2.0 + Math.random() * 4.5;
        this.particles.push(this.obtain(
          x, y,
          Math.cos(ang) * speed,
          Math.sin(ang) * speed,
          Math.random() < 0.5 ? '#ffea00' : (Math.random() < 0.5 ? '#ff4400' : '#ff1100'),
          1.5 + Math.random() * 1.5,
          14 + Math.floor(Math.random() * 14),
          false,
          0,
          false,
          false,
          'spark'
        ));
      }

      // 5. Floor Shrapnel & Debris Chunks (skids along floor)
      for (let i = 0; i < 16; i++) {
        const ang = Math.random() * Math.PI * 2;
        const speed = 1.8 + Math.random() * 3.8;
        const col = Math.random() < 0.5 ? '#5c5270' : '#827898';

        this.particles.push(this.obtain(
          x + (Math.random() - 0.5) * 3,
          y + (Math.random() - 0.5) * 3,
          Math.cos(ang) * speed,
          Math.sin(ang) * speed,
          col,
          1.5 + Math.random() * 1.5,
          16 + Math.floor(Math.random() * 14),
          false,
          0,
          false,
          false,
          'debris',
          null, 2.0, 0, false,
          {
            drag: 0.84,
            rot: (Math.random() - 0.5) * 0.35,
            angle: Math.random() * Math.PI,
            aspect: 0.6 + Math.random() * 0.5
          }
        ));
      }

      // 6. Organic Multi-Lobe Charring (Multiply-blend shades existing blood without erasing)
      if (gameRef && gameRef.debrisManager && gameRef.debrisManager.bloodCtx) {
        const bctx = gameRef.debrisManager.bloodCtx;
        bctx.save();
        bctx.globalCompositeOperation = 'multiply';
        for (let s = 0; s < 14; s++) {
          const sa = Math.random() * Math.PI * 2;
          const sr = Math.random() * 15;
          const sx = Math.floor(x + Math.cos(sa) * sr);
          const sy = Math.floor(y + Math.sin(sa) * sr);
          const sRad = 2 + Math.floor(Math.random() * 3);
          bctx.fillStyle = 'rgba(70, 45, 55, 0.40)';
          bctx.beginPath();
          bctx.arc(sx, sy, sRad, 0, Math.PI * 2);
          bctx.fill();
        }
        bctx.restore();
      }

      // 7. Camera Screen Shake
      if (gameRef && gameRef.camera) {
        gameRef.camera.addShake(9.0, 14);
      }
    }

    addChitinDebris(x, y, color = '#33ff66', count = 5) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 4.0;
        this.particles.push(this.obtain(
          x, y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          color,
          1.5 + Math.random() * 2.2,
          15 + Math.floor(Math.random() * 12)
        ));
      }
    }

    update(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        if (p.curl) {
          const vx0 = p.vx, vy0 = p.vy;
          p.vx = vx0 - vy0 * p.curl;
          p.vy = vy0 + vx0 * p.curl;
        }

        if (p.type === 'debris' && p.extra) {
          p.vx *= Math.pow(p.extra.drag, dt);
          p.vy *= Math.pow(p.extra.drag, dt);
          p.extra.angle += p.extra.rot * dt;
        } else if (p.type === 'spark' || p.type === 'moltenSpark') {
          p.vx *= Math.pow(0.88, dt);
          p.vy *= Math.pow(0.88, dt);
        } else if (p.type === 'solidFireball') {
          p.vx *= Math.pow(0.86, dt);
          p.vy *= Math.pow(0.86, dt);
        } else if (!p.isSmoke && p.type !== 'donut' && p.type !== 'combo' && p.type !== 'volumetricFire') {
          p.vx *= Math.pow(0.84, dt);
          p.vy *= Math.pow(0.84, dt);
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.growth > 0) p.size += p.growth * dt;
        p.life -= dt;

        if (p.life <= 0) {
          this.release(p);
          fastRemove(this.particles, i);
        }
      }
    }

    draw(ctx, camX, camY) {
      for (let p of this.particles) {
        const px = Math.floor(p.x - camX);
        const py = Math.floor(p.y - camY);
        if (px < -40 || px > 360 || py < -40 || py > 264) continue;

        const r = Math.max(1, Math.floor(p.size * 0.5));
        const r2 = r * r;
        const rInt = Math.ceil(r);
        const alphaRatio = p.life / p.maxLife;
        const seed = p.seed || 12;

        const camXInt = Math.floor(camX);
        const camYInt = Math.floor(camY);

        if (p.type === 'flash') {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'spark' || p.type === 'moltenSpark') {
          ctx.fillStyle = alphaRatio > 0.6 ? '#ffea00' : (alphaRatio > 0.3 ? '#ff4400' : '#ff1100');
          ctx.fillRect(px - 1, py - 1, 2, 2);
        } else if (p.type === 'debris') {
          ctx.save();
          ctx.translate(px, py);
          if (p.extra) ctx.rotate(p.extra.angle);
          ctx.fillStyle = p.color;
          const sz = Math.max(1, Math.floor(p.size));
          const w = sz;
          const h = Math.max(1, Math.floor(sz * (p.extra ? p.extra.aspect : 0.6)));
          ctx.fillRect(-(w >> 1), -(h >> 1), w, h);
          ctx.restore();
        } else if (p.type === 'solidFireball' || p.type === 'volumetricFire' || p.type === 'fireLobe') {
          // FULL SOLID RED-ORANGE EXPANDING PLASMA CIRCLE (Phase-locked Bayer dither)
          for (let dy = -rInt; dy <= rInt; dy++) {
            for (let dx = -rInt; dx <= rInt; dx++) {
              const d2 = dx * dx + dy * dy;
              if (d2 <= r2) {
                const normD = Math.sqrt(d2) / r;
                const sx = px + dx;
                const sy = py + dy;
                const worldX = sx + camXInt;
                const worldY = sy + camYInt;
                const bVal = BAYER_4X4[worldY & 3][worldX & 3];

                // Rich Red-Orange Full Solid Circle Color Ramp
                if (alphaRatio > 0.70) {
                  // Fresh hot stage
                  if (normD < 0.45) {
                    ctx.fillStyle = '#ffffff'; // White core
                  } else if (normD < 0.75) {
                    ctx.fillStyle = '#ffea00'; // Intense yellow-gold
                  } else {
                    ctx.fillStyle = '#ff3300'; // Blazing orange-red
                  }
                  ctx.fillRect(sx, sy, 1, 1);
                } else if (alphaRatio > 0.35) {
                  // Expanding solid red-orange stage
                  if (normD < 0.50) {
                    ctx.fillStyle = '#ffb700'; // Bright gold
                  } else if (normD < 0.80) {
                    ctx.fillStyle = '#f21a0d'; // Vivid orange-red
                  } else {
                    ctx.fillStyle = '#990011'; // Dark crimson edge
                  }
                  ctx.fillRect(sx, sy, 1, 1);
                } else {
                  // Cooling ember stage with dithered edge
                  if (normD < 0.55) {
                    ctx.fillStyle = '#c41008'; // Deep red
                    ctx.fillRect(sx, sy, 1, 1);
                  } else if (bVal < alphaRatio * 1.6) {
                    ctx.fillStyle = '#5a0008'; // Dark magma soot
                    ctx.fillRect(sx, sy, 1, 1);
                  }
                }
              }
            }
          }
        } else if (p.type === 'donut') {
          // Organic Deformed Ring with End-of-Life Cooling
          const ringCol = alphaRatio > 0.5 ? (p.color || '#aaa0bc') : '#584e68';
          ctx.fillStyle = ringCol;
          const ringThreshold = alphaRatio * 0.50;
          for (let dy = -rInt; dy <= rInt; dy++) {
            for (let dx = -rInt; dx <= rInt; dx++) {
              const d = Math.sqrt(dx * dx + dy * dy);
              const ang = Math.atan2(dy, dx);
              const warp = 1.0 + Math.sin(ang * 3 + seed) * 0.18 + Math.cos(ang * 5 + seed * 1.5) * 0.10;
              const maxR = r * warp;
              const inR = Math.max(0, maxR - 2.0);

              if (d <= maxR && d >= inR) {
                const sx = px + dx;
                const sy = py + dy;
                const worldX = sx + camXInt;
                const worldY = sy + camYInt;
                const bVal = BAYER_4X4[worldY & 3][worldX & 3];
                if (bVal < ringThreshold) {
                  ctx.fillRect(sx, sy, 1, 1);
                }
              }
            }
          }
        } else if (p.type === 'combo' || p.isSmoke) {
          // Organic Deformed Asymmetric Cloud with End-of-Life Darkening
          let smokeCol = '#968ea6';
          if (alphaRatio < 0.35) smokeCol = '#3e354c';
          else if (alphaRatio < 0.65) smokeCol = '#645a75';
          ctx.fillStyle = smokeCol;

          for (let dy = -rInt; dy <= rInt; dy++) {
            for (let dx = -rInt; dx <= rInt; dx++) {
              const d = Math.sqrt(dx * dx + dy * dy);
              const ang = Math.atan2(dy, dx);
              const warp = 1.0 + Math.sin(ang * 3 + seed) * 0.24 + Math.cos(ang * 5 + seed * 2.1) * 0.14;
              const maxR = r * warp;

              if (d <= maxR) {
                const sx = px + dx;
                const sy = py + dy;
                const normD = d / maxR;
                const worldX = sx + camXInt;
                const worldY = sy + camYInt;
                const bVal = BAYER_4X4[worldY & 3][worldX & 3];

                // Smooth continuous threshold fading smoothly into transparency
                const threshold = alphaRatio * Math.max(0, 0.58 - normD * 0.42);
                if (bVal < threshold) {
                  ctx.fillRect(sx, sy, 1, 1);
                }
              }
            }
          }
        } else {
          // Spark / small particle point
          const sz = Math.max(1, Math.floor(p.size));
          ctx.fillStyle = p.color;
          ctx.fillRect(px - (sz >> 1), py - (sz >> 1), sz, sz);
        }
      }
    }
  }

  // --- 6. FLOATING COMBAT NUMBERS ENGINE ---
  class PopupManager {
    constructor() { this.popups = []; }

    addPopup(x, y, text, color = '#ffffff') {
      this.popups.push({
        x, y, text, color, life: 25, maxLife: 25
      });
    }

    update(dt) {
      for (let i = this.popups.length - 1; i >= 0; i--) {
        const p = this.popups[i];
        p.y -= 0.6 * dt;
        p.life -= dt;
        if (p.life <= 0) fastRemove(this.popups, i);
      }
    }

    draw(ctx, camX, camY) {
      for (let p of this.popups) {
        const px = Math.floor(p.x - camX);
        const py = Math.floor(p.y - camY);
        if (px < -20 || px > 340 || py < -20 || py > 244) continue;
        PixelFont.draw(ctx, p.text, px, py, p.color, 1, 'center', true);
      }
    }
  }

  // --- 7. CLEAN DUNGEON GENERATOR ---
  const TILES = {
    VOID: -1,
    FLOOR: 1,
    WALL_TOP: 2,
    PORTAL: 3,
    ORE: 4,
    GATE: 5,
    DOOR: 6,
    DOOR_OPEN: 7
  };

  class WFCLevelGenerator {
    static generateMap() {
      const grid = Array(MAP_TILES).fill(-1).map(() => Array(MAP_TILES).fill(TILES.VOID));
      const oreHp = Array(MAP_TILES).fill(0).map(() => Array(MAP_TILES).fill(0));

      const cx = 24, cy = 24;
      for (let y = cy - 3; y <= cy + 3; y++) {
        for (let x = cx - 3; x <= cx + 3; x++) {
          grid[y][x] = TILES.FLOOR;
        }
      }

      const numRooms = 8 + Math.floor(Math.random() * 4);
      const rooms = [{ x: cx, y: cy, w: 7, h: 7 }];

      for (let i = 0; i < numRooms; i++) {
        const rw = 6 + Math.floor(Math.random() * 4);
        const rh = 6 + Math.floor(Math.random() * 4);
        const rx = 4 + Math.floor(Math.random() * (MAP_TILES - rw - 8));
        const ry = 4 + Math.floor(Math.random() * (MAP_TILES - rh - 8));

        rooms.push({ x: rx, y: ry, w: rw, h: rh });

        for (let y = ry; y < ry + rh; y++) {
          for (let x = rx; x < rx + rw; x++) {
            grid[y][x] = TILES.FLOOR;
          }
        }
      }

      for (let i = 1; i < rooms.length; i++) {
        const r1 = rooms[i - 1];
        const r2 = rooms[i];
        let currX = r1.x;
        let currY = r1.y;
        let doorPlaced = false;

        while (currX !== r2.x) {
          grid[currY][currX] = TILES.FLOOR;
          grid[Math.min(MAP_TILES - 1, currY + 1)][currX] = TILES.FLOOR;
          currX += currX < r2.x ? 1 : -1;
        }
        while (currY !== r2.y) {
          grid[currY][currX] = TILES.FLOOR;
          grid[currY][Math.min(MAP_TILES - 1, currX + 1)] = TILES.FLOOR;
          currY += currY < r2.y ? 1 : -1;
        }
      }

      // Generate 2-layer thick walls around all floor tiles so mining ore never reveals void
      for (let y = 1; y < MAP_TILES - 1; y++) {
        for (let x = 1; x < MAP_TILES - 1; x++) {
          if (grid[y][x] === TILES.VOID) {
            let distToFloor = 99;
            for (let dy = -2; dy <= 2; dy++) {
              for (let dx = -2; dx <= 2; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < MAP_TILES && ny >= 0 && ny < MAP_TILES) {
                  if (grid[ny][nx] === TILES.FLOOR) {
                    const d = Math.max(Math.abs(dx), Math.abs(dy));
                    if (d < distToFloor) distToFloor = d;
                  }
                }
              }
            }

            if (distToFloor === 1) {
              if (Math.random() < 0.18) {
                grid[y][x] = TILES.ORE;
                oreHp[y][x] = 30;
              } else {
                grid[y][x] = TILES.WALL_TOP;
              }
            } else if (distToFloor === 2) {
              grid[y][x] = TILES.WALL_TOP;
            }
          }
        }
      }

      const portalCount = 4;
      for (let i = 0; i < portalCount; i++) {
        const room = rooms[rooms.length - 1 - i];
        if (room) grid[room.y][room.x] = TILES.PORTAL;
      }

      const gateRoom = rooms[rooms.length - 1];
      if (gateRoom) grid[gateRoom.y + 1][gateRoom.x + 1] = TILES.GATE;

      return { grid, rooms, oreHp };
    }

    static isSolid(tile) {
      return tile === TILES.VOID || tile === TILES.WALL_TOP || tile === TILES.ORE;
    }

    static checkCollision(x, y, radius, mapGrid) {
      const minTileX = Math.floor((x - radius) / TILE_SIZE);
      const maxTileX = Math.floor((x + radius) / TILE_SIZE);
      const minTileY = Math.floor((y - radius) / TILE_SIZE);
      const maxTileY = Math.floor((y + radius) / TILE_SIZE);

      for (let ty = minTileY; ty <= maxTileY; ty++) {
        for (let tx = minTileX; tx <= maxTileX; tx++) {
          if (tx < 0 || tx >= MAP_TILES || ty < 0 || ty >= MAP_TILES || WFCLevelGenerator.isSolid(mapGrid[ty][tx])) {
            const tileMinX = tx * TILE_SIZE;
            const tileMaxX = tileMinX + TILE_SIZE;
            const tileMinY = ty * TILE_SIZE;
            const tileMaxY = tileMinY + TILE_SIZE;

            const closestX = Math.max(tileMinX, Math.min(x, tileMaxX));
            const closestY = Math.max(tileMinY, Math.min(y, tileMaxY));

            const distX = x - closestX;
            const distY = y - closestY;
            if (distX * distX + distY * distY < radius * radius) return true;
          }
        }
      }
      return false;
    }
  }

  // --- 8. BIOMES & WEAPONS ---
  const BIOMES = {
    BUNKER: { id: 'BUNKER', name: 'AI BUNKER', floorColor: '#0c0919', rockColor: '#1c152b', wallColor: '#ff0055' },
    DESERT: { id: 'DESERT', name: 'DESERT RUINS', floorColor: '#1c1208', rockColor: '#36230f', wallColor: '#ffb700' },
    CITY: { id: 'CITY', name: 'CYBER CITY', floorColor: '#040d1a', rockColor: '#0c1b30', wallColor: '#00f0ff' }
  };

  const WEAPONS = {
    PLASMA: { name: 'BIO PLASMA', color: '#00ffaa', fireRate: 140, spread: 0.0, speed: 8.0, damage: 20, size: 4, knockback: 2.0 },
    ACID_SHOTGUN: { name: 'ACID SHOTGUN', color: '#33ff66', fireRate: 380, spread: 0.20, speed: 7.0, damage: 14, bullets: 5, size: 3, knockback: 3.5 },
    SWARM_NEEDLE: { name: 'SWARM NEEDLES', color: '#ffb700', fireRate: 75, spread: 0.04, speed: 9.5, damage: 10, size: 2, knockback: 1.2 },
    VOID_RAIL: { name: 'VOID RAILGUN', color: '#00f0ff', fireRate: 580, spread: 0.0, speed: 15.0, damage: 85, size: 5, piercing: true, knockback: 5.0 },
    ROCKET: { name: 'ROCKET LAUNCHER', color: '#ff3300', fireRate: 550, spread: 0.02, speed: 6.5, damage: 300, size: 5, explosionRadius: 45, knockback: 7.5 }
  };

  // --- 9. PROCEDURAL BLOOD & DEBRIS ---
  class DebrisManager {
    constructor() {
      this.flyingBlood = [];
      this.settlingStains = [];
      this.bloodCanvas = null;
      this.bloodCtx = null;
    }

    initBloodCanvas() {
      if (!this.bloodCanvas) {
        this.bloodCanvas = document.createElement('canvas');
        this.bloodCanvas.width = MAP_TILES * TILE_SIZE;
        this.bloodCanvas.height = MAP_TILES * TILE_SIZE;
        this.bloodCtx = this.bloodCanvas.getContext('2d');
      } else {
        this.bloodCtx.clearRect(0, 0, this.bloodCanvas.width, this.bloodCanvas.height);
      }
      this.settlingStains = [];
    }

    getBloodPalette(enemyColor) {
      if (enemyColor && typeof enemyColor === 'object' && 'r' in enemyColor) {
        return { r: enemyColor.r, g: enemyColor.g, b: enemyColor.b };
      }
      let r = 130, g = 20, b = 35;
      if (enemyColor && typeof enemyColor === 'string' && enemyColor.startsWith('#')) {
        const hex = enemyColor.substring(1);
        if (hex.length === 6) {
          const er = parseInt(hex.substring(0, 2), 16);
          const eg = parseInt(hex.substring(2, 4), 16);
          const eb = parseInt(hex.substring(4, 6), 16);
          r = Math.floor(er * 0.75);
          g = Math.floor(eg * 0.75);
          b = Math.floor(eb * 0.75);
        }
      }
      return { r, g, b };
    }

    addBloodSpray(x, y, dirX, dirY, isFatal = false, enemyColor = null, mapGrid = null, enemySize = 7) {
      let baseAngle = Math.atan2(dirY, dirX);
      const baseCol = this.getBloodPalette(enemyColor);

      let countBase = 2;
      let fatalCountBase = 7;
      let stainBase = 2.0;
      let sizeScale = 0.6;

      if (enemySize <= 7) {
        countBase = 2;
        fatalCountBase = 7;
        stainBase = 2.0;
        sizeScale = 0.6;
      } else if (enemySize <= 10) {
        countBase = 3;
        fatalCountBase = 14;
        stainBase = 3.5;
        sizeScale = 1.0;
      } else {
        countBase = 4;
        fatalCountBase = 42;
        stainBase = 4.8;
        sizeScale = 1.5;
      }

      const count = isFatal ? (fatalCountBase + Math.floor(Math.random() * (fatalCountBase * 0.3))) : (Math.max(1, countBase - 1) + Math.floor(Math.random() * 2));

      for (let i = 0; i < count; i++) {
        let spreadAngle;
        let speed;

        if (Math.random() < 0.7) {
          spreadAngle = baseAngle + (Math.random() - 0.5) * (isFatal ? 0.95 : 0.4);
          speed = ((isFatal ? 3.5 : 1.8) + Math.random() * (isFatal ? 6.0 : 3.0)) * Math.sqrt(sizeScale);
        } else {
          const sideDir = Math.random() < 0.5 ? 1 : -1;
          spreadAngle = baseAngle + sideDir * (0.55 + Math.random() * 0.65);
          speed = ((isFatal ? 2.5 : 1.2) + Math.random() * (isFatal ? 4.5 : 2.2)) * Math.sqrt(sizeScale);
        }

        const jitterR = Math.max(0, Math.min(255, baseCol.r + Math.floor((Math.random() - 0.5) * 45)));
        const jitterG = Math.max(0, Math.min(255, baseCol.g + Math.floor((Math.random() - 0.5) * 35)));
        const jitterB = Math.max(0, Math.min(255, baseCol.b + Math.floor((Math.random() - 0.5) * 45)));

        this.flyingBlood.push({
          x: x + (Math.random() - 0.5) * (3 * sizeScale),
          y: y + (Math.random() - 0.5) * (3 * sizeScale),
          vx: Math.cos(spreadAngle) * speed,
          vy: Math.sin(spreadAngle) * speed,
          size: ((isFatal ? 2.4 : 1.2) + Math.random() * (isFatal ? 3.4 : 1.5)) * Math.sqrt(sizeScale),
          life: 5 + Math.floor(Math.random() * (isFatal ? 14 : 7)),
          angle: spreadAngle,
          r: jitterR, g: jitterG, b: jitterB,
          enemyColor
        });
      }

      const finalStainSize = isFatal ? (enemySize > 10 ? 17.5 : stainBase * 1.5) : stainBase;
      this.addFloorStain(x, y, baseAngle, finalStainSize, enemyColor, mapGrid);
    }

    addFloorStain(x, y, angle, baseSize = 6, enemyColor = null, mapGrid = null, seed = null) {
      if (!this.bloodCtx) this.initBloodCanvas();

      let rand = Math.random;
      if (seed !== null) {
        let s = seed;
        rand = function() {
          let t = s += 0x6D2B79F5;
          t = Math.imul(t ^ (t >>> 15), t | 1);
          t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
      }

      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const perpX = -sinA;
      const perpY = cosA;
      const baseCol = this.getBloodPalette(enemyColor);

      const isOrganicTitan = baseSize > 10.0;
      const lobeCount = isOrganicTitan ? (14 + Math.floor(rand() * 8)) : (6 + Math.floor(rand() * 5));
      const lobes = [];

      for (let i = 0; i < lobeCount; i++) {
        const progress = i / lobeCount;
        let forwardDist, sideDist, radius;

        if (isOrganicTitan) {
          // Organic starburst tendrils for Titan
          const tendrilAngle = angle + (rand() - 0.5) * Math.PI * 1.8;
          const dist = (rand() * 0.8 + 0.2) * baseSize * (1.8 + rand() * 1.2);
          forwardDist = Math.cos(tendrilAngle) * dist;
          sideDist = Math.sin(tendrilAngle) * dist;
          radius = Math.max(1.5, baseSize * (0.45 + rand() * 0.45) * (1.0 - dist / (baseSize * 3.5)));
        } else {
          forwardDist = (i === 0 ? 0 : progress * baseSize * (2.0 + rand() * 1.0)) + (rand() - 0.5) * (baseSize * 0.3);
          sideDist = (rand() - 0.5) * (baseSize * (1.2 * progress + 0.4));
          radius = Math.max(1.3, baseSize * (0.65 - progress * 0.35 + rand() * 0.3));
        }

        // Generate multi-tone shade variations inside the same puddle to break pure solid color
        let lr = baseCol.r;
        let lg = baseCol.g;
        let lb = baseCol.b;

        const shadeRoll = rand();
        if (baseCol.b > 180 && baseCol.g > 120) {
          // BLUE TITAN PUDDLE MULTI-SHADE VARIETIES
          if (shadeRoll < 0.25) {
            lr = 45; lg = 230; lb = 255; // Bright neon electric cyan highlight
          } else if (shadeRoll < 0.50) {
            lr = 10; lg = 65; lb = 160;  // Deep cobalt midnight blue core
          } else if (shadeRoll < 0.75) {
            lr = 0; lg = 245; lb = 200;   // Luminous mint/turquoise accent
          } else {
            lr = 25; lg = 185; lb = 235;  // Standard cyan-blue
          }
        } else if (baseCol.g > 100 && baseCol.r > 150) {
          // YELLOW HUNTER PUDDLE MULTI-SHADE VARIETIES
          if (shadeRoll < 0.25) {
            lr = 240; lg = 200; lb = 20;  // Bright golden amber highlight
          } else if (shadeRoll < 0.50) {
            lr = 145; lg = 95; lb = 5;    // Deep burnt ochre honey core
          } else if (shadeRoll < 0.75) {
            lr = 190; lg = 230; lb = 30;  // Toxic acid lime yellow accent
          } else {
            lr = 175; lg = 125; lb = 15;  // Standard warm gold
          }
        } else {
          // RED SWARMER PUDDLE MULTI-SHADE VARIETIES
          if (shadeRoll < 0.25) {
            lr = 230; lg = 35; lb = 65;   // Bright neon scarlet highlight
          } else if (shadeRoll < 0.50) {
            lr = 90; lg = 10; lb = 25;    // Deep dark maroon core
          } else if (shadeRoll < 0.75) {
            lr = 130; lg = 15; lb = 90;   // Deep violet-purple blood accent
          } else {
            lr = 160; lg = 20; lb = 35;   // Standard ruby crimson
          }
        }

        lr = Math.max(0, Math.min(255, lr + Math.floor((rand() - 0.5) * 20)));
        lg = Math.max(0, Math.min(255, lg + Math.floor((rand() - 0.5) * 20)));
        lb = Math.max(0, Math.min(255, lb + Math.floor((rand() - 0.5) * 20)));

        lobes.push({
          relX: (i === 0 ? (rand() - 0.5) * 2 : (isOrganicTitan ? forwardDist : cosA * forwardDist + perpX * sideDist)),
          relY: (i === 0 ? (rand() - 0.5) * 2 : (isOrganicTitan ? sideDist : sinA * forwardDist + perpY * sideDist)),
          r: radius,
          lr, lg, lb
        });
      }

      this.settlingStains.push({
        x, y,
        lobes,
        settleTimer: 45,
        maxTimer: 45
      });
    }

    update(dt, mapGrid = null) {
      // Flying droplets in air
      for (let i = this.flyingBlood.length - 1; i >= 0; i--) {
        const fb = this.flyingBlood[i];
        fb.x += fb.vx * dt;
        fb.y += fb.vy * dt;
        fb.vx *= Math.pow(0.78, dt);
        fb.vy *= Math.pow(0.78, dt);
        fb.life -= dt;
        if (fb.life <= 0) {
          this.addFloorStain(fb.x, fb.y, fb.angle, fb.size * 1.4, fb.enemyColor, mapGrid);
          fastRemove(this.flyingBlood, i);
        }
      }

      // Drop -> Soak/Sink & Feathered Border Bleeding into floor canvas over 45 frames
      if (this.bloodCtx && this.settlingStains.length > 0) {
        const ctx = this.bloodCtx;

        for (let i = this.settlingStains.length - 1; i >= 0; i--) {
          const ss = this.settlingStains[i];
          ss.settleTimer -= dt;

          const soakAlpha = 0.045 * dt;

          for (let l of ss.lobes) {
            const lx = Math.floor(ss.x + l.relX);
            const ly = Math.floor(ss.y + l.relY);

            if (mapGrid) {
              const ltx = (lx / TILE_SIZE) | 0;
              const lty = (ly / TILE_SIZE) | 0;
              if (ltx < 0 || ltx >= MAP_TILES || lty < 0 || lty >= MAP_TILES) continue;
              if (WFCLevelGenerator.isSolid(mapGrid[lty][ltx])) continue;
              if (lty < MAP_TILES - 1 && mapGrid[lty + 1][ltx] === TILES.WALL_TOP && (ly % TILE_SIZE) >= (TILE_SIZE - 14)) continue;
            }

            // Radial gradient for completely borderless, feathered edge blending
            const gradR = Math.max(2, l.r * 1.4);
            const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, gradR);
            grad.addColorStop(0, `rgba(${l.lr}, ${l.lg}, ${l.lb}, ${soakAlpha * 1.2})`);
            grad.addColorStop(0.5, `rgba(${l.lr}, ${l.lg}, ${l.lb}, ${soakAlpha * 0.7})`);
            grad.addColorStop(1, `rgba(${l.lr}, ${l.lg}, ${l.lb}, 0)`);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(lx, ly, gradR, 0, Math.PI * 2);
            ctx.fill();
          }

          if (ss.settleTimer <= 0) {
            fastRemove(this.settlingStains, i);
          }
        }
      }
    }

    draw(ctx, camX, camY, mapGrid = null) {
      if (this.bloodCanvas) {
        ctx.drawImage(
          this.bloodCanvas,
          Math.floor(camX), Math.floor(camY), 320, 224,
          0, 0, 320, 224
        );
      }

      for (let fb of this.flyingBlood) {
        const fbx = Math.floor(fb.x - camX);
        const fby = Math.floor(fb.y - camY);

        const tx = (fb.x / TILE_SIZE) | 0;
        const ty = (fb.y / TILE_SIZE) | 0;
        if (mapGrid && tx >= 0 && tx < MAP_TILES && ty >= 0 && ty < MAP_TILES) {
          if (WFCLevelGenerator.isSolid(mapGrid[ty][tx])) continue;
        }

        ctx.fillStyle = `rgb(${fb.r}, ${fb.g}, ${fb.b})`;
        ctx.beginPath(); ctx.arc(fbx, fby, fb.size, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // --- 10. STRUCTURE MANAGER ---
  const STRUCTURE_TYPES = {
    WALL:   { id: 'WALL',   cost: 15, hp: 100, radius: 10 },
    TURRET: { id: 'TURRET', cost: 35, hp: 50,  radius: 12 },
    TRAP:   { id: 'TRAP',   cost: 20, hp: 30,  radius: 8 },
    NODE:   { id: 'NODE',   cost: 60, hp: 150, radius: 14 }
  };

  class StructureManager {
    constructor() { this.structures = []; }

    isInsideBiomassCreep(x, y) {
      if (Math.hypot(x - 768, y - 768) < 130) return true;
      for (let s of this.structures) {
        if (s.type.id === 'NODE' && Math.hypot(x - s.x, y - s.y) < 130) return true;
      }
      return false;
    }

    addStructure(x, y, type, game) {
      if (game.biomass < type.cost) return false;
      if (!this.isInsideBiomassCreep(x, y)) return false;

      const tx = (x / TILE_SIZE) | 0;
      const ty = (y / TILE_SIZE) | 0;
      if (WFCLevelGenerator.isSolid(game.mapGrid[ty][tx])) return false;

      game.biomass -= type.cost;

      this.structures.push({
        x: Math.floor(x),
        y: Math.floor(y),
        type: type,
        hp: type.hp,
        maxHp: type.hp,
        attackTimer: 0,
        radius: type.radius || 12,
        isTethered: false
      });

      soundEngine.playBuild();
      if (game.particleManager) game.particleManager.addSparks(x, y, '#33ff66', 10);
      if (type.id === 'NODE') game.recalculateTerritory();
      return true;
    }

    update(dt, enemies, bullets, game) {
      for (let s of this.structures) {
        s.isTethered = false;
        if (s.type.id !== 'NODE') {
          for (let n of this.structures) {
            if (n.type.id === 'NODE' && Math.hypot(n.x - s.x, n.y - s.y) < 130) {
              s.isTethered = true;
              break;
            }
          }
        }
      }

      for (let i = this.structures.length - 1; i >= 0; i--) {
        const s = this.structures[i];

        if (s.type.id === 'TURRET') {
          s.attackTimer += dt * (s.isTethered ? 1.5 : 1.0);
          if (s.attackTimer >= 20) {
            let target = null;
            let minDist = 130;
            for (let e of enemies) {
              const d = Math.hypot(e.x - s.x, e.y - s.y);
              if (d < minDist) { minDist = d; target = e; }
            }
            if (target) {
              s.attackTimer = 0;
              const angle = Math.atan2(target.y - s.y, target.x - s.x);
              bullets.push({
                x: s.x, y: s.y,
                vx: Math.cos(angle) * 8.5,
                vy: Math.sin(angle) * 8.5,
                damage: 15 * game.powerMultiplier,
                size: 3,
                color: s.isTethered ? '#00f0ff' : '#33ff66',
                weapon: { name: 'SPORE' },
                update(mapGrid, dtStep) {
                  this.x += this.vx * dtStep;
                  this.y += this.vy * dtStep;
                  const tx = (this.x / TILE_SIZE) | 0;
                  const ty = (this.y / TILE_SIZE) | 0;
                  if (tx < 0 || tx >= MAP_TILES || ty < 0 || ty >= MAP_TILES || WFCLevelGenerator.isSolid(mapGrid[ty][tx])) {
                    this.dead = true;
                  }
                },
                draw(ctx, camX, camY) {
                  ctx.fillStyle = this.color;
                  ctx.fillRect(Math.floor(this.x - camX) - 1, Math.floor(this.y - camY) - 1, 3, 3);
                }
              });
            }
          }
        }

        if (s.type.id === 'TRAP') {
          for (let e of enemies) {
            if (Math.hypot(e.x - s.x, e.y - s.y) < s.radius + e.size * 0.5) {
              e.takeDamage(55 * game.powerMultiplier, game.particleManager, null, game.debrisManager, game.popupManager);
              if (game.particleManager) game.particleManager.addExplosion(s.x, s.y, '#33ff66', 12);
              s.hp = 0;
              break;
            }
          }
        }

        if (s.hp <= 0) {
          if (s.type.id === 'NODE') setTimeout(() => game.recalculateTerritory(), 50);
          fastRemove(this.structures, i);
        }
      }
    }

    draw(ctx, camX, camY) {
      ctx.fillStyle = 'rgba(51, 255, 102, 0.08)';
      ctx.strokeStyle = 'rgba(51, 255, 102, 0.25)';
      ctx.lineWidth = 1;

      const lcx = Math.floor(768 - camX);
      const lcy = Math.floor(768 - camY);
      ctx.beginPath(); ctx.arc(lcx, lcy, 128, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      for (let s of this.structures) {
        if (s.type.id === 'NODE') {
          const nx = Math.floor(s.x - camX);
          const ny = Math.floor(s.y - camY);
          ctx.beginPath(); ctx.arc(nx, ny, 128, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
      }

      for (let s of this.structures) {
        const sx = Math.floor(s.x - camX);
        const sy = Math.floor(s.y - camY);
        if (sx < -20 || sx > 340 || sy < -20 || sy > 240) continue;

        if (s.type.id === 'WALL') {
          ctx.fillStyle = s.isTethered ? '#9e461a' : '#7a3814';
          ctx.fillRect(sx - 6, sy - 6, 12, 12);
          ctx.fillStyle = '#33ff66';
          ctx.fillRect(sx - 4, sy - 4, 8, 8);
        } else if (s.type.id === 'TURRET') {
          ctx.fillStyle = '#1c0d38';
          ctx.fillRect(sx - 6, sy - 6, 12, 12);
          ctx.fillStyle = s.isTethered ? '#00f0ff' : '#00ffaa';
          ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.fill();
        } else if (s.type.id === 'TRAP') {
          ctx.fillStyle = 'rgba(51, 255, 102, 0.4)';
          ctx.beginPath(); ctx.arc(sx, sy, 8, 0, Math.PI * 2); ctx.fill();
        } else if (s.type.id === 'NODE') {
          ctx.fillStyle = '#00f0ff';
          ctx.beginPath(); ctx.arc(sx, sy, 8, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
          ctx.strokeRect(sx - 12, sy - 12, 24, 24);
        }
      }
    }
  }

  // --- 11. PLAYER CLASS (PHYSICAL DOM SCREEN-SPACE AIMING MATCHING 100%) ---
  class Player {
    constructor(x, y) {
      this.x = x; this.y = y;
      this.radius = 5;
      this.speed = 2.5;
      this.currentWeapon = WEAPONS.PLASMA;
      this.aimAngle = 0;
      this.lastShotTime = 0;
      this.hp = 100;
      this.maxHp = 100;
      this.dashCooldown = 0;
      this.isDashing = false;
      this.dashTimer = 0;
    }

    equipWeapon(w) { this.currentWeapon = w; }

    update(keys, mousePos, mapGrid, bullets, dt, debris, camera, game) {
      if (this.dashCooldown > 0) this.dashCooldown -= dt;
      if (this.dashTimer > 0) {
        this.dashTimer -= dt;
        if (this.dashTimer <= 0) this.isDashing = false;
      }

      let moveX = 0; let moveY = 0;
      if (keys['KeyW'] || keys['w'] || keys['W'] || keys['ArrowUp']) moveY -= 1;
      if (keys['KeyS'] || keys['s'] || keys['S'] || keys['ArrowDown']) moveY += 1;
      if (keys['KeyA'] || keys['a'] || keys['A'] || keys['ArrowLeft']) moveX -= 1;
      if (keys['KeyD'] || keys['d'] || keys['D'] || keys['ArrowRight']) moveX += 1;

      const len = Math.hypot(moveX, moveY);
      if (len > 0) {
        moveX /= len;
        moveY /= len;
      }

      if ((keys[' '] || keys['Space']) && this.dashCooldown <= 0 && len > 0) {
        this.isDashing = true;
        this.dashTimer = 10;
        this.dashCooldown = 45;
        if (game.particleManager) game.particleManager.addSparks(this.x, this.y, '#00f0ff', 8);
      }

      const spd = (this.isDashing ? this.speed * 2.2 : this.speed) * game.speedMultiplier;
      const dx = moveX * spd * dt;
      const dy = moveY * spd * dt;

      if (dx !== 0) {
        const targetX = this.x + dx;
        if (!WFCLevelGenerator.checkCollision(targetX, this.y, this.radius, mapGrid)) {
          this.x = targetX;
        }
      }
      if (dy !== 0) {
        const targetY = this.y + dy;
        if (!WFCLevelGenerator.checkCollision(this.x, targetY, this.radius, mapGrid)) {
          this.y = targetY;
        }
      }



      // PHYSICAL DOM SCREEN-SPACE AIMING (Eliminates aspect-ratio diagonal visual angle skewing!)
      const screenPlayerX = this.x - camera.x;
      const screenPlayerY = this.y - 3 - camera.y;
      this.aimAngle = Math.atan2(mousePos.y - screenPlayerY, mousePos.x - screenPlayerX);

      if (mousePos.isDown && !this.isDashing) {
        const now = performance.now();
        if (now - this.lastShotTime >= this.currentWeapon.fireRate) {
          this.lastShotTime = now;
          this.fireWeapon(bullets, game);
        }
      }
    }

    fireWeapon(bullets, game) {
      soundEngine.playPew();
      const w = this.currentWeapon;
      const count = w.bullets || 1;


      const pushAngle = this.aimAngle + Math.PI;
      const pushDist = (w.knockback ? w.knockback * 0.35 : 0.4);
      const pushX = this.x + Math.cos(pushAngle) * pushDist;
      const pushY = this.y + Math.sin(pushAngle) * pushDist;
      if (game && game.mapGrid && !WFCLevelGenerator.checkCollision(pushX, pushY, this.radius, game.mapGrid)) {
        this.x = pushX;
        this.y = pushY;
      }

      // Gun muzzle flash spark ring
      if (game && game.particleManager) {
        const muzzleX = this.x + Math.cos(this.aimAngle) * 8;
        const muzzleY = this.y - 3 + Math.sin(this.aimAngle) * 8;
        game.particleManager.addSparks(muzzleX, muzzleY, w.color, 4);
      }

      for (let i = 0; i < count; i++) {
        const spreadAngle = this.aimAngle + (Math.random() - 0.5) * w.spread;
        const vx = Math.cos(spreadAngle) * w.speed;
        const vy = Math.sin(spreadAngle) * w.speed;

        bullets.push({
          x: this.x + Math.cos(this.aimAngle) * 6,
          y: this.y - 3 + Math.sin(this.aimAngle) * 6,
          vx, vy,
          damage: w.damage * game.powerMultiplier,
          size: w.size,
          color: w.color,
          piercing: w.piercing || false,
          weapon: w,
          dead: false,
          update(mapGrid, dt, gameRef) {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.flightTime = (this.flightTime || 0) + dt;

            // Rocket smoke trail and thrust sparks with wavy corkscrew motion
            if (this.weapon && this.weapon.explosionRadius) {
              if (gameRef && gameRef.particleManager) {
                gameRef.particleManager.addRocketTrail(this.x, this.y, this.vx, this.vy, this.flightTime);
              }
            } else if (gameRef && gameRef.particleManager && Math.random() < 0.35) {
              gameRef.particleManager.addTrail(this.x, this.y, this.color, Math.max(1.5, this.size * 0.6));
            }

            const btx = (this.x / TILE_SIZE) | 0;
            const bty = (this.y / TILE_SIZE) | 0;

            if (btx >= 0 && btx < MAP_TILES && bty >= 0 && bty < MAP_TILES) {
              if (mapGrid[bty][btx] === TILES.ORE && gameRef) {
                gameRef.oreHp[bty][btx] -= this.damage;
                soundEngine.playMine();
                if (gameRef.particleManager) gameRef.particleManager.addSparks(this.x, this.y, '#33ff66', 10);
                if (gameRef.camera) {
                  gameRef.camera.x += (Math.random() - 0.5) * 2;
                  gameRef.camera.y += (Math.random() - 0.5) * 2;
                }

                if (gameRef.oreHp[bty][btx] <= 0) {
                  mapGrid[bty][btx] = TILES.FLOOR;
                  gameRef.mapNeedsUpdate = true;
                  gameRef.biomass += 25;
                  if (gameRef.popupManager) gameRef.popupManager.addPopup(this.x, this.y, '+25🧪 MINED!', '#33ff66');
                }

                if (this.weapon && this.weapon.explosionRadius && gameRef && gameRef.particleManager) {
                  soundEngine.playExplosion();
                  gameRef.particleManager.addEpicBlast(this.x, this.y, gameRef);
                }
                this.dead = true;
                return;
              }

              if (WFCLevelGenerator.isSolid(mapGrid[bty][btx])) {
                if (this.weapon && this.weapon.explosionRadius && gameRef && gameRef.particleManager) {
                  soundEngine.playExplosion();
                  gameRef.particleManager.addEpicBlast(this.x, this.y, gameRef);
                } else if (gameRef && gameRef.particleManager) {
                  gameRef.particleManager.addSparks(this.x, this.y, this.color, 4);
                }
                this.dead = true;
              }
            }
          },
          draw(ctx, camX, camY) {
            if (this.weapon && this.weapon.explosionRadius) {
              const angle = Math.atan2(this.vy, this.vx);
              ctx.save();
              ctx.translate(Math.floor(this.x - camX), Math.floor(this.y - camY));
              ctx.rotate(angle);
              // Missile dark alloy body
              ctx.fillStyle = '#3a344d';
              ctx.fillRect(-5, -2, 8, 4);
              // Warhead tip
              ctx.fillStyle = '#ff2200';
              ctx.fillRect(3, -1, 3, 2);
              // Stabilizing yellow fins
              ctx.fillStyle = '#ffb700';
              ctx.fillRect(-4, -4, 2, 8);

              // Swiveling dual-layer flame nozzle
              const t = this.flightTime || 0;
              const n = Math.sin(t * 0.43) * 0.5 + Math.sin(t * 1.1 + 1.7) * 0.3 + Math.cos(t * 2.3 - 0.5) * 0.2;
              const wobble = n * 0.55;
              const fl = 5.5 + Math.floor(Math.random() * 4);
              const flX = -5 - Math.cos(wobble) * fl;
              const flY = Math.sin(wobble) * fl;

              // Outer fire
              ctx.strokeStyle = '#ff5500';
              ctx.lineWidth = 3.5;
              ctx.beginPath();
              ctx.moveTo(-5, 0);
              ctx.lineTo(flX, flY);
              ctx.stroke();

              // Inner white core
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(-5, 0);
              ctx.lineTo(-5 - Math.cos(wobble) * (fl * 0.6), Math.sin(wobble) * (fl * 0.6));
              ctx.stroke();

              ctx.restore();
            } else {
              ctx.fillStyle = this.color;
              ctx.fillRect(Math.floor(this.x - camX) - 2, Math.floor(this.y - camY) - 2, this.size, this.size);
            }
          }
        });
      }
    }

    takeDamage(amount, game) {
      if (this.isDashing) return false;
      this.hp -= amount;
      if (game && game.popupManager) game.popupManager.addPopup(this.x, this.y - 8, `-${Math.floor(amount)}`, '#ff3355');
      return true;
    }

    draw(ctx, camX, camY) {
      const px = Math.floor(this.x - camX);
      const py = Math.floor(this.y - camY);

      // Laser Sight Trajectory Guide Line
      const exactPx = this.x - camX;
      const exactPy = this.y - camY;

      ctx.strokeStyle = 'rgba(0, 255, 170, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(exactPx, exactPy - 3);
      ctx.lineTo(exactPx + Math.cos(this.aimAngle) * 300, exactPy - 3 + Math.sin(this.aimAngle) * 300);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = this.isDashing ? '#00f0ff' : '#33ff66';
      ctx.beginPath(); ctx.arc(px, py - 3, 5, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#00f0ff';
      const eyeX = Math.floor(px + Math.cos(this.aimAngle) * 3);
      const eyeY = Math.floor(py - 3 + Math.sin(this.aimAngle) * 3);
      ctx.fillRect(eyeX - 1, eyeY - 1, 3, 3);
    }
  }

  // --- 12. ENEMY AI UNITS ---
  const ENEMY_TYPES = {
    SWARMER: { name: 'AI SWARMER DRONE', hp: 18, speed: 1.3, size: 7, color: '#ff3355', biomass: 6 },
    HUNTER: { name: 'CYBORG HUNTER', hp: 50, speed: 0.95, size: 10, color: '#ff6e00', biomass: 14 },
    TITAN: { name: 'MECHA DEFENDER', hp: 150, speed: 0.45, size: 15, color: '#00f0ff', biomass: 35 }
  };

  class Enemy {
    constructor(x, y, type) {
      this.x = x; this.y = y; this.type = type;
      this.hp = type.hp; this.maxHp = type.hp;
      this.speed = type.speed; this.size = type.size; this.color = type.color;
      this.radius = type.size * 0.5;
      this.dead = false;
      this.flashFrames = 0;
      this.hitScale = 1.0;
      this.path = [];
      this.pathTimer = Math.floor(Math.random() * 30);
      this.bloodColor = this.generateBloodColor(type);
    }

    generateBloodColor(type) {
      if (type === ENEMY_TYPES.SWARMER) {
        return {
          r: Math.max(0, Math.min(255, 120 + Math.floor((Math.random() - 0.5) * 50))),
          g: Math.max(0, Math.min(255, 15 + Math.floor(Math.random() * 25))),
          b: Math.max(0, Math.min(255, 35 + Math.floor((Math.random() - 0.5) * 35)))
        };
      } else if (type === ENEMY_TYPES.HUNTER) {
        return {
          r: Math.max(0, Math.min(255, 175 + Math.floor((Math.random() - 0.5) * 30))),
          g: Math.max(0, Math.min(255, 125 + Math.floor((Math.random() - 0.5) * 25))),
          b: Math.max(0, Math.min(255, 15 + Math.floor(Math.random() * 15)))
        };
      } else if (type === ENEMY_TYPES.TITAN) {
        return {
          r: Math.max(0, Math.min(255, 25 + Math.floor(Math.random() * 30))),
          g: Math.max(0, Math.min(255, 185 + Math.floor((Math.random() - 0.5) * 35))),
          b: Math.max(0, Math.min(255, 235 + Math.floor((Math.random() - 0.5) * 30)))
        };
      }
      return { r: 120, g: 15, b: 30 };
    }

    takeDamage(amount, particles, screenShake, debris, popups, knockbackDirX = 0, knockbackDirY = 0, knockbackMag = 0, bulletVx = 0, bulletVy = 0, mapGrid = null) {
      this.hp -= amount;
      this.flashFrames = 5;
      this.hitScale = 1.35;

      // Slight screen shake on splash scaled by enemy size
      if (window.game && window.game.camera) {
        const sizeFactor = this.size / 14;
        const shakeMag = this.hp <= 0 ? sizeFactor * 7.0 : sizeFactor * 2.2;
        const shakeTime = this.hp <= 0 ? 7 : 3;
        window.game.camera.addShake(shakeMag, shakeTime);
      }

      let sprayDirX = bulletVx || knockbackDirX || 1;
      let sprayDirY = bulletVy || knockbackDirY || 0;
      if (debris) debris.addBloodSpray(this.x, this.y, sprayDirX, sprayDirY, this.hp <= 0, this.bloodColor, mapGrid, this.size);
      if (particles) {
        particles.addSparks(this.x, this.y, this.color, 6);
        particles.addChitinDebris(this.x, this.y, this.color, this.hp <= 0 ? 8 : 3);
      }
      if (popups) popups.addPopup(this.x, this.y - 6, `-${Math.floor(amount)}`, '#ff3355');

      if (this.hp <= 0) {
        this.dead = true;
        soundEngine.playExplosion();
        if (particles) particles.addExplosion(this.x, this.y, this.color, 18);
      }
    }

    update(player, mapGrid, dt, structures) {
      if (this.flashFrames > 0) this.flashFrames -= dt;
      if (this.hitScale > 1.0) this.hitScale = Math.max(1.0, this.hitScale - 0.1 * dt);

      let targetX = player.x;
      let targetY = player.y;
      let minDist = Math.hypot(player.x - this.x, player.y - this.y);

      for (let s of structures) {
        const d = Math.hypot(s.x - this.x, s.y - this.y);
        if (d < minDist) { minDist = d; targetX = s.x; targetY = s.y; }
      }

      this.pathTimer += dt;
      if (this.pathTimer >= 35 || this.path.length === 0) {
        this.pathTimer = 0;
        this.path = AStarPathfinder.findPath(this.x, this.y, targetX, targetY, mapGrid);
      }

      let wayX = targetX;
      let wayY = targetY;
      if (this.path && this.path.length > 0) {
        wayX = this.path[0].x;
        wayY = this.path[0].y;
        if (Math.hypot(wayX - this.x, wayY - this.y) < 14) {
          this.path.shift();
        }
      }

      const angle = Math.atan2(wayY - this.y, wayX - this.x);
      const dx = Math.cos(angle) * this.speed * dt;
      const dy = Math.sin(angle) * this.speed * dt;

      if (dx !== 0) {
        const targetXPos = this.x + dx;
        if (!WFCLevelGenerator.checkCollision(targetXPos, this.y, this.radius, mapGrid)) {
          this.x = targetXPos;
        }
      }
      if (dy !== 0) {
        const targetYPos = this.y + dy;
        if (!WFCLevelGenerator.checkCollision(this.x, targetYPos, this.radius, mapGrid)) {
          this.y = targetYPos;
        }
      }
    }

    draw(ctx, camX, camY) {
      const px = Math.floor(this.x - camX);
      const py = Math.floor(this.y - camY);
      if (px < -20 || px > 340 || py < -20 || py > 240) return;

      const baseSz = Math.floor(this.size);
      const szW = Math.floor(baseSz * this.hitScale);
      const szH = Math.floor(baseSz / (this.hitScale * 0.8 + 0.2));

      ctx.fillStyle = this.flashFrames > 0 ? '#ffffff' : this.color;
      ctx.fillRect(px - (szW >> 1), py - (szH >> 1), szW, szH);
      ctx.strokeStyle = 'rgba(5, 4, 10, 0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px - (szW >> 1), py - (szH >> 1), szW, szH);
    }
  }

  // --- 13. AIRDROPS ---
  class CrateManager {
    constructor() {
      this.activeCrate = null;
      this.airdropTarget = null;
      this.airdropTimer = 0;
      this.spawnCooldown = 300;
    }

    update(player, dt, game) {
      if (this.airdropTarget) {
        this.airdropTimer -= dt;
        if (this.airdropTimer <= 0) {
          soundEngine.playExplosion();
          this.activeCrate = { x: this.airdropTarget.x, y: this.airdropTarget.y, size: 14 };
          this.airdropTarget = null;
          if (game.particleManager) game.particleManager.addExplosion(this.activeCrate.x, this.activeCrate.y, '#ffb700', 16);
        }
        return;
      }

      if (!this.activeCrate) {
        this.spawnCooldown -= dt;
        if (this.spawnCooldown <= 0) {
          const tx = Math.floor(player.x + (Math.random() - 0.5) * 240);
          const ty = Math.floor(player.y + (Math.random() - 0.5) * 180);
          this.airdropTarget = { x: tx, y: ty };
          this.airdropTimer = 180;
          this.spawnCooldown = 450;
        }
        return;
      }

      const c = this.activeCrate;
      const dist = Math.hypot(player.x - c.x, player.y - c.y);

      if (dist < 50) {
        const angle = Math.atan2(player.y - c.y, player.x - c.x);
        c.x += Math.cos(angle) * 3.0 * dt;
        c.y += Math.sin(angle) * 3.0 * dt;
        if (game.particleManager && Math.random() < 0.4) {
          game.particleManager.addTrail(c.x, c.y, '#ffb700', 2);
        }
      }

      if (dist < 32) {
        soundEngine.playBuild();
        game.biomass += 45;
        player.hp = Math.min(player.maxHp, player.hp + 35);

        const keys = Object.keys(WEAPONS);
        const nextW = WEAPONS[keys[(Math.random() * keys.length) | 0]];
        player.equipWeapon(nextW);

        if (game.popupManager) game.popupManager.addPopup(c.x, c.y - 10, `+45🧪 ${nextW.name}`, '#33ff66');
        this.activeCrate = null;
      }
    }

    draw(ctx, camX, camY) {
      if (this.airdropTarget) {
        const tx = Math.floor(this.airdropTarget.x - camX);
        const ty = Math.floor(this.airdropTarget.y - camY);
        const secs = (this.airdropTimer / 60).toFixed(1);
        const tRot = performance.now() * 0.004;

        // Rotating targeting ring
        ctx.strokeStyle = 'rgba(255, 183, 0, 0.7)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(tx, ty, 14, tRot, tRot + Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Pulsing crosshair pips
        const pipLen = 4 + Math.sin(performance.now() * 0.01) * 1.5;
        ctx.strokeStyle = '#ff0055';
        ctx.beginPath();
        ctx.moveTo(tx - 18, ty); ctx.lineTo(tx - 18 + pipLen, ty);
        ctx.moveTo(tx + 18, ty); ctx.lineTo(tx + 18 - pipLen, ty);
        ctx.moveTo(tx, ty - 18); ctx.lineTo(tx, ty - 18 + pipLen);
        ctx.moveTo(tx, ty + 18); ctx.lineTo(tx, ty + 18 - pipLen);
        ctx.stroke();

        PixelFont.draw(ctx, `AIRDROP ${secs}S`, tx, ty - 22, '#ffb700', 1, 'center', true);
      }

      if (this.activeCrate) {
        const cx = Math.floor(this.activeCrate.x - camX);
        const cy = Math.floor(this.activeCrate.y - camY);
        const tPulse = Math.sin(performance.now() * 0.008);

        // 1. Drop shadow
        ctx.fillStyle = 'rgba(4, 3, 8, 0.65)';
        ctx.fillRect(cx - 7, cy - 5, 15, 14);

        // 2. Reinforced Dark Steel Outer Frame (14x14)
        ctx.fillStyle = '#221508';
        ctx.fillRect(cx - 7, cy - 7, 14, 14);

        // 3. Main Amber-Orange Metal Body (12x12)
        ctx.fillStyle = '#d97706';
        ctx.fillRect(cx - 6, cy - 6, 12, 12);

        // 4. Top/Left Lighting Bevel
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(cx - 6, cy - 6, 12, 1);
        ctx.fillRect(cx - 6, cy - 6, 1, 12);

        // 5. Bottom/Right Shadow Bevel
        ctx.fillStyle = '#78350f';
        ctx.fillRect(cx - 6, cy + 5, 12, 1);
        ctx.fillRect(cx + 5, cy - 6, 1, 12);

        // 6. Reinforced Diagonal Straps (X-Bracing)
        ctx.fillStyle = '#b45309';
        ctx.fillRect(cx - 4, cy - 4, 8, 8);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(cx - 3, cy - 3, 6, 6);

        // 7. Corner Metal Rivets (4 corners)
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(cx - 6, cy - 6, 2, 2);
        ctx.fillRect(cx + 4, cy - 6, 2, 2);
        ctx.fillRect(cx - 6, cy + 4, 2, 2);
        ctx.fillRect(cx + 4, cy + 4, 2, 2);

        // 8. Pulsing Sci-Fi Bio-Energy Core Lock in Center
        const coreCol = tPulse > 0 ? '#00f0ff' : '#33ff66';
        ctx.fillStyle = '#05040a';
        ctx.fillRect(cx - 2, cy - 2, 4, 4);
        ctx.fillStyle = coreCol;
        ctx.fillRect(cx - 1, cy - 1, 2, 2);
        // Subtle ambient core glow
        if (tPulse > 0.3) {
          ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
          ctx.fillRect(cx - 3, cy - 3, 6, 1);
          ctx.fillRect(cx - 3, cy + 2, 6, 1);
        }
      }
    }
  }

  // --- 13b. TESTING AREA MANAGER ---
  // Layout (Exact 15x15 Tile Arena, Centered on Blocks):
  //   Arena: TX 16..30 (X=512..992), TY 16..30 (Y=512..992)
  //   Tile center formula: (TX * 32 + 16, TY * 32 + 16)
  //   Weapon column on left: TX=18 (X=592), TY=19,21,23,25,27 (Y=624,688,752,816,880)
  //   Center Player: TX=23, TY=23 (X=752, Y=752)
  //   Target dummies: TY=20 (Auto Respawn Y=656), TY=26 (Invulnerable Y=848) at TX=21,23,25 (X=688,752,816)
  //   Airdrop crate: TX=28, TY=23 (X=912, Y=752)
  const RESPAWN_TOTAL = 15; // 0.25s fast respawn
  const WEAPON_RESPAWN_TOTAL = 45; // 0.75s fast respawn

  class TestingManager {
    constructor(game) {
      this.game = game;

      // 5 weapon pickups stacked in column TX=18 (X=592)
      this.weaponPickups = [];
      const weaponList = Object.values(WEAPONS);
      const weaponYRows = [19, 21, 23, 25, 27]; // TY rows
      weaponList.forEach((w, i) => {
        this.weaponPickups.push({
          x: 18 * TILE_SIZE + 16, // X=592
          y: weaponYRows[i] * TILE_SIZE + 16, // Y=624, 688, 752, 816, 880
          weapon: w, active: true,
          respawnTimer: 0, maxTimer: WEAPON_RESPAWN_TOTAL, spawnAnim: 0
        });
      });

      // 3 respawnable enemy slots (Row TY=20, Y=656, at TX=21, 23, 25)
      this.respawnableSlots = [
        { x: 21 * TILE_SIZE + 16, y: 20 * TILE_SIZE + 16, type: ENEMY_TYPES.SWARMER, enemy: null, respawnTimer: 0, maxTimer: RESPAWN_TOTAL, spawnAnim: 0 },
        { x: 23 * TILE_SIZE + 16, y: 20 * TILE_SIZE + 16, type: ENEMY_TYPES.HUNTER,  enemy: null, respawnTimer: 0, maxTimer: RESPAWN_TOTAL, spawnAnim: 0 },
        { x: 25 * TILE_SIZE + 16, y: 20 * TILE_SIZE + 16, type: ENEMY_TYPES.TITAN,   enemy: null, respawnTimer: 0, maxTimer: RESPAWN_TOTAL, spawnAnim: 0 },
      ];

      // 3 immortal enemies (Row TY=26, Y=848, at TX=21, 23, 25)
      this.immortalEnemies = [
        Object.assign(new Enemy(21 * TILE_SIZE + 16, 26 * TILE_SIZE + 16, ENEMY_TYPES.SWARMER), { immortal: true }),
        Object.assign(new Enemy(23 * TILE_SIZE + 16, 26 * TILE_SIZE + 16, ENEMY_TYPES.HUNTER),  { immortal: true }),
        Object.assign(new Enemy(25 * TILE_SIZE + 16, 26 * TILE_SIZE + 16, ENEMY_TYPES.TITAN),   { immortal: true }),
      ];

      // Trigger airdrop at fixed right column spot (TX=28, TY=23 -> X=912, Y=752)
      this._triggerAirdrop();
    }

    _triggerAirdrop() {
      const cm = this.game.crateManager;
      cm.airdropTarget = { x: 28 * TILE_SIZE + 16, y: 23 * TILE_SIZE + 16 };
      cm.airdropTimer = 120; // 2s countdown
      cm.activeCrate = null;
      cm.spawnCooldown = 9999;
    }

    update(dt) {
      const g = this.game;
      const p = g.player;

      // Weapon pickups
      for (const slot of this.weaponPickups) {
        if (slot.spawnAnim > 0) slot.spawnAnim = Math.max(0, slot.spawnAnim - dt);
        if (!slot.active) {
          slot.respawnTimer -= dt;
          if (slot.respawnTimer <= 0) { slot.active = true; slot.spawnAnim = 15; }
          continue;
        }
        const dx = p.x - slot.x, dy = p.y - slot.y;
        if (dx * dx + dy * dy < 20 * 20) {
          p.equipWeapon(slot.weapon);
          if (g.popupManager) g.popupManager.addPopup(slot.x, slot.y - 12, slot.weapon.name, slot.weapon.color);
          soundEngine.playBuild();
          slot.active = false;
          slot.respawnTimer = slot.maxTimer;
        }
      }

      // Respawnable slots
      for (const slot of this.respawnableSlots) {
        if (slot.spawnAnim > 0) slot.spawnAnim = Math.max(0, slot.spawnAnim - dt);
        if (slot.enemy && !slot.enemy.dead) {
          if (slot.enemy.flashFrames > 0) slot.enemy.flashFrames -= dt;
          if (slot.enemy.hitScale > 1.0) slot.enemy.hitScale = Math.max(1.0, slot.enemy.hitScale - 0.1 * dt);
        }
        if (!slot.enemy || slot.enemy.dead) {
          slot.enemy = null;
          if (slot.respawnTimer <= 0) {
            slot.respawnTimer = slot.maxTimer;
          } else {
            slot.respawnTimer -= dt;
            if (slot.respawnTimer <= 0) {
              slot.enemy = new Enemy(slot.x, slot.y, slot.type);
              slot.spawnAnim = 20;
              if (g.particleManager) g.particleManager.addSparks(slot.x, slot.y, slot.type.color, 8);
            }
          }
        }
      }

      // Immortal enemies
      for (const e of this.immortalEnemies) {
        if (e.hp <= 0) {
          e.hp = e.maxHp; e.dead = false; e.flashFrames = 0; e.hitScale = 1.0;
          if (g.particleManager) g.particleManager.addSparks(e.x, e.y, e.color, 6);
        }
        if (e.flashFrames > 0) e.flashFrames -= dt;
        if (e.hitScale > 1.0) e.hitScale = Math.max(1.0, e.hitScale - 0.1 * dt);
      }

      // Bullets vs test enemies
      const allTestEnemies = [
        ...this.respawnableSlots.filter(s => s.enemy && !s.enemy.dead).map(s => s.enemy),
        ...this.immortalEnemies
      ];
      for (let i = g.bullets.length - 1; i >= 0; i--) {
        const b = g.bullets[i];
        if (!b) continue;
        for (const e of allTestEnemies) {
          const dx = b.x - e.x, dy = b.y - e.y, maxD = (b.size + e.size) * 0.6;
          if (dx * dx + dy * dy < maxD * maxD) {
            e.takeDamage(b.damage, g.particleManager, null, g.debrisManager, g.popupManager, b.vx, b.vy, 2.5, b.vx, b.vy, g.mapGrid);

            // Rocket area explosion
            if (b.weapon && b.weapon.explosionRadius) {
              soundEngine.playExplosion();
              if (g.particleManager) g.particleManager.addEpicBlast(b.x, b.y, g);
              for (const other of allTestEnemies) {
                if (other === e) continue;
                const d2 = Math.hypot(other.x - b.x, other.y - b.y);
                if (d2 < b.weapon.explosionRadius) {
                  other.takeDamage(b.damage * 0.7, g.particleManager, null, g.debrisManager, g.popupManager, other.x - b.x, other.y - b.y, 3.5, 0, 0, g.mapGrid);
                }
              }
            }

            if (!b.piercing) b.dead = true;
            break;
          }
        }
        if (b.dead) fastRemove(g.bullets, i);
      }

      // Real CrateManager — re-trigger after crate collected
      const cm = g.crateManager;
      if (!cm.airdropTarget && !cm.activeCrate) this._triggerAirdrop();
      g.crateManager.update(p, dt, g);
    }

    // Radial progress arc helper
    _drawRadialProgressBar(ctx, sx, sy, r, progress, color) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke();
      if (progress > 0) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ctx.stroke();
      }
    }

    draw(ctx, camX, camY) {
      // Header: WEAPONS (centered above column TX=18)
      const whx = Math.floor(18 * TILE_SIZE + 16 - camX);
      const why = Math.floor(18 * TILE_SIZE + 10 - camY);
      if (why > -10 && why < 244) {
        PixelFont.draw(ctx, 'WEAPONS', whx, why, '#00f0ff', 1, 'center');
      }

      // Weapon pickups
      for (const slot of this.weaponPickups) {
        const sx = Math.floor(slot.x - camX);
        const sy = Math.floor(slot.y - camY);
        if (sy < -20 || sy > 244) continue;
        ctx.globalAlpha = slot.active ? 1.0 : 0.3;
        ctx.fillStyle = slot.weapon.color;
        const sz = slot.spawnAnim > 0 ? Math.floor(7 + (slot.spawnAnim / 15) * 4) : 7;
        ctx.fillRect(sx - sz, sy - sz, sz * 2, sz * 2);
        PixelFont.draw(ctx, slot.weapon.name, sx, sy + sz + 3, '#ffffff', 1, 'center');
        ctx.globalAlpha = 1;
        // Radial respawn timer
        if (!slot.active) {
          const progress = 1 - (slot.respawnTimer / slot.maxTimer);
          this._drawRadialProgressBar(ctx, sx, sy, sz + 6, progress, slot.weapon.color);
        }
      }

      // Headers: TARGETS (above row TY=20) & INVULNERABLE (above row TY=26)
      const targetsX = Math.floor(23 * TILE_SIZE + 16 - camX);
      const respLabelY = Math.floor(19 * TILE_SIZE + 10 - camY);
      const immoLabelY = Math.floor(25 * TILE_SIZE + 10 - camY);
      if (respLabelY > -10 && respLabelY < 244) {
        PixelFont.draw(ctx, 'TARGETS', targetsX, respLabelY, '#33ff66', 1, 'center');
      }
      if (immoLabelY > -10 && immoLabelY < 244) {
        PixelFont.draw(ctx, 'INVULNERABLE', targetsX, immoLabelY, '#ff0055', 1, 'center');
      }

      // Respawnable slots
      for (const slot of this.respawnableSlots) {
        const sx = Math.floor(slot.x - camX);
        const sy = Math.floor(slot.y - camY);
        if (sy < -20 || sy > 244) continue;
        if (slot.enemy && !slot.enemy.dead) {
          if (slot.spawnAnim > 0) {
            const r = Math.floor(slot.type.size * (1 + slot.spawnAnim / 20));
            ctx.strokeStyle = slot.type.color; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke();
          }
          slot.enemy.draw(ctx, camX, camY);
        } else {
          // Radial respawn progress
          const progress = slot.maxTimer > 0 ? 1 - (slot.respawnTimer / slot.maxTimer) : 1;
          this._drawRadialProgressBar(ctx, sx, sy, slot.type.size + 4, progress, slot.type.color);
        }
      }

      // Immortal enemies
      for (const e of this.immortalEnemies) {
        e.draw(ctx, camX, camY);
      }

      // Real CrateManager draw
      this.game.crateManager.draw(ctx, camX, camY);
    }
  }

  // --- 14. OPTIMIZED HIGH-PERFORMANCE RENDERER WITH FAST 32-BIT DITHER BUFFER ---
  class Renderer {
    constructor(width = 320, height = 224) {
      this.width = width;
      this.height = height;
      this.offCanvas = document.createElement('canvas');
      this.offCanvas.width = width;
      this.offCanvas.height = height;
      this.offCtx = this.offCanvas.getContext('2d');
    }

    getContext() { return this.offCtx; }

    clear(biome = BIOMES.BUNKER) {
      this.offCtx.fillStyle = '#05040a';
      this.offCtx.fillRect(0, 0, this.width, this.height);
    }

    renderMapToBgCanvas(mapGrid, biome) {
      if (!this.bgCanvas) {
        this.bgCanvas = document.createElement('canvas');
        this.bgCanvas.width = MAP_TILES * TILE_SIZE;
        this.bgCanvas.height = MAP_TILES * TILE_SIZE;
        this.bgCtx = this.bgCanvas.getContext('2d', { alpha: false });
      }
      const ctx = this.bgCtx;
      const wallHeightExtrusion = 14;

      for (let ty = 0; ty < MAP_TILES; ty++) {
        for (let tx = 0; tx < MAP_TILES; tx++) {
          const tile = mapGrid[ty][tx];
          const renderX = tx * TILE_SIZE;
          const renderY = ty * TILE_SIZE;

          if (tile === TILES.VOID) {
            ctx.fillStyle = '#05040a';
            ctx.fillRect(renderX, renderY, TILE_SIZE, TILE_SIZE);

          } else if (tile === TILES.FLOOR) {
            ctx.fillStyle = ((tx + ty) % 2 === 0) ? biome.floorColor : '#120d24';
            ctx.fillRect(renderX, renderY, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.strokeRect(renderX, renderY, TILE_SIZE, TILE_SIZE);

          } else if (tile === TILES.WALL_TOP) {
            // Strict 1:1 on-grid wall rendering (100% collision parity, no off-grid overlap)
            ctx.fillStyle = biome.wallColor;
            ctx.fillRect(renderX, renderY, TILE_SIZE, TILE_SIZE);

            // Top & Left highlight bevel
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.fillRect(renderX, renderY, TILE_SIZE, 2);
            ctx.fillRect(renderX, renderY, 2, TILE_SIZE);

            // Bottom & Right shadow bevel
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.fillRect(renderX, renderY + TILE_SIZE - 3, TILE_SIZE, 3);
            ctx.fillRect(renderX + TILE_SIZE - 3, renderY, 3, TILE_SIZE);

            // Concrete panel rivet accent
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.strokeRect(renderX, renderY, TILE_SIZE, TILE_SIZE);

          } else if (tile === TILES.ORE) {
            ctx.fillStyle = biome.rockColor;
            ctx.fillRect(renderX, renderY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#33ff66';
            ctx.fillRect(renderX + 8, renderY + 8, 16, 16);
          } else if (tile === TILES.PORTAL) {
            ctx.fillStyle = ((tx + ty) % 2 === 0) ? biome.floorColor : '#120d24';
            ctx.fillRect(renderX, renderY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#ff0055';
            ctx.fillRect(renderX + 4, renderY + 4, 24, 24);
          } else if (tile === TILES.GATE) {
            ctx.fillStyle = '#ffb700';
            ctx.fillRect(renderX, renderY, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }

    drawWFCMap(mapGrid, camera, biome = BIOMES.BUNKER, game) {
      if (!mapGrid) return;
      if (!this.bgCanvas || (game && game.mapNeedsUpdate)) {
        this.renderMapToBgCanvas(mapGrid, biome);
        if (game) game.mapNeedsUpdate = false;
      }
      
      this.offCtx.drawImage(
        this.bgCanvas,
        Math.floor(camera.x), Math.floor(camera.y), this.width, this.height,
        0, 0, this.width, this.height
      );
    }

    applyLightingHalos(game) {
      const ctx = this.offCtx;
      const camX = game.camera.x;
      const camY = game.camera.y;

      if (game.player) {
        const px = Math.floor(game.player.x - camX);
        const py = Math.floor(game.player.y - camY);
        const grad = ctx.createRadialGradient(px, py, 4, px, py, 75);
        grad.addColorStop(0, 'rgba(51, 255, 102, 0.16)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(px, py, 75, 0, Math.PI * 2); ctx.fill();
      }

      for (let s of game.structureManager.structures) {
        if (s.type.id === 'NODE') {
          const nx = Math.floor(s.x - camX);
          const ny = Math.floor(s.y - camY);
          const grad = ctx.createRadialGradient(nx, ny, 6, nx, ny, 85);
          grad.addColorStop(0, 'rgba(0, 240, 255, 0.20)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.arc(nx, ny, 85, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    applyOrderedDithering(cameraX = 0, cameraY = 0) {
      const imageData = this.offCtx.getImageData(0, 0, this.width, this.height);
      const buf = imageData.data.buffer;
      const data32 = new Uint32Array(buf);
      const w = this.width;
      const h = this.height;
      const camXInt = Math.floor(cameraX) & 3;
      const camYInt = Math.floor(cameraY) & 3;

      for (let y = 0; y < h; y++) {
        const worldY = y + camYInt;
        const rowOffset = y * w;
        for (let x = 0; x < w; x++) {
          const worldX = x + camXInt;
          const idx = rowOffset + x;
          const pixel = data32[idx];
          const r = pixel & 0xff;
          const g = (pixel >> 8) & 0xff;
          const b = (pixel >> 16) & 0xff;

          data32[idx] = quantizeColorFast32(r, g, b, worldX, worldY, 0.22);
        }
      }
      this.offCtx.putImageData(imageData, 0, 0);
    }

    renderToScreen(screenCtx, mainWidth, mainHeight) {
      screenCtx.save();
      screenCtx.fillStyle = '#000000';
      screenCtx.fillRect(0, 0, mainWidth, mainHeight);
      screenCtx.imageSmoothingEnabled = false;

      screenCtx.drawImage(
        this.offCanvas,
        0, 0, this.width, this.height,
        0, 0, mainWidth, mainHeight
      );

      // CRT Scanlines Pass (Pure In-Canvas)
      screenCtx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      for (let y = 0; y < mainHeight; y += 4) {
        screenCtx.fillRect(0, y + 2, mainWidth, 2);
      }

      // CRT Radial Vignette Pass (Pure In-Canvas)
      const cx = mainWidth / 2;
      const cy = mainHeight / 2;
      const vig = screenCtx.createRadialGradient(cx, cy, mainHeight * 0.35, cx, cy, mainHeight * 0.85);
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
      screenCtx.fillStyle = vig;
      screenCtx.fillRect(0, 0, mainWidth, mainHeight);

      screenCtx.restore();
    }
  }

  // --- 15. MAIN GAME CONTROLLER ---
  const GAME_STATES = { TITLE: 'TITLE', PLAYING: 'PLAYING', PAUSED: 'PAUSED', GAMEOVER: 'GAMEOVER' };

  class Game {
    constructor() {
      this.state = GAME_STATES.TITLE;
      this.mainCanvas = document.getElementById('game-canvas');
      this.mainCanvas.width = 1280;
      this.mainCanvas.height = 896;
      this.mainCtx = this.mainCanvas.getContext('2d');
      this.mainCtx.imageSmoothingEnabled = false;

      this.renderer = new Renderer(320, 224);
      this.camera = new Camera(320, 224);

      this.particleManager = new ParticleManager();
      this.popupManager = new PopupManager();
      this.debrisManager = new DebrisManager();
      this.structureManager = new StructureManager();
      this.crateManager = new CrateManager();

      const wfc = WFCLevelGenerator.generateMap();
      this.mapGrid = wfc.grid;
      this.rooms = wfc.rooms;
      this.oreHp = wfc.oreHp;

      this.player = new Player(768, 768);
      this.enemies = [];
      this.bullets = [];

      this.biomass = 60;
      this.score = 0;
      this.waveNumber = 1;
      this.claimedSectors = 1;
      this.powerTier = 1;
      this.powerMultiplier = 1.0;
      this.speedMultiplier = 1.0;

      this.currentBiome = BIOMES.BUNKER;
      this.selectedBuildType = null;

      this.keys = {};
      this.mousePos = { x: 160, y: 112, rawClientX: 0, rawClientY: 0, isDown: false };

      this.setupInput();
      window.game = this;
    }

    setupInput() {
      window.addEventListener('keydown', (e) => {
        this.keys[e.key] = true;
        if (e.code) this.keys[e.code] = true;

        if (e.key === 'Escape' || e.code === 'Escape') {
          if (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.PAUSED) {
            this.togglePause();
          } else {
            this.selectedBuildType = null;
          }
        }

        if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter' || e.code === 'Enter') {
          if (this.state === GAME_STATES.TITLE || this.state === GAME_STATES.GAMEOVER) {
            this.startGame();
          }
        }

        if (this.state === GAME_STATES.PLAYING) {
          if (e.key === '1' || e.code === 'Digit1') this.selectedBuildType = (this.selectedBuildType && this.selectedBuildType.id === 'WALL' ? null : STRUCTURE_TYPES.WALL);
          if (e.key === '2' || e.code === 'Digit2') this.selectedBuildType = (this.selectedBuildType && this.selectedBuildType.id === 'TURRET' ? null : STRUCTURE_TYPES.TURRET);
          if (e.key === '3' || e.code === 'Digit3') this.selectedBuildType = (this.selectedBuildType && this.selectedBuildType.id === 'TRAP' ? null : STRUCTURE_TYPES.TRAP);
          if (e.key === '4' || e.code === 'Digit4') this.selectedBuildType = (this.selectedBuildType && this.selectedBuildType.id === 'NODE' ? null : STRUCTURE_TYPES.NODE);
        }
      });

      window.addEventListener('keyup', (e) => {
        this.keys[e.key] = false;
        if (e.code) this.keys[e.code] = false;
      });

      this.mainCanvas.addEventListener('mousemove', (e) => {
        const rect = this.mainCanvas.getBoundingClientRect();
        const scale = Math.min(rect.width / 320, rect.height / 224);
        const drawnWidth = 320 * scale;
        const drawnHeight = 224 * scale;
        const offsetX = (rect.width - drawnWidth) / 2;
        const offsetY = (rect.height - drawnHeight) / 2;

        this.mousePos.rawClientX = e.clientX;
        this.mousePos.rawClientY = e.clientY;
        this.mousePos.x = (e.clientX - rect.left - offsetX) / scale;
        this.mousePos.y = (e.clientY - rect.top - offsetY) / scale;
      });

      this.mainCanvas.addEventListener('mousedown', (e) => {
        const mx = this.mousePos.x;
        const my = this.mousePos.y;

        if (e.button === 0) {
          if (this.state === GAME_STATES.TITLE) {
            if (this.titleButtons) {
              const s = this.titleButtons.start;
              const t = this.titleButtons.test;
              if (mx >= s.x && mx <= s.x + s.w && my >= s.y && my <= s.y + s.h) {
                this.startGame();
                return;
              }
              if (mx >= t.x && mx <= t.x + t.w && my >= t.y && my <= t.y + t.h) {
                this.startTestingArea();
                return;
              }
            }
          } else if (this.state === GAME_STATES.PAUSED) {
            if (this.pauseButtons) {
              const r = this.pauseButtons.resume;
              if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                this.togglePause();
                return;
              }
            }
          } else if (this.state === GAME_STATES.GAMEOVER) {
            if (this.gameoverButtons) {
              const r = this.gameoverButtons.restart;
              if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                this.startGame();
                return;
              }
            }
          } else if (this.state === GAME_STATES.PLAYING) {
            // Check if clicking build bar slots
            if (this.buildSlotBounds) {
              for (const slot of this.buildSlotBounds) {
                if (mx >= slot.x && mx <= slot.x + slot.w && my >= slot.y && my <= slot.y + slot.h) {
                  this.selectedBuildType = (this.selectedBuildType && this.selectedBuildType.id === slot.item.type.id) ? null : slot.item.type;
                  return;
                }
              }
            }

            this.mousePos.isDown = true;
            if (this.selectedBuildType) {
              const worldX = this.mousePos.x + this.camera.x;
              const worldY = this.mousePos.y + this.camera.y;
              if (this.structureManager.addStructure(worldX, worldY, this.selectedBuildType, this)) {
                this.selectedBuildType = null;
              }
            }
          }
        } else if (e.button === 2) {
          e.preventDefault();
          this.selectedBuildType = null;
        }
      });

      this.mainCanvas.addEventListener('mouseup', () => this.mousePos.isDown = false);
      this.mainCanvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    recalculateTerritory() {
      let count = 1;
      for (let s of this.structureManager.structures) {
        if (s.type.id === 'NODE') count++;
      }
      this.claimedSectors = count;

      this.powerTier = count;
      this.powerMultiplier = 1.0 + (count - 1) * 0.35;
      this.speedMultiplier = 1.0 + (count - 1) * 0.15;
      this.player.maxHp = 100 + (count - 1) * 25;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 25);

      if (this.popupManager) {
        this.popupManager.addPopup(this.player.x, this.player.y - 14, `POWER TIER ${this.powerTier}!`, '#00f0ff');
      }

      if (this.claimedSectors >= 3 && this.currentBiome === BIOMES.BUNKER) {
        this.currentBiome = BIOMES.DESERT;
        this.mapNeedsUpdate = true;
      } else if (this.claimedSectors >= 5 && this.currentBiome === BIOMES.DESERT) {
        this.currentBiome = BIOMES.CITY;
        this.mapNeedsUpdate = true;
      }

      this.triggerAICounterAttack();
    }

    triggerAICounterAttack() {
      const count = 8 + this.powerTier * 4;
      const portals = [];
      for (let y = 0; y < MAP_TILES; y++) {
        for (let x = 0; x < MAP_TILES; x++) {
          if (this.mapGrid[y][x] === TILES.PORTAL) portals.push({ x: x * TILE_SIZE + 16, y: y * TILE_SIZE + 16 });
        }
      }

      for (let i = 0; i < count; i++) {
        let spawnPos = { x: 768 + (Math.random() - 0.5) * 200, y: 768 + (Math.random() - 0.5) * 200 };
        if (portals.length > 0) {
          const p = portals[(Math.random() * portals.length) | 0];
          spawnPos = { x: p.x + (Math.random() - 0.5) * 20, y: p.y + (Math.random() - 0.5) * 20 };
        }
        const type = Math.random() < 0.5 ? ENEMY_TYPES.SWARMER : (Math.random() < 0.85 ? ENEMY_TYPES.HUNTER : ENEMY_TYPES.TITAN);
        this.enemies.push(new Enemy(spawnPos.x, spawnPos.y, type));
      }
    }

    startGame() {
      soundEngine.init();

      const wfc = WFCLevelGenerator.generateMap();
      this.mapGrid = wfc.grid;
      this.rooms = wfc.rooms;
      this.oreHp = wfc.oreHp;
      this.mapNeedsUpdate = true;
      if (this.debrisManager) this.debrisManager.initBloodCanvas();

      this.player = new Player(768, 768);
      this.camera.x = 768 - 160;
      this.camera.y = 768 - 112;

      this.enemies = [];
      this.bullets = [];
      this.biomass = 60;
      this.score = 0;
      this.waveNumber = 1;
      this.claimedSectors = 1;
      this.powerTier = 1;
      this.powerMultiplier = 1.0;
      this.speedMultiplier = 1.0;
      this.currentBiome = BIOMES.BUNKER;
      this.selectedBuildType = null;
      this.testingManager = null;

      this.state = GAME_STATES.PLAYING;
      this.spawnWave();
      this.lastTime = performance.now();
    }

    startTestingArea() {
      soundEngine.init();

      // Exact 15x15 Tile Arena (TX: 16..30 [512..992px], TY: 16..30 [512..992px])
      const minTX = 16, maxTX = 30;
      const minTY = 16, maxTY = 30;
      const grid = Array.from({ length: MAP_TILES }, (_, y) =>
        Array.from({ length: MAP_TILES }, (_, x) => {
          if (x >= minTX && x <= maxTX && y >= minTY && y <= maxTY) {
            if (x === minTX || x === maxTX || y === minTY || y === maxTY) {
              return TILES.WALL_TOP;
            }
            return TILES.FLOOR;
          }
          return TILES.VOID;
        })
      );
      const oreHp = Array.from({ length: MAP_TILES }, () => Array(MAP_TILES).fill(0));
      this.mapGrid = grid;
      this.oreHp = oreHp;
      this.rooms = [];
      this.mapNeedsUpdate = true;
      if (this.debrisManager) this.debrisManager.initBloodCanvas();

      // Center Player in Middle Tile (TX=23, TY=23 -> X=752, Y=752)
      const centerPX = 23 * TILE_SIZE + 16; // 752
      const centerPY = 23 * TILE_SIZE + 16; // 752
      this.player = new Player(centerPX, centerPY);
      this.camera.x = centerPX - 160;
      this.camera.y = centerPY - 112;

      // Spawn fixed reference splatters centered on floor blocks (TX=21, 23, 25 at TY=23 -> Y=752)
      if (this.debrisManager) {
        const dm = this.debrisManager;
        const cy = 23 * TILE_SIZE + 16; // 752
        // 1. Swarmer Scarlet Red Splatter (TX=21 -> X=688)
        dm.addFloorStain(21 * TILE_SIZE + 16, cy, Math.PI * 0.15, 14.0, { r: 120, g: 15, b: 35 }, this.mapGrid, 101);
        // 2. Hunter Amber Gold Splatter (TX=23 -> X=752)
        dm.addFloorStain(23 * TILE_SIZE + 16, cy, Math.PI * 0.35, 16.5, { r: 175, g: 125, b: 15 }, this.mapGrid, 202);
        // 3. Titan Electric Cyan Splatter (TX=25 -> X=816)
        dm.addFloorStain(25 * TILE_SIZE + 16, cy, Math.PI * 0.75, 22.0, { r: 25, g: 185, b: 235 }, this.mapGrid, 303);

        // Pre-soak fluid for 45 frames so stains are fully settled and vivid
        for (let f = 0; f < 45; f++) {
          dm.update(1.0, this.mapGrid);
        }
      }

      this.enemies = [];
      this.bullets = [];
      this.biomass = 9999;
      this.score = 0;
      this.waveNumber = 0;
      this.claimedSectors = 1;
      this.powerTier = 1;
      this.powerMultiplier = 1.0;
      this.speedMultiplier = 1.0;
      this.currentBiome = BIOMES.BUNKER;
      this.selectedBuildType = null;
      this.testingManager = new TestingManager(this);

      this.state = GAME_STATES.PLAYING;
      this.lastTime = performance.now();
    }

    spawnWave() {
      const isSurge = this.waveNumber > 1 && this.waveNumber % 5 === 0;
      const count = 8 + this.waveNumber * 3 + this.claimedSectors * 3 + (isSurge ? 8 : 0);
      const portals = [];

      if (isSurge && this.popupManager && this.player) {
        this.popupManager.addPopup(this.player.x, this.player.y - 20, `⚠️ HIVE SURGE WAVE ${this.waveNumber}!`, '#ff0055');
      }

      for (let y = 0; y < MAP_TILES; y++) {
        for (let x = 0; x < MAP_TILES; x++) {
          if (this.mapGrid[y][x] === TILES.PORTAL) {
            portals.push({ x: x * TILE_SIZE + 16, y: y * TILE_SIZE + 16 });
          }
        }
      }

      for (let i = 0; i < count; i++) {
        let spawnPos = { x: 768 + (Math.random() - 0.5) * 200, y: 768 + (Math.random() - 0.5) * 200 };
        if (portals.length > 0) {
          const p = portals[(Math.random() * portals.length) | 0];
          spawnPos = { x: p.x + (Math.random() - 0.5) * 20, y: p.y + (Math.random() - 0.5) * 20 };
        }

        const type = Math.random() < 0.6 ? ENEMY_TYPES.SWARMER : (Math.random() < 0.85 ? ENEMY_TYPES.HUNTER : ENEMY_TYPES.TITAN);
        this.enemies.push(new Enemy(spawnPos.x, spawnPos.y, type));
      }
    }

    togglePause() {
      if (this.state === GAME_STATES.PLAYING) {
        this.state = GAME_STATES.PAUSED;
      } else if (this.state === GAME_STATES.PAUSED) {
        this.state = GAME_STATES.PLAYING;
        this.lastTime = performance.now();
      }
    }

    gameOver() {
      this.state = GAME_STATES.GAMEOVER;
    }

    update(dt) {
      if (this.state !== GAME_STATES.PLAYING) return;

      this.player.update(this.keys, this.mousePos, this.mapGrid, this.bullets, dt, this.debrisManager, this.camera, this);
      if (this.player.hp <= 0) {
        if (this.testingManager) { this.player.hp = this.player.maxHp; }
        else { this.gameOver(); return; }
      }

      if (this.testingManager) {
        // Clamp camera strictly inside 15x15 arena (TX: 16..30 -> 512..992px)
        const roomMinX = 16 * TILE_SIZE; // 512
        const roomMaxX = 31 * TILE_SIZE; // 992
        const roomMinY = 16 * TILE_SIZE; // 512
        const roomMaxY = 31 * TILE_SIZE; // 992
        this.camera.follow(this.player.x, this.player.y, roomMinX, roomMinY, roomMaxX, roomMaxY, dt);
      } else {
        this.camera.follow(this.player.x, this.player.y, 0, 0, MAP_TILES * TILE_SIZE, MAP_TILES * TILE_SIZE, dt);
      }

      this.particleManager.update(dt);
      this.popupManager.update(dt);

      if (this.testingManager) {
        this.testingManager.update(dt);
        for (let i = this.bullets.length - 1; i >= 0; i--) {
          const b = this.bullets[i];
          if (!b) continue;
          b.update(this.mapGrid, dt, this);
          if (b.dead) fastRemove(this.bullets, i);
        }
        this.debrisManager.update(dt, this.mapGrid);
      } else {
        this.structureManager.update(dt, this.enemies, this.bullets, this);
        this.crateManager.update(this.player, dt, this);
        this.debrisManager.update(dt, this.mapGrid);

        for (let i = this.bullets.length - 1; i >= 0; i--) {
          const b = this.bullets[i];
          if (!b) continue;
          b.update(this.mapGrid, dt, this);

          for (let j = this.enemies.length - 1; j >= 0; j--) {
            const e = this.enemies[j];
            const dx = b.x - e.x;
            const dy = b.y - e.y;
            const maxD = (b.size + e.size) * 0.6;
            if (dx * dx + dy * dy < maxD * maxD) {
              e.takeDamage(b.damage, this.particleManager, null, this.debrisManager, this.popupManager, b.vx, b.vy, 2.5, b.vx, b.vy, this.mapGrid);

              // Rocket splash blast on enemy hit
              if (b.weapon && b.weapon.explosionRadius) {
                soundEngine.playExplosion();
                if (this.particleManager) this.particleManager.addEpicBlast(b.x, b.y, this);
                for (let k = this.enemies.length - 1; k >= 0; k--) {
                  const other = this.enemies[k];
                  if (other === e) continue;
                  const d2 = Math.hypot(other.x - b.x, other.y - b.y);
                  if (d2 < b.weapon.explosionRadius) {
                    other.takeDamage(b.damage * 0.7, this.particleManager, null, this.debrisManager, this.popupManager, other.x - b.x, other.y - b.y, 3.5, 0, 0, this.mapGrid);
                    if (other.dead) {
                      this.biomass += other.type.biomass;
                      this.score += other.type.biomass * 10;
                      fastRemove(this.enemies, k);
                      if (k < j) j--; // adjust outer loop index if deleted before j
                    }
                  }
                }
              }

              if (!b.piercing) b.dead = true;

              if (e.dead) {
                this.biomass += e.type.biomass;
                this.score += e.type.biomass * 10;
                fastRemove(this.enemies, j);
              }
              break;
            }
          }
          if (b.dead) fastRemove(this.bullets, i);
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
          const e = this.enemies[i];
          if (!e) continue;
          e.update(this.player, this.mapGrid, dt, this.structureManager.structures);

          const dx = e.x - this.player.x;
          const dy = e.y - this.player.y;
          const maxD = (e.size + this.player.size) * 0.5;
          if (dx * dx + dy * dy < maxD * maxD) {
            this.player.takeDamage(10 * dt, this);
          }
        }

        if (this.enemies.length === 0) {
          this.waveNumber++;
          this.spawnWave();
        }
      }
    }

    drawInCanvasHUD(ctx) {
      if (this.state !== GAME_STATES.PLAYING && this.state !== GAME_STATES.PAUSED) return;

      // --- Clean Arcade Top Bar (320x224) ---
      // 1. HP
      const hpVal = Math.max(0, Math.floor(this.player.hp));
      const hpCol = hpVal > 30 ? '#ff0055' : '#ff3333';
      PixelFont.draw(ctx, `HP ${hpVal}%`, 6, 6, hpCol, 1, 'left', true);

      // 2. Biomass
      PixelFont.draw(ctx, `BIO ${this.biomass}`, 60, 6, '#33ff66', 1, 'left', true);

      // 3. Current Weapon
      const wpnStr = this.player.currentWeapon.name;
      PixelFont.draw(ctx, wpnStr, 160, 6, '#00f0ff', 1, 'center', true);

      // 4. Wave & Score
      PixelFont.draw(ctx, `WAVE ${this.waveNumber}`, 240, 6, '#ffb700', 1, 'left', true);
      const scoreStr = this.score.toString().padStart(6, '0');
      PixelFont.draw(ctx, scoreStr, 314, 6, '#ffffff', 1, 'right', true);

      // --- Clean Minimal Bottom Build Bar ---
      const buildItems = [
        { key: '1', name: 'WALL', cost: '15', type: STRUCTURE_TYPES.WALL },
        { key: '2', name: 'TURRET', cost: '35', type: STRUCTURE_TYPES.TURRET },
        { key: '3', name: 'TRAP', cost: '20', type: STRUCTURE_TYPES.TRAP },
        { key: '4', name: 'NODE', cost: '60', type: STRUCTURE_TYPES.NODE }
      ];

      const slotW = 56;
      const slotH = 9;
      const totalBW = buildItems.length * slotW + (buildItems.length - 1) * 4;
      const startBX = Math.floor((320 - totalBW) / 2);
      const slotY = 224 - slotH - 4;

      this.buildSlotBounds = [];
      for (let i = 0; i < buildItems.length; i++) {
        const item = buildItems[i];
        const bx = startBX + i * (slotW + 4);
        const isSelected = (this.selectedBuildType && this.selectedBuildType.id === item.type.id);
        const isHovered = (this.mousePos.x >= bx && this.mousePos.x <= bx + slotW && this.mousePos.y >= slotY && this.mousePos.y <= slotY + slotH);

        this.buildSlotBounds.push({ x: bx, y: slotY, w: slotW, h: slotH, item });

        // Background
        ctx.fillStyle = isSelected ? 'rgba(10, 45, 25, 0.85)' : (isHovered ? 'rgba(25, 25, 45, 0.85)' : 'rgba(4, 3, 8, 0.7)');
        ctx.fillRect(bx, slotY, slotW, slotH);

        // Border / Underline
        if (isSelected) {
          ctx.strokeStyle = '#33ff66';
          ctx.lineWidth = 1;
          ctx.strokeRect(bx, slotY, slotW, slotH);
        } else if (isHovered) {
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 1;
          ctx.strokeRect(bx, slotY, slotW, slotH);
        }

        const col = isSelected ? '#33ff66' : (isHovered ? '#00f0ff' : '#aaaaaa');
        PixelFont.draw(ctx, `[${item.key}] ${item.name} ${item.cost}`, bx + 3, slotY + 2, col, 1, 'left', true);
      }
    }

    drawInCanvasOverlays(ctx) {
      const w = 320;
      const h = 224;

      if (this.state === GAME_STATES.TITLE) {
        ctx.fillStyle = 'rgba(4, 3, 8, 0.90)';
        ctx.fillRect(0, 0, w, h);

        // Three distinct text tiers for Title (matching original 3-tier style)
        // Tier 1: TOP-DOWN (scale 2)
        const topDownW = 62; // 8 chars * 8px - 2px
        PixelFont.draw(ctx, 'TOP-DOWN', w / 2, 34, '#ff0055', 2, 'center', true);
        PixelFont.draw(ctx, 'TOP-DOWN', w / 2 - 1, 33, '#ffb700', 2, 'center', false);

        // Tier 2: SHOOTER (scale 2, stretched to match TOP-DOWN width)
        PixelFont.drawStretched(ctx, 'SHOOTER', w / 2, 48, topDownW, '#33ff66', 2, true);

        // Tier 3: Muted Neutral Tagline (scale 1)
        PixelFont.draw(ctx, 'PROTOTYPE', w / 2, 66, '#666677', 1, 'center', true);

        // Menu Items (scale 1)
        const btnStartW = 140, btnStartH = 14;
        const btnStartX = Math.floor((w - btnStartW) / 2);
        const btnStartY = 96;
        const hoverStart = (this.mousePos.x >= btnStartX && this.mousePos.x <= btnStartX + btnStartW && this.mousePos.y >= btnStartY && this.mousePos.y <= btnStartY + btnStartH);

        const btnTestW = 140, btnTestH = 14;
        const btnTestX = Math.floor((w - btnTestW) / 2);
        const btnTestY = 118;
        const hoverTest = (this.mousePos.x >= btnTestX && this.mousePos.x <= btnTestX + btnTestW && this.mousePos.y >= btnTestY && this.mousePos.y <= btnTestY + btnTestH);

        // Animation timing
        const now = performance.now();
        const arrowAnim = Math.round(Math.sin(now * 0.0035) * 1.5);

        // Helper: draw ONLY arcade corner brackets (NO connecting lines) & subtle plate
        const drawButtonPlate = (bx, by, bw, bh, hovered, hoverColor, idleColor = '#4a3d66') => {
          // Dark background plate
          ctx.fillStyle = hovered ? 'rgba(255, 255, 255, 0.04)' : 'rgba(14, 10, 24, 0.65)';
          ctx.fillRect(bx, by, bw, bh);

          // 4 Discrete Corner Brackets ONLY (No connecting lines between them)
          const cCol = hovered ? hoverColor : idleColor;
          ctx.fillStyle = cCol;
          // Top-Left ⌜
          ctx.fillRect(bx, by, 4, 1);
          ctx.fillRect(bx, by + 1, 1, 3);
          // Top-Right ⌝
          ctx.fillRect(bx + bw - 4, by, 4, 1);
          ctx.fillRect(bx + bw - 1, by + 1, 1, 3);
          // Bottom-Left ⌞
          ctx.fillRect(bx, by + bh - 1, 4, 1);
          ctx.fillRect(bx, by + bh - 4, 1, 3);
          // Bottom-Right ⌟
          ctx.fillRect(bx + bw - 4, by + bh - 1, 4, 1);
          ctx.fillRect(bx + bw - 1, by + bh - 4, 1, 3);
        };

        // 1. START Button Plate & Hover
        drawButtonPlate(btnStartX, btnStartY, btnStartW, btnStartH, hoverStart, '#ff0055', '#4a3d66');
        if (hoverStart) {
          ctx.fillStyle = 'rgba(255, 0, 85, 0.22)';
          ctx.fillRect(btnStartX, btnStartY, btnStartW, btnStartH);
        }

        const startText = 'START [SPACE]';
        const startW = PixelFont.getTextWidth(startText, 1);
        PixelFont.draw(ctx, startText, w / 2, btnStartY + 4, hoverStart ? '#ffffff' : '#9999aa', 1, 'center', true);

        if (hoverStart) {
          // Slow animated bouncing arrows matching crimson button color
          PixelFont.draw(ctx, '>', (w / 2) - Math.floor(startW / 2) - 8 - arrowAnim, btnStartY + 4, '#ff0055', 1, 'center', true);
          PixelFont.draw(ctx, '<', (w / 2) + Math.floor(startW / 2) + 8 + arrowAnim, btnStartY + 4, '#ff0055', 1, 'center', true);
        }

        // 2. TESTING AREA Button Plate & Hazard Stripes
        drawButtonPlate(btnTestX, btnTestY, btnTestW, btnTestH, hoverTest, '#ffb700', '#4a3d66');
        if (hoverTest) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(btnTestX, btnTestY, btnTestW, btnTestH);
          ctx.clip();

          // Slower diagonal hazard stripes moving to the LEFT
          const stripeW = 8;
          const shiftLeft = (stripeW * 2) - (Math.floor(now * 0.012) % (stripeW * 2));
          for (let sx = -stripeW * 3; sx < btnTestW + stripeW * 3; sx += stripeW * 2) {
            ctx.fillStyle = 'rgba(255, 183, 0, 0.22)';
            ctx.beginPath();
            ctx.moveTo(btnTestX + sx + shiftLeft, btnTestY);
            ctx.lineTo(btnTestX + sx + shiftLeft + stripeW, btnTestY);
            ctx.lineTo(btnTestX + sx + shiftLeft, btnTestY + btnTestH);
            ctx.lineTo(btnTestX + sx + shiftLeft - stripeW, btnTestY + btnTestH);
            ctx.closePath();
            ctx.fill();
          }

          ctx.strokeStyle = '#ffb700';
          ctx.lineWidth = 1;
          ctx.strokeRect(btnTestX, btnTestY, btnTestW, btnTestH);
          ctx.restore();
        }

        // TESTING AREA button text & animated bouncing arrows
        const testText = 'TESTING AREA';
        const testW = PixelFont.getTextWidth(testText, 1);
        PixelFont.draw(ctx, testText, w / 2, btnTestY + 4, hoverTest ? '#ffb700' : '#9999aa', 1, 'center', true);

        if (hoverTest) {
          // Slow animated bouncing arrows matching button yellow/gold color
          PixelFont.draw(ctx, '>', (w / 2) - Math.floor(testW / 2) - 8 - arrowAnim, btnTestY + 4, '#ffb700', 1, 'center', true);
          PixelFont.draw(ctx, '<', (w / 2) + Math.floor(testW / 2) + 8 + arrowAnim, btnTestY + 4, '#ffb700', 1, 'center', true);
        }

        this.titleButtons = {
          start: { x: btnStartX, y: btnStartY, w: btnStartW, h: btnStartH },
          test: { x: btnTestX, y: btnTestY, w: btnTestW, h: btnTestH }
        };

        // Controls hint
        PixelFont.draw(ctx, 'WASD: MOVE  |  MOUSE: AIM & SHOOT  |  SPACE: DASH', w / 2, 160, '#555566', 1, 'center', true);
        PixelFont.draw(ctx, '1-4: BUILD DEFENSES  |  ESC: PAUSE', w / 2, 172, '#555566', 1, 'center', true);
      } else if (this.state === GAME_STATES.PAUSED) {
        ctx.fillStyle = 'rgba(4, 3, 8, 0.85)';
        ctx.fillRect(0, 0, w, h);

        PixelFont.draw(ctx, 'GAME PAUSED', w / 2, 80, '#ffb700', 2, 'center', true);

        const btnResumeW = 120, btnResumeH = 14;
        const btnResumeX = Math.floor((w - btnResumeW) / 2);
        const btnResumeY = 110;
        const hoverResume = (this.mousePos.x >= btnResumeX && this.mousePos.x <= btnResumeX + btnResumeW && this.mousePos.y >= btnResumeY && this.mousePos.y <= btnResumeY + btnResumeH);

        if (hoverResume) {
          ctx.fillStyle = 'rgba(255, 0, 85, 0.2)';
          ctx.fillRect(btnResumeX, btnResumeY, btnResumeW, btnResumeH);
        }
        PixelFont.draw(ctx, hoverResume ? '> RESUME [ESC] <' : '  RESUME [ESC]  ', w / 2, btnResumeY + 4, hoverResume ? '#ff0055' : '#ffffff', 1, 'center', true);

        this.pauseButtons = {
          resume: { x: btnResumeX, y: btnResumeY, w: btnResumeW, h: btnResumeH }
        };
      } else if (this.state === GAME_STATES.GAMEOVER) {
        ctx.fillStyle = 'rgba(4, 3, 8, 0.92)';
        ctx.fillRect(0, 0, w, h);

        PixelFont.draw(ctx, 'GAME OVER', w / 2, 60, '#ff0055', 2, 'center', true);
        PixelFont.draw(ctx, 'PROTOTYPE SESSION COMPLETE', w / 2, 80, '#666677', 1, 'center', true);
        PixelFont.draw(ctx, `FINAL SCORE: ${this.score}`, w / 2, 100, '#ffffff', 1, 'center', true);

        const btnRestartW = 140, btnRestartH = 14;
        const btnRestartX = Math.floor((w - btnRestartW) / 2);
        const btnRestartY = 125;
        const hoverRestart = (this.mousePos.x >= btnRestartX && this.mousePos.x <= btnRestartX + btnRestartW && this.mousePos.y >= btnRestartY && this.mousePos.y <= btnRestartY + btnRestartH);

        if (hoverRestart) {
          ctx.fillStyle = 'rgba(255, 183, 0, 0.2)';
          ctx.fillRect(btnRestartX, btnRestartY, btnRestartW, btnRestartH);
        }
        PixelFont.draw(ctx, hoverRestart ? '> RESTART [SPACE] <' : '  RESTART [SPACE]  ', w / 2, btnRestartY + 4, hoverRestart ? '#ffb700' : '#ffffff', 1, 'center', true);

        this.gameoverButtons = {
          restart: { x: btnRestartX, y: btnRestartY, w: btnRestartW, h: btnRestartH }
        };
      }
    }

    render() {
      const offCtx = this.renderer.getContext();
      this.renderer.clear(this.currentBiome);
      this.renderer.drawWFCMap(this.mapGrid, this.camera, this.currentBiome, this);

      this.debrisManager.draw(offCtx, this.camera.x, this.camera.y, this.mapGrid);

      if (this.testingManager) {
        this.testingManager.draw(offCtx, this.camera.x, this.camera.y);
      } else {
        this.structureManager.draw(offCtx, this.camera.x, this.camera.y);
        this.crateManager.draw(offCtx, this.camera.x, this.camera.y);
        for (let e of this.enemies) e.draw(offCtx, this.camera.x, this.camera.y);
      }
      for (let b of this.bullets) b.draw(offCtx, this.camera.x, this.camera.y);

      this.particleManager.draw(offCtx, this.camera.x, this.camera.y);
      this.popupManager.draw(offCtx, this.camera.x, this.camera.y);

      if (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.PAUSED) {
        this.player.draw(offCtx, this.camera.x, this.camera.y);

        const mx = Math.floor(this.mousePos.x);
        const my = Math.floor(this.mousePos.y);
        offCtx.strokeStyle = '#00f0ff';
        offCtx.lineWidth = 1;
        offCtx.strokeRect(mx - 3, my - 3, 6, 6);
        offCtx.fillStyle = '#00f0ff';
        offCtx.fillRect(mx, my, 1, 1);
      }

      if (this.selectedBuildType && this.state === GAME_STATES.PLAYING) {
        const mx = Math.floor(this.mousePos.x);
        const my = Math.floor(this.mousePos.y);
        const worldX = this.mousePos.x + this.camera.x;
        const worldY = this.mousePos.y + this.camera.y;
        const tx = (worldX / TILE_SIZE) | 0;
        const ty = (worldY / TILE_SIZE) | 0;

        const isInsideCreep = this.structureManager.isInsideBiomassCreep(worldX, worldY);
        const isBlocked = (tx < 0 || tx >= MAP_TILES || ty < 0 || ty >= MAP_TILES) ? true : WFCLevelGenerator.isSolid(this.mapGrid[ty][tx]);
        const isValid = isInsideCreep && !isBlocked && this.biomass >= this.selectedBuildType.cost;

        offCtx.strokeStyle = isValid ? '#33ff66' : '#ff3355';
        offCtx.lineWidth = 1;
        offCtx.strokeRect(mx - 8, my - 8, 16, 16);
        PixelFont.draw(offCtx, this.selectedBuildType.id, mx - 8, my - 16, '#ffffff', 1, 'left', true);
      }

      this.drawOffscreenEnemyIndicators(offCtx);
      this.renderer.applyLightingHalos(this);
      this.renderer.applyOrderedDithering(this.camera.x, this.camera.y);

      // In-Canvas HUD (rendered directly in 320x224 canvas)
      this.drawInCanvasHUD(offCtx);

      // In-Canvas Overlays (Title Screen, Pause, GameOver)
      this.drawInCanvasOverlays(offCtx);

      // Final Blit of 320x224 dithered world + CRT Scanlines & Vignette
      this.renderer.renderToScreen(this.mainCtx, this.mainCanvas.width, this.mainCanvas.height);
    }

    drawOffscreenEnemyIndicators(ctx) {
      if (this.state !== GAME_STATES.PLAYING) return;

      const camX = this.camera.x;
      const camY = this.camera.y;
      const viewW = 320;
      const viewH = 224;

      const cx = viewW / 2;
      const cy = viewH / 2;
      const margin = 12;
      const hw = cx - margin;
      const hh = cy - margin;
      const now = performance.now();

      for (let e of this.enemies) {
        const screenX = e.x - camX;
        const screenY = e.y - camY;

        if (screenX < 6 || screenX > viewW - 6 || screenY < 6 || screenY > viewH - 6) {
          const dx = screenX - cx;
          const dy = screenY - cy;
          const dist = Math.hypot(dx, dy);

          const scale = 1 / Math.max(Math.abs(dx / hw), Math.abs(dy / hh));
          const edgeX = cx + dx * scale;
          const edgeY = cy + dy * scale;
          const angle = Math.atan2(dy, dx);

          const proximityScale = Math.min(1.4, Math.max(1.0, 1.4 - (dist / 600)));

          ctx.save();
          ctx.translate(edgeX, edgeY);
          ctx.rotate(angle);
          ctx.scale(proximityScale, proximityScale);

          if (e.type === ENEMY_TYPES.SWARMER) {
            ctx.fillStyle = '#ff0055';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(7, 0);
            ctx.lineTo(-5, -5);
            ctx.lineTo(-2, 0);
            ctx.lineTo(-5, 5);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-1, -1, 2, 2);
          } else if (e.type === ENEMY_TYPES.HUNTER) {
            ctx.fillStyle = '#ffb700';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(0, -5);
            ctx.lineTo(-6, 0);
            ctx.lineTo(0, 5);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-1, -1, 2, 2);
          } else if (e.type === ENEMY_TYPES.TITAN) {
            const pulse = Math.sin(now * 0.012) * 1.2;
            ctx.fillStyle = '#00f0ff';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(9 + pulse, 0);
            ctx.lineTo(-4, -6);
            ctx.lineTo(0, 0);
            ctx.lineTo(-4, 6);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, -1, 3, 2);
          }

          ctx.restore();
        }
      }
    }

    loop(currentTime) {
      const dt = Math.min((currentTime - this.lastTime) / 1000 * 60, 2.5);
      this.lastTime = currentTime;
      this.update(dt);
      this.render();
      requestAnimationFrame((t) => this.loop(t));
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.loop(performance.now());
  });
})();
