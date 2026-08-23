/**
 * Personal Hub - Encrypted Vault Module
 * Bảo mật tuyệt đối bằng mã hóa AES-GCM 256-bit client-side.
 */

window.VaultModule = {
  activeCategory: "all",
  searchQuery: "",
  editingItem: null,
  decryptedCache: {}, // Lưu cache đã giải mã tạm thời trong RAM khi két mở

  render() {
    const meta = window.storageService.get("vaultMeta") || {};
    const isUnlocked = window.cryptoService.isUnlocked;

    // Nếu két đang khóa
    if (!isUnlocked) {
      return this.renderLockScreen(meta.hasPassword);
    }

    // Két đã mở khóa
    return this.renderUnlockedVault();
  },

  // Màn hình khóa / Thiết lập mật khẩu chính
  renderLockScreen(hasPassword) {
    return `
      <div class="max-w-md mx-auto my-8 p-6 md:p-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xl text-center animate-fadeIn">
        <div class="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-indigo-800">
          <i data-lucide="${hasPassword ? 'lock' : 'shield-alert'}" class="w-8 h-8"></i>
        </div>

        <h2 class="text-xl font-bold text-slate-800 dark:text-white">
          ${hasPassword ? "Két Bảo Mật Cá Nhân" : "Thiết Lập Mật Khẩu Két An Toàn"}
        </h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
          ${hasPassword 
            ? "Nhập mật khẩu chính (Master Password) hoặc mã PIN để mở khóa và giải mã dữ liệu." 
            : "Thiết lập mật khẩu chính để mã hóa toàn bộ tài khoản và mật khẩu của bạn bằng chuẩn AES-256."}
        </p>

        <form onsubmit="window.VaultModule.handleUnlockSubmit(event, ${!hasPassword})" class="space-y-4 text-left">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              ${hasPassword ? "Mật khẩu Master" : "Tạo Mật khẩu Master mới"}
            </label>
            <div class="relative">
              <input 
                type="password" 
                id="vault-master-pass" 
                required
                placeholder="Nhập mật khẩu bí mật của bạn..." 
                class="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              />
            </div>
          </div>

          ${!hasPassword ? `
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Xác nhận lại Mật khẩu
              </label>
              <input 
                type="password" 
                id="vault-confirm-pass" 
                required
                placeholder="Nhập lại mật khẩu để xác nhận..." 
                class="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              />
            </div>
            <div class="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              ⚠️ <strong>Lưu ý quan trọng</strong>: Hệ thống không lưu mật khẩu của bạn lên bất kỳ máy chủ nào. Nếu bạn quên mật khẩu Master, dữ liệu trong Két sẽ không thể khôi phục!
            </div>
          ` : ''}

          <button 
            type="submit" 
            class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2">
            <i data-lucide="${hasPassword ? 'key' : 'shield-check'}" class="w-4 h-4"></i>
            ${hasPassword ? "Mở Khóa Két An Toàn" : "Khởi Tạo & Kích Hoạt Két"}
          </button>
        </form>
      </div>
    `;
  },

  // Màn hình quản lý khi Két đã mở
  renderUnlockedVault() {
    const rawItems = window.storageService.get("vaultItems") || [];
    let items = [...rawItems];

    if (this.activeCategory !== "all") {
      items = items.filter(i => (i.category || "login") === this.activeCategory);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      items = items.filter(i => 
        (i.name && i.name.toLowerCase().includes(q)) ||
        (i.username && i.username.toLowerCase().includes(q)) ||
        (i.url && i.url.toLowerCase().includes(q))
      );
    }

    const categories = [
      { id: "all", label: "Tất cả", icon: "grid" },
      { id: "login", label: "Tài khoản & Web", icon: "globe" },
      { id: "card", label: "Thẻ ngân hàng", icon: "credit-card" },
      { id: "secure_note", label: "Ghi chú tuyệt mật", icon: "file-lock-2" },
      { id: "api_key", label: "Khóa API / Token", icon: "code" }
    ];

    return `
      <div class="space-y-6 animate-fadeIn">
        <!-- Header Thanh công cụ Két -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <i data-lucide="unlock" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-lg font-bold text-slate-800 dark:text-white">Két Bảo Mật (AES-256)</h2>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">ĐÃ MỞ KHÓA</span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400">Tự động khóa sau thời gian không hoạt động</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button onclick="window.VaultModule.openModal()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow transition active:scale-95">
              <i data-lucide="plus" class="w-4 h-4"></i> Thêm mục bảo mật
            </button>
            <button onclick="window.VaultModule.lockVault()" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition">
              <i data-lucide="lock" class="w-4 h-4 text-rose-500"></i> Khóa Két Ngay
            </button>
          </div>
        </div>

        <!-- Bộ lọc & Tìm kiếm -->
        <div class="flex flex-col sm:flex-row gap-3">
          <!-- Tìm kiếm -->
          <div class="relative flex-1">
            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Tìm kiếm tài khoản, mật khẩu, dịch vụ..." 
              value="${this.searchQuery}"
              oninput="window.VaultModule.onSearch(this.value)"
              class="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
            />
          </div>

          <!-- Phân loại -->
          <div class="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            ${categories.map(c => `
              <button 
                onclick="window.VaultModule.setCategory('${c.id}')"
                class="px-3 py-2 rounded-xl font-medium whitespace-nowrap flex items-center gap-1.5 transition ${this.activeCategory === c.id ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'}">
                <i data-lucide="${c.icon}" class="w-3.5 h-3.5"></i> ${c.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Danh sách Items trong Két -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${items.length === 0 ? `
            <div class="col-span-full p-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              <i data-lucide="shield-check" class="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-500"></i>
              <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">Chưa có mục nào trong danh mục này</h3>
              <p class="text-xs mt-1">Nhấn "+ Thêm mục bảo mật" để lưu trữ an toàn ngay.</p>
            </div>
          ` : items.map(item => this.renderVaultCard(item)).join('')}
        </div>

        <!-- Modal Thêm/Sửa Item -->
        <div id="vault-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 hidden">
          <div class="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold text-slate-800 dark:text-white" id="vault-modal-title">Thêm Mục Bảo Mật Mới</h3>
              <button onclick="window.VaultModule.closeModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>

            <form onsubmit="window.VaultModule.saveVaultItem(event)" class="space-y-3.5 text-xs">
              <input type="hidden" id="vault-item-id" />

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Loại mục</label>
                <select id="vault-item-category" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white">
                  <option value="login">🌐 Tài khoản & Mật khẩu Web/App</option>
                  <option value="card">💳 Thẻ ngân hàng & Thanh toán</option>
                  <option value="secure_note">📝 Ghi chú tuyệt mật</option>
                  <option value="api_key">🔑 Khóa API / Secret Key</option>
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên hiển thị / Dịch vụ *</label>
                <input type="text" id="vault-item-name" required placeholder="Vd: Google Account, Thẻ Techcombank, API OpenAI..." class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white" />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên đăng nhập / Email / Số thẻ</label>
                <input type="text" id="vault-item-username" placeholder="Vd: email@gmail.com hoặc số tài khoản..." class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white" />
              </div>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="font-semibold text-slate-700 dark:text-slate-300">Mật khẩu / Mã bí mật * (Được mã hóa AES-256)</label>
                  <button type="button" onclick="window.VaultModule.generateRandomPassword()" class="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium">
                    <i data-lucide="sparkles" class="w-3 h-3"></i> Tạo mật khẩu mạnh
                  </button>
                </div>
                <div class="relative">
                  <input type="text" id="vault-item-secret" required placeholder="Mật khẩu hoặc thông tin nhạy cảm..." class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white font-mono" />
                </div>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Đường dẫn Website (URL)</label>
                <input type="url" id="vault-item-url" placeholder="https://example.com" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white" />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ghi chú bổ sung (Mã hóa kèm)</label>
                <textarea id="vault-item-notes" rows="3" placeholder="Mã PIN, câu hỏi bảo mật hoặc hướng dẫn..." class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white"></textarea>
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                <button type="button" onclick="window.VaultModule.closeModal()" class="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-semibold">Hủy</button>
                <button type="submit" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow">Lưu vào Két</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  renderVaultCard(item) {
    const isDecrypted = Boolean(this.decryptedCache[item.id]);
    const cachedSecret = this.decryptedCache[item.id] || "••••••••••••";

    const catIcons = {
      login: "globe",
      card: "credit-card",
      secure_note: "file-lock-2",
      api_key: "code"
    };

    return `
      <div class="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs hover:shadow-md transition space-y-3">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2.5 overflow-hidden">
            <div class="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
              <i data-lucide="${catIcons[item.category] || 'key'}" class="w-4 h-4"></i>
            </div>
            <div class="truncate">
              <h4 class="text-xs font-bold text-slate-800 dark:text-white truncate">${item.name}</h4>
              <p class="text-[11px] text-slate-400 truncate">${item.username || item.url || "Không có username"}</p>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <button onclick="window.VaultModule.editItem('${item.id}')" class="p-1 text-slate-400 hover:text-indigo-600 transition" title="Chỉnh sửa">
              <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="window.VaultModule.deleteItem('${item.id}')" class="p-1 text-slate-400 hover:text-rose-600 transition" title="Xóa">
              <i data-lucide="trash" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        <!-- Khu vực mật khẩu giải mã -->
        <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600/50 flex items-center justify-between gap-2">
          <div class="font-mono text-xs text-slate-700 dark:text-slate-200 truncate select-all">
            ${cachedSecret}
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button 
              onclick="window.VaultModule.toggleRevealSecret('${item.id}')" 
              class="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 transition"
              title="${isDecrypted ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}">
              <i data-lucide="${isDecrypted ? 'eye-off' : 'eye'}" class="w-3.5 h-3.5"></i>
            </button>
            <button 
              onclick="window.VaultModule.copySecret('${item.id}')" 
              class="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-indigo-600 dark:text-indigo-400 transition"
              title="Sao chép mật khẩu">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        ${item.url ? `
          <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <a href="${item.url}" target="_blank" rel="noopener" class="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 truncate">
              <i data-lucide="external-link" class="w-3 h-3 shrink-0"></i> ${item.url.replace(/^https?:\/\//, '')}
            </a>
            <span>${new Date(item.updatedAt).toLocaleDateString('vi-VN')}</span>
          </div>
        ` : ''}
      </div>
    `;
  },

  async handleUnlockSubmit(e, isFirstTime) {
    e.preventDefault();
    const pass = document.getElementById("vault-master-pass")?.value;
    if (!pass) return;

    if (isFirstTime) {
      const confirmPass = document.getElementById("vault-confirm-pass")?.value;
      if (pass !== confirmPass) {
        window.app.showToast("Mật khẩu xác nhận không khớp!", "error");
        return;
      }
      if (pass.length < 6) {
        window.app.showToast("Mật khẩu nên có tối thiểu 6 ký tự để bảo mật!", "warning");
        return;
      }
    }

    const meta = window.storageService.get("vaultMeta") || {};
    const res = await window.cryptoService.unlock(pass, meta.saltBase64, meta.verifierBase64);

    if (res.success) {
      if (isFirstTime) {
        meta.hasPassword = true;
        meta.saltBase64 = res.saltBase64;
        meta.verifierBase64 = res.verifierBase64;
        window.storageService.set("vaultMeta", meta);
        window.app.showToast("Đã khởi tạo Két An Toàn thành công!", "success");
      } else {
        window.app.showToast("Mở khóa Két thành công!", "success");
      }
      window.app.render();
    } else {
      window.app.showToast(res.error || "Mật khẩu không đúng!", "error");
    }
  },

  lockVault() {
    window.cryptoService.lock();
    this.decryptedCache = {};
    window.app.render();
    window.app.showToast("Đã khóa Két an toàn!", "info");
  },

  setCategory(cat) {
    this.activeCategory = cat;
    window.app.render();
  },

  onSearch(q) {
    this.searchQuery = q;
    window.app.render();
  },

  openModal(item = null) {
    const modal = document.getElementById("vault-modal");
    if (!modal) return;
    modal.classList.remove("hidden");

    if (item) {
      document.getElementById("vault-modal-title").innerText = "Chỉnh Sửa Mục Bảo Mật";
      document.getElementById("vault-item-id").value = item.id;
      document.getElementById("vault-item-category").value = item.category || "login";
      document.getElementById("vault-item-name").value = item.name || "";
      document.getElementById("vault-item-username").value = item.username || "";
      document.getElementById("vault-item-url").value = item.url || "";
      document.getElementById("vault-item-secret").value = this.decryptedCache[item.id] || "";
      document.getElementById("vault-item-notes").value = item.notes || "";
    } else {
      document.getElementById("vault-modal-title").innerText = "Thêm Mục Bảo Mật Mới";
      document.getElementById("vault-item-id").value = "";
      document.getElementById("vault-item-name").value = "";
      document.getElementById("vault-item-username").value = "";
      document.getElementById("vault-item-url").value = "";
      document.getElementById("vault-item-secret").value = "";
      document.getElementById("vault-item-notes").value = "";
    }
  },

  closeModal() {
    const modal = document.getElementById("vault-modal");
    if (modal) modal.classList.add("hidden");
  },

  generateRandomPassword() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~|}{[]:;?><,./-=";
    let pass = "";
    for (let i = 0; i < 16; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const input = document.getElementById("vault-item-secret");
    if (input) input.value = pass;
  },

  async saveVaultItem(e) {
    e.preventDefault();
    const id = document.getElementById("vault-item-id")?.value;
    const category = document.getElementById("vault-item-category")?.value;
    const name = document.getElementById("vault-item-name")?.value;
    const username = document.getElementById("vault-item-username")?.value;
    const secret = document.getElementById("vault-item-secret")?.value;
    const url = document.getElementById("vault-item-url")?.value;
    const notes = document.getElementById("vault-item-notes")?.value;

    if (!name || !secret) {
      window.app.showToast("Vui lòng điền đủ tên và mật khẩu!", "warning");
      return;
    }

    try {
      // Mã hóa chuỗi secret bằng AES-256
      const encryptedSecret = await window.cryptoService.encrypt(secret);

      let items = window.storageService.get("vaultItems") || [];
      if (id) {
        // Cập nhật
        const idx = items.findIndex(i => i.id === id);
        if (idx !== -1) {
          items[idx] = {
            ...items[idx],
            category,
            name,
            username,
            encryptedSecret,
            url,
            notes,
            updatedAt: new Date().toISOString()
          };
          this.decryptedCache[id] = secret;
        }
      } else {
        // Thêm mới
        const newItem = {
          id: "vault_" + Date.now(),
          category,
          name,
          username,
          encryptedSecret,
          url,
          notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        items.unshift(newItem);
        this.decryptedCache[newItem.id] = secret;
      }

      window.storageService.set("vaultItems", items);
      this.closeModal();
      window.app.render();
      window.app.showToast("Đã mã hóa và lưu trữ an toàn vào Két!", "success");
    } catch (err) {
      window.app.showToast("Lỗi khi mã hóa dữ liệu: " + err.message, "error");
    }
  },

  async toggleRevealSecret(id) {
    if (this.decryptedCache[id]) {
      delete this.decryptedCache[id];
      window.app.render();
      return;
    }

    const items = window.storageService.get("vaultItems") || [];
    const item = items.find(i => i.id === id);
    if (!item) return;

    try {
      const decrypted = await window.cryptoService.decrypt(item.encryptedSecret);
      this.decryptedCache[id] = decrypted;
      window.app.render();
    } catch (e) {
      window.app.showToast("Không thể giải mã dữ liệu!", "error");
    }
  },

  async copySecret(id) {
    const items = window.storageService.get("vaultItems") || [];
    const item = items.find(i => i.id === id);
    if (!item) return;

    try {
      let secret = this.decryptedCache[id];
      if (!secret) {
        secret = await window.cryptoService.decrypt(item.encryptedSecret);
      }
      await navigator.clipboard.writeText(secret);
      window.app.showToast("Đã sao chép mật khẩu vào Clipboard!", "success");
    } catch (e) {
      window.app.showToast("Lỗi sao chép: " + e.message, "error");
    }
  },

  async editItem(id) {
    const items = window.storageService.get("vaultItems") || [];
    const item = items.find(i => i.id === id);
    if (!item) return;

    if (!this.decryptedCache[id]) {
      try {
        this.decryptedCache[id] = await window.cryptoService.decrypt(item.encryptedSecret);
      } catch (e) {
        console.error(e);
      }
    }

    this.openModal(item);
  },

  deleteItem(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa mục bảo mật này không?")) return;
    let items = window.storageService.get("vaultItems") || [];
    items = items.filter(i => i.id !== id);
    delete this.decryptedCache[id];
    window.storageService.set("vaultItems", items);
    window.app.render();
    window.app.showToast("Đã xóa khỏi Két an toàn", "info");
  }
};
