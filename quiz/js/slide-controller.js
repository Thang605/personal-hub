/**
 * Slide Presentation Controller (Màn Hình Chiếu Câu Hỏi Theo Đề Mục Slide)
 * Tích hợp Bảng Thống Kê Số Người Làm Đúng / Sai Trực Tiếp Theo Thời Gian Thực Cho Giáo Viên.
 */

class SlideController {
  constructor() {
    this.lessonId = null;
    this.sectionIndex = 1;
    this.lesson = null;
    this.section = null;
    this.isRevealed = false;
    this.mySelectedOption = null;
    this.timerInterval = null;
    this.timeRemaining = 20;
    this.totalTime = 20;
    this.isTimerPaused = false;
    this.showQrModal = false;
    this.network = null;
    this.pin = null;
    this.liveVotes = [0, 0, 0, 0];
    this.votedCount = 0;
    this.isZalo = /Zalo/i.test(navigator.userAgent);
  }

  init() {
    // 1. Phân tích tham số từ URL
    const urlParams = new URLSearchParams(window.location.search);
    this.lessonId = urlParams.get("lesson") || "bai_giang_ai_2026";
    this.sectionIndex = Number(urlParams.get("sec") || 1);

    // 2. Lấy dữ liệu bài giảng
    this.lesson = window.slideDataManager.getById(this.lessonId);
    if (!this.lesson) {
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

    // 3. Khởi tạo kết nối mạng bình chọn thời gian thực an toàn
    this._initLiveNetwork();

    // 4. Render giao diện
    this.render();
    this.startTimer();
  }

  _initLiveNetwork() {
    try {
      if (typeof PeerNetwork !== "undefined") {
        this.network = new PeerNetwork();
        this.network.initHost(this.pin);

        this.network.on("player_vote", (data) => {
          if (data && data.choiceIndex >= 0 && data.choiceIndex < 4) {
            this.liveVotes[data.choiceIndex]++;
            this.votedCount++;
            this.updateLiveVotesDisplay();
            try { window.soundEffects.playClick(); } catch (e) {}
          }
        });
      }
    } catch (e) {
      console.warn("P2P Network unavailable:", e);
    }
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (this.isTimerPaused || this.isRevealed || this.mySelectedOption !== null) return;

      this.timeRemaining--;

      try {
        if (this.timeRemaining > 5) {
          window.soundEffects.playTick();
        } else if (this.timeRemaining > 0) {
          window.soundEffects.playTickFast();
        }
      } catch (e) {}

      this.updateTimerDisplay();

      if (this.timeRemaining <= 0) {
        clearInterval(this.timerInterval);
        this.timeRemaining = 0;
        try { window.soundEffects.playTimeUp(); } catch (e) {}
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
    this.mySelectedOption = null;
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

  // =========================================================================
  // CẬP NHẬT THỐNG KÊ SỐ NGƯỜI LÀM ĐÚNG / SAI CHO GIÁO VIÊN
  // =========================================================================
  updateLiveVotesDisplay() {
    const correctIdx = this.section.correct;
    const correctVotes = this.liveVotes[correctIdx] || 0;
    const wrongVotes = Math.max(0, this.votedCount - correctVotes);
    const correctPct = this.votedCount > 0 ? Math.round((correctVotes / this.votedCount) * 100) : 0;
    const wrongPct = this.votedCount > 0 ? (100 - correctPct) : 0;

    // 1. Cập nhật các badge thống kê trên thanh điều khiển của Giáo viên
    const totalEl = document.getElementById("teacher-stat-total");
    const correctEl = document.getElementById("teacher-stat-correct");
    const wrongEl = document.getElementById("teacher-stat-wrong");

    if (totalEl) totalEl.textContent = `${this.votedCount} người`;
    if (correctEl) correctEl.textContent = `Đúng: ${correctVotes} (${correctPct}%)`;
    if (wrongEl) wrongEl.textContent = `Chưa đúng: ${wrongVotes} (${wrongPct}%)`;

    // 2. Cập nhật số liệu trên từng ô A, B, C, D
    for (let i = 0; i < 4; i++) {
      const bar = document.getElementById(`slide-bar-${i}`);
      const countLabel = document.getElementById(`slide-vote-count-${i}`);
      const votes = this.liveVotes[i];
      const pct = this.votedCount > 0 ? Math.round((votes / this.votedCount) * 100) : 0;

      if (bar) bar.style.width = `${pct}%`;
      if (countLabel) countLabel.textContent = `${votes} (${pct}%)`;
    }

    // 3. Cập nhật báo cáo tổng kết trong khung giải thích
    this.updateClassAnalyticsBox(correctVotes, wrongVotes, correctPct);
  }

  updateClassAnalyticsBox(correctVotes, wrongVotes, correctPct) {
    const analyticsBox = document.getElementById("class-analytics-content");
    if (!analyticsBox) return;

    let evaluationText = "";
    let evalColor = "text-emerald-400";
    let evalBg = "bg-emerald-950/60 border-emerald-500/40";

    if (this.votedCount === 0) {
      evaluationText = "Chưa có lượt bình chọn nào từ học viên.";
      evalColor = "text-slate-400";
      evalBg = "bg-slate-800/60 border-slate-700";
    } else if (correctPct >= 80) {
      evaluationText = `🌟 <strong>Lớp tiếp thu xuất sắc (${correctPct}% làm đúng)</strong>: Toàn bộ lớp đã nắm rất chắc kiến thức trọng tâm của đề mục này!`;
      evalColor = "text-emerald-300";
      evalBg = "bg-emerald-950/60 border-emerald-500/40";
    } else if (correctPct >= 50) {
      evaluationText = `👍 <strong>Lớp nắm bài ở mức khá (${correctPct}% làm đúng)</strong>: Đa số đã hiểu bài. Giáo viên có thể nhắc lại điểm cốt lõi cho ${wrongVotes} bạn còn nhầm lẫn.`;
      evalColor = "text-amber-300";
      evalBg = "bg-amber-950/60 border-amber-500/40";
    } else {
      evaluationText = `💡 <strong>Cần lưu ý (${correctPct}% làm đúng)</strong>: Có ${wrongVotes} học viên chưa chọn đúng. Giáo viên nên dành 1-2 phút giải thích lại cơ chế của đề mục này.`;
      evalColor = "text-rose-300";
      evalBg = "bg-rose-950/60 border-rose-500/40";
    }

    analyticsBox.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center mb-3">
        <div class="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
          <span class="text-[11px] text-slate-400 font-bold block uppercase">Tổng số học viên làm</span>
          <span class="text-xl font-black text-white font-mono">${this.votedCount}</span>
        </div>
        <div class="p-3 bg-emerald-950/70 rounded-2xl border border-emerald-500/50">
          <span class="text-[11px] text-emerald-300 font-bold block uppercase">Số người làm ĐÚNG</span>
          <span class="text-xl font-black text-emerald-400 font-mono">${correctVotes} <span class="text-xs">(${correctPct}%)</span></span>
        </div>
        <div class="p-3 bg-rose-950/70 rounded-2xl border border-rose-500/50">
          <span class="text-[11px] text-rose-300 font-bold block uppercase">Số người làm SAI</span>
          <span class="text-xl font-black text-rose-400 font-mono">${wrongVotes} <span class="text-xs">(${100 - correctPct}%)</span></span>
        </div>
      </div>
      <div class="p-3 rounded-2xl border text-xs leading-relaxed ${evalBg} ${evalColor}">
        ${evaluationText}
      </div>
    `;
  }

  // =========================================================================
  // CHẠM CHỌN ĐÁP ÁN TRỰC TIẾP
  // =========================================================================
  selectOption(idx) {
    if (this.mySelectedOption !== null) return;
    this.mySelectedOption = idx;
    if (this.timerInterval) clearInterval(this.timerInterval);

    const correctIdx = this.section.correct;
    const isCorrect = idx === correctIdx;

    try {
      if (navigator && navigator.vibrate) {
        navigator.vibrate(isCorrect ? [40, 60, 40] : [100]);
      }
    } catch (e) {}

    this.liveVotes[idx]++;
    this.votedCount++;
    this.updateLiveVotesDisplay();

    try {
      if (isCorrect) {
        window.soundEffects.playCorrect();
      } else {
        window.soundEffects.playWrong();
      }
    } catch (e) {}

    try {
      if (isCorrect && window.confetti) {
        window.confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
      }
    } catch (e) {}

    for (let i = 0; i < 4; i++) {
      const card = document.getElementById(`opt-card-${i}`);
      if (card) {
        if (i === correctIdx) {
          card.classList.add("ring-4", "ring-emerald-400", "bg-emerald-950", "border-emerald-400");
          card.classList.remove("opacity-40", "grayscale-[40%]");
          const tag = card.querySelector(".choice-tag");
          if (tag) tag.innerHTML = `✓ Đúng`;
        } else if (i === idx) {
          card.classList.add("ring-4", "ring-rose-500", "bg-rose-950", "border-rose-400");
          const tag = card.querySelector(".choice-tag");
          if (tag) tag.innerHTML = `✕ Bạn chọn`;
        } else {
          card.classList.add("opacity-40", "grayscale-[50%]");
        }
      }
    }

    const explainBox = document.getElementById("explanation-box");
    if (explainBox) {
      explainBox.classList.remove("hidden");
      const statusHeader = document.getElementById("explain-status-header");
      if (statusHeader) {
        if (isCorrect) {
          statusHeader.innerHTML = `
            <span class="text-sm md:text-base font-black uppercase text-emerald-400 flex items-center gap-2 animate-bounce">
              <i data-lucide="check-circle" class="w-5 h-5"></i>
              🎉 CHÍNH XÁC! Bạn đã chọn đúng Phương án ${["A", "B", "C", "D"][correctIdx]}
            </span>
          `;
        } else {
          statusHeader.innerHTML = `
            <span class="text-sm md:text-base font-black uppercase text-rose-400 flex items-center gap-2">
              <i data-lucide="x-circle" class="w-5 h-5"></i>
              Chưa chính xác! Đáp án đúng là: Phương án ${["A", "B", "C", "D"][correctIdx]}
            </span>
          `;
        }
      }
      setTimeout(() => {
        try { explainBox.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (e) {}
      }, 100);
    }

    const revealBtn = document.getElementById("reveal-btn");
    if (revealBtn) {
      revealBtn.classList.add("hidden");
    }

    if (window.lucide) {
      try { lucide.createIcons(); } catch (e) {}
    }
  }

  // ==========================================
  // XEM ĐÁP ÁN & GIẢI THÍCH (DÀNH CHO GIẢNG VIÊN)
  // ==========================================
  revealAnswer() {
    if (this.isRevealed) return;
    this.isRevealed = true;
    if (this.timerInterval) clearInterval(this.timerInterval);

    const correctIdx = this.section.correct;
    try { window.soundEffects.playCorrect(); } catch (e) {}

    try {
      if (window.confetti) {
        window.confetti({ particleCount: 70, spread: 60, origin: { y: 0.8 } });
      }
    } catch (e) {}

    for (let i = 0; i < 4; i++) {
      const card = document.getElementById(`opt-card-${i}`);
      if (card) {
        if (i === correctIdx) {
          card.classList.add("ring-4", "ring-emerald-400", "bg-emerald-950", "border-emerald-400");
          card.classList.remove("opacity-40", "grayscale-[40%]");
          const tag = card.querySelector(".choice-tag");
          if (tag) tag.innerHTML = `✓ Đáp án đúng`;
        } else {
          card.classList.add("opacity-40", "grayscale-[50%]");
        }
      }
    }

    const explainBox = document.getElementById("explanation-box");
    if (explainBox) {
      explainBox.classList.remove("hidden");
      const statusHeader = document.getElementById("explain-status-header");
      if (statusHeader) {
        statusHeader.innerHTML = `
          <span class="text-sm md:text-base font-black uppercase text-emerald-400 flex items-center gap-2">
            <i data-lucide="check-circle" class="w-5 h-5"></i>
            Đáp án chính xác: Phương án ${["A", "B", "C", "D"][correctIdx]}
          </span>
        `;
      }
      setTimeout(() => {
        try { explainBox.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (e) {}
      }, 100);
    }

    const revealBtn = document.getElementById("reveal-btn");
    if (revealBtn) {
      revealBtn.classList.add("hidden");
    }

    this.updateLiveVotesDisplay();

    if (window.lucide) {
      try { lucide.createIcons(); } catch (e) {}
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

    const origin = window.location.origin;
    const path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/"));
    const playerUrl = `${origin}${path}/slide.html?lesson=${encodeURIComponent(this.lessonId)}&sec=${this.sectionIndex}`;

    const optionColors = [
      { bg: "bg-red-500", border: "border-red-500", label: "A", icon: "▲", barClass: "live-bar-a" },
      { bg: "bg-blue-500", border: "border-blue-500", label: "B", icon: "◆", barClass: "live-bar-b" },
      { bg: "bg-amber-500", border: "border-amber-500", label: "C", icon: "●", barClass: "live-bar-c" },
      { bg: "bg-emerald-500", border: "border-emerald-500", label: "D", icon: "■", barClass: "live-bar-d" }
    ];

    container.innerHTML = `
      <div class="min-h-screen flex flex-col justify-between p-3 sm:p-6 md:p-8 bg-game-dark bg-game-glow text-white">
        
        <!-- Top Bar: Navigation & Slide Context -->
        <header class="max-w-6xl mx-auto w-full flex items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 shrink-0">
              <i data-lucide="presentation" class="w-3.5 h-3.5 text-indigo-400"></i>
              <span>CHECKPOINT</span>
            </span>
            <div class="truncate">
              <h1 class="text-xs sm:text-sm md:text-base font-extrabold text-white truncate max-w-xs sm:max-w-md md:max-w-xl">${this.lesson.title}</h1>
              <p class="text-[11px] sm:text-xs font-semibold text-indigo-300 truncate">${currentSec.sectionTitle}</p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button type="button" onclick="slideApp.toggleFullscreen()" class="p-2 rounded-xl glass-panel hover:bg-slate-700/80 text-slate-300 transition" title="Toàn màn hình">
              <i data-lucide="maximize" class="w-4 h-4"></i>
            </button>
            <button type="button" onclick="slideApp.toggleQrModal()" class="px-3 py-1.5 glass-panel hover:bg-slate-700/80 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5 transition">
              <i data-lucide="qr-code" class="w-3.5 h-3.5 text-pink-400"></i>
              <span class="hidden sm:inline">Mã QR</span>
            </button>
          </div>
        </header>

        <!-- Main Question Presentation Area -->
        <main class="max-w-6xl mx-auto w-full my-auto py-3 space-y-4 sm:space-y-6">
          
          <!-- TEACHER LIVE DASHBOARD BAR: THỐNG KÊ ĐÚNG / SAI TRỰC TIẾP -->
          <div class="glass-panel p-3 sm:p-4 rounded-2xl border border-indigo-500/30 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div class="flex items-center gap-2">
              <span class="text-xs font-black text-indigo-300 uppercase flex items-center gap-1.5">
                <i data-lucide="bar-chart-2" class="w-4 h-4 text-pink-400"></i>
                <span>Thống kê kết quả:</span>
              </span>
            </div>

            <div class="flex flex-wrap items-center gap-2 text-xs font-bold font-mono">
              <span class="px-3 py-1 bg-slate-800/90 text-slate-200 rounded-xl border border-slate-700">
                👥 <span id="teacher-stat-total">0 người</span>
              </span>
              <span class="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/40">
                ✅ <span id="teacher-stat-correct">Đúng: 0 (0%)</span>
              </span>
              <span class="px-3 py-1 bg-rose-500/20 text-rose-300 rounded-xl border border-rose-500/40">
                ❌ <span id="teacher-stat-wrong">Chưa đúng: 0 (0%)</span>
              </span>
            </div>

            <!-- Timer info -->
            <div class="flex items-center gap-2">
              <span class="flex items-center gap-1 text-amber-400 font-mono text-xs sm:text-sm font-black">
                <i data-lucide="timer" class="w-3.5 h-3.5"></i>
                <span id="slide-timer-num">${this.timeRemaining}</span>s
              </span>
              <button type="button" onclick="slideApp.togglePauseTimer()" class="p-1 hover:text-white" title="Tạm dừng/Tiếp tục">
                <i id="pause-icon" data-lucide="pause" class="w-3.5 h-3.5"></i>
              </button>
              <button type="button" onclick="slideApp.resetTimer()" class="p-1 hover:text-white" title="Đếm lại">
                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>

          <!-- Timer Bar -->
          <div class="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div id="slide-timer-progress" class="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-linear" style="width: 100%;"></div>
          </div>

          <!-- Question Card -->
          <div class="glass-panel p-6 sm:p-8 md:p-10 rounded-3xl text-center shadow-2xl border-indigo-500/20 space-y-2">
            <span class="inline-block px-3 py-0.5 rounded-full text-[11px] font-black bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 uppercase tracking-wider">
              Câu hỏi củng cố Đề mục ${this.sectionIndex}
            </span>
            <h2 class="text-xl sm:text-2xl md:text-3xl font-black text-white leading-snug tracking-tight">${currentSec.question}</h2>
            <p class="text-[11px] sm:text-xs text-indigo-300 font-semibold flex items-center justify-center gap-1.5 pt-1">
              <span>👉 Chạm vào 1 phương án (A, B, C, D) để chọn câu trả lời</span>
            </p>
          </div>

          <!-- 4 Native BUTTON Option Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            ${currentSec.choices.map((choice, idx) => {
              const opt = optionColors[idx];
              return `
                <button 
                  type="button"
                  id="opt-card-${idx}" 
                  onclick="slideApp.selectOption(${idx})" 
                  class="choice-btn glass-card text-left w-full relative overflow-hidden p-4 sm:p-5 md:p-6 rounded-3xl border border-slate-700/60 transition duration-150 cursor-pointer hover:border-indigo-400 active:scale-95 group shadow-lg focus:outline-none">
                  
                  <!-- Live Vote Progress Bar Fill -->
                  <div id="slide-bar-${idx}" class="absolute inset-0 ${opt.barClass} opacity-30 transition-all duration-300 ease-out pointer-events-none" style="width: 0%;"></div>

                  <div class="relative z-10 flex items-center justify-between gap-3 pointer-events-none">
                    <div class="flex items-center gap-3 sm:gap-4">
                      <span class="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl ${opt.bg} text-white font-black text-base sm:text-lg flex items-center justify-center shadow-lg shrink-0 group-hover:scale-105 transition">
                        ${opt.label}
                      </span>
                      <span class="text-sm sm:text-base font-bold text-white leading-snug">${choice}</span>
                    </div>
                    
                    <div class="flex flex-col items-end gap-1 shrink-0">
                      <span class="choice-tag text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                        Chọn
                      </span>
                      <span id="slide-vote-count-${idx}" class="text-[10px] font-mono text-slate-400">
                        0 (0%)
                      </span>
                    </div>
                  </div>
                </button>
              `;
            }).join("")}
          </div>

          <!-- Reveal Button -->
          <div class="text-center pt-1">
            <button 
              type="button"
              id="reveal-btn" 
              onclick="slideApp.revealAnswer()" 
              class="px-6 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 mx-auto transition transform hover:scale-105 active:scale-95">
              <i data-lucide="lightbulb" class="w-4 h-4 fill-white"></i>
              <span>Xem Đáp Án Đúng & Thống Kê Chi Tiết</span>
            </button>
          </div>

          <!-- Explanation & Class Analytics Box -->
          <div id="explanation-box" class="hidden p-5 sm:p-6 md:p-8 rounded-3xl bg-slate-900/95 border-2 border-emerald-500/80 shadow-2xl space-y-4 animate-fade-in">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div id="explain-status-header">
                <span class="text-sm md:text-base font-black uppercase text-emerald-400 flex items-center gap-2">
                  <i data-lucide="check-circle" class="w-5 h-5"></i>
                  Đáp án chính xác: Phương án ${["A", "B", "C", "D"][currentSec.correct]}
                </span>
              </div>
              <span class="text-[11px] text-slate-400 font-semibold hidden sm:inline">Phân tích kết quả lớp học</span>
            </div>

            <!-- Khung thống kê sư phạm cho Giáo Viên -->
            <div id="class-analytics-content"></div>

            <div class="space-y-1 pt-1">
              <span class="text-xs font-bold text-indigo-300 block">💡 Giải thích chi tiết:</span>
              <p class="text-xs sm:text-sm md:text-base text-slate-200 leading-relaxed font-medium">${currentSec.explanation || "Chúc mừng bạn đã nắm vững nội dung của đề mục này!"}</p>
            </div>

            ${currentSec.keyTakeaway ? `
              <div class="p-3.5 sm:p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-xs sm:text-sm text-indigo-200 font-bold leading-relaxed">
                ${currentSec.keyTakeaway}
              </div>
            ` : ""}
          </div>

        </main>

        <!-- Bottom Bar: Section Pagination & Return to PowerPoint -->
        <footer class="max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
          
          <div class="flex items-center gap-2">
            ${hasPrev ? `
              <a href="slide.html?lesson=${encodeURIComponent(this.lessonId)}&sec=${this.sectionIndex - 1}" class="px-3.5 py-1.5 glass-panel hover:bg-slate-700/80 rounded-xl text-slate-200 font-bold flex items-center gap-1 transition">
                <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
                <span>Đề mục ${this.sectionIndex - 1}</span>
              </a>
            ` : `
              <span class="px-3.5 py-1.5 glass-panel rounded-xl text-slate-600 font-bold opacity-50 cursor-not-allowed">Đề mục 1</span>
            `}

            <span class="px-2.5 py-1 font-bold text-slate-400 text-[11px]">Đề mục ${this.sectionIndex} / ${totalSecs}</span>

            ${hasNext ? `
              <a href="slide.html?lesson=${encodeURIComponent(this.lessonId)}&sec=${this.sectionIndex + 1}" class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold flex items-center gap-1 shadow-lg shadow-indigo-600/30 transition">
                <span>Đề mục ${this.sectionIndex + 1}</span>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
              </a>
            ` : `
              <span class="px-3.5 py-1.5 glass-panel rounded-xl text-emerald-400 font-bold">🎉 Hoàn thành</span>
            `}
          </div>

          <div class="flex items-center gap-3 text-slate-400 text-[11px]">
            <span class="hidden md:inline">Nhấn <kbd class="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono">Alt + Tab</kbd> để quay lại PowerPoint</span>
            <button type="button" onclick="window.close()" class="px-3 py-1 glass-panel hover:bg-rose-500/20 text-rose-300 rounded-xl font-semibold transition">
              Đóng tab
            </button>
          </div>
        </footer>

        <!-- QR Code Slide Modal -->
        <div id="slide-qr-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div class="glass-panel p-6 sm:p-8 rounded-3xl max-w-xs sm:max-w-sm w-full text-center space-y-4 border-indigo-500/40 animate-pop-in">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 class="text-sm sm:text-base font-black text-white">Quét QR Để Bình Chọn</h3>
              <button type="button" onclick="slideApp.toggleQrModal()" class="text-slate-400 hover:text-white p-1">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            </div>

            <div class="p-3 bg-white rounded-2xl mx-auto inline-block shadow-2xl">
              <div id="section-qrcode-box" class="w-[160px] h-[160px] flex items-center justify-center"></div>
            </div>

            <p class="text-[11px] text-slate-300">Quét mã bằng camera điện thoại hoặc Zalo để chọn đáp án A, B, C, D trực tiếp.</p>

            <button type="button" onclick="slideApp.toggleQrModal()" class="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white shadow-lg">
              Đóng
            </button>
          </div>
        </div>

      </div>
    `;

    if (window.lucide) {
      try { lucide.createIcons(); } catch (e) {}
    }

    setTimeout(() => {
      const qrEl = document.getElementById("section-qrcode-box");
      if (qrEl && window.QRCode) {
        qrEl.innerHTML = "";
        new QRCode(qrEl, {
          text: playerUrl,
          width: 150,
          height: 150,
          colorDark: "#0f172a",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.M
        });
      }
    }, 100);

    this.updateLiveVotesDisplay();
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
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    } catch (e) {}
  }
}

window.slideApp = new SlideController();
