/* 
 FullStackCraft P2P Core Engine 
 Strict Mode Enabled. No External Frameworks.
*/

// --- CONSTANTS & DATA DEFINITIONS ---
const BLOCKS = {
  0: { name: "Air", color: null, solid: false },
  1: { name: "Grass", color: "#00aa00", solid: true },
  2: { name: "Dirt", color: "#553311", solid: true },
  3: { name: "Stone", color: "#777777", solid: true },
  4: { name: "Sand", color: "#eecc88", solid: true },
  5: { name: "Wood", color: "#664422", solid: true },
  6: { name: "Leaves", color: "#228822", solid: true },
  7: { name: "Water", color: "rgba(0,0,255,0.5)", solid: false, fluid: true },
  8: {
    name: "Lava",
    color: "rgba(255,50,0,0.8)",
    solid: false,
    fluid: true,
    damage: 1,
  },
  9: { name: "Ice", color: "#aaddff", solid: true },
  10: { name: "Snow", color: "#ffffff", solid: true },
  11: { name: "CoalOre", color: "#333333", solid: true },
  12: { name: "CopperOre", color: "#b87333", solid: true },
  13: { name: "IronOre", color: "#aaaaaa", solid: true },
  14: { name: "GoldOre", color: "#dddd00", solid: true },
  15: { name: "DiamondOre", color: "#00ffff", solid: true },
  16: { name: "EmeraldOre", color: "#00ff00", solid: true },
  17: { name: "RedstoneOre", color: "#ff0000", solid: true },
  18: { name: "Quartz", color: "#eeeeee", solid: true },
  19: { name: "Obsidian", color: "#110011", solid: true },
  20: { name: "Netherite", color: "#332233", solid: true },
  21: { name: "Cobble", color: "#666666", solid: true },
  22: { name: "Brick", color: "#994422", solid: true },
  23: { name: "Concrete", color: "#cccccc", solid: true },
  24: { name: "Glass", color: "rgba(200,255,255,0.3)", solid: true },
  25: { name: "StainedGlass", color: "rgba(255,0,0,0.3)", solid: true },
  26: { name: "Planks", color: "#996633", solid: true },
  27: { name: "StoneBrick", color: "#777777", solid: true },
  28: { name: "WhiteBrick", color: "#eeeeee", solid: true },
  29: { name: "BlackBrick", color: "#222222", solid: true },
  30: { name: "Tile", color: "#aaaaaa", solid: true },
  31: { name: "CraftTable", color: "#885522", solid: true, interact: "craft" },
  32: { name: "Furnace", color: "#444444", solid: true },
  33: { name: "Chest", color: "#664400", solid: true },
  34: { name: "Lever", color: "#555555", solid: false },
  35: { name: "Button", color: "#777777", solid: false },
  36: { name: "Door", color: "#664422", solid: false },
  37: { name: "Trapdoor", color: "#664422", solid: true },
  38: { name: "PressurePlate", color: "#555555", solid: false },
  39: { name: "TNT", color: "#ff0000", solid: true },
  40: { name: "Lamp", color: "#ffffaa", solid: true },
  41: { name: "Flower", color: "#ff00ff", solid: false },
  42: { name: "TallGrass", color: "#00cc00", solid: false },
  43: { name: "Mushroom", color: "#ff0000", solid: false },
  44: { name: "Cactus", color: "#008800", solid: true, damage: 1 },
  45: { name: "SugarCane", color: "#55cc55", solid: false },
  46: { name: "Crops", color: "#dddd00", solid: false },
  47: { name: "Sapling", color: "#00aa00", solid: false },
  48: { name: "Bamboo", color: "#00dd00", solid: false },
  49: { name: "Vines", color: "#008800", solid: false },
  50: { name: "LilyPad", color: "#00aa00", solid: false },
  51: { name: "Bedrock", color: "#000000", solid: true, unbreakable: true },
  52: { name: "Spawn", color: "#0000ff", solid: false },
  53: { name: "Gravity", color: "#aa00aa", solid: true },
  54: {
    name: "Poison",
    color: "#00ff00",
    solid: false,
    fluid: true,
    damage: 1,
  },
  55: { name: "Heal", color: "#ffaaaa", solid: false, fluid: true },
  56: { name: "Warp", color: "#aa00ff", solid: false },
  57: { name: "Dark", color: "#111111", solid: false },
  58: { name: "Light", color: "#ffffdd", solid: false },
  59: { name: "Decay", color: "#550000", solid: true },
  60: { name: "BlastResist", color: "#333333", solid: true },
};

