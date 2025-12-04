/**
 * FullStackCraft v14 - The Universe Update
 * 65+ Items, Biomes, Day/Night, Save System
 */

const TILE_SIZE = 48;
const CHUNK_SIZE = 16;
const GRAVITY = 0.5;

// --- ID DEFINITIONS (1-99 Blocks, 100+ Tools, 200+ Items) ---
const BLOCKS = {
  0: { name: "Air", solid: false },
  // Nature
  1: { name: "Grass", color: "#5b8a36", solid: true, hardness: 50, drop: 2 },
  2: { name: "Dirt", color: "#704828", solid: true, hardness: 50, drop: 2 },
  3: {
    name: "Stone",
    color: "#757575",
    solid: true,
    hardness: 200,
    req: "pick",
    drop: 21,
  },
  4: {
    name: "OakLog",
    color: "#5d4037",
    solid: true,
    hardness: 150,
    req: "axe",
    drop: 4,
    type: "column",
  },
  5: {
    name: "OakLeaves",
    color: "#388e3c",
    solid: true,
    hardness: 10,
    drop: 200,
  },
  6: {
    name: "Water",
    color: "rgba(33,150,243,0.6)",
    solid: false,
    fluid: true,
  },
  7: { name: "Sand", color: "#fff59d", solid: true, hardness: 40, drop: 7 },
  8: {
    name: "Cactus",
    color: "#64dd17",
    solid: true,
    hardness: 40,
    drop: 8,
    type: "column",
  },
  9: { name: "Snow", color: "#ffffff", solid: true, hardness: 30, drop: 9 },
  10: {
    name: "Ice",
    color: "#80deea",
    solid: true,
    hardness: 50,
    drop: 10,
    type: "glass",
  },
  11: { name: "Clay", color: "#90a4ae", solid: true, hardness: 60, drop: 11 },
  12: {
    name: "Gravel",
    color: "#bdbdbd",
    solid: true,
    hardness: 50,
    drop: 12,
    type: "noise",
  },
  // Ores
  15: {
    name: "CoalOre",
    color: "#333",
    solid: true,
    hardness: 250,
    req: "pick",
    type: "ore",
    oreColor: "#000",
    drop: 201,
  },
  16: {
    name: "IronOre",
    color: "#aaa",
    solid: true,
    hardness: 300,
    req: "pick",
    type: "ore",
    oreColor: "#d7ccc8",
    drop: 202,
  },
  17: {
    name: "GoldOre",
    color: "#dd0",
    solid: true,
    hardness: 350,
    req: "pick",
    type: "ore",
    oreColor: "#ffca28",
    drop: 203,
  },
  18: {
    name: "DiamondOre",
    color: "#0ee",
    solid: true,
    hardness: 500,
    req: "pick",
    type: "ore",
    oreColor: "#00e5ff",
    drop: 204,
  },
  19: {
    name: "EmeraldOre",
    color: "#0f0",
    solid: true,
    hardness: 500,
    req: "pick",
    type: "ore",
    oreColor: "#00e676",
    drop: 205,
  },
  20: {
    name: "RubyOre",
    color: "#f00",
    solid: true,
    hardness: 600,
    req: "pick",
    type: "ore",
    oreColor: "#d50000",
    drop: 206,
  },
  // Wood Types
  25: {
    name: "BirchLog",
    color: "#f5f5f5",
    solid: true,
    hardness: 150,
    req: "axe",
    drop: 25,
    type: "column",
    detail: "#333",
  },
  26: {
    name: "BirchLeaves",
    color: "#8bc34a",
    solid: true,
    hardness: 10,
    drop: 200,
  },
  27: {
    name: "SpruceLog",
    color: "#3e2723",
    solid: true,
    hardness: 150,
    req: "axe",
    drop: 27,
    type: "column",
  },
  28: {
    name: "SpruceLeaves",
    color: "#1b5e20",
    solid: true,
    hardness: 10,
    drop: 200,
  },
  // Construction
  30: {
    name: "OakPlank",
    color: "#8d6e63",
    solid: true,
    hardness: 100,
    req: "axe",
    drop: 30,
    type: "plank",
  },
  31: {
    name: "BirchPlank",
    color: "#fff9c4",
    solid: true,
    hardness: 100,
    req: "axe",
    drop: 31,
    type: "plank",
  },
  32: {
    name: "SprucePlank",
    color: "#4e342e",
    solid: true,
    hardness: 100,
    req: "axe",
    drop: 32,
    type: "plank",
  },
  33: {
    name: "Cobble",
    color: "#616161",
    solid: true,
    hardness: 200,
    req: "pick",
    drop: 33,
    type: "brick",
  },
  34: {
    name: "Brick",
    color: "#d84315",
    solid: true,
    hardness: 200,
    req: "pick",
    drop: 34,
    type: "brick",
  },
  35: {
    name: "Glass",
    color: "rgba(255,255,255,0.3)",
    solid: true,
    hardness: 10,
    drop: 0,
    type: "glass",
  },
  36: {
    name: "Sandstone",
    color: "#ffecb3",
    solid: true,
    hardness: 150,
    req: "pick",
    drop: 36,
    type: "brick",
  },
  // Functional
  40: {
    name: "CraftTable",
    color: "#795548",
    solid: true,
    hardness: 150,
    req: "axe",
    drop: 40,
    type: "table",
  },
  41: {
    name: "Furnace",
    color: "#424242",
    solid: true,
    hardness: 200,
    req: "pick",
    drop: 41,
    type: "front",
    face: "#000",
  },
  42: {
    name: "Chest",
    color: "#ffb74d",
    solid: true,
    hardness: 150,
    req: "axe",
    drop: 42,
    type: "box",
  },
  43: {
    name: "TNT",
    color: "#ff1744",
    solid: true,
    hardness: 50,
    drop: 43,
    type: "tnt",
  },
  44: {
    name: "Torch",
    color: "#ffeb3b",
    solid: false,
    hardness: 1,
    drop: 44,
    type: "torch",
  },

  99: {
    name: "Bedrock",
    color: "#000",
    solid: true,
    hardness: Infinity,
    unbreakable: true,
  },
};

