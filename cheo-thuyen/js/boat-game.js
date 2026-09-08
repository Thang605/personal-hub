/**
 * Boat Race Host Engine
 * Quản lý đường đua phương ngang, vật lý thuyền, hiệu ứng sóng nước, AI bots & bảng vinh quang
 */

class BoatHostGame {
  constructor() {
    this.network = new BoatNetwork();
    this.audio = new BoatAudio();

    // Game Config & State
    this.pin = this._generatePin();
    this.targetDistance = 500; // 500 mét mặc định
    this.state = "LOBBY"; // LOBBY, COUNTDOWN, RACING, FINISHED
    this.players = new Map(); // Map<id, BoatObject>
    this.leaderboard = [];
    this.startTime = 0;
    this.raceTime = 0;
    this.countdownValue = 3;
    this.countdownTimer = null;
    this.syncInterval = null;

    // Canvas & Rendering
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.cameraX = 0;
    this.waterOffset = 0;
    this.animationFrameId = null;

    // Palette for random boats
    this.boatColors = [
      { name: "Đỏ Lửa", color: "#ef4444", secondary: "#991b1b" },
      { name: "Xanh Biển", color: "#3b82f6", secondary: "#1e40af" },
      { name: "Vàng Rồng", color: "#eab308", secondary: "#854d0e" },
      { name: "Xanh Ngọc", color: "#10b981", secondary: "#065f46" },
      { name: "Tím Mộng", color: "#a855f7", secondary: "#581c87" },
      { name: "Cam Cháy", color: "#f97316", secondary: "#9a3412" },
      { name: "Hồng Sen", color: "#ec4899", secondary: "#831843" },
      { name: "Lục Bảo", color: "#14b8a6", secondary: "#134e4a" }
    ];
  }

  _generatePin() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  init() {
    this.canvas = document.getElementById("race-canvas");
    if (this.canvas) {
      this.ctx = this.canvas.getContext("2d");
      this._resizeCanvas();
      window.addEventListener("resize", () => this._resizeCanvas());
    }

    // Khởi tạo mạng Host
    this.network.initHost(this.pin);
    this._setupNetworkEvents();

    // Render QR Code
    this._generateQrCode();

    // Vòng lặp vật lý & đồ họa
    this._startRenderLoop();

    // Đồng bộ tiến độ cho các điện thoại định kỳ (15 FPS)
    this.syncInterval = setInterval(() => {
      if (this.state === "RACING") {
        this._broadcastRaceProgress();
      }
    }, 66);
  }

  _resizeCanvas() {
    if (!this.canvas) return;
    const container = this.canvas.parentElement;
    if (container) {
      this.canvas.width = container.clientWidth;
      this.canvas.height = Math.max(container.clientHeight, 420);
    }
  }

  _generateQrCode() {
    const qrContainer = document.getElementById("qr-code-container");
    const pinText = document.getElementById("room-pin-display");
    const urlText = document.getElementById("room-url-display");

    if (pinText) pinText.innerText = this.pin;

    // Xác định URL người chơi
    let playerUrl = "";
    if (window.location.protocol === "file:") {
      playerUrl = `http://localhost:8080/cheo-thuyen/player.html?pin=${this.pin}`;
    } else {
      let hostUrl = window.location.origin + window.location.pathname.replace("index.html", "");
      if (!hostUrl.endsWith("/")) hostUrl += "/";
      playerUrl = `${hostUrl}player.html?pin=${this.pin}`;
    }

    if (urlText) urlText.innerText = playerUrl;

    if (qrContainer && typeof QRCode !== "undefined") {
      qrContainer.innerHTML = "";
      new QRCode(qrContainer, {
        text: playerUrl,
        width: 170,
        height: 170,
        colorDark: "#0f172a",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });
    }
  }

