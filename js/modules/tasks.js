/**
 * Personal Hub - Tasks & Todo Planner Module
 * Quản lý công việc cá nhân, mục tiêu, mức độ ưu tiên và thời hạn hoàn thành.
 */

window.TasksModule = {
  activeStatusFilter: "all", // 'all' | 'pending' | 'completed' | 'urgent'
  searchQuery: "",

  render() {
    const rawTasks = window.storageService.get("tasks") || [];
    let tasks = [...rawTasks];

    if (this.activeStatusFilter === "pending") {
      tasks = tasks.filter(t => t.status !== "completed");
    } else if (this.activeStatusFilter === "completed") {
      tasks = tasks.filter(t => t.status === "completed");
    } else if (this.activeStatusFilter === "urgent") {
      tasks = tasks.filter(t => (t.priority === "urgent" || t.priority === "high") && t.status !== "completed");
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      tasks = tasks.filter(t => 
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q))
      );
    }

    // Sắp xếp: Chưa làm lên trước, ưu tiên khẩn cấp lên trước, theo hạn chót
    const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
    tasks.sort((a, b) => {
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;
      const pDiff = (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
      if (pDiff !== 0) return pDiff;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const pendingCount = rawTasks.filter(t => t.status !== "completed").length;
    const completedCount = rawTasks.filter(t => t.status === "completed").length;

    return `
      <div class="space-y-6 animate-fadeIn">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <i data-lucide="check-square" class="w-5 h-5"></i>
            </div>
            <div>
              <h2 class="text-lg font-bold text-slate-800 dark:text-white">Kế Hoạch & Việc Cần Làm</h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">Đang còn <strong>${pendingCount}</strong> việc cần hoàn thành • Đã xong <strong>${completedCount}</strong> việc</p>
            </div>
          </div>

          <button onclick="window.TasksModule.openModal()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow transition active:scale-95 self-start md:self-auto">
            <i data-lucide="plus" class="w-4 h-4"></i> Thêm việc mới
          </button>
        </div>

        <!-- Bộ lọc & Tìm kiếm -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Tìm kiếm nhiệm vụ, mục tiêu, dự án..." 
              value="${this.searchQuery}"
              oninput="window.TasksModule.onSearch(this.value)"
              class="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
            />
          </div>

          <div class="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button 
              onclick="window.TasksModule.setFilter('all')"
              class="px-3 py-2 rounded-xl font-medium whitespace-nowrap transition ${this.activeStatusFilter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'}">
              Tất cả (${rawTasks.length})
            </button>
            <button 
              onclick="window.TasksModule.setFilter('pending')"
              class="px-3 py-2 rounded-xl font-medium whitespace-nowrap transition ${this.activeStatusFilter === 'pending' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'}">
              Đang chờ (${pendingCount})
            </button>
            <button 
              onclick="window.TasksModule.setFilter('urgent')"
              class="px-3 py-2 rounded-xl font-medium whitespace-nowrap transition ${this.activeStatusFilter === 'urgent' ? 'bg-rose-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'}">
              Ưu tiên cao / Gấp
            </button>
            <button 
              onclick="window.TasksModule.setFilter('completed')"
              class="px-3 py-2 rounded-xl font-medium whitespace-nowrap transition ${this.activeStatusFilter === 'completed' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'}">
              Đã hoàn thành (${completedCount})
            </button>
          </div>
        </div>

        <!-- Task List -->
        <div class="space-y-3">
          ${tasks.length === 0 ? `
            <div class="p-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              <i data-lucide="check-circle" class="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-500"></i>
              <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">Không có công việc nào cần xử lý</h3>
              <p class="text-xs mt-1">Hãy tạo thêm mục tiêu mới để theo dõi tiến độ mỗi ngày.</p>
            </div>
          ` : tasks.map(task => this.renderTaskItem(task)).join('')}
        </div>

        <!-- Modal Thêm/Sửa Task -->
        <div id="task-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 hidden">
          <div class="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold text-slate-800 dark:text-white" id="task-modal-title">Thêm Nhiệm Vụ Mới</h3>
              <button onclick="window.TasksModule.closeModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>

            <form onsubmit="window.TasksModule.saveTask(event)" class="space-y-3.5 text-xs">
              <input type="hidden" id="task-id" />

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên công việc / Mục tiêu *</label>
                <input type="text" id="task-title" required placeholder="Vd: Nộp báo cáo tháng, Gia hạn bảo hiểm xe..." class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white" />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mô tả chi tiết</label>
                <textarea id="task-desc" rows="2" placeholder="Chi tiết các bước thực hiện..." class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mức độ ưu tiên</label>
                  <select id="task-priority" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white">
                    <option value="low">🟢 Thấp (Low)</option>
                    <option value="medium" selected>🟡 Bình thường (Medium)</option>
                    <option value="high">🟠 Ưu tiên cao (High)</option>
                    <option value="urgent">🔴 Khẩn cấp (Urgent)</option>
                  </select>
                </div>

                <div>
                  <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Hạn chót (Deadline)</label>
                  <input type="date" id="task-due-date" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white" />
                </div>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Danh mục / Dự án</label>
                <input type="text" id="task-category" placeholder="Vd: Công việc, Cá nhân, Gia đình..." class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white" />
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                <button type="button" onclick="window.TasksModule.closeModal()" class="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-semibold">Hủy</button>
                <button type="submit" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow">Lưu Nhiệm Vụ</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  renderTaskItem(task) {
    const isCompleted = task.status === "completed";
    const today = new Date().toISOString().slice(0, 10);
    const isOverdue = task.dueDate && task.dueDate < today && !isCompleted;

    const priorityBadges = {
      urgent: { text: "Khẩn cấp", bg: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200" },
      high: { text: "Ưu tiên cao", bg: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200" },
      medium: { text: "Bình thường", bg: "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200" },
      low: { text: "Thấp", bg: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-slate-200" }
    };

    const p = priorityBadges[task.priority] || priorityBadges.medium;

    return `
      <div class="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs hover:shadow-md transition flex items-center justify-between gap-3 group ${isCompleted ? 'opacity-60 bg-slate-50/50 dark:bg-slate-800/40' : ''}">
        <div class="flex items-start gap-3.5 flex-1 min-w-0">
          <button 
            onclick="window.TasksModule.toggleTaskStatus('${task.id}')" 
            class="mt-0.5 text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition shrink-0"
            title="${isCompleted ? 'Đánh dấu chưa xong' : 'Đánh dấu đã hoàn thành'}">
            <i data-lucide="${isCompleted ? 'check-circle-2 text-emerald-500' : 'circle'}" class="w-5 h-5"></i>
          </button>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100 ${isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''}">
                ${task.title}
              </h4>
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${p.bg}">
                ${p.text}
              </span>
              ${task.category ? `
                <span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  📁 ${task.category}
                </span>
              ` : ''}
            </div>

            ${task.description ? `
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 ${isCompleted ? 'line-through opacity-70' : ''}">
                ${task.description}
              </p>
            ` : ''}

            <div class="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
              ${task.dueDate ? `
                <span class="flex items-center gap-1 ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}">
                  <i data-lucide="calendar" class="w-3 h-3"></i> Hạn: ${task.dueDate} ${isOverdue ? '(Quá hạn)' : ''}
                </span>
              ` : ''}
              <span>Tạo: ${new Date(task.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-1 shrink-0">
          <button onclick="window.TasksModule.editTask('${task.id}')" class="p-1.5 text-slate-400 hover:text-indigo-600 transition" title="Sửa">
            <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
          </button>
          <button onclick="window.TasksModule.deleteTask('${task.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 transition" title="Xóa">
            <i data-lucide="trash" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
  },

  setFilter(filter) {
    this.activeStatusFilter = filter;
    window.app.render();
  },

  onSearch(q) {
    this.searchQuery = q;
    window.app.render();
  },

  toggleTaskStatus(id) {
    let tasks = window.storageService.get("tasks") || [];
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.status = task.status === "completed" ? "todo" : "completed";
      window.storageService.set("tasks", tasks);
      window.app.render();
      window.app.showToast(task.status === "completed" ? "Đã hoàn thành nhiệm vụ! 🎉" : "Đã chuyển về danh sách cần làm", "info");
    }
  },

  openModal(task = null) {
    const modal = document.getElementById("task-modal");
    if (!modal) return;
    modal.classList.remove("hidden");

    if (task) {
      document.getElementById("task-modal-title").innerText = "Chỉnh Sửa Nhiệm Vụ";
      document.getElementById("task-id").value = task.id;
      document.getElementById("task-title").value = task.title;
      document.getElementById("task-desc").value = task.description || "";
      document.getElementById("task-priority").value = task.priority || "medium";
      document.getElementById("task-due-date").value = task.dueDate || "";
      document.getElementById("task-category").value = task.category || "";
    } else {
      document.getElementById("task-modal-title").innerText = "Thêm Nhiệm Vụ Mới";
      document.getElementById("task-id").value = "";
      document.getElementById("task-title").value = "";
      document.getElementById("task-desc").value = "";
      document.getElementById("task-priority").value = "medium";
      document.getElementById("task-due-date").value = "";
      document.getElementById("task-category").value = "";
    }
  },

  closeModal() {
    const modal = document.getElementById("task-modal");
    if (modal) modal.classList.add("hidden");
  },

  saveTask(e) {
    e.preventDefault();
    const id = document.getElementById("task-id")?.value;
    const title = document.getElementById("task-title")?.value.trim();
    const description = document.getElementById("task-desc")?.value.trim();
    const priority = document.getElementById("task-priority")?.value || "medium";
    const dueDate = document.getElementById("task-due-date")?.value;
    const category = document.getElementById("task-category")?.value.trim();

    let tasks = window.storageService.get("tasks") || [];
    if (id) {
      const idx = tasks.findIndex(t => t.id === id);
      if (idx !== -1) {
        tasks[idx] = {
          ...tasks[idx],
          title,
          description,
          priority,
          dueDate,
          category
        };
      }
    } else {
      const newTask = {
        id: "task_" + Date.now(),
        title,
        description,
        priority,
        status: "todo",
        dueDate,
        category,
        createdAt: new Date().toISOString()
      };
      tasks.unshift(newTask);
    }

    window.storageService.set("tasks", tasks);
    this.closeModal();
    window.app.render();
    window.app.showToast("Đã lưu nhiệm vụ thành công!", "success");
  },

  editTask(id) {
    const tasks = window.storageService.get("tasks") || [];
    const task = tasks.find(t => t.id === id);
    if (task) this.openModal(task);
  },

  deleteTask(id) {
    if (!confirm("Bạn có chắc muốn xóa nhiệm vụ này?")) return;
    let tasks = window.storageService.get("tasks") || [];
    tasks = tasks.filter(t => t.id !== id);
    window.storageService.set("tasks", tasks);
    window.app.render();
    window.app.showToast("Đã xóa nhiệm vụ", "info");
  }
};
