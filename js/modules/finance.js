/**
 * Personal Hub - Personal Finance & Budgeting Module
 * Quản lý thu chi cá nhân, biểu đồ phân tích chi tiêu và số dư tài chính.
 */

window.FinanceModule = {
  selectedMonth: new Date().toISOString().slice(0, 7),
  activeFilter: "all", // 'all' | 'income' | 'expense'

  render(params = {}) {
    if (params.action === "new") {
      setTimeout(() => this.openModal(), 100);
    }

    const finances = window.storageService.get("finances") || [];
    const settings = window.storageService.get("settings") || {};
    const categories = settings.financeCategories || {
      expense: ["Ăn uống", "Nhà ở & Tiện ích", "Mua sắm", "Di chuyển", "Học tập & Sách", "Giải trí", "Y tế", "Khác"],
      income: ["Lương", "Thưởng", "Đầu tư", "Freelance", "Khác"]
    };

    // Lọc theo tháng đã chọn
    let monthFinances = finances.filter(f => f.date && f.date.startsWith(this.selectedMonth));
    if (this.activeFilter !== "all") {
      monthFinances = monthFinances.filter(f => f.type === this.activeFilter);
    }

    // Tính toán số liệu tháng
    const allInMonth = finances.filter(f => f.date && f.date.startsWith(this.selectedMonth));
    const totalIncome = allInMonth.filter(f => f.type === "income").reduce((s, f) => s + Number(f.amount || 0), 0);
    const totalExpense = allInMonth.filter(f => f.type === "expense").reduce((s, f) => s + Number(f.amount || 0), 0);
    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

    // Sắp xếp ngày mới nhất lên đầu
    monthFinances.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Render HTML
    const html = `
      <div class="space-y-6 animate-fadeIn">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <i data-lucide="wallet" class="w-5 h-5"></i>
            </div>
            <div>
              <h2 class="text-lg font-bold text-slate-800 dark:text-white">Quản Lý Tài Chính & Sổ Thu Chi</h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">Theo dõi dòng tiền thu chi, cơ cấu ngân sách và mục tiêu tiết kiệm</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <!-- Chọn tháng -->
            <input 
              type="month" 
              value="${this.selectedMonth}" 
              onchange="window.FinanceModule.changeMonth(this.value)"
              class="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white"
            />
            <button onclick="window.FinanceModule.openModal()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow transition active:scale-95">
              <i data-lucide="plus" class="w-4 h-4"></i> Thêm giao dịch
            </button>
          </div>
        </div>

        <!-- 4 Thẻ Số liệu thống kê -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Tổng thu -->
          <div class="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-slate-500 dark:text-slate-400">Tổng Thu Nhập</span>
              <span class="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"><i data-lucide="arrow-down-left" class="w-4 h-4"></i></span>
            </div>
            <p class="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-3">+${totalIncome.toLocaleString('vi-VN')} đ</p>
            <p class="text-[11px] text-slate-400 mt-1">Tháng ${this.selectedMonth}</p>
          </div>

          <!-- Tổng chi -->
          <div class="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-slate-500 dark:text-slate-400">Tổng Chi Tiêu</span>
              <span class="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"><i data-lucide="arrow-up-right" class="w-4 h-4"></i></span>
            </div>
            <p class="text-xl font-bold text-rose-600 dark:text-rose-400 mt-3">-${totalExpense.toLocaleString('vi-VN')} đ</p>
            <p class="text-[11px] text-slate-400 mt-1">Tháng ${this.selectedMonth}</p>
          </div>

          <!-- Số dư ròng -->
          <div class="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-slate-500 dark:text-slate-400">Số Dư Ròng</span>
              <span class="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"><i data-lucide="scale" class="w-4 h-4"></i></span>
            </div>
            <p class="text-xl font-bold ${balance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'} mt-3">${balance.toLocaleString('vi-VN')} đ</p>
            <p class="text-[11px] text-slate-400 mt-1">${balance >= 0 ? 'Dư dả tài chính' : 'Bội chi tháng này'}</p>
          </div>

          <!-- Tỷ lệ tiết kiệm -->
          <div class="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-slate-500 dark:text-slate-400">Tỷ Lệ Tiết Kiệm</span>
              <span class="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"><i data-lucide="piggy-bank" class="w-4 h-4"></i></span>
            </div>
            <p class="text-xl font-bold text-amber-600 dark:text-amber-400 mt-3">${savingsRate}%</p>
            <p class="text-[11px] text-slate-400 mt-1">Mục tiêu khuyến nghị: > 20%</p>
          </div>
        </div>

        <!-- Khu vực Biểu đồ Chi Tiêu & Danh sách Giao dịch -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Biểu đồ phân bổ chi tiêu (1 phần) -->
          <div class="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col items-center justify-center">
            <h3 class="text-xs font-bold text-slate-700 dark:text-slate-300 mb-4 self-start">Phân Bổ Chi Tiêu Theo Danh Mục</h3>
            <div class="w-full max-w-[240px] aspect-square relative flex items-center justify-center">
              <canvas id="finance-doughnut-chart"></canvas>
            </div>
          </div>

          <!-- Bảng giao dịch (2 phần) -->
          <div class="lg:col-span-2 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 class="text-sm font-bold text-slate-800 dark:text-white">Lịch Sử Giao Dịch (${monthFinances.length})</h3>
              
              <div class="flex items-center gap-2">
                <div class="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5 text-xs">
                  <button onclick="window.FinanceModule.setFilter('all')" class="px-2.5 py-1 rounded-md transition ${this.activeFilter === 'all' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xs font-semibold' : 'text-slate-600 dark:text-slate-300'}">Tất cả</button>
                  <button onclick="window.FinanceModule.setFilter('income')" class="px-2.5 py-1 rounded-md transition ${this.activeFilter === 'income' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-xs font-semibold' : 'text-slate-600 dark:text-slate-300'}">Khoản Thu</button>
                  <button onclick="window.FinanceModule.setFilter('expense')" class="px-2.5 py-1 rounded-md transition ${this.activeFilter === 'expense' ? 'bg-white dark:bg-slate-800 text-rose-600 shadow-xs font-semibold' : 'text-slate-600 dark:text-slate-300'}">Khoản Chi</button>
                </div>
                
                <button onclick="window.FinanceModule.exportCSV()" class="p-1.5 text-slate-500 hover:text-indigo-600 border border-slate-200 dark:border-slate-600 rounded-lg transition" title="Xuất file CSV">
                  <i data-lucide="download" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <!-- Transaction rows -->
            <div class="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              ${monthFinances.length === 0 ? `
                <div class="py-12 text-center text-slate-400">
                  <i data-lucide="receipt" class="w-10 h-10 mx-auto mb-2 opacity-30"></i>
                  <p class="text-xs">Chưa có giao dịch nào trong tháng ${this.selectedMonth}</p>
                </div>
              ` : monthFinances.map(f => `
                <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition border border-slate-100 dark:border-slate-600/50">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      f.type === 'income' 
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'
                    }">
                      <i data-lucide="${f.type === 'income' ? 'arrow-down-left' : 'arrow-up-right'}" class="w-4 h-4"></i>
                    </div>
                    <div>
                      <h4 class="text-xs font-bold text-slate-800 dark:text-white">${f.description || f.category}</h4>
                      <p class="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>${f.date}</span>
                        <span>• ${f.category}</span>
                        ${f.paymentMethod ? `<span>• ${f.paymentMethod}</span>` : ''}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <span class="text-xs font-bold ${f.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">
                      ${f.type === 'income' ? '+' : '-'}${Number(f.amount || 0).toLocaleString('vi-VN')} đ
                    </span>
                    <button onclick="window.FinanceModule.deleteTransaction('${f.id}')" class="p-1 text-slate-400 hover:text-rose-600 transition">
                      <i data-lucide="trash" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Modal Thêm Giao dịch -->
        <div id="finance-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 hidden">
          <div class="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold text-slate-800 dark:text-white">Thêm Giao Dịch Mới</h3>
              <button onclick="window.FinanceModule.closeModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>

            <form onsubmit="window.FinanceModule.saveTransaction(event)" class="space-y-3.5 text-xs">
              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Loại giao dịch</label>
                <div class="grid grid-cols-2 gap-2">
                  <label class="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 cursor-pointer has-[:checked]:bg-rose-50 dark:has-[:checked]:bg-rose-900/30 has-[:checked]:border-rose-500">
                    <input type="radio" name="finance-type" value="expense" checked onchange="window.FinanceModule.updateCategoryOptions('expense')" class="text-rose-600 focus:ring-rose-500" />
                    <span class="font-bold text-rose-600 dark:text-rose-400">Khoản Chi</span>
                  </label>
                  <label class="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 cursor-pointer has-[:checked]:bg-emerald-50 dark:has-[:checked]:bg-emerald-900/30 has-[:checked]:border-emerald-500">
                    <input type="radio" name="finance-type" value="income" onchange="window.FinanceModule.updateCategoryOptions('income')" class="text-emerald-600 focus:ring-emerald-500" />
                    <span class="font-bold text-emerald-600 dark:text-emerald-400">Khoản Thu</span>
                  </label>
                </div>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Số tiền (VNĐ) *</label>
                <input type="number" id="finance-amount" required placeholder="Vd: 500000" min="0" step="1000" class="w-full px-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white" />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Danh mục</label>
                <select id="finance-category" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white">
                  ${categories.expense.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ngày giao dịch</label>
                <input type="date" id="finance-date" value="${new Date().toISOString().slice(0, 10)}" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white" />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mô tả / Ghi chú</label>
                <input type="text" id="finance-desc" placeholder="Vd: Đi ăn tối với bạn bè, Tiền điện..." class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white" />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Hình thức thanh toán</label>
                <select id="finance-method" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white">
                  <option value="Chuyển khoản">💳 Chuyển khoản ngân hàng</option>
                  <option value="Tiền mặt">💵 Tiền mặt</option>
                  <option value="Thẻ tín dụng">💳 Thẻ tín dụng (Credit)</option>
                  <option value="Ví điện tử">📱 Ví điện tử (Momo/ZaloPay)</option>
                </select>
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                <button type="button" onclick="window.FinanceModule.closeModal()" class="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-semibold">Hủy</button>
                <button type="submit" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow">Lưu Giao Dịch</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => this.renderChart(allInMonth), 50);

    return html;
  },

  changeMonth(month) {
    this.selectedMonth = month;
    window.app.render();
  },

  setFilter(filter) {
    this.activeFilter = filter;
    window.app.render();
  },

  renderChart(monthData) {
    const canvas = document.getElementById("finance-doughnut-chart");
    if (!canvas || !window.Chart) return;

    const expenses = monthData.filter(f => f.type === "expense");
    const catMap = {};
    expenses.forEach(e => {
      const cat = e.category || "Khác";
      catMap[cat] = (catMap[cat] || 0) + Number(e.amount || 0);
    });

    const labels = Object.keys(catMap);
    const data = Object.values(catMap);

    if (window.financeChartInstance) {
      window.financeChartInstance.destroy();
    }

    if (labels.length === 0) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Chưa có chi tiêu tháng này', canvas.width / 2, canvas.height / 2);
      return;
    }

    window.financeChartInstance = new window.Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            '#f43f5e', '#8b5cf6', '#3b82f6', '#10b981', 
            '#f59e0b', '#ec4899', '#06b6d4', '#64748b'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 10, font: { size: 10 } }
          }
        },
        cutout: '68%'
      }
    });
  },

  openModal() {
    const modal = document.getElementById("finance-modal");
    if (modal) modal.classList.remove("hidden");
  },

  closeModal() {
    const modal = document.getElementById("finance-modal");
    if (modal) modal.classList.add("hidden");
  },

  updateCategoryOptions(type) {
    const settings = window.storageService.get("settings") || {};
    const categories = settings.financeCategories || {
      expense: ["Ăn uống", "Nhà ở & Tiện ích", "Mua sắm", "Di chuyển", "Học tập & Sách", "Giải trí", "Y tế", "Khác"],
      income: ["Lương", "Thưởng", "Đầu tư", "Freelance", "Khác"]
    };
    const sel = document.getElementById("finance-category");
    if (!sel) return;
    const opts = (categories[type] || []).map(c => `<option value="${c}">${c}</option>`).join('');
    sel.innerHTML = opts;
  },

  saveTransaction(e) {
    e.preventDefault();
    const type = document.querySelector('input[name="finance-type"]:checked')?.value || "expense";
    const amount = Number(document.getElementById("finance-amount")?.value || 0);
    const category = document.getElementById("finance-category")?.value;
    const date = document.getElementById("finance-date")?.value || new Date().toISOString().slice(0, 10);
    const description = document.getElementById("finance-desc")?.value.trim();
    const paymentMethod = document.getElementById("finance-method")?.value;

    if (!amount || amount <= 0) {
      window.app.showToast("Vui lòng nhập số tiền hợp lệ!", "warning");
      return;
    }

    const newTrans = {
      id: "fin_" + Date.now(),
      type,
      amount,
      category,
      date,
      description,
      paymentMethod
    };

    let finances = window.storageService.get("finances") || [];
    finances.unshift(newTrans);
    window.storageService.set("finances", finances);
    this.closeModal();
    window.app.render();
    window.app.showToast("Đã thêm giao dịch tài chính!", "success");
  },

  deleteTransaction(id) {
    if (!confirm("Bạn có chắc muốn xóa giao dịch này?")) return;
    let finances = window.storageService.get("finances") || [];
    finances = finances.filter(f => f.id !== id);
    window.storageService.set("finances", finances);
    window.app.render();
    window.app.showToast("Đã xóa giao dịch", "info");
  },

  exportCSV() {
    const finances = window.storageService.get("finances") || [];
    if (finances.length === 0) {
      window.app.showToast("Chưa có giao dịch để xuất!", "info");
      return;
    }

    let csvContent = "\uFEFFNgày,Loại,Danh mục,Số tiền,Mô tả,Hình thức thanh toán\n";
    finances.forEach(f => {
      const typeStr = f.type === "income" ? "Thu" : "Chi";
      const desc = `"${(f.description || '').replace(/"/g, '""')}"`;
      csvContent += `${f.date},${typeStr},${f.category},${f.amount},${desc},${f.paymentMethod || ''}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PersonalHub_ThuChi_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    window.app.showToast("Đã xuất file CSV!", "success");
  }
};
