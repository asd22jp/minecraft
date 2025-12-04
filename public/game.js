/**
 * FullStackCraft v3 - Mining Mechanics & Combat
 */

// --- CONFIG & CONSTANTS ---
const TILE_SIZE = 32;
const WORLD_WIDTH = 128;
const WORLD_HEIGHT = 96;
const GRAVITY = 0.5;

// hardness: 破壊にかかる基本時間(ms)
const BLOCKS = {
  0: { name: "Air", solid: false },
  1: {
    name: "Grass",
    color: "#5b8a36",
    solid: true,
    type: "grass",
    hardness: 600,
  },
  2: {
    name: "Dirt",
    color: "#704828",
    solid: true,
    type: "noise",
    hardness: 500,
  },
  3: {
    name: "Stone",
    color: "#666666",
    solid: true,
    type: "noise",
    hardness: 2000,
  },
  4: {
    name: "Sand",
    color: "#dcc688",
    solid: true,
    type: "noise",
    hardness: 400,
  },
  5: {
    name: "Wood",
    color: "#5c3817",
    solid: true,
    type: "wood",
    hardness: 1500,
  },
  6: {
    name: "Leaves",
    color: "#3a7a28",
    solid: true,
    type: "leaves",
    hardness: 200,
  },
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
    hardness: 2500,
  },
  13: {
    name: "IronOre",
    color: "#aaa",
    solid: true,
    type: "ore",
    oreColor: "#dca47e",
    hardness: 3000,
  },
  14: {
    name: "GoldOre",
    color: "#ddd",
    solid: true,
    type: "ore",
    oreColor: "#ffe84d",
    hardness: 3000,
  },
  15: {
    name: "DiamondOre",
    color: "#777",
    solid: true,
    type: "ore",
    oreColor: "#00ffff",
    hardness: 4000,
  },
  21: {
    name: "Cobble",
    color: "#555",
    solid: true,
    type: "brick",
    hardness: 2000,
  },
  26: {
    name: "Planks",
    color: "#a07040",
    solid: true,
    type: "plank",
    hardness: 1500,
  },
  41: {
    name: "Flower",
    color: "#f0f",
    solid: false,
    type: "cross",
    flowerColor: "#ffcc00",
    hardness: 50,
  },
  51: {
    name: "Bedrock",
    color: "#111",
    solid: true,
    unbreakable: true,
    type: "noise",
    hardness: Infinity,
  },
};

// efficiency: 採掘速度倍率, damage: 攻撃力
const ITEMS = {
  1: { name: "Hand", type: "tool", efficiency: 1.0, damage: 1 },
  2: {
    name: "WoodPick",
    type: "tool",
    efficiency: 2.0,
    damage: 2,
    icon: "#855",
  },
  3: {
    name: "StonePick",
    type: "tool",
    efficiency: 4.0,
    damage: 3,
    icon: "#777",
  },
  4: {
    name: "IronPick",
    type: "tool",
    efficiency: 6.0,
    damage: 4,
    icon: "#aaa",
  },
  5: {
    name: "DiaPick",
    type: "tool",
    efficiency: 10.0,
    damage: 5,
    icon: "#0ff",
  },
  11: {
    name: "WoodSword",
    type: "weapon",
    efficiency: 1.0,
    damage: 4,
    icon: "#855",
  },
  12: {
    name: "StoneSword",
    type: "weapon",
    efficiency: 1.0,
    damage: 5,
    icon: "#777",
  },
  13: {
    name: "IronSword",
    type: "weapon",
    efficiency: 1.0,
    damage: 6,
    icon: "#aaa",
  },
  14: {
    name: "DiaSword",
    type: "weapon",
    efficiency: 1.0,
    damage: 8,
    icon: "#0ff",
  },
};

class Drop {
  constructor(x, y, itemId) {
    this.id = Math.random().toString(36);
    this.x = x;
    this.y = y;
    this.itemId = itemId;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = -3;
    this.life = 6000;
    this.bobOffset = Math.random() * 10;
  }
}

