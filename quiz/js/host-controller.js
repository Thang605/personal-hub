/**
 * Host Game Controller (Quản Trò / Trình Chiếu Máy Chiếu)
 * Điều phối luồng trò chơi, đồng bộ thời gian thực, bảng xếp hạng và biểu đồ trực tiếp.
 */

class HostController {
  constructor() {
    this.network = new PeerNetwork();
    this.pin = this.generatePin();
    this.quiz = null;
    this.currentQuestionIndex = 0;
    this.gameState = "setup"; // setup, lobby, question, time_up, leaderboard, podium
    this.players = new Map(); // Map<playerId, { id, name, avatar, score, streak, currentVote, lastScoreGain }>
    this.timerInterval = null;
    this.timeRemaining = 0;
    this.totalQuestionTime = 15;
    this.liveVotes = [0, 0, 0, 0]; // Số lượng chọn A, B, C, D
    this.showLiveDistribution = true; // Chế độ hiển thị trực tiếp số người chọn khi đang đếm ngược
    this.qrCodeInstance = null;
  }

  generatePin() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  toggleMute() {
    window.soundEffects.toggleMute();
    const btn = document.getElementById("mute-btn");
    if (btn) {
      btn.innerHTML = `<i data-lucide="${window.soundEffects.isMuted ? 'volume-x' : 'volume-2'}" class="w-5 h-5"></i>`;
      if (window.lucide) lucide.createIcons();
    }
  }

  init() {
    this.renderQuizSelector();
  }

