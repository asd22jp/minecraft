/**
 * FullStackCraft v4 - Correct Tool Mining Logic
 */

const TILE_SIZE = 32;
const WORLD_WIDTH = 128;
const WORLD_HEIGHT = 96;
const GRAVITY = 0.5;

// --- DEFINITIONS ---
// reqTool: 破壊に必要なツール (none, pickaxe, shovel, axe)
// hardness: 破壊にかかる基本コスト
const BLOCKS = {
  0: { name: "Air", solid: false },
  1: {
    name: "Grass",
    color: "#5b8a36",
    solid: true,
    type: "grass",
    hardness: 80,
    reqTool: "shovel",
  },
  2: {
    name: "Dirt",
    color: "#704828",
    solid: true,
    type: "noise",
    hardness: 100,
    reqTool: "shovel",
  },
  3: {
    name: "Stone",
    color: "#666666",
    solid: true,
    type: "noise",
    hardness: 500,
    reqTool: "pickaxe",
  },
  4: {
    name: "Sand",
    color: "#dcc688",
    solid: true,
    type: "noise",
    hardness: 80,
    reqTool: "shovel",
  },
  5: {
    name: "Wood",
    color: "#5c3817",
    solid: true,
    type: "wood",
    hardness: 300,
    reqTool: "axe",
  },
  6: {
    name: "Leaves",
    color: "#3a7a28",
    solid: true,
    type: "leaves",
    hardness: 40,
    reqTool: "none",
  }, // Hand OK
  11: {
    name: "CoalOre",
    color: "#333",
    solid: true,
    type: "ore",
    oreColor: "#000",
    hardness: 600,
    reqTool: "pickaxe",
  },
  13: {
    name: "IronOre",
    color: "#aaa",
    solid: true,
    type: "ore",
    oreColor: "#dca47e",
    hardness: 800,
    reqTool: "pickaxe",
  },
  14: {
    name: "GoldOre",
    color: "#ddd",
    solid: true,
    type: "ore",
    oreColor: "#ffe84d",
    hardness: 800,
    reqTool: "pickaxe",
  },
  15: {
    name: "DiamondOre",
    color: "#777",
    solid: true,
    type: "ore",
    oreColor: "#00ffff",
    hardness: 1200,
    reqTool: "pickaxe",
  },
  21: {
    name: "Cobble",
    color: "#555",
    solid: true,
    type: "brick",
    hardness: 500,
    reqTool: "pickaxe",
  },
  26: {
    name: "Planks",
    color: "#a07040",
    solid: true,
    type: "plank",
    hardness: 300,
    reqTool: "axe",
  },
  31: {
    name: "CraftTable",
    color: "#852",
    solid: true,
    type: "table",
    hardness: 300,
    reqTool: "axe",
  },
  51: {
    name: "Bedrock",
    color: "#111",
    solid: true,
    unbreakable: true,
    hardness: Infinity,
    reqTool: "none",
  },
};

// toolType: アイテムの属性
// efficiency: 採掘速度倍率
const ITEMS = {
  0: { name: "Air", type: "none" }, // Empty Hand
  1: { name: "Hand", type: "none", efficiency: 1, damage: 1 },

  // Pickaxes
  2: {
    name: "WoodPick",
    type: "tool",
    toolType: "pickaxe",
    efficiency: 3,
    damage: 2,
    icon: "#855",
  },
  3: {
    name: "StonePick",
    type: "tool",
    toolType: "pickaxe",
    efficiency: 5,
    damage: 3,
    icon: "#777",
  },
  4: {
    name: "IronPick",
    type: "tool",
    toolType: "pickaxe",
    efficiency: 8,
    damage: 4,
    icon: "#aaa",
  },
  5: {
    name: "DiaPick",
    type: "tool",
    toolType: "pickaxe",
    efficiency: 15,
    damage: 5,
    icon: "#0ff",
  },

  // Axes
  6: {
    name: "WoodAxe",
    type: "tool",
    toolType: "axe",
    efficiency: 3,
    damage: 3,
    icon: "#855",
  },
  7: {
    name: "StoneAxe",
    type: "tool",
    toolType: "axe",
    efficiency: 5,
    damage: 4,
    icon: "#777",
  },

  // Shovels
  10: {
    name: "Shovel",
    type: "tool",
    toolType: "shovel",
    efficiency: 5,
    damage: 2,
    icon: "#ccc",
  },

  // Weapons
  11: {
    name: "WoodSword",
    type: "weapon",
    toolType: "sword",
    efficiency: 1,
    damage: 4,
    icon: "#855",
  },
  13: {
    name: "IronSword",
    type: "weapon",
    toolType: "sword",
    efficiency: 1,
    damage: 6,
    icon: "#aaa",
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
  }
}