// --- NETWORK (WebRTC) ---
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
      } else if (d.signal.type === "answer")
        await pc.setRemoteDescription(d.signal);
      else if (d.signal.candidate) await pc.addIceCandidate(d.signal.candidate);
    });
    this.socket.on("host-migrated", (d) => {
      this.hostId = d.newHostId;
      if (this.hostId === this.myId) {
        this.isHost = true;
        this.game.loop();
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
    if (this.channels[id]?.readyState === "open")
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

    // Mining State
    this.mining = { active: false, x: 0, y: 0, progress: 0, lastTick: 0 };

    this.blockCache = {};
    this.prerenderBlocks();
    this.prerenderItems();

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
    window.addEventListener("mousedown", () => {
      this.mouse.left = true;
      this.handleMouse(true);
    });
    window.addEventListener("mouseup", () => {
      this.mouse.left = false;
      this.mining.active = false;
    });

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

  // --- ASSETS ---
  prerenderBlocks() {
    for (let id in BLOCKS) {
      const b = BLOCKS[id];
      const c = document.createElement("canvas");
      c.width = TILE_SIZE;
      c.height = TILE_SIZE;
      const ctx = c.getContext("2d");
      ctx.fillStyle = b.color || "#f0f";
      ctx.fillRect(0, 0, 32, 32);
      if (b.type === "noise" || b.type === "ore") {
        for (let i = 0; i < 40; i++) {
          ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.2})`;
          ctx.fillRect(Math.random() * 32, Math.random() * 32, 2, 2);
        }
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
      if (b.type === "ore") {
        ctx.fillStyle = b.oreColor;
        ctx.fillRect(8, 8, 6, 6);
        ctx.fillRect(20, 10, 4, 4);
      }
      if (b.type === "brick" || b.type === "plank") {
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(0, 0, 32, 1);
        ctx.fillRect(0, 15, 32, 1);
        ctx.fillRect(15, 1, 1, 14);
      }
      this.blockCache[id] = c;
    }
  }

  prerenderItems() {
    // Generate tool icons
    this.itemCache = {};
    for (let id in ITEMS) {
      const item = ITEMS[id];
      const c = document.createElement("canvas");
      c.width = 32;
      c.height = 32;
      const ctx = c.getContext("2d");
      if (item.type === "tool" || item.type === "weapon") {
        ctx.translate(16, 16);
        ctx.rotate(-Math.PI / 4);
        ctx.translate(-16, -16);
        ctx.fillStyle = "#654";
        ctx.fillRect(14, 14, 4, 14); // Handle
        ctx.fillStyle = item.icon || "#fff";
        if (item.name.includes("Pick")) {
          ctx.fillRect(8, 6, 16, 4);
          ctx.fillRect(14, 6, 4, 8);
        }
        if (item.name.includes("Sword")) {
          ctx.fillRect(14, 2, 4, 20);
          ctx.fillRect(10, 20, 12, 2);
        }
      }
      this.itemCache[id] = c;
    }
  }

  // --- WORLD GEN ---
  genWorld() {
    const noise = (x, f) => Math.sin(x * f);
    const hMap = [];
    for (let x = 0; x < WORLD_WIDTH; x++)
      hMap[x] = Math.floor(40 + noise(x, 0.1) * 10 + noise(x, 0.05) * 20);

    for (let y = 0; y < WORLD_HEIGHT; y++) {
      for (let x = 0; x < WORLD_WIDTH; x++) {
        const idx = y * WORLD_WIDTH + x;
        let id = 0;
        if (y >= WORLD_HEIGHT - 2) id = 51;
        else if (y > hMap[x]) {
          id = 3; // Stone
          if (y < hMap[x] + 4) id = 2; // Dirt
          if (id === 3) {
            const r = Math.random();
            if (r < 0.05) id = 11;
            else if (r < 0.02 && y > 60) id = 13;
            else if (r < 0.005 && y > 80) id = 15;
          }
        } else if (y === hMap[x]) {
          id = 1; // Grass
          if (x > 5 && x < WORLD_WIDTH - 5 && Math.random() < 0.08)
            this.genTree(x, y - 1);
        }
        if (this.world[idx] === 0 && id !== 0) this.world[idx] = id;
      }
    }
    this.spawnPlayer(this.net.myId, 64 * 32, 20 * 32);
  }

  genTree(x, y) {
    const h = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < h; i++) this.world[(y - i) * WORLD_WIDTH + x] = 5;
    for (let ly = y - h - 2; ly <= y - h + 1; ly++)
      for (let lx = x - 2; lx <= x + 2; lx++)
        if (
          !this.world[ly * WORLD_WIDTH + lx] &&
          Math.abs(lx - x) + Math.abs(ly - (y - h)) < 3
        )
          this.world[ly * WORLD_WIDTH + lx] = 6;
  }

  // --- LOGIC ---
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
        p.x = 64 * 32;
        p.y = 20 * 32;
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
        d.vy = 0;
      }
      d.life--;
      for (let pid in this.players) {
        const p = this.players[pid];
        if (Math.hypot(p.x - d.x, p.y - d.y) < 30) {
          this.giveItem(pid, d.itemId, 1);
          this.drops.splice(i, 1);
          break;
        }
      }
      if (d.life <= 0) this.drops.splice(i, 1);
    }
  }

  collide(e, axis) {
    const x1 = Math.floor(e.x / 32),
      x2 = Math.floor((e.x + 24) / 32);
    const y1 = Math.floor(e.y / 32),
      y2 = Math.floor((e.y + 54) / 32);
    for (let y = y1; y <= y2; y++)
      for (let x = x1; x <= x2; x++)
        if (this.isSolid(x, y)) {
          if (axis === "x") {
            e.x = e.vx > 0 ? x * 32 - 24.1 : (x + 1) * 32 + 0.1;
            e.vx = 0;
          } else {
            e.y = e.vy > 0 ? y * 32 - 54.1 : (y + 1) * 32 + 0.1;
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
      this.players[id].inv[0] = { id: 2, count: 1 }; // Wood Pickaxe
      this.players[id].inv[1] = { id: 11, count: 1 }; // Sword
      this.updateUI();
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

  // --- INPUT & ACTION ---
  handleMouse(down) {
    const p = this.players[this.net.myId];
    if (!p) return;
    const mx = this.mouse.x + this.cam.x,
      my = this.mouse.y + this.cam.y;

    // Check for Entity Attack
    let hit = false;
    if (down) {
      for (let tid in this.players) {
        if (tid === this.net.myId) continue;
        const t = this.players[tid];
        if (Math.abs(t.x - mx) < 30 && Math.abs(t.y - my) < 40) {
          this.net.send({ type: "ATTACK", targetId: tid });
          hit = true;
          // Local visual feedback could go here
        }
      }
    }
    if (hit) return;

    // Mining / Place
    const bx = Math.floor(mx / TILE_SIZE),
      by = Math.floor(my / TILE_SIZE);
    const blockId = this.world[by * WORLD_WIDTH + bx];

    if (this.keys["shift"]) {
      // Place
      if (down && !this.isSolid(bx, by)) {
        this.net.send({ type: "PLACE", x: bx, y: by, slot: this.selSlot });
      }
    } else {
      // Mine Start
      if (down && blockId !== 0) {
        this.mining.active = true;
        this.mining.x = bx;
        this.mining.y = by;
        this.mining.progress = 0;
        this.mining.lastTick = Date.now();
      }
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
          if (msg.keys.a) p.vx = -4;
          if (msg.keys.d) p.vx = 4;
          if (msg.keys.w && p.grounded) p.vy = -9;
        }
      }
      if (msg.type === "ATTACK") {
        const src = this.players[sender];
        const dst = this.players[msg.targetId];
        if (src && dst) {
          const item = ITEMS[src.inv[src.selectedSlot || 0]?.id] || ITEMS[1];
          const dmg = item.damage || 1;
          dst.hp -= dmg;
          dst.vx = dst.x - src.x > 0 ? 8 : -8; // Knockback
          dst.vy = -5;
          if (dst.hp <= 0) {
            dst.x = 64 * 32;
            dst.y = 10 * 32;
            dst.hp = dst.maxHp;
          }
        }
      }
      if (msg.type === "MINE") {
        // Server-side validation can be added here
        const b = BLOCKS[this.world[msg.y * WORLD_WIDTH + msg.x]];
        if (b && !b.unbreakable) {
          this.world[msg.y * WORLD_WIDTH + msg.x] = 0;
          this.drops.push(
            new Drop(msg.x * 32 + 16, msg.y * 32 + 16, this.getBlockItemId(b))
          );
          this.net.broadcast({ type: "BLOCK", x: msg.x, y: msg.y, id: 0 });
        }
      }
      if (msg.type === "PLACE") {
        const p = this.players[sender];
        const item = p.inv[msg.slot];
        if (
          item &&
          item.id > 0 &&
          item.count > 0 &&
          !this.isSolid(msg.x, msg.y)
        ) {
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

  getBlockItemId(b) {
    // Simple mapping, can be expanded
    if (b.name === "Stone") return 21; // Cobble
    if (b.name === "CoalOre") return 11; // Item IDs need to match
    return parseInt(Object.keys(BLOCKS).find((k) => BLOCKS[k] === b));
  }

  sendInput() {
    if (this.net.isHost)
      this.onPacket({ type: "INPUT", keys: this.keys }, this.net.myId);
    else this.net.sendTo(this.net.hostId, { type: "INPUT", keys: this.keys });
  }

  // --- RENDER ---
  render() {
    if (!this.players[this.net.myId]) return;
    const p = this.players[this.net.myId];

    // Mining Logic (Client Side)
    if (this.mining.active) {
      const bx = Math.floor((this.mouse.x + this.cam.x) / 32);
      const by = Math.floor((this.mouse.y + this.cam.y) / 32);
      if (bx !== this.mining.x || by !== this.mining.y || !this.mouse.left) {
        this.mining.active = false;
      } else {
        const bid = this.world[by * WORLD_WIDTH + bx];
        const block = BLOCKS[bid];
        if (block && block.id !== 0) {
          const now = Date.now();
          const dt = now - this.mining.lastTick;
          this.mining.lastTick = now;

          const toolId = p.inv[this.selSlot].id;
          const tool = ITEMS[toolId] || ITEMS[1];
          const speed = tool.efficiency || 1;

          // Progress Calculation
          this.mining.progress += dt * speed;

          if (this.mining.progress >= block.hardness) {
            this.net.send({ type: "MINE", x: bx, y: by });
            this.mining.active = false;
          }
        }
      }
    }

    // Camera
    this.cam.x += (p.x - this.width / 2 - this.cam.x) * 0.1;
    this.cam.y += (p.y - this.height / 2 - this.cam.y) * 0.1;

    // Sky
    const g = this.ctx.createLinearGradient(0, 0, 0, this.height);
    g.addColorStop(0, "#4facfe");
    g.addColorStop(1, "#00f2fe");
    this.ctx.fillStyle = g;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Blocks
    const scx = Math.floor(this.cam.x / 32),
      scy = Math.floor(this.cam.y / 32);
    const ecx = scx + Math.floor(this.width / 32) + 2,
      ecy = scy + Math.floor(this.height / 32) + 2;

    for (let y = scy; y < ecy; y++) {
      for (let x = scx; x < ecx; x++) {
        if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) continue;
        const id = this.world[y * WORLD_WIDTH + x];
        if (id !== 0 && this.blockCache[id])
          this.ctx.drawImage(
            this.blockCache[id],
            Math.floor(x * 32 - this.cam.x),
            Math.floor(y * 32 - this.cam.y)
          );

        // Mining Cracks
        if (this.mining.active && this.mining.x === x && this.mining.y === y) {
          const b = BLOCKS[id];
          const pct = this.mining.progress / b.hardness;
          this.ctx.fillStyle = `rgba(0,0,0,${pct * 0.8})`;
          this.ctx.fillRect(
            x * 32 - this.cam.x + 10,
            y * 32 - this.cam.y + 10,
            12,
            12
          ); // Simple crack
        }
      }
    }

    // Drops
    this.drops.forEach((d) => {
      const item = ITEMS[d.itemId] || BLOCKS[d.itemId];
      // Draw item icon or block texture
      if (item) {
        if (item.type === "tool") {
          if (this.itemCache[d.itemId])
            this.ctx.drawImage(
              this.itemCache[d.itemId],
              d.x - this.cam.x,
              d.y - this.cam.y
            );
        } else if (this.blockCache[d.itemId]) {
          this.ctx.drawImage(
            this.blockCache[d.itemId],
            d.x - this.cam.x,
            d.y - this.cam.y,
            16,
            16
          );
        }
      }
    });

    // Players
    for (let id in this.players) {
      const ply = this.players[id];
      const px = ply.x - this.cam.x,
        py = ply.y - this.cam.y;
      this.ctx.fillStyle = id === this.net.myId ? "#fff" : "#ccc";
      this.ctx.fillRect(px, py, 24, 54);
      // Tool in hand
      const handId = ply.inv[ply.selectedSlot || 0]?.id;
      if (handId && this.itemCache[handId]) {
        this.ctx.save();
        this.ctx.translate(px + 20, py + 30);
        if (this.mining.active && id === this.net.myId)
          this.ctx.rotate(Math.sin(Date.now() / 50) * 1); // Swing
        this.ctx.drawImage(this.itemCache[handId], -16, -16);
        this.ctx.restore();
      }
    }

    this.sendInput();
    document.getElementById("debug-info").innerText = `FPS: 60 | HP: ${p.hp}`;
  }

  // --- UI ---
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
    document.getElementById("health-bar").style.width =
      (p.hp / p.maxHp) * 100 + "%";

    const renderSlot = (slot, item) => {
      slot.innerHTML = "";
      if (item.id !== 0) {
        let cvs;
        if (ITEMS[item.id] && this.itemCache[item.id]) {
          cvs = document.createElement("canvas");
          cvs.width = 32;
          cvs.height = 32;
          cvs.getContext("2d").drawImage(this.itemCache[item.id], 0, 0);
        } else if (BLOCKS[item.id] && this.blockCache[item.id]) {
          cvs = document.createElement("canvas");
          cvs.width = 32;
          cvs.height = 32;
          cvs.getContext("2d").drawImage(this.blockCache[item.id], 0, 0);
        }
        if (cvs) slot.appendChild(cvs);
        slot.innerHTML += `<span class="count">${item.count}</span>`;
      }
    };

    const bar = document.getElementById("inventory-bar");
    bar.innerHTML = "";
    p.inv.forEach((item, i) => {
      const d = document.createElement("div");
      d.className = `slot ${i === this.selSlot ? "active" : ""}`;
      renderSlot(d, item);
      bar.appendChild(d);
    });

    const grid = document.getElementById("inv-grid").children;
    p.inv.forEach((item, i) => renderSlot(grid[i], item));
  }
  toggleInv() {
    const ui = document.getElementById("inventory-screen");
    ui.style.display = ui.style.display === "none" ? "flex" : "none";
    this.updateUI();
  }
}

window.onload = () => new Game();
