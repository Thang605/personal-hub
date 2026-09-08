/**
 * Player Game Controller (Giao Diện Người Chơi Trên Điện Thoại)
 * Tối ưu hóa cảm ứng mobile, gửi lựa chọn thời gian thực, phản hồi rung và âm thanh.
 */

class PlayerController {
  constructor() {
    this.network = new PeerNetwork();
    this.playerId = "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);
    this.playerInfo = {
      id: this.playerId,
      name: "",
      avatar: "🚀"
    };
    this.pin = "";
    this.gameState = "join"; // join, lobby, question, answered, result, podium
    this.currentQuestion = null;
    this.myVote = null;
    this.timerInterval = null;
    this.timeRemaining = 0;
    this.totalTime = 15;
    this.myScore = 0;
    this.myRank = 0;
    this.streak = 0;
  }

  init() {
    // Tự động nhận diện mã PIN từ URL (khi quét QR code)
    const urlParams = new URLSearchParams(window.location.search);
    const pinParam = urlParams.get("pin") || urlParams.get("room");
    if (pinParam) {
      this.pin = pinParam;
    }

    // Đọc thông tin đã lưu trước đó nếu có
    const savedName = localStorage.getItem("phub_player_name") || "";
    const savedAvatar = localStorage.getItem("phub_player_avatar") || "🚀";
    this.playerInfo.name = savedName;
    this.playerInfo.avatar = savedAvatar;

    this.renderJoinScreen();
    this.setupNetworkListeners();
  }

  setupNetworkListeners() {
    // Khi nhận câu hỏi mới từ Host
    this.network.on("question_start", (data) => {
      this.handleQuestionStart(data);
    });

    // Khi hết giờ từ Host
    this.network.on("time_up", (data) => {
      this.handleTimeUp(data);
    });

    // Khi kết thúc game
    this.network.on("game_over", (data) => {
      this.handleGameOver(data);
    });

    // Khi mất kết nối
    this.network.on("host_disconnected", () => {
      alert("Mất kết nối tới máy chủ Quản trò!");
      this.gameState = "join";
      this.renderJoinScreen();
    });
  }