  // ==========================================
  // XỬ LÝ SỰ KIỆN MẠNG
  // ==========================================
  _setupNetworkEvents() {
    // 1. Khi có người chơi tham gia (JOIN)
    this.network.on("join", (msg) => {
      this._addOrUpdatePlayer(msg.playerId, {
        name: msg.name || "Tay chèo",
        avatar: msg.avatar || "🚣‍♂️",
        color: msg.color,
        boatStyle: msg.boatStyle,
        isBot: false
      });
      this.audio.playSplash(0.8);
    });

    // 2. Khi người chơi chèo (STROKE: L hoặc R)
    this.network.on("stroke", (msg) => {
      if (this.state !== "RACING") return;
      const boat = this.players.get(msg.playerId);
      if (boat && !boat.isFinished) {
        this._applyStrokeToBoat(boat, msg.side, msg.power || 1.0, msg.combo || 1);
      }
    });

    // 3. Khi người chơi bứt tốc (BOOST)
    this.network.on("boost", (msg) => {
      if (this.state !== "RACING") return;
      const boat = this.players.get(msg.playerId);
      if (boat && !boat.isFinished) {
        boat.speed += 3.5;
        this._createSplash(boat.x, boat.y, "#38bdf8", 25);
        this.audio.playBoost();
      }
    });
  }

  // ==========================================
  // QUẢN LÝ NGƯỜI CHƠI & BOT
  // ==========================================
  _addOrUpdatePlayer(id, info) {
    if (this.players.has(id)) {
      const existing = this.players.get(id);
      Object.assign(existing, info);
      this._updateLobbyUI();
      return;
    }

    const laneIndex = this.players.size;
    const colorScheme = this.boatColors[laneIndex % this.boatColors.length];

    const boat = {
      id: id,
      name: info.name || `Thuyền ${laneIndex + 1}`,
      avatar: info.avatar || "🚣‍♂️",
      color: info.color || colorScheme.color,
      secondaryColor: colorScheme.secondary,
      isBot: !!info.isBot,
      botDifficulty: info.botDifficulty || (0.7 + Math.random() * 0.4),
      lane: laneIndex,

      // Vị trí & Vật lý
      x: 0,                // Mét đã đi (0 -> targetDistance)
      y: 0,                // Vị trí pixel trên làn
      targetY: 0,
      speed: 0,            // Vận tốc tức thời (m/s)
      targetSpeed: 0,
      lastStrokeSide: null,// 'L' hoặc 'R'
      lastStrokeTime: 0,
      combo: 0,
      cadenceBpm: 0,
      strokeCount: 0,

      // Trạng thái mái chèo đồ họa (Góc chèo L/R)
      oarAngleL: 0,
      oarAngleR: 0,
      oarTargetL: 0,
      oarTargetR: 0,

      // Về đích
      isFinished: false,
      finishTime: 0,
      rank: 0
    };

    this.players.set(id, boat);
    this._updateLobbyUI();
  }

  addBot() {
    const botNames = [
      { name: "⚡ Bot Tia Chớp", avatar: "⚡", style: "dragon" },
      { name: "🐉 Bot Thần Long", avatar: "🐉", style: "dragon" },
      { name: "🌊 Bot Kình Ngư", avatar: "🦈", style: "classic" },
      { name: "🔥 Bot Lửa Đỏ", avatar: "🔥", style: "classic" },
      { name: "🏹 Bot Thần Tốc", avatar: "🏹", style: "canoe" },
      { name: "🌟 Bot Sao Băng", avatar: "🌟", style: "canoe" }
    ];

    const count = this.players.size;
    const template = botNames[count % botNames.length];
    const botId = "bot_" + Math.random().toString(36).substring(2, 7);

    this._addOrUpdatePlayer(botId, {
      name: template.name,
      avatar: template.avatar,
      isBot: true,
      botDifficulty: 0.75 + Math.random() * 0.45
    });
  }

  removePlayer(id) {
    this.players.delete(id);
    // Re-index lanes
    let idx = 0;
    this.players.forEach((b) => {
      b.lane = idx++;
    });
    this._updateLobbyUI();
  }

  clearAllPlayers() {
    this.players.clear();
    this._updateLobbyUI();
  }

