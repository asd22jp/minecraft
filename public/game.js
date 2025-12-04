/**
 * FullStackCraft v7 - GOD HAND EDITION
 * Absolute Authority Mining: No restrictions, instant breaks.
 */

const TILE_SIZE = 32;
const WORLD_WIDTH = 128;
const WORLD_HEIGHT = 96;
const GRAVITY = 0.5;

const BLOCKS = {
  0: { name: "Air", solid: false },
  1: { name: "Grass", color: "#5b8a36", solid: true },
  2: { name: "Dirt", color: "#704828", solid: true },
  3: { name: "Stone", color: "#666666", solid: true },
  4: { name: "Sand", color: "#dcc688", solid: true },
  5: { name: "Wood", color: "#5c3817", solid: true },
  6: { name: "Leaves", color: "#3a7a28", solid: true },
  11: { name: "CoalOre", color: "#333", solid: true, oreColor: "#000" },
  13: { name: "IronOre", color: "#aaa", solid: true, oreColor: "#dca47e" },
  15: { name: "DiamondOre", color: "#777", solid: true, oreColor: "#00ffff" },
  51: { name: "Bedrock", color: "#111", solid: true, unbreakable: true },
};

const ITEMS = {
  0: { name: "Air" },
  1: { name: "GodHand", icon: "#f00" }, // Super strong hand
  2: { name: "Pickaxe", icon: "#855" },
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
        this.handleMining();
      }
      if (e.button === 2) {
        this.mouse.right = true;
        this.handlePlace();
      }
    });
    window.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.mouse.left = false;
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
      const b = BLOCKS[id];
      const c = document.createElement("canvas");
      c.width = 32;
      c.height = 32;
      const ctx = c.getContext("2d");
      ctx.fillStyle = b.color || "#f0f";
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.fillRect(0, 0, 32, 2);
      ctx.fillRect(0, 0, 2, 32);
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.fillRect(0, 30, 32, 2);
      ctx.fillRect(30, 0, 2, 32);
      if (b.oreColor) {
        ctx.fillStyle = b.oreColor;
        ctx.fillRect(10, 10, 12, 12);
      }
      this.assets.blocks[id] = c;
    }
  }

  genWorld() {
    const hMap = [];
    for (let x = 0; x < WORLD_WIDTH; x++)
      hMap[x] = Math.floor(40 + Math.sin(x * 0.1) * 10);
    for (let y = 0; y < WORLD_HEIGHT; y++)
      for (let x = 0; x < WORLD_WIDTH; x++) {
        const idx = y * WORLD_WIDTH + x;
        let id = 0;
        if (y >= WORLD_HEIGHT - 1) id = 51;
        else if (y > hMap[x]) {
          id = 3;
          if (y < hMap[x] + 4) id = 2;
          if (id === 3 && Math.random() < 0.08) id = 11;
        } else if (y === hMap[x]) {
          id = 1;
          if (x > 5 && x < WORLD_WIDTH - 5 && Math.random() < 0.15)
            this.genTree(x, y - 1);
        }
        if (!this.world[idx] && id) this.world[idx] = id;
      }
    this.spawnPlayer(this.net.myId, 64 * 32, 20 * 32);
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

    // Continuous Mining Check
    if (this.mouse.left) this.handleMining();

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

  // ★ KEY UPDATE: INSTANT CLIENT-SIDE MINING ★
  handleMining() {
    if (!this.players[this.net.myId]) return;

    // Calculate Target
    const mx = this.mouse.x + this.cam.x;
    const my = this.mouse.y + this.cam.y;
    const bx = Math.floor(mx / 32);
    const by = Math.floor(my / 32);

    // Valid Check
    if (bx < 0 || bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) return;

    const bid = this.world[by * WORLD_WIDTH + bx];
    if (bid === 0 || bid === 51) return; // Ignore Air & Bedrock

    // CLIENT PREDICTION: Destroy immediately
    this.world[by * WORLD_WIDTH + bx] = 0;

    // Send Command
    this.net.send({ type: "DESTROY", x: bx, y: by });
  }

  handlePlace() {
    const mx = this.mouse.x + this.cam.x,
      my = this.mouse.y + this.cam.y;
    const bx = Math.floor(mx / 32),
      by = Math.floor(my / 32);
    this.net.send({ type: "PLACE", x: bx, y: by, slot: this.selSlot });
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
          if (msg.keys.a) p.vx = -6;
          if (msg.keys.d) p.vx = 6;
          if (msg.keys.w && p.grounded) p.vy = -10;
        }
      }
      if (msg.type === "DESTROY") {
        // Host unconditionally accepts destruction (God Mode Logic)
        const bid = this.world[msg.y * WORLD_WIDTH + msg.x];
        if (bid !== 0 && bid !== 51) {
          this.world[msg.y * WORLD_WIDTH + msg.x] = 0;
          this.drops.push(new Drop(msg.x * 32 + 16, msg.y * 32 + 16, bid));
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

    // Strict Camera Lock
    this.cam.x = p.x - this.width / 2;
    this.cam.y = p.y - this.height / 2;

    const g = this.ctx.createLinearGradient(0, 0, 0, this.height);
    g.addColorStop(0, "#000033");
    g.addColorStop(1, "#444488"); // Darker "Space" Theme for God Mode
    this.ctx.fillStyle = g;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const sx = Math.floor(this.cam.x / 32),
      sy = Math.floor(this.cam.y / 32);
    const ex = sx + Math.floor(this.width / 32) + 2,
      ey = sy + Math.floor(this.height / 32) + 2;

    // Update Target Info HUD
    const mx = this.mouse.x + this.cam.x;
    const my = this.mouse.y + this.cam.y;
    const tBx = Math.floor(mx / 32);
    const tBy = Math.floor(my / 32);
    let targetName = "None";

    for (let y = sy; y < ey; y++)
      for (let x = sx; x < ex; x++) {
        if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) continue;
        const id = this.world[y * WORLD_WIDTH + x];
        if (id !== 0 && this.assets.blocks[id]) {
          const px = Math.floor(x * 32 - this.cam.x),
            py = Math.floor(y * 32 - this.cam.y);
          this.ctx.drawImage(this.assets.blocks[id], px, py);

          if (x === tBx && y === tBy) {
            this.ctx.strokeStyle = "#f00";
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(px, py, 32, 32);
            targetName = `${BLOCKS[id].name} [${x},${y}]`;
          }
        }
      }

    document.getElementById("target-info").innerText = `Target: ${targetName}`;

    this.drops.forEach((d) => {
      const i = this.assets.blocks[d.itemId];
      if (i) this.ctx.drawImage(i, d.x - this.cam.x, d.y - this.cam.y, 16, 16);
    });

    for (let id in this.players) {
      const ply = this.players[id];
      const px = ply.x - this.cam.x,
        py = ply.y - this.cam.y;
      this.ctx.fillStyle = id === this.net.myId ? "#fff" : "#ccc";
      this.ctx.fillRect(px, py, 24, 54);
      // Draw God Hand
      this.ctx.fillStyle = "#f00";
      this.ctx.fillRect(px + 20, py + 30, 8, 8);
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
    const ren = (el, it) => {
      el.innerHTML = "";
      if (it.id) {
        const i = this.assets.blocks[it.id];
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
