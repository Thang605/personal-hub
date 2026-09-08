/**
 * Boat Race Mobile Player Controller
 * Bộ điều khiển trên điện thoại: Tối ưu cảm ứng siêu nhạy cho 2 nút chèo Trái/Phải
 * Thuật toán phát hiện chèo luân phiên, tính nhịp chèo (BPM), Combo Nitro & Rung xúc giác
 */

class BoatPlayerApp {
  constructor() {
    this.network = new BoatNetwork();
    this.audio = new BoatAudio();

    // Player State
    this.pin = this._getUrlParam("pin") || "";
    this.name = localStorage.getItem("boat_player_name") || "Tay Chèo " + Math.floor(Math.random() * 900 + 100);
    this.avatar = localStorage.getItem("boat_player_avatar") || "🚣‍♂️";
    this.color = localStorage.getItem("boat_player_color") || "#3b82f6";

    // Race Tracking
    this.gameState = "JOIN"; // JOIN, LOBBY, COUNTDOWN, RACING, FINISHED
    this.targetDistance = 500;
    this.currentDistance = 0;
    this.currentSpeed = 0;
    this.currentRank = "-";
    this.totalPlayers = 1;

    // Stroke Mechanics
    this.lastStrokeSide = null; // 'L' hoặc 'R'
    this.lastStrokeTime = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.totalStrokes = 0;
    this.stumbleCount = 0;
    this.strokeTimestamps = [];
    this.nitroEnergy = 0; // 0 -> 100%
  }

  _getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  init() {
    // Tự động điền PIN nếu có trên URL
    const pinInput = document.getElementById("player-pin-input");
    const nameInput = document.getElementById("player-name-input");
    if (pinInput && this.pin) pinInput.value = this.pin;
    if (nameInput) nameInput.value = this.name;

    this._setupAvatarPicker();
    this._setupNetworkListeners();
    this._setupPaddleControls();

    // Nếu đã có sẵn PIN thì tự động kết nối nếu người chơi bấm tham gia
    if (this.pin && pinInput) {
      pinInput.value = this.pin;
    }
  }