  _updateLobbyUI() {
    const listEl = document.getElementById("lobby-player-list");
    const countEl = document.getElementById("lobby-player-count");
    const startBtn = document.getElementById("btn-start-race");

    if (countEl) countEl.innerText = `${this.players.size} thuyền tham gia`;

    if (listEl) {
      listEl.innerHTML = "";
      this.players.forEach((boat) => {
        const item = document.createElement("div");
        item.className = "flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-md animate-fadeIn";
        item.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner" style="background-color: ${boat.color}33; border: 2px solid ${boat.color};">
              ${boat.avatar}
            </div>
            <div>
              <div class="font-bold text-sm text-white flex items-center gap-1.5">
                ${boat.name}
                ${boat.isBot ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">BOT</span>' : ''}
              </div>
              <div class="text-[11px] text-slate-400">Làn ${boat.lane + 1} • Sẵn sàng</div>
            </div>
          </div>
          <button onclick="window.gameHost.removePlayer('${boat.id}')" class="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition" title="Xóa">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        `;
        listEl.appendChild(item);
      });

      if (this.players.size === 0) {
        listEl.innerHTML = `
          <div class="text-center py-8 text-slate-500 text-sm">
            Chưa có người chơi nào vào phòng.<br/>
            Quét mã QR hoặc nhấn <b>"+ Thêm Bot"</b> để chơi ngay!
          </div>
        `;
      }
    }

    if (startBtn) {
      startBtn.disabled = this.players.size === 0;
    }
  }

  setTargetDistance(dist) {
    this.targetDistance = Number(dist);
    const distBtns = document.querySelectorAll(".distance-select-btn");
    distBtns.forEach((btn) => {
      if (Number(btn.dataset.dist) === this.targetDistance) {
        btn.classList.add("bg-indigo-600", "text-white", "shadow-indigo-500/30");
        btn.classList.remove("bg-slate-800", "text-slate-400");
      } else {
        btn.classList.remove("bg-indigo-600", "text-white", "shadow-indigo-500/30");
        btn.classList.add("bg-slate-800", "text-slate-400");
      }
    });
  }

  // ==========================================
  // TIẾN TRÌNH TRẬN ĐUA (RACE LIFECYCLE)
  // ==========================================
  startCountdown() {
    if (this.players.size === 0) return;

    this.state = "COUNTDOWN";
    this.countdownValue = 3;

    // Reset mọi thông số thuyền
    this.players.forEach((b) => {
      b.x = 0;
      b.speed = 0;
      b.isFinished = false;
      b.finishTime = 0;
      b.rank = 0;
      b.combo = 0;
      b.strokeCount = 0;
    });
    this.leaderboard = [];

    // Ẩn Lobby, hiện màn hình Đua
    document.getElementById("lobby-overlay").classList.add("hidden");
    document.getElementById("race-screen").classList.remove("hidden");
    document.getElementById("victory-modal").classList.add("hidden");

    const countOverlay = document.getElementById("countdown-overlay");
    const countNumber = document.getElementById("countdown-number");
    countOverlay.classList.remove("hidden");
    countNumber.innerText = "3";
    this.audio.playCountdownBeep(false);

    // Báo cho điện thoại
    this.network.sendToAllPlayers({
      type: "COUNTDOWN_START",
      countdown: 3,
      targetDistance: this.targetDistance
    });

    this.countdownTimer = setInterval(() => {
      this.countdownValue--;
      if (this.countdownValue > 0) {
        countNumber.innerText = this.countdownValue.toString();
        this.audio.playCountdownBeep(false);
        this.network.sendToAllPlayers({
          type: "COUNTDOWN_TICK",
          countdown: this.countdownValue
        });
      } else if (this.countdownValue === 0) {
        countNumber.innerText = "XUẤT PHÁT!";
        countNumber.classList.add("text-amber-400", "scale-110");
        this.audio.playCountdownBeep(true);
        this.network.sendToAllPlayers({ type: "RACE_START" });
      } else {
        clearInterval(this.countdownTimer);
        countOverlay.classList.add("hidden");
        countNumber.classList.remove("text-amber-400", "scale-110");
        this._startRace();
      }
    }, 1000);
  }

  _startRace() {
    this.state = "RACING";
    this.startTime = performance.now();
    this.audio.startDrumBgm(120);

    // Kích hoạt AI Bot logic
    this._startBotLogic();
  }

  _startBotLogic() {
    this.players.forEach((boat) => {
      if (boat.isBot) {
        this._scheduleBotStroke(boat);
      }
    });
  }

  _scheduleBotStroke(boat) {
    if (this.state !== "RACING" || boat.isFinished) return;

    // Nhịp chèo ngẫu nhiên dựa trên độ khó của Bot
    const baseInterval = 380 / boat.botDifficulty;
    const jitter = (Math.random() * 100 - 50);
    const delay = Math.max(160, baseInterval + jitter);

    setTimeout(() => {
      if (this.state !== "RACING" || boat.isFinished) return;

      // Luân phiên Trái -> Phải
      const nextSide = boat.lastStrokeSide === "L" ? "R" : "L";
      this._applyStrokeToBoat(boat, nextSide, 0.9 + Math.random() * 0.2, Math.min(15, boat.combo + 1));

      this._scheduleBotStroke(boat);
    }, delay);
  }

  _applyStrokeToBoat(boat, side, power, combo) {
    const now = performance.now();
    const timeSinceLast = now - (boat.lastStrokeTime || 0);
    boat.lastStrokeTime = now;
    boat.strokeCount++;

    // Kiểm tra chèo luân phiên
    const isAlternating = boat.lastStrokeSide !== side;
    boat.lastStrokeSide = side;

    if (isAlternating) {
      boat.combo = (combo || boat.combo + 1);
      // Đòn bẩy lực tăng dần theo nhịp chèo nhịp nhàng
      const rhythmBonus = Math.min(1.8, 1.0 + (boat.combo * 0.04));
      const strokeImpulse = 1.4 * power * rhythmBonus;
      boat.speed = Math.min(22, boat.speed + strokeImpulse);

      // Kích hoạt vệt bọt nước tương ứng bên mái chèo
      if (side === "L") {
        boat.oarTargetL = 0.9;
        this._createSplash(boat.x - 2, boat.y - 12, boat.color, 8);
      } else {
        boat.oarTargetR = 0.9;
        this._createSplash(boat.x - 2, boat.y + 12, boat.color, 8);
      }

      // Âm thanh chèo nước
      this.audio.playSplash(0.7 + (boat.combo * 0.03));
    } else {
      // Lệch tay chèo! Giảm tốc độ và reset combo
      boat.combo = 0;
      boat.speed = Math.max(0, boat.speed * 0.7);
      this.audio.playStumble();
    }
  }

  _broadcastRaceProgress() {
    if (this.state !== "RACING") return;

    // Sắp xếp thứ hạng hiện tại
    const sorted = Array.from(this.players.values()).sort((a, b) => b.x - a.x);
    sorted.forEach((boat, idx) => {
      boat.rank = idx + 1;
    });

    const elapsed = ((performance.now() - this.startTime) / 1000).toFixed(1);

    // Gửi gói tin cập nhật tới tất cả người chơi
    sorted.forEach((boat) => {
      if (!boat.isBot) {
        this.network.sendToPlayer(boat.id, {
          type: "SYNC_RACE",
          distance: Math.min(this.targetDistance, Math.round(boat.x)),
          targetDistance: this.targetDistance,
          speed: (boat.speed * 3.6).toFixed(1), // km/h
          rank: boat.rank,
          totalPlayers: this.players.size,
          combo: boat.combo,
          elapsedTime: elapsed
        });
      }
    });

    // Cập nhật nhịp trống theo nhóm dẫn đầu
    const topSpeed = sorted[0] ? sorted[0].speed : 0;
    this.audio.setTempo(110 + topSpeed * 4);
  }

  // ==========================================
  // VẬT LÝ & ĐỒ HỌA (RENDER LOOP)
  // ==========================================
  _startRenderLoop() {
    let lastTimestamp = performance.now();

    const loop = (currentTimestamp) => {
      const dt = Math.min((currentTimestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = currentTimestamp;

      this._updatePhysics(dt);
      this._renderCanvas();

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  _updatePhysics(dt) {
    if (this.state === "RACING" || this.state === "FINISHED") {
      this.raceTime = (performance.now() - this.startTime) / 1000;

      // Cập nhật đồng hồ trên UI
      const timerEl = document.getElementById("race-timer-display");
      if (timerEl) timerEl.innerText = this.raceTime.toFixed(1) + "s";

      let allFinished = true;

      this.players.forEach((boat) => {
        // Ma sát cản của nước (Water drag)
        const dragCoeff = 0.85;
        boat.speed = Math.max(0, boat.speed - (boat.speed * dragCoeff * dt));

        // Cập nhật quãng đường (Phương ngang: X tăng dần)
        if (!boat.isFinished) {
          boat.x += boat.speed * dt * 4.2;

          // Kiểm tra về đích
          if (boat.x >= this.targetDistance) {
            boat.x = this.targetDistance;
            boat.isFinished = true;
            boat.finishTime = this.raceTime;
            this.leaderboard.push(boat);
            boat.rank = this.leaderboard.length;

            this.audio.playVictory();
            this._createSplash(boat.x, boat.y, "#fbbf24", 50);

            // Báo riêng cho người chơi về đích
            if (!boat.isBot) {
              this.network.sendToPlayer(boat.id, {
                type: "RACE_FINISHED",
                rank: boat.rank,
                finishTime: boat.finishTime.toFixed(2),
                targetDistance: this.targetDistance
              });
            }
          } else {
            allFinished = false;
          }
        }

        // Hồi góc mái chèo
        boat.oarAngleL += (boat.oarTargetL - boat.oarAngleL) * dt * 12;
        boat.oarAngleR += (boat.oarTargetR - boat.oarAngleR) * dt * 12;
        boat.oarTargetL *= 0.8;
        boat.oarTargetR *= 0.8;

        // Sinh bọt nước theo tốc độ
        if (boat.speed > 1.0) {
          this._createWakeParticle(boat);
        }
      });

      // Nếu tất cả đã về đích hoặc top 3 đã xong
      if (this.players.size > 0 && allFinished && this.state === "RACING") {
        this._finishRace();
      }
    }

    // Cập nhật hạt hiệu ứng
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;
      p.size = Math.max(0.5, p.size + p.growth * dt);
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  _finishRace() {
    this.state = "FINISHED";
    this.audio.stopDrumBgm();
    this.audio.playVictory();

    // Bắn pháo hoa ăn mừng
    if (typeof confetti !== "undefined") {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 } });
      }, 500);
    }

    // Hiển thị Lễ trao giải (Podium Modal)
    setTimeout(() => {
      this._showVictoryModal();
    }, 1200);
  }

  _showVictoryModal() {
    const modal = document.getElementById("victory-modal");
    if (!modal) return;

    modal.classList.remove("hidden");

    // Top 1, 2, 3
    const top1 = this.leaderboard[0];
    const top2 = this.leaderboard[1];
    const top3 = this.leaderboard[2];

    const p1El = document.getElementById("podium-1");
    const p2El = document.getElementById("podium-2");
    const p3El = document.getElementById("podium-3");

    if (p1El && top1) {
      p1El.innerHTML = `
        <div class="text-3xl mb-1">${top1.avatar}</div>
        <div class="font-bold text-base text-amber-300 truncate max-w-[120px]">${top1.name}</div>
        <div class="text-xs text-amber-200/80 font-mono">${top1.finishTime.toFixed(2)}s</div>
      `;
    }
    if (p2El && top2) {
      p2El.innerHTML = `
        <div class="text-2xl mb-1">${top2.avatar}</div>
        <div class="font-bold text-sm text-slate-200 truncate max-w-[100px]">${top2.name}</div>
        <div class="text-[11px] text-slate-300 font-mono">${top2.finishTime.toFixed(2)}s</div>
      `;
    } else if (p2El) {
      p2El.innerHTML = `<div class="text-xs text-slate-500">Chưa có</div>`;
    }

    if (p3El && top3) {
      p3El.innerHTML = `
        <div class="text-2xl mb-1">${top3.avatar}</div>
        <div class="font-bold text-sm text-amber-600 truncate max-w-[100px]">${top3.name}</div>
        <div class="text-[11px] text-amber-500 font-mono">${top3.finishTime.toFixed(2)}s</div>
      `;
    } else if (p3El) {
      p3El.innerHTML = `<div class="text-xs text-slate-500">Chưa có</div>`;
    }

    // Chi tiết bảng xếp hạng đầy đủ
    const fullListEl = document.getElementById("victory-full-list");
    if (fullListEl) {
      fullListEl.innerHTML = "";
      this.leaderboard.forEach((boat, idx) => {
        const item = document.createElement("div");
        item.className = "flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs";
        item.innerHTML = `
          <div class="flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-full flex items-center justify-center font-black ${
              idx === 0 ? 'bg-amber-400 text-slate-950' :
              idx === 1 ? 'bg-slate-300 text-slate-950' :
              idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'
            }">${idx + 1}</span>
            <span class="text-base">${boat.avatar}</span>
            <span class="font-bold text-white">${boat.name}</span>
          </div>
          <div class="font-mono text-indigo-300 font-bold">${boat.finishTime.toFixed(2)}s</div>
        `;
        fullListEl.appendChild(item);
      });
    }
  }

  resetToLobby() {
    this.state = "LOBBY";
    document.getElementById("victory-modal").classList.add("hidden");
    document.getElementById("race-screen").classList.add("hidden");
    document.getElementById("lobby-overlay").classList.remove("hidden");
    this._updateLobbyUI();

    this.network.sendToAllPlayers({ type: "BACK_TO_LOBBY" });
  }

  // ==========================================
  // HỆ THỐNG VẼ CANVAS DÒNG SÔNG NẰM NGANG
  // ==========================================
  _renderCanvas() {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    // Xóa khung hình
    ctx.clearRect(0, 0, w, h);

    // 1. Tính toán Camera X (Bám theo nhóm dẫn đầu hoặc góc nhìn rộng)
    const sorted = Array.from(this.players.values()).sort((a, b) => b.x - a.x);
    const leaderX = sorted[0] ? sorted[0].x : 0;

    // Đổi mét sang Pixel trên màn hình
    const trackWidthPixels = w - 180; // Trừ khoảng lề xuất phát & đích
    const scale = trackWidthPixels / this.targetDistance;

    // 2. Vẽ Nền Dòng Sông (River Gradient & Waves)
    const riverGrad = ctx.createLinearGradient(0, 0, 0, h);
    riverGrad.addColorStop(0, "#083344"); // Xanh thẫm đầu bờ
    riverGrad.addColorStop(0.5, "#0e7490"); // Xanh ngọc sông
    riverGrad.addColorStop(1, "#083344"); // Xanh thẫm bờ dưới
    ctx.fillStyle = riverGrad;
    ctx.fillRect(0, 0, w, h);

    // Hiệu ứng sóng nước lấp lánh (Water ripples)
    this.waterOffset += 0.8;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1.5;
    for (let waveY = 20; waveY < h; waveY += 35) {
      ctx.beginPath();
      for (let waveX = 0; waveX < w; waveX += 20) {
        const sine = Math.sin((waveX + this.waterOffset * 20) * 0.03 + waveY * 0.1) * 3;
        if (waveX === 0) ctx.moveTo(waveX, waveY + sine);
        else ctx.lineTo(waveX, waveY + sine);
      }
      ctx.stroke();
    }

    // 3. Phân chia Làn đua phương ngang (Lanes)
    const totalLanes = Math.max(1, this.players.size);
    const laneHeight = h / totalLanes;

    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 1;
    for (let i = 1; i < totalLanes; i++) {
      const ly = i * laneHeight;
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(w, ly);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 4. Vạch Xuất Phát (Start Line - X = 80px)
    const startX = 80;
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillRect(startX, 0, 4, h);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("XUẤT PHÁT", startX - 25, 18);

    // 5. Cột mốc cự ly (Distance markers: 100m, 200m, 300m...)
    const markerStep = this.targetDistance <= 500 ? 100 : 250;
    for (let dist = markerStep; dist < this.targetDistance; dist += markerStep) {
      const mx = startX + dist * scale;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mx, 0);
      ctx.lineTo(mx, h);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "10px monospace";
      ctx.fillText(`${dist}m`, mx - 10, h - 8);
    }

    // 6. Vạch Đích (Finish Line - Caro Cờ Đua)
    const finishX = startX + this.targetDistance * scale;
    this._renderFinishLine(ctx, finishX, 0, 16, h);

    // 7. Vẽ Hạt hiệu ứng bọt nước (Particles)
    this.particles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // 8. Vẽ Từng Chiếc Thuyền Theo Làn
    this.players.forEach((boat) => {
      boat.y = boat.lane * laneHeight + laneHeight / 2;
      const screenX = startX + boat.x * scale;

      this._renderBoat(ctx, boat, screenX, boat.y, laneHeight);
    });
  }

  _renderFinishLine(ctx, x, y, width, height) {
    const squareSize = 8;
    const rows = Math.ceil(height / squareSize);
    const cols = Math.ceil(width / squareSize);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? "#ffffff" : "#0f172a";
        ctx.fillRect(x + c * squareSize, y + r * squareSize, squareSize, squareSize);
      }
    }

    // Biển ĐÍCH
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(x - 10, 0, 36, 20);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("ĐÍCH", x - 6, 14);
  }

  _renderBoat(ctx, boat, x, y, laneHeight) {
    ctx.save();
    ctx.translate(x, y);

    // Hiệu ứng bọt rẽ sóng 2 bên mũi thuyền
    if (boat.speed > 0.5) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(-25, -12);
      ctx.moveTo(15, 0);
      ctx.lineTo(-25, 12);
      ctx.stroke();
    }

    // 1. Thân Thuyền (Boat Hull - Kiểu dáng Thuyền Rồng / Ca-nô thể thao)
    ctx.fillStyle = boat.color;
    ctx.beginPath();
    // Mũi thuyền nhọn bên phải (hướng phương ngang sang phải)
    ctx.moveTo(25, 0);
    ctx.quadraticCurveTo(10, -11, -30, -9);
    ctx.lineTo(-35, 0);
    ctx.lineTo(-30, 9);
    ctx.quadraticCurveTo(10, 11, 25, 0);
    ctx.closePath();
    ctx.fill();

    // Viền mép thuyền
    ctx.strokeStyle = boat.secondaryColor || "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Lòng thuyền
    ctx.fillStyle = "rgba(15, 23, 42, 0.4)";
    ctx.beginPath();
    ctx.ellipse(-8, 0, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Mái Chèo Trái & Phải (Animated Oars)
    const oarLen = 22;

    // Mái chèo trên (Trái)
    ctx.save();
    ctx.translate(-5, -6);
    ctx.rotate(-0.5 + boat.oarAngleL);
    ctx.fillStyle = "#d97706";
    ctx.fillRect(-2, -oarLen, 4, oarLen);
    // Lá chèo
    ctx.fillStyle = boat.color;
    ctx.fillRect(-4, -oarLen, 8, 8);
    ctx.restore();

    // Mái chèo dưới (Phải)
    ctx.save();
    ctx.translate(-5, 6);
    ctx.rotate(0.5 - boat.oarAngleR);
    ctx.fillStyle = "#d97706";
    ctx.fillRect(-2, 0, 4, oarLen);
    // Lá chèo
    ctx.fillStyle = boat.color;
    ctx.fillRect(-4, oarLen - 8, 8, 8);
    ctx.restore();

    // 3. Avatar & Tên Người Chơi
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(boat.avatar, -8, 0);

    // Tên & Thứ hạng nổi phía trên thuyền
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px sans-serif";
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 4;
    ctx.fillText(boat.name, -5, -20);
    ctx.shadowBlur = 0;

    // Huy hiệu Combo hoặc Về đích
    if (boat.isFinished) {
      ctx.fillStyle = "#fbbf24";
      ctx.font = "black 12px sans-serif";
      ctx.fillText(`🏆 HẠNG ${boat.rank}`, 35, 0);
    } else if (boat.combo >= 5) {
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText(`🔥 x${boat.combo}`, 35, 0);
    }

    ctx.restore();
  }

  // ==========================================
  // HỆ THỐNG HẠT NƯỚC (PARTICLES & WAKES)
  // ==========================================
  _createWakeParticle(boat) {
    const startX = 80;
    const trackWidthPixels = this.canvas.width - 180;
    const scale = trackWidthPixels / this.targetDistance;
    const px = startX + boat.x * scale - 35;
    const py = boat.y + (Math.random() * 8 - 4);

    this.particles.push({
      x: px,
      y: py,
      vx: -(boat.speed * 8 + Math.random() * 10),
      vy: Math.random() * 6 - 3,
      size: 2 + Math.random() * 3,
      growth: 3,
      alpha: 0.6,
      decay: 1.2,
      color: "rgba(255, 255, 255, 0.7)"
    });
  }

  _createSplash(meterX, py, color, count = 10) {
    const startX = 80;
    const trackWidthPixels = this.canvas ? this.canvas.width - 180 : 600;
    const scale = trackWidthPixels / this.targetDistance;
    const px = startX + meterX * scale;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 60;
      this.particles.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        growth: -1,
        alpha: 0.9,
        decay: 1.8,
        color: color || "#38bdf8"
      });
    }
  }
}

if (typeof window !== "undefined") {
  window.BoatHostGame = BoatHostGame;
}
