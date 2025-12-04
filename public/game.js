/**
 * FullStackCraft v8 - High-End Graphics & Physics
 * Procedural Textures, Particles, Fluid Drops
 */

const TILE_SIZE = 48; // Increased resolution
const CHUNK_SIZE = 16;
const WORLD_WIDTH = 100;
const WORLD_HEIGHT = 80;
const GRAVITY = 0.6;

// --- BLOCK DEFINITIONS ---
// type: generation style
const BLOCKS = {
  0: { name: "Air", solid: false },
  1: { name: "Grass", solid: true, hardness: 20, type: "grass" },
  2: {
    name: "Dirt",
    solid: true,
    hardness: 15,
    type: "noise",
    color: "#5d4037",
  },
  3: {
    name: "Stone",
    solid: true,
    hardness: 60,
    type: "noise",
    color: "#757575",
  },
  4: {
    name: "Sand",
    solid: true,
    hardness: 15,
    type: "noise",
    color: "#fff59d",
  },
  5: {
    name: "Log",
    solid: true,
    hardness: 40,
    type: "column",
    color: "#4e342e",
  },
  6: {
    name: "Leaves",
    solid: true,
    hardness: 5,
    type: "noise",
    color: "#388e3c",
  },
  7: {
    name: "Water",
    solid: false,
    fluid: true,
    type: "liquid",
    color: "rgba(33,150,243,0.6)",
  },
  8: {
    name: "Planks",
    solid: true,
    hardness: 30,
    type: "plank",
    color: "#8d6e63",
  },
  9: {
    name: "Brick",
    solid: true,
    hardness: 80,
    type: "brick",
    color: "#bf360c",
  },
  10: {
    name: "Glass",
    solid: true,
    hardness: 10,
    type: "glass",
    color: "rgba(200,240,255,0.3)",
  },
  11: {
    name: "CoalOre",
    solid: true,
    hardness: 80,
    type: "ore",
    color: "#212121",
    base: 3,
  },
  12: {
    name: "IronOre",
    solid: true,
    hardness: 100,
    type: "ore",
    color: "#d7ccc8",
    base: 3,
  },
  13: {
    name: "GoldOre",
    solid: true,
    hardness: 120,
    type: "ore",
    color: "#ffca28",
    base: 3,
  },
  14: {
    name: "DiamondOre",
    solid: true,
    hardness: 180,
    type: "ore",
    color: "#00e5ff",
    base: 3,
  },
  15: {
    name: "Cactus",
    solid: true,
    hardness: 20,
    type: "column",
    color: "#64dd17",
  },
  51: {
    name: "Bedrock",
    solid: true,
    unbreakable: true,
    type: "noise",
    color: "#000000",
  },
};

const ITEMS = {
  0: { name: "Air" },
  1: { name: "Hand", power: 1 },
  2: { name: "Pickaxe", power: 5, iconColor: "#8d6e63" }, // Wood
  3: { name: "IronPick", power: 10, iconColor: "#bdbdbd" },
  4: { name: "DiaPick", power: 20, iconColor: "#00e5ff" },
  5: { name: "Axe", power: 5, iconColor: "#8d6e63" },
};

