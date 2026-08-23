/**
 * Personal Hub - Settings & Data Backup Module
 * Cài đặt giao diện, bảo mật, sao lưu JSON và khôi phục dữ liệu toàn diện.
 */

window.SettingsModule = {
  render() {
    const settings = window.storageService.get("settings") || {};
    const vaultMeta = window.storageService.get("vaultMeta") || {};
    const allData = window.storageService.getAllData();
    const dataSizeKb = (JSON.stringify(allData).length / 1024).toFixed(2);

    return `
      <div class="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
        <!-- Header -->
        <div class="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center">
            <i data-lucide="settings" class="w-5 h-5"></i>
          </div>
          <div>
            <h2 class="text-lg font-bold text-slate-800 dark:text-white">Cài Đặt & Sao Lưu Dữ Liệu</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400">Tùy biến không gian làm việc và quản lý an toàn dữ liệu cá nhân</p>
          </div>
        </div>

        <!-- 1. Cài đặt Hồ sơ & Tên hiển thị -->
        <div class="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-4">
          <div class="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <i data-lucide="user" class="w-4 h-4 text-indigo-600 dark:text-indigo-400"></i>
            <h3 class="text-sm font-bold text-slate-800 dark:text-white">Thông Tin Cá Nhân</h3>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên của bạn (Hiển thị trên lời chào)</label>
              <input 
                type="text" 
                id="setting-user-name" 
                value="${settings.userName || 'Bạn'}" 
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white"
              />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Giao diện màu sắc</label>
              <select 
                id="setting-theme" 
                onchange="window.SettingsModule.changeTheme(this.value)"
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white">
                <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>🌙 Chế độ Tối (Dark Mode)</option>
                <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>☀️ Chế độ Sáng (Light Mode)</option>
              </select>
            </div>
          </div>

          <div class="flex justify-end">
            <button onclick="window.SettingsModule.saveProfile()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow">
              Lưu Thay Đổi
            </button>
          </div>
        </div>

        <!-- 2. Cài đặt Két Bảo Mật -->
        <div class="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-4">
          <div class="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600 dark:text-emerald-400"></i>
            <h3 class="text-sm font-bold text-slate-800 dark:text-white">Bảo Mật & Két An Toàn (AES-256)</h3>
          </div>

          <div class="text-xs space-y-4">
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
              <div>
                <p class="font-bold text-slate-800 dark:text-white">Trạng thái Mật khẩu Két</p>
                <p class="text-slate-400 text-[11px] mt-0.5">
                  ${vaultMeta.hasPassword ? "✅ Đã thiết lập mật khẩu chính bảo vệ dữ liệu" : "⚠️ Chưa thiết lập mật khẩu chính"}
                </p>
              </div>
              <button onclick="window.app.navigate('vault')" class="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-lg font-semibold hover:bg-indigo-100">
                ${vaultMeta.hasPassword ? "Đến Két" : "Thiết lập ngay"}
              </button>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tự động khóa két sau</label>
              <select 
                id="setting-autolock" 
                onchange="window.SettingsModule.changeAutoLock(this.value)"
                class="w-full sm:w-64 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white">
                <option value="5" ${settings.autoLockMinutes === 5 ? 'selected' : ''}>5 phút không hoạt động</option>
                <option value="15" ${settings.autoLockMinutes === 15 ? 'selected' : ''}>15 phút (Khuyến nghị)</option>
                <option value="30" ${settings.autoLockMinutes === 30 ? 'selected' : ''}>30 phút</option>
                <option value="60" ${settings.autoLockMinutes === 60 ? 'selected' : ''}>1 giờ</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 3. Sao lưu & Khôi phục Dữ liệu (Backup & Restore) -->
        <div class="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-4">
          <div class="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <i data-lucide="hard-drive-download" class="w-4 h-4 text-purple-600 dark:text-purple-400"></i>
            <h3 class="text-sm font-bold text-slate-800 dark:text-white">Sao Lưu & Khôi Phục (Backup & Restore)</h3>
          </div>

          <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Dữ liệu ứng dụng được lưu trực tiếp trên trình duyệt máy bạn (Dung lượng sử dụng hiện tại: <strong>${dataSizeKb} KB</strong>). Bạn có thể xuất file JSON để lưu giữ an toàn hoặc khôi phục bất cứ lúc nào.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <!-- Tải bản sao lưu -->
            <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 flex flex-col justify-between space-y-3">
              <div>
                <h4 class="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <i data-lucide="download" class="w-4 h-4 text-indigo-600"></i> Xuất Tệp Sao Lưu (Export JSON)
                </h4>
                <p class="text-[11px] text-slate-400 mt-1">
                  Tải về toàn bộ ghi chú, hồ sơ, két mã hóa, thu chi và bookmarks thành 1 file <code>.json</code>.
                </p>
              </div>
              <button onclick="window.storageService.exportBackupFile()" class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition">
                <i data-lucide="download" class="w-3.5 h-3.5"></i> Tải Về File Sao Lưu (.json)
              </button>
            </div>

            <!-- Khôi phục từ file -->
            <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 flex flex-col justify-between space-y-3">
              <div>
                <h4 class="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <i data-lucide="upload" class="w-4 h-4 text-emerald-600"></i> Khôi Phục Dữ Liệu (Import JSON)
                </h4>
                <p class="text-[11px] text-slate-400 mt-1">
                  Chọn tệp sao lưu <code>.json</code> đã lưu trước đó để nạp lại dữ liệu vào ứng dụng.
                </p>
              </div>
              <div>
                <input 
                  type="file" 
                  id="import-file-input" 
                  accept=".json" 
                  onchange="window.SettingsModule.handleFileImport(event)"
                  class="hidden" 
                />
                <button onclick="document.getElementById('import-file-input').click()" class="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition">
                  <i data-lucide="upload" class="w-3.5 h-3.5"></i> Chọn Tệp Khôi Phục (.json)
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Vùng Nguy Hiểm (Danger Zone) -->
        <div class="p-6 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-xs space-y-3">
          <h3 class="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
            <i data-lucide="alert-triangle" class="w-4 h-4"></i> Vùng Nguy Hiểm
          </h3>
          <p class="text-[11px] text-slate-600 dark:text-slate-400">
            Xóa toàn bộ dữ liệu trên trình duyệt này và khôi phục về trạng thái mẫu ban đầu. Hành động này không thể hoàn tác nếu bạn chưa tải bản sao lưu.
          </p>
          <button onclick="window.SettingsModule.handleResetData()" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition">
            Đặt Lại Dữ Liệu Về Mặc Định (Reset)
          </button>
        </div>
      </div>
    `;
  },

  saveProfile() {
    const name = document.getElementById("setting-user-name")?.value.trim() || "Bạn";
    const settings = window.storageService.get("settings") || {};
    settings.userName = name;
    window.storageService.set("settings", settings);
    window.app.render();
    window.app.showToast("Đã lưu thông tin cá nhân!", "success");
  },

  changeTheme(theme) {
    const settings = window.storageService.get("settings") || {};
    settings.theme = theme;
    window.storageService.set("settings", settings);
    window.app.applyTheme(theme);
    window.app.showToast(`Đã chuyển sang ${theme === 'dark' ? 'Chế độ Tối' : 'Chế độ Sáng'}`, "info");
  },

  changeAutoLock(min) {
    const minutes = Number(min) || 15;
    const settings = window.storageService.get("settings") || {};
    settings.autoLockMinutes = minutes;
    window.storageService.set("settings", settings);
    window.cryptoService.autoLockMinutes = minutes;
    window.app.showToast(`Đã đổi thời gian tự động khóa thành ${minutes} phút`, "success");
  },

  handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const res = window.storageService.importBackupData(content);
      if (res.success) {
        window.app.showToast(res.message, "success");
        setTimeout(() => window.location.reload(), 800);
      } else {
        window.app.showToast(res.message, "error");
      }
    };
    reader.readAsText(file);
  },

  handleResetData() {
    if (!confirm("CẢNH BÁO: Toàn bộ ghi chú, két an toàn và tài chính của bạn sẽ bị xóa và đưa về dữ liệu mẫu ban đầu. Bạn có chắc chắn không?")) {
      return;
    }
    window.storageService.resetAllData();
    window.app.showToast("Đã đặt lại dữ liệu!", "info");
    setTimeout(() => window.location.reload(), 500);
  }
};
