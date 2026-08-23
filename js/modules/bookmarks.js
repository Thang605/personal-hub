/**
 * Personal Hub - Bookmarks & Web Resources Module
 * Quản lý các liên kết quan trọng, tài liệu web và công cụ phân loại khoa học.
 */

window.BookmarksModule = {
  activeCategory: "all",
  searchQuery: "",

  render() {
    const rawBookmarks = window.storageService.get("bookmarks") || [];
    const settings = window.storageService.get("settings") || {};
    const categories = settings.bookmarkCategories || ["Công việc", "Học tập", "Công cụ AI", "Giải trí", "Tài chính"];

    let bookmarks = [...rawBookmarks];
    if (this.activeCategory !== "all") {
      bookmarks = bookmarks.filter(b => (b.category || "Công việc") === this.activeCategory);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      bookmarks = bookmarks.filter(b => 
        (b.title && b.title.toLowerCase().includes(q)) ||
        (b.url && b.url.toLowerCase().includes(q)) ||
        (b.description && b.description.toLowerCase().includes(q)) ||
        (b.tags && b.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    // Sort: pinned first
    bookmarks.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return `
      <div class="space-y-6 animate-fadeIn">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center">
              <i data-lucide="bookmark" class="w-5 h-5"></i>
            </div>
            <div>
              <h2 class="text-lg font-bold text-slate-800 dark:text-white">Bộ Sưu Tập Liên Kết (Bookmarks)</h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">Lưu trữ các trang web hữu ích, tài liệu tham khảo và công cụ yêu thích</p>
            </div>
          </div>

          <button onclick="window.BookmarksModule.openModal()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow transition active:scale-95 self-start md:self-auto">
            <i data-lucide="plus" class="w-4 h-4"></i> Thêm liên kết mới
          </button>
        </div>

        <!-- Filter & Search -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Tìm kiếm liên kết, tên trang web, tags..." 
              value="${this.searchQuery}"
              oninput="window.BookmarksModule.onSearch(this.value)"
              class="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
            />
          </div>

          <div class="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button 
              onclick="window.BookmarksModule.setCategory('all')"
              class="px-3 py-2 rounded-xl font-medium whitespace-nowrap transition ${this.activeCategory === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'}">
              Tất cả (${rawBookmarks.length})
            </button>
            ${categories.map(c => `
              <button 
                onclick="window.BookmarksModule.setCategory('${c}')"
                class="px-3 py-2 rounded-xl font-medium whitespace-nowrap transition ${this.activeCategory === c ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'}">
                ${c}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Bookmark Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${bookmarks.length === 0 ? `
            <div class="col-span-full p-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              <i data-lucide="bookmark-x" class="w-12 h-12 mx-auto mb-3 opacity-30"></i>
              <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">Chưa có liên kết nào</h3>
              <p class="text-xs mt-1">Nhấn "+ Thêm liên kết mới" để lưu trang web bạn thích.</p>
            </div>
          ` : bookmarks.map(b => this.renderBookmarkCard(b)).join('')}
        </div>

        <!-- Modal Thêm/Sửa Bookmark -->
        <div id="bookmark-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 hidden">
          <div class="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold text-slate-800 dark:text-white" id="bookmark-modal-title">Thêm Liên Kết Mới</h3>
              <button onclick="window.BookmarksModule.closeModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>

            <form onsubmit="window.BookmarksModule.saveBookmark(event)" class="space-y-3.5 text-xs">
              <input type="hidden" id="bookmark-id" />

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Đường dẫn Website (URL) *</label>
                <input type="url" id="bookmark-url" required placeholder="https://example.com" onchange="window.BookmarksModule.autoFillTitle(this.value)" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white" />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên trang web / Tiêu đề *</label>
                <input type="text" id="bookmark-title" required placeholder="Vd: ChatGPT, Báo VnExpress..." class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white" />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Danh mục</label>
                <select id="bookmark-category" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white">
                  ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mô tả tóm tắt</label>
                <textarea id="bookmark-desc" rows="2" placeholder="Ghi chú nội dung trang web hoặc mục đích sử dụng..." class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white"></textarea>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Thẻ tags (ngăn cách bằng dấu phẩy)</label>
                <input type="text" id="bookmark-tags" placeholder="AI, Công cụ, Đọc sách..." class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white" />
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                <button type="button" onclick="window.BookmarksModule.closeModal()" class="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-semibold">Hủy</button>
                <button type="submit" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow">Lưu Liên Kết</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  renderBookmarkCard(b) {
    let hostname = "";
    try {
      hostname = new URL(b.url).hostname;
    } catch {
      hostname = b.url;
    }

    return `
      <div class="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs hover:shadow-md transition flex flex-col justify-between group">
        <div>
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="flex items-center gap-2.5 overflow-hidden">
              <div class="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-600/50">
                <img src="https://www.google.com/s2/favicons?domain=${hostname}&sz=64" alt="" class="w-5 h-5 rounded" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23666\\' stroke-width=\\'2\\'><circle cx=\\'12\\' cy=\\'12\\' r=\\'10\\'/></svg>'">
              </div>
              <div class="truncate">
                <h4 class="text-xs font-bold text-slate-800 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  ${b.pinned ? '<i data-lucide="pin" class="w-3 h-3 text-amber-500 inline mr-1"></i>' : ''}
                  ${b.title}
                </h4>
                <span class="text-[10px] text-slate-400 truncate block">${hostname}</span>
              </div>
            </div>

            <div class="flex items-center gap-1 shrink-0">
              <button onclick="window.BookmarksModule.togglePin('${b.id}')" class="p-1 text-slate-400 hover:text-amber-500 transition ${b.pinned ? 'text-amber-500' : ''}" title="Ghim">
                <i data-lucide="pin" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="window.BookmarksModule.editBookmark('${b.id}')" class="p-1 text-slate-400 hover:text-indigo-600 transition" title="Chỉnh sửa">
                <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="window.BookmarksModule.deleteBookmark('${b.id}')" class="p-1 text-slate-400 hover:text-rose-600 transition" title="Xóa">
                <i data-lucide="trash" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>

          ${b.description ? `
            <p class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 my-2">${b.description}</p>
          ` : ''}
        </div>

        <div class="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between mt-2">
          <div class="flex items-center gap-1.5 overflow-hidden">
            <span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] font-medium text-slate-500 dark:text-slate-400">${b.category || "Chung"}</span>
            ${(b.tags || []).slice(0, 1).map(t => `<span class="text-[10px] text-indigo-600 dark:text-indigo-400">#${t}</span>`).join('')}
          </div>

          <a href="${b.url}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 text-[11px] font-semibold flex items-center gap-1 transition">
            Truy cập <i data-lucide="external-link" class="w-3 h-3"></i>
          </a>
        </div>
      </div>
    `;
  },

  setCategory(cat) {
    this.activeCategory = cat;
    window.app.render();
  },

  onSearch(q) {
    this.searchQuery = q;
    window.app.render();
  },

  autoFillTitle(url) {
    const titleInput = document.getElementById("bookmark-title");
    if (titleInput && !titleInput.value) {
      try {
        const u = new URL(url);
        titleInput.value = u.hostname.replace(/^www\./, '');
      } catch {}
    }
  },

  openModal(bookmark = null) {
    const modal = document.getElementById("bookmark-modal");
    if (!modal) return;
    modal.classList.remove("hidden");

    if (bookmark) {
      document.getElementById("bookmark-modal-title").innerText = "Chỉnh Sửa Liên Kết";
      document.getElementById("bookmark-id").value = bookmark.id;
      document.getElementById("bookmark-url").value = bookmark.url;
      document.getElementById("bookmark-title").value = bookmark.title;
      document.getElementById("bookmark-category").value = bookmark.category || "Công việc";
      document.getElementById("bookmark-desc").value = bookmark.description || "";
      document.getElementById("bookmark-tags").value = (bookmark.tags || []).join(", ");
    } else {
      document.getElementById("bookmark-modal-title").innerText = "Thêm Liên Kết Mới";
      document.getElementById("bookmark-id").value = "";
      document.getElementById("bookmark-url").value = "";
      document.getElementById("bookmark-title").value = "";
      document.getElementById("bookmark-category").value = this.activeCategory !== "all" ? this.activeCategory : "Công việc";
      document.getElementById("bookmark-desc").value = "";
      document.getElementById("bookmark-tags").value = "";
    }
  },

  closeModal() {
    const modal = document.getElementById("bookmark-modal");
    if (modal) modal.classList.add("hidden");
  },

  saveBookmark(e) {
    e.preventDefault();
    const id = document.getElementById("bookmark-id")?.value;
    const url = document.getElementById("bookmark-url")?.value.trim();
    const title = document.getElementById("bookmark-title")?.value.trim();
    const category = document.getElementById("bookmark-category")?.value;
    const description = document.getElementById("bookmark-desc")?.value.trim();
    const tags = document.getElementById("bookmark-tags")?.value.split(',').map(t => t.trim()).filter(Boolean);

    let bookmarks = window.storageService.get("bookmarks") || [];
    if (id) {
      const idx = bookmarks.findIndex(b => b.id === id);
      if (idx !== -1) {
        bookmarks[idx] = {
          ...bookmarks[idx],
          url,
          title,
          category,
          description,
          tags
        };
      }
    } else {
      const newBm = {
        id: "bm_" + Date.now(),
        url,
        title,
        category,
        description,
        tags,
        pinned: false,
        createdAt: new Date().toISOString()
      };
      bookmarks.unshift(newBm);
    }

    window.storageService.set("bookmarks", bookmarks);
    this.closeModal();
    window.app.render();
    window.app.showToast("Đã lưu liên kết thành công!", "success");
  },

  togglePin(id) {
    const bookmarks = window.storageService.get("bookmarks") || [];
    const b = bookmarks.find(i => i.id === id);
    if (b) {
      b.pinned = !b.pinned;
      window.storageService.set("bookmarks", bookmarks);
      window.app.render();
      window.app.showToast(b.pinned ? "Đã ghim liên kết!" : "Đã bỏ ghim", "info");
    }
  },

  editBookmark(id) {
    const bookmarks = window.storageService.get("bookmarks") || [];
    const b = bookmarks.find(i => i.id === id);
    if (b) this.openModal(b);
  },

  deleteBookmark(id) {
    if (!confirm("Bạn có chắc muốn xóa liên kết này?")) return;
    let bookmarks = window.storageService.get("bookmarks") || [];
    bookmarks = bookmarks.filter(i => i.id !== id);
    window.storageService.set("bookmarks", bookmarks);
    window.app.render();
    window.app.showToast("Đã xóa liên kết", "info");
  }
};
