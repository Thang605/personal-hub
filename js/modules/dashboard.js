/**
 * Personal Hub - Dashboard Module
 * Giao diện tổng quan thông minh, số liệu thống kê nhanh và phím tắt tiện ích.
 */

window.DashboardModule = {
  render() {
    const user = window.storageService.get("settings")?.userName || "Bạn";
    const notes = window.storageService.get("notes") || [];
    const tasks = window.storageService.get("tasks") || [];
    const records = window.storageService.get("records") || [];
    const bookmarks = window.storageService.get("bookmarks") || [];
    const finances = window.storageService.get("finances") || [];
    const vaultItems = window.storageService.get("vaultItems") || [];

    // Tính toán tài chính tháng hiện tại
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const monthFinances = finances.filter(f => f.date && f.date.startsWith(currentMonthStr));
    const totalIncome = monthFinances.filter(f => f.type === "income").reduce((sum, f) => sum + Number(f.amount || 0), 0);
    const totalExpense = monthFinances.filter(f => f.type === "expense").reduce((sum, f) => sum + Number(f.amount || 0), 0);
    const balance = totalIncome - totalExpense;

    // Lọc công việc cần làm
    const pendingTasks = tasks.filter(t => t.status !== "completed");
    const urgentTasks = pendingTasks.filter(t => t.priority === "urgent" || t.priority === "high");

    // Lấy lời chào theo thời gian
    const hour = new Date().getHours();
    let greeting = "Chào buổi sáng";
    let greetingIcon = "sun";
    if (hour >= 12 && hour < 18) {
      greeting = "Chào buổi chiều";
      greetingIcon = "sunset";
    } else if (hour >= 18) {
      greeting = "Chào buổi tối";
      greetingIcon = "moon";
    }

    const todayFormatted = new Intl.DateTimeFormat('vi-VN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(new Date());

    return `
      <div class="space-y-6 animate-fadeIn">
        <!-- Hero Banner Lời Chào -->
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 md:p-8 text-white shadow-xl">
          <div class="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 text-indigo-100 text-sm font-medium mb-1 capitalize">
                <i data-lucide="${greetingIcon}" class="w-4 h-4"></i>
                <span>${todayFormatted}</span>
              </div>
              <h1 class="text-2xl md:text-3xl font-bold tracking-tight">${greeting}, ${user}! 👋</h1>
              <p class="text-indigo-100 text-sm mt-1 max-w-xl">
                Chào mừng bạn trở lại Trung tâm Cá nhân. Mọi dữ liệu của bạn đều được bảo mật và sẵn sàng sử dụng.
              </p>
            </div>
            
            <!-- Phím tắt nhanh -->
            <div class="flex flex-wrap gap-2">
              <button onclick="window.app.navigate('notes', { action: 'new' })" class="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition active:scale-95">
                <i data-lucide="plus-circle" class="w-4 h-4"></i> Ghi chú mới
              </button>
              <button onclick="window.app.navigate('finance', { action: 'new' })" class="px-4 py-2 bg-white text-indigo-900 hover:bg-white/90 rounded-xl text-sm font-semibold flex items-center gap-2 shadow transition active:scale-95">
                <i data-lucide="wallet" class="w-4 h-4"></i> Thêm thu chi
              </button>
            </div>
          </div>
          <!-- Background decoration -->
          <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        <!-- Thống kê nhanh 4 thẻ -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Ghi chú -->
          <div onclick="window.app.navigate('notes')" class="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition cursor-pointer group">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Ghi chú & Kiến thức</span>
              <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition">
                <i data-lucide="file-text" class="w-5 h-5"></i>
              </div>
            </div>
            <div class="mt-4 flex items-baseline gap-2">
              <span class="text-2xl font-bold text-slate-800 dark:text-white">${notes.length}</span>
              <span class="text-xs text-slate-400">bài viết</span>
            </div>
            <p class="mt-1 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
              Xem tất cả ghi chú <i data-lucide="arrow-right" class="w-3 h-3"></i>
            </p>
          </div>

          <!-- Két bảo mật -->
          <div onclick="window.app.navigate('vault')" class="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition cursor-pointer group">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Két an toàn AES-256</span>
              <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
                <i data-lucide="shield-lock" class="w-5 h-5"></i>
              </div>
            </div>
            <div class="mt-4 flex items-baseline gap-2">
              <span class="text-2xl font-bold text-slate-800 dark:text-white">${vaultItems.length}</span>
              <span class="text-xs text-slate-400">mục bảo mật</span>
            </div>
            <p class="mt-1 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              ${window.cryptoService.isUnlocked ? "Đang mở khóa" : "Đang khóa an toàn"} <i data-lucide="key" class="w-3 h-3"></i>
            </p>
          </div>

          <!-- Hồ sơ & Giấy tờ -->
          <div onclick="window.app.navigate('records')" class="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition cursor-pointer group">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Hồ sơ & Giấy tờ</span>
              <div class="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
                <i data-lucide="folder-check" class="w-5 h-5"></i>
              </div>
            </div>
            <div class="mt-4 flex items-baseline gap-2">
              <span class="text-2xl font-bold text-slate-800 dark:text-white">${records.length}</span>
              <span class="text-xs text-slate-400">hồ sơ lưu</span>
            </div>
            <p class="mt-1 text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
              CCCD, BHYT, Ngân hàng <i data-lucide="arrow-right" class="w-3 h-3"></i>
            </p>
          </div>

          <!-- Tài chính tháng -->
          <div onclick="window.app.navigate('finance')" class="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition cursor-pointer group">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Số dư tháng ${new Date().getMonth() + 1}</span>
              <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
                <i data-lucide="trending-up" class="w-5 h-5"></i>
              </div>
            </div>
            <div class="mt-4 flex items-baseline gap-2">
              <span class="text-2xl font-bold ${balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">
                ${balance.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              Thu: ${totalIncome.toLocaleString('vi-VN')} đ | Chi: ${totalExpense.toLocaleString('vi-VN')} đ
            </p>
          </div>
        </div>

        <!-- 2 Cột: Công việc cần xử lý & Ghi chú gần đây -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Cột Việc cần làm (2 phần) -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Danh sách công việc ưu tiên -->
            <div class="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                  <i data-lucide="check-square" class="w-5 h-5 text-indigo-600 dark:text-indigo-400"></i>
                  <h2 class="text-lg font-bold text-slate-800 dark:text-white">Việc Cần Làm (${pendingTasks.length})</h2>
                </div>
                <button onclick="window.app.navigate('tasks')" class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                  Xem tất cả
                </button>
              </div>

              ${pendingTasks.length === 0 ? `
                <div class="py-8 text-center text-slate-400">
                  <i data-lucide="smile" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
                  <p class="text-sm">Tuyệt vời! Bạn không còn việc nào tồn đọng.</p>
                </div>
              ` : `
                <div class="space-y-2.5">
                  ${pendingTasks.slice(0, 4).map(task => `
                    <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition border border-slate-100 dark:border-slate-600/50">
                      <div class="flex items-center gap-3">
                        <button onclick="window.TasksModule.toggleTaskStatus('${task.id}')" class="text-slate-400 hover:text-indigo-600 transition">
                          <i data-lucide="${task.status === 'completed' ? 'check-circle-2 text-emerald-500' : 'circle'}" class="w-5 h-5"></i>
                        </button>
                        <div>
                          <p class="text-sm font-semibold text-slate-800 dark:text-slate-100 ${task.status === 'completed' ? 'line-through text-slate-400' : ''}">${task.title}</p>
                          <p class="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            ${task.dueDate ? `<span><i data-lucide="calendar" class="w-3 h-3 inline"></i> Hạn: ${task.dueDate}</span>` : ''}
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              task.priority === 'urgent' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' :
                              task.priority === 'high' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                              'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300'
                            }">
                              ${task.priority === 'urgent' ? 'Khẩn cấp' : task.priority === 'high' ? 'Ưu tiên cao' : 'Bình thường'}
                            </span>
                          </p>
                        </div>
                      </div>
                      <button onclick="window.app.navigate('tasks')" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <i data-lucide="chevron-right" class="w-4 h-4"></i>
                      </button>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>

            <!-- Ghi chú được ghim & Gần đây -->
            <div class="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                  <i data-lucide="pin" class="w-5 h-5 text-amber-500"></i>
                  <h2 class="text-lg font-bold text-slate-800 dark:text-white">Ghi Chú Nổi Bật</h2>
                </div>
                <button onclick="window.app.navigate('notes')" class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                  Xem tất cả (${notes.length})
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                ${notes.slice(0, 4).map(note => `
                  <div onclick="window.app.navigate('notes', { noteId: '${note.id}' })" class="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-indigo-50/50 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-600/50 transition cursor-pointer group">
                    <div class="flex items-start justify-between gap-2">
                      <h3 class="text-xs font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-1 flex items-center gap-1">
                        ${note.pinned ? '<i data-lucide="pin" class="w-3 h-3 text-amber-500 shrink-0"></i>' : ''}
                        ${note.title || "Ghi chú không tiêu đề"}
                      </h3>
                      <span class="text-[10px] text-slate-400 shrink-0">${note.folder || "Chung"}</span>
                    </div>
                    <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                      ${note.content ? note.content.replace(/#|\*|`|>|\[|\]/g, '').slice(0, 100) : "Không có nội dung..."}
                    </p>
                    <div class="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                      <span>${new Date(note.updatedAt || note.createdAt).toLocaleDateString('vi-VN')}</span>
                      <span class="text-indigo-600 dark:text-indigo-400 font-bold group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                        Đọc chi tiết <i data-lucide="arrow-right" class="w-3 h-3"></i>
                      </span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Cột Tiện ích & Bookmarks (1 phần) -->
          <div class="space-y-6">
            <!-- Bookmarks Nổi Bật -->
            <div class="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                  <i data-lucide="bookmark" class="w-5 h-5 text-pink-500"></i>
                  <h2 class="text-base font-bold text-slate-800 dark:text-white">Bookmarks Nhanh</h2>
                </div>
                <button onclick="window.app.navigate('bookmarks')" class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                  Xem hết (${bookmarks.length})
                </button>
              </div>

              <div class="space-y-2.5">
                ${bookmarks.slice(0, 5).map(bm => `
                  <a href="${bm.url}" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 transition group">
                    <div class="flex items-center gap-2.5 overflow-hidden">
                      <div class="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        <img src="https://www.google.com/s2/favicons?domain=${new URL(bm.url).hostname}&sz=32" alt="" class="w-4 h-4 rounded" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23666\\' stroke-width=\\'2\\'><circle cx=\\'12\\' cy=\\'12\\' r=\\'10\\'/></svg>'">
                      </div>
                      <div class="truncate">
                        <p class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">${bm.title}</p>
                        <p class="text-[10px] text-slate-400 truncate">${bm.url}</p>
                      </div>
                    </div>
                    <i data-lucide="external-link" class="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 shrink-0"></i>
                  </a>
                `).join('')}
              </div>
            </div>

            <!-- Thẻ Bảo Mật & Sao Lưu -->
            <div class="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-lg">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <i data-lucide="hard-drive-download" class="w-5 h-5"></i>
                </div>
                <div>
                  <h3 class="text-sm font-bold">Sao lưu Định kỳ</h3>
                  <p class="text-[11px] text-slate-300">Giữ an toàn dữ liệu trên máy tính</p>
                </div>
              </div>
              <p class="text-xs text-slate-300 mb-4 leading-relaxed">
                Xuất file sao lưu <code>.json</code> để lưu trữ an toàn hoặc chuyển đổi qua các thiết bị khác dễ dàng.
              </p>
              <button onclick="window.storageService.exportBackupFile()" class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition shadow">
                <i data-lucide="download" class="w-4 h-4"></i> Tải về Bản Sao Lưu Ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