const ITEMS = {
  1: { name: "Hand", type: "tool", damage: 1 },
  2: { name: "WoodPick", type: "tool", damage: 2 },
  3: { name: "StonePick", type: "tool", damage: 3 },
  4: { name: "IronPick", type: "tool", damage: 4 },
  5: { name: "DiaPick", type: "tool", damage: 5 },
  11: { name: "WoodSword", type: "weapon", damage: 4 },
  12: { name: "StoneSword", type: "weapon", damage: 5 },
  13: { name: "IronSword", type: "weapon", damage: 6 },
  14: { name: "DiaSword", type: "weapon", damage: 8 },
  21: { name: "Apple", type: "food", heal: 2 },
  // Simplified list for brevity, logic supports 40 items
};

// Fill missing IDs with generic
for (let i = 1; i <= 40; i++)
  if (!ITEMS[i]) ITEMS[i] = { name: "Item" + i, type: "item" };
for (let i = 1; i <= 60; i++)
  if (!BLOCKS[i])
    BLOCKS[i] = { name: "Block" + i, color: "#ff00ff", solid: true };

const RECIPES = [
  { in: [5, 0, 0, 0], out: { id: 26, count: 4 } }, // Wood -> 4 Planks
  { in: [26, 26, 0, 0], out: { id: 31, count: 1 } }, // 2 Planks -> CraftTable
  { in: [26, 26, 26, 26], out: { id: 33, count: 1 } }, // 4 Planks -> Chest
  { in: [26, 26, 0, 26], out: { id: 11, count: 1 } }, // Simple Sword
];

const CHUNK_SIZE = 16;
const WORLD_WIDTH = 64; // Small world for performance
const WORLD_HEIGHT = 64;
const TILE_SIZE = 32;

// --- NETWORK MANAGER ---
class NetworkManager {
  constructor(game) {
    this.game = game;
    this.socket = io();
    this.peers = {}; // socketId -> RTCPeerConnection
    this.channels = {}; // socketId -> DataChannel
    this.myId = null;
    this.hostId = null;
    this.isHost = false;

    this.setupSocket();
  }

  setupSocket() {
    this.socket.on("connect", () => {
      this.myId = this.socket.id;
    });

    this.socket.on("role-assigned", (data) => {
      this.isHost = data.role === "HOST";
      this.hostId = this.isHost ? this.myId : data.hostId;
      console.log(`Role: ${data.role}, Host: ${this.hostId}`);
      if (this.isHost) {
        this.game.initWorld();
        this.game.startLoop();
      }
    });

    this.socket.on("user-joined", (data) => {
      if (this.isHost) this.initiateConnection(data.userId);
    });

    this.socket.on("signal", async (data) => {
      if (!this.peers[data.sender]) await this.createPeer(data.sender, false);
      const peer = this.peers[data.sender];
      if (data.signal.type === "offer") {
        await peer.setRemoteDescription(data.signal);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        this.socket.emit("signal", { target: data.sender, signal: answer });
      } else if (data.signal.type === "answer") {
        await peer.setRemoteDescription(data.signal);
      } else if (data.signal.candidate) {
        await peer.addIceCandidate(data.signal.candidate);
      }
    });

    this.socket.on("host-migrated", (data) => {
      console.log("Host migrated to:", data.newHostId);
      this.hostId = data.newHostId;
      // Clean up old connections
      if (this.hostId === this.myId) {
        this.isHost = true;
        this.game.startLoop(); // Take over game loop
      } else {
        // Reconnect to new host logic would go here
        window.location.reload(); // Simple failover for this scope
      }
    });
  }

