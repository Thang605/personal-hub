/**
 * Personal Hub - Notes & Knowledge Base Module
 * Tối ưu hóa trải nghiệm đọc và soạn thảo ghi chú trên mọi thiết bị (Điện thoại & Máy tính).
 */

window.NotesModule = {
  activeNoteId: null,
  activeFolder: "all",
  searchQuery: "",
  editorMode: "preview", // 'preview' | 'edit' | 'split'
  mobileView: "list", // 'list' | 'detail'

  render(params = {}) {
    if (params.noteId) {
      this.activeNoteId = params.noteId;
      this.mobileView = "detail";
    }
    if (params.action === "new") {
      this.createNewNote();
    }

    const notes = window.storageService.get("notes") || [];
    const settings = window.storageService.get("settings") || {};
    const folders = settings.noteFolders || ["Chung", "Công việc", "Học tập", "Ý tưởng", "Nhật ký"];

    // Lọc theo thư mục & tìm kiếm
    let filteredNotes = [...notes];
    if (this.activeFolder !== "all") {
      filteredNotes = filteredNotes.filter(n => (n.folder || "Chung") === this.activeFolder);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filteredNotes = filteredNotes.filter(n => 
        (n.title && n.title.toLowerCase().includes(q)) || 
        (n.content && n.content.toLowerCase().includes(q)) ||
        (n.tags && n.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    // Sắp xếp: Ghim lên đầu, sau đó theo thời gian cập nhật
    filteredNotes.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });

    if (!this.activeNoteId && filteredNotes.length > 0) {
      this.activeNoteId = filteredNotes[0].id;
    }

    const activeNote = notes.find(n => n.id === this.activeNoteId) || null;

    return `
      <div class="h-[calc(100vh-130px)] flex flex-col md:flex-row gap-4 animate-fadeIn">
        
        <!-- ================= CỘT 1: DANH SÁCH GHI CHÚ ================= -->
        <div class="w-full md:w-80 lg:w-96 flex flex-col bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden shrink-0 ${this.mobileView === 'detail' ? 'hidden md:flex' : 'flex'}">
          
          <!-- Header cột trái -->
          <div class="p-4 border-b border-slate-100 dark:border-slate-700/80 space-y-3 bg-slate-50/50 dark:bg-slate-800/80">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <i data-lucide="book-open" class="w-4 h-4"></i>
                </div>
                <h2 class="font-bold text-sm text-slate-800 dark:text-white">Ghi Chú & Kiến Thức</h2>
              </div>
              <button onclick="window.NotesModule.createNewNote()" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-md shadow-indigo-600/20 transition active:scale-95">
                <i data-lucide="plus" class="w-4 h-4"></i> Tạo mới
              </button>
            </div>

            <!-- Ô tìm kiếm -->
            <div class="relative">
              <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input 
                type="text" 
                placeholder="Tìm bài viết, ý tưởng, tag..." 
                value="${this.searchQuery}"
                oninput="window.NotesModule.onSearch(this.value)"
                class="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-700/70 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white placeholder:text-slate-400"
              />
            </div>

            <!-- Bộ lọc Thư mục -->
            <div class="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button 
                onclick="window.NotesModule.setFolder('all')"
                class="px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition ${this.activeFolder === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}">
                Tất cả (${notes.length})
              </button>
              ${folders.map(f => `
                <button 
                  onclick="window.NotesModule.setFolder('${f}')"
                  class="px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition ${this.activeFolder === f ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}">
                  ${f}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Danh sách bài viết -->
          <div class="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 p-2 space-y-2">
            ${filteredNotes.length === 0 ? `
              <div class="p-8 text-center text-slate-400">
                <i data-lucide="file-question" class="w-10 h-10 mx-auto mb-2 opacity-40"></i>
                <p class="text-xs font-medium">Không tìm thấy ghi chú nào</p>
              </div>
            ` : filteredNotes.map(n => `
              <div 
                onclick="window.NotesModule.openNoteDetail('${n.id}')"
                class="p-4 rounded-2xl cursor-pointer transition border border-transparent ${this.activeNoteId === n.id ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-slate-100 dark:border-slate-700/60'}">
                
                <div class="flex items-start justify-between gap-2">
                  <h3 class="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 flex items-center gap-1.5 leading-snug">
                    ${n.pinned ? '<span class="text-amber-500 shrink-0">📌</span>' : ''}
                    ${n.title || "Ghi chú không tiêu đề"}
                  </h3>
                  <span class="text-[10px] font-mono text-slate-400 shrink-0">${new Date(n.updatedAt || n.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>

                <p class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                  ${n.content ? n.content.replace(/#|\*|`|>|\[|\]/g, '').slice(0, 95) : "Chưa có nội dung..."}
                </p>

                <div class="flex items-center justify-between mt-3 pt-2 border-t border-slate-100/60 dark:border-slate-700/40">
                  <div class="flex items-center gap-1.5 overflow-hidden">
                    <span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-medium">📁 ${n.folder || "Chung"}</span>
                    ${(n.tags || []).slice(0, 1).map(t => `<span class="text-indigo-600 dark:text-indigo-400 text-[10px] font-medium">#${t}</span>`).join('')}
                  </div>
                  
                  <span class="px-2.5 py-1 rounded-lg bg-indigo-600/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-300 text-[11px] font-bold flex items-center gap-1 hover:bg-indigo-600 hover:text-white transition">
                    Đọc ngay <i data-lucide="arrow-right" class="w-3 h-3"></i>
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- ================= CỘT 2: CHI TIẾT GHI CHÚ / BÀI ĐỌC ================= -->
        <div class="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden ${this.mobileView === 'list' ? 'hidden md:flex' : 'flex'}">
          ${activeNote ? `
            <!-- Thanh công cụ Điều hướng & Chuyển chế độ -->
            <div class="p-3.5 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-800">
              
              <!-- Nút quay lại danh sách trên Mobile -->
              <div class="flex items-center gap-2">
                <button 
                  onclick="window.NotesModule.backToList()"
                  class="md:hidden px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 border border-indigo-100 dark:border-indigo-800">
                  <i data-lucide="arrow-left" class="w-4 h-4"></i> Danh sách ghi chú
                </button>

                <!-- Chọn thư mục -->
                <select 
                  onchange="window.NotesModule.updateNoteFolder('${activeNote.id}', this.value)"
                  class="text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none shadow-2xs font-medium">
                  ${folders.map(f => `<option value="${f}" ${activeNote.folder === f ? 'selected' : ''}>📁 ${f}</option>`).join('')}
                </select>

                <!-- Nút Ghim -->
                <button 
                  onclick="window.NotesModule.togglePin('${activeNote.id}')"
                  title="${activeNote.pinned ? 'Bỏ ghim' : 'Ghim lên đầu'}"
                  class="p-1.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition ${activeNote.pinned ? 'text-amber-500 border-amber-300 bg-amber-50 dark:bg-amber-900/20' : ''}">
                  <i data-lucide="pin" class="w-4 h-4"></i>
                </button>
              </div>

              <!-- Nút Chuyển chế độ: Đọc / Soạn thảo -->
              <div class="flex items-center gap-1.5">
                <div class="flex bg-slate-200/80 dark:bg-slate-700/80 rounded-xl p-0.5 text-xs font-bold">
                  <button 
                    onclick="window.NotesModule.setEditorMode('preview')" 
                    class="px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${this.editorMode === 'preview' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow' : 'text-slate-600 dark:text-slate-300'}">
                    <i data-lucide="book-open" class="w-3.5 h-3.5"></i> Chế độ Đọc
                  </button>
                  <button 
                    onclick="window.NotesModule.setEditorMode('edit')" 
                    class="px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${this.editorMode === 'edit' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow' : 'text-slate-600 dark:text-slate-300'}">
                    <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Soạn thảo
                  </button>
                  <button 
                    onclick="window.NotesModule.setEditorMode('split')" 
                    class="hidden lg:flex px-3 py-1.5 rounded-lg transition items-center gap-1.5 ${this.editorMode === 'split' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow' : 'text-slate-600 dark:text-slate-300'}">
                    <i data-lucide="columns" class="w-3.5 h-3.5"></i> Song song
                  </button>
                </div>

                <!-- Tải file Markdown -->
                <button 
                  onclick="window.NotesModule.exportAsMarkdown('${activeNote.id}')"
                  title="Tải về file .md"
                  class="p-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                  <i data-lucide="download" class="w-4 h-4"></i>
                </button>

                <!-- Xóa ghi chú -->
                <button 
                  onclick="window.NotesModule.deleteNote('${activeNote.id}')"
                  title="Xóa ghi chú"
                  class="p-2 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <!-- Tiêu đề & Tags -->
            <div class="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700/60 space-y-2">
              <input 
                type="text" 
                id="note-title-input"
                placeholder="Tiêu đề ghi chú..." 
                value="${activeNote.title || ''}"
                oninput="window.NotesModule.updateNoteTitle('${activeNote.id}', this.value)"
                class="w-full text-lg md:text-2xl font-extrabold bg-transparent border-none focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 leading-tight"
              />
              <div class="flex items-center gap-2">
                <i data-lucide="tag" class="w-3.5 h-3.5 text-slate-400"></i>
                <input 
                  type="text" 
                  placeholder="Thẻ tag (vd: AI, Kiếm tiền, Ý tưởng)" 
                  value="${(activeNote.tags || []).join(', ')}"
                  onchange="window.NotesModule.updateNoteTags('${activeNote.id}', this.value)"
                  class="w-full text-xs bg-transparent border-none focus:outline-none text-slate-600 dark:text-slate-300 placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            <!-- Khu vực nội dung bài đọc / editor -->
            <div class="flex-1 flex overflow-hidden">
              <!-- Cửa sổ soạn thảo thô (Textarea) -->
              <div class="flex-1 h-full p-4 md:p-6 overflow-y-auto ${this.editorMode === 'preview' ? 'hidden' : ''}">
                <textarea 
                  id="note-content-input"
                  placeholder="Bắt đầu viết ghi chú bằng Markdown (# Tiêu đề, - Danh sách, **in đậm**)..."
                  oninput="window.NotesModule.updateNoteContent('${activeNote.id}', this.value)"
                  class="w-full h-full bg-transparent resize-none border-none focus:outline-none font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                >${activeNote.content || ''}</textarea>
              </div>

              <!-- Cửa sổ xem trước định dạng đẹp (Rendered HTML) -->
              <div class="flex-1 h-full p-6 md:p-8 overflow-y-auto ${this.editorMode === 'split' ? 'border-l border-slate-200 dark:border-slate-700/60' : ''} bg-white dark:bg-slate-900/30 ${this.editorMode === 'edit' ? 'hidden' : ''}">
                <div id="note-preview-area" class="prose dark:prose-invert max-w-none text-sm md:text-base leading-relaxed text-slate-800 dark:text-slate-100">
                  ${this.renderMarkdownContent(activeNote.content)}
                </div>
              </div>
            </div>

            <!-- Footer: Số từ & Trạng thái lưu -->
            <div class="px-4 py-2.5 bg-slate-50 dark:bg-slate-700/40 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
              <div class="flex items-center gap-4">
                <span><i data-lucide="clock" class="w-3.5 h-3.5 inline"></i> Cập nhật: ${new Date(activeNote.updatedAt || activeNote.createdAt).toLocaleTimeString('vi-VN')} ${new Date(activeNote.updatedAt || activeNote.createdAt).toLocaleDateString('vi-VN')}</span>
                <span>Số từ: ${(activeNote.content || '').trim().split(/\s+/).filter(Boolean).length} từ</span>
              </div>
              <span class="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <i data-lucide="check" class="w-3.5 h-3.5"></i> Đã lưu
              </span>
            </div>
          ` : `
            <div class="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
              <i data-lucide="file-text" class="w-14 h-14 mb-3 opacity-30 text-indigo-500"></i>
              <h3 class="text-base font-bold text-slate-700 dark:text-slate-200">Chưa chọn ghi chú nào</h3>
              <p class="text-xs mt-1">Chọn một ghi chú ở danh sách bên trái hoặc nhấn nút bên dưới để tạo mới</p>
              <button onclick="window.NotesModule.createNewNote()" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow">
                + Tạo ghi chú mới
              </button>
            </div>
          `}
        </div>

      </div>
    `;
  },

  renderMarkdownContent(content) {
    if (!content) return "*Chưa có nội dung...*";
    try {
      if (window.marked && typeof window.marked.parse === "function") {
        return window.marked.parse(content);
      } else if (window.marked && typeof window.marked === "function") {
        return window.marked(content);
      }
    } catch (e) {
      console.error("Lỗi parse markdown:", e);
    }
    return content.replace(/\n/g, '<br/>');
  },

  setFolder(folder) {
    this.activeFolder = folder;
    window.app.render();
  },

  onSearch(query) {
    this.searchQuery = query;
    window.app.render();
  },

  openNoteDetail(id) {
    this.activeNoteId = id;
    this.mobileView = "detail";
    this.editorMode = "preview";
    window.app.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  backToList() {
    this.mobileView = "list";
    window.app.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  setEditorMode(mode) {
    this.editorMode = mode;
    window.app.render();
  },

  createNewNote() {
    const notes = window.storageService.get("notes") || [];
    const newNote = {
      id: "note_" + Date.now(),
      title: "Ghi chú mới " + new Date().toLocaleDateString('vi-VN'),
      content: "# Tiêu đề ghi chú\n\nBắt đầu nhập nội dung của bạn ở đây...",
      tags: [],
      folder: this.activeFolder !== "all" ? this.activeFolder : "Chung",
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    notes.unshift(newNote);
    window.storageService.set("notes", notes);
    this.activeNoteId = newNote.id;
    this.mobileView = "detail";
    this.editorMode = "edit";
    window.app.render();
    window.app.showToast("Đã tạo ghi chú mới!", "success");
  },

  updateNoteTitle(id, title) {
    const notes = window.storageService.get("notes") || [];
    const note = notes.find(n => n.id === id);
    if (note) {
      note.title = title;
      note.updatedAt = new Date().toISOString();
      window.storageService.set("notes", notes);
    }
  },

  updateNoteContent(id, content) {
    const notes = window.storageService.get("notes") || [];
    const note = notes.find(n => n.id === id);
    if (note) {
      note.content = content;
      note.updatedAt = new Date().toISOString();
      window.storageService.set("notes", notes);
      
      const previewArea = document.getElementById("note-preview-area");
      if (previewArea) {
        previewArea.innerHTML = this.renderMarkdownContent(content);
      }
    }
  },

  updateNoteTags(id, tagsString) {
    const tags = tagsString.split(',').map(t => t.trim()).filter(Boolean);
    const notes = window.storageService.get("notes") || [];
    const note = notes.find(n => n.id === id);
    if (note) {
      note.tags = tags;
      note.updatedAt = new Date().toISOString();
      window.storageService.set("notes", notes);
    }
  },

  updateNoteFolder(id, folder) {
    const notes = window.storageService.get("notes") || [];
    const note = notes.find(n => n.id === id);
    if (note) {
      note.folder = folder;
      note.updatedAt = new Date().toISOString();
      window.storageService.set("notes", notes);
      window.app.render();
    }
  },

  togglePin(id) {
    const notes = window.storageService.get("notes") || [];
    const note = notes.find(n => n.id === id);
    if (note) {
      note.pinned = !note.pinned;
      note.updatedAt = new Date().toISOString();
      window.storageService.set("notes", notes);
      window.app.render();
      window.app.showToast(note.pinned ? "Đã ghim ghi chú!" : "Đã bỏ ghim", "info");
    }
  },

  deleteNote(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa ghi chú này không?")) return;
    let notes = window.storageService.get("notes") || [];
    notes = notes.filter(n => n.id !== id);
    window.storageService.set("notes", notes);
    this.activeNoteId = notes.length > 0 ? notes[0].id : null;
    this.mobileView = "list";
    window.app.render();
    window.app.showToast("Đã xóa ghi chú", "info");
  },

  exportAsMarkdown(id) {
    const notes = window.storageService.get("notes") || [];
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const blob = new Blob([note.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(note.title || 'note').replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    window.app.showToast("Đã tải về file Markdown!", "success");
  }
};
