/**
 * FullStackCraft v15 - Physics Fix, Skins, Nicknames
 */

const TILE_SIZE = 60; // Bigger Blocks
const CHUNK_SIZE = 16;
const GRAVITY = 0.6;
const TERMINAL_VELOCITY = 15;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 56; // Slightly shorter than 1 tile width for easier fit

// --- DEFINITIONS ---
const BLOCKS = {
  0: { name: "Air", solid: false },
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
  21: {
    name: "Cobble",
    color: "#555",
    solid: true,
    hardness: 400,
    type: "brick",
    reqTool: "pickaxe",
    drop: 21,
  },
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
    name: "CraftTable",
    color: "#a1887f",
    solid: true,
    hardness: 200,
    type: "table",
    reqTool: "axe",
    drop: 31,
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
    iconColor: "#757575",
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
  130: {
    name: "WoodSword",
    power: 4,
    type: "weapon",
    toolType: "sword",
    iconColor: "#8d6e63",
  },
  200: { name: "Stick", type: "item", iconColor: "#8d6e63" },
  201: { name: "Coal", type: "item", iconColor: "#333" },
  202: { name: "Iron", type: "item", iconColor: "#ccc" },
  203: { name: "Gold", type: "item", iconColor: "#ff0" },
  204: { name: "Diamond", type: "item", iconColor: "#0ff" },
};

const RECIPES = [
  { in: [4], out: { id: 30, count: 4 }, shapeless: true },
  { in: [30, 30], out: { id: 200, count: 4 }, shapeless: true },
  { pattern: [30, 30, 0, 30, 30, 0, 0, 0, 0], out: { id: 31, count: 1 } },
  { pattern: [30, 30, 30, 0, 200, 0, 0, 200, 0], out: { id: 100, count: 1 } },
  { pattern: [21, 21, 21, 0, 200, 0, 0, 200, 0], out: { id: 101, count: 1 } },
  { pattern: [30, 30, 0, 30, 200, 0, 0, 200, 0], out: { id: 110, count: 1 } },
];