const ITEMS = {
  0: { name: "Air" },
  1: { name: "Hand", power: 1.0 },

  // Tools
  100: {
    name: "WoodPick",
    power: 3,
    type: "tool",
    toolType: "pick",
    iconColor: "#8d6e63",
  },
  101: {
    name: "StonePick",
    power: 5,
    type: "tool",
    toolType: "pick",
    iconColor: "#616161",
  },
  102: {
    name: "IronPick",
    power: 8,
    type: "tool",
    toolType: "pick",
    iconColor: "#bdbdbd",
  },
  103: {
    name: "GoldPick",
    power: 12,
    type: "tool",
    toolType: "pick",
    iconColor: "#ffca28",
  },
  104: {
    name: "DiaPick",
    power: 20,
    type: "tool",
    toolType: "pick",
    iconColor: "#00e5ff",
  },
  105: {
    name: "EmeraldPick",
    power: 25,
    type: "tool",
    toolType: "pick",
    iconColor: "#00e676",
  },
  106: {
    name: "RubyPick",
    power: 30,
    type: "tool",
    toolType: "pick",
    iconColor: "#d50000",
  },

  110: {
    name: "WoodAxe",
    power: 3,
    type: "tool",
    toolType: "axe",
    iconColor: "#8d6e63",
  },
  120: {
    name: "WoodShovel",
    power: 3,
    type: "tool",
    toolType: "shovel",
    iconColor: "#8d6e63",
  },
  130: { name: "WoodSword", power: 4, type: "weapon", iconColor: "#8d6e63" },

  // Materials
  200: { name: "Stick", iconColor: "#5d4037", type: "mat" },
  201: { name: "Coal", iconColor: "#212121", type: "mat" },
  202: { name: "IronIngot", iconColor: "#bdbdbd", type: "mat" },
  203: { name: "GoldIngot", iconColor: "#ffca28", type: "mat" },
  204: { name: "Diamond", iconColor: "#00e5ff", type: "mat" },
  205: { name: "Emerald", iconColor: "#00e676", type: "mat" },
  206: { name: "Ruby", iconColor: "#d50000", type: "mat" },
  210: { name: "Apple", iconColor: "#f44336", type: "food" },
};

const RECIPES = [
  // Planks
  { in: [4], out: { id: 30, count: 4 }, shapeless: true },
  { in: [25], out: { id: 31, count: 4 }, shapeless: true },
  { in: [27], out: { id: 32, count: 4 }, shapeless: true },
  // Stick
  { in: [30, 30], out: { id: 200, count: 4 }, shapeless: true },
  // Table
  { pattern: [30, 30, 0, 30, 30, 0, 0, 0, 0], out: { id: 40, count: 1 } },
  // Tools (Wood)
  { pattern: [30, 30, 30, 0, 200, 0, 0, 200, 0], out: { id: 100, count: 1 } },
  { pattern: [30, 30, 0, 30, 200, 0, 0, 200, 0], out: { id: 110, count: 1 } },
  // Furnace
  { pattern: [33, 33, 33, 33, 0, 33, 33, 33, 33], out: { id: 41, count: 1 } },
  // Torch
  { in: [201, 200], out: { id: 44, count: 4 }, shapeless: true },
];