// --- GRAPHICS ENGINE ---
class TextureGenerator {
  static generate(id) {
    const c = document.createElement("canvas");
    c.width = TILE_SIZE;
    c.height = TILE_SIZE;
    const ctx = c.getContext("2d");
    const b = BLOCKS[id];

    // Base fill
    if (b.type !== "glass") {
      ctx.fillStyle = b.color || "#f0f";
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    }

    // Noise
    if (b.type === "noise" || b.type === "grass" || b.type === "ore") {
      this.drawNoise(ctx, 0.1);
    }

    // Specific Patterns
    if (b.type === "grass") {
      ctx.fillStyle = "#64dd17"; // Green top
      ctx.fillRect(0, 0, TILE_SIZE, 12);
      this.drawNoise(ctx, 0.05);
      // Grass blades
      ctx.fillStyle = "#33691e";
      for (let i = 0; i < 8; i++)
        ctx.fillRect(Math.random() * TILE_SIZE, Math.random() * 8, 2, 4);
    } else if (b.type === "column") {
      // Log, Cactus
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(4, 0, 4, TILE_SIZE);
      ctx.fillRect(TILE_SIZE - 8, 0, 4, TILE_SIZE);
      if (b.name === "Cactus") {
        // Spikes
        ctx.fillStyle = "#000";
        for (let i = 0; i < 5; i++)
          ctx.fillRect(
            Math.random() * TILE_SIZE,
            Math.random() * TILE_SIZE,
            2,
            1
          );
      }
    } else if (b.type === "brick") {
      ctx.strokeStyle = "rgba(200,200,200,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, TILE_SIZE / 2);
      ctx.lineTo(TILE_SIZE, TILE_SIZE / 2);
      ctx.moveTo(TILE_SIZE / 2, 0);
      ctx.lineTo(TILE_SIZE / 2, TILE_SIZE / 2);
      ctx.moveTo(TILE_SIZE / 4, TILE_SIZE / 2);
      ctx.lineTo(TILE_SIZE / 4, TILE_SIZE);
      ctx.moveTo(TILE_SIZE * 0.75, TILE_SIZE / 2);
      ctx.lineTo(TILE_SIZE * 0.75, TILE_SIZE);
      ctx.stroke();
    } else if (b.type === "plank") {
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(0, 10, TILE_SIZE, 2);
      ctx.fillRect(0, 25, TILE_SIZE, 2);
    } else if (b.type === "glass") {
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
      ctx.beginPath();
      ctx.moveTo(10, 10);
      ctx.lineTo(20, 20);
      ctx.stroke();
    } else if (b.type === "ore") {
      ctx.fillStyle = b.color;
      // Gems
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(10 + Math.random() * 20, 10 + Math.random() * 20, 8, 8);
      }
    }

    // Shadow Gradient (Simulate depth)
    const grad = ctx.createLinearGradient(0, 0, TILE_SIZE, TILE_SIZE);
    grad.addColorStop(0, "rgba(255,255,255,0.1)");
    grad.addColorStop(1, "rgba(0,0,0,0.1)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    return c;
  }

  static drawNoise(ctx, intensity) {
    const id = ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const val = (Math.random() - 0.5) * 255 * intensity;
      d[i] += val;
      d[i + 1] += val;
      d[i + 2] += val;
    }
    ctx.putImageData(id, 0, 0);
  }
}

// --- PARTICLE SYSTEM ---
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 5;
    this.vy = (Math.random() - 0.5) * 5;
    this.life = 1.0;
    this.color = color;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // Gravity
    this.life -= 0.05;
  }
  render(ctx, camX, camY) {
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.life;
    ctx.fillRect(this.x - camX, this.y - camY, 4, 4);
    ctx.globalAlpha = 1.0;
  }
}

// --- DROP SYSTEM ---
class Drop {
  constructor(x, y, itemId) {
    this.id = Math.random().toString(36);
    this.x = x;
    this.y = y;
    this.itemId = itemId;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = -5;
    this.grounded = false;
    this.life = 6000;
    this.bob = Math.random() * Math.PI * 2;
  }
}

// --- NETWORKING ---
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
        this.game.genWorld();
        this.game.start();
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
    if (this.channels[id]?.readyState === "open")
      this.channels[id].send(JSON.stringify(msg));
  }
}

// --- MAIN GAME ---
class Game {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.fitScreen();

    this.world = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
    this.players = {};
    this.drops = [];
    this.particles = [];
    this.net = new Network(this);

    this.keys = {};
    this.mouse = { x: 0, y: 0, left: false, right: false };
    this.cam = { x: 0, y: 0 };
    this.selSlot = 0;

