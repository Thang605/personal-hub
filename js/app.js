/**
 * Personal Hub - Core Application Controller & Router
 * Điều phối các module, thanh điều hướng sidebar, thanh tìm kiếm toàn cục và thông báo Toast.
 */

class AppController {
  constructor() {
    this.currentView = "dashboard";
    this.viewParams = {};
    this.sidebarCollapsed = false;
  }

  init() {
    // 1. Áp dụng theme (sáng / tối)
    const settings = window.storageService.get("settings") || {};
    this.applyTheme(settings.theme || "dark");

    // 2. Thiết lập thời gian tự động khóa két
    if (settings.autoLockMinutes) {
      window.cryptoService.autoLockMinutes = Number(settings.autoLockMinutes);
    }

    // 3. Đăng ký các sự kiện toàn cục
    window.addEventListener("vault-autolocked", () => {
      this.showToast("Két bảo mật đã tự động khóa vì an toàn!", "info");
      if (this.currentView === "vault") {
        this.render();
      }
    });

    // Lắng nghe phím tắt Ctrl+K để mở tìm kiếm nhanh
    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        this.openGlobalSearch();
      }
    });

    // 4. Khởi chạy router ban đầu
    const hash = window.location.hash.replace("#", "") || "dashboard";
    this.navigate(hash);
  }

  applyTheme(theme) {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }

  navigate(viewName, params = {}) {
    this.currentView = viewName;
    this.viewParams = params;
    window.location.hash = viewName;
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  render() {
    const mainContainer = document.getElementById("main-content");
    const navContainer = document.getElementById("sidebar-nav");
    if (!mainContainer) return;

    // Cập nhật trạng thái active của menu
    this.renderSidebar();

    // Điều hướng module tương ứng
    let contentHtml = "";
    switch (this.currentView) {
      case "dashboard":
        contentHtml = window.DashboardModule.render(this.viewParams);
        break;
      case "notes":
        contentHtml = window.NotesModule.render(this.viewParams);
        break;
      case "vault":
        contentHtml = window.VaultModule.render(this.viewParams);
        break;
      case "records":
        contentHtml = window.RecordsModule.render(this.viewParams);
        break;
      case "bookmarks":
        contentHtml = window.BookmarksModule.render(this.viewParams);
        break;
      case "finance":
        contentHtml = window.FinanceModule.render(this.viewParams);
        break;
      case "tasks":
        contentHtml = window.TasksModule.render(this.viewParams);
        break;
      case "settings":
        contentHtml = window.SettingsModule.render(this.viewParams);
        break;
      default:
        contentHtml = window.DashboardModule.render(this.viewParams);
    }

    mainContainer.innerHTML = contentHtml;

    // Khởi tạo icon Lucide cho toàn bộ DOM mới
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  renderSidebar() {
    const menuItems = [
      { id: "dashboard", label: "Tổng quan", icon: "layout-dashboard" },
      { id: "notes", label: "Ghi chú & Markdown", icon: "file-text" },
      { id: "vault", label: "Két bảo mật AES-256", icon: "shield-lock", badge: window.cryptoService.isUnlocked ? "Mở" : "Khóa" },
      { id: "records", label: "Hồ sơ & Giấy tờ", icon: "contact" },
      { id: "bookmarks", label: "Bookmarks", icon: "bookmark" },
      { id: "finance", label: "Tài chính & Thu chi", icon: "wallet" },
      { id: "tasks", label: "Việc cần làm", icon: "check-square" },
      { id: "settings", label: "Cài đặt & Sao lưu", icon: "settings" }
    ];

    const sidebarNav = document.getElementById("sidebar-menu");
    const mobileNav = document.getElementById("mobile-bottom-nav");

    if (sidebarNav) {
      sidebarNav.innerHTML = menuItems.map(item => `
        <button 
          onclick="window.app.navigate('${item.id}')"
          class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition group ${
            this.currentView === item.id 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }">
          <div class="flex items-center gap-3">
            <i data-lucide="${item.icon}" class="w-4 h-4 transition group-hover:scale-110"></i>
            <span>${item.label}</span>
          </div>
          ${item.badge ? `
            <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
              item.badge === 'Mở' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
            }">${item.badge}</span>
          ` : ''}
        </button>
      `).join('');
    }

    if (mobileNav) {
      const topMobileItems = [
        { id: "dashboard", label: "Tổng quan", icon: "layout-dashboard" },
        { id: "notes", label: "Ghi chú", icon: "file-text" },
        { id: "vault", label: "Két", icon: "shield-lock" },
        { id: "finance", label: "Thu chi", icon: "wallet" },
        { id: "tasks", label: "Việc", icon: "check-square" }
      ];

      mobileNav.innerHTML = topMobileItems.map(item => `
        <button 
          onclick="window.app.navigate('${item.id}')"
          class="flex flex-col items-center justify-center flex-1 py-2 text-[10px] transition ${
            this.currentView === item.id ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400'
          }">
          <i data-lucide="${item.icon}" class="w-5 h-5 mb-1"></i>
          <span>${item.label}</span>
        </button>
      `).join('');
    }
  }

  // Toast Notification System
  showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    const icons = {
      success: "check-circle",
      error: "alert-circle",
      warning: "alert-triangle",
      info: "info"
    };

    const colors = {
      success: "bg-emerald-600 text-white shadow-emerald-600/30",
      error: "bg-rose-600 text-white shadow-rose-600/30",
      warning: "bg-amber-600 text-white shadow-amber-600/30",
      info: "bg-indigo-600 text-white shadow-indigo-600/30"
    };

    toast.className = `flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold animate-slideUp ${colors[type] || colors.info}`;
    toast.innerHTML = `
      <i data-lucide="${icons[type] || 'info'}" class="w-4 h-4 shrink-0"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.classList.add("opacity-0", "transition-opacity", "duration-300");
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Tìm kiếm toàn cục (Global Command Search)
  openGlobalSearch() {
    const modal = document.getElementById("global-search-modal");
    const input = document.getElementById("global-search-input");
    if (!modal || !input) return;
    modal.classList.remove("hidden");
    input.value = "";
    input.focus();
    this.handleGlobalSearchInput("");
  }

  closeGlobalSearch() {
    const modal = document.getElementById("global-search-modal");
    if (modal) modal.classList.add("hidden");
  }

  handleGlobalSearchInput(query) {
    const container = document.getElementById("global-search-results");
    if (!container) return;

    const q = query.trim().toLowerCase();
    if (!q) {
      container.innerHTML = `
        <div class="p-6 text-center text-xs text-slate-400">
          Nhập từ khóa để tìm kiếm nhanh trong Ghi chú, Hồ sơ, Bookmarks, Việc cần làm...
        </div>
      `;
      return;
    }

    const notes = window.storageService.get("notes") || [];
    const bookmarks = window.storageService.get("bookmarks") || [];
    const tasks = window.storageService.get("tasks") || [];
    const records = window.storageService.get("records") || [];

    const results = [];

    // Tìm trong Notes
    notes.forEach(n => {
      if ((n.title && n.title.toLowerCase().includes(q)) || (n.content && n.content.toLowerCase().includes(q))) {
        results.push({ type: "Ghi chú", title: n.title, desc: n.folder || "Chung", icon: "file-text", action: () => { this.navigate("notes", { noteId: n.id }); this.closeGlobalSearch(); } });
      }
    });

    // Tìm trong Bookmarks
    bookmarks.forEach(b => {
      if ((b.title && b.title.toLowerCase().includes(q)) || (b.url && b.url.toLowerCase().includes(q))) {
        results.push({ type: "Bookmark", title: b.title, desc: b.url, icon: "bookmark", action: () => { window.open(b.url, '_blank'); this.closeGlobalSearch(); } });
      }
    });

    // Tìm trong Tasks
    tasks.forEach(t => {
      if (t.title && t.title.toLowerCase().includes(q)) {
        results.push({ type: "Công việc", title: t.title, desc: t.priority, icon: "check-square", action: () => { this.navigate("tasks"); this.closeGlobalSearch(); } });
      }
    });

    // Tìm trong Records
    records.forEach(r => {
      if (r.title && r.title.toLowerCase().includes(q)) {
        results.push({ type: "Hồ sơ", title: r.title, desc: r.type, icon: "contact", action: () => { this.navigate("records"); this.closeGlobalSearch(); } });
      }
    });

    if (results.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-xs text-slate-400">
          Không tìm thấy kết quả phù hợp cho "${query}".
        </div>
      `;
      return;
    }

    container.innerHTML = results.slice(0, 8).map((res, idx) => `
      <div onclick="window.app.triggerSearchResult(${idx})" class="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer transition">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <i data-lucide="${res.icon}" class="w-4 h-4"></i>
          </div>
          <div>
            <h4 class="text-xs font-bold text-slate-800 dark:text-white">${res.title}</h4>
            <p class="text-[10px] text-slate-400">${res.type} • ${res.desc}</p>
          </div>
        </div>
        <i data-lucide="corner-down-left" class="w-3.5 h-3.5 text-slate-400"></i>
      </div>
    `).join('');

    this.currentSearchResults = results;
    if (window.lucide) window.lucide.createIcons();
  }

  triggerSearchResult(index) {
    if (this.currentSearchResults && this.currentSearchResults[index]) {
      this.currentSearchResults[index].action();
    }
  }
}

// Khởi tạo app toàn cục
window.app = new AppController();

document.addEventListener("DOMContentLoaded", () => {
  window.app.init();
});
