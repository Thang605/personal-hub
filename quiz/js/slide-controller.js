/**
 * Slide Presentation Controller (Màn Hình Chiếu Câu Hỏi Theo Đề Mục Slide)
 * Tích Hợp Thường Trực Mã QR + Bảng Kết Quả Trả Lời Đúng/Sai Của Học Viên Ngay Trên Màn Hình.
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

    // 3. Khởi tạo kết nối mạng bình chọn thời gian thực
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
  // CẬP NHẬT BẢNG KẾT QUẢ ĐÚNG / SAI & PHÂN BỔ TRỰC TIẾP
  // =========================================================================
  updateLiveVotesDisplay() {
    const correctIdx = this.section.correct;
    const correctVotes = this.liveVotes[correctIdx] || 0;
    const wrongVotes = Math.max(0, this.votedCount - correctVotes);
    const correctPct = this.votedCount > 0 ? Math.round((correctVotes / this.votedCount) * 100) : 0;
    const wrongPct = this.votedCount > 0 ? (100 - correctPct) : 0;

    // 1. Cập nhật Bảng Thống Kê Nhanh (Sidebar Results Panel)
    const sideTotal = document.getElementById("side-stat-total");
    const sideCorrect = document.getElementById("side-stat-correct");
    const sideWrong = document.getElementById("side-stat-wrong");
    const sideAccuracyBar = document.getElementById("side-accuracy-bar");

    if (sideTotal) sideTotal.textContent = `${this.votedCount}`;
    if (sideCorrect) sideCorrect.textContent = `${correctVotes} (${correctPct}%)`;
    if (sideWrong) sideWrong.textContent = `${wrongVotes} (${wrongPct}%)`;
    if (sideAccuracyBar) sideAccuracyBar.style.width = `${correctPct}%`;

    // 2. Cập nhật danh sách phân bổ A, B, C, D trong bảng kết quả
    for (let i = 0; i < 4; i++) {
      const votes = this.liveVotes[i];
      const pct = this.votedCount > 0 ? Math.round((votes / this.votedCount) * 100) : 0;
      
      const sideBar = document.getElementById(`side-bar-${i}`);
      const sideText = document.getElementById(`side-text-${i}`);
      const cardBar = document.getElementById(`slide-bar-${i}`);
      const cardCount = document.getElementById(`slide-vote-count-${i}`);

      if (sideBar) sideBar.style.width = `${pct}%`;
      if (sideText) sideText.textContent = `${votes} (${pct}%)`;
      if (cardBar) cardBar.style.width = `${pct}%`;
      if (cardCount) cardCount.textContent = `${votes} (${pct}%)`;
    }

    // 3. Cập nhật đánh giá mức độ tiếp thu
    const evalText = document.getElementById("side-eval-text");
    if (evalText) {
      if (this.votedCount === 0) {
        evalText.innerHTML = "Đang chờ học viên quét mã QR và gửi bình chọn...";
      } else if (correctPct >= 80) {
        evalText.innerHTML = `🌟 <strong>Xuất sắc (${correctPct}% đúng)</strong>: Toàn bộ lớp đã hiểu rất rõ đề mục này!`;
      } else if (correctPct >= 50) {
        evalText.innerHTML = `👍 <strong>Khá (${correctPct}% đúng)</strong>: Đa số đã nắm được bài, có ${wrongVotes} bạn còn nhầm lẫn.`;
      } else {
        evalText.innerHTML = `💡 <strong>Lưu ý (${correctPct}% đúng)</strong>: Có ${wrongVotes} bạn chưa đúng, giáo viên nên giải thích lại.`;
      }
    }
  }

  // =========================================================================
  // CHẠM CHỌN ĐÁP ÁN TRỰC TIẾP (KHI HỌC VIÊN QUÉT QR BẰNG ĐIỆN THOẠI)
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
        if (window.confetti) {
          window.confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
        }
      } else {
        window.soundEffects.playWrong();
      }
    } catch (e) {}

    // Làm nổi bật thẻ được chọn
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

    // Hiển thị khung giải thích
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
  // RENDER MÀN HÌNH CHÍNH (SIDE-BY-SIDE: CÂU HỎI + MÃ QR + BẢNG KẾT QUẢ LIVE)
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
      <div class="min-h-screen flex flex-col justify-between p-3 sm:p-5 md:p-6 bg-game-dark bg-game-glow text-white">
        
        <!-- Zalo In-App Browser Compatibility Banner -->
        ${this.isZalo ? `
          <div class="max-w-7xl mx-auto w-full mb-2 p-2.5 bg-indigo-900/90 border border-indigo-400/50 rounded-2xl flex items-center justify-between text-xs text-indigo-100">
            <span class="flex items-center gap-1.5 font-bold">
              <span>📱</span> Bạn đang mở trong Zalo. Hãy chạm vào 1 trong 4 ô màu để chọn đáp án!
            </span>
          </div>
        ` : ''}

        <!-- Top Header -->
        <header class="max-w-7xl mx-auto w-full flex items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 shrink-0">
              <i data-lucide="presentation" class="w-3.5 h-3.5 text-indigo-400"></i>
              <span>SLIDE CHECKPOINT</span>
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
            <a href="slide-builder.html" class="p-2 rounded-xl glass-panel hover:bg-slate-700/80 text-slate-300 transition" title="Quản lý bài giảng">
              <i data-lucide="settings" class="w-4 h-4"></i>
            </a>
          </div>
        </header>

        <!-- Main Layout: 2 Columns (Left: Question & Options / Right: QR Code & Live Results Table) -->
        <main class="max-w-7xl mx-auto w-full my-auto py-3 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          <!-- LEFT COLUMN (7 Cols / Question & 4 Buttons) -->
          <div class="lg:col-span-8 space-y-4">
            
            <!-- Timer Bar & Status Row -->
            <div class="space-y-1.5">
              <div class="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                <div id="slide-timer-progress" class="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-linear" style="width: 100%;"></div>
              </div>
              
              <div class="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                <div class="flex items-center gap-3">
                  <span class="flex items-center gap-1 text-amber-400 font-mono text-sm font-black">
                    <i data-lucide="timer" class="w-3.5 h-3.5"></i>
                    <span id="slide-timer-num">${this.timeRemaining}</span>s
                  </span>
                  <button type="button" onclick="slideApp.togglePauseTimer()" class="hover:text-white p-1" title="Tạm dừng / Đếm tiếp">
                    <i id="pause-icon" data-lucide="pause" class="w-3.5 h-3.5"></i>
                  </button>
                  <button type="button" onclick="slideApp.resetTimer()" class="hover:text-white p-1" title="Đếm lại">
                    <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                  </button>
                </div>

                <span class="text-indigo-300 text-[11px] font-semibold">
                  👉 Chạm vào 1 ô màu để chọn đáp án
                </span>
              </div>
            </div>

            <!-- Big Question Card -->
            <div class="glass-panel p-5 sm:p-7 rounded-3xl text-center shadow-xl border-indigo-500/20 space-y-2">
              <span class="inline-block px-3 py-0.5 rounded-full text-[11px] font-black bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 uppercase tracking-wider">
                Câu hỏi củng cố Đề mục ${this.sectionIndex}
              </span>
              <h2 class="text-lg sm:text-2xl md:text-3xl font-black text-white leading-snug tracking-tight">${currentSec.question}</h2>
            </div>

            <!-- 4 Option Buttons (Touch & Click) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              ${currentSec.choices.map((choice, idx) => {
                const opt = optionColors[idx];
                return `
                  <button 
                    type="button"
                    id="opt-card-${idx}" 
                    onclick="slideApp.selectOption(${idx})" 
                    class="choice-btn glass-card text-left w-full relative overflow-hidden p-3.5 sm:p-4 rounded-2xl border border-slate-700/60 transition duration-150 cursor-pointer hover:border-indigo-400 active:scale-95 group shadow-lg focus:outline-none">
                    
                    <div id="slide-bar-${idx}" class="absolute inset-0 ${opt.barClass} opacity-30 transition-all duration-300 ease-out pointer-events-none" style="width: 0%;"></div>

                    <div class="relative z-10 flex items-center justify-between gap-3 pointer-events-none">
                      <div class="flex items-center gap-3">
                        <span class="w-9 h-9 rounded-xl ${opt.bg} text-white font-black text-base flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition">
                          ${opt.label}
                        </span>
                        <span class="text-xs sm:text-sm font-bold text-white leading-snug">${choice}</span>
                      </div>
                      
                      <div class="flex flex-col items-end gap-0.5 shrink-0">
                        <span class="choice-tag text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
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
                class="px-6 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 mx-auto transition transform hover:scale-105 active:scale-95">
                <i data-lucide="lightbulb" class="w-4 h-4 fill-white"></i>
                <span>Xem Đáp Án Đúng & Giải Thích Chi Tiết</span>
              </button>
            </div>

            <!-- Explanation & Key Takeaways Card -->
            <div id="explanation-box" class="hidden p-5 rounded-3xl bg-slate-900/95 border-2 border-emerald-500/80 shadow-2xl space-y-3 animate-fade-in">
              <div id="explain-status-header">
                <span class="text-sm font-black uppercase text-emerald-400 flex items-center gap-2">
                  <i data-lucide="check-circle" class="w-5 h-5"></i>
                  Đáp án chính xác: Phương án ${["A", "B", "C", "D"][currentSec.correct]}
                </span>
              </div>
              <p class="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">${currentSec.explanation || "Chúc mừng bạn đã nắm vững nội dung của đề mục này!"}</p>
              ${currentSec.keyTakeaway ? `
                <div class="p-3 bg-indigo-950/60 border border-indigo-500/40 rounded-xl text-xs text-indigo-200 font-bold leading-relaxed">
                  ${currentSec.keyTakeaway}
                </div>
              ` : ""}
            </div>

          </div>

          <!-- RIGHT COLUMN (4 Cols / PERMANENT QR CODE & LIVE RESULTS TABLE) -->
          <div class="lg:col-span-4 space-y-4">
            
            <!-- QR CODE BOX (Thường Trực Trên Màn Hình Máy Chiếu) -->
            <div class="glass-panel p-5 rounded-3xl text-center space-y-3 border-indigo-500/30 shadow-xl">
              <div class="space-y-0.5">
                <span class="text-[10px] font-black uppercase tracking-wider text-pink-400 flex items-center justify-center gap-1">
                  <i data-lucide="scan-line" class="w-3.5 h-3.5"></i>
                  <span>Quét Mã QR Để Trả Lời</span>
                </span>
                <p class="text-xs font-bold text-white">Dùng Zalo hoặc Camera điện thoại</p>
              </div>

              <div class="p-3 bg-white rounded-2xl mx-auto inline-block shadow-lg">
                <div id="live-side-qrcode" class="w-[140px] h-[140px] sm:w-[150px] sm:h-[150px] flex items-center justify-center"></div>
              </div>

              <div class="text-[11px] text-slate-400 font-medium">
                Học viên quét mã để trả lời ngay trên điện thoại
              </div>
            </div>

            <!-- BẢNG KẾT QUẢ TRẢ LỜI TRỰC TIẾP (LIVE RESULTS TABLE) -->
            <div class="glass-panel p-5 rounded-3xl space-y-3.5 border-indigo-500/30 shadow-xl">
              <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 class="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <i data-lucide="bar-chart-2" class="w-4 h-4 text-pink-400"></i>
                  <span>Bảng Kết Quả Lớp Học</span>
                </h3>
                <span class="text-[11px] font-mono text-slate-400">Thời gian thực</span>
              </div>

              <!-- Quick 3 Stats -->
              <div class="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div class="p-2 bg-slate-900/80 rounded-xl border border-slate-700/80">
                  <span class="text-[9px] font-bold text-slate-400 block uppercase">Đã làm</span>
                  <span id="side-stat-total" class="text-base font-black text-white">0</span>
                </div>
                <div class="p-2 bg-emerald-950/70 rounded-xl border border-emerald-500/40">
                  <span class="text-[9px] font-bold text-emerald-400 block uppercase">Đúng</span>
                  <span id="side-stat-correct" class="text-xs font-black text-emerald-300">0 (0%)</span>
                </div>
                <div class="p-2 bg-rose-950/70 rounded-xl border border-rose-500/40">
                  <span class="text-[9px] font-bold text-rose-400 block uppercase">Sai</span>
                  <span id="side-stat-wrong" class="text-xs font-black text-rose-300">0 (0%)</span>
                </div>
              </div>

              <!-- Accuracy Progress Bar -->
              <div class="space-y-1">
                <div class="flex items-center justify-between text-[11px] text-slate-400 font-bold">
                  <span>Tỉ lệ trả lời đúng của lớp</span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div id="side-accuracy-bar" class="h-full bg-emerald-500 rounded-full transition-all duration-300" style="width: 0%;"></div>
                </div>
              </div>

              <!-- Phân Bổ Chi Tiết 4 Phương Án A, B, C, D -->
              <div class="space-y-1.5 pt-1 text-xs">
                ${['A', 'B', 'C', 'D'].map((lbl, idx) => `
                  <div class="flex items-center justify-between gap-2 p-1.5 bg-slate-900/60 rounded-xl relative overflow-hidden">
                    <div id="side-bar-${idx}" class="absolute inset-0 ${optionColors[idx].barClass} opacity-30 transition-all duration-300" style="width: 0%;"></div>
                    <span class="relative z-10 font-bold text-white flex items-center gap-1.5 text-[11px]">
                      <span class="w-4 h-4 rounded-md ${optionColors[idx].bg} text-white font-black text-[9px] flex items-center justify-center">${lbl}</span>
                      ${idx === currentSec.correct ? '<span class="text-emerald-400 text-[10px]">(Đúng)</span>' : ''}
                    </span>
                    <span id="side-text-${idx}" class="relative z-10 font-mono text-[10px] font-bold text-slate-300">0 (0%)</span>
                  </div>
                `).join('')}
              </div>

              <!-- Đánh Giá Mức Độ Tiếp Thu -->
              <div id="side-eval-text" class="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] leading-relaxed text-slate-400">
                Đang chờ học viên quét mã QR và gửi bình chọn...
              </div>

            </div>

          </div>

        </main>

        <!-- Bottom Bar: Section Pagination & Return to PowerPoint -->
        <footer class="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
          
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

      </div>
    `;

    if (window.lucide) {
      try { lucide.createIcons(); } catch (e) {}
    }

    // Sinh mã QR thường trực trên màn hình
    setTimeout(() => {
      const qrEl = document.getElementById("live-side-qrcode");
      if (qrEl && window.QRCode) {
        qrEl.innerHTML = "";
        new QRCode(qrEl, {
          text: playerUrl,
          width: 140,
          height: 140,
          colorDark: "#0f172a",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.M
        });
      }
    }, 100);

    this.updateLiveVotesDisplay();
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