// --- GRAPHICS ---
class AssetGen {
  static gen(id) {
    const c = document.createElement("canvas");
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext("2d");
    // Fallback
    ctx.fillStyle = "#f0f";
    ctx.fillRect(0, 0, 32, 32);

    if (BLOCKS[id]) {
      const b = BLOCKS[id];
      ctx.fillStyle = b.color;
      ctx.fillRect(0, 0, 32, 32);
      // Texture effects
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      if (b.type === "noise" || b.type === "grass" || b.type === "ore") {
        for (let i = 0; i < 30; i++)
          ctx.fillRect(Math.random() * 32, Math.random() * 32, 2, 2);
      }
      if (b.type === "grass") {
        ctx.fillStyle = "#43a047";
        ctx.fillRect(0, 0, 32, 8);
      }
      if (b.type === "column") {
        // Logs
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(4, 0, 4, 32);
        ctx.fillRect(24, 0, 4, 32);
        if (b.detail) {
          ctx.fillStyle = b.detail;
          for (let i = 0; i < 5; i++)
            ctx.fillRect(Math.random() * 32, Math.random() * 32, 4, 1);
        }
      }
      if (b.type === "plank") {
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.fillRect(0, 8, 32, 2);
        ctx.fillRect(0, 24, 32, 2);
      }
      if (b.type === "brick") {
        ctx.strokeStyle = "rgba(200,200,200,0.3)";
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, 32, 32);
        ctx.strokeRect(16, 0, 1, 32);
        ctx.strokeRect(0, 16, 32, 1);
      }
      if (b.type === "glass") {
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, 28, 28);
        ctx.beginPath();
        ctx.moveTo(8, 8);
        ctx.lineTo(16, 16);
        ctx.stroke();
      }
      if (b.type === "ore") {
        ctx.fillStyle = b.oreColor;
        ctx.fillRect(10, 10, 12, 12);
        ctx.fillRect(4, 20, 6, 6);
      }
      if (b.type === "table") {
        ctx.fillStyle = "#8d6e63";
        ctx.fillRect(0, 0, 32, 32);
        ctx.fillStyle = "#5d4037";
        ctx.fillRect(2, 2, 28, 28);
      }
      if (b.type === "tnt") {
        ctx.fillStyle = "#d32f2f";
        ctx.fillRect(0, 0, 32, 32);
        ctx.fillStyle = "#fff";
        ctx.font = "10px Arial";
        ctx.fillText("TNT", 6, 20);
      }
      if (b.type === "torch") {
        ctx.clearRect(0, 0, 32, 32);
        ctx.fillStyle = "#5d4037";
        ctx.fillRect(14, 10, 4, 14);
        ctx.fillStyle = "#ffeb3b";
        ctx.fillRect(12, 6, 8, 8);
      }
    } else if (ITEMS[id]) {
      const it = ITEMS[id];
      ctx.clearRect(0, 0, 32, 32);
      if (it.type === "tool" || it.type === "weapon") {
        ctx.translate(16, 16);
        ctx.rotate(-Math.PI / 4);
        ctx.fillStyle = "#5d4037";
        ctx.fillRect(-2, 0, 4, 14);
        ctx.fillStyle = it.iconColor;
        if (it.toolType === "pick") {
          ctx.beginPath();
          ctx.arc(0, -2, 10, Math.PI, 0);
          ctx.lineTo(0, 4);
          ctx.fill();
        }
        if (it.toolType === "axe") ctx.fillRect(-6, -8, 12, 10);
        if (it.toolType === "shovel") {
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (it.type === "mat") {
        ctx.fillStyle = it.iconColor;
        if (id == 200) {
          ctx.rotate(-Math.PI / 4);
          ctx.fillStyle = "#5d4037";
          ctx.fillRect(14, 10, 4, 20);
        } // Stick
        else ctx.fillRect(8, 8, 16, 16);
      }
    }
    return c;
  }
}

// --- GAME LOGIC ---
class Game {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.resize();
    window.addEventListener("resize", () => this.resize());

    this.chunks = {};
    this.players = {};
    this.drops = [];
    this.net = new Network(this);
    this.time = 0; // 0-24000

    this.keys = {};
    this.mouse = { x: 0, y: 0, left: false };
    this.cam = { x: 0, y: 0 };
    this.selSlot = 0;
    this.mining = { active: false, progress: 0, bx: 0, by: 0 };

    this.craftGrid = Array(9).fill({ id: 0, count: 0 });
    this.craftResult = { id: 0, count: 0 };
    this.selInvSlot = -1;

