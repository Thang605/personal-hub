/**
 * Personal Hub - Records & Documents Module
 * Lưu trữ thông tin hồ sơ cá nhân, CCCD, BHYT, Hộ chiếu, Thẻ ngân hàng, Hợp đồng.
 */

window.RecordsModule = {
  activeType: "all",
  searchQuery: "",

  render() {
    const rawRecords = window.storageService.get("records") || [];
    let records = [...rawRecords];

    if (this.activeType !== "all") {
      records = records.filter(r => r.type === this.activeType);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      records = records.filter(r => 
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.fields && r.fields.some(f => (f.label && f.label.toLowerCase().includes(q)) || (f.value && f.value.toLowerCase().includes(q)))) ||
        (r.notes && r.notes.toLowerCase().includes(q))
      );
    }

    const recordTypes = [
      { id: "all", label: "Tất cả hồ sơ", icon: "folder" },
      { id: "id_card", label: "CCCD / CMND", icon: "id-card" },
      { id: "passport", label: "Hộ chiếu", icon: "plane" },
      { id: "insurance", label: "BHYT / BHXH", icon: "heart-pulse" },
      { id: "bank", label: "Ngân hàng", icon: "building" },
      { id: "emergency", label: "Liên hệ Khẩn cấp", icon: "phone-call" },
      { id: "contract", label: "Hợp đồng & Giấy tờ", icon: "file-text" }
    ];

    return `
      <div class="space-y-6 animate-fadeIn">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <i data-lucide="contact" class="w-5 h-5"></i>
            </div>
            <div>
              <h2 class="text-lg font-bold text-slate-800 dark:text-white">Hồ Sơ & Giấy Tờ Cá Nhân</h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">Lưu số CCCD, BHYT, thông tin thẻ và tài khoản phục vụ điền biểu mẫu nhanh chóng</p>
            </div>
          </div>

          <button onclick="window.RecordsModule.openModal()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow transition active:scale-95 self-start md:self-auto">
            <i data-lucide="plus" class="w-4 h-4"></i> Thêm hồ sơ mới
          </button>
        </div>

        <!-- Bộ lọc & Tìm kiếm -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Tìm kiếm số giấy tờ, tên tài khoản, nội dung..." 
              value="${this.searchQuery}"
              oninput="window.RecordsModule.onSearch(this.value)"
              class="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
            />
          </div>

          <div class="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            ${recordTypes.map(t => `
              <button 
                onclick="window.RecordsModule.setType('${t.id}')"
                class="px-3 py-2 rounded-xl font-medium whitespace-nowrap flex items-center gap-1.5 transition ${this.activeType === t.id ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'}">
                <i data-lucide="${t.icon}" class="w-3.5 h-3.5"></i> ${t.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Danh sách Hồ sơ dạng Thẻ -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          ${records.length === 0 ? `
            <div class="col-span-full p-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              <i data-lucide="folder-open" class="w-12 h-12 mx-auto mb-3 opacity-30"></i>
              <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">Chưa có hồ sơ nào</h3>
              <p class="text-xs mt-1">Nhấn "+ Thêm hồ sơ mới" để lưu trữ số CCCD, tài khoản ngân hàng hoặc thẻ BHYT.</p>
            </div>
          ` : records.map(rec => this.renderRecordCard(rec)).join('')}
        </div>

        <!-- Modal Thêm/Sửa Hồ Sơ -->
        <div id="record-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 hidden">
          <div class="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold text-slate-800 dark:text-white" id="record-modal-title">Thêm Hồ Sơ Mới</h3>
              <button onclick="window.RecordsModule.closeModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>

            <form onsubmit="window.RecordsModule.saveRecord(event)" class="space-y-4 text-xs">
              <input type="hidden" id="record-id" />

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Loại hồ sơ</label>
                <select id="record-type" onchange="window.RecordsModule.onTypeChange(this.value)" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white">
                  <option value="id_card">🪪 Căn cước công dân (CCCD)</option>
                  <option value="passport">✈️ Hộ chiếu (Passport)</option>
                  <option value="insurance">🏥 Bảo hiểm Y tế / BHXH</option>
                  <option value="bank">🏦 Tài khoản Ngân hàng</option>
                  <option value="emergency">📞 Liên hệ khẩn cấp</option>
                  <option value="contract">📄 Hợp đồng / Giấy tờ khác</option>
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tiêu đề hồ sơ *</label>
                <input type="text" id="record-title" required placeholder="Vd: CCCD chính, Hộ chiếu du lịch, Vietcombank..." class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white" />
              </div>

              <!-- Danh sách các trường động -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="font-semibold text-slate-700 dark:text-slate-300">Các thông tin chi tiết</label>
                  <button type="button" onclick="window.RecordsModule.addFieldRow()" class="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium">
                    <i data-lucide="plus" class="w-3 h-3"></i> Thêm trường
                  </button>
                </div>
                <div id="record-fields-container" class="space-y-2"></div>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ghi chú thêm</label>
                <textarea id="record-notes" rows="2" placeholder="Ghi chú nơi lưu bản gốc hoặc thời hạn..." class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none dark:text-white"></textarea>
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                <button type="button" onclick="window.RecordsModule.closeModal()" class="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-semibold">Hủy</button>
                <button type="submit" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow">Lưu Hồ Sơ</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  renderRecordCard(rec) {
    const typeThemes = {
      id_card: { bg: "from-blue-600 to-indigo-700", icon: "id-card", tag: "CCCD / CMND" },
      passport: { bg: "from-emerald-600 to-teal-700", icon: "plane", tag: "Hộ chiếu" },
      insurance: { bg: "from-rose-600 to-pink-700", icon: "heart-pulse", tag: "Bảo hiểm" },
      bank: { bg: "from-amber-600 to-orange-700", icon: "building", tag: "Ngân hàng" },
      emergency: { bg: "from-red-600 to-rose-700", icon: "phone-call", tag: "Khẩn cấp" },
      contract: { bg: "from-slate-700 to-slate-900", icon: "file-text", tag: "Hợp đồng" }
    };

    const theme = typeThemes[rec.type] || { bg: "from-indigo-600 to-purple-700", icon: "file", tag: "Hồ sơ" };

    return `
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs hover:shadow-lg transition overflow-hidden flex flex-col group">
        <!-- Card Header mô phỏng thẻ -->
        <div class="p-4 bg-gradient-to-r ${theme.bg} text-white flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i data-lucide="${theme.icon}" class="w-4 h-4 text-white/80"></i>
            <span class="text-[11px] font-bold uppercase tracking-wider text-white/90">${theme.tag}</span>
          </div>
          <div class="flex items-center gap-1">
            <button onclick="window.RecordsModule.editRecord('${rec.id}')" class="p-1 rounded text-white/80 hover:text-white hover:bg-white/10 transition" title="Chỉnh sửa">
              <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="window.RecordsModule.deleteRecord('${rec.id}')" class="p-1 rounded text-white/80 hover:text-rose-200 hover:bg-white/10 transition" title="Xóa">
              <i data-lucide="trash" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        <!-- Card Body -->
        <div class="p-4 space-y-3 flex-1 flex flex-col justify-between">
          <div>
            <h3 class="text-sm font-bold text-slate-800 dark:text-white mb-2.5">${rec.title}</h3>
            <div class="space-y-2">
              ${(rec.fields || []).map(f => `
                <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-xs">
                  <span class="text-slate-500 dark:text-slate-400">${f.label}</span>
                  <div class="flex items-center gap-1.5">
                    <span class="font-semibold text-slate-800 dark:text-slate-100 font-mono select-all">${f.value}</span>
                    <button onclick="window.RecordsModule.copyValue('${f.value}')" class="p-1 text-slate-400 hover:text-indigo-600 transition" title="Sao chép">
                      <i data-lucide="copy" class="w-3 h-3"></i>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          ${rec.notes ? `
            <p class="text-[11px] text-slate-400 italic pt-2 border-t border-slate-100 dark:border-slate-700">
              💡 ${rec.notes}
            </p>
          ` : ''}
        </div>
      </div>
    `;
  },

  setType(type) {
    this.activeType = type;
    window.app.render();
  },

  onSearch(q) {
    this.searchQuery = q;
    window.app.render();
  },

  copyValue(val) {
    navigator.clipboard.writeText(val);
    window.app.showToast(`Đã sao chép: ${val}`, "success");
  },

  openModal(record = null) {
    const modal = document.getElementById("record-modal");
    if (!modal) return;
    modal.classList.remove("hidden");

    const container = document.getElementById("record-fields-container");
    container.innerHTML = "";

    if (record) {
      document.getElementById("record-modal-title").innerText = "Chỉnh Sửa Hồ Sơ";
      document.getElementById("record-id").value = record.id;
      document.getElementById("record-type").value = record.type;
      document.getElementById("record-title").value = record.title;
      document.getElementById("record-notes").value = record.notes || "";

      (record.fields || []).forEach(f => {
        this.addFieldRow(f.label, f.value);
      });
    } else {
      document.getElementById("record-modal-title").innerText = "Thêm Hồ Sơ Mới";
      document.getElementById("record-id").value = "";
      document.getElementById("record-type").value = "id_card";
      document.getElementById("record-title").value = "";
      document.getElementById("record-notes").value = "";

      // Mặc định tạo các trường cơ bản cho CCCD
      this.populateDefaultFieldsForType("id_card");
    }
  },

  closeModal() {
    const modal = document.getElementById("record-modal");
    if (modal) modal.classList.add("hidden");
  },

  onTypeChange(type) {
    const container = document.getElementById("record-fields-container");
    container.innerHTML = "";
    this.populateDefaultFieldsForType(type);
  },

  populateDefaultFieldsForType(type) {
    const templates = {
      id_card: [
        { label: "Số CCCD", val: "" },
        { label: "Họ và tên", val: "" },
        { label: "Ngày sinh", val: "" },
        { label: "Ngày cấp", val: "" },
        { label: "Nơi cấp", val: "Cục Cảnh sát QLHC về TTXH" }
      ],
      passport: [
        { label: "Số Hộ chiếu", val: "" },
        { label: "Họ và tên", val: "" },
        { label: "Quốc tịch", val: "VIETNAM" },
        { label: "Ngày hết hạn", val: "" }
      ],
      insurance: [
        { label: "Mã số BHYT", val: "" },
        { label: "Mã số BHXH", val: "" },
        { label: "Bệnh viện ĐK KCB ban đầu", val: "" }
      ],
      bank: [
        { label: "Ngân hàng", val: "" },
        { label: "Số tài khoản", val: "" },
        { label: "Chủ tài khoản", val: "" },
        { label: "Chi nhánh", val: "" }
      ],
      emergency: [
        { label: "Họ tên liên hệ", val: "" },
        { label: "Mối quan hệ", val: "Bố/Mẹ/Vợ/Chồng" },
        { label: "Số điện thoại", val: "" },
        { label: "Địa chỉ", val: "" }
      ],
      contract: [
        { label: "Số hợp đồng", val: "" },
        { label: "Bên liên quan", val: "" },
        { label: "Ngày hiệu lực", val: "" },
        { label: "Ngày hết hạn", val: "" }
      ]
    };

    const fields = templates[type] || [{ label: "Tên trường", val: "" }];
    fields.forEach(f => this.addFieldRow(f.label, f.val));
  },

  addFieldRow(label = "", value = "") {
    const container = document.getElementById("record-fields-container");
    if (!container) return;

    const row = document.createElement("div");
    row.className = "flex items-center gap-2";
    row.innerHTML = `
      <input type="text" placeholder="Tên thông tin (vd: Số CCCD)" value="${label}" class="w-1/3 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg field-label focus:outline-none dark:text-white" required />
      <input type="text" placeholder="Giá trị" value="${value}" class="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg field-value focus:outline-none dark:text-white" required />
      <button type="button" onclick="this.parentElement.remove()" class="p-1 text-slate-400 hover:text-rose-500 transition">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    `;
    container.appendChild(row);
    if (window.lucide) window.lucide.createIcons();
  },

  saveRecord(e) {
    e.preventDefault();
    const id = document.getElementById("record-id")?.value;
    const type = document.getElementById("record-type")?.value;
    const title = document.getElementById("record-title")?.value;
    const notes = document.getElementById("record-notes")?.value;

    const container = document.getElementById("record-fields-container");
    const labelInputs = container.querySelectorAll(".field-label");
    const valueInputs = container.querySelectorAll(".field-value");

    const fields = [];
    for (let i = 0; i < labelInputs.length; i++) {
      const l = labelInputs[i].value.trim();
      const v = valueInputs[i].value.trim();
      if (l && v) {
        fields.push({ label: l, value: v });
      }
    }

    let records = window.storageService.get("records") || [];
    if (id) {
      const idx = records.findIndex(r => r.id === id);
      if (idx !== -1) {
        records[idx] = {
          ...records[idx],
          type,
          title,
          fields,
          notes,
          updatedAt: new Date().toISOString()
        };
      }
    } else {
      const newRec = {
        id: "rec_" + Date.now(),
        type,
        title,
        fields,
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      records.unshift(newRec);
    }

    window.storageService.set("records", records);
    this.closeModal();
    window.app.render();
    window.app.showToast("Đã lưu hồ sơ cá nhân thành công!", "success");
  },

  editRecord(id) {
    const records = window.storageService.get("records") || [];
    const rec = records.find(r => r.id === id);
    if (rec) this.openModal(rec);
  },

  deleteRecord(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa hồ sơ này?")) return;
    let records = window.storageService.get("records") || [];
    records = records.filter(r => r.id !== id);
    window.storageService.set("records", records);
    window.app.render();
    window.app.showToast("Đã xóa hồ sơ", "info");
  }
};