    this.mining = { active: false, bx: 0, by: 0, progress: 0 };
    this.assets = { blocks: {}, items: {} };
    this.genAssets();

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
      if (e.button === 0) this.mouse.left = true;
      if (e.button === 2) {
        this.mouse.right = true;
        this.tryPlace();
      }
    });
    window.addEventListener("mouseup", (e) => {
      if (e.button === 0) {
        this.mouse.left = false;
        this.mining.active = false;
        this.mining.progress = 0;
      }
      if (e.button === 2) this.mouse.right = false;
    });
    window.addEventListener("contextmenu", (e) => e.preventDefault());

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
    this.loop();
  }

  genAssets() {
    for (let id in BLOCKS) {
      if (id == 0) continue;
      this.assets.blocks[id] = TextureGenerator.generate(id);
    }
    // Tool Icons
    for (let id in ITEMS) {
      if (ITEMS[id].type === "tool" || ITEMS[id].type === "weapon") {
        const c = document.createElement("canvas");
        c.width = 32;
        c.height = 32;
        const ctx = c.getContext("2d");
        ctx.translate(16, 16);
        ctx.rotate(-Math.PI / 4);
        ctx.fillStyle = "#5d4037";
        ctx.fillRect(-2, 0, 4, 14); // Handle
        ctx.fillStyle = ITEMS[id].iconColor || "#fff";
        ctx.beginPath();
        ctx.arc(0, -2, 10, Math.PI, 0);
        ctx.lineTo(0, 4);
        ctx.fill(); // Pick head
        this.assets.items[id] = c;
      }
    }
  }

  genWorld() {
    // Biomes: Plains (flat), Desert (sand), Mountains (high)
    const noise = (x, f) => Math.sin(x * f);
    const hMap = [];
    for (let x = 0; x < WORLD_WIDTH; x++) {
      let h = 30;
      if (x < 30) h += noise(x, 0.1) * 5; // Plains
      else if (x < 60) h += noise(x, 0.05) * 15; // Mountains
      else h += noise(x, 0.02) * 8; // Desert
      hMap[x] = Math.floor(40 + h);
    }

    for (let y = 0; y < WORLD_HEIGHT; y++)
      for (let x = 0; x < WORLD_WIDTH; x++) {
        const idx = y * WORLD_WIDTH + x;
        if (y >= WORLD_HEIGHT - 1) {
          this.world[idx] = 51;
          continue;
        }

        if (y > hMap[x]) {
          this.world[idx] = 3; // Stone
          if (y < hMap[x] + 4) this.world[idx] = x > 60 ? 4 : 2; // Dirt/Sand

          // Ores
          if (this.world[idx] === 3 && Math.random() < 0.05) {
            const r = Math.random();
            if (r < 0.6) this.world[idx] = 11;
            else if (r < 0.9) this.world[idx] = 12;
            else if (r < 0.98) this.world[idx] = 13;
            else this.world[idx] = 14;
          }
        } else if (y === hMap[x]) {
          this.world[idx] = x > 60 ? 4 : 1; // Sand or Grass
          // Trees
          if (x < 60 && Math.random() < 0.08) this.genTree(x, y - 1);
          // Cactus
          if (x > 60 && Math.random() < 0.05) {
            this.world[(y - 1) * WORLD_WIDTH + x] = 15;
            this.world[(y - 2) * WORLD_WIDTH + x] = 15;
          }
        }
      }
    this.spawnPlayer(this.net.myId, 50 * TILE_SIZE, 10 * TILE_SIZE);
  }

  genTree(x, y) {
    for (let i = 0; i < 4; i++) this.world[(y - i) * WORLD_WIDTH + x] = 5;
    for (let ly = y - 5; ly <= y - 3; ly++)
      for (let lx = x - 2; lx <= x + 2; lx++)
        if (!this.world[ly * WORLD_WIDTH + lx])
          this.world[ly * WORLD_WIDTH + lx] = 6;
  }

  loop() {
    if (this.net.isHost) {
      this.updatePhys();
      this.updateDrops();
      this.net.broadcast({
        type: "SYNC",
        players: this.players,
        drops: this.drops,
      });
    }
    this.processMining();
    this.updateParticles();
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  updatePhys() {
    for (let id in this.players) {
      const p = this.players[id];
      p.vy += GRAVITY;
      p.x += p.vx;
      this.collide(p, "x");
      p.y += p.vy;
      this.collide(p, "y");
      p.vx *= 0.8;
      if (p.y > WORLD_HEIGHT * TILE_SIZE) {
        p.x = 50 * TILE_SIZE;
        p.y = 10 * TILE_SIZE;
        p.vy = 0;
      }
    }
  }

  updateDrops() {
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.vy += GRAVITY;
      d.y += d.vy;
      const bx = Math.floor(d.x / TILE_SIZE),
        by = Math.floor((d.y + 16) / TILE_SIZE);
      if (this.isSolid(bx, by)) {
        d.y = by * TILE_SIZE - 16;
        d.vy *= -0.5; // Bounce
        if (Math.abs(d.vy) < 1) d.vy = 0;
      } else {
        d.x += d.vx;
        d.vx *= 0.95;
      }
      d.life--;
      d.bob += 0.1;

      // Magnet
      for (let pid in this.players) {
        const p = this.players[pid];
        const dist = Math.hypot(p.x - d.x, p.y - d.y);
        if (dist < 100) {
          d.x += (p.x - d.x) * 0.1;
          d.y += (p.y - d.y) * 0.1;
        }
        if (dist < 30) {
          this.giveItem(pid, d.itemId, 1);
          this.drops.splice(i, 1);
          break;
        }
      }
      if (d.life <= 0) this.drops.splice(i, 1);
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].life <= 0) this.particles.splice(i, 1);
    }
  }

  spawnParticles(x, y, color) {
    for (let i = 0; i < 5; i++) {
      this.particles.push(
        new Particle(
          x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2,
          color
        )
      );
    }
  }

  collide(e, axis) {
    const x1 = Math.floor(e.x / TILE_SIZE),
      x2 = Math.floor((e.x + 24) / TILE_SIZE);
    const y1 = Math.floor(e.y / TILE_SIZE),
      y2 = Math.floor((e.y + 54) / TILE_SIZE);
    for (let y = y1; y <= y2; y++)
      for (let x = x1; x <= x2; x++)
        if (this.isSolid(x, y)) {
          if (axis === "x") {
            e.x = e.vx > 0 ? x * TILE_SIZE - 24.1 : (x + 1) * TILE_SIZE + 0.1;
            e.vx = 0;
          } else {
            e.y = e.vy > 0 ? y * TILE_SIZE - 54.1 : (y + 1) * TILE_SIZE + 0.1;
            e.vy = 0;
            e.grounded = true;
          }
          return;
        }
    if (axis === "y") e.grounded = false;
  }

  isSolid(x, y) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return false;
    const b = BLOCKS[this.world[y * WORLD_WIDTH + x]];
    return b && b.solid;
  }

  processMining() {
    if (!this.mouse.left) {
      this.mining.active = false;
      return;
    }
    const mx = this.mouse.x + this.cam.x,
      my = this.mouse.y + this.cam.y;
    const bx = Math.floor(mx / TILE_SIZE),
      by = Math.floor(my / TILE_SIZE);

    if (this.mining.bx !== bx || this.mining.by !== by) {
      this.mining.bx = bx;
      this.mining.by = by;
      this.mining.active = true;
      this.mining.progress = 0;
    }

    const bid = this.world[by * WORLD_WIDTH + bx];
    if (!bid || BLOCKS[bid].unbreakable) return;

    const p = this.players[this.net.myId];
    const tool = ITEMS[p.inv[this.selSlot]?.id] || ITEMS[1];

    // Progress Logic
    this.mining.progress += tool.power || 1;

    if (this.mining.progress >= BLOCKS[bid].hardness) {
      this.spawnParticles(bx, by, BLOCKS[bid].color);
      this.net.send({ type: "MINE", x: bx, y: by });
      this.mining.progress = 0;
    }
  }

  tryPlace() {
    const mx = this.mouse.x + this.cam.x,
      my = this.mouse.y + this.cam.y;
    this.net.send({
      type: "PLACE",
      x: Math.floor(mx / TILE_SIZE),
      y: Math.floor(my / TILE_SIZE),
      slot: this.selSlot,
    });
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
      const inv = this.players[id].inv;
      inv[0] = { id: 2, count: 1 }; // Starter Pickaxe
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
        return;
      }
    for (let i = 0; i < 9; i++)
      if (p.inv[i].id === 0) {
        p.inv[i] = { id, count: n };
        return;
      }
  }

  onPacket(msg, sender) {
    if (msg.type === "INIT") {
      this.world = new Uint8Array(Object.values(msg.world));
      this.players = msg.players;
    } else if (msg.type === "SYNC") {
      this.players = msg.players;
      this.drops = msg.drops;
      this.updateUI();
    } else if (msg.type === "BLOCK") {
      this.world[msg.y * WORLD_WIDTH + msg.x] = msg.id;
    } else if (this.net.isHost) {
      if (msg.type === "INPUT") {
        const p = this.players[sender];
        if (p) {
          if (msg.keys.a) p.vx = -5;
          if (msg.keys.d) p.vx = 5;
          if (msg.keys.w && p.grounded) p.vy = -12;
        }
      }
      if (msg.type === "MINE") {
        const bid = this.world[msg.y * WORLD_WIDTH + msg.x];
        if (bid && !BLOCKS[bid].unbreakable) {
          this.world[msg.y * WORLD_WIDTH + msg.x] = 0;
          this.drops.push(
            new Drop(
              msg.x * TILE_SIZE + TILE_SIZE / 2,
              msg.y * TILE_SIZE + TILE_SIZE / 2,
              bid
            )
          );
          this.net.broadcast({ type: "BLOCK", x: msg.x, y: msg.y, id: 0 });
        }
      }
      if (msg.type === "PLACE") {
        const p = this.players[sender];
        const item = p.inv[msg.slot];
        if (item.id && item.count > 0 && !this.isSolid(msg.x, msg.y)) {
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

  sendInput() {
    if (this.net.isHost)
      this.onPacket({ type: "INPUT", keys: this.keys }, this.net.myId);
    else this.net.sendTo(this.net.hostId, { type: "INPUT", keys: this.keys });
  }

  render() {
    if (!this.players[this.net.myId]) return;
    const p = this.players[this.net.myId];
    this.cam.x = p.x - this.width / 2;
    this.cam.y = p.y - this.height / 2;

    // Sky with Gradient
    const g = this.ctx.createLinearGradient(0, 0, 0, this.height);
    g.addColorStop(0, "#4fc3f7");
    g.addColorStop(1, "#b3e5fc");
    this.ctx.fillStyle = g;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const sx = Math.floor(this.cam.x / TILE_SIZE),
      sy = Math.floor(this.cam.y / TILE_SIZE);
    const ex = sx + Math.floor(this.width / TILE_SIZE) + 2,
      ey = sy + Math.floor(this.height / TILE_SIZE) + 2;

    for (let y = sy; y < ey; y++)
      for (let x = sx; x < ex; x++) {
        if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) continue;
        const id = this.world[y * WORLD_WIDTH + x];
        if (id !== 0 && this.assets.blocks[id]) {
          const px = Math.floor(x * TILE_SIZE - this.cam.x),
            py = Math.floor(y * TILE_SIZE - this.cam.y);
          this.ctx.drawImage(this.assets.blocks[id], px, py);
          // Cracking Overlay
          if (
            this.mining.active &&
            this.mining.bx === x &&
            this.mining.by === y
          ) {
            const pct = this.mining.progress / BLOCKS[id].hardness;
            this.ctx.fillStyle = `rgba(0,0,0,${pct * 0.5})`;
            this.ctx.beginPath();
            this.ctx.moveTo(px + TILE_SIZE / 2, py);
            this.ctx.lineTo(px + TILE_SIZE / 2 + 10 * pct, py + TILE_SIZE);
            this.ctx.lineTo(px + TILE_SIZE / 2 - 10 * pct, py + TILE_SIZE);
            this.ctx.fill();
          }
        }
      }

    // Drops with Bobbing
    this.drops.forEach((d) => {
      const i = this.assets.blocks[d.itemId];
      if (i) {
        const bob = Math.sin(d.bob) * 5;
        this.ctx.drawImage(
          i,
          d.x - this.cam.x - 10,
          d.y - this.cam.y - 10 + bob,
          20,
          20
        );
      }
    });

    // Particles
    this.particles.forEach((pt) => pt.render(this.ctx, this.cam.x, this.cam.y));

    // Players
    for (let id in this.players) {
      const ply = this.players[id];
      const px = ply.x - this.cam.x,
        py = ply.y - this.cam.y;
      this.ctx.fillStyle = id === this.net.myId ? "#fff" : "#ccc";
      this.ctx.fillRect(px, py, 24, 54);
    }
    this.sendInput();
  }

  initInvUI() {
    const g = document.getElementById("inv-grid");
    g.innerHTML = "";
    for (let i = 0; i < 9; i++) {
      const d = document.createElement("div");
      d.className = "slot";
      d.onclick = () => {
        this.selSlot = i;
        this.updateUI();
      };
      g.appendChild(d);
    }
  }
  updateUI() {
    const p = this.players[this.net.myId];
    if (!p) return;
    document.getElementById("health-bar").style.width =
      (p.hp / p.maxHp) * 100 + "%";
    const ren = (el, it) => {
      el.innerHTML = "";
      if (it.id) {
        const i = this.assets.blocks[it.id] || this.assets.items[it.id];
        if (i) {
          const c = document.createElement("canvas");
          c.width = 32;
          c.height = 32;
          c.getContext("2d").drawImage(i, 0, 0);
          el.appendChild(c);
        }
        el.innerHTML += `<span class="count">${it.count}</span>`;
      }
    };
    const bar = document.getElementById("inventory-bar");
    bar.innerHTML = "";
    p.inv.forEach((it, i) => {
      const d = document.createElement("div");
      d.className = `slot ${i === this.selSlot ? "active" : ""}`;
      ren(d, it);
      bar.appendChild(d);
    });
    const grid = document.getElementById("inv-grid").children;
    p.inv.forEach((it, i) => ren(grid[i], it));
  }
  toggleInv() {
    const s = document.getElementById("inventory-screen");
    s.style.display = s.style.display === "none" ? "flex" : "none";
    this.updateUI();
  }
}
window.onload = () => new Game();