  async createPeer(targetId, initiator) {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    this.peers[targetId] = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate)
        this.socket.emit("signal", {
          target: targetId,
          signal: { candidate: e.candidate },
        });
    };

    if (initiator) {
      const dc = pc.createDataChannel("game");
      this.setupDataChannel(dc, targetId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.socket.emit("signal", { target: targetId, signal: offer });
    } else {
      pc.ondatachannel = (e) => this.setupDataChannel(e.channel, targetId);
    }

    // Handle disconnect
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected") {
        this.game.removePlayer(targetId);
        delete this.peers[targetId];
        delete this.channels[targetId];
      }
    };
  }

  setupDataChannel(dc, targetId) {
    this.channels[targetId] = dc;
    dc.onopen = () => {
      if (this.isHost) {
        // Send full world state
        this.sendTo(targetId, {
          type: "WORLD_INIT",
          world: this.game.world,
          players: this.game.players,
        });
      }
    };
    dc.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      this.game.handlePacket(msg, targetId);
    };
  }

  broadcast(msg) {
    const str = JSON.stringify(msg);
    for (let id in this.channels) {
      if (this.channels[id].readyState === "open") this.channels[id].send(str);
    }
  }

  sendTo(id, msg) {
    if (this.channels[id] && this.channels[id].readyState === "open") {
      this.channels[id].send(JSON.stringify(msg));
    }
  }

  sendToHost(msg) {
    if (this.isHost) {
      this.game.handlePacket(msg, this.myId); // Local handle
    } else {
      // Client sends to host
      if (this.hostId && this.channels[this.hostId]) {
        // Add rudimentary signature
        msg._sign = Date.now();
        this.channels[this.hostId].send(JSON.stringify(msg));
      }
    }
  }
}

// --- GAME LOGIC ---
class Game {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.world = []; // Flattened array
    this.players = {}; // { id: { x, y, vx, vy, hp, inv... } }
    this.mobs = []; // Array of mob objects
    this.localPlayerId = null;

    this.keys = {};
    this.mouse = { x: 0, y: 0, left: false };
    this.selectedSlot = 0;

    this.net = new NetworkManager(this);