  // ==========================================
  // 1. MÀN HÌNH NHẬP PIN & NICKNAME
  // ==========================================
  renderJoinScreen() {
    this.gameState = "join";
    const container = document.getElementById("player-app");
    if (!container) return;

    const avatars = ["🚀", "⚡", "🔥", "🦊", "🐯", "🦁", "🐼", "🦄", "🤖", "🎯", "👑", "💎"];

    container.innerHTML = `
      <div class="min-h-screen flex flex-col justify-between p-4 bg-game-dark bg-game-glow text-white">
        <!-- Header -->
        <header class="text-center pt-4 space-y-1">
          <div class="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-pink-500 items-center justify-center shadow-lg shadow-indigo-500/30">
            <i data-lucide="gamepad-2" class="w-6 h-6 text-white"></i>
          </div>
          <h1 class="text-2xl font-black tracking-tight">QUIZ LIVE SHOW</h1>
          <p class="text-xs text-indigo-300">Tham gia phòng & thi đấu trực tiếp</p>
        </header>

        <!-- Join Form Card -->
        <main class="max-w-md mx-auto w-full my-auto py-6">
          <div class="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl border-indigo-500/30">
            <form onsubmit="playerApp.submitJoin(event)" class="space-y-4">
              
              <!-- PIN Input -->
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">Mã PIN Phòng</label>
                <input 
                  type="number" 
                  id="input-pin" 
                  required 
                  value="${this.pin}" 
                  placeholder="Nhập 6 số PIN..." 
                  class="w-full text-center text-2xl md:text-3xl font-black tracking-widest text-indigo-300 py-3 bg-slate-900/90 border border-slate-700 rounded-2xl focus:outline-hidden focus:border-indigo-500 font-mono" />
              </div>

              <!-- Nickname Input -->
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">Biệt Danh / Tên Của Bạn</label>
                <input 
                  type="text" 
                  id="input-name" 
                  required 
                  maxlength="20"
                  value="${this.playerInfo.name}" 
                  placeholder="Ví dụ: Hoàng Anh..." 
                  class="w-full text-center text-lg font-bold text-white py-3 bg-slate-900/90 border border-slate-700 rounded-2xl focus:outline-hidden focus:border-indigo-500" />
              </div>

              <!-- Avatar Selector -->
              <div class="space-y-2">
                <label class="block text-xs font-bold text-slate-300 text-center uppercase tracking-wider">Chọn Biểu Tượng Avatar</label>
                <div class="grid grid-cols-6 gap-2 pt-1">
                  ${avatars.map((av) => `
                    <button 
                      type="button" 
                      onclick="playerApp.selectAvatar('${av}')" 
                      class="avatar-opt-btn p-2 rounded-2xl text-2xl flex items-center justify-center transition border ${this.playerInfo.avatar === av ? 'bg-indigo-600 border-indigo-400 scale-110 shadow-lg' : 'bg-slate-800/80 border-slate-700 hover:bg-slate-700'}">
                      ${av}
                    </button>
                  `).join("")}
                </div>
              </div>

              <!-- Submit Button -->
              <button 
                type="submit" 
                id="btn-join" 
                class="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-500/30 transition transform active:scale-95 flex items-center justify-center gap-2">
                <i data-lucide="log-in" class="w-5 h-5"></i>
                <span>Vào Phòng Chơi</span>
              </button>
            </form>
          </div>
        </main>

        <!-- Footer -->
        <footer class="text-center text-[11px] text-slate-500 pb-2">
          Kết nối WebRTC P2P không cần đăng nhập tài khoản
        </footer>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  }

  selectAvatar(av) {
    this.playerInfo.avatar = av;
    document.querySelectorAll(".avatar-opt-btn").forEach((btn) => {
      if (btn.textContent.trim() === av) {
        btn.className = "avatar-opt-btn p-2 rounded-2xl text-2xl flex items-center justify-center transition border bg-indigo-600 border-indigo-400 scale-110 shadow-lg";
      } else {
        btn.className = "avatar-opt-btn p-2 rounded-2xl text-2xl flex items-center justify-center transition border bg-slate-800/80 border-slate-700 hover:bg-slate-700";
      }
    });
  }

  submitJoin(e) {
    e.preventDefault();
    const pin = document.getElementById("input-pin").value.trim();
    const name = document.getElementById("input-name").value.trim();

    if (!pin || !name) return;

    this.pin = pin;
    this.playerInfo.name = name;

    // Lưu vào LocalStorage
    localStorage.setItem("phub_player_name", name);
    localStorage.setItem("phub_player_avatar", this.playerInfo.avatar);

    const btn = document.getElementById("btn-join");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i data-lucide="loader" class="w-5 h-5 animate-spin"></i><span>Đang kết nối...</span>`;
      if (window.lucide) lucide.createIcons();
    }

