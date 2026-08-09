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
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.08);
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
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(450, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain); gain.connect(this.masterGain);
      osc.start(); osc.stop(this.ctx.currentTime + 0.12);
    }
  }
  const soundEngine = new SoundEngine();

  // --- 3. DYNAMIC CAMERA ---
  class Camera {
    constructor(width = 320, height = 224) {
      this.x = 0;
      this.y = 0;
      this.width = width;
      this.height = height;
    }

    follow(targetX, targetY, worldW, worldH) {
      const destX = targetX - this.width / 2;
      const destY = targetY - this.height / 2;
      this.x += (destX - this.x) * 0.14;
      this.y += (destY - this.y) * 0.14;
      this.x = Math.max(0, Math.min(worldW - this.width, this.x));
      this.y = Math.max(0, Math.min(worldH - this.height, this.y));
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

  // --- 5. PARTICLE JUICE ENGINE ---
  class ParticleManager {
    constructor() { this.particles = []; }

    addSparks(x, y, color = '#33ff66', count = 6) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.0 + Math.random() * 3.5;
        this.particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          size: 1.2 + Math.random() * 1.8,
          life: 8 + Math.floor(Math.random() * 10)
        });
      }
    }

    addTrail(x, y, color = '#00ffaa', size = 2) {
      this.particles.push({
        x, y, vx: 0, vy: 0, color, size, life: 6
      });
    }

    addExplosion(x, y, color = '#ff3355', count = 14) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.0 + Math.random() * 4.5;
        this.particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: Math.random() < 0.5 ? color : '#ffb700',
          size: 2.0 + Math.random() * 2.5,
          life: 12 + Math.floor(Math.random() * 12)
        });
      }
    }

    update(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= Math.pow(0.85, dt);
        p.vy *= Math.pow(0.85, dt);
        p.life -= dt;
        if (p.life <= 0) fastRemove(this.particles, i);
      }
    }

    draw(ctx, camX, camY) {
      for (let p of this.particles) {
        const px = Math.floor(p.x - camX);
        const py = Math.floor(p.y - camY);
        if (px < -10 || px > 330 || py < -10 || py > 234) continue;
        ctx.fillStyle = p.color;
        ctx.fillRect(px - 1, py - 1, Math.floor(p.size), Math.floor(p.size));
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
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      for (let p of this.popups) {
        const px = Math.floor(p.x - camX);
        const py = Math.floor(p.y - camY);
        if (px < -20 || px > 340 || py < -20 || py > 244) continue;
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, px, py);
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
    VOID_RAIL: { name: 'VOID RAILGUN', color: '#00f0ff', fireRate: 580, spread: 0.0, speed: 15.0, damage: 85, size: 5, piercing: true, knockback: 5.0 }
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

    addFloorStain(x, y, angle, baseSize = 6, enemyColor = null, mapGrid = null) {
      if (!this.bloodCtx) this.initBloodCanvas();

      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const perpX = -sinA;
      const perpY = cosA;
      const baseCol = this.getBloodPalette(enemyColor);

      const isOrganicTitan = baseSize > 10.0;
      const lobeCount = isOrganicTitan ? (14 + Math.floor(Math.random() * 8)) : (6 + Math.floor(Math.random() * 5));
      const lobes = [];

      for (let i = 0; i < lobeCount; i++) {
        const progress = i / lobeCount;
        let forwardDist, sideDist, radius;

        if (isOrganicTitan) {
          // Organic starburst tendrils for Titan
          const tendrilAngle = angle + (Math.random() - 0.5) * Math.PI * 1.8;
          const dist = (Math.random() * 0.8 + 0.2) * baseSize * (1.8 + Math.random() * 1.2);
          forwardDist = Math.cos(tendrilAngle) * dist;
          sideDist = Math.sin(tendrilAngle) * dist;
          radius = Math.max(1.5, baseSize * (0.45 + Math.random() * 0.45) * (1.0 - dist / (baseSize * 3.5)));
        } else {
          forwardDist = (i === 0 ? 0 : progress * baseSize * (2.0 + Math.random() * 1.0)) + (Math.random() - 0.5) * (baseSize * 0.3);
          sideDist = (Math.random() - 0.5) * (baseSize * (1.2 * progress + 0.4));
          radius = Math.max(1.3, baseSize * (0.65 - progress * 0.35 + Math.random() * 0.3));
        }

        // Generate multi-tone shade variations inside the same puddle to break pure solid color
        let lr = baseCol.r;
        let lg = baseCol.g;
        let lb = baseCol.b;

        const shadeRoll = Math.random();
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

        lr = Math.max(0, Math.min(255, lr + Math.floor((Math.random() - 0.5) * 20)));
        lg = Math.max(0, Math.min(255, lg + Math.floor((Math.random() - 0.5) * 20)));
        lb = Math.max(0, Math.min(255, lb + Math.floor((Math.random() - 0.5) * 20)));

        lobes.push({
          relX: (i === 0 ? (Math.random() - 0.5) * 2 : (isOrganicTitan ? forwardDist : cosA * forwardDist + perpX * sideDist)),
          relY: (i === 0 ? (Math.random() - 0.5) * 2 : (isOrganicTitan ? sideDist : sinA * forwardDist + perpY * sideDist)),
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
      if (keys['w'] || keys['W'] || keys['ArrowUp']) moveY -= 1;
      if (keys['s'] || keys['S'] || keys['ArrowDown']) moveY += 1;
      if (keys['a'] || keys['A'] || keys['ArrowLeft']) moveX -= 1;
      if (keys['d'] || keys['D'] || keys['ArrowRight']) moveX += 1;

      const len = Math.hypot(moveX, moveY);
      if (len > 0) {
        moveX /= len;
        moveY /= len;
      }

      if (keys[' '] && this.dashCooldown <= 0 && len > 0) {
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
            if (gameRef && gameRef.particleManager && Math.random() < 0.3) {
              gameRef.particleManager.addTrail(this.x, this.y, this.color, 1.5);
            }

            const btx = (this.x / TILE_SIZE) | 0;
            const bty = (this.y / TILE_SIZE) | 0;

            if (btx >= 0 && btx < MAP_TILES && bty >= 0 && bty < MAP_TILES) {
              if (mapGrid[bty][btx] === TILES.ORE && gameRef) {
                gameRef.oreHp[bty][btx] -= this.damage;
                soundEngine.playMine();
                if (gameRef.particleManager) gameRef.particleManager.addSparks(this.x, this.y, '#33ff66', 6);

                if (gameRef.oreHp[bty][btx] <= 0) {
                  mapGrid[bty][btx] = TILES.FLOOR;
                  gameRef.mapNeedsUpdate = true;
                  gameRef.biomass += 25;
                  if (gameRef.popupManager) gameRef.popupManager.addPopup(this.x, this.y, '+25🧪 MINED!', '#33ff66');
                }
                this.dead = true;
                return;
              }

              if (WFCLevelGenerator.isSolid(mapGrid[bty][btx])) {
                if (gameRef && gameRef.particleManager) gameRef.particleManager.addSparks(this.x, this.y, this.color, 4);
                this.dead = true;
              }
            }
          },
          draw(ctx, camX, camY) {
            ctx.fillStyle = this.color;
            ctx.fillRect(Math.floor(this.x - camX) - 2, Math.floor(this.y - camY) - 2, this.size, this.size);
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

      let sprayDirX = bulletVx || knockbackDirX || 1;
      let sprayDirY = bulletVy || knockbackDirY || 0;
      if (debris) debris.addBloodSpray(this.x, this.y, sprayDirX, sprayDirY, this.hp <= 0, this.bloodColor, mapGrid, this.size);
      if (particles) particles.addSparks(this.x, this.y, this.color, 5);
      if (popups) popups.addPopup(this.x, this.y - 6, `-${Math.floor(amount)}`, '#ff3355');

      if (this.hp <= 0) {
        this.dead = true;
        soundEngine.playExplosion();
        if (particles) particles.addExplosion(this.x, this.y, this.color, 14);
      }
    }

    update(player, mapGrid, dt, structures) {
      if (this.flashFrames > 0) this.flashFrames -= dt;

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

      const sz = Math.floor(this.size);
      ctx.fillStyle = this.flashFrames > 0 ? '#ffffff' : this.color;
      ctx.fillRect(px - (sz >> 1), py - (sz >> 1), sz, sz);
      ctx.strokeStyle = 'rgba(5, 4, 10, 0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px - (sz >> 1), py - (sz >> 1), sz, sz);
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

        ctx.strokeStyle = '#ffb700';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(tx, ty, 14, 0, Math.PI * 2); ctx.stroke();

        ctx.fillStyle = '#ffb700';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`AIRDROP ${secs}s`, tx, ty - 18);
      }

      if (this.activeCrate) {
        const cx = Math.floor(this.activeCrate.x - camX);
        const cy = Math.floor(this.activeCrate.y - camY);
        ctx.fillStyle = '#ffb700';
        ctx.fillRect(cx - 7, cy - 7, 14, 14);
        ctx.fillStyle = '#000000';
        ctx.fillText('📦', cx, cy + 3);
      }
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
            const southIsFloor = (ty < MAP_TILES - 1) && (mapGrid[ty + 1][tx] === TILES.FLOOR);

            if (southIsFloor) {
              ctx.fillStyle = '#2a1a3d';
              ctx.fillRect(renderX, renderY + TILE_SIZE - wallHeightExtrusion, TILE_SIZE, wallHeightExtrusion);
              ctx.fillStyle = biome.wallColor;
              ctx.fillRect(renderX, renderY + TILE_SIZE - wallHeightExtrusion, TILE_SIZE, 2);
            }

            ctx.fillStyle = biome.wallColor;
            ctx.fillRect(renderX, renderY - wallHeightExtrusion, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.fillRect(renderX, renderY + TILE_SIZE - wallHeightExtrusion - 4, TILE_SIZE, 4);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.strokeRect(renderX, renderY - wallHeightExtrusion, TILE_SIZE, TILE_SIZE);

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
      screenCtx.restore();
    }
  }

  // --- 15. MAIN GAME CONTROLLER ---
  const GAME_STATES = { TITLE: 'TITLE', PLAYING: 'PLAYING', PAUSED: 'PAUSED', GAMEOVER: 'GAMEOVER' };

  class Game {
    constructor() {
      this.state = GAME_STATES.TITLE;
      this.mainCanvas = document.getElementById('game-canvas');
      this.mainCanvas.width = 320;
      this.mainCanvas.height = 224;
      this.mainCtx = this.mainCanvas.getContext('2d');
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
        if (e.key === '1') this.selectedBuildType = { id: 'WALL', cost: 15, hp: 100 };
        if (e.key === '2') this.selectedBuildType = { id: 'TURRET', cost: 35, hp: 50 };
        if (e.key === '3') this.selectedBuildType = { id: 'TRAP', cost: 20, hp: 30 };
        if (e.key === '4') this.selectedBuildType = { id: 'NODE', cost: 60, hp: 150 };
        if (e.key === 'Escape') this.selectedBuildType = null;
      });
      window.addEventListener('keyup', (e) => this.keys[e.key] = false);

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
        if (e.button === 0) {
          this.mousePos.isDown = true;
          if (this.selectedBuildType && this.state === GAME_STATES.PLAYING) {
            const worldX = this.mousePos.x + this.camera.x;
            const worldY = this.mousePos.y + this.camera.y;
            if (this.structureManager.addStructure(worldX, worldY, this.selectedBuildType, this)) {
              this.selectedBuildType = null;
            }
          }
        } else if (e.button === 2) {
          e.preventDefault();
          this.selectedBuildType = null;
        }
      });
      this.mainCanvas.addEventListener('mouseup', () => this.mousePos.isDown = false);
      this.mainCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

      document.getElementById('btn-start')?.addEventListener('click', () => this.startGame());
      document.getElementById('btn-restart')?.addEventListener('click', () => this.startGame());
      document.getElementById('btn-resume')?.addEventListener('click', () => this.togglePause());
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

      const elTerritory = document.getElementById('ui-territory');
      if (elTerritory) elTerritory.innerText = `${Math.min(100, count * 20)}% (POWER TIER ${this.powerTier})`;
      const elBiome = document.getElementById('ui-biome');
      if (elBiome) elBiome.innerText = this.currentBiome.name;

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

      document.getElementById('screen-title')?.classList.add('hidden');
      document.getElementById('screen-gameover')?.classList.add('hidden');
      document.getElementById('screen-pause')?.classList.add('hidden');

      this.state = GAME_STATES.PLAYING;
      this.spawnWave();
      this.lastTime = performance.now();
    }

    spawnWave() {
      const count = 8 + this.waveNumber * 3 + this.claimedSectors * 3;
      const portals = [];

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
        document.getElementById('screen-pause')?.classList.remove('hidden');
      } else if (this.state === GAME_STATES.PAUSED) {
        this.state = GAME_STATES.PLAYING;
        document.getElementById('screen-pause')?.classList.add('hidden');
        this.lastTime = performance.now();
      }
    }

    gameOver() {
      this.state = GAME_STATES.GAMEOVER;
      document.getElementById('final-score').innerText = this.score;
      document.getElementById('screen-gameover')?.classList.remove('hidden');
    }

    update(dt) {
      if (this.state !== GAME_STATES.PLAYING) return;

      this.player.update(this.keys, this.mousePos, this.mapGrid, this.bullets, dt, this.debrisManager, this.camera, this);
      if (this.player.hp <= 0) { this.gameOver(); return; }

      this.camera.follow(this.player.x, this.player.y, MAP_TILES * TILE_SIZE, MAP_TILES * TILE_SIZE);

      this.particleManager.update(dt);
      this.popupManager.update(dt);
      this.structureManager.update(dt, this.enemies, this.bullets, this);
      this.crateManager.update(this.player, dt, this);
      this.debrisManager.update(dt, this.mapGrid);

      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        b.update(this.mapGrid, dt, this);

        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          if (Math.hypot(b.x - e.x, b.y - e.y) < (b.size + e.size) * 0.6) {
            e.takeDamage(b.damage, this.particleManager, null, this.debrisManager, this.popupManager, b.vx, b.vy, 2.5, b.vx, b.vy, this.mapGrid);
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

        if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < (e.size + this.player.size) * 0.5) {
          this.player.takeDamage(10 * dt, this);
        }
      }

      if (this.enemies.length === 0) {
        this.waveNumber++;
        this.spawnWave();
      }

      const elBio = document.getElementById('ui-biomass');
      if (elBio) elBio.innerText = `🧪 ${this.biomass}`;
      const elHp = document.getElementById('ui-hp');
      if (elHp) elHp.innerText = `${Math.max(0, Math.floor(this.player.hp))}%`;
      const elWave = document.getElementById('ui-wave');
      if (elWave) elWave.innerText = `WAVE ${this.waveNumber}`;
      const elWeapon = document.getElementById('ui-weapon');
      if (elWeapon) elWeapon.innerText = this.player.currentWeapon.name;
      const elScore = document.getElementById('ui-score');
      if (elScore) elScore.innerText = this.score.toString().padStart(6, '0');
    }

    render() {
      const offCtx = this.renderer.getContext();
      this.renderer.clear(this.currentBiome);
      this.renderer.drawWFCMap(this.mapGrid, this.camera, this.currentBiome, this);

      this.debrisManager.draw(offCtx, this.camera.x, this.camera.y, this.mapGrid);
      this.structureManager.draw(offCtx, this.camera.x, this.camera.y);
      this.crateManager.draw(offCtx, this.camera.x, this.camera.y);

      for (let e of this.enemies) e.draw(offCtx, this.camera.x, this.camera.y);
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
        offCtx.fillStyle = '#ffffff';
        offCtx.font = '8px monospace';
        offCtx.fillText(this.selectedBuildType.id, mx - 10, my - 10);
      }

      this.drawOffscreenEnemyIndicators(offCtx);
      this.renderer.applyLightingHalos(this);
      this.renderer.applyOrderedDithering(this.camera.x, this.camera.y);
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