    this.assets = {};
    this.loadAssets();
    this.initEvents();
    this.initUI();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }
  loadAssets() {
    for (let id in BLOCKS) if (id != 0) this.assets[id] = AssetGen.gen(id);
    for (let id in ITEMS) if (id != 0) this.assets[id] = AssetGen.gen(id);
  }

  initEvents() {
    window.onkeydown = (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key >= "1" && e.key <= "9") {
        this.selSlot = parseInt(e.key) - 1;
        this.updateUI();
      }
      if (e.key === "e") this.toggleInv();
    };
    window.onkeyup = (e) => (this.keys[e.key.toLowerCase()] = false);
    window.onmousemove = (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    };
    window.onmousedown = (e) => {
      if (e.button === 0) this.mouse.left = true;
    };
    window.onmouseup = (e) => {
      if (e.button === 0) {
        this.mouse.left = false;
        this.mining.active = false;
      }
    };

    document.getElementById("start-btn").onclick = () => {
      document.getElementById("login-screen").style.display = "none";
      document.getElementById("game-ui").style.display = "block";
      this.net.join(document.getElementById("room-input").value);
    };
    document.getElementById("save-game-btn").onclick = () => this.saveGame();
    document.getElementById("load-btn").onclick = () => this.loadGame();
  }

  start() {
    this.spawn(0, -200);
    this.loop();
  }
  spawn(x, y) {
    this.players[this.net.myId] = {
      id: this.net.myId,
      x,
      y,
      vx: 0,
      vy: 0,
      hp: 20,
      maxHp: 20,
      inv: Array(27).fill({ id: 0, count: 0 }),
    };
    this.cam.x = x;
    this.cam.y = y;
    this.updateUI();
  }

  loop() {
    if (this.net.isHost) {
      this.time = (this.time + 1) % 24000;
      // Chunk Gen
      for (let id in this.players) {
        const p = this.players[id];
        const cx = Math.floor(p.x / TILE_SIZE / CHUNK_SIZE),
          cy = Math.floor(p.y / TILE_SIZE / CHUNK_SIZE);
        for (let y = -1; y <= 1; y++)
          for (let x = -2; x <= 2; x++) this.getChunk(cx + x, cy + y);
      }
      this.phys();
      this.net.broadcast({
        type: "SYNC",
        players: this.players,
        drops: this.drops,
        time: this.time,
      });
    }
    this.processMining();
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  // --- WORLD GEN ---
  getChunk(cx, cy) {
    const k = `${cx},${cy}`;
    if (this.chunks[k]) return this.chunks[k];
    if (this.net.isHost) {
      const c = this.genChunk(cx, cy);
      this.chunks[k] = c;
      this.net.broadcast({ type: "CHUNK", key: k, data: Array.from(c) });
      return c;
    }
    return null;
  }
  genChunk(cx, cy) {
    const d = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE);
    for (let x = 0; x < CHUNK_SIZE; x++) {
      const wx = cx * CHUNK_SIZE + x;
      // Biome Noise
      const biome = Math.sin(wx * 0.01); // < -0.3 Snow, > 0.3 Desert, else Plains/Forest

      let hBase = 40;
      if (biome > 0.3) hBase = 35; // Desert lower
      else if (biome < -0.3) hBase = 50; // Mountains

      const h = Math.floor(
        hBase + Math.sin(wx * 0.05) * 10 + Math.sin(wx * 0.01) * 20
      );

      for (let y = 0; y < CHUNK_SIZE; y++) {
        const wy = cy * CHUNK_SIZE + y;
        let id = 0;
        if (wy > 80) id = 7; // Bedrock
        else if (wy > h) {
          id = 3; // Stone
          if (wy < h + 4) {
            if (biome > 0.3) id = 7; // Sand
            else if (biome < -0.3) id = 9; // Snow Block
            else id = 2; // Dirt
          }
          // Ores
          if (id === 3) {
            const r = Math.random();
            if (r < 0.05) id = 15; // Coal
            else if (r < 0.02) id = 16; // Iron
            else if (r < 0.005) id = 18; // Diamond
            else if (r < 0.002) id = 20; // Ruby
          }
        } else if (wy === h) {
          if (biome > 0.3) id = 7; // Sand
          else if (biome < -0.3) id = 9; // Snow
          else id = 1; // Grass

          // Surface Features
          if (id === 1 && Math.random() < 0.05)
            this.queueTree(wx, wy - 1, Math.random() > 0.5 ? 4 : 25); // Oak or Birch
          if (id === 7 && Math.random() < 0.02) {
            d[(y - 1) * CHUNK_SIZE + x] = 8;
            d[(y - 2) * CHUNK_SIZE + x] = 8;
          } // Cactus
        } else if (wy > 55 && biome > 0.3) {
          // Underground Water in desert
          // Skipped for simplicity
        }
        if (d[y * CHUNK_SIZE + x] === 0) d[y * CHUNK_SIZE + x] = id;
      }
    }
    return d;
  }
  queueTree(gx, gy, type) {
    setTimeout(() => {
      for (let i = 0; i < 5; i++) this.setBlock(gx, gy - i, type);
      const leaf = type === 4 ? 5 : 26;
      for (let y = gy - 6; y <= gy - 3; y++)
        for (let x = gx - 2; x <= gx + 2; x++)
          if (!this.getBlock(x, y)) this.setBlock(x, y, leaf);
    }, 10);
  }

  setBlock(gx, gy, id) {
    const cx = Math.floor(gx / CHUNK_SIZE),
      cy = Math.floor(gy / CHUNK_SIZE);
    const k = `${cx},${cy}`;
    if (this.chunks[k]) {
      const lx = ((gx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
        ly = ((gy % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
      this.chunks[k][ly * CHUNK_SIZE + lx] = id;
      if (this.net.isHost)
        this.net.broadcast({ type: "BLOCK", x: gx, y: gy, id });
    }
  }
  getBlock(gx, gy) {
    const cx = Math.floor(gx / CHUNK_SIZE),
      cy = Math.floor(gy / CHUNK_SIZE);
    const c = this.chunks[`${cx},${cy}`];
    return c
      ? c[
          (((gy % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE) * CHUNK_SIZE +
            (((gx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE)
        ]
      : 0;
  }

  // --- MINING & INTERACT ---
  processMining() {
    if (!this.mouse.left) {
      this.mining.active = false;
      document.getElementById("mining-bar-container").style.display = "none";
      return;
    }
    const mx = this.mouse.x + this.cam.x,
      my = this.mouse.y + this.cam.y;
    const bx = Math.floor(mx / TILE_SIZE),
      by = Math.floor(my / TILE_SIZE);
    if (this.mining.bx !== bx || this.mining.by !== by) {
      this.mining.active = true;
      this.mining.bx = bx;
      this.mining.by = by;
      this.mining.progress = 0;
    }

    const id = this.getBlock(bx, by);
    if (!id || BLOCKS[id].unbreakable) {
      document.getElementById("mining-bar-container").style.display = "none";
      return;
    }

    const p = this.players[this.net.myId];
    const tool = ITEMS[p.inv[this.selSlot]?.id] || ITEMS[1];
    const block = BLOCKS[id];

    let power = 1;
    if (block.req) {
      if (tool.toolType === block.req) power = tool.power;
    } else power = tool.power;

    this.mining.progress += power;
    const pct = Math.min(100, (this.mining.progress / block.hardness) * 100);
    document.getElementById("mining-bar-container").style.display = "block";
    document.getElementById("mining-bar").style.width = pct + "%";

    if (this.mining.progress >= block.hardness) {
      this.setBlock(bx, by, 0);
      this.drops.push({
        x: bx * TILE_SIZE + 24,
        y: by * TILE_SIZE + 24,
        id: block.drop || id,
        vx: (Math.random() - 0.5) * 4,
        vy: -4,
      });
      this.net.send({ type: "MINE", x: bx, y: by });
      this.mining.progress = 0;
    }
  }

  phys() {
    for (let id in this.players) {
      const p = this.players[id];
      p.vy += GRAVITY;
      p.x += p.vx;
      this.collide(p, "x");
      p.y += p.vy;
      this.collide(p, "y");
      p.vx *= 0.8;
      if (p.y > 3000) {
        p.x = 0;
        p.y = -200;
        p.vy = 0;
      }
    }
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.vy += GRAVITY;
      d.y += d.vy;
      d.x += d.vx;
      if (this.isSolid(d.x, d.y + 16)) {
        d.y = Math.floor(d.y / TILE_SIZE) * TILE_SIZE + 16;
        d.vy = 0;
        d.vx *= 0.8;
      }
      for (let pid in this.players) {
        const p = this.players[pid];
        if (Math.hypot(p.x - d.x, p.y - d.y) < 40) {
          this.giveItem(pid, d.id, 1);
          this.drops.splice(i, 1);
          break;
        }
      }
    }
  }
  collide(e, ax) {
    const x1 = Math.floor(e.x / TILE_SIZE),
      y1 = Math.floor(e.y / TILE_SIZE);
    const x2 = Math.floor((e.x + 24) / TILE_SIZE),
      y2 = Math.floor((e.y + 54) / TILE_SIZE);
    for (let y = y1; y <= y2; y++)
      for (let x = x1; x <= x2; x++)
        if (this.isSolid(x * TILE_SIZE, y * TILE_SIZE)) {
          if (ax === "x") {
            e.x = e.vx > 0 ? x * TILE_SIZE - 24.1 : (x + 1) * TILE_SIZE + 0.1;
            e.vx = 0;
          } else {
            e.y = e.vy > 0 ? y * TILE_SIZE - 54.1 : (y + 1) * TILE_SIZE + 0.1;
            e.vy = 0;
          }
        }
  }
  isSolid(x, y) {
    const id = this.getBlock(
      Math.floor(x / TILE_SIZE),
      Math.floor(y / TILE_SIZE)
    );
    return id && BLOCKS[id].solid;
  }
  giveItem(pid, id, n) {
    const p = this.players[pid];
    for (let i = 0; i < 27; i++)
      if (p.inv[i].id === id) {
        p.inv[i].count += n;
        if (pid === this.net.myId) this.updateUI();
        return;
      }
    for (let i = 0; i < 27; i++)
      if (p.inv[i].id === 0) {
        p.inv[i] = { id, count: n };
        if (pid === this.net.myId) this.updateUI();
        return;
      }
  }

  render() {
    if (!this.players[this.net.myId]) return;
    const p = this.players[this.net.myId];
    this.cam.x += (p.x - this.width / 2 - this.cam.x) * 0.1;
    this.cam.y += (p.y - this.height / 2 - this.cam.y) * 0.1;

    // Day/Night Cycle
    const light = Math.max(0.1, Math.sin(this.time * 0.0005));
    const sky = `rgb(${135 * light}, ${206 * light}, ${235 * light})`;
    this.ctx.fillStyle = sky;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const scx = Math.floor(this.cam.x / TILE_SIZE),
      scy = Math.floor(this.cam.y / TILE_SIZE);
    const ecx = scx + Math.ceil(this.width / TILE_SIZE) + 1,
      ecy = scy + Math.ceil(this.height / TILE_SIZE) + 1;

    for (let y = scy; y <= ecy; y++)
      for (let x = scx; x <= ecx; x++) {
        const id = this.getBlock(x, y);
        if (id && this.assets[id])
          this.ctx.drawImage(
            this.assets[id],
            Math.floor(x * TILE_SIZE - this.cam.x),
            Math.floor(y * TILE_SIZE - this.cam.y)
          );
      }

    // Mining overlay
    if (this.mining.active) {
      this.ctx.fillStyle = "rgba(255,255,255,0.2)";
      this.ctx.fillRect(
        this.mining.bx * TILE_SIZE - this.cam.x,
        this.mining.by * TILE_SIZE - this.cam.y,
        TILE_SIZE,
        TILE_SIZE
      );
    }

    this.drops.forEach((d) => {
      if (this.assets[d.id])
        this.ctx.drawImage(
          this.assets[d.id],
          d.x - this.cam.x - 10,
          d.y - this.cam.y - 10,
          20,
          20
        );
    });

    for (let id in this.players) {
      const ply = this.players[id];
      this.ctx.fillStyle = id === this.net.myId ? "#fff" : "#ccc";
      this.ctx.fillRect(ply.x - this.cam.x, ply.y - this.cam.y, 24, 54);
    }

    // Night Overlay
    this.ctx.fillStyle = `rgba(0,0,0,${0.8 - light * 0.8})`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.sendInput();

    // HUD
    document.getElementById("coord-info").innerText = `X:${Math.floor(
      p.x / TILE_SIZE
    )} Y:${Math.floor(p.y / TILE_SIZE)}`;
    document.getElementById("time-info").innerText =
      light > 0.5 ? "Day" : "Night";
    const biomeVal = Math.sin(
      Math.floor(p.x / TILE_SIZE / CHUNK_SIZE) * CHUNK_SIZE * 0.01
    );
    document.getElementById("biome-info").innerText =
      biomeVal > 0.3 ? "Desert" : biomeVal < -0.3 ? "Snow" : "Plains";
  }

  sendInput() {
    if (this.net.isHost)
      this.net.onPacket({ type: "INPUT", keys: this.keys }, this.net.myId);
    else this.net.send({ type: "INPUT", keys: this.keys });
  }

  // --- UI & INVENTORY ---
  initUI() {
    const bar = document.getElementById("inventory-bar");
    for (let i = 0; i < 9; i++) {
      const d = document.createElement("div");
      d.className = "slot";
      d.onclick = () => {
        this.selSlot = i;
        this.updateUI();
      };
      bar.appendChild(d);
    }
    const grid = document.getElementById("inv-grid");
    for (let i = 0; i < 27; i++) {
      const d = document.createElement("div");
      d.className = "slot";
      d.onclick = () => {
        if (this.selInvSlot === -1) this.selInvSlot = i;
        else {
          // Swap
          const p = this.players[this.net.myId];
          const tmp = p.inv[i];
          p.inv[i] = p.inv[this.selInvSlot];
          p.inv[this.selInvSlot] = tmp;
          this.selInvSlot = -1;
          this.updateUI();
        }
        this.updateUI();
      };
      grid.appendChild(d);
    }
    // Crafting Grid
    const cgrid = document.getElementById("craft-grid");
    for (let i = 0; i < 9; i++) {
      const d = document.createElement("div");
      d.className = "slot";
      d.onclick = () => {
        if (this.selInvSlot !== -1) {
          const p = this.players[this.net.myId];
          const src = p.inv[this.selInvSlot];
          if (src.id && src.count > 0) {
            this.craftGrid[i] = { id: src.id, count: 1 };
            src.count--;
            if (src.count <= 0) p.inv[this.selInvSlot] = { id: 0, count: 0 };
            this.checkCraft();
            this.updateUI();
          }
        }
      };
      d.oncontextmenu = (e) => {
        e.preventDefault();
        this.craftGrid[i] = { id: 0, count: 0 };
        this.checkCraft();
        this.updateUI();
      };
      cgrid.appendChild(d);
    }
    document.getElementById("craft-result-slot").onclick = () => {
      if (this.craftResult.id) {
        this.giveItem(
          this.net.myId,
          this.craftResult.id,
          this.craftResult.count
        );
        for (let i = 0; i < 9; i++)
          if (this.craftGrid[i].id) {
            this.craftGrid[i].count--;
            if (this.craftGrid[i].count <= 0)
              this.craftGrid[i] = { id: 0, count: 0 };
          }
        this.checkCraft();
        this.updateUI();
      }
    };
  }

  checkCraft() {
    const ids = this.craftGrid.map((x) => x.id);
    this.craftResult = { id: 0, count: 0 };
    for (let r of RECIPES) {
      if (r.shapeless) {
        // Simplified shapeless check
        const need = {};
        let cnt = 0;
        r.in.forEach((id) => {
          need[id] = (need[id] || 0) + 1;
        });
        const has = {};
        let gcnt = 0;
        ids.forEach((id) => {
          if (id) {
            has[id] = (has[id] || 0) + 1;
            gcnt++;
          }
        });
        if (cnt !== r.in.length || gcnt !== r.in.length) continue;
        let match = true;
        for (let k in need) if (need[k] !== has[k]) match = false;
        if (match) {
          this.craftResult = r.out;
          break;
        }
      } else if (r.pattern) {
        let match = true;
        for (let i = 0; i < 9; i++) if (ids[i] !== r.pattern[i]) match = false;
        if (match) {
          this.craftResult = r.out;
          break;
        }
      }
    }
    this.updateCraftUI();
  }

  updateUI() {
    const p = this.players[this.net.myId];
    if (!p) return;
    const draw = (el, it) => {
      el.innerHTML = "";
      if (it.id && this.assets[it.id]) {
        const c = document.createElement("canvas");
        c.width = 32;
        c.height = 32;
        c.getContext("2d").drawImage(this.assets[it.id], 0, 0);
        el.appendChild(c);
        const s = document.createElement("span");
        s.className = "count";
        s.innerText = it.count;
        el.appendChild(s);
      }
    };
    const bar = document.getElementById("inventory-bar").children;
    for (let i = 0; i < 9; i++) {
      draw(bar[i], p.inv[i]);
      bar[i].className = i === this.selSlot ? "slot active" : "slot";
    }
    const grid = document.getElementById("inv-grid").children;
    for (let i = 0; i < 27; i++) {
      draw(grid[i], p.inv[i]);
      grid[i].style.borderColor = i === this.selInvSlot ? "#0f0" : "#555";
    }
  }
  updateCraftUI() {
    const grid = document.getElementById("craft-grid").children;
    for (let i = 0; i < 9; i++) {
      const el = grid[i];
      el.innerHTML = "";
      if (this.craftGrid[i].id && this.assets[this.craftGrid[i].id]) {
        const c = document.createElement("canvas");
        c.width = 32;
        c.height = 32;
        c.getContext("2d").drawImage(this.assets[this.craftGrid[i].id], 0, 0);
        el.appendChild(c);
      }
    }
    const res = document.getElementById("craft-result-slot");
    res.innerHTML = "";
    if (this.craftResult.id && this.assets[this.craftResult.id]) {
      const c = document.createElement("canvas");
      c.width = 32;
      c.height = 32;
      c.getContext("2d").drawImage(this.assets[this.craftResult.id], 0, 0);
      res.appendChild(c);
      const s = document.createElement("span");
      s.className = "count";
      s.innerText = this.craftResult.count;
      res.appendChild(s);
    }
  }
  toggleInv() {
    const s = document.getElementById("inventory-screen");
    s.style.display = s.style.display === "none" ? "flex" : "none";
    this.selInvSlot = -1;
    this.updateUI();
  }

  // --- SAVE/LOAD ---
  saveGame() {
    const p = this.players[this.net.myId];
    const data = {
      chunks: Array.from(Object.entries(this.chunks)), // Simple array tuple
      player: { x: p.x, y: p.y, inv: p.inv },
      time: this.time,
    };
    localStorage.setItem("fsc_save", JSON.stringify(data));
    alert("World Saved!");
  }
  loadGame() {
    const json = localStorage.getItem("fsc_save");
    if (!json) return alert("No save found.");
    const data = JSON.parse(json);

    // Restore Chunks
    this.chunks = {};
    for (let [k, arr] of data.chunks) this.chunks[k] = new Uint8Array(arr);

    // Restore Player
    this.spawn(data.player.x, data.player.y);
    this.players[this.net.myId].inv = data.player.inv;
    this.time = data.time || 0;

    document.getElementById("login-screen").style.display = "none";
    document.getElementById("game-ui").style.display = "block";
    this.net.hostId = this.net.myId; // Force Singleplayer feel
    this.net.isHost = true;

    this.loop();
  }
}

class Network {
  constructor(game) {
    this.game = game;
    this.socket = io();
    this.peers = {};
    this.channels = {};
    this.socket.on("connect", () => (this.myId = this.socket.id));
    this.socket.on("role-assigned", (d) => {
      this.isHost = d.role === "HOST";
      this.hostId = d.hostId;
      if (this.isHost) this.game.start();
    });
    this.socket.on("user-joined", (d) => {
      if (this.isHost) this.conn(d.userId, true);
    });
    this.socket.on("signal", async (d) => {
      if (!this.peers[d.sender]) await this.conn(d.sender, false);
      const p = this.peers[d.sender];
      if (d.signal.type === "offer") {
        await p.setRemoteDescription(d.signal);
        const a = await p.createAnswer();
        await p.setLocalDescription(a);
        this.socket.emit("signal", { target: d.sender, signal: a });
      } else if (d.signal.type === "answer")
        await p.setRemoteDescription(d.signal);
      else if (d.signal.candidate) await p.addIceCandidate(d.signal.candidate);
    });
  }
  join(room) {
    this.socket.emit("join-room", room);
  }
  async conn(tid, init) {
    const p = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    this.peers[tid] = p;
    p.onicecandidate = (e) => {
      if (e.candidate)
        this.socket.emit("signal", {
          target: tid,
          signal: { candidate: e.candidate },
        });
    };
    if (init) {
      const dc = p.createDataChannel("g");
      this.setup(dc, tid);
      const o = await p.createOffer();
      await p.setLocalDescription(o);
      this.socket.emit("signal", { target: tid, signal: o });
    } else p.ondatachannel = (e) => this.setup(e.channel, tid);
  }
  setup(dc, tid) {
    this.channels[tid] = dc;
    dc.onopen = () => {
      if (this.isHost)
        this.send({ type: "INIT", chunks: {}, players: this.game.players });
    }; // Simplified init
    dc.onmessage = (e) => this.onPacket(JSON.parse(e.data), tid);
  }
  send(msg) {
    if (this.isHost) this.bc(msg);
    else if (this.hostId && this.channels[this.hostId])
      this.channels[this.hostId].send(JSON.stringify(msg));
  }
  bc(msg) {
    const s = JSON.stringify(msg);
    for (let id in this.channels) this.channels[id].send(s);
  }
  onPacket(m, sender) {
    // Simple routing
    if (m.type === "MINE") {
      if (this.isHost) {
        this.game.setBlock(m.x, m.y, 0);
        this.bc({ type: "BLOCK", x: m.x, y: m.y, id: 0 });
      }
    } else if (m.type === "BLOCK") this.game.setBlock(m.x, m.y, m.id);
    else if (m.type === "SYNC") {
      this.game.players = m.players;
      this.game.drops = m.drops;
      this.game.time = m.time;
      this.game.updateUI();
    } else if (m.type === "INPUT" && this.isHost) {
      const p = this.game.players[sender];
      if (p) {
        if (m.keys.a) p.vx = -5;
        if (m.keys.d) p.vx = 5;
        if (m.keys.w && this.game.isSolid(p.x, p.y + 32)) p.vy = -10;
      }
    }
  }
}

window.onload = () => new Game();
