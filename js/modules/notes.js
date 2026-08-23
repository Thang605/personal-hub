/**
 * Personal Hub - Notes & Knowledge Base Module
 * Soạn thảo ghi chú Markdown thông minh, gắn thẻ tag, tìm kiếm toàn văn và xuất file.
 */

window.NotesModule = {
  activeNoteId: null,
  activeFolder: "all",
  searchQuery: "",
  editorMode: "split", // 'edit' | 'preview' | 'split'

  render(params = {}) {
    if (params.noteId) {
      this.activeNoteId = params.noteId;
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

    // Sắp xếp: Ghim lên đầu, sau đó theo thời gian cập nhật mới nhất
    filteredNotes.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });

    // Nếu chưa chọn ghi chú nào, chọn ghi chú đầu tiên
    if (!this.activeNoteId && filteredNotes.length > 0) {
      this.activeNoteId = filteredNotes[0].id;
    }

    const activeNote = notes.find(n => n.id === this.activeNoteId) || null;

    return `
      <div class="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-4 animate-fadeIn">
        <!-- Cột 1: Danh sách thư mục & Ghi chú -->
        <div class="w-full md:w-80 lg:w-96 flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden shrink-0">
          <!-- Header cột trái -->
          <div class="p-4 border-b border-slate-100 dark:border-slate-700/80 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i data-lucide="book-open" class="w-5 h-5 text-indigo-600 dark:text-indigo-400"></i>
                <h2 class="font-bold text-slate-800 dark:text-white">Ghi Chú & Kiến Thức</h2>
              </div>
              <button onclick="window.NotesModule.createNewNote()" class="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow transition active:scale-95">
                <i data-lucide="plus" class="w-4 h-4"></i> Tạo mới
              </button>
            </div>

            <!-- Ô tìm kiếm -->
            <div class="relative">
              <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input 
                type="text" 
                placeholder="Tìm tiêu đề, nội dung, tag..." 
                value="${this.searchQuery}"
                oninput="window.NotesModule.onSearch(this.value)"
                class="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              />
            </div>

            <!-- Bộ lọc Thư mục -->
            <div class="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button 
                onclick="window.NotesModule.setFolder('all')"
                class="px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${this.activeFolder === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}">
                Tất cả (${notes.length})
              </button>
              ${folders.map(f => `
                <button 
                  onclick="window.NotesModule.setFolder('${f}')"
                  class="px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${this.activeFolder === f ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}">
                  ${f}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Danh sách bài viết -->
          <div class="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
            ${filteredNotes.length === 0 ? `
              <div class="p-8 text-center text-slate-400">
                <i data-lucide="file-question" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                <p class="text-xs">Không tìm thấy ghi chú nào</p>
              </div>
            ` : filteredNotes.map(n => `
              <div 
                onclick="window.NotesModule.selectNote('${n.id}')"
                class="p-3.5 cursor-pointer transition relative group ${this.activeNoteId === n.id ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-l-4 border-indigo-600' : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'}">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1 flex items-center gap-1">
                    ${n.pinned ? '<i data-lucide="pin" class="w-3 h-3 text-amber-500 shrink-0"></i>' : ''}
                    ${n.title || "Ghi chú không tiêu đề"}
                  </h3>
                  <span class="text-[10px] text-slate-400 shrink-0">${new Date(n.updatedAt || n.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                  ${n.content.replace(/#|\*|`|>|\[|\]/g, '').slice(0, 80) || "Chưa có nội dung..."}
                </p>
                <div class="flex items-center gap-1.5 mt-2 overflow-hidden">
                  <span class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-500 dark:text-slate-400">${n.folder || "Chung"}</span>
                  ${(n.tags || []).slice(0, 2).map(t => `<span class="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-[10px]">#${t}</span>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Cột 2: Trình soạn thảo & Preview -->
        <div class="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
          ${activeNote ? `
            <!-- Thanh công cụ Editor -->
            <div class="p-3.5 border-b border-slate-100 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <!-- Chọn thư mục -->
                <select 
                  onchange="window.NotesModule.updateNoteFolder('${activeNote.id}', this.value)"
                  class="text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200 focus:outline-none">
                  ${folders.map(f => `<option value="${f}" ${activeNote.folder === f ? 'selected' : ''}>📁 ${f}</option>`).join('')}
                </select>

                <!-- Nút Ghim -->
                <button 
                  onclick="window.NotesModule.togglePin('${activeNote.id}')"
                  title="${activeNote.pinned ? 'Bỏ ghim' : 'Ghim lên đầu'}"
                  class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition ${activeNote.pinned ? 'text-amber-500 border-amber-300 bg-amber-50 dark:bg-amber-900/20' : ''}">
                  <i data-lucide="pin" class="w-4 h-4"></i>
                </button>
              </div>

              <!-- Chế độ xem & Hành động -->
              <div class="flex items-center gap-1.5">
                <!-- Switch chế độ xem -->
                <div class="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5 text-xs">
                  <button 
                    onclick="window.NotesModule.setEditorMode('edit')" 
                    class="px-2.5 py-1 rounded-md transition ${this.editorMode === 'edit' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xs font-semibold' : 'text-slate-600 dark:text-slate-300'}">
                    Soạn thảo
                  </button>
                  <button 
                    onclick="window.NotesModule.setEditorMode('split')" 
                    class="hidden md:block px-2.5 py-1 rounded-md transition ${this.editorMode === 'split' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xs font-semibold' : 'text-slate-600 dark:text-slate-300'}">
                    Song song
                  </button>
                  <button 
                    onclick="window.NotesModule.setEditorMode('preview')" 
                    class="px-2.5 py-1 rounded-md transition ${this.editorMode === 'preview' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xs font-semibold' : 'text-slate-600 dark:text-slate-300'}">
                    Xem trước
                  </button>
                </div>

                <!-- Tải file Markdown -->
                <button 
                  onclick="window.NotesModule.exportAsMarkdown('${activeNote.id}')"
                  title="Tải về file .md"
                  class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                  <i data-lucide="download" class="w-4 h-4"></i>
                </button>

                <!-- Xóa ghi chú -->
                <button 
                  onclick="window.NotesModule.deleteNote('${activeNote.id}')"
                  title="Xóa ghi chú"
                  class="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <!-- Tiêu đề & Tags -->
            <div class="p-4 border-b border-slate-100 dark:border-slate-700/60 space-y-2">
              <input 
                type="text" 
                id="note-title-input"
                placeholder="Tiêu đề ghi chú..." 
                value="${activeNote.title || ''}"
                oninput="window.NotesModule.updateNoteTitle('${activeNote.id}', this.value)"
                class="w-full text-lg md:text-xl font-bold bg-transparent border-none focus:outline-none text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
              />
              <div class="flex items-center gap-2">
                <i data-lucide="tag" class="w-3.5 h-3.5 text-slate-400"></i>
                <input 
                  type="text" 
                  placeholder="Thẻ tag (ngăn cách bằng dấu phẩy, vd: việc, ý tưởng)" 
                  value="${(activeNote.tags || []).join(', ')}"
                  onchange="window.NotesModule.updateNoteTags('${activeNote.id}', this.value)"
                  class="w-full text-xs bg-transparent border-none focus:outline-none text-slate-600 dark:text-slate-300 placeholder:text-slate-400"
                />
              </div>
            </div>

            <!-- Khu vực nội dung Editor & Preview -->
            <div class="flex-1 flex overflow-hidden">
              <!-- Editor Textarea -->
              <div class="flex-1 h-full p-4 overflow-y-auto ${this.editorMode === 'preview' ? 'hidden' : ''}">
                <textarea 
                  id="note-content-input"
                  placeholder="Bắt đầu viết ghi chú bằng Markdown (# Tiêu đề, - Danh sách, **in đậm**)..."
                  oninput="window.NotesModule.updateNoteContent('${activeNote.id}', this.value)"
                  class="w-full h-full bg-transparent resize-none border-none focus:outline-none font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                >${activeNote.content || ''}</textarea>
              </div>

              <!-- Preview Rendered HTML -->
              <div class="flex-1 h-full p-6 overflow-y-auto border-l border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 prose dark:prose-invert max-w-none text-sm leading-relaxed ${this.editorMode === 'edit' ? 'hidden' : ''}">
                <div id="note-preview-area">
                  ${window.marked ? window.marked.parse(activeNote.content || "*Chưa có nội dung...*") : activeNote.content}
                </div>
              </div>
            </div>

            <!-- Footer số từ & thời gian -->
            <div class="px-4 py-2 bg-slate-50 dark:bg-slate-700/40 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
              <div class="flex items-center gap-4">
                <span><i data-lucide="clock" class="w-3 h-3 inline"></i> Sửa: ${new Date(activeNote.updatedAt || activeNote.createdAt).toLocaleTimeString('vi-VN')} ${new Date(activeNote.updatedAt || activeNote.createdAt).toLocaleDateString('vi-VN')}</span>
                <span>Số từ: ${(activeNote.content || '').trim().split(/\s+/).filter(Boolean).length}</span>
              </div>
              <span class="text-emerald-600 dark:text-emerald-400 font-medium">● Đã lưu tự động</span>
            </div>
          ` : `
            <div class="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
              <i data-lucide="file-edit" class="w-12 h-12 mb-3 opacity-40"></i>
              <h3 class="text-base font-semibold text-slate-600 dark:text-slate-300">Chưa chọn ghi chú nào</h3>
              <p class="text-xs mt-1">Chọn ghi chú ở danh sách bên trái hoặc tạo mới ngay bây giờ</p>
              <button onclick="window.NotesModule.createNewNote()" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow">
                + Tạo ghi chú mới
              </button>
            </div>
          `}
        </div>
      </div>
    `;
  },

  setFolder(folder) {
    this.activeFolder = folder;
    window.app.render();
  },

  onSearch(query) {
    this.searchQuery = query;
    window.app.render();
  },

  selectNote(id) {
    this.activeNoteId = id;
    window.app.render();
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
      if (previewArea && window.marked) {
        previewArea.innerHTML = window.marked.parse(content || "*Chưa có nội dung...*");
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
      window.app.render();
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