  _setupAvatarPicker() {
    const avatars = ["🚣‍♂️", "🚣‍♀️", "⚡", "🐉", "🦈", "🔥", "🦅", "🚀", "👑", "🎯"];
    const container = document.getElementById("avatar-picker-container");
    if (!container) return;

    container.innerHTML = "";
    avatars.forEach((av) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `w-11 h-11 rounded-2xl text-xl flex items-center justify-center transition ${
        this.avatar === av ? "bg-indigo-600 ring-2 ring-indigo-400 scale-110" : "bg-slate-800 hover:bg-slate-700"
      }`;
      btn.innerText = av;
      btn.onclick = () => {
        this.avatar = av;
        localStorage.setItem("boat_player_avatar", av);
        this._setupAvatarPicker();
      };
      container.appendChild(btn);
    });
  }

  joinGame() {
    const pinInput = document.getElementById("player-pin-input");
    const nameInput = document.getElementById("player-name-input");

    this.pin = pinInput ? pinInput.value.trim() : "";
    this.name = nameInput ? nameInput.value.trim() : "Tay Chèo";

    if (!this.pin) {
      alert("Vui lòng nhập mã PIN phòng!");
      return;
    }

    localStorage.setItem("boat_player_name", this.name);
    localStorage.setItem("boat_player_color", this.color);

    // Bắt đầu kết nối mạng
    this.network.initPlayer(this.pin, {
      name: this.name,
      avatar: this.avatar,
      color: this.color
    });

    this.playerId = this.network.playerId;
    this._switchView("LOBBY");
  }

  // ==========================================
  // LẮNG NGHE MẠNG TỪ HOST
  // ==========================================
  _setupNetworkListeners() {
    this.network.on("countdown_start", (msg) => {
      this.targetDistance = msg.targetDistance || 500;
      this._switchView("COUNTDOWN");
      this._updateCountdown(msg.countdown || 3);
      this.audio.playCountdownBeep(false);
      this._vibrate(100);
    });

    this.network.on("countdown_tick", (msg) => {
      this._updateCountdown(msg.countdown);
      this.audio.playCountdownBeep(false);
      this._vibrate(100);
    });

    this.network.on("race_start", () => {
      this.gameState = "RACING";
      this._switchView("RACING");
      this._resetRaceStats();
      this.audio.playCountdownBeep(true);
      this._vibrate([150, 50, 150]);
    });

    this.network.on("sync_race", (msg) => {
      if (this.gameState !== "RACING" && this.gameState !== "FINISHED") {
        this.gameState = "RACING";
        this._switchView("RACING");
      }
      this.currentDistance = msg.distance;
      this.currentSpeed = msg.speed;
      this.currentRank = msg.rank;
      this.totalPlayers = msg.totalPlayers;
      this._updateRaceHud();
    });

    this.network.on("race_finished", (msg) => {
      this.gameState = "FINISHED";
      this._switchView("FINISHED");
      this._showFinishedResult(msg);
      this.audio.playVictory();
      this._vibrate([200, 100, 200, 100, 400]);
    });

    this.network.on("back_to_lobby", () => {
      this.gameState = "LOBBY";
      this._switchView("LOBBY");
    });
  }

  // ==========================================
  // XỬ LÝ NÚT CHÈO TRÁI / PHẢI (ERGONOMIC PADDLES)
  // ==========================================
  _setupPaddleControls() {
    const leftBtn = document.getElementById("paddle-left-btn");
    const rightBtn = document.getElementById("paddle-right-btn");
    const boostBtn = document.getElementById("nitro-boost-btn");

    if (leftBtn) this._bindPaddleEvents(leftBtn, "L");
    if (rightBtn) this._bindPaddleEvents(rightBtn, "R");

    if (boostBtn) {
      boostBtn.addEventListener("click", () => this.activateNitro());
      boostBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        this.activateNitro();
      });
    }

    // Hỗ trợ cả phím bàn phím (Phím Mũi tên Trái / Phải hoặc A / D)
    window.addEventListener("keydown", (e) => {
      if (this.gameState !== "RACING") return;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        this._handleStroke("L");
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        this._handleStroke("R");
      } else if (e.key === " " || e.key === "Enter") {
        this.activateNitro();
      }
    });
  }

  _bindPaddleEvents(element, side) {
    const trigger = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      this._handleStroke(side);
      this._animatePaddlePress(element);
    };

    // Tối ưu Touchstart cho điện thoại di động (Không độ trễ 300ms)
    element.addEventListener("touchstart", trigger, { passive: false });
    element.addEventListener("mousedown", trigger);
  }

  _animatePaddlePress(element) {
    element.classList.add("scale-95", "brightness-125");
    setTimeout(() => {
      element.classList.remove("scale-95", "brightness-125");
    }, 90);
  }

  _handleStroke(side) {
    if (this.gameState !== "RACING") return;

    const now = performance.now();
    this.totalStrokes++;

    // 1. Kiểm tra chèo luân phiên (Trái -> Phải -> Trái -> Phải)
    const isAlternating = this.lastStrokeSide !== side;
    this.lastStrokeSide = side;

    if (isAlternating) {
      // ✅ Chèo đúng nhịp
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;

      // Năng lượng Nitro tăng
      this.nitroEnergy = Math.min(100, this.nitroEnergy + 4);

      // Tính nhịp chèo BPM
      this.strokeTimestamps.push(now);
      if (this.strokeTimestamps.length > 8) this.strokeTimestamps.shift();
      const bpm = this._calculateBpm();

      // Âm thanh & rung nhẹ
      this.audio.playSplash(0.8 + Math.min(0.5, this.combo * 0.05));
      this._vibrate(40);

      // Gửi gói tin tức thì lên Host
      this.network.sendToHost({
        type: "STROKE",
        playerId: this.network.playerId || this.playerId,
        side: side,
        power: 1.0,
        combo: this.combo,
        bpm: bpm
      });

      this._showStrokeFeedback(side, "PERFECT", `🔥 Combo x${this.combo}`);
    } else {
      // ⚠️ Bấm lệch tay (Trùng bên 2 lần)
      this.combo = 0;
      this.stumbleCount++;
      this.nitroEnergy = Math.max(0, this.nitroEnergy - 15);

      this.audio.playStumble();
      this._vibrate([100, 60, 100]);

      this.network.sendToHost({
        type: "STROKE",
        playerId: this.network.playerId || this.playerId,
        side: side,
        power: 0.2,
        combo: 0
      });

      this._showStrokeFeedback(side, "STUMBLE", "LỆCH TAY! Chèo bên kia");
    }

    this._updatePlayerControlsUI();
  }

  _calculateBpm() {
    if (this.strokeTimestamps.length < 2) return 0;
    const first = this.strokeTimestamps[0];
    const last = this.strokeTimestamps[this.strokeTimestamps.length - 1];
    const durationMin = (last - first) / 1000 / 60;
    if (durationMin <= 0) return 0;
    return Math.round((this.strokeTimestamps.length - 1) / durationMin);
  }

  activateNitro() {
    if (this.gameState !== "RACING" || this.nitroEnergy < 60) return;

    this.nitroEnergy = 0;
    this.audio.playBoost();
    this._vibrate([80, 40, 80, 40, 150]);

    this.network.sendToHost({
      type: "BOOST",
      playerId: this.network.playerId || this.playerId,
      boostMultiplier: 2.0
    });

    this._showStrokeFeedback("BOTH", "BOOST", "⚡ TĂNG TỐC TỐI ĐA! ⚡");
    this._updatePlayerControlsUI();
  }

  _showStrokeFeedback(side, type, text) {
    const feedbackEl = document.getElementById("stroke-feedback-text");
    const indicatorL = document.getElementById("indicator-left");
    const indicatorR = document.getElementById("indicator-right");

    if (indicatorL && indicatorR) {
      if (side === "L") {
        indicatorL.classList.add("bg-indigo-500", "scale-110");
        indicatorR.classList.remove("bg-indigo-500", "scale-110");
      } else if (side === "R") {
        indicatorR.classList.add("bg-indigo-500", "scale-110");
        indicatorL.classList.remove("bg-indigo-500", "scale-110");
      }
    }

    if (feedbackEl) {
      feedbackEl.innerText = text;
      if (type === "PERFECT") {
        feedbackEl.className = "text-center text-sm font-black text-cyan-400 animate-pulse";
      } else if (type === "STUMBLE") {
        feedbackEl.className = "text-center text-sm font-black text-rose-500 animate-bounce";
      } else if (type === "BOOST") {
        feedbackEl.className = "text-center text-base font-black text-amber-300 animate-pulse";
      }
    }
  }

  _updatePlayerControlsUI() {
    // Thanh năng lượng Nitro
    const nitroBar = document.getElementById("nitro-progress-bar");
    const nitroBtn = document.getElementById("nitro-boost-btn");
    if (nitroBar) nitroBar.style.width = `${this.nitroEnergy}%`;
    if (nitroBtn) {
      if (this.nitroEnergy >= 60) {
        nitroBtn.classList.remove("opacity-40", "pointer-events-none");
        nitroBtn.classList.add("animate-bounce", "shadow-amber-500/50");
      } else {
        nitroBtn.classList.add("opacity-40", "pointer-events-none");
        nitroBtn.classList.remove("animate-bounce", "shadow-amber-500/50");
      }
    }
  }

  _updateRaceHud() {
    const rankEl = document.getElementById("hud-rank-display");
    const distEl = document.getElementById("hud-distance-display");
    const speedEl = document.getElementById("hud-speed-display");
    const progBar = document.getElementById("hud-progress-bar");

    if (rankEl) rankEl.innerText = `#${this.currentRank}`;
    if (distEl) distEl.innerText = `${this.currentDistance}m / ${this.targetDistance}m`;
    if (speedEl) speedEl.innerText = `${this.currentSpeed} km/h`;

    if (progBar) {
      const pct = Math.min(100, Math.round((this.currentDistance / this.targetDistance) * 100));
      progBar.style.width = `${pct}%`;
    }
  }

  _resetRaceStats() {
    this.currentDistance = 0;
    this.currentSpeed = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.totalStrokes = 0;
    this.stumbleCount = 0;
    this.nitroEnergy = 0;
    this.lastStrokeSide = null;
    this.strokeTimestamps = [];
    this._updatePlayerControlsUI();
    this._updateRaceHud();
  }

  _updateCountdown(num) {
    const el = document.getElementById("player-countdown-display");
    if (el) el.innerText = num > 0 ? num : "XUẤT PHÁT!";
  }

  _showFinishedResult(msg) {
    const rankEl = document.getElementById("result-rank-display");
    const timeEl = document.getElementById("result-time-display");
    const statsEl = document.getElementById("result-stats-display");

    if (rankEl) {
      rankEl.innerHTML = `
        <div class="text-5xl mb-2">${msg.rank === 1 ? '🥇' : msg.rank === 2 ? '🥈' : msg.rank === 3 ? '🥉' : '🎖️'}</div>
        <div class="text-2xl font-black text-white">HẠNG ${msg.rank}</div>
      `;
    }

    if (timeEl) timeEl.innerText = `${msg.finishTime} giây`;

    if (statsEl) {
      statsEl.innerHTML = `
        <div>Tổng số nhịp chèo: <b>${this.totalStrokes}</b></div>
        <div>Combo nhịp dài nhất: <b>${this.maxCombo}</b></div>
        <div>Lệch tay chèo: <b>${this.stumbleCount} lần</b></div>
      `;
    }
  }

  _vibrate(pattern) {
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }

  // ==========================================
  // QUẢN LÝ VIEW GIAO DIỆN
  // ==========================================
  _switchView(viewName) {
    const views = {
      JOIN: document.getElementById("view-join"),
      LOBBY: document.getElementById("view-lobby"),
      COUNTDOWN: document.getElementById("view-countdown"),
      RACING: document.getElementById("view-racing"),
      FINISHED: document.getElementById("view-finished")
    };

    Object.keys(views).forEach((k) => {
      if (views[k]) {
        if (k === viewName) views[k].classList.remove("hidden");
        else views[k].classList.add("hidden");
      }
    });

    if (viewName === "LOBBY") {
      const pName = document.getElementById("lobby-player-name");
      const pAv = document.getElementById("lobby-player-avatar");
      if (pName) pName.innerText = this.name;
      if (pAv) pAv.innerText = this.avatar;
    }
  }
}

if (typeof window !== "undefined") {
  window.BoatPlayerApp = BoatPlayerApp;
}
