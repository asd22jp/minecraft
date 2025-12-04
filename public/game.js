const TILE_SIZE = 48;
const CHUNK_SIZE = 16;
const GRAVITY = 0.5;

// --- Definitions ---
const BLOCKS = {
  0: { name: "Air", solid: false },
  1: { name: "Grass", color: "#5b8a36", solid: true, hardness: 80, drop: 2 },
  2: { name: "Dirt", color: "#704828", solid: true, hardness: 80, drop: 2 },
  3: {
    name: "Stone",
    color: "#757575",
    solid: true,
    hardness: 300,
    reqTool: "pickaxe",
    drop: 21,
  },
  4: {
    name: "Log",
    color: "#5d4037",
    solid: true,
    hardness: 150,
    reqTool: "axe",
    drop: 4,
  },
  5: { name: "Leaves", color: "#388e3c", solid: true, hardness: 10, drop: 300 },
  6: {
    name: "Planks",
    color: "#8d6e63",
    solid: true,
    hardness: 100,
    reqTool: "axe",
    drop: 6,
  },
  7: {
    name: "Bedrock",
    color: "#000",
    solid: true,
    hardness: Infinity,
    unbreakable: true,
  },
  8: { name: "Sand", color: "#fdd835", solid: true, hardness: 60, drop: 8 },
  9: {
    name: "Water",
    color: "rgba(33,150,243,0.6)",
    solid: false,
    liquid: true,
    hardness: Infinity,
  },
  10: {
    name: "Glass",
    color: "rgba(255,255,255,0.3)",
    solid: true,
    hardness: 30,
    drop: 0,
  },
  11: {
    name: "CoalOre",
    color: "#222",
    solid: true,
    hardness: 400,
    type: "ore",
    oreColor: "#111",
    drop: 201,
  },
  12: {
    name: "IronOre",
    color: "#aaa",
    solid: true,
    hardness: 500,
    type: "ore",
    oreColor: "#dcb",
    drop: 202,
  },
  13: {
    name: "GoldOre",
    color: "#dd0",
    solid: true,
    hardness: 600,
    type: "ore",
    oreColor: "#fe0",
    drop: 203,
  },
  14: {
    name: "DiamondOre",
    color: "#0ee",
    solid: true,
    hardness: 800,
    type: "ore",
    oreColor: "#0ff",
    drop: 204,
  },
  15: {
    name: "Cactus",
    color: "#1b5e20",
    solid: true,
    hardness: 50,
    dmg: 1,
    drop: 15,
  },
  16: {
    name: "TNT",
    color: "#d32f2f",
    solid: true,
    hardness: 20,
    drop: 16,
    explode: true,
  },
  21: {
    name: "Cobble",
    color: "#555",
    solid: true,
    hardness: 300,
    type: "brick",
    reqTool: "pickaxe",
    drop: 21,
  },
  31: {
    name: "CraftTable",
    color: "#a1887f",
    solid: true,
    hardness: 150,
    type: "table",
    reqTool: "axe",
    drop: 31,
  },
};

const ITEMS = {
  0: { name: "Air" },
  1: { name: "Hand", power: 1.0 },
  16: { name: "TNT", type: "block", iconColor: "#d32f2f" }, // Fixed: Added TNT Item
  100: {
    name: "WoodPick",
    power: 3.0,
    type: "tool",
    toolType: "pickaxe",
    iconColor: "#8d6e63",
  },
  101: {
    name: "StonePick",
    power: 6.0,
    type: "tool",
    toolType: "pickaxe",
    iconColor: "#757575",
  },
  110: {
    name: "WoodAxe",
    power: 3.0,
    type: "tool",
    toolType: "axe",
    iconColor: "#8d6e63",
  },
  120: {
    name: "WoodShovel",
    power: 3.0,
    type: "tool",
    toolType: "shovel",
    iconColor: "#8d6e63",
  },
  130: {
    name: "IronSword",
    power: 8.0,
    type: "weapon",
    toolType: "sword",
    iconColor: "#eee",
  },
  200: { name: "Stick", type: "item", iconColor: "#8d6e63" },
  201: { name: "Coal", type: "item", iconColor: "#333" },
  202: { name: "Iron", type: "item", iconColor: "#ccc" },
  203: { name: "Gold", type: "item", iconColor: "#ff0" },
  204: { name: "Diamond", type: "item", iconColor: "#0ff" },
  300: { name: "Apple", type: "food", food: 4, iconColor: "#f44336" },
  301: { name: "Bread", type: "food", food: 6, iconColor: "#d7ccc8" },
  302: { name: "Steak", type: "food", food: 10, iconColor: "#795548" },
};