class AssetGen {
  static gen(id) {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#f0f";
    ctx.fillRect(0, 0, 64, 64); // Fallback
    if (BLOCKS[id]) {
      const b = BLOCKS[id];
      ctx.fillStyle = b.color;
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      if (b.type === "noise" || b.type === "ore")
        for (let i = 0; i < 40; i++)
          ctx.fillRect(Math.random() * 64, Math.random() * 64, 4, 4);
      if (b.type === "brick") {
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, 64, 64);
        ctx.strokeRect(0, 32, 64, 2);
      }
      if (b.type === "column") {
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(8, 0, 8, 64);
        ctx.fillRect(48, 0, 8, 64);
      }
      if (b.type === "ore") {
        ctx.fillStyle = b.oreColor;
        ctx.fillRect(20, 20, 24, 24);
      }
    } else if (ITEMS[id]) {
      ctx.clearRect(0, 0, 64, 64);
      const it = ITEMS[id];
      ctx.fillStyle = it.iconColor || "#fff";
      if (it.type === "tool") {
        ctx.translate(32, 32);
        ctx.rotate(-Math.PI / 4);
        ctx.fillStyle = "#5d4037";
        ctx.fillRect(-4, 0, 8, 32); // Handle
        ctx.fillStyle = it.iconColor;
        if (it.toolType === "pick") {
          ctx.beginPath();
          ctx.arc(0, -4, 20, Math.PI, 0);
          ctx.lineTo(0, 8);
          ctx.fill();
        }
        if (it.toolType === "axe") ctx.fillRect(-12, -16, 24, 20);
        if (it.toolType === "shovel") {
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        if (id == 200) {
          ctx.rotate(-Math.PI / 4);
          ctx.fillStyle = "#5d4037";
          ctx.fillRect(20, 20, 8, 32);
        } else ctx.fillRect(16, 16, 32, 32);
      }
    }
    return c;
  }
}

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

    this.keys = {};
    this.mouse = { x: 0, y: 0, left: false };
    this.cam = { x: 0, y: 0 };
    this.selSlot = 0;
    this.mining = { active: false, progress: 0, bx: 0, by: 0 };

    this.craftGrid = Array(9).fill({ id: 0, count: 0 });
    this.craftResult = { id: 0, count: 0 };
    this.selInvSlot = -1;

    this.profile = {
      name: "Player",
      skin: { head: "#ffccaa", body: "#3366cc", legs: "#333333" },
    };

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
      this.profile.name =
        document.getElementById("nick-input").value || "Player";
      this.profile.skin.head = document.getElementById("col-head").value;
      this.profile.skin.body = document.getElementById("col-body").value;
      this.profile.skin.legs = document.getElementById("col-legs").value;

      document.getElementById("login-screen").style.display = "none";
      document.getElementById("game-ui").style.display = "block";
      this.net.join(document.getElementById("room-input").value);
    };
    document.getElementById("save-game-btn").onclick = () => this.saveGame();
    document.getElementById("load-btn").onclick = () => this.loadGame();
  }

  start() {
    this.spawn(0, -200);
    // Send Profile
    this.net.send({
      type: "PROFILE",
      id: this.net.myId,
      profile: this.profile,
    });
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
      inv: Array.from({ length: 27 }, () => ({ id: 0, count: 0 })),
      profile: this.profile,
    };
    this.cam.x = x;
    this.cam.y = y;
    this.updateUI();
  }

  loop() {
    if (this.net.isHost) {
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
      });
    }
    this.processMining();
    this.render();
    requestAnimationFrame(() => this.loop());
  }

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
      const h = Math.floor(
        40 + Math.sin(wx * 0.05) * 10 + Math.sin(wx * 0.01) * 20
      );
      for (let y = 0; y < CHUNK_SIZE; y++) {
        const wy = cy * CHUNK_SIZE + y;
        let id = 0;
        if (wy > 80) id = 99;
        else if (wy > h) {
          id = 3;
          if (wy < h + 4) id = 2;
        } else if (wy === h) id = 1;
        if (d[y * CHUNK_SIZE + x] === 0) d[y * CHUNK_SIZE + x] = id;
      }
    }
    return d;
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
      let did = BLOCKS[id].drop || id;
      if (did)
        this.drops.push({
          x: bx * TILE_SIZE + TILE_SIZE / 2,
          y: by * TILE_SIZE + TILE_SIZE / 2,
          id: did,
          vx: (Math.random() - 0.5) * 4,
          vy: -4,
        });
      this.net.send({ type: "MINE", x: bx, y: by });
      this.mining.progress = 0;
    }
  }

  // --- PHYSICS (FIXED AABB) ---
  phys() {
    for (let id in this.players) {
      const p = this.players[id];

      // X Movement
      p.vx *= 0.9; // Friction
      if (Math.abs(p.vx) < 0.1) p.vx = 0;
      if (p.vx > 8) p.vx = 8;
      if (p.vx < -8) p.vx = -8; // Cap X speed

      // Apply X
      p.x += p.vx;
      this.resolveCollision(p, "x");

      // Y Movement
      p.vy += GRAVITY;
      if (p.vy > TERMINAL_VELOCITY) p.vy = TERMINAL_VELOCITY;

      // Apply Y
      p.y += p.vy;
      this.resolveCollision(p, "y");

      if (p.y > 3000) {
        p.x = 0;
        p.y = -200;
        p.vy = 0;
      } // Void Respawn
    }

    // Drops Physics
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.vy += GRAVITY;
      d.y += d.vy;
      d.x += d.vx;
      // Simple drop collision (point based is enough for drops)
      if (this.isSolid(d.x, d.y + 10)) {
        d.y = Math.floor(d.y / TILE_SIZE) * TILE_SIZE - 10;
        d.vy = 0;
        d.vx *= 0.8;
      }

      for (let pid in this.players) {
        const p = this.players[pid];
        if (
          Math.abs(p.x + PLAYER_WIDTH / 2 - d.x) < 40 &&
          Math.abs(p.y + PLAYER_HEIGHT / 2 - d.y) < 40
        ) {
          this.giveItem(pid, d.id, 1);
          this.drops.splice(i, 1);
          break;
        }
      }
    }
  }

  resolveCollision(p, axis) {
    // AABB check
    const minX = Math.floor(p.x / TILE_SIZE);
    const maxX = Math.floor((p.x + PLAYER_WIDTH - 0.1) / TILE_SIZE);
    const minY = Math.floor(p.y / TILE_SIZE);
    const maxY = Math.floor((p.y + PLAYER_HEIGHT - 0.1) / TILE_SIZE);

    if (axis === "x") {
      if (p.vx > 0) {
        // Moving Right
        if (this.isSolidTile(maxX, minY) || this.isSolidTile(maxX, maxY)) {
          p.x = maxX * TILE_SIZE - PLAYER_WIDTH;
          p.vx = 0;
        }
      } else if (p.vx < 0) {
        // Moving Left
        if (this.isSolidTile(minX, minY) || this.isSolidTile(minX, maxY)) {
          p.x = (minX + 1) * TILE_SIZE;
          p.vx = 0;
        }
      }
    } else {
      // axis === 'y'
      if (p.vy > 0) {
        // Falling
        if (this.isSolidTile(minX, maxY) || this.isSolidTile(maxX, maxY)) {
          p.y = maxY * TILE_SIZE - PLAYER_HEIGHT;
          p.vy = 0;
          p.grounded = true;
        } else {
          p.grounded = false;
        }
      } else if (p.vy < 0) {
        // Jumping
        if (this.isSolidTile(minX, minY) || this.isSolidTile(maxX, minY)) {
          p.y = (minY + 1) * TILE_SIZE;
          p.vy = 0;
        }
      }
    }
  }

  isSolidTile(tx, ty) {
    const id = this.getBlock(tx, ty);
    return id && BLOCKS[id].solid;
  }

  isSolid(x, y) {
    return this.isSolidTile(
      Math.floor(x / TILE_SIZE),
      Math.floor(y / TILE_SIZE)
    );
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
    this.cam.x += (p.x + PLAYER_WIDTH / 2 - this.width / 2 - this.cam.x) * 0.1;
    this.cam.y +=
      (p.y + PLAYER_HEIGHT / 2 - this.height / 2 - this.cam.y) * 0.1;

    const g = this.ctx.createLinearGradient(0, 0, 0, this.height);
    g.addColorStop(0, "#87CEEB");
    g.addColorStop(1, "#B2EBF2");
    this.ctx.fillStyle = g;
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
      const i = this.assets[d.id] || this.assets[1]; // Fallback
      if (i)
        this.ctx.drawImage(
          i,
          d.x - this.cam.x - 10,
          d.y - this.cam.y - 10,
          20,
          20
        );
    });

    for (let id in this.players) {
      const ply = this.players[id];
      const px = ply.x - this.cam.x,
        py = ply.y - this.cam.y;

      // Draw Skin
      const skin = ply.profile
        ? ply.profile.skin
        : { head: "#ffccaa", body: "#3366cc", legs: "#333333" };

      // Head
      this.ctx.fillStyle = skin.head;
      this.ctx.fillRect(px + 8, py, 24, 24);
      // Body
      this.ctx.fillStyle = skin.body;
      this.ctx.fillRect(px + 4, py + 24, 32, 20);
      // Legs
      this.ctx.fillStyle = skin.legs;
      this.ctx.fillRect(px + 8, py + 44, 10, 12); // L
      this.ctx.fillRect(px + 22, py + 44, 10, 12); // R

      // Name
      this.ctx.fillStyle = "#fff";
      this.ctx.font = "12px Arial";
      this.ctx.textAlign = "center";
      const name = ply.profile ? ply.profile.name : "Player";
      this.ctx.fillText(name, px + PLAYER_WIDTH / 2, py - 5);
      this.ctx.textAlign = "left";
    }

    this.sendInput();
    document.getElementById("coord-info").innerText = `X:${Math.floor(
      p.x / TILE_SIZE
    )} Y:${Math.floor(p.y / TILE_SIZE)}`;
  }

  sendInput() {
    if (this.net.isHost)
      this.net.onPacket({ type: "INPUT", keys: this.keys }, this.net.myId);
    else this.net.send({ type: "INPUT", keys: this.keys });
  }

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
          const p = this.players[this.net.myId];
          const tmp = p.inv[i];
          p.inv[i] = p.inv[this.selInvSlot];
          p.inv[this.selInvSlot] = tmp;
          this.selInvSlot = -1;
        }
        this.updateUI();
      };
      grid.appendChild(d);
    }
    const cg = document.getElementById("craft-grid");
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
      cg.appendChild(d);
    }
    document.getElementById("craft-result-slot").onclick = () => {
      this.craftItem();
      this.updateUI();
    };
  }

  checkCraft() {
    const ids = this.craftGrid.map((x) => x.id);
    this.craftResult = { id: 0, count: 0 };
    for (let r of RECIPES) {
      if (r.shapeless) {
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
  craftItem() {
    if (this.craftResult.id === 0) return;
    for (let i = 0; i < 9; i++)
      if (this.craftGrid[i].id !== 0) {
        this.craftGrid[i].count--;
        if (this.craftGrid[i].count <= 0)
          this.craftGrid[i] = { id: 0, count: 0 };
      }
    this.giveItem(this.net.myId, this.craftResult.id, this.craftResult.count);
    this.checkCraft();
  }

  updateUI() {
    const p = this.players[this.net.myId];
    if (!p) return;
    document.getElementById("health-bar").style.width =
      (p.hp / p.maxHp) * 100 + "%";
    const draw = (el, it) => {
      el.innerHTML = "";
      if (it.id && this.assets[it.id]) {
        const c = document.createElement("canvas");
        c.width = 64;
        c.height = 64;
        c.style.width = "100%";
        c.style.height = "100%";
        c.getContext("2d").drawImage(this.assets[it.id], 0, 0, 64, 64);
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
    this.craftGrid.forEach((it, i) => {
      const el = grid[i];
      el.innerHTML = "";
      if (it.id && this.assets[it.id]) {
        const c = document.createElement("canvas");
        c.width = 64;
        c.height = 64;
        c.style.width = "100%";
        c.style.height = "100%";
        c.getContext("2d").drawImage(this.assets[it.id], 0, 0, 64, 64);
        el.appendChild(c);
      }
    });
    const res = document.getElementById("craft-result-slot");
    res.innerHTML = "";
    if (this.craftResult.id && this.assets[this.craftResult.id]) {
      const c = document.createElement("canvas");
      c.width = 64;
      c.height = 64;
      c.style.width = "100%";
      c.style.height = "100%";
      c.getContext("2d").drawImage(
        this.assets[this.craftResult.id],
        0,
        0,
        64,
        64
      );
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

  saveGame() {
    const p = this.players[this.net.myId];
    const data = {
      chunks: Array.from(Object.entries(this.chunks)),
      player: { x: p.x, y: p.y, inv: p.inv, profile: p.profile },
    };
    localStorage.setItem("fsc15", JSON.stringify(data));
    alert("Saved!");
  }
  loadGame() {
    const j = localStorage.getItem("fsc15");
    if (!j) return alert("No save");
    const d = JSON.parse(j);
    this.chunks = {};
    for (let [k, v] of d.chunks) this.chunks[k] = new Uint8Array(v);
    this.spawn(d.player.x, d.player.y);
    this.players[this.net.myId].inv = d.player.inv;
    this.profile = d.player.profile;
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("game-ui").style.display = "block";
    this.net.hostId = this.net.myId;
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
    };
    dc.onmessage = (e) => this.onPacket(JSON.parse(e.data), tid);
  }
  send(msg) {
    if (this.isHost) this.broadcast(msg);
    else if (this.hostId && this.channels[this.hostId])
      this.channels[this.hostId].send(JSON.stringify(msg));
  }
  broadcast(msg) {
    const s = JSON.stringify(msg);
    for (let id in this.channels) this.channels[id].send(s);
  }
  onPacket(m, sender) {
    if (m.type === "MINE") {
      if (this.isHost) {
        this.game.setBlock(m.x, m.y, 0);
        this.broadcast({ type: "BLOCK", x: m.x, y: m.y, id: 0 });
      }
    } else if (m.type === "BLOCK") this.game.setBlock(m.x, m.y, m.id);
    else if (m.type === "SYNC") {
      // Sync others but keep local physics smooth
      for (let id in m.players) {
        if (id !== this.game.net.myId) this.game.players[id] = m.players[id];
      }
      this.game.drops = m.drops;
    } else if (m.type === "PROFILE" && this.isHost) {
      if (this.game.players[m.id]) {
        this.game.players[m.id].profile = m.profile;
      }
    } else if (m.type === "INPUT" && this.isHost) {
      const p = this.game.players[sender];
      if (p) {
        if (m.keys.a) p.vx -= 1.0;
        if (m.keys.d) p.vx += 1.0;
        if (m.keys.w && p.grounded) {
          p.vy = -12;
          p.grounded = false;
        }
      }
    }
  }
}

window.onload = () => new Game();
