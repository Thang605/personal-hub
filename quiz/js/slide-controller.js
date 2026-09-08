/**
 * Slide Presentation Controller (Màn Hình Chiếu Câu Hỏi Theo Đề Mục Slide)
 * Tối ưu hóa cho máy chiếu phòng học, hỗ trợ xem đáp án nhanh và bình chọn trực tiếp qua QR.
 */

class SlideController {
  constructor() {
    this.lessonId = null;
    this.sectionIndex = 1;
    this.lesson = null;
    this.section = null;
    this.isRevealed = false;
    this.timerInterval = null;
    this.timeRemaining = 20;
    this.totalTime = 20;
    this.isTimerPaused = false;
    this.showQrModal = false;
    this.network = null;
    this.pin = null;
    this.liveVotes = [0, 0, 0, 0];
    this.votedCount = 0;
  }

  init() {
    // 1. Phân tích tham số từ URL
    const urlParams = new URLSearchParams(window.location.search);
    this.lessonId = urlParams.get("lesson") || "bai_giang_ai_2026";
    this.sectionIndex = Number(urlParams.get("sec") || 1);

    // 2. Lấy dữ liệu bài giảng
    this.lesson = window.slideDataManager.getById(this.lessonId);
    if (!this.lesson) {
      // Fallback về bài giảng đầu tiên
      const all = window.slideDataManager.getAll();
      if (all.length > 0) {
        this.lesson = all[0];
        this.lessonId = this.lesson.id;
      }
    }

    if (this.lesson) {
      this.section = window.slideDataManager.getSection(this.lessonId, this.sectionIndex);
      if (!this.section && this.lesson.sections.length > 0) {
        this.section = this.lesson.sections[0];
        this.sectionIndex = this.section.sectionIndex;
      }
    }

    if (!this.section) {
      document.getElementById("slide-app").innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6 text-center">
          <div class="glass-panel p-8 rounded-3xl max-w-md space-y-4">
            <i data-lucide="alert-circle" class="w-12 h-12 text-amber-400 mx-auto"></i>
            <h2 class="text-xl font-bold">Không tìm thấy câu hỏi đề mục!</h2>
            <p class="text-xs text-slate-400">Vui lòng kiểm tra lại đường link hoặc tạo bài giảng mới từ công cụ Quản lý.</p>
            <a href="slide-builder.html" class="inline-block px-5 py-2.5 bg-indigo-600 rounded-xl text-xs font-bold text-white shadow-lg">Mở Trình Quản Lý Bài Giảng</a>
          </div>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    this.totalTime = this.section.time || 20;
    this.timeRemaining = this.totalTime;
    this.pin = "sec_" + this.lessonId + "_" + this.sectionIndex;

    // 3. Khởi tạo kết nối mạng bình chọn thời gian thực
    this._initLiveNetwork();

    // 4. Render giao diện
    this.render();
    this.startTimer();
  }

  _initLiveNetwork() {
    try {
      this.network = new PeerNetwork();
      this.network.initHost(this.pin);

      this.network.on("player_vote", (data) => {
        if (data.choiceIndex >= 0 && data.choiceIndex < 4) {
          this.liveVotes[data.choiceIndex]++;
          this.votedCount++;
          this.updateLiveVotesDisplay();
          window.soundEffects.playClick();
        }
      });
    } catch (e) {
      console.warn("Lỗi khởi tạo P2P:", e);
    }
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (this.isTimerPaused || this.isRevealed) return;

      this.timeRemaining--;

      if (this.timeRemaining > 5) {
        window.soundEffects.playTick();
      } else if (this.timeRemaining > 0) {
        window.soundEffects.playTickFast();
      }

      this.updateTimerDisplay();

      if (this.timeRemaining <= 0) {
        clearInterval(this.timerInterval);
        this.timeRemaining = 0;
        window.soundEffects.playTimeUp();
        this.updateTimerDisplay();
      }
    }, 1000);
  }

  togglePauseTimer() {
    this.isTimerPaused = !this.isTimerPaused;
    const pauseIcon = document.getElementById("pause-icon");
    if (pauseIcon) {
      pauseIcon.setAttribute("data-lucide", this.isTimerPaused ? "play" : "pause");
      if (window.lucide) lucide.createIcons();
    }
  }

  resetTimer() {
    this.timeRemaining = this.totalTime;
    this.isTimerPaused = false;
    this.isRevealed = false;
    this.liveVotes = [0, 0, 0, 0];
    this.votedCount = 0;
    this.render();
    this.startTimer();
  }

  updateTimerDisplay() {
    const timerText = document.getElementById("slide-timer-num");
    const timerBar = document.getElementById("slide-timer-progress");
    if (timerText) {
      timerText.textContent = this.timeRemaining;
      if (this.timeRemaining <= 5 && this.timeRemaining > 0) {
        timerText.classList.add("timer-critical");
      } else {
        timerText.classList.remove("timer-critical");
      }
    }
    if (timerBar) {
      const pct = (this.timeRemaining / this.totalTime) * 100;
      timerBar.style.width = `${pct}%`;
    }
  }

  updateLiveVotesDisplay() {
    const badge = document.getElementById("live-voters-badge");
    if (badge) {
      badge.textContent = `${this.votedCount} lượt bình chọn trực tiếp`;
    }

    for (let i = 0; i < 4; i++) {
      const bar = document.getElementById(`slide-bar-${i}`);
      const countLabel = document.getElementById(`slide-vote-count-${i}`);
      const votes = this.liveVotes[i];
      const pct = this.votedCount > 0 ? Math.round((votes / this.votedCount) * 100) : 0;

      if (bar) bar.style.width = `${pct}%`;
      if (countLabel) countLabel.textContent = `${votes} (${pct}%)`;
    }
  }

  // ==========================================
  // XEM ĐÁP ÁN & GIẢI THÍCH
  // ==========================================
  revealAnswer() {
    if (this.isRevealed) return;
    this.isRevealed = true;
    if (this.timerInterval) clearInterval(this.timerInterval);

    const correctIdx = this.section.correct;
    window.soundEffects.playCorrect();

    // Bắn pháo hoa ăn mừng
    if (window.confetti) {
      window.confetti({ particleCount: 70, spread: 60, origin: { y: 0.8 } });
    }

    // Báo cho các máy điện thoại người chơi nếu có
    if (this.network) {
      this.network.broadcast({
        type: "TIME_UP",
        correctIndex: correctIdx,
        explanation: this.section.explanation || "",
        keyTakeaway: this.section.keyTakeaway || ""
      });
    }

    // Cập nhật giao diện: làm nổi bật đáp án đúng
    for (let i = 0; i < 4; i++) {
      const card = document.getElementById(`opt-card-${i}`);
      if (card) {
        if (i === correctIdx) {
          card.classList.add("ring-4", "ring-emerald-400", "bg-emerald-950/70");
          card.classList.remove("opacity-50");
        } else {
          card.classList.add("opacity-40", "grayscale-[40%]");
        }
      }
    }

    // Hiển thị khung giải thích & Key Takeaway
    const explainBox = document.getElementById("explanation-box");
    if (explainBox) {
      explainBox.classList.remove("hidden");
      explainBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    const revealBtn = document.getElementById("reveal-btn");
    if (revealBtn) {
      revealBtn.classList.add("hidden");
    }
  }

  // ==========================================
  // RENDER MÀN HÌNH CHÍNH
  // ==========================================
  render() {
    const container = document.getElementById("slide-app");
    if (!container) return;

    const currentSec = this.section;
    const totalSecs = this.lesson.sections.length;
    const hasNext = this.sectionIndex < totalSecs;
    const hasPrev = this.sectionIndex > 1;

    // URL quét mã QR cho học viên
    const origin = window.location.origin;
    const path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/"));
    const playerUrl = `${origin}${path}/slide-player.html?lesson=${encodeURIComponent(this.lessonId)}&sec=${this.sectionIndex}`;

    const optionColors = [
      { bg: "bg-red-500", border: "border-red-500", label: "A", icon: "▲", barClass: "live-bar-a" },
      { bg: "bg-blue-500", border: "border-blue-500", label: "B", icon: "◆", barClass: "live-bar-b" },
      { bg: "bg-amber-500", border: "border-amber-500", label: "C", icon: "●", barClass: "live-bar-c" },
      { bg: "bg-emerald-500", border: "border-emerald-500", label: "D", icon: "■", barClass: "live-bar-d" }
    ];

    container.innerHTML = `
      <div class="min-h-screen flex flex-col justify-between p-4 md:p-8 bg-game-dark bg-game-glow text-white select-none">
        
        <!-- Top Bar: Navigation & Slide Context -->
        <header class="max-w-6xl mx-auto w-full flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div class="flex items-center gap-3">
            <span class="px-3.5 py-1.5 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-2">
              <i data-lucide="presentation" class="w-4 h-4 text-indigo-400"></i>
              <span>SLIDE CHECKPOINT</span>
            </span>
            <div>
              <h1 class="text-sm md:text-base font-extrabold text-white truncate max-w-md md:max-w-xl">${this.lesson.title}</h1>
              <p class="text-xs font-semibold text-indigo-300">${currentSec.sectionTitle}</p>
            </div>
          </div>

          <!-- Controls: Fullscreen, QR Modal, PowerPoint Tip -->
          <div class="flex items-center gap-2">
            <button onclick="slideApp.toggleFullscreen()" class="p-2.5 rounded-xl glass-panel hover:bg-slate-700/80 text-slate-300 transition" title="Toàn màn hình (F11)">
              <i data-lucide="maximize" class="w-4 h-4"></i>
            </button>
            <button onclick="slideApp.toggleQrModal()" class="px-3.5 py-2 glass-panel hover:bg-slate-700/80 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5 transition">
              <i data-lucide="qr-code" class="w-4 h-4 text-pink-400"></i>
              <span>Mã QR Bình Chọn</span>
            </button>
            <a href="slide-builder.html" class="p-2.5 rounded-xl glass-panel hover:bg-slate-700/80 text-slate-300 transition" title="Quản lý bộ câu hỏi">
              <i data-lucide="settings" class="w-4 h-4"></i>
            </a>
          </div>
        </header>

        <!-- Main Question Presentation Area -->
        <main class="max-w-6xl mx-auto w-full my-auto py-4 space-y-6">
          
          <!-- Timer Bar & Status Row -->
          <div class="space-y-2">
            <div class="w-full bg-slate-800/80 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
              <div id="slide-timer-progress" class="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-linear" style="width: 100%;"></div>
            </div>
            
            <div class="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
              <div class="flex items-center gap-3">
                <span class="flex items-center gap-1.5 text-amber-400 font-mono text-base font-black">
                  <i data-lucide="timer" class="w-4 h-4"></i>
                  <span id="slide-timer-num">${this.timeRemaining}</span>s
                </span>
                <button onclick="slideApp.togglePauseTimer()" class="hover:text-white p-1" title="Tạm dừng / Tiếp tục đếm">
                  <i id="pause-icon" data-lucide="pause" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="slideApp.resetTimer()" class="hover:text-white p-1" title="Đếm lại từ đầu">
                  <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                </button>
              </div>

              <div class="flex items-center gap-2">
                <span id="live-voters-badge" class="text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20 text-[11px]">
                  0 lượt bình chọn trực tiếp
                </span>
              </div>
            </div>
          </div>

          <!-- Question Card -->
          <div class="glass-panel p-8 md:p-12 rounded-3xl text-center shadow-2xl border-indigo-500/20">
            <span class="inline-block px-4 py-1 rounded-full text-xs font-black bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 uppercase tracking-wider mb-3">
              Câu hỏi củng cố Đề mục ${this.sectionIndex}
            </span>
            <h2 class="text-2xl md:text-4xl font-black text-white leading-snug tracking-tight">${currentSec.question}</h2>
          </div>

          <!-- 4 Option Cards with Live Distribution Bars -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${currentSec.choices.map((choice, idx) => {
              const opt = optionColors[idx];
              return `
                <div id="opt-card-${idx}" class="glass-card relative overflow-hidden p-5 md:p-6 rounded-3xl border border-slate-700/60 transition duration-300">
                  <!-- Live Vote Progress Bar Fill -->
                  <div id="slide-bar-${idx}" class="absolute inset-0 ${opt.barClass} opacity-30 transition-all duration-300 ease-out" style="width: 0%;"></div>

                  <div class="relative z-10 flex items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                      <span class="w-11 h-11 rounded-2xl ${opt.bg} text-white font-black text-lg flex items-center justify-center shadow-lg shrink-0">
                        ${opt.label}
                      </span>
                      <span class="text-base md:text-lg font-bold text-white leading-snug">${choice}</span>
                    </div>
                    
                    <span id="slide-vote-count-${idx}" class="text-xs font-mono font-bold text-indigo-200 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-700 shrink-0">
                      0 (0%)
                    </span>
                  </div>
                </div>
              `;
            }).join("")}
          </div>

          <!-- Reveal Button -->
          <div class="text-center pt-2">
            <button 
              id="reveal-btn" 
              onclick="slideApp.revealAnswer()" 
              class="px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-base rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-3 mx-auto transition transform hover:scale-105 active:scale-95">
              <i data-lucide="lightbulb" class="w-5 h-5 fill-white"></i>
              <span>Xem Đáp Án Đúng & Giải Thích Chi Tiết</span>
            </button>
          </div>

          <!-- Explanation & Key Takeaways Card (Hidden initially, revealed on click) -->
          <div id="explanation-box" class="hidden p-6 md:p-8 rounded-3xl bg-slate-900/95 border-2 border-emerald-500/80 shadow-2xl space-y-4 animate-fade-in">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <span class="text-sm font-black uppercase text-emerald-400 flex items-center gap-2">
                <i data-lucide="check-circle" class="w-5 h-5"></i>
                Đáp án chính xác: Phương án ${["A", "B", "C", "D"][currentSec.correct]}
              </span>
              <span class="text-xs text-slate-400 font-semibold">Tóm tắt củng cố kiến thức</span>
            </div>

            <p class="text-sm md:text-base text-slate-200 leading-relaxed font-medium">${currentSec.explanation || "Chúc mừng các bạn đã nắm vững nội dung của đề mục này!"}</p>

            ${currentSec.keyTakeaway ? `
              <div class="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-xs md:text-sm text-indigo-200 font-bold leading-relaxed">
                ${currentSec.keyTakeaway}
              </div>
            ` : ""}
          </div>

        </main>

        <!-- Bottom Bar: Section Pagination & Return to PowerPoint -->
        <footer class="max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800 text-xs">
          
          <!-- Prev / Next Section -->
          <div class="flex items-center gap-2">
            ${hasPrev ? `
              <a href="slide.html?lesson=${encodeURIComponent(this.lessonId)}&sec=${this.sectionIndex - 1}" class="px-4 py-2 glass-panel hover:bg-slate-700/80 rounded-xl text-slate-200 font-bold flex items-center gap-1.5 transition">
                <i data-lucide="arrow-left" class="w-4 h-4"></i>
                <span>Đề mục trước (${this.sectionIndex - 1})</span>
              </a>
            ` : `
              <span class="px-4 py-2 glass-panel rounded-xl text-slate-600 font-bold opacity-50 cursor-not-allowed">Đề mục đầu tiên</span>
            `}

            <span class="px-3 py-1 font-bold text-slate-400">Đề mục ${this.sectionIndex} / ${totalSecs}</span>

            ${hasNext ? `
              <a href="slide.html?lesson=${encodeURIComponent(this.lessonId)}&sec=${this.sectionIndex + 1}" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition">
                <span>Đề mục tiếp theo (${this.sectionIndex + 1})</span>
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </a>
            ` : `
              <span class="px-4 py-2 glass-panel rounded-xl text-emerald-400 font-bold">🎉 Kết thúc bài giảng</span>
            `}
          </div>

          <!-- Quick Return Tip -->
          <div class="flex items-center gap-3 text-slate-400">
            <span class="hidden md:inline">Nhấn <kbd class="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[10px]">Alt + Tab</kbd> để quay lại PowerPoint</span>
            <button onclick="window.close()" class="px-3 py-1.5 glass-panel hover:bg-rose-500/20 hover:border-rose-500/40 text-rose-300 rounded-xl font-semibold transition">
              Đóng tab câu hỏi
            </button>
          </div>
        </footer>

        <!-- QR Code Slide Modal (Bật/Tắt khi cần cho cả lớp quét) -->
        <div id="slide-qr-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div class="glass-panel p-8 rounded-3xl max-w-sm w-full text-center space-y-5 border-indigo-500/40 animate-pop-in">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 class="text-base font-black text-white">Quét QR Để Bình Chọn</h3>
              <button onclick="slideApp.toggleQrModal()" class="text-slate-400 hover:text-white p-1">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>

            <div class="p-4 bg-white rounded-3xl mx-auto inline-block shadow-2xl">
              <div id="section-qrcode-box" class="w-[180px] h-[180px] flex items-center justify-center"></div>
            </div>

            <p class="text-xs text-slate-300">Người nghe quét mã để chọn đáp án A, B, C, D trên điện thoại.</p>

            <button onclick="slideApp.toggleQrModal()" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white shadow-lg">
              Đóng cửa sổ QR
            </button>
          </div>
        </div>

      </div>
    `;

    if (window.lucide) lucide.createIcons();

    // Sinh mã QR cho modal
    setTimeout(() => {
      const qrEl = document.getElementById("section-qrcode-box");
      if (qrEl && window.QRCode) {
        qrEl.innerHTML = "";
        new QRCode(qrEl, {
          text: playerUrl,
          width: 170,
          height: 170,
          colorDark: "#0f172a",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.M
        });
      }
    }, 100);
  }

  toggleQrModal() {
    this.showQrModal = !this.showQrModal;
    const modal = document.getElementById("slide-qr-modal");
    if (modal) {
      if (this.showQrModal) {
        modal.classList.remove("hidden");
      } else {
        modal.classList.add("hidden");
      }
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Fullscreen not supported or blocked:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }
}

window.slideApp = new SlideController();