// --- NETWORK ---
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

// --- GAME ---
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
    this.mouse = { x: 0, y: 0, left: false, right: false };
    this.cam = { x: 0, y: 0 };
    this.selSlot = 0;

    // Mining System
    this.mining = {
      active: false,
      bx: 0,
      by: 0,
      progress: 0,
      lastTime: 0,
    };

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
      if (e.button === 0) {
        this.mouse.left = true;
        this.startMining();
        this.tryAttack();
      } else if (e.button === 2) {
        this.mouse.right = true;
        this.tryPlace();
      }
    });
    window.addEventListener("mouseup", (e) => {
      if (e.button === 0) {
        this.mouse.left = false;
        this.mining.active = false;
        this.mining.progress = 0;
      } else {
        this.mouse.right = false;
      }
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

  // --- ASSETS ---
  genAssets() {
    // Blocks
    for (let id in BLOCKS) {
      const b = BLOCKS[id];
      const c = document.createElement("canvas");
      c.width = 32;
      c.height = 32;
      const ctx = c.getContext("2d");
      ctx.fillStyle = b.color || "#f0f";
      ctx.fillRect(0, 0, 32, 32);
      // Texture Logic
      if (b.type === "noise" || b.type === "ore") {
        for (let i = 0; i < 50; i++) {
          ctx.fillStyle =
            Math.random() > 0.5 ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)";
          ctx.fillRect(Math.random() * 32, Math.random() * 32, 2, 2);
        }
      }
      if (b.type === "brick" || b.type === "plank") {
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(0, 0, 32, 1);
        ctx.fillRect(0, 16, 32, 1);
        ctx.fillRect(16, 0, 1, 16);
        ctx.fillRect(8, 16, 1, 16);
      }
      if (b.type === "ore") {
        ctx.fillStyle = b.oreColor;
        ctx.fillRect(10, 10, 6, 6);
        ctx.fillRect(20, 12, 5, 5);
        ctx.fillRect(14, 22, 4, 4);
      }
      if (b.type === "wood") {
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(4, 0, 3, 32);
        ctx.fillRect(18, 0, 3, 32);
      }
      this.assets.blocks[id] = c;
    }

    // Items
    for (let id in ITEMS) {
      const item = ITEMS[id];
      const c = document.createElement("canvas");
      c.width = 32;
      c.height = 32;
      const ctx = c.getContext("2d");
      if (item.type === "tool" || item.type === "weapon") {
        // Draw Tool
        ctx.save();
        ctx.translate(16, 16);
        ctx.rotate(-Math.PI / 4);
        // Handle
        ctx.fillStyle = "#654";
        ctx.fillRect(-2, 0, 4, 14);
        // Head
        ctx.fillStyle = item.icon || "#fff";
        if (item.toolType === "pickaxe") {
          ctx.beginPath();
          ctx.arc(0, -2, 12, Math.PI, 0);
          ctx.lineTo(0, 4);
          ctx.fill();
        } else if (item.toolType === "axe") {
          ctx.fillRect(-6, -8, 12, 10);
        } else if (item.toolType === "shovel") {
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.toolType === "sword") {
          ctx.fillRect(-2, -14, 4, 16);
          ctx.fillRect(-6, 2, 12, 2);
        }
        ctx.restore();
      }
      this.assets.items[id] = c;
    }
  }

  // --- WORLD ---
  genWorld() {
    const noise = (x, f) => Math.sin(x * f);
    const hMap = [];
    for (let x = 0; x < WORLD_WIDTH; x++)
      hMap[x] = Math.floor(40 + noise(x, 0.08) * 12 + noise(x, 0.02) * 20);

    for (let y = 0; y < WORLD_HEIGHT; y++) {
      for (let x = 0; x < WORLD_WIDTH; x++) {
        const idx = y * WORLD_WIDTH + x;
        let id = 0;
        if (y >= WORLD_HEIGHT - 1) id = 51; // Bedrock
        else if (y > hMap[x]) {
          id = 3; // Stone
          if (y < hMap[x] + 4) id = 2; // Dirt

          if (id === 3 && Math.random() < 0.06) {
            const r = Math.random();
            if (r < 0.6) id = 11; // Coal
            else if (r < 0.9) id = 13; // Iron
            else if (r < 0.98) id = 14; // Gold
            else id = 15; // Diamond
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
    for (let i = 0; i < 4; i++) this.world[(y - i) * WORLD_WIDTH + x] = 5; // Wood
    for (let ly = y - 5; ly <= y - 3; ly++)
      for (let lx = x - 2; lx <= x + 2; lx++) {
        if (!this.world[ly * WORLD_WIDTH + lx])
          this.world[ly * WORLD_WIDTH + lx] = 6; // Leaves
      }
  }

  // --- GAME LOOP ---
  loop() {
    const now = Date.now();
    const dt = now - (this.lastFrame || now);
    this.lastFrame = now;

    if (this.net.isHost) {
      this.updatePhys();
      this.updateDrops();
      this.net.broadcast({
        type: "SYNC",
        players: this.players,
        drops: this.drops,
      });
    } else {
      // Client side mining logic
      this.processMining(dt);
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
      if (p.y > WORLD_HEIGHT * 32) {
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
      const bx = Math.floor(d.x / 32),
        by = Math.floor((d.y + 16) / 32);
      if (this.isSolid(bx, by)) {
        d.y = by * 32 - 16;
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

  // --- INTERACTION ---
  startMining() {
    if (!this.players[this.net.myId]) return;
    const mx = this.mouse.x + this.cam.x;
    const my = this.mouse.y + this.cam.y;
    this.mining.bx = Math.floor(mx / 32);
    this.mining.by = Math.floor(my / 32);
    this.mining.active = true;
    this.mining.lastTime = Date.now();
    this.mining.progress = 0;
  }

  processMining(dt) {
    if (!this.mining.active || !this.mouse.left) return;

    const p = this.players[this.net.myId];
    // Mouse moved too far check? No, just check if pointing at same block
    const mx = this.mouse.x + this.cam.x;
    const my = this.mouse.y + this.cam.y;
    const curBx = Math.floor(mx / 32);
    const curBy = Math.floor(my / 32);

    if (curBx !== this.mining.bx || curBy !== this.mining.by) {
      this.mining.active = false;
      this.mining.progress = 0;
      return;
    }

    const bid = this.world[this.mining.by * WORLD_WIDTH + this.mining.bx];
    if (bid === 0) {
      this.mining.active = false;
      return;
    }

    const block = BLOCKS[bid];
    const heldItem = p.inv[this.selSlot] || { id: 0 };
    const tool = ITEMS[heldItem.id] || ITEMS[0]; // 0 is Hand

    // Tool Check
    let speed = 1;
    if (block.reqTool === "none") {
      speed = 1; // Hand is fine
    } else {
      if (tool.toolType === block.reqTool) {
        speed = tool.efficiency || 1;
      } else {
        speed = 0.1; // Wrong tool = VERY slow
      }
    }

    if (block.unbreakable) speed = 0;

    this.mining.progress += (dt || 16) * speed;

    if (this.mining.progress >= block.hardness) {
      this.net.send({ type: "MINE", x: this.mining.bx, y: this.mining.by });
      this.mining.progress = 0; // Reset
      // Don't disable active, allow chain mining
    }
  }

  tryPlace() {
    const mx = this.mouse.x + this.cam.x;
    const my = this.mouse.y + this.cam.y;
    const bx = Math.floor(mx / 32);
    const by = Math.floor(my / 32);
    this.net.send({ type: "PLACE", x: bx, y: by, slot: this.selSlot });
  }

  tryAttack() {
    const p = this.players[this.net.myId];
    const mx = this.mouse.x + this.cam.x;
    const my = this.mouse.y + this.cam.y;

    for (let tid in this.players) {
      if (tid === this.net.myId) continue;
      const t = this.players[tid];
      if (Math.abs(t.x + 12 - mx) < 20 && Math.abs(t.y + 27 - my) < 30) {
        this.net.send({ type: "ATTACK", targetId: tid });
        // Visual effect
        t.flash = 10;
        return;
      }
    }
  }

  // --- PACKETS ---
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
      // Starter Kit
      const inv = this.players[id].inv;
      inv[0] = { id: 2, count: 1 }; // Wood Pick
      inv[1] = { id: 10, count: 1 }; // Shovel
      inv[2] = { id: 6, count: 1 }; // Axe
      this.updateUI();
    }
  }

  giveItem(pid, id, n) {
    const p = this.players[pid];
    if (!p) return;
    // Stack
    for (let i = 0; i < 9; i++)
      if (p.inv[i].id === id) {
        p.inv[i].count += n;
        return;
      }
    // Empty
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
          if (msg.keys.a) p.vx = -4;
          if (msg.keys.d) p.vx = 4;
          if (msg.keys.w && p.grounded) p.vy = -9;
        }
      }
      if (msg.type === "MINE") {
        // Host validates mining? For now trust client but check tool
        const b = BLOCKS[this.world[msg.y * WORLD_WIDTH + msg.x]];
        if (b && !b.unbreakable) {
          this.world[msg.y * WORLD_WIDTH + msg.x] = 0;

          // Logic: Drop only if correct tool? Or always drop but slow?
          // Let's drop always if destroyed (since client waited the long time)
          let dropId = this.getDropId(b);
          this.drops.push(new Drop(msg.x * 32 + 16, msg.y * 32 + 16, dropId));
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
      if (msg.type === "ATTACK") {
        const p = this.players[sender];
        const t = this.players[msg.targetId];
        if (p && t) {
          const tool = ITEMS[p.inv[p.selSlot]?.id] || ITEMS[1];
          t.hp -= tool.damage || 1;
          t.vx = t.x - p.x > 0 ? 8 : -8;
          t.vy = -4;
          if (t.hp <= 0) {
            t.hp = 20;
            t.x = 64 * 32;
            t.y = 10 * 32;
          }
        }
      }
    }
  }

  getDropId(b) {
    if (b.name === "Stone") return 21; // Cobble
    if (b.name === "CoalOre") return 11;
    if (b.name === "IronOre") return 13;
    if (b.name === "GoldOre") return 14;
    if (b.name === "DiamondOre") return 15;
    if (b.name === "Grass") return 2; // Dirt
    // Find ID by name
    const id = Object.keys(BLOCKS).find((k) => BLOCKS[k] === b);
    return parseInt(id);
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

    // Cam
    this.cam.x += (p.x - this.width / 2 - this.cam.x) * 0.1;
    this.cam.y += (p.y - this.height / 2 - this.cam.y) * 0.1;

    // Sky
    const grd = this.ctx.createLinearGradient(0, 0, 0, this.height);
    grd.addColorStop(0, "#87CEEB");
    grd.addColorStop(1, "#E0F7FA");
    this.ctx.fillStyle = grd;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Blocks
    const sx = Math.floor(this.cam.x / 32),
      sy = Math.floor(this.cam.y / 32);
    const ex = sx + Math.floor(this.width / 32) + 2,
      ey = sy + Math.floor(this.height / 32) + 2;

    for (let y = sy; y < ey; y++) {
      for (let x = sx; x < ex; x++) {
        if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) continue;
        const id = this.world[y * WORLD_WIDTH + x];
        if (id !== 0 && this.assets.blocks[id]) {
          this.ctx.drawImage(
            this.assets.blocks[id],
            Math.floor(x * 32 - this.cam.x),
            Math.floor(y * 32 - this.cam.y)
          );
        }

        // Mining Overlay
        if (
          this.mining.active &&
          this.mining.bx === x &&
          this.mining.by === y
        ) {
          const b = BLOCKS[id];
          if (b) {
            const pct = Math.min(1, this.mining.progress / b.hardness);
            this.ctx.fillStyle = "rgba(0,0,0,0.4)";
            this.ctx.fillRect(
              x * 32 - this.cam.x + 8,
              y * 32 - this.cam.y + 12,
              16,
              4
            );
            this.ctx.fillStyle = "#0f0";
            this.ctx.fillRect(
              x * 32 - this.cam.x + 8,
              y * 32 - this.cam.y + 12,
              16 * pct,
              4
            );
          }
        }
      }
    }

    // Drops
    this.drops.forEach((d) => {
      const img = this.assets.items[d.itemId] || this.assets.blocks[d.itemId];
      if (img)
        this.ctx.drawImage(img, d.x - this.cam.x, d.y - this.cam.y, 16, 16);
    });

    // Players
    for (let id in this.players) {
      const ply = this.players[id];
      const px = ply.x - this.cam.x,
        py = ply.y - this.cam.y;

      if (ply.flash) {
        this.ctx.globalAlpha = 0.5;
        ply.flash--;
      }
      this.ctx.fillStyle = id === this.net.myId ? "#fff" : "#ccc";
      this.ctx.fillRect(px, py, 24, 54);
      this.ctx.globalAlpha = 1.0;

      // Hand Item
      const iid = ply.inv[ply.selSlot || 0]?.id;
      if (iid && (this.assets.items[iid] || this.assets.blocks[iid])) {
        this.ctx.save();
        this.ctx.translate(px + 24, py + 30);
        if (this.mining.active && id === this.net.myId)
          this.ctx.rotate(Math.sin(Date.now() / 50));
        this.ctx.drawImage(
          this.assets.items[iid] || this.assets.blocks[iid],
          -10,
          -10,
          20,
          20
        );
        this.ctx.restore();
      }
    }

    this.sendInput();
    document.getElementById("debug-info").innerText = `FPS: 60 | HP: ${p.hp}`;
  }

  // --- UI ---
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

    const drawSlot = (el, item) => {
      el.innerHTML = "";
      if (item.id !== 0) {
        const img = this.assets.items[item.id] || this.assets.blocks[item.id];
        if (img) {
          const c = document.createElement("canvas");
          c.width = 32;
          c.height = 32;
          c.getContext("2d").drawImage(img, 0, 0);
          el.appendChild(c);
        }
        el.innerHTML += `<span class="count">${item.count}</span>`;
      }
    };

    const bar = document.getElementById("inventory-bar");
    bar.innerHTML = "";
    p.inv.forEach((it, i) => {
      const d = document.createElement("div");
      d.className = `slot ${i === this.selSlot ? "active" : ""}`;
      drawSlot(d, it);
      bar.appendChild(d);
    });
    const grid = document.getElementById("inv-grid").children;
    p.inv.forEach((it, i) => drawSlot(grid[i], it));
  }
  toggleInv() {
    const s = document.getElementById("inventory-screen");
    s.style.display = s.style.display === "none" ? "flex" : "none";
    this.updateUI();
  }
}

window.onload = () => new Game();