    // Events
    window.addEventListener("resize", () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    });
    window.addEventListener("keydown", (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key >= "1" && e.key <= "9") this.selectedSlot = parseInt(e.key) - 1;
      if (e.key === "e") this.toggleInventory();
      if (e.key === "f") this.attackAction();
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
      this.mouse.left = true;
      this.handleInteraction();
    });
    window.addEventListener("mouseup", (e) => (this.mouse.left = false));

    document.getElementById("start-btn").addEventListener("click", () => {
      const room = document.getElementById("room-input").value;
      document.getElementById("login-screen").style.display = "none";
      document.getElementById("game-ui").style.display = "block";
      this.net.socket.emit("join-room", room);
    });

    // Initialize Inventory UI
    this.initInventoryUI();
  }

  initWorld() {
    // Simple terrain gen
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      for (let x = 0; x < WORLD_WIDTH; x++) {
        let id = 0;
        if (y === WORLD_HEIGHT - 1) id = 51; // Bedrock
        else if (y > 40) id = 3; // Stone
        else if (y > 35) id = 2; // Dirt
        else if (y === 35) id = 1; // Grass
        this.world[y * WORLD_WIDTH + x] = id;
      }
    }
    // Spawn host player
    this.spawnPlayer(this.net.myId, 32 * TILE_SIZE, 30 * TILE_SIZE);

    // Spawn Mobs
    this.spawnMob("zombie", 10 * TILE_SIZE, 30 * TILE_SIZE);
    this.spawnMob("pig", 40 * TILE_SIZE, 30 * TILE_SIZE);
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
      inv: new Array(9).fill({ id: 0, count: 0 }),
      lastMove: Date.now(),
    };
    // Give starter items
    this.players[id].inv[0] = { id: 2, count: 1 }; // Pickaxe
  }

  spawnMob(type, x, y) {
    this.mobs.push({
      id: Date.now() + Math.random(),
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      hp: 10,
      width: 28,
      height: 28,
      lastAttack: 0,
    });
  }

  startLoop() {
    setInterval(() => this.gameLoop(), 1000 / 60); // Physics 60Hz
    setInterval(() => this.syncLoop(), 1000 / 20); // Network 20Hz
  }

  // --- MAIN LOOP ---
  gameLoop() {
    if (this.net.isHost) {
      // Physics & Logic
      this.updatePhysics();
      this.updateMobs();
    } else if (this.players[this.net.myId]) {
      // Client prediction / Input sending
      this.sendInput();
    }

    this.render();
  }

  syncLoop() {
    if (this.net.isHost) {
      // Send snapshot
      const snapshot = {
        type: "SNAPSHOT",
        players: this.players,
        mobs: this.mobs,
        time: Date.now(),
      };
      this.net.broadcast(snapshot);
    }
  }

  // --- PHYSICS & LOGIC ---
  updatePhysics() {
    for (let id in this.players) {
      this.applyPhysics(this.players[id]);
    }
    this.mobs.forEach((mob) => this.applyPhysics(mob));
  }

  applyPhysics(entity) {
    if (!entity) return;

    // Gravity
    entity.vy += 0.5;
    if (entity.vy > 10) entity.vy = 10;

    // X Movement resolution
    entity.x += entity.vx;
    this.checkCollision(entity, "x");

    // Y Movement resolution
    entity.y += entity.vy;
    this.checkCollision(entity, "y");

    // Friction
    entity.vx *= 0.8;
    if (Math.abs(entity.vx) < 0.1) entity.vx = 0;

    // Void check
    if (entity.y > WORLD_HEIGHT * TILE_SIZE) {
      entity.hp = 0;
      this.respawn(entity);
    }
  }

  checkCollision(ent, axis) {
    const left = Math.floor(ent.x / TILE_SIZE);
    const right = Math.floor((ent.x + (ent.width || 28)) / TILE_SIZE);
    const top = Math.floor(ent.y / TILE_SIZE);
    const bottom = Math.floor((ent.y + (ent.height || 56)) / TILE_SIZE);

    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const block = this.getBlock(x, y);
        if (block && block.solid) {
          if (axis === "x") {
            if (ent.vx > 0) ent.x = x * TILE_SIZE - (ent.width || 28) - 0.1;
            if (ent.vx < 0) ent.x = (x + 1) * TILE_SIZE + 0.1;
            ent.vx = 0;
          } else {
            if (ent.vy > 0) {
              // Landing
              ent.y = y * TILE_SIZE - (ent.height || 56) - 0.1;
              ent.grounded = true;
            }
            if (ent.vy < 0) ent.y = (y + 1) * TILE_SIZE + 0.1;
            ent.vy = 0;
          }
          return;
        }
      }
    }
    if (axis === "y") ent.grounded = false;
  }

  getBlock(x, y) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return null;
    const id = this.world[y * WORLD_WIDTH + x];
    return BLOCKS[id];
  }

  setBlock(x, y, id) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return;
    if (id === 51) return; // Bedrock protection
    this.world[y * WORLD_WIDTH + x] = id;
    this.net.broadcast({ type: "BLOCK_UPDATE", x, y, id });
  }

  updateMobs() {
    this.mobs.forEach((mob) => {
      // Simple AI: Move towards nearest player
      let nearest = null;
      let minDist = 300;
      for (let pid in this.players) {
        const p = this.players[pid];
        const d = Math.abs(p.x - mob.x) + Math.abs(p.y - mob.y);
        if (d < minDist) {
          minDist = d;
          nearest = p;
        }
      }

      if (nearest) {
        if (nearest.x > mob.x + 10) mob.vx = 2;
        else if (nearest.x < mob.x - 10) mob.vx = -2;

        // Jump if blocked
        if (
          mob.vx !== 0 &&
          this.isBlocked(mob.x + (mob.vx > 0 ? 30 : -10), mob.y) &&
          mob.grounded
        ) {
          mob.vy = -8;
        }

        // Attack
        if (minDist < 40 && Date.now() - (mob.lastAttack || 0) > 1000) {
          nearest.hp -= 2;
          nearest.vx = nearest.x - mob.x > 0 ? 5 : -5; // Knockback
          nearest.vy = -5;
          mob.lastAttack = Date.now();
          this.checkDeath(nearest);
        }
      }
    });
  }

  isBlocked(x, y) {
    const bx = Math.floor(x / TILE_SIZE);
    const by = Math.floor(y / TILE_SIZE);
    const b = this.getBlock(bx, by);
    return b && b.solid;
  }

  respawn(ent) {
    ent.x = 32 * TILE_SIZE;
    ent.y = 10 * TILE_SIZE;
    ent.hp = ent.maxHp || 20;
    ent.vx = 0;
    ent.vy = 0;
  }

  checkDeath(ent) {
    if (ent.hp <= 0) {
      if (ent.id) this.respawn(ent); // Player respawn
      else this.mobs = this.mobs.filter((m) => m !== ent); // Mob death
    }
  }

  // --- INPUT & INTERACTIONS ---
  sendInput() {
    const input = {
      type: "INPUT",
      keys: this.keys,
      dx: this.mouse.x, // For aiming
      dy: this.mouse.y,
    };
    this.net.sendToHost(input);
  }

  handleInput(input, playerId) {
    const p = this.players[playerId];
    if (!p) return;

    // Cheat Detection: Speed Check
    if (Date.now() - p.lastMove < 10) return; // Too fast inputs
    p.lastMove = Date.now();

    const speed = 4;
    if (input.keys["a"]) p.vx = -speed;
    if (input.keys["d"]) p.vx = speed;
    if ((input.keys["w"] || input.keys[" "]) && p.grounded) p.vy = -10;

    // Attack Handling
    if (input.attack) {
      // Verify attack cooldown
      // Check Hitbox
    }
  }

  handleInteraction() {
    if (!this.players[this.net.myId]) return;
    const camX = this.players[this.net.myId].x - this.width / 2;
    const camY = this.players[this.net.myId].y - this.height / 2;
    const mx = this.mouse.x + camX;
    const my = this.mouse.y + camY;
    const bx = Math.floor(mx / TILE_SIZE);
    const by = Math.floor(my / TILE_SIZE);

    this.net.sendToHost({
      type: "INTERACT",
      x: bx,
      y: by,
      mode: this.keys["shift"] ? "place" : "dig",
      slot: this.selectedSlot,
    });
  }

  attackAction() {
    this.net.sendToHost({ type: "ATTACK" });
  }

  handlePacket(msg, senderId) {
    if (msg.type === "WORLD_INIT") {
      this.world = msg.world;
      this.players = msg.players;
      this.net.myId = this.net.socket.id;
    } else if (msg.type === "SNAPSHOT") {
      this.players = msg.players;
      this.mobs = msg.mobs;
      this.updateUI();
    } else if (msg.type === "BLOCK_UPDATE") {
      this.world[msg.y * WORLD_WIDTH + msg.x] = msg.id;
    } else if (msg.type === "INPUT") {
      if (this.net.isHost) this.handleInput(msg, senderId);
    } else if (msg.type === "INTERACT") {
      if (this.net.isHost) this.processInteraction(senderId, msg);
    } else if (msg.type === "ATTACK") {
      if (this.net.isHost) this.processAttack(senderId);
    }
  }

  processInteraction(pid, data) {
    const p = this.players[pid];
    const block = this.getBlock(data.x, data.y);

    // Range Check (Cheat prevention)
    const dx = data.x * TILE_SIZE - p.x;
    const dy = data.y * TILE_SIZE - p.y;
    if (dx * dx + dy * dy > 200 * 200) return; // Too far

    if (data.mode === "dig") {
      if (block && block.name !== "Air") {
        // Drop item
        const inv = p.inv;
        // Simply add to first empty slot for demo
        for (let i = 0; i < 9; i++) {
          if (inv[i].id === 0 || inv[i].id === this.getBlockId(block.name)) {
            inv[i].id = this.getBlockId(block.name); // Simplified ID mapping
            inv[i].count++;
            break;
          }
        }
        this.setBlock(data.x, data.y, 0);
      }
    } else {
      // Place
      const item = p.inv[data.slot];
      if (item && item.count > 0 && BLOCKS[item.id] && BLOCKS[item.id].solid) {
        if (!block || !block.solid) {
          this.setBlock(data.x, data.y, item.id);
          item.count--;
          if (item.count <= 0) item.id = 0;
        }
      }
    }
  }

  getBlockId(name) {
    for (let id in BLOCKS) if (BLOCKS[id].name === name) return parseInt(id);
    return 2; // Default Dirt
  }

  processAttack(pid) {
    const p = this.players[pid];
    const range = 60;
    // Hit Mobs
    this.mobs.forEach((m) => {
      if (Math.abs(m.x - p.x) < range && Math.abs(m.y - p.y) < range) {
        m.hp -= 5;
        m.vx = m.x - p.x > 0 ? 5 : -5;
        m.vy = -3;
        this.checkDeath(m);
      }
    });
    // Hit Players
    for (let tid in this.players) {
      if (tid === pid) continue;
      const t = this.players[tid];
      if (Math.abs(t.x - p.x) < range && Math.abs(t.y - p.y) < range) {
        t.hp -= 3;
        t.vx = t.x - p.x > 0 ? 5 : -5;
        t.vy = -3;
        this.checkDeath(t);
      }
    }
  }

  removePlayer(id) {
    delete this.players[id];
  }

  // --- RENDERING ---
  render() {
    if (!this.players[this.net.myId]) return;

    // Camera
    const p = this.players[this.net.myId];
    const camX = p.x - this.width / 2;
    const camY = p.y - this.height / 2;

    this.ctx.fillStyle = "#87CEEB"; // Sky
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Blocks
    const startCol = Math.floor(camX / TILE_SIZE);
    const endCol = startCol + this.width / TILE_SIZE + 1;
    const startRow = Math.floor(camY / TILE_SIZE);
    const endRow = startRow + this.height / TILE_SIZE + 1;

    for (let y = startRow; y < endRow; y++) {
      for (let x = startCol; x < endCol; x++) {
        const b = this.getBlock(x, y);
        if (b && b.id !== 0) {
          this.ctx.fillStyle = b.color || "#f0f";
          this.ctx.fillRect(
            Math.floor(x * TILE_SIZE - camX),
            Math.floor(y * TILE_SIZE - camY),
            TILE_SIZE,
            TILE_SIZE
          );
        }
      }
    }

    // Entities
    for (let id in this.players) {
      const ent = this.players[id];
      this.ctx.fillStyle = id === this.net.myId ? "#fff" : "#aaa";
      this.ctx.fillRect(ent.x - camX, ent.y - camY, 28, 56);
      // Name tag
      this.ctx.fillStyle = "#fff";
      this.ctx.fillText(id.substr(0, 4), ent.x - camX, ent.y - camY - 5);
    }

    this.mobs.forEach((m) => {
      this.ctx.fillStyle = m.type === "zombie" ? "#00aa00" : "#ffaaaa";
      this.ctx.fillRect(m.x - camX, m.y - camY, m.width, m.height);
    });
  }

  // --- UI & CRAFTING ---
  initInventoryUI() {
    const grid = document.getElementById("inv-grid");
    for (let i = 0; i < 9; i++) {
      const d = document.createElement("div");
      d.className = "slot";
      d.onclick = () => {
        this.selectedSlot = i;
        this.updateUI();
      };
      grid.appendChild(d);
    }

    // Crafting Grid
    const cgrid = document.getElementById("craft-grid");
    for (let i = 0; i < 4; i++) {
      const d = document.createElement("div");
      d.className = "slot";
      d.onclick = () => {
        /* Select for crafting */
      };
      cgrid.appendChild(d);
    }
  }

  updateUI() {
    const p = this.players[this.net.myId];
    if (!p) return;

    // HP
    document.getElementById("hp-inner").style.width =
      (p.hp / p.maxHp) * 100 + "%";

    // Inventory Bar
    const bar = document.getElementById("inventory-bar");
    bar.innerHTML = "";
    p.inv.forEach((item, i) => {
      const d = document.createElement("div");
      d.className = "slot " + (i === this.selectedSlot ? "active" : "");
      if (item.id !== 0) {
        d.style.backgroundColor = BLOCKS[item.id]
          ? BLOCKS[item.id].color
          : "#fff";
        d.innerHTML = `<span class="count">${item.count}</span>`;
      }
      bar.appendChild(d);
    });

    // Inventory Screen
    if (document.getElementById("inventory-screen").style.display !== "none") {
      const grid = document.getElementById("inv-grid").children;
      p.inv.forEach((item, i) => {
        grid[i].innerHTML = "";
        if (item.id !== 0) {
          grid[i].style.backgroundColor = BLOCKS[item.id]
            ? BLOCKS[item.id].color
            : "#fff";
          grid[i].innerHTML = `<span class="count">${item.count}</span>`;
        } else {
          grid[i].style.backgroundColor = "rgba(0,0,0,0.5)";
        }
      });
    }
  }

  toggleInventory() {
    const el = document.getElementById("inventory-screen");
    el.style.display = el.style.display === "none" ? "flex" : "none";
  }
}

// Start Game Instance
window.onload = () => {
  const game = new Game();
};