const RECIPES = [
  { in: [4], out: { id: 6, count: 4 }, shapeless: true },
  { in: [6, 6], out: { id: 200, count: 4 }, shapeless: true },
  { pattern: [6, 6, 0, 6, 6, 0, 0, 0, 0], out: { id: 31, count: 1 } },
  { pattern: [6, 6, 6, 0, 200, 0, 0, 200, 0], out: { id: 100, count: 1 } },
  { pattern: [21, 21, 21, 0, 200, 0, 0, 200, 0], out: { id: 101, count: 1 } },
  { pattern: [6, 6, 0, 6, 200, 0, 0, 200, 0], out: { id: 110, count: 1 } },
  { pattern: [0, 202, 0, 0, 202, 0, 0, 200, 0], out: { id: 130, count: 1 } },
  { in: [8], out: { id: 10, count: 1 }, shapeless: true },
];

// --- Network ---
class Network {
  constructor(game) {
    this.game = game;
    this.socket = io();
    this.peers = {};
    this.channels = {};
    this.myId = null;
    this.hostId = null;
    this.isHost = false;

    this.socket.on("connect", () => (this.myId = this.socket.id));
    this.socket.on("role-assigned", (d) => {
      this.isHost = d.role === "HOST";
      this.hostId = this.isHost ? this.myId : d.hostId;
      if (this.isHost) this.game.start();
    });
    this.socket.on("user-joined", (d) => {
      if (this.isHost) this.connectTo(d.userId, true);
    });
    this.socket.on("signal", async (d) => {
      if (!this.peers[d.sender]) await this.connectTo(d.sender, false);
      const pc = this.peers[d.sender];
      if (d.signal.type === "offer") {
        await pc.setRemoteDescription(d.signal);
        const ans = await pc.createAnswer();
        await pc.setLocalDescription(ans);
        this.socket.emit("signal", { target: d.sender, signal: ans });
      } else if (d.signal.type === "answer")
        await pc.setRemoteDescription(d.signal);
      else if (d.signal.candidate) await pc.addIceCandidate(d.signal.candidate);
    });
    this.socket.on("host-migrated", (d) => {
      this.hostId = d.newHostId;
      if (this.hostId === this.myId) {
        this.isHost = true;
        this.game.start();
      } else window.location.reload();
    });
  }
  async connectTo(target, initiator) {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    this.peers[target] = pc;
    pc.onicecandidate = (e) => {
      if (e.candidate)
        this.socket.emit("signal", {
          target,
          signal: { candidate: e.candidate },
        });
    };
    if (initiator) {
      const dc = pc.createDataChannel("game");
      this.setupDC(dc, target);
      const off = await pc.createOffer();
      await pc.setLocalDescription(off);
      this.socket.emit("signal", { target, signal: off });
    } else pc.ondatachannel = (e) => this.setupDC(e.channel, target);
  }
  setupDC(dc, target) {
    this.channels[target] = dc;
    dc.onopen = () => {
      if (this.isHost)
        this.sendTo(target, { type: "CHUNK_DATA", chunks: this.game.chunks });
    };
    dc.onmessage = (e) => this.game.onPacket(JSON.parse(e.data), target);
  }
  send(msg) {
    if (this.isHost) this.broadcast(msg);
    else if (this.hostId && this.channels[this.hostId])
      this.channels[this.hostId].send(JSON.stringify(msg));
  }
  broadcast(msg) {
    const s = JSON.stringify(msg);
    for (let id in this.channels)
      if (this.channels[id].readyState === "open") this.channels[id].send(s);
  }
  sendTo(id, msg) {
    if (this.channels[id]?.readyState === "open")
      this.channels[id].send(JSON.stringify(msg));
  }
}

// --- Game ---
class Game {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.fitScreen();

    this.chunks = {};
    this.players = {};
    this.drops = [];
    this.mobs = {};
    this.net = new Network(this);

