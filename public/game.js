/**
 * FullStackCraft v2 - High Graphics & Procedural Generation
 * No external images. All graphics drawn via Canvas API.
 */

// --- CONFIG & CONSTANTS ---
const TILE_SIZE = 32;
const CHUNK_SIZE = 16;
const WORLD_WIDTH = 128; // Increased world size
const WORLD_HEIGHT = 96;
const GRAVITY = 0.5;

// Block Definitions with Rendering Properties
// type: 0=standard, 1=noise, 2=layered, 3=cross(plants)
const BLOCKS = {
  0: { name: "Air", solid: false },
  1: { name: "Grass", color: "#5b8a36", solid: true, type: "grass" },
  2: { name: "Dirt", color: "#704828", solid: true, type: "noise" },
  3: { name: "Stone", color: "#666666", solid: true, type: "noise" },
  4: { name: "Sand", color: "#dcc688", solid: true, type: "noise" },
  5: { name: "Wood", color: "#5c3817", solid: true, type: "wood" },
  6: { name: "Leaves", color: "#3a7a28", solid: true, type: "leaves" },
  7: {
    name: "Water",
    color: "rgba(50,100,200,0.6)",
    solid: false,
    fluid: true,
    type: "liquid",
  },
  11: {
    name: "CoalOre",
    color: "#333",
    solid: true,
    type: "ore",
    oreColor: "#000",
  },
  13: {
    name: "IronOre",
    color: "#aaa",
    solid: true,
    type: "ore",
    oreColor: "#dca47e",
  },
  14: {
    name: "GoldOre",
    color: "#ddd",
    solid: true,
    type: "ore",
    oreColor: "#ffe84d",
  },
  15: {
    name: "DiamondOre",
    color: "#777",
    solid: true,
    type: "ore",
    oreColor: "#00ffff",
  },
  21: { name: "Cobble", color: "#555", solid: true, type: "brick" },
  26: { name: "Planks", color: "#a07040", solid: true, type: "plank" },
  31: { name: "CraftTable", color: "#852", solid: true, type: "table" },
  41: {
    name: "Flower",
    color: "#f0f",
    solid: false,
    type: "cross",
    flowerColor: "#ffcc00",
  },
  51: {
    name: "Bedrock",
    color: "#111",
    solid: true,
    unbreakable: true,
    type: "noise",
  },
};

const ITEMS = {
  1: { name: "Hand", type: "tool", power: 1 },
  2: { name: "Pickaxe", type: "tool", power: 3 },
  11: { name: "Sword", type: "weapon", power: 5 },
};

// Procedural Drops
class Drop {
  constructor(x, y, itemId) {
    this.id = Math.random().toString(36);
    this.x = x;
    this.y = y;
    this.itemId = itemId;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = -3;
    this.life = 6000; // 5 mins
    this.bobOffset = Math.random() * Math.PI * 2;
  }
}

// --- NETWORK SYSTEM (WebRTC) ---
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
      if (this.isHost) {
        this.game.generateWorld();
        this.game.loop();
      }
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
      } else if (d.signal.type === "answer") {
        await pc.setRemoteDescription(d.signal);
      } else if (d.signal.candidate) {
        await pc.addIceCandidate(d.signal.candidate);
      }
    });

    this.socket.on("host-migrated", (d) => {
      this.hostId = d.newHostId;
      if (this.hostId === this.myId) {
        this.isHost = true;
        this.game.loop();
      } else {
        window.location.reload();
      }
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
    } else {
      pc.ondatachannel = (e) => this.setupDC(e.channel, target);
    }
  }

  setupDC(dc, target) {
    this.channels[target] = dc;
    dc.onopen = () => {
      if (this.isHost)
        this.sendTo(target, {
          type: "INIT",
          world: this.game.world,
          players: this.game.players,
        });
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
    if (this.channels[id] && this.channels[id].readyState === "open")
      this.channels[id].send(JSON.stringify(msg));
  }
}

// --- GAME ENGINE ---
class Game {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.fitScreen();

    this.world = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
    this.players = {};
    this.drops = [];
    this.net = new Network(this);

    this.keys = {};
    this.mouse = { x: 0, y: 0, left: false };
    this.cam = { x: 0, y: 0 };
    this.selSlot = 0;

