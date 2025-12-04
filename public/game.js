/**
 * FullStackCraft v13 - Rendering Fix
 */

const TILE_SIZE = 48;
const CHUNK_SIZE = 16;
const GRAVITY = 0.5;

// --- DEFINITIONS ---
const BLOCKS = {
  0: { name: "Air", solid: false },
  1: { name: "Grass", color: "#5b8a36", solid: true, hardness: 100, drop: 2 },
  2: { name: "Dirt", color: "#704828", solid: true, hardness: 100, drop: 2 },
  3: {
    name: "Stone",
    color: "#757575",
    solid: true,
    hardness: 400,
    reqTool: "pickaxe",
    drop: 21,
  },
  4: {
    name: "Log",
    color: "#5d4037",
    solid: true,
    hardness: 200,
    reqTool: "axe",
    drop: 4,
  },
  5: { name: "Leaves", color: "#388e3c", solid: true, hardness: 15, drop: 200 },
  6: {
    name: "Planks",
    color: "#8d6e63",
    solid: true,
    hardness: 150,
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
  11: {
    name: "CoalOre",
    color: "#222",
    solid: true,
    hardness: 500,
    type: "ore",
    oreColor: "#111",
    drop: 201,
  },
  12: {
    name: "IronOre",
    color: "#aaa",
    solid: true,
    hardness: 600,
    type: "ore",
    oreColor: "#dcb",
    drop: 202,
  },
  13: {
    name: "GoldOre",
    color: "#dd0",
    solid: true,
    hardness: 700,
    type: "ore",
    oreColor: "#fe0",
    drop: 203,
  },
  14: {
    name: "DiamondOre",
    color: "#0ee",
    solid: true,
    hardness: 900,
    type: "ore",
    oreColor: "#0ff",
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
  31: {
    name: "CraftTable",
    color: "#a1887f",
    solid: true,
    hardness: 200,
    type: "table",
    reqTool: "axe",
    drop: 31,
  },
};

const ITEMS = {
  0: { name: "Air" },
  1: { name: "Hand", power: 1.0 },
  100: {
    name: "WoodPick",
    power: 5.0,
    type: "tool",
    toolType: "pickaxe",
    iconColor: "#8d6e63",
  },
  101: {
    name: "StonePick",
    power: 10.0,
    type: "tool",
    toolType: "pickaxe",
    iconColor: "#757575",
  },
  110: {
    name: "WoodAxe",
    power: 5.0,
    type: "tool",
    toolType: "axe",
    iconColor: "#8d6e63",
  },
  120: {
    name: "WoodShovel",
    power: 5.0,
    type: "tool",
    toolType: "shovel",
    iconColor: "#8d6e63",
  },
  130: {
    name: "WoodSword",
    power: 5.0,
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
  { in: [4], out: { id: 6, count: 4 }, shapeless: true },
  { in: [6, 6], out: { id: 200, count: 4 }, shapeless: true },
  { pattern: [6, 6, 0, 6, 6, 0, 0, 0, 0], out: { id: 31, count: 1 } },
  { pattern: [6, 6, 6, 0, 200, 0, 0, 200, 0], out: { id: 100, count: 1 } },
  { pattern: [21, 21, 21, 0, 200, 0, 0, 200, 0], out: { id: 101, count: 1 } },
  { pattern: [6, 6, 0, 6, 200, 0, 0, 200, 0], out: { id: 110, count: 1 } },
];

class Drop {
  constructor(x, y, itemId) {
    this.id = Math.random().toString(36);
    this.x = x;
    this.y = y;
    this.itemId = itemId;
    this.vx = (Math.random() - 0.5) * 5;
    this.vy = -4;
    this.life = 6000;
  }
}

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

class Game {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.fitScreen();

    this.chunks = {};
    this.players = {};
    this.drops = [];
    this.net = new Network(this);

    this.keys = {};
    this.mouse = { x: 0, y: 0, left: false, right: false };
    this.cam = { x: 0, y: 0 };
    this.selSlot = 0;
    this.mining = { active: false, bx: 0, by: 0, progress: 0 };

    this.craftGrid = Array(9).fill({ id: 0, count: 0 });
    this.craftResult = { id: 0, count: 0 };
    this.selectedInvSlot = -1;

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
    this.spawnPlayer(this.net.myId, 0, -200);
    this.loop();
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
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      for (let i = 0; i < 20; i++)
        ctx.fillRect(Math.random() * 32, Math.random() * 32, 2, 2);
      if (b.type === "table") {
        ctx.fillStyle = "#d7ccc8";
        ctx.fillRect(4, 0, 24, 4);
        ctx.fillRect(4, 4, 4, 28);
        ctx.fillRect(24, 4, 4, 28);
      }
      if (b.type === "column") {
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(6, 0, 6, 32);
        ctx.fillRect(20, 0, 6, 32);
      }
      if (b.type === "ore") {
        ctx.fillStyle = b.oreColor;
        ctx.fillRect(10, 10, 10, 10);
      }
      if (b.type === "brick") {
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, 32, 32);
      }
      this.assets.blocks[id] = c;
    }
    for (let id in ITEMS) {
      if (id == 0) continue;
      const it = ITEMS[id];
      const c = document.createElement("canvas");
      c.width = 32;
      c.height = 32;
      const ctx = c.getContext("2d");
      ctx.fillStyle = it.iconColor || "#fff";
      if (it.type === "tool" || it.type === "weapon") {
        ctx.translate(16, 16);
        ctx.rotate(-Math.PI / 4);
        ctx.fillStyle = "#5d4037";
        ctx.fillRect(-2, 0, 4, 14);
        ctx.fillStyle = it.iconColor;
        if (it.toolType === "pickaxe") {
          ctx.beginPath();
          ctx.arc(0, -2, 10, Math.PI, 0);
          ctx.lineTo(0, 4);
          ctx.fill();
        }
        if (it.toolType === "axe") {
          ctx.fillRect(-6, -8, 12, 10);
        }
        if (it.toolType === "shovel") {
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        if (it.toolType === "sword") {
          ctx.fillRect(-2, -14, 4, 16);
          ctx.fillRect(-6, 2, 12, 2);
        }
      } else {
        if (id == 200) {
          ctx.rotate(-Math.PI / 4);
          ctx.fillStyle = "#5d4037";
          ctx.fillRect(10, 14, 4, 16);
        } else ctx.fillRect(8, 8, 16, 16);
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
      const chunk = this.genChunkData(cx, cy);
      this.chunks[key] = chunk;
      this.net.broadcast({
        type: "CHUNK_DATA",
        chunks: { [key]: Array.from(chunk) },
      });
      return chunk;
    }
    return null;
  }
  genChunkData(cx, cy) {
    const data = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE);
    const noise = (x) => Math.sin(x * 0.1) * 10 + Math.sin(x * 0.03) * 20;
    for (let x = 0; x < CHUNK_SIZE; x++) {
      const gx = cx * CHUNK_SIZE + x;
      const h = Math.floor(noise(gx));
      for (let y = 0; y < CHUNK_SIZE; y++) {
        const gy = cy * CHUNK_SIZE + y;
        let id = 0;
        if (gy > 40) id = 7;
        else if (gy > h) {
          id = 3;
          if (gy < h + 4) id = 2;
          if (id === 3 && Math.random() < 0.04)
            id = 11 + Math.floor(Math.random() * 4);
        } else if (gy === h) {
          id = 1;
          if (Math.random() < 0.1) this.treeQueue(gx, gy - 1);
        }
        if (data[y * CHUNK_SIZE + x] === 0) data[y * CHUNK_SIZE + x] = id;
      }
    }
    return data;
  }
  treeQueue(gx, gy) {
    setTimeout(() => {
      for (let i = 0; i < 4; i++) this.setBlock(gx, gy - i, 4);
      for (let ly = gy - 5; ly <= gy - 3; ly++)
        for (let lx = gx - 2; lx <= gx + 2; lx++) {
          if (!this.getBlock(lx, ly)) this.setBlock(lx, ly, 5);
        }
    }, 10);
  }
  getBlock(gx, gy) {
    const cx = Math.floor(gx / CHUNK_SIZE);
    const cy = Math.floor(gy / CHUNK_SIZE);
    const chunk = this.chunks[this.getChunkKey(cx, cy)];
    if (!chunk) return 0;
    const lx = ((gx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((gy % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return chunk[ly * CHUNK_SIZE + lx];
  }
  setBlock(gx, gy, id) {
    const cx = Math.floor(gx / CHUNK_SIZE);
    const cy = Math.floor(gy / CHUNK_SIZE);
    const key = this.getChunkKey(cx, cy);
    let chunk = this.chunks[key];
    if (!chunk) return;
    const lx = ((gx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((gy % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    chunk[ly * CHUNK_SIZE + lx] = id;
    if (this.net.isHost)
      this.net.broadcast({ type: "BLOCK", x: gx, y: gy, id });
  }

  loop() {
    if (this.net.isHost) {
      for (let id in this.players) {
        const p = this.players[id];
        const cx = Math.floor(p.x / TILE_SIZE / CHUNK_SIZE);
        const cy = Math.floor(p.y / TILE_SIZE / CHUNK_SIZE);
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -2; dx <= 2; dx++) this.getChunk(cx + dx, cy + dy);
      }
      this.updatePhys();
      this.updateDrops();
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

  updatePhys() {
    for (let id in this.players) {
      const p = this.players[id];
      p.vy += GRAVITY;
      p.x += p.vx;
      this.collide(p, "x");
      p.y += p.vy;
      this.collide(p, "y");
      p.vx *= 0.8;
      if (p.y > 10000) {
        p.x = 0;
        p.y = -200;
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
        if (Math.hypot(p.x - d.x, p.y - d.y) < 40) {
          this.giveItem(pid, d.itemId, 1);
          this.drops.splice(i, 1);
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
    const id = this.getBlock(x, y);
    return id && BLOCKS[id].solid;
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
      this.mining.bx = bx;
      this.mining.by = by;
      this.mining.active = true;
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
    let power = 1.0;
    if (block.reqTool) {
      if (tool.toolType === block.reqTool) power = tool.power;
      else power = 1.0;
    } else {
      power = tool.power || 1.0;
    }
    this.mining.progress += power;
    const pct = Math.min(100, (this.mining.progress / block.hardness) * 100);
    document.getElementById("mining-bar-container").style.display = "block";
    document.getElementById("mining-bar").style.width = pct + "%";
    if (this.mining.progress >= block.hardness) {
      this.setBlock(bx, by, 0);
      let did = BLOCKS[id].drop || id;
      if (did)
        this.drops.push(
          new Drop(
            bx * TILE_SIZE + TILE_SIZE / 2,
            by * TILE_SIZE + TILE_SIZE / 2,
            did
          )
        );
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
      inv[0] = { id: 110, count: 1 };
      inv[1] = { id: 100, count: 1 };
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

  checkCrafting() {
    const gridIds = this.craftGrid.map((slot) => slot.id);
    for (let r of RECIPES) {
      if (r.shapeless) {
        const gridCounts = {};
        let itemCount = 0;
        gridIds.forEach((id) => {
          if (id !== 0) {
            gridCounts[id] = (gridCounts[id] || 0) + 1;
            itemCount++;
          }
        });
        const reqCounts = {};
        r.in.forEach((id) => {
          reqCounts[id] = (reqCounts[id] || 0) + 1;
        });
        if (itemCount !== r.in.length) continue;
        let match = true;
        for (let id in reqCounts)
          if (gridCounts[id] !== reqCounts[id]) match = false;
        if (match) {
          this.craftResult = { id: r.out.id, count: r.out.count };
          this.updateCraftUI();
          return;
        }
      } else if (r.pattern) {
        let match = true;
        for (let i = 0; i < 9; i++)
          if (gridIds[i] !== r.pattern[i]) match = false;
        if (match) {
          this.craftResult = { id: r.out.id, count: r.out.count };
          this.updateCraftUI();
          return;
        }
      }
    }
    this.craftResult = { id: 0, count: 0 };
    this.updateCraftUI();
  }
  craftItem() {
    if (this.craftResult.id === 0) return;
    for (let i = 0; i < 9; i++) {
      if (this.craftGrid[i].id !== 0) {
        this.craftGrid[i].count--;
        if (this.craftGrid[i].count <= 0)
          this.craftGrid[i] = { id: 0, count: 0 };
      }
    }
    this.giveItem(this.net.myId, this.craftResult.id, this.craftResult.count);
    this.checkCrafting();
  }

  onPacket(msg, sender) {
    if (msg.type === "INIT") {
      for (let k in msg.chunks)
        this.chunks[k] = new Uint8Array(Object.values(msg.chunks[k]));
      this.players = msg.players;
    } else if (msg.type === "CHUNK_DATA") {
      for (let k in msg.chunks)
        this.chunks[k] = new Uint8Array(Object.values(msg.chunks[k]));
    } else if (msg.type === "SYNC") {
      this.players = msg.players;
      this.drops = msg.drops;
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
      if (msg.type === "MINE") {
        const id = this.getBlock(msg.x, msg.y);
        if (id && !BLOCKS[id].unbreakable) {
          this.setBlock(msg.x, msg.y, 0);
          let did = BLOCKS[id].drop || id;
          this.drops.push(
            new Drop(
              msg.x * TILE_SIZE + TILE_SIZE / 2,
              msg.y * TILE_SIZE + TILE_SIZE / 2,
              did
            )
          );
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
    this.cam.x += (p.x - this.width / 2 - this.cam.x) * 0.1;
    this.cam.y += (p.y - this.height / 2 - this.cam.y) * 0.1;

    const g = this.ctx.createLinearGradient(0, 0, 0, this.height);
    g.addColorStop(0, "#87CEEB");
    g.addColorStop(1, "#B2EBF2");
    this.ctx.fillStyle = g;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const startCX = Math.floor(this.cam.x / TILE_SIZE / CHUNK_SIZE);
    const endCX = startCX + Math.ceil(this.width / TILE_SIZE / CHUNK_SIZE) + 1;
    const startCY = Math.floor(this.cam.y / TILE_SIZE / CHUNK_SIZE);
    const endCY = startCY + Math.ceil(this.height / TILE_SIZE / CHUNK_SIZE) + 1;

    for (let cy = startCY; cy <= endCY; cy++) {
      for (let cx = startCX; cx <= endCX; cx++) {
        const chunk = this.chunks[this.getChunkKey(cx, cy)];
        if (!chunk) continue;
        for (let y = 0; y < CHUNK_SIZE; y++) {
          for (let x = 0; x < CHUNK_SIZE; x++) {
            const id = chunk[y * CHUNK_SIZE + x];
            if (id !== 0 && this.assets.blocks[id]) {
              const wx = (cx * CHUNK_SIZE + x) * TILE_SIZE;
              const wy = (cy * CHUNK_SIZE + y) * TILE_SIZE;
              this.ctx.drawImage(
                this.assets.blocks[id],
                Math.floor(wx - this.cam.x),
                Math.floor(wy - this.cam.y)
              );
            }
          }
        }
      }
    }
    if (this.mining.active) {
      const wx = this.mining.bx * TILE_SIZE - this.cam.x;
      const wy = this.mining.by * TILE_SIZE - this.cam.y;
      this.ctx.fillStyle = "rgba(255,255,255,0.3)";
      this.ctx.fillRect(wx, wy, TILE_SIZE, TILE_SIZE);
    }
    this.drops.forEach((d) => {
      const i = this.assets.blocks[d.itemId] || this.assets.items[d.itemId];
      if (i) this.ctx.drawImage(i, d.x - this.cam.x, d.y - this.cam.y, 20, 20);
    });
    for (let id in this.players) {
      const ply = this.players[id];
      const px = ply.x - this.cam.x,
        py = ply.y - this.cam.y;
      this.ctx.fillStyle = id === this.net.myId ? "#fff" : "#ccc";
      this.ctx.fillRect(px, py, 24, 54);
    }
    this.sendInput();
  }

  // ★ CRITICAL FIX: Use create element instead of innerHTML to preserve canvas context ★
  drawSlot(el, it) {
    el.innerHTML = ""; // Clear text/nodes
    if (it.id !== 0) {
      const i = this.assets.blocks[it.id] || this.assets.items[it.id];
      if (i) {
        const c = document.createElement("canvas");
        c.width = 32;
        c.height = 32;
        c.getContext("2d").drawImage(i, 0, 0);
        el.appendChild(c);
      } else {
        // Fallback if asset missing
        el.style.backgroundColor = "#f0f";
      }
      const span = document.createElement("span");
      span.className = "count";
      span.innerText = it.count;
      el.appendChild(span);
    }
  }

  initInvUI() {
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
    for (let i = 0; i < 9; i++) {
      const d = document.createElement("div");
      d.className = "slot";
      d.onclick = () => {
        if (this.selectedInvSlot !== -1) {
          const p = this.players[this.net.myId];
          const item = p.inv[this.selectedInvSlot];
          if (item.id !== 0 && item.count > 0) {
            item.count--;
            if (this.craftGrid[i].id === item.id) this.craftGrid[i].count++;
            else this.craftGrid[i] = { id: item.id, count: 1 };
            if (item.count <= 0)
              p.inv[this.selectedInvSlot] = { id: 0, count: 0 };
            this.checkCrafting();
            this.updateUI();
            this.updateCraftUI();
          }
        }
      };
      d.oncontextmenu = (e) => {
        e.preventDefault();
        if (this.craftGrid[i].id !== 0) {
          this.giveItem(
            this.net.myId,
            this.craftGrid[i].id,
            this.craftGrid[i].count
          );
          this.craftGrid[i] = { id: 0, count: 0 };
          this.checkCrafting();
          this.updateUI();
          this.updateCraftUI();
        }
      };
      cg.appendChild(d);
    }
    document.getElementById("craft-result-slot").onclick = () => {
      this.craftItem();
      this.updateUI();
      this.updateCraftUI();
    };
  }

  updateUI() {
    const p = this.players[this.net.myId];
    if (!p) return;
    document.getElementById("health-bar").style.width =
      (p.hp / p.maxHp) * 100 + "%";

    const bar = document.getElementById("inventory-bar");
    bar.innerHTML = "";
    p.inv.forEach((it, i) => {
      const d = document.createElement("div");
      d.className = `slot ${i === this.selSlot ? "active" : ""}`;
      this.drawSlot(d, it);
      bar.appendChild(d);
    });
    const grid = document.getElementById("inv-grid").children;
    p.inv.forEach((it, i) => {
      this.drawSlot(grid[i], it);
      grid[i].style.borderColor = i === this.selectedInvSlot ? "#0f0" : "#444";
    });
  }

  updateCraftUI() {
    const grid = document.getElementById("craft-grid").children;
    this.craftGrid.forEach((it, i) => {
      this.drawSlot(grid[i], it);
    });
    const resEl = document.getElementById("craft-result-slot");
    this.drawSlot(resEl, this.craftResult);
    resEl.style.cursor = this.craftResult.id !== 0 ? "pointer" : "default";
  }
  toggleInv() {
    const s = document.getElementById("inventory-screen");
    if (s.style.display === "none") {
      s.style.display = "flex";
      this.selectedInvSlot = -1;
      this.updateUI();
      this.updateCraftUI();
    } else s.style.display = "none";
  }
}
window.onload = () => new Game();