    this.keys = {};
    this.mouse = { x: 0, y: 0, left: false, right: false };
    this.mobileState = { mine: false, place: false };
    this.cam = { x: 0, y: 0 };
    this.selSlot = 0;
    this.mining = { active: false, bx: 0, by: 0, progress: 0 };
    this.craftGrid = Array(9).fill({ id: 0, count: 0 });
    this.craftResult = { id: 0, count: 0 };
    this.selectedInvSlot = -1;
    this.time = 0;
    this.assets = { blocks: {}, items: {} };
    this.genAssets();

    // Inputs
    window.addEventListener("resize", () => this.fitScreen());
    window.addEventListener("keydown", (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key >= "1" && e.key <= "9") {
        this.selSlot = parseInt(e.key) - 1;
        this.updateUI();
      }
      if (e.key === "e") this.toggleInv();
    });
    window.addEventListener(
      "keyup",
      (e) => (this.keys[e.key.toLowerCase()] = false)
    );
    window.addEventListener("mousemove", (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    window.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        this.mouse.left = true;
        this.tryAction("MINE");
      }
      if (e.button === 2) {
        this.mouse.right = true;
        this.tryAction("PLACE");
      }
    });
    window.addEventListener("mouseup", (e) => {
      if (e.button === 0) {
        this.mouse.left = false;
        this.stopMining();
      }
      if (e.button === 2) this.mouse.right = false;
    });
    window.addEventListener("contextmenu", (e) => e.preventDefault());

    // Mobile UI Bindings
    this.setupMobileControls();

    document.getElementById("start-btn").onclick = () => {
      document.getElementById("login-screen").style.display = "none";
      document.getElementById("game-ui").style.display = "block";
      this.net.socket.emit(
        "join-room",
        document.getElementById("room-input").value
      );
    };
    this.initInvUI();
  }

  fitScreen() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }
  start() {
    this.spawnPlayer(this.net.myId, 0, -200);
    this.loop();
  }

  setupMobileControls() {
    const bindBtn = (id, key) => {
      const el = document.getElementById(id);
      el.addEventListener("touchstart", (e) => {
        e.preventDefault();
        this.keys[key] = true;
      });
      el.addEventListener("touchend", (e) => {
        e.preventDefault();
        this.keys[key] = false;
      });
    };
    bindBtn("ctrl-left", "a");
    bindBtn("ctrl-right", "d");
    bindBtn("ctrl-jump", "w");

    // Mobile Actions
    const btnMine = document.getElementById("ctrl-mine");
    btnMine.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.mobileState.mine = true;
      this.tryAction("MINE");
    });
    btnMine.addEventListener("touchend", (e) => {
      e.preventDefault();
      this.mobileState.mine = false;
      this.stopMining();
    });

    const btnPlace = document.getElementById("ctrl-place");
    btnPlace.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.tryAction("PLACE");
    });

    document.getElementById("ctrl-inv").addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.toggleInv();
    });
  }

  genAssets() {
    for (let id in BLOCKS) {
      if (id == 0) continue;
      const c = document.createElement("canvas");
      c.width = 32;
      c.height = 32;
      const ctx = c.getContext("2d");
      const b = BLOCKS[id];
      ctx.fillStyle = b.color || "#f0f";
      if (b.liquid) ctx.globalAlpha = 0.6;
      ctx.fillRect(0, 0, 32, 32);
      ctx.globalAlpha = 1.0;
      if (b.name === "TNT") {
        ctx.fillStyle = "white";
        ctx.font = "10px Arial";
        ctx.fillText("TNT", 6, 20);
      }
      this.assets.blocks[id] = c;
    }
    for (let id in ITEMS) {
      if (id == 0) continue;
      const c = document.createElement("canvas");
      c.width = 32;
      c.height = 32;
      const ctx = c.getContext("2d");
      const it = ITEMS[id];
      if (it.type === "tool" || it.type === "weapon") {
        ctx.translate(16, 16);
        ctx.rotate(-Math.PI / 4);
        ctx.fillStyle = "#5d4037";
        ctx.fillRect(-2, 0, 4, 14);
        ctx.fillStyle = it.iconColor;
        ctx.beginPath();
        ctx.arc(0, -2, 10, Math.PI, 0);
        ctx.fill();
      } else {
        ctx.fillStyle = it.iconColor || "#fff";
        ctx.fillRect(8, 8, 16, 16);
      }
      this.assets.items[id] = c;
    }
  }

  getChunkKey(cx, cy) {
    return `${cx},${cy}`;
  }
  getChunk(cx, cy) {
    const key = this.getChunkKey(cx, cy);
    if (this.chunks[key]) return this.chunks[key];
    if (this.net.isHost) {
      const chunk = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE);
      const noise = (x) => Math.sin(x * 0.1) * 10 + Math.sin(x * 0.03) * 20;
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const gx = cx * CHUNK_SIZE + x;
        const h = Math.floor(noise(gx));
        for (let y = 0; y < CHUNK_SIZE; y++) {
          const gy = cy * CHUNK_SIZE + y;
          if (gy > 40) chunk[y * 16 + x] = 7;
          else if (gy > h) chunk[y * 16 + x] = gy < h + 4 ? 2 : 3;
          else if (gy === h) chunk[y * 16 + x] = 1;
        }
      }
      this.chunks[key] = chunk;
      this.net.broadcast({
        type: "CHUNK_DATA",
        chunks: { [key]: Array.from(chunk) },
      });
      return chunk;
    }
    return null;
  }
  getBlock(gx, gy) {
    const cx = Math.floor(gx / 16);
    const cy = Math.floor(gy / 16);
    const chunk = this.chunks[this.getChunkKey(cx, cy)];
    if (!chunk) return 0;
    const lx = ((gx % 16) + 16) % 16;
    const ly = ((gy % 16) + 16) % 16;
    return chunk[ly * 16 + lx];
  }
  setBlock(gx, gy, id) {
    const cx = Math.floor(gx / 16);
    const cy = Math.floor(gy / 16);
    const chunk = this.chunks[this.getChunkKey(cx, cy)];
    if (!chunk) return;
    const lx = ((gx % 16) + 16) % 16;
    const ly = ((gy % 16) + 16) % 16;
    chunk[ly * 16 + lx] = id;
    if (this.net.isHost)
      this.net.broadcast({ type: "BLOCK", x: gx, y: gy, id });
  }

  loop() {
    if (this.net.isHost) {
      this.time++;
      for (let id in this.players) {
        const p = this.players[id];
        // Physics
        p.vy += GRAVITY;
        p.x += p.vx;
        this.collide(p, "x");
        p.y += p.vy;
        this.collide(p, "y");
        p.vx *= 0.8;
        if (p.y > 2000) {
          p.x = 0;
          p.y = -200;
          p.vy = 0;
        }
        // Load Chunks
        const cx = Math.floor(p.x / 16 / 48),
          cy = Math.floor(p.y / 16 / 48);
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) this.getChunk(cx + dx, cy + dy);
      }
      // Drops
      for (let i = this.drops.length - 1; i >= 0; i--) {
        const d = this.drops[i];
        d.vy += GRAVITY;
        d.y += d.vy;
        if (this.isSolid(Math.floor(d.x / 48), Math.floor((d.y + 16) / 48))) {
          d.y = Math.floor((d.y + 16) / 48) * 48 - 16;
          d.vy = 0;
        }
        d.life--;
        for (let pid in this.players) {
          const p = this.players[pid];
          if (Math.hypot(p.x - d.x, p.y - d.y) < 40) {
            this.giveItem(pid, d.itemId, 1);
            this.drops.splice(i, 1);
            break;
          }
        }
        if (d.life <= 0) this.drops.splice(i, 1);
      }
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

  collide(e, axis) {
    const x1 = Math.floor(e.x / 48),
      x2 = Math.floor((e.x + 24) / 48);
    const y1 = Math.floor(e.y / 48),
      y2 = Math.floor((e.y + 54) / 48);
    for (let y = y1; y <= y2; y++)
      for (let x = x1; x <= x2; x++)
        if (this.isSolid(x, y)) {
          if (axis === "x") {
            e.x = e.vx > 0 ? x * 48 - 24.1 : (x + 1) * 48 + 0.1;
            e.vx = 0;
          } else {
            e.y = e.vy > 0 ? y * 48 - 54.1 : (y + 1) * 48 + 0.1;
            e.vy = 0;
            e.grounded = true;
          }
          return;
        }
    if (axis === "y") e.grounded = false;
  }
  isSolid(x, y) {
    const id = this.getBlock(x, y);
    return id && BLOCKS[id].solid;
  }

  // --- Actions ---
  getTargetBlock() {
    // If Mobile: Center of screen. If Desktop: Mouse cursor
    if (window.innerWidth < 1024) {
      // Simple mobile detection
      return {
        x: Math.floor(this.cam.x + this.width / 2),
        y: Math.floor(this.cam.y + this.height / 2),
      };
    } else {
      return { x: this.mouse.x + this.cam.x, y: this.mouse.y + this.cam.y };
    }
  }

  tryAction(action) {
    const target = this.getTargetBlock();
    const bx = Math.floor(target.x / TILE_SIZE);
    const by = Math.floor(target.y / TILE_SIZE);
    const p = this.players[this.net.myId];

    if (action === "MINE") {
      this.mining.active = true;
      this.mining.bx = bx;
      this.mining.by = by;
      this.mining.progress = 0;
    } else if (action === "PLACE") {
      if (p.inv[this.selSlot].id && !this.isSolid(bx, by)) {
        // Check player overlap
        if (
          !(
            bx * 48 < p.x + 24 &&
            bx * 48 + 48 > p.x &&
            by * 48 < p.y + 54 &&
            by * 48 + 48 > p.y
          )
        ) {
          this.net.send({ type: "PLACE", x: bx, y: by, slot: this.selSlot });
        }
      }
    }
  }
  stopMining() {
    this.mining.active = false;
    document.getElementById("mining-bar-container").style.display = "none";
  }

  processMining() {
    if (!this.mining.active) return;
    // Crosshair check for mobile (if moved too far)
    const target = this.getTargetBlock();
    const bx = Math.floor(target.x / TILE_SIZE);
    const by = Math.floor(target.y / TILE_SIZE);
    if (bx !== this.mining.bx || by !== this.mining.by) {
      this.mining.active = false;
      return;
    }

    const id = this.getBlock(this.mining.bx, this.mining.by);
    if (!id || BLOCKS[id].unbreakable) {
      this.stopMining();
      return;
    }

    const p = this.players[this.net.myId];
    const tool = ITEMS[p.inv[this.selSlot]?.id] || ITEMS[1];
    let power = tool.power || 1.0;

    this.mining.progress += power;
    const pct = Math.min(
      100,
      (this.mining.progress / BLOCKS[id].hardness) * 100
    );
    const bar = document.getElementById("mining-bar");
    document.getElementById("mining-bar-container").style.display = "block";
    bar.style.width = pct + "%";

    if (this.mining.progress >= BLOCKS[id].hardness) {
      this.net.send({ type: "MINE", x: this.mining.bx, y: this.mining.by });
      this.stopMining();
    }
  }

  spawnPlayer(id, x, y) {
    this.players[id] = {
      id,
      x,
      y,
      vx: 0,
      vy: 0,
      hp: 20,
      maxHp: 20,
      food: 20,
      maxFood: 20,
      inv: Array(9).fill({ id: 0, count: 0 }),
    };
    if (id === this.net.myId) {
      const inv = this.players[id].inv;
      inv[0] = { id: 110, count: 1 };
      inv[1] = { id: 100, count: 1 };
      inv[2] = { id: 16, count: 10 }; // TNT
      this.updateUI();
      this.cam.x = x - this.width / 2;
      this.cam.y = y - this.height / 2;
    }
  }
  giveItem(pid, id, n) {
    const p = this.players[pid];
    if (!p) return;
    for (let i = 0; i < 9; i++)
      if (p.inv[i].id === id) {
        p.inv[i].count += n;
        if (pid === this.net.myId) this.updateUI();
        return;
      }
    for (let i = 0; i < 9; i++)
      if (p.inv[i].id === 0) {
        p.inv[i] = { id, count: n };
        if (pid === this.net.myId) this.updateUI();
        return;
      }
  }

  onPacket(msg, sender) {
    if (msg.type === "INIT") {
      /* ... */
    } else if (msg.type === "CHUNK_DATA") {
      for (let k in msg.chunks)
        this.chunks[k] = new Uint8Array(Object.values(msg.chunks[k]));
    } else if (msg.type === "SYNC") {
      this.players = msg.players;
      this.drops = msg.drops;
      this.time = msg.time;
      this.updateUI();
    } else if (msg.type === "BLOCK") {
      this.setBlock(msg.x, msg.y, msg.id);
    } else if (this.net.isHost) {
      if (msg.type === "INPUT") {
        const p = this.players[sender];
        if (p) {
          if (msg.keys.a) p.vx = -5;
          if (msg.keys.d) p.vx = 5;
          if (msg.keys.w && p.grounded) p.vy = -10;
        }
      }
      if (msg.type === "PLACE") {
        const p = this.players[sender];
        const item = p.inv[msg.slot];
        if (item.id && item.count > 0 && !this.isSolid(msg.x, msg.y)) {
          this.setBlock(msg.x, msg.y, item.id);
          item.count--;
          if (item.count <= 0) item.id = 0;
        }
      }
      if (msg.type === "MINE") {
        const id = this.getBlock(msg.x, msg.y);
        if (id && !BLOCKS[id].unbreakable) {
          this.setBlock(msg.x, msg.y, 0); // Remove block
          // Handle TNT Explosion
          if (BLOCKS[id].name === "TNT") {
            this.net.broadcast({ type: "EXPLODE_FX", x: msg.x, y: msg.y });
            for (let dy = -3; dy <= 3; dy++)
              for (let dx = -3; dx <= 3; dx++) {
                if (dx * dx + dy * dy < 8)
                  this.setBlock(msg.x + dx, msg.y + dy, 0);
              }
          }
          // Generate Drop
          let did = BLOCKS[id].drop || id;
          if (did)
            this.drops.push({
              id: Math.random(),
              x: msg.x * 48 + 24,
              y: msg.y * 48 + 24,
              itemId: did,
              vx: (Math.random() - 0.5) * 4,
              vy: -5,
              life: 6000,
            });
        }
      }
    }
  }
  sendInput() {
    if (this.net.isHost)
      this.onPacket({ type: "INPUT", keys: this.keys }, this.net.myId);
    else if (this.net.hostId)
      this.net.sendTo(this.net.hostId, { type: "INPUT", keys: this.keys });
  }

  render() {
    if (!this.players[this.net.myId]) return;
    const p = this.players[this.net.myId];
    this.cam.x += (p.x - this.width / 2 - this.cam.x) * 0.1;
    this.cam.y += (p.y - this.height / 2 - this.cam.y) * 0.1;

    this.ctx.fillStyle = this.time % 24000 > 12000 ? "#1a237e" : "#87CEEB";
    this.ctx.fillRect(0, 0, this.width, this.height);

    const startCX = Math.floor(this.cam.x / 48 / 16),
      endCX = startCX + Math.ceil(this.width / 48 / 16) + 1;
    const startCY = Math.floor(this.cam.y / 48 / 16),
      endCY = startCY + Math.ceil(this.height / 48 / 16) + 1;

    for (let cy = startCY; cy <= endCY; cy++)
      for (let cx = startCX; cx <= endCX; cx++) {
        const chunk = this.chunks[this.getChunkKey(cx, cy)];
        if (!chunk) continue;
        for (let i = 0; i < 256; i++) {
          const id = chunk[i];
          if (id === 0) continue;
          const x = (cx * 16 + (i % 16)) * 48,
            y = (cy * 16 + Math.floor(i / 16)) * 48;
          if (this.assets.blocks[id])
            this.ctx.drawImage(
              this.assets.blocks[id],
              Math.floor(x - this.cam.x),
              Math.floor(y - this.cam.y),
              48,
              48
            );
        }
      }
    this.drops.forEach((d) => {
      const i = this.assets.items[d.itemId] || this.assets.blocks[d.itemId];
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
      this.ctx.fillStyle = id === this.net.myId ? "#29b6f6" : "#ccc";
      this.ctx.fillRect(ply.x - this.cam.x, ply.y - this.cam.y, 24, 54);
    }
    // Crosshair (Mobile Only)
    if (window.innerWidth < 1024) {
      this.ctx.strokeStyle = "rgba(255,255,255,0.8)";
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(this.width / 2 - 10, this.height / 2);
      this.ctx.lineTo(this.width / 2 + 10, this.height / 2);
      this.ctx.moveTo(this.width / 2, this.height / 2 - 10);
      this.ctx.lineTo(this.width / 2, this.height / 2 + 10);
      this.ctx.stroke();
    } else {
      // Desktop Cursor Highlight
      const mx = this.mouse.x + this.cam.x,
        my = this.mouse.y + this.cam.y;
      this.ctx.strokeStyle = "white";
      this.ctx.strokeRect(
        Math.floor(mx / 48) * 48 - this.cam.x,
        Math.floor(my / 48) * 48 - this.cam.y,
        48,
        48
      );
    }
    this.sendInput();
  }

  // Inventory UI Methods (Shortened)
  drawSlot(el, it) {
    el.innerHTML = "";
    if (it.id) {
      const i = this.assets.items[it.id] || this.assets.blocks[it.id];
      if (i) {
        const c = document.createElement("canvas");
        c.width = 32;
        c.height = 32;
        c.getContext("2d").drawImage(i, 0, 0);
        el.appendChild(c);
      }
      const s = document.createElement("span");
      s.className = "count";
      s.innerText = it.count;
      el.appendChild(s);
    }
  }
  initInvUI() {
    const mkSlot = (p, i) => {
      const d = document.createElement("div");
      d.className = "slot";
      d.onclick = () => {
        if (this.selectedInvSlot !== -1) {
          const pl = this.players[this.net.myId];
          const it = pl.inv[this.selectedInvSlot];
          if (it.id && it.count) {
            it.count--;
            if (this.craftGrid[i].id === it.id) this.craftGrid[i].count++;
            else this.craftGrid[i] = { id: it.id, count: 1 };
            if (it.count <= 0)
              pl.inv[this.selectedInvSlot] = { id: 0, count: 0 };
            this.checkCrafting();
            this.updateUI();
            this.updateCraftUI();
          }
        }
      };
      p.appendChild(d);
    };
    const g = document.getElementById("inv-grid");
    g.innerHTML = "";
    for (let i = 0; i < 9; i++) {
      const d = document.createElement("div");
      d.className = "slot";
      d.onclick = () => {
        this.selectedInvSlot = i;
        this.updateUI();
      };
      g.appendChild(d);
    }
    const cg = document.getElementById("craft-grid");
    cg.innerHTML = "";
    for (let i = 0; i < 9; i++) mkSlot(cg, i);
    document.getElementById("craft-result-slot").onclick = () => {
      if (this.craftResult.id) {
        for (let i = 0; i < 9; i++)
          if (this.craftGrid[i].id) {
            this.craftGrid[i].count--;
            if (this.craftGrid[i].count <= 0)
              this.craftGrid[i] = { id: 0, count: 0 };
          }
        this.giveItem(
          this.net.myId,
          this.craftResult.id,
          this.craftResult.count
        );
        this.checkCrafting();
        this.updateUI();
        this.updateCraftUI();
      }
    };
  }
  checkCrafting() {
    /* (Same simple crafting logic) */
    const g = this.craftGrid.map((s) => s.id);
    for (let r of RECIPES) {
      if (r.shapeless) {
        /* shapeless check */ const inIds = r.in.slice();
        const gIds = g.filter((x) => x);
        if (
          inIds.length === gIds.length &&
          inIds.every((x) => gIds.includes(x))
        ) {
          this.craftResult = { id: r.out.id, count: r.out.count };
          this.updateCraftUI();
          return;
        }
      } else if (r.pattern) {
        let m = true;
        for (let i = 0; i < 9; i++) if (g[i] !== r.pattern[i]) m = false;
        if (m) {
          this.craftResult = { id: r.out.id, count: r.out.count };
          this.updateCraftUI();
          return;
        }
      }
    }
    this.craftResult = { id: 0, count: 0 };
    this.updateCraftUI();
  }
  updateUI() {
    const p = this.players[this.net.myId];
    if (!p) return;
    document.getElementById("health-bar").style.width =
      (p.hp / p.maxHp) * 100 + "%";
    document.getElementById("food-bar").style.width =
      (p.food / p.maxFood) * 100 + "%";
    const b = document.getElementById("inventory-bar");
    b.innerHTML = "";
    p.inv.forEach((it, i) => {
      const d = document.createElement("div");
      d.className = `slot ${i === this.selSlot ? "active" : ""}`;
      this.drawSlot(d, it);
      b.appendChild(d);
    });
    const g = document.getElementById("inv-grid").children;
    p.inv.forEach((it, i) => {
      this.drawSlot(g[i], it);
      g[i].style.borderColor = i === this.selectedInvSlot ? "#0f0" : "#444";
    });
  }
  updateCraftUI() {
    const g = document.getElementById("craft-grid").children;
    this.craftGrid.forEach((it, i) => this.drawSlot(g[i], it));
    this.drawSlot(
      document.getElementById("craft-result-slot"),
      this.craftResult
    );
  }
  toggleInv() {
    const s = document.getElementById("inventory-screen");
    s.style.display = s.style.display === "none" ? "flex" : "none";
    if (s.style.display === "flex") {
      this.selectedInvSlot = -1;
      this.updateUI();
    }
  }
}
window.onload = () => new Game();