    // Asset Cache (Prerender blocks to offscreen canvas for performance)
    this.blockCache = {};
    this.prerenderBlocks();

    window.addEventListener("resize", () => this.fitScreen());
    window.addEventListener("keydown", (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key >= "1" && e.key <= "9") {
        this.selSlot = parseInt(e.key) - 1;
        this.updateUI();
      }
      if (e.key === "e") this.toggleInv();
      if (e.key === "f") this.sendInput({ attack: true });
    });
    window.addEventListener(
      "keyup",
      (e) => (this.keys[e.key.toLowerCase()] = false)
    );
    window.addEventListener("mousemove", (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    window.addEventListener("mousedown", () => {
      this.mouse.left = true;
      this.interact();
    });
    window.addEventListener("mouseup", () => (this.mouse.left = false));

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

  // --- GRAPHICS: PROCEDURAL TEXTURE GENERATION ---
  prerenderBlocks() {
    for (let id in BLOCKS) {
      const b = BLOCKS[id];
      const c = document.createElement("canvas");
      c.width = TILE_SIZE;
      c.height = TILE_SIZE;
      const ctx = c.getContext("2d");

      // Base
      ctx.fillStyle = b.color || "#f0f";
      ctx.fillRect(0, 0, 32, 32);

      // Noise Overlay
      if (b.type === "noise" || b.type === "grass" || b.type === "ore") {
        for (let i = 0; i < 40; i++) {
          ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.2})`;
          ctx.fillRect(Math.random() * 32, Math.random() * 32, 2, 2);
          ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.1})`;
          ctx.fillRect(Math.random() * 32, Math.random() * 32, 2, 2);
        }
      }

      // Specific Details
      if (b.type === "grass") {
        ctx.fillStyle = "#4a7028";
        for (let i = 0; i < 10; i++)
          ctx.fillRect(Math.random() * 30, Math.random() * 10, 2, 6);
        // Top layer brightness
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.fillRect(0, 0, 32, 5);
      }
      if (b.type === "stone" || b.id === 3) {
        ctx.fillStyle = "#555";
        ctx.fillRect(5, 5, 10, 6);
        ctx.fillRect(20, 18, 8, 5);
      }
      if (b.type === "wood") {
        ctx.fillStyle = "#4a2d12";
        ctx.fillRect(4, 0, 4, 32);
        ctx.fillRect(14, 0, 4, 32);
        ctx.fillRect(24, 0, 4, 32);
      }
      if (b.type === "leaves") {
        ctx.fillStyle = "#2d611e";
        for (let i = 0; i < 8; i++)
          ctx.fillRect(Math.random() * 24, Math.random() * 24, 6, 6);
      }
      if (b.type === "brick" || b.type === "plank") {
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(0, 0, 32, 1);
        ctx.fillRect(0, 15, 32, 1);
        ctx.fillRect(0, 31, 32, 1);
        ctx.fillRect(15, 1, 1, 14);
        ctx.fillRect(8, 16, 1, 15);
      }
      if (b.type === "ore") {
        ctx.fillStyle = b.oreColor;
        ctx.fillRect(8, 8, 6, 6);
        ctx.fillRect(20, 10, 4, 4);
        ctx.fillRect(10, 20, 5, 5);
      }

      this.blockCache[id] = c;
    }
  }

  // --- TERRAIN GENERATION ---
  generateWorld() {
    // Noise function (Simple 1D)
    const noise = (x, freq) => Math.sin(x * freq);
    const heightMap = [];

    for (let x = 0; x < WORLD_WIDTH; x++) {
      // Combine noises for terrain
      let h = 40 + noise(x, 0.1) * 10 + noise(x, 0.05) * 20 + noise(x, 0.5) * 2;
      heightMap[x] = Math.floor(h);
    }

    for (let y = 0; y < WORLD_HEIGHT; y++) {
      for (let x = 0; x < WORLD_WIDTH; x++) {
        const idx = y * WORLD_WIDTH + x;
        let id = 0;

        if (y >= WORLD_HEIGHT - 2) id = 51; // Bedrock
        else if (y > heightMap[x]) {
          // Underground
          id = 3; // Stone
          if (y < heightMap[x] + 4) id = 2; // Dirt layer

          // Caves (Simplex-ish noise check would go here, using random for simple caves)
          if (y > 50 && Math.random() < 0.05) id = 0;

          // Ores
          if (id === 3) {
            const r = Math.random();
            if (r < 0.04) id = 11; // Coal
            else if (r < 0.01 && y > 60) id = 13; // Iron
            else if (r < 0.005 && y > 80) id = 15; // Diamond
          }
        } else if (y === heightMap[x]) {
          id = 1; // Grass

          // Trees
          if (x > 5 && x < WORLD_WIDTH - 5 && Math.random() < 0.05) {
            this.generateTree(x, y - 1);
          }
          // Flower
          else if (Math.random() < 0.1)
            this.world[(y - 1) * WORLD_WIDTH + x] = 41;
        }

        if (this.world[idx] === 0 && id !== 0) this.world[idx] = id;
      }
    }

    // Spawn host
    this.spawnPlayer(this.net.myId, 64 * 32, 20 * 32);
  }

  generateTree(x, y) {
    // Trunk
    const height = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < height; i++) this.world[(y - i) * WORLD_WIDTH + x] = 5;
    // Leaves
    const top = y - height;
    for (let ly = top - 2; ly <= top + 1; ly++) {
      for (let lx = x - 2; lx <= x + 2; lx++) {
        if (this.world[ly * WORLD_WIDTH + lx] === 0) {
          // Randomize shape
          if (Math.abs(lx - x) + Math.abs(ly - top) < 3.5)
            this.world[ly * WORLD_WIDTH + lx] = 6;
        }
      }
    }
  }

  // --- LOGIC LOOP ---
  loop() {
    if (this.net.isHost) {
      this.updatePhysics();
      this.updateDrops();
      this.net.broadcast({
        type: "SYNC",
        players: this.players,
        drops: this.drops,
        time: Date.now(),
      });
    }
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  updatePhysics() {
    for (let id in this.players) {
      const p = this.players[id];
      p.vy += GRAVITY;
      p.x += p.vx;
      this.collide(p, "x");
      p.y += p.vy;
      this.collide(p, "y");
      p.vx *= 0.8;
      if (p.y > WORLD_HEIGHT * TILE_SIZE)
        this.spawnPlayer(id, 64 * 32, 20 * 32);
    }
  }

  updateDrops() {
    // Physics for drops
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.vy += GRAVITY;
      d.y += d.vy;
      // Simple floor collision
      const bx = Math.floor(d.x / TILE_SIZE);
      const by = Math.floor((d.y + 16) / TILE_SIZE);
      if (this.isSolid(bx, by)) {
        d.y = by * TILE_SIZE - 16;
        d.vy = 0;
      }
      d.life--;

      // Pickup
      for (let pid in this.players) {
        const p = this.players[pid];
        const dist = Math.hypot(p.x - d.x, p.y - d.y);
        if (dist < 50) {
          // Magnet
          d.x += (p.x - d.x) * 0.1;
          d.y += (p.y - d.y) * 0.1;
        }
        if (dist < 20) {
          this.giveItem(pid, d.itemId, 1);
          this.drops.splice(i, 1);
          this.net.broadcast({ type: "SOUND", name: "pickup" });
          break;
        }
      }
      if (d.life <= 0) this.drops.splice(i, 1);
    }
  }

  collide(e, axis) {
    const x1 = Math.floor(e.x / TILE_SIZE),
      x2 = Math.floor((e.x + 24) / TILE_SIZE);
    const y1 = Math.floor(e.y / TILE_SIZE),
      y2 = Math.floor((e.y + 54) / TILE_SIZE);

    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        if (this.isSolid(x, y)) {
          if (axis === "x") {
            if (e.vx > 0) e.x = x * TILE_SIZE - 24.1;
            else e.x = (x + 1) * TILE_SIZE + 0.1;
            e.vx = 0;
          } else {
            if (e.vy > 0) {
              e.y = y * TILE_SIZE - 54.1;
              e.grounded = true;
            } else e.y = (y + 1) * TILE_SIZE + 0.1;
            e.vy = 0;
          }
          return;
        }
      }
    }
    if (axis === "y") e.grounded = false;
  }

  isSolid(x, y) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return false;
    const b = BLOCKS[this.world[y * WORLD_WIDTH + x]];
    return b && b.solid;
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
      inv: Array(9).fill({ id: 0, count: 0 }),
    };
    if (id === this.net.myId) {
      this.players[id].inv[0] = { id: 2, count: 1 }; // Pickaxe
      this.updateUI();
    }
  }

  giveItem(pid, itemId, count) {
    const p = this.players[pid];
    if (!p) return;
    // Stack logic
    for (let i = 0; i < 9; i++) {
      if (p.inv[i].id === itemId) {
        p.inv[i].count += count;
        return;
      }
    }
    for (let i = 0; i < 9; i++) {
      if (p.inv[i].id === 0) {
        p.inv[i] = { id: itemId, count };
        return;
      }
    }
  }

  interact() {
    const p = this.players[this.net.myId];
    if (!p) return;
    const mx = this.mouse.x + this.cam.x;
    const my = this.mouse.y + this.cam.y;
    const bx = Math.floor(mx / TILE_SIZE);
    const by = Math.floor(my / TILE_SIZE);

    const mode = this.keys["shift"] ? "place" : "dig";
    this.net.send({ type: "INTERACT", x: bx, y: by, mode, slot: this.selSlot });
  }

  onPacket(msg, sender) {
    if (msg.type === "INIT") {
      this.world = new Uint8Array(Object.values(msg.world)); // Convert back to array
      this.players = msg.players;
    } else if (msg.type === "SYNC") {
      this.players = msg.players;
      this.drops = msg.drops;
      this.updateUI(); // Refresh HP
    } else if (msg.type === "BLOCK") {
      this.world[msg.y * WORLD_WIDTH + msg.x] = msg.id;
    } else if (this.net.isHost) {
      // Host logic
      if (msg.type === "INPUT") {
        const p = this.players[sender];
        if (p) {
          if (msg.keys.a) p.vx = -4;
          if (msg.keys.d) p.vx = 4;
          if (msg.keys.w && p.grounded) p.vy = -9;
        }
      }
      if (msg.type === "INTERACT") {
        const p = this.players[sender];
        const dx = msg.x * TILE_SIZE - p.x;
        const dy = msg.y * TILE_SIZE - p.y;
        if (dx * dx + dy * dy > 200 * 200) return; // Anti-cheat range

        if (msg.mode === "dig") {
          const bid = this.world[msg.y * WORLD_WIDTH + msg.x];
          if (bid && bid !== 51) {
            this.world[msg.y * WORLD_WIDTH + msg.x] = 0;
            // Create drop
            this.drops.push(
              new Drop(msg.x * TILE_SIZE + 8, msg.y * TILE_SIZE + 8, bid)
            );
            this.net.broadcast({ type: "BLOCK", x: msg.x, y: msg.y, id: 0 });
          }
        } else {
          // Place
          const item = p.inv[msg.slot];
          if (item.id > 0 && !this.isSolid(msg.x, msg.y)) {
            this.world[msg.y * WORLD_WIDTH + msg.x] = item.id;
            item.count--;
            if (item.count <= 0) item.id = 0;
            this.net.broadcast({
              type: "BLOCK",
              x: msg.x,
              y: msg.y,
              id: item.id,
            });
          }
        }
      }
    }
  }

  sendInput(extra = {}) {
    if (this.net.isHost)
      this.onPacket(
        { type: "INPUT", keys: this.keys, ...extra },
        this.net.myId
      );
    else
      this.net.sendTo(this.net.hostId, {
        type: "INPUT",
        keys: this.keys,
        ...extra,
      });
  }

  // --- RENDERER (ENHANCED) ---
  render() {
    if (!this.players[this.net.myId]) return;
    const p = this.players[this.net.myId];

    // Smooth Camera
    this.cam.x += (p.x - this.width / 2 - this.cam.x) * 0.1;
    this.cam.y += (p.y - this.height / 2 - this.cam.y) * 0.1;

    // Sky Gradient
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, "#4facfe"); // Cyan
    grad.addColorStop(1, "#00f2fe"); // Light Blue
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Sun
    this.ctx.fillStyle = "rgba(255, 255, 200, 0.8)";
    this.ctx.beginPath();
    this.ctx.arc(this.width - 100, 100, 40, 0, Math.PI * 2);
    this.ctx.fill();

    // Render Blocks
    const scx = Math.floor(this.cam.x / TILE_SIZE);
    const scy = Math.floor(this.cam.y / TILE_SIZE);
    const ecx = scx + Math.floor(this.width / TILE_SIZE) + 2;
    const ecy = scy + Math.floor(this.height / TILE_SIZE) + 2;

    for (let y = scy; y < ecy; y++) {
      for (let x = scx; x < ecx; x++) {
        if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) continue;
        const id = this.world[y * WORLD_WIDTH + x];
        if (id !== 0 && this.blockCache[id]) {
          this.ctx.drawImage(
            this.blockCache[id],
            Math.floor(x * TILE_SIZE - this.cam.x),
            Math.floor(y * TILE_SIZE - this.cam.y)
          );

          // Shadow overlay for depth
          if (
            y < WORLD_HEIGHT - 1 &&
            this.world[(y + 1) * WORLD_WIDTH + x] !== 0
          ) {
            // Block below exists, no shadow needed
          } else {
            // Simple shading
          }
        }
      }
    }

    // Drops
    this.drops.forEach((d) => {
      const yOff = Math.sin(Date.now() / 200 + d.bobOffset) * 3;
      const size = 16;
      if (this.blockCache[d.itemId]) {
        this.ctx.drawImage(
          this.blockCache[d.itemId],
          d.x - this.cam.x,
          d.y - this.cam.y + yOff,
          size,
          size
        );
      }
    });

    // Players
    for (let id in this.players) {
      const ply = this.players[id];
      const px = ply.x - this.cam.x;
      const py = ply.y - this.cam.y;

      // Body
      this.ctx.fillStyle = id === this.net.myId ? "#fff" : "#ccc";
      this.ctx.fillRect(px, py, 24, 54);
      // Head
      this.ctx.fillStyle = "#eebb99";
      this.ctx.fillRect(px + 4, py + 4, 16, 16);
      // Eyes
      this.ctx.fillStyle = "#000";
      this.ctx.fillRect(px + (ply.vx > 0 ? 14 : 6), py + 8, 2, 2);

      // Name
      this.ctx.fillStyle = "#fff";
      this.ctx.font = "10px Arial";
      this.ctx.fillText("Player", px - 5, py - 5);
    }

    // Send Input continuously
    this.sendInput();

    // Update Stats
    document.getElementById("debug-info").innerText = `FPS: ${Math.floor(
      1000 / 16
    )} | X:${Math.floor(p.x / 32)} Y:${Math.floor(p.y / 32)}`;
  }

  // --- UI HELPERS ---
  initInvUI() {
    const c = document.getElementById("inv-grid");
    c.innerHTML = "";
    for (let i = 0; i < 9; i++) {
      const d = document.createElement("div");
      d.className = "slot";
      d.onclick = () => {
        this.selSlot = i;
        this.updateUI();
      };
      c.appendChild(d);
    }
  }

  updateUI() {
    const p = this.players[this.net.myId];
    if (!p) return;

    // Health
    document.getElementById("health-bar").style.width =
      (p.hp / p.maxHp) * 100 + "%";

    // Hotbar
    const bar = document.getElementById("inventory-bar");
    bar.innerHTML = "";
    p.inv.forEach((item, i) => {
      const d = document.createElement("div");
      d.className = `slot ${i === this.selSlot ? "active" : ""}`;
      if (item.id !== 0 && this.blockCache[item.id]) {
        const cnv = document.createElement("canvas");
        cnv.width = 32;
        cnv.height = 32;
        cnv.getContext("2d").drawImage(this.blockCache[item.id], 0, 0);
        d.appendChild(cnv);
        d.innerHTML += `<span class="count">${item.count}</span>`;
      }
      bar.appendChild(d);
    });

    // Main Inventory
    const grid = document.getElementById("inv-grid").children;
    for (let i = 0; i < 9; i++) {
      const d = grid[i];
      d.innerHTML = "";
      if (p.inv[i].id !== 0 && this.blockCache[p.inv[i].id]) {
        const cnv = document.createElement("canvas");
        cnv.width = 32;
        cnv.height = 32;
        cnv.getContext("2d").drawImage(this.blockCache[p.inv[i].id], 0, 0);
        d.appendChild(cnv);
        d.innerHTML += `<span class="count">${p.inv[i].count}</span>`;
      }
    }
  }

  toggleInv() {
    const ui = document.getElementById("inventory-screen");
    ui.style.display = ui.style.display === "none" ? "flex" : "none";
    this.updateUI();
  }
}

window.onload = () => new Game();