    // Kết nối tới Host
    this.network.initPlayer(this.pin, this.playerInfo);
    this.renderLobbyScreen();
  }

  // ==========================================
  // 2. SẢNH CHỜ (LOBBY - ĐÃ VÀO PHÒNG)
  // ==========================================
  renderLobbyScreen() {
    this.gameState = "lobby";
    const container = document.getElementById("player-app");
    if (!container) return;

    container.innerHTML = `
      <div class="min-h-screen flex flex-col justify-between p-4 bg-game-dark bg-game-glow text-white text-center">
        <!-- Top Status -->
        <header class="pt-4 flex items-center justify-between max-w-md mx-auto w-full">
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Đã kết nối
          </span>
          <span class="text-xs font-mono font-bold text-slate-400">PIN: ${this.pin}</span>
        </header>

        <!-- Center Waiting Card -->
        <main class="max-w-md mx-auto w-full my-auto py-8 space-y-6">
          <div class="relative inline-block">
            <div class="w-28 h-28 rounded-full bg-indigo-600/20 border-2 border-indigo-400/50 flex items-center justify-center text-6xl shadow-2xl shadow-indigo-500/40 animate-pulse">
              ${this.playerInfo.avatar}
            </div>
            <div class="absolute -bottom-1 -right-1 p-2 rounded-full bg-emerald-500 text-white shadow-lg">
              <i data-lucide="check" class="w-4 h-4"></i>
            </div>
          </div>

          <div class="space-y-2">
            <h2 class="text-2xl font-black text-white">${this.playerInfo.name}</h2>
            <p class="text-sm font-semibold text-indigo-300">Bạn đã sẵn sàng tham chiến!</p>
          </div>

          <div class="glass-panel p-5 rounded-2xl text-xs text-slate-400 space-y-2">
            <p class="font-medium">Hãy nhìn lên màn hình máy chiếu của Quản trò.</p>
            <p class="text-[11px] text-slate-500">Khi trò chơi bắt đầu, các nút bấm lựa chọn sẽ xuất hiện tức thì trên màn hình điện thoại của bạn.</p>
          </div>
        </main>

        <!-- Footer -->
        <footer class="text-[11px] text-slate-500 pb-2">
          Sẵn sàng phản xạ siêu tốc để giành điểm cao nhất!
        </footer>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  }

  // ==========================================
  // 3. MÀN HÌNH TRẢ LỜI CÂU HỎI (4 NÚT MÀU CẢM ỨNG)
  // ==========================================
  handleQuestionStart(data) {
    this.gameState = "question";
    this.currentQuestion = data;
    this.myVote = null;
    this.totalTime = data.timeLimit || 15;
    this.timeRemaining = this.totalTime;

    // Rung điện thoại báo hiệu câu hỏi mới
    if (navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
    }

    this.renderQuestionScreen();
    this.startCountdown();
  }

  startCountdown() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;

      const timerBar = document.getElementById("player-timer-bar");
      const timerSec = document.getElementById("player-timer-sec");

      if (timerSec) timerSec.textContent = this.timeRemaining;
      if (timerBar) {
        const pct = (this.timeRemaining / this.totalTime) * 100;
        timerBar.style.width = `${pct}%`;
      }

      if (this.timeRemaining <= 0) {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  renderQuestionScreen() {
    const container = document.getElementById("player-app");
    if (!container) return;

    const q = this.currentQuestion;

    container.innerHTML = `
      <div class="min-h-screen flex flex-col justify-between p-3 sm:p-4 bg-game-dark bg-game-glow text-white select-none">
        
        <!-- Header Info -->
        <header class="space-y-2 max-w-lg mx-auto w-full">
          <div class="flex items-center justify-between text-xs font-bold text-slate-300">
            <span class="px-3 py-1 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
              Câu ${q.questionIndex + 1} / ${q.totalQuestions}
            </span>
            <div class="flex items-center gap-1.5 text-amber-400 font-mono text-sm font-black">
              <i data-lucide="timer" class="w-4 h-4"></i>
              <span id="player-timer-sec">${this.timeRemaining}</span>s
            </div>
            <span class="font-mono text-indigo-300">${this.myScore} pts</span>
          </div>

          <!-- Timer Bar -->
          <div class="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div id="player-timer-bar" class="h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full transition-all duration-1000 ease-linear" style="width: 100%;"></div>
          </div>
        </header>

        <!-- Question Preview (Thu gọn) -->
        <div class="my-2 max-w-lg mx-auto w-full text-center px-2">
          <h3 class="text-sm sm:text-base font-bold text-slate-200 line-clamp-2">${q.question}</h3>
        </div>

        <!-- 4 Big Choice Buttons -->
        <main class="max-w-lg mx-auto w-full my-auto grid grid-cols-2 gap-3 sm:gap-4 p-1">
          
          <!-- Nút A - Đỏ / Tam Giác -->
          <button 
            id="choice-btn-0" 
            onclick="playerApp.submitAnswer(0)" 
            class="btn-choice-a h-32 sm:h-40 rounded-3xl flex flex-col items-center justify-center p-3 text-white transition active:scale-95 shadow-xl">
            <div class="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-1 text-xl font-black">
              ▲
            </div>
            <span class="text-xs sm:text-sm font-black text-center line-clamp-2">${q.choices[0]}</span>
          </button>

          <!-- Nút B - Xanh / Hình Thoi -->
          <button 
            id="choice-btn-1" 
            onclick="playerApp.submitAnswer(1)" 
            class="btn-choice-b h-32 sm:h-40 rounded-3xl flex flex-col items-center justify-center p-3 text-white transition active:scale-95 shadow-xl">
            <div class="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-1 text-xl font-black">
              ◆
            </div>
            <span class="text-xs sm:text-sm font-black text-center line-clamp-2">${q.choices[1]}</span>
          </button>

          <!-- Nút C - Vàng / Tròn -->
          <button 
            id="choice-btn-2" 
            onclick="playerApp.submitAnswer(2)" 
            class="btn-choice-c h-32 sm:h-40 rounded-3xl flex flex-col items-center justify-center p-3 text-amber-950 transition active:scale-95 shadow-xl">
            <div class="w-10 h-10 rounded-2xl bg-black/15 flex items-center justify-center mb-1 text-xl font-black">
              ●
            </div>
            <span class="text-xs sm:text-sm font-black text-center line-clamp-2">${q.choices[2]}</span>
          </button>

          <!-- Nút D - Xanh Lá / Vuông -->
          <button 
            id="choice-btn-3" 
            onclick="playerApp.submitAnswer(3)" 
            class="btn-choice-d h-32 sm:h-40 rounded-3xl flex flex-col items-center justify-center p-3 text-white transition active:scale-95 shadow-xl">
            <div class="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-1 text-xl font-black">
              ■
            </div>
            <span class="text-xs sm:text-sm font-black text-center line-clamp-2">${q.choices[3]}</span>
          </button>

        </main>

        <!-- Status Message when Voted -->
        <div id="vote-feedback" class="text-center text-xs text-slate-400 py-1 font-semibold">
          Chạm vào 1 ô màu để chọn đáp án
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  }

  // =========================================================================
  // GỬI LỰA CHỌN THỜI GIAN THỰC KHI CHƯA HẾT GIỜ (LIVE VOTE)
  // =========================================================================
  submitAnswer(choiceIdx) {
    if (this.myVote !== null) return; // Đã chọn rồi

    this.myVote = choiceIdx;

    // Rung nhẹ phản hồi
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    // Âm thanh bấm
    window.soundEffects.playClick();

    // Gửi tín hiệu LIVE_VOTE về Host ngay lập tức
    this.network.sendToHost({
      type: "LIVE_VOTE",
      playerId: this.playerId,
      choiceIndex: choiceIdx,
      timestamp: Date.now()
    });

    // Làm mờ 3 nút còn lại, làm nổi bật nút đã chọn
    for (let i = 0; i < 4; i++) {
      const btn = document.getElementById(`choice-btn-${i}`);
      if (btn) {
        if (i === choiceIdx) {
          btn.classList.add("ring-4", "ring-white", "scale-105");
        } else {
          btn.classList.add("opacity-30", "grayscale-[60%]");
          btn.disabled = true;
        }
      }
    }

    const feedback = document.getElementById("vote-feedback");
    if (feedback) {
      feedback.innerHTML = `
        <span class="inline-flex items-center gap-1.5 text-emerald-400 font-bold animate-pulse">
          <i data-lucide="check-circle" class="w-4 h-4"></i>
          Đã gửi lựa chọn! Đang chờ Quản trò công bố kết quả...
        </span>
      `;
      if (window.lucide) lucide.createIcons();
    }
  }

  // ==========================================
  // 4. MÀN HÌNH KẾT QUẢ CÂU HỎI (ĐÚNG / SAI)
  // ==========================================
  handleTimeUp(data) {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.gameState = "result";
    const correctIdx = data.correctIndex;
    const isCorrect = this.myVote === correctIdx;

    // Tìm thông tin điểm của bản thân trong leaderboard
    const myData = data.leaderboard?.find((p) => p.id === this.playerId);
    if (myData) {
      this.myScore = myData.score;
      this.myRank = myData.rank;
      this.streak = myData.streak;
    }

    if (isCorrect) {
      window.soundEffects.playCorrect();
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } else {
      window.soundEffects.playWrong();
      if (navigator.vibrate) navigator.vibrate([200]);
    }

    const container = document.getElementById("player-app");
    if (!container) return;

    const optLabels = ["A", "B", "C", "D"];

    container.innerHTML = `
      <div class="min-h-screen flex flex-col justify-between p-4 bg-game-dark bg-game-glow text-white text-center">
        <!-- Top Stats -->
        <header class="flex items-center justify-between max-w-md mx-auto w-full pt-2">
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            Hạng #${this.myRank || "-"}
          </span>
          <span class="text-sm font-black text-indigo-300 font-mono">${this.myScore.toLocaleString()} PTS</span>
        </header>

        <!-- Result Card -->
        <main class="max-w-md mx-auto w-full my-auto py-6 space-y-6">
          <div class="p-8 rounded-3xl ${isCorrect ? 'bg-emerald-950/80 border-2 border-emerald-500/80' : 'bg-rose-950/80 border-2 border-rose-500/80'} shadow-2xl space-y-4">
            
            <div class="text-6xl animate-bounce">
              ${isCorrect ? "🎉" : "😢"}
            </div>

            <div class="space-y-1">
              <h2 class="text-2xl sm:text-3xl font-black ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}">
                ${isCorrect ? "CHÍNH XÁC!" : "CHƯA ĐÚNG RỒI!"}
              </h2>
              <p class="text-xs text-slate-300">
                ${isCorrect ? `+${myData?.lastScoreGain || 1000} điểm thưởng!` : `Đáp án đúng là: Phương án ${optLabels[correctIdx]}`}
              </p>
            </div>

            ${this.streak > 1 ? `
              <div class="inline-block px-4 py-1.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                🔥 Chuỗi đúng x${this.streak} liên tiếp!
              </div>
            ` : ""}
          </div>

          <!-- Explanation -->
          ${data.explanation ? `
            <div class="glass-panel p-4 rounded-2xl text-xs text-slate-300 text-left leading-relaxed">
              <span class="font-bold text-indigo-300 block mb-1">💡 Giải thích:</span>
              ${data.explanation}
            </div>
          ` : ""}
        </main>

        <!-- Footer -->
        <footer class="text-xs text-slate-400 pb-2">
          Hãy nhìn lên màn hình Quản trò để xem bảng xếp hạng
        </footer>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  }

  // ==========================================
  // 5. MÀN HÌNH KẾT THÚC GAME
  // ==========================================
  handleGameOver(data) {
    this.gameState = "podium";
    const podium = data.podium || [];
    const isTop3 = podium.some((p) => p.id === this.playerId);

    const container = document.getElementById("player-app");
    if (!container) return;

    container.innerHTML = `
      <div class="min-h-screen flex flex-col justify-between p-4 bg-game-dark bg-game-glow text-white text-center">
        <header class="pt-4">
          <span class="px-4 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            KẾT THÚC TRÒ CHƠI
          </span>
        </header>

        <main class="max-w-md mx-auto w-full my-auto py-6 space-y-6">
          <div class="text-6xl">${isTop3 ? "🏆" : "🎖️"}</div>

          <div class="space-y-2">
            <h2 class="text-2xl font-black text-white">Xếp Hạng Chung Cuộc</h2>
            <div class="text-4xl font-black text-amber-400 font-mono">
              Hạng #${this.myRank || "-"}
            </div>
            <p class="text-sm font-bold text-slate-300">Tổng điểm: ${this.myScore.toLocaleString()} PTS</p>
          </div>

          <div class="glass-panel p-5 rounded-2xl text-xs text-slate-300 space-y-2">
            <p class="font-bold text-indigo-300">Cảm ơn bạn đã tham gia!</p>
            <p>Hãy chờ Quản trò khởi động vòng chơi tiếp theo.</p>
          </div>
        </main>

        <footer class="pb-4">
          <button onclick="window.location.reload()" class="w-full max-w-xs mx-auto py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-sm shadow-lg shadow-indigo-600/30 transition">
            Tham Gia Phòng Mới
          </button>
        </footer>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  }
}

window.playerApp = new PlayerController();