  // ==========================================
  // 1. CHỌN BỘ CÂU HỎI
  // ==========================================
  renderQuizSelector() {
    this.gameState = "setup";
    const container = document.getElementById("host-app");
    if (!container) return;

    const quizzes = window.quizDataManager.getAll();

    container.innerHTML = `
      <div class="min-h-screen flex flex-col justify-between p-4 md:p-8 bg-game-dark bg-game-glow text-white">
        <!-- Header -->
        <header class="max-w-6xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-700/60">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <i data-lucide="gamepad-2" class="w-6 h-6"></i>
            </div>
            <div>
              <h1 class="text-xl md:text-2xl font-black tracking-tight">QUIZ LIVE SHOW</h1>
              <p class="text-xs text-indigo-300 font-medium">Trung tâm điều khiển Quản trò (Host Master)</p>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <button onclick="window.soundEffects.toggleMute(); this.querySelector('i').setAttribute('data-lucide', window.soundEffects.isMuted ? 'volume-x' : 'volume-2'); lucide.createIcons();" class="p-2.5 rounded-xl glass-panel hover:bg-slate-700/80 text-slate-300 transition" title="Bật/Tắt âm thanh">
              <i data-lucide="volume-2" class="w-5 h-5"></i>
            </button>
            <a href="index.html" class="px-4 py-2 text-xs font-semibold rounded-xl glass-panel hover:bg-slate-700/80 text-slate-200 transition flex items-center gap-1.5">
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
              <span>Về Trang Chủ</span>
            </a>
          </div>
        </header>

        <!-- Quiz Collections Grid -->
        <main class="max-w-6xl mx-auto w-full py-8 space-y-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 class="text-2xl md:text-3xl font-extrabold text-white">Chọn Bộ Câu Hỏi Cho Buổi Chơi</h2>
              <p class="text-sm text-slate-400">Chọn một bộ câu hỏi để bắt đầu, tùy chỉnh nội dung hoặc tạo mới</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button onclick="hostApp.openCreateQuizModal()" class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition">
                <i data-lucide="plus-circle" class="w-4 h-4"></i>
                <span>Tạo Bộ Mới</span>
              </button>
              <label class="px-3.5 py-2.5 glass-panel hover:bg-slate-700/80 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 cursor-pointer transition">
                <i data-lucide="upload" class="w-4 h-4"></i>
                <span>Nhập JSON</span>
                <input type="file" accept=".json" onchange="hostApp.handleImportJson(event)" class="hidden" />
              </label>
              <button onclick="hostApp.resetDefaultQuizzes()" class="px-3.5 py-2.5 glass-panel hover:bg-rose-500/20 hover:border-rose-500/40 rounded-xl text-xs md:text-sm font-semibold text-slate-300 hover:text-rose-300 flex items-center gap-1.5 transition" title="Khôi phục các bộ câu hỏi gốc ban đầu">
                <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                <span>Khôi Phục Mặc Định</span>
              </button>
            </div>
          </div>

          ${quizzes.length === 0 ? `
            <div class="glass-panel p-12 rounded-3xl text-center space-y-4 max-w-lg mx-auto my-8">
              <div class="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <i data-lucide="inbox" class="w-8 h-8"></i>
              </div>
              <h3 class="text-lg font-bold text-white">Chưa có bộ câu hỏi nào</h3>
              <p class="text-xs text-slate-400">Bạn có thể tạo bộ câu hỏi mới hoặc bấm nút bên dưới để khôi phục các bộ câu hỏi mẫu.</p>
              <div class="flex justify-center gap-3 pt-2">
                <button onclick="hostApp.openCreateQuizModal()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold transition">Tạo Bộ Mới</button>
                <button onclick="hostApp.resetDefaultQuizzes()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition">Khôi Phục Mặc Định</button>
              </div>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              ${quizzes.map((q) => `
                <div class="glass-panel p-6 rounded-3xl flex flex-col justify-between hover:border-indigo-500/50 hover:scale-[1.01] transition duration-200 group relative">
                  <div class="space-y-3">
                    <div class="flex items-start justify-between gap-2">
                      <span class="px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        ${this.escapeHtml(q.category || "Tổng hợp")}
                      </span>
                      <div class="flex items-center gap-1.5">
                        <button onclick="event.stopPropagation(); hostApp.openEditQuizModal('${q.id}')" class="p-1.5 rounded-lg glass-panel hover:bg-indigo-600/30 hover:border-indigo-500/40 text-slate-400 hover:text-indigo-300 transition" title="Chỉnh sửa bộ câu hỏi này">
                          <i data-lucide="edit-3" class="w-4 h-4"></i>
                        </button>
                        <button onclick="event.stopPropagation(); hostApp.deleteQuiz('${q.id}')" class="p-1.5 rounded-lg glass-panel hover:bg-rose-500/30 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition" title="Xóa bộ câu hỏi này">
                          <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                      </div>
                    </div>
                    <div>
                      <h3 class="text-lg font-bold text-white group-hover:text-indigo-300 transition leading-snug">${this.escapeHtml(q.title)}</h3>
                      <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed mt-1.5">${this.escapeHtml(q.description || "Bộ câu hỏi thú vị với nhiều thử thách hấp dẫn.")}</p>
                    </div>
                    <div class="text-xs font-semibold text-slate-400 flex items-center gap-1 pt-1">
                      <i data-lucide="help-circle" class="w-3.5 h-3.5 text-indigo-400"></i>
                      <span>${q.questions ? q.questions.length : 0} câu hỏi</span>
                    </div>
                  </div>

                  <div class="pt-6 flex items-center gap-2">
                    <button onclick="hostApp.startLobby('${q.id}')" class="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition">
                      <i data-lucide="play" class="w-4 h-4 fill-white"></i>
                      <span>Tạo Phòng & Chơi</span>
                    </button>
                    <button onclick="hostApp.openEditQuizModal('${q.id}')" class="p-3 glass-panel hover:bg-indigo-600/30 rounded-2xl text-slate-300 hover:text-white transition" title="Chỉnh sửa nội dung">
                      <i data-lucide="pencil" class="w-4 h-4"></i>
                    </button>
                    <button onclick="window.quizDataManager.exportToJson('${q.id}')" class="p-3 glass-panel hover:bg-slate-700/80 rounded-2xl text-slate-400 hover:text-white transition" title="Xuất JSON">
                      <i data-lucide="download" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>
              `).join("")}
            </div>
          `}
        </main>

        <!-- Footer -->
        <footer class="max-w-6xl mx-auto w-full text-center text-xs text-slate-500 py-4">
          Personal Hub - Live Multiplayer Quiz Platform • WebRTC P2P Real-time Engine
        </footer>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  }

  // ==========================================
  // 2. KHỞI TẠO PHÒNG & SẢNH CHỜ (LOBBY)
  // ==========================================
  startLobby(quizId) {
    this.quiz = window.quizDataManager.getById(quizId);
    if (!this.quiz) return;

    this.gameState = "lobby";
    this.players.clear();
    this.currentQuestionIndex = 0;

    // Khởi tạo mạng WebRTC P2P
    this.network.initHost(this.pin);

    // Lắng nghe người chơi tham gia
    this.network.on("player_join", (data) => {
      this.handlePlayerJoin(data);
    });

    // Lắng nghe người chơi ngắt kết nối
    this.network.on("player_disconnected", (data) => {
      this.players.delete(data.playerId);
      this.renderLobby();
    });

    // Lắng nghe lựa chọn trực tiếp khi đang làm bài
    this.network.on("player_vote", (data) => {
      this.handlePlayerVote(data);
    });

    this.renderLobby();
  }

  renderLobby() {
    const container = document.getElementById("host-app");
    if (!container) return;

    // Xác định URL người chơi tham gia
    const currentLoc = window.location;
    const playerUrl = `${currentLoc.origin}${currentLoc.pathname.replace("host.html", "player.html")}?pin=${this.pin}`;

    container.innerHTML = `
      <div class="min-h-screen flex flex-col justify-between p-4 md:p-8 bg-game-dark bg-game-glow text-white">
        <!-- Top Bar -->
        <header class="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Phòng đang mở
            </span>
            <h2 class="text-sm md:text-base font-bold text-slate-300">${this.quiz.title}</h2>
          </div>

          <div class="flex items-center gap-3">
            <button onclick="hostApp.toggleMute()" id="mute-btn" class="p-2.5 rounded-xl glass-panel hover:bg-slate-700/80 text-slate-300 transition">
              <i data-lucide="${window.soundEffects.isMuted ? 'volume-x' : 'volume-2'}" class="w-5 h-5"></i>
            </button>
            <button onclick="hostApp.renderQuizSelector()" class="px-4 py-2 text-xs font-semibold rounded-xl glass-panel hover:bg-rose-500/20 hover:border-rose-500/40 text-rose-300 transition">
              Hủy Phòng
            </button>
          </div>
        </header>

        <!-- Main Lobby Content -->
        <main class="max-w-6xl mx-auto w-full my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <!-- Left: QR Code & Connection Info -->
          <div class="lg:col-span-5 glass-panel p-6 md:p-8 rounded-3xl flex flex-col items-center text-center space-y-5">
            <div class="space-y-1">
              <span class="text-xs font-bold uppercase tracking-wider text-indigo-400">Quét mã QR trên điện thoại</span>
              <h3 class="text-xl md:text-2xl font-black text-white">Tham Gia Trò Chơi Ngay</h3>
            </div>

            <!-- QR Code Canvas Container -->
            <div class="p-4 bg-white rounded-3xl shadow-2xl shadow-indigo-500/20">
              <div id="host-qrcode" class="w-[200px] h-[200px] flex items-center justify-center"></div>
            </div>

            <div class="w-full space-y-3 pt-2">
              <div class="p-3 bg-slate-900/80 border border-indigo-500/40 rounded-2xl flex items-center justify-between">
                <span class="text-xs text-slate-400 font-medium">MÃ PIN PHÒNG:</span>
                <span class="text-2xl md:text-3xl font-black tracking-widest text-indigo-300 font-mono select-all">${this.pin}</span>
              </div>
              <div class="text-[11px] text-slate-400 break-all px-2">
                Hoặc truy cập: <span class="text-indigo-400 font-mono font-medium">${playerUrl}</span>
              </div>
            </div>
          </div>

          <!-- Right: Players in Lobby -->
          <div class="lg:col-span-7 space-y-6">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-xl md:text-2xl font-black text-white flex items-center gap-3">
                  <span>Người Chơi Đã Vào Sảnh</span>
                  <span class="px-3 py-0.5 rounded-full text-sm font-bold bg-indigo-600 text-white">${this.players.size}</span>
                </h3>
                <p class="text-xs text-slate-400 mt-1">Sử dụng điện thoại quét mã QR để tham gia danh sách bên dưới</p>
              </div>

              <!-- Start Button -->
              <button 
                onclick="hostApp.startQuizGame()" 
                class="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold rounded-2xl text-base shadow-xl shadow-emerald-500/30 flex items-center gap-2.5 transition transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                ${this.players.size === 0 ? "disabled title='Cần ít nhất 1 người chơi tham gia'" : ""}>
                <i data-lucide="play" class="w-5 h-5 fill-white"></i>
                <span>Bắt Đầu Ngay (${this.players.size})</span>
              </button>
            </div>

            <!-- Player Bubbles Grid -->
            <div class="glass-card p-6 rounded-3xl min-h-[300px] max-h-[420px] overflow-y-auto">
              ${this.players.size === 0 ? `
                <div class="h-[250px] flex flex-col items-center justify-center text-center space-y-3 text-slate-400">
                  <div class="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center animate-bounce">
                    <i data-lucide="smartphone" class="w-8 h-8 text-indigo-400"></i>
                  </div>
                  <p class="text-sm font-semibold text-slate-300">Đang chờ người chơi quét mã QR...</p>
                  <p class="text-xs text-slate-500">Người chơi sẽ tự động xuất hiện tại đây khi họ kết nối thành công.</p>
                </div>
              ` : `
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  ${Array.from(this.players.values()).map((p) => `
                    <div class="player-bubble p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-3 shadow-md">
                      <span class="text-2xl">${p.avatar || "😎"}</span>
                      <span class="text-sm font-bold text-white truncate">${p.name}</span>
                    </div>
                  `).join("")}
                </div>
              `}
            </div>
          </div>
        </main>

        <!-- Bottom Bar Info -->
        <footer class="max-w-6xl mx-auto w-full flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800">
          <span>Tổng số câu hỏi: <strong>${this.quiz.questions.length}</strong></span>
          <span>Hệ thống P2P thời gian thực siêu tốc</span>
        </footer>
      </div>
    `;

    if (window.lucide) lucide.createIcons();

    // Sinh mã QR
    setTimeout(() => {
      const qrEl = document.getElementById("host-qrcode");
      if (qrEl && window.QRCode) {
        qrEl.innerHTML = "";
        new QRCode(qrEl, {
          text: playerUrl,
          width: 180,
          height: 180,
          colorDark: "#0f172a",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.M
        });
      }
    }, 100);
  }

  handlePlayerJoin(data) {
    const pId = data.playerId;
    if (!this.players.has(pId)) {
      this.players.set(pId, {
        id: pId,
        name: data.name || "Người chơi " + (this.players.size + 1),
        avatar: data.avatar || "🚀",
        score: 0,
        streak: 0,
        currentVote: null,
        lastScoreGain: 0
      });

      // Phát âm thanh tiếng người mới vào
      window.soundEffects.playJoin();

      // Đồng bộ lại danh sách
      this.renderLobby();
      this.broadcastPlayerList();
    }
  }

  broadcastPlayerList() {
    const list = Array.from(this.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      score: p.score
    }));

    this.network.broadcast({
      type: "PLAYER_LIST_SYNC",
      players: list,
      total: list.length
    });
  }

  // ==========================================
  // 3. ĐIỀU PHỐI CÂU HỎI & LIVE CHOICES (THỜI GIAN CHƯA HẾT)
  // ==========================================
  startQuizGame() {
    if (this.players.size === 0) return;
    this.currentQuestionIndex = 0;
    this.launchQuestion(0);
  }

  launchQuestion(qIndex) {
    this.currentQuestionIndex = qIndex;
    const q = this.quiz.questions[qIndex];
    if (!q) {
      this.showFinalPodium();
      return;
    }

    this.gameState = "question";
    this.totalQuestionTime = q.time || 15;
    this.timeRemaining = this.totalQuestionTime;
    this.liveVotes = [0, 0, 0, 0];

    // Reset lựa chọn câu này của người chơi
    this.players.forEach((p) => {
      p.currentVote = null;
    });

    // Phát tin nhắn bắt đầu câu hỏi tới tất cả người chơi
    this.network.broadcast({
      type: "QUESTION_START",
      questionIndex: qIndex,
      totalQuestions: this.quiz.questions.length,
      question: q.question,
      choices: q.choices,
      timeLimit: this.totalQuestionTime,
      serverTimestamp: Date.now()
    });

    this.renderQuestionScreen();
    this.startCountdown();
  }

  startCountdown() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;

      // Phát âm thanh đếm ngược
      if (this.timeRemaining > 5) {
        window.soundEffects.playTick();
      } else if (this.timeRemaining > 0) {
        window.soundEffects.playTickFast();
      }

      this.updateTimerDisplay();

      // Kiểm tra nếu tất cả người chơi đã trả lời xong hoặc hết giờ
      const answeredCount = Array.from(this.players.values()).filter((p) => p.currentVote !== null).length;
      if (this.timeRemaining <= 0 || (this.players.size > 0 && answeredCount >= this.players.size)) {
        clearInterval(this.timerInterval);
        this.finishQuestion();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    const timerText = document.getElementById("timer-sec");
    const timerBar = document.getElementById("timer-progress");
    if (timerText) {
      timerText.textContent = this.timeRemaining;
      if (this.timeRemaining <= 5) {
        timerText.classList.add("timer-critical");
      }
    }
    if (timerBar) {
      const pct = (this.timeRemaining / this.totalQuestionTime) * 100;
      timerBar.style.width = `${pct}%`;
      if (this.timeRemaining <= 5) {
        timerBar.className = "h-full bg-gradient-to-r from-red-500 to-rose-600 transition-all duration-1000 ease-linear";
      }
    }
  }

  // =========================================================================
  // XỬ LÝ LỰA CHỌN CỦA NGƯỜI CHƠI TRỰC TIẾP KHI THỜI GIAN ĐANG CHẠY (REAL-TIME LIVE CHOICES)
  // =========================================================================
  handlePlayerVote(data) {
    if (this.gameState !== "question") return;

    const player = this.players.get(data.playerId);
    if (!player) return;

    // Ghi nhận lượt chọn
    player.currentVote = {
      choiceIndex: data.choiceIndex,
      timeRemaining: this.timeRemaining,
      timestamp: data.timestamp
    };

    // Tính toán lại phân bổ lựa chọn
    this.recalculateLiveVotes();

    // Cập nhật giao diện trực tiếp trên màn hình Host
    this.updateLiveStatsUi();

    // Phát âm thanh khi có người bấm
    window.soundEffects.playClick();

    // Gửi cập nhật thống kê live tới người chơi
    this.network.broadcast({
      type: "LIVE_STATS_UPDATE",
      counts: [...this.liveVotes],
      totalVotes: Array.from(this.players.values()).filter((p) => p.currentVote !== null).length,
      totalPlayers: this.players.size
    });
  }

  recalculateLiveVotes() {
    this.liveVotes = [0, 0, 0, 0];
    this.players.forEach((p) => {
      if (p.currentVote && p.currentVote.choiceIndex >= 0 && p.currentVote.choiceIndex < 4) {
        this.liveVotes[p.currentVote.choiceIndex]++;
      }
    });
  }

  updateLiveStatsUi() {
    const totalVotes = Array.from(this.players.values()).filter((p) => p.currentVote !== null).length;
    const answeredBadge = document.getElementById("answered-count-badge");
    if (answeredBadge) {
      answeredBadge.textContent = `${totalVotes} / ${this.players.size} người đã trả lời`;
    }

    // Cập nhật từng cột/thanh live của 4 đáp án
    for (let i = 0; i < 4; i++) {
      const countEl = document.getElementById(`live-count-${i}`);
      const barEl = document.getElementById(`live-bar-${i}`);
      const votes = this.liveVotes[i] || 0;
      const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

      if (countEl) {
        countEl.textContent = this.showLiveDistribution ? `${votes} người (${pct}%)` : `${votes} đã chọn`;
      }
      if (barEl) {
        barEl.style.width = this.showLiveDistribution ? `${pct}%` : `${(votes / (this.players.size || 1)) * 100}%`;
      }
    }

    // Cập nhật avatar người chơi phát sáng khi họ đã nộp
    this.players.forEach((p) => {
      const avatarEl = document.getElementById(`player-item-${p.id}`);
      if (avatarEl) {
        if (p.currentVote !== null) {
          avatarEl.classList.add("player-voted-pulse");
          avatarEl.classList.remove("opacity-50");
        } else {
          avatarEl.classList.add("opacity-50");
        }
      }
    });
  }

  renderQuestionScreen() {
    const container = document.getElementById("host-app");
    if (!container) return;

    const q = this.quiz.questions[this.currentQuestionIndex];
    const totalQ = this.quiz.questions.length;
    const totalVotes = Array.from(this.players.values()).filter((p) => p.currentVote !== null).length;

    const optionColors = [
      { bg: "bg-red-500", border: "border-red-500", label: "A", icon: "triangle", barClass: "live-bar-a" },
      { bg: "bg-blue-500", border: "border-blue-500", label: "B", icon: "diamond", barClass: "live-bar-b" },
      { bg: "bg-amber-500", border: "border-amber-500", label: "C", icon: "circle", barClass: "live-bar-c" },
      { bg: "bg-emerald-500", border: "border-emerald-500", label: "D", icon: "square", barClass: "live-bar-d" }
    ];

    container.innerHTML = `
      <div class="min-h-screen flex flex-col justify-between p-4 md:p-8 bg-game-dark bg-game-glow text-white">
        
        <!-- Header: Question Index & Status -->
        <header class="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="px-4 py-1.5 rounded-2xl text-sm font-black bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
              Câu hỏi ${this.currentQuestionIndex + 1} / ${totalQ}
            </span>
            <span id="answered-count-badge" class="px-3 py-1 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
              ${totalVotes} / ${this.players.size} người đã trả lời
            </span>
          </div>

          <!-- Live Toggle & Controls -->
          <div class="flex items-center gap-3">
            <button onclick="hostApp.toggleLiveDistribution()" class="px-3 py-1.5 glass-panel hover:bg-slate-700/80 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2">
              <i data-lucide="bar-chart-3" class="w-4 h-4"></i>
              <span>${this.showLiveDistribution ? "Đang hiện biểu đồ Live" : "Đang ẩn biểu đồ"}</span>
            </button>
            <button onclick="hostApp.forceFinishQuestion()" class="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-500 rounded-xl text-xs font-bold text-white transition">
              Hết giờ ngay
            </button>
          </div>
        </header>

        <!-- Main Question Area -->
        <main class="max-w-6xl mx-auto w-full my-auto py-4 space-y-6">
          
          <!-- Timer Bar & Circular Number -->
          <div class="space-y-2">
            <div class="w-full bg-slate-800/80 h-3.5 rounded-full overflow-hidden border border-slate-700/60 p-0.5">
              <div id="timer-progress" class="h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full transition-all duration-1000 ease-linear" style="width: 100%;"></div>
            </div>
            <div class="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
              <span>Đồng hồ đếm ngược</span>
              <div class="flex items-center gap-1 text-base font-black text-amber-400 font-mono">
                <i data-lucide="timer" class="w-4 h-4"></i>
                <span id="timer-sec">${this.timeRemaining}</span>s
              </div>
            </div>
          </div>

          <!-- Big Question Card -->
          <div class="glass-panel p-8 md:p-12 rounded-3xl text-center shadow-2xl border-indigo-500/20">
            <h2 class="text-2xl md:text-4xl font-extrabold text-white leading-tight tracking-tight">${q.question}</h2>
          </div>

          <!-- 4 Answer Cards with Real-time Live Selection Bars -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${q.choices.map((choice, idx) => {
              const opt = optionColors[idx];
              return `
                <div id="choice-card-${idx}" class="glass-card relative overflow-hidden p-5 md:p-6 rounded-3xl border border-slate-700/60 transition duration-200">
                  
                  <!-- Live Background Progress Fill (Real-time Live Choices) -->
                  <div id="live-bar-${idx}" class="absolute inset-0 ${opt.barClass} opacity-40 transition-all duration-300 ease-out" style="width: 0%;"></div>

                  <div class="relative z-10 flex items-center justify-between">
                    <div class="flex items-center gap-4">
                      <span class="w-10 h-10 rounded-2xl ${opt.bg} text-white font-black text-lg flex items-center justify-center shadow-lg">
                        ${opt.label}
                      </span>
                      <span class="text-base md:text-xl font-bold text-white">${choice}</span>
                    </div>

                    <!-- Live Choice Counter & % -->
                    <div class="text-right pl-3">
                      <span id="live-count-${idx}" class="text-xs md:text-sm font-black text-indigo-200 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700 font-mono">
                        0 người (0%)
                      </span>
                    </div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>

          <!-- Active Players Live Presence Bar -->
          <div class="p-3 glass-panel rounded-2xl">
            <div class="text-[11px] text-slate-400 font-semibold mb-2 flex items-center justify-between">
              <span>Trạng thái người chơi nộp bài:</span>
              <span class="text-indigo-300">Biểu tượng sáng màu = Đã nộp</span>
            </div>
            <div class="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              ${Array.from(this.players.values()).map((p) => `
                <div id="player-item-${p.id}" class="px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 opacity-50 transition duration-200">
                  <span>${p.avatar}</span>
                  <span class="truncate max-w-[90px]">${p.name}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </main>

        <!-- Footer -->
        <footer class="max-w-6xl mx-auto w-full text-center text-xs text-slate-500 pt-2">
          Kết quả chọn của người chơi đang được cập nhật tức thời theo thời gian thực
        </footer>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    this.updateLiveStatsUi();
  }

  toggleLiveDistribution() {
    this.showLiveDistribution = !this.showLiveDistribution;
    this.updateLiveStatsUi();
  }

  forceFinishQuestion() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.finishQuestion();
  }

  // ==========================================
  // 4. KẾT THÚC CÂU HỎI & CÔNG BỐ ĐÁP ÁN
  // ==========================================
  finishQuestion() {
    this.gameState = "time_up";
    const q = this.quiz.questions[this.currentQuestionIndex];
    const correctIdx = q.correct;

    // Phát âm thanh hết giờ
    window.soundEffects.playTimeUp();

    // Tính điểm cho từng người chơi
    this.players.forEach((p) => {
      if (p.currentVote && p.currentVote.choiceIndex === correctIdx) {
        // Đúng: Điểm cơ bản 1000 + Thưởng tốc độ (tối đa 1000)
        const timeRatio = (p.currentVote.timeRemaining || 0) / this.totalQuestionTime;
        const speedBonus = Math.round(1000 * Math.max(0, timeRatio));
        const streakBonus = p.streak * 100;
        const gained = 1000 + speedBonus + streakBonus;

        p.score += gained;
        p.streak++;
        p.lastScoreGain = gained;
        p.isCorrect = true;
      } else {
        // Sai hoặc không trả lời
        p.streak = 0;
        p.lastScoreGain = 0;
        p.isCorrect = false;
      }
    });

    // Tạo bảng xếp hạng hiện tại
    const rankedPlayers = Array.from(this.players.values())
      .sort((a, b) => b.score - a.score)
      .map((p, idx) => ({
        id: p.id,
        rank: idx + 1,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        lastScoreGain: p.lastScoreGain,
        isCorrect: p.isCorrect,
        streak: p.streak
      }));

    // Gửi kết quả cho toàn bộ người chơi
    this.network.broadcast({
      type: "TIME_UP",
      correctIndex: correctIdx,
      explanation: q.explanation || "",
      leaderboard: rankedPlayers
    });

    // Cập nhật giao diện Host: Làm nổi bật đáp án đúng
    this.renderQuestionResultScreen(correctIdx, q, rankedPlayers);
  }

  renderQuestionResultScreen(correctIdx, q, rankedPlayers) {
    const container = document.getElementById("host-app");
    if (!container) return;

    const isLastQ = this.currentQuestionIndex >= this.quiz.questions.length - 1;

    // Highlight đáp án đúng
    for (let i = 0; i < 4; i++) {
      const card = document.getElementById(`choice-card-${i}`);
      if (card) {
        if (i === correctIdx) {
          card.classList.add("ring-4", "ring-emerald-400", "bg-emerald-950/60");
          card.querySelector(".live-bar-" + ["a", "b", "c", "d"][i])?.classList.add("opacity-90");
        } else {
          card.classList.add("opacity-40", "grayscale-[50%]");
        }
      }
    }

    // Hiển thị khung giải thích và nút Next
    const mainEl = container.querySelector("main");
    if (mainEl) {
      const resultBanner = document.createElement("div");
      resultBanner.className = "p-6 rounded-3xl bg-slate-900/90 border border-indigo-500/40 space-y-4 shadow-2xl animate-fade-in";
      resultBanner.innerHTML = `
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1">
            <span class="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <i data-lucide="check-circle-2" class="w-4 h-4"></i>
              Đáp án chính xác: Phương án ${["A", "B", "C", "D"][correctIdx]}
            </span>
            <p class="text-sm text-slate-300 leading-relaxed">${q.explanation || "Chúc mừng các bạn đã chọn đáp án chính xác!"}</p>
          </div>

          <div class="flex items-center gap-3">
            <button onclick="hostApp.showLeaderboard()" class="px-6 py-3 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold rounded-2xl text-sm flex items-center gap-2 shadow-xl shadow-indigo-500/30 transition transform hover:scale-105">
              <span>${isLastQ ? "Xem Bục Vinh Danh Chung Cuộc 🏆" : "Xem Bảng Xếp Hạng 📊"}</span>
              <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `;
      mainEl.appendChild(resultBanner);
      if (window.lucide) lucide.createIcons();
    }
  }

  // ==========================================
  // 5. BẢNG XẾP HẠNG (LEADERBOARD)
  // ==========================================
  showLeaderboard() {
    const isLastQ = this.currentQuestionIndex >= this.quiz.questions.length - 1;
    if (isLastQ) {
      this.showFinalPodium();
      return;
    }

    this.gameState = "leaderboard";
    const rankedPlayers = Array.from(this.players.values()).sort((a, b) => b.score - a.score);

    const container = document.getElementById("host-app");
    if (!container) return;

    container.innerHTML = `
      <div class="min-h-screen flex flex-col justify-between p-4 md:p-8 bg-game-dark bg-game-glow text-white">
        <!-- Header -->
        <header class="max-w-4xl mx-auto w-full flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold">
              <i data-lucide="trophy" class="w-5 h-5 text-amber-300"></i>
            </span>
            <div>
              <h2 class="text-xl md:text-2xl font-black">Bảng Xếp Hạng Điểm Số</h2>
              <p class="text-xs text-slate-400">Sau câu hỏi số ${this.currentQuestionIndex + 1} / ${this.quiz.questions.length}</p>
            </div>
          </div>

          <button onclick="hostApp.nextQuestion()" class="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white font-black rounded-2xl text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition transform hover:scale-105">
            <span>Câu Tiếp Theo</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </header>

        <!-- Leaderboard List -->
        <main class="max-w-4xl mx-auto w-full my-auto py-6 space-y-3">
          ${rankedPlayers.slice(0, 8).map((p, idx) => {
            const isTop1 = idx === 0;
            const rankBadge = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
            return `
              <div class="glass-panel p-4 md:p-5 rounded-3xl flex items-center justify-between ${isTop1 ? 'border-amber-400/50 bg-amber-500/10' : ''} shadow-md transition duration-200">
                <div class="flex items-center gap-4">
                  <span class="text-xl md:text-2xl font-black ${isTop1 ? 'text-amber-400' : 'text-slate-400'} w-8 text-center">${rankBadge}</span>
                  <span class="text-3xl">${p.avatar}</span>
                  <div>
                    <h4 class="text-base md:text-lg font-bold text-white">${p.name}</h4>
                    ${p.streak > 1 ? `
                      <span class="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                        🔥 Chuỗi đúng x${p.streak}
                      </span>
                    ` : ""}
                  </div>
                </div>

                <div class="text-right space-y-0.5">
                  <div class="text-lg md:text-2xl font-black text-white font-mono">${p.score.toLocaleString()} <span class="text-xs text-indigo-400">PTS</span></div>
                  ${p.lastScoreGain > 0 ? `
                    <div class="text-xs font-bold text-emerald-400">+${p.lastScoreGain} pts</div>
                  ` : `
                    <div class="text-xs text-slate-500">+0 pts</div>
                  `}
                </div>
              </div>
            `;
          }).join("")}
        </main>

        <footer class="max-w-4xl mx-auto w-full text-center text-xs text-slate-500 pt-4">
          Chuẩn bị cho câu hỏi tiếp theo...
        </footer>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  }

  nextQuestion() {
    this.launchQuestion(this.currentQuestionIndex + 1);
  }

  // ==========================================
  // 6. BỤC VINH DANH CHUNG CUỘC (FINAL PODIUM)
  // ==========================================
  showFinalPodium() {
    this.gameState = "podium";
    const rankedPlayers = Array.from(this.players.values()).sort((a, b) => b.score - a.score);
    const top1 = rankedPlayers[0] || null;
    const top2 = rankedPlayers[1] || null;
    const top3 = rankedPlayers[2] || null;

    // Phát âm thanh chiến thắng & Bắn pháo hoa Confetti
    window.soundEffects.playVictory();
    this.triggerConfetti();

    // Bắn tin nhắn kết thúc tới người chơi
    this.network.broadcast({
      type: "GAME_OVER",
      podium: rankedPlayers.slice(0, 3)
    });

    const container = document.getElementById("host-app");
    if (!container) return;

    container.innerHTML = `
      <div class="min-h-screen flex flex-col justify-between p-4 md:p-8 bg-game-dark bg-game-glow text-white">
        <!-- Header -->
        <header class="max-w-5xl mx-auto w-full text-center space-y-2">
          <span class="px-4 py-1.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
            KẾT THÚC TRÒ CHƠI
          </span>
          <h1 class="text-3xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-indigo-300">
            VINH DANH NHÀ VÔ ĐỊCH
          </h1>
        </header>

        <!-- Podium Top 3 -->
        <main class="max-w-4xl mx-auto w-full my-auto py-8">
          <div class="flex items-end justify-center gap-3 md:gap-6 pt-12">
            
            <!-- Top 2 (Bạc) -->
            ${top2 ? `
              <div class="flex-1 max-w-[200px] flex flex-col items-center space-y-3">
                <div class="text-center space-y-1">
                  <span class="text-4xl">${top2.avatar}</span>
                  <h4 class="text-sm font-bold text-slate-200 truncate w-full">${top2.name}</h4>
                  <span class="text-xs font-black text-indigo-300 font-mono">${top2.score.toLocaleString()} pts</span>
                </div>
                <div class="w-full podium-2 rounded-t-3xl flex flex-col items-center justify-center p-4">
                  <span class="text-4xl font-black text-slate-800">2</span>
                  <span class="text-xs font-bold text-slate-800 uppercase tracking-wider">Hạng Nhì</span>
                </div>
              </div>
            ` : '<div class="flex-1 max-w-[200px]"></div>'}

            <!-- Top 1 (Vàng - Quán quân) -->
            ${top1 ? `
              <div class="flex-1 max-w-[240px] flex flex-col items-center space-y-3 -translate-y-4">
                <div class="text-center space-y-1">
                  <div class="relative inline-block">
                    <span class="text-6xl">${top1.avatar}</span>
                    <span class="absolute -top-4 -right-2 text-2xl">👑</span>
                  </div>
                  <h3 class="text-lg md:text-xl font-black text-amber-300 truncate w-full">${top1.name}</h3>
                  <span class="text-sm font-black text-white font-mono bg-amber-500/30 px-3 py-1 rounded-full border border-amber-500/50">
                    ${top1.score.toLocaleString()} pts
                  </span>
                </div>
                <div class="w-full podium-1 rounded-t-3xl flex flex-col items-center justify-center p-4">
                  <span class="text-5xl font-black text-amber-950">1</span>
                  <span class="text-sm font-black text-amber-950 uppercase tracking-wider">Quán Quân</span>
                </div>
              </div>
            ` : '<div class="flex-1 max-w-[240px]"></div>'}

            <!-- Top 3 (Đồng) -->
            ${top3 ? `
              <div class="flex-1 max-w-[200px] flex flex-col items-center space-y-3">
                <div class="text-center space-y-1">
                  <span class="text-4xl">${top3.avatar}</span>
                  <h4 class="text-sm font-bold text-slate-200 truncate w-full">${top3.name}</h4>
                  <span class="text-xs font-black text-indigo-300 font-mono">${top3.score.toLocaleString()} pts</span>
                </div>
                <div class="w-full podium-3 rounded-t-3xl flex flex-col items-center justify-center p-4">
                  <span class="text-3xl font-black text-amber-950">3</span>
                  <span class="text-xs font-bold text-amber-950 uppercase tracking-wider">Hạng Ba</span>
                </div>
              </div>
            ` : '<div class="flex-1 max-w-[200px]"></div>'}

          </div>
        </main>

        <!-- Actions -->
        <footer class="max-w-4xl mx-auto w-full flex items-center justify-center gap-4 py-4">
          <button onclick="hostApp.startLobby('${this.quiz.id}')" class="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition">
            <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
            <span>Chơi Lại Bộ Này</span>
          </button>
          <button onclick="hostApp.renderQuizSelector()" class="px-6 py-3.5 glass-panel hover:bg-slate-700/80 text-white font-bold rounded-2xl text-sm flex items-center gap-2 transition">
            <i data-lucide="grid" class="w-4 h-4"></i>
            <span>Chọn Bộ Khác</span>
          </button>
        </footer>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  }

  triggerConfetti() {
    if (window.confetti) {
      const count = 200;
      const defaults = { origin: { y: 0.7 } };

      function fire(particleRatio, opts) {
        window.confetti(Object.assign({}, defaults, opts, {
          particleCount: Math.floor(count * particleRatio)
        }));
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
  }

  // ==========================================
  // 7. QUẢN LÝ TẠO, CHỈNH SỬA & XÓA BỘ CÂU HỎI
  // ==========================================
  escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  deleteQuiz(quizId) {
    const quiz = window.quizDataManager.getById(quizId);
    if (!quiz) return;
    const confirmed = confirm(
      `Bạn có chắc chắn muốn xóa bộ câu hỏi:\n"${quiz.title}"?\n\nLưu ý: Bộ câu hỏi bị xóa sẽ biến mất khỏi danh sách. Bạn có thể nhấn 'Khôi Phục Mặc Định' nếu muốn tải lại các bộ câu hỏi gốc.`
    );
    if (confirmed) {
      window.quizDataManager.deleteQuiz(quizId);
      this.renderQuizSelector();
    }
  }

  resetDefaultQuizzes() {
    const confirmed = confirm(
      "Bạn có chắc muốn khôi phục danh sách câu hỏi về mặc định ban đầu của hệ thống?\n\nToàn bộ các thay đổi trên các bộ câu hỏi mặc định hoặc các câu hỏi tự tạo có thể bị thay thế."
    );
    if (confirmed) {
      window.quizDataManager.resetToDefault();
      this.renderQuizSelector();
    }
  }

  openCreateQuizModal() {
    this.openQuizModal(null);
  }

  openEditQuizModal(quizId) {
    this.openQuizModal(quizId);
  }

  closeQuizModal() {
    const modal = document.getElementById("quiz-modal-container");
    if (modal) modal.innerHTML = "";
  }

  openQuizModal(quizId = null) {
    let quiz = null;
    if (quizId) {
      quiz = window.quizDataManager.getById(quizId);
    }

    const isEdit = !!quiz;
    const modalTitle = isEdit ? "Chỉnh Sửa Bộ Câu Hỏi" : "Tạo Bộ Câu Hỏi Mới";
    const titleVal = quiz ? quiz.title : "";
    const categoryVal = quiz ? (quiz.category || "Công nghệ & AI") : "";
    const descVal = quiz ? (quiz.description || "") : "";
    const questions = (quiz && quiz.questions && quiz.questions.length > 0)
      ? quiz.questions
      : [
          {
            question: "",
            choices: ["", "", "", ""],
            correct: 0,
            time: 15,
            explanation: ""
          }
        ];

    let modal = document.getElementById("quiz-modal-container");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "quiz-modal-container";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
        <div class="glass-panel-light dark:glass-panel bg-slate-900 border border-slate-700/80 w-full max-w-3xl my-auto rounded-3xl p-5 md:p-8 space-y-6 text-white shadow-2xl">
          <!-- Modal Header -->
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <i data-lucide="${isEdit ? 'edit-3' : 'plus-circle'}" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-lg md:text-xl font-black">${modalTitle}</h3>
                <p class="text-xs text-slate-400">${isEdit ? 'Chỉnh sửa thông tin và danh sách câu hỏi cho bộ đề này' : 'Tạo bộ câu hỏi tùy chỉnh riêng cho lớp học hoặc phòng chơi của bạn'}</p>
              </div>
            </div>
            <button type="button" onclick="hostApp.closeQuizModal()" class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Form Content -->
          <form id="quiz-builder-form" onsubmit="event.preventDefault(); hostApp.saveQuizFromModal(event, '${quizId || ''}', false)" class="space-y-5">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="md:col-span-2 space-y-1.5">
                <label class="block text-xs font-bold text-slate-300">Tên bộ câu hỏi <span class="text-rose-400">*</span></label>
                <input type="text" id="quiz-title" required value="${this.escapeHtml(titleVal)}" placeholder="Ví dụ: Đố Vui Công Nghệ 2026" class="w-full px-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" />
              </div>
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-slate-300">Chủ đề / Thể loại</label>
                <input type="text" id="quiz-category" value="${this.escapeHtml(categoryVal)}" placeholder="Ví dụ: AI, Văn hóa, Game..." class="w-full px-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-300">Mô tả tóm tắt</label>
              <input type="text" id="quiz-desc" value="${this.escapeHtml(descVal)}" placeholder="Mô tả nội dung hoặc hướng dẫn cho người chơi..." class="w-full px-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" />
            </div>

            <!-- Questions Builder List -->
            <div class="space-y-3 pt-2">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                  <i data-lucide="list-ordered" class="w-4 h-4"></i>
                  <span>Danh Sách Câu Hỏi (<span id="modal-questions-count">${questions.length}</span>)</span>
                </h4>
                <button type="button" onclick="hostApp.addQuestionField()" class="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 rounded-xl text-xs font-bold text-indigo-200 flex items-center gap-1.5 transition">
                  <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                  <span>Thêm Câu Hỏi</span>
                </button>
              </div>

              <div id="questions-list-builder" class="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                ${questions.map((q, idx) => this.renderQuestionItemHtml(q, idx + 1)).join("")}
              </div>
            </div>

            <button type="button" onclick="hostApp.addQuestionField()" class="w-full py-3 bg-slate-800/70 hover:bg-slate-800 border border-dashed border-slate-600/80 hover:border-indigo-500 rounded-2xl text-xs font-bold text-slate-300 hover:text-indigo-300 flex items-center justify-center gap-2 transition">
              <i data-lucide="plus-circle" class="w-4 h-4"></i>
              <span>Thêm Câu Hỏi Mới</span>
            </button>

            <!-- Actions -->
            <div class="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button type="button" onclick="hostApp.closeQuizModal()" class="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition">
                Hủy Bỏ
              </button>
              <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button type="button" onclick="hostApp.saveQuizFromModal(event, '${quizId || ''}', false)" class="flex-1 sm:flex-none px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5">
                  <i data-lucide="save" class="w-4 h-4"></i>
                  <span>Lưu Bộ Câu Hỏi</span>
                </button>
                <button type="button" onclick="hostApp.saveQuizFromModal(event, '${quizId || ''}', true)" class="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-1.5">
                  <i data-lucide="play" class="w-4 h-4 fill-white"></i>
                  <span>Lưu & Tạo Phòng Ngay</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  }

  renderQuestionItemHtml(q = null, index = 1) {
    const qText = q ? (q.question || "") : "";
    const choices = q && q.choices ? q.choices : ["", "", "", ""];
    const correct = q && typeof q.correct === "number" ? q.correct : 0;
    const time = q && q.time ? q.time : 15;
    const explanation = q ? (q.explanation || "") : "";

    return `
      <div class="p-4 bg-slate-800/70 rounded-2xl border border-slate-700/70 space-y-3 question-item transition hover:border-slate-600">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-xs font-black text-indigo-300 question-number-label">
              CÂU HỎI ${index}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-[11px] text-slate-400 font-medium">Thời gian:</label>
            <select class="q-time bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1 text-white focus:outline-hidden focus:border-indigo-500">
              <option value="5" ${time === 5 ? "selected" : ""}>5 giây</option>
              <option value="10" ${time === 10 ? "selected" : ""}>10 giây</option>
              <option value="15" ${time === 15 ? "selected" : ""}>15 giây</option>
              <option value="20" ${time === 20 ? "selected" : ""}>20 giây</option>
              <option value="30" ${time === 30 ? "selected" : ""}>30 giây</option>
              <option value="45" ${time === 45 ? "selected" : ""}>45 giây</option>
              <option value="60" ${time === 60 ? "selected" : ""}>60 giây</option>
              <option value="90" ${time === 90 ? "selected" : ""}>90 giây</option>
            </select>
            <button type="button" onclick="hostApp.removeQuestionField(this)" class="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-700/60 transition" title="Xóa câu hỏi này">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <div>
          <textarea placeholder="Nhập nội dung câu hỏi..." required rows="2" class="q-text w-full px-3 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs md:text-sm text-white focus:outline-hidden focus:border-indigo-500 transition leading-relaxed">${this.escapeHtml(qText)}</textarea>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div class="flex items-center gap-1.5 p-1.5 bg-red-950/30 border border-red-500/30 rounded-xl">
            <span class="w-6 h-6 rounded-lg bg-red-600 text-white font-black flex items-center justify-center text-[11px] shrink-0">A</span>
            <input type="text" placeholder="Đáp án A (Đỏ)..." required value="${this.escapeHtml(choices[0] || '')}" class="q-opt-0 w-full bg-transparent px-2 py-1 text-xs text-white focus:outline-hidden" />
          </div>

          <div class="flex items-center gap-1.5 p-1.5 bg-blue-950/30 border border-blue-500/30 rounded-xl">
            <span class="w-6 h-6 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-[11px] shrink-0">B</span>
            <input type="text" placeholder="Đáp án B (Xanh dương)..." required value="${this.escapeHtml(choices[1] || '')}" class="q-opt-1 w-full bg-transparent px-2 py-1 text-xs text-white focus:outline-hidden" />
          </div>

          <div class="flex items-center gap-1.5 p-1.5 bg-amber-950/30 border border-amber-500/30 rounded-xl">
            <span class="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-[11px] shrink-0">C</span>
            <input type="text" placeholder="Đáp án C (Vàng)..." value="${this.escapeHtml(choices[2] || '')}" class="q-opt-2 w-full bg-transparent px-2 py-1 text-xs text-white focus:outline-hidden" />
          </div>

          <div class="flex items-center gap-1.5 p-1.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">
            <span class="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center text-[11px] shrink-0">D</span>
            <input type="text" placeholder="Đáp án D (Xanh lá)..." value="${this.escapeHtml(choices[3] || '')}" class="q-opt-3 w-full bg-transparent px-2 py-1 text-xs text-white focus:outline-hidden" />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-700/50">
          <div class="flex items-center gap-2">
            <span class="text-slate-400 font-semibold whitespace-nowrap">Đáp án đúng:</span>
            <select class="q-correct w-full bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-emerald-400 font-bold focus:outline-hidden focus:border-emerald-500">
              <option value="0" ${correct === 0 ? "selected" : ""}>Đáp án Đúng: A (Đỏ)</option>
              <option value="1" ${correct === 1 ? "selected" : ""}>Đáp án Đúng: B (Xanh dương)</option>
              <option value="2" ${correct === 2 ? "selected" : ""}>Đáp án Đúng: C (Vàng)</option>
              <option value="3" ${correct === 3 ? "selected" : ""}>Đáp án Đúng: D (Xanh lá)</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-slate-400 font-semibold whitespace-nowrap">Giải thích:</span>
            <input type="text" placeholder="Ghi chú giải thích chi tiết (tùy chọn)..." value="${this.escapeHtml(explanation)}" class="q-explanation w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500" />
          </div>
        </div>
      </div>
    `;
  }

  addQuestionField() {
    const list = document.getElementById("questions-list-builder");
    if (!list) return;

    const currentCount = list.querySelectorAll(".question-item").length;
    const temp = document.createElement("div");
    temp.innerHTML = this.renderQuestionItemHtml(null, currentCount + 1);
    const newItem = temp.firstElementChild;
    list.appendChild(newItem);

    this.reindexQuestions();
    if (window.lucide) lucide.createIcons();

    newItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  removeQuestionField(btn) {
    const list = document.getElementById("questions-list-builder");
    if (!list) return;
    const items = list.querySelectorAll(".question-item");
    if (items.length <= 1) {
      alert("Bộ câu hỏi phải có ít nhất 1 câu hỏi!");
      return;
    }
    const item = btn.closest(".question-item");
    if (item) {
      item.remove();
      this.reindexQuestions();
    }
  }

  reindexQuestions() {
    const list = document.getElementById("questions-list-builder");
    if (!list) return;
    const items = list.querySelectorAll(".question-item");
    items.forEach((item, idx) => {
      const label = item.querySelector(".question-number-label");
      if (label) label.textContent = `CÂU HỎI ${idx + 1}`;
    });
    const countEl = document.getElementById("modal-questions-count");
    if (countEl) countEl.textContent = items.length;
  }

  saveQuizFromModal(e, quizId, andPlayImmediately = false) {
    if (e && e.preventDefault) e.preventDefault();

    const titleEl = document.getElementById("quiz-title");
    const categoryEl = document.getElementById("quiz-category");
    const descEl = document.getElementById("quiz-desc");

    const title = titleEl ? titleEl.value.trim() : "";
    const category = categoryEl ? categoryEl.value.trim() : "";
    const desc = descEl ? descEl.value.trim() : "";

    if (!title) {
      alert("Vui lòng nhập tên bộ câu hỏi!");
      if (titleEl) titleEl.focus();
      return;
    }

    const items = document.querySelectorAll(".question-item");
    const questions = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const qText = item.querySelector(".q-text").value.trim();
      const time = Number(item.querySelector(".q-time").value) || 15;
      const opt0 = item.querySelector(".q-opt-0").value.trim();
      const opt1 = item.querySelector(".q-opt-1").value.trim();
      const opt2 = item.querySelector(".q-opt-2").value.trim();
      const opt3 = item.querySelector(".q-opt-3").value.trim();
      const correct = Number(item.querySelector(".q-correct").value) || 0;
      const explanation = item.querySelector(".q-explanation") ? item.querySelector(".q-explanation").value.trim() : "";

      if (!qText) {
        alert(`Câu hỏi ${i + 1} chưa có nội dung!`);
        item.querySelector(".q-text").focus();
        return;
      }

      if (!opt0 || !opt1) {
        alert(`Câu hỏi ${i + 1} cần có ít nhất 2 đáp án A và B!`);
        return;
      }

      questions.push({
        question: qText,
        choices: [opt0, opt1, opt2 || "Đáp án C", opt3 || "Đáp án D"],
        correct: Math.min(correct, 3),
        time: time,
        explanation: explanation
      });
    }

    if (questions.length === 0) {
      alert("Bộ câu hỏi phải có ít nhất 1 câu hỏi hoàn chỉnh!");
      return;
    }

    const savedQuiz = window.quizDataManager.saveQuiz({
      id: quizId || undefined,
      title: title,
      category: category || "Tự tạo",
      description: desc,
      questions: questions
    });

    this.closeQuizModal();

    if (andPlayImmediately && savedQuiz && savedQuiz.id) {
      this.startLobby(savedQuiz.id);
    } else {
      this.renderQuizSelector();
    }
  }

  handleImportJson(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const success = window.quizDataManager.importFromJson(event.target.result);
      if (success) {
        this.renderQuizSelector();
      } else {
        alert("File JSON không hợp lệ!");
      }
    };
    reader.readAsText(file);
  }
}

window.hostApp = new HostController();
