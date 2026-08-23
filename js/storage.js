/**
 * Personal Hub - Local Storage & Data Management Module
 * Quản lý lưu trữ bền vững trên trình duyệt (LocalStorage / IndexedDB support)
 * Cung cấp tính năng Sao lưu (Export JSON) & Khôi phục (Import JSON) toàn diện.
 */

const STORAGE_KEY_PREFIX = "personal_hub_";

const DEFAULT_SETTINGS = {
  userName: "Bạn",
  theme: "dark", // 'dark' | 'light' | 'system'
  autoLockMinutes: 15,
  currency: "VND",
  lastBackupDate: null,
  noteFolders: ["Chung", "Công việc", "Học tập", "Ý tưởng", "Nhật ký"],
  bookmarkCategories: ["Công việc", "Học tập", "Công cụ AI", "Giải trí", "Tài chính"],
  financeCategories: {
    expense: ["Ăn uống", "Nhà ở & Tiện ích", "Mua sắm", "Di chuyển", "Học tập & Sách", "Giải trí", "Y tế", "Khác"],
    income: ["Lương", "Thưởng", "Đầu tư", "Freelance", "Khác"]
  }
};

// Dữ liệu mẫu khởi tạo giúp người dùng làm quen ngay lập tức
const SEED_DATA = {
  settings: DEFAULT_SETTINGS,
  notes: [
    {
      id: "note_welcome",
      title: "Chào mừng bạn đến với Personal Hub!",
      content: `# 🌟 Chào mừng bạn đến với Kho Thông Tin Cá Nhân

Đây là không gian lưu trữ an toàn, bảo mật và hoàn toàn thuộc về bạn!

### 💡 Các tính năng nổi bật:
- **Ghi chú & Markdown**: Soạn thảo văn bản, hỗ trợ định dạng rich markdown, danh sách công việc, code snippet.
- **Két mã hóa (Vault)**: Sử dụng thuật toán chuẩn quân sự **AES-GCM 256-bit** để mã hóa tài khoản, mật khẩu, mã PIN ngân hàng. Dữ liệu chỉ được giải mã trên máy bạn!
- **Hồ sơ cá nhân (Records)**: Lưu thông tin CCCD, BHYT, hộ chiếu, số tài khoản ngân hàng, thông tin bảo hiểm.
- **Quản lý Bookmarks**: Lưu trữ và phân loại các đường dẫn, tài liệu, công cụ yêu thích.
- **Quản lý Tài chính**: Theo dõi thu chi hàng tháng, thống kê danh mục chi tiêu trực quan.
- **Kế hoạch & Việc cần làm**: Quản lý to-do list, phân chia mức độ ưu tiên.

> 🔒 **Lưu ý quan trọng**: Dữ liệu lưu trực tiếp trên trình duyệt của bạn. Hãy vào mục **Cài đặt & Sao lưu** để tải về bản sao lưu JSON định kỳ nhé!`,
      tags: ["Hướng dẫn", "Giới thiệu"],
      folder: "Chung",
      pinned: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  records: [
    {
      id: "rec_demo_cccd",
      type: "id_card",
      title: "Căn cước công dân (CCCD)",
      fields: [
        { label: "Số CCCD", value: "001xxxxxxxx", isSecret: false },
        { label: "Họ và tên", value: "NGUYỄN VĂN A", isSecret: false },
        { label: "Ngày sinh", value: "01/01/1995", isSecret: false },
        { label: "Ngày cấp", value: "10/10/2021", isSecret: false },
        { label: "Nơi cấp", value: "Cục Cảnh sát QLHC về TTXH", isSecret: false }
      ],
      notes: "Bản sao lưu số giấy tờ tùy thân khi cần điền form trực tuyến.",
      updatedAt: new Date().toISOString()
    },
    {
      id: "rec_demo_bank",
      type: "bank",
      title: "Tài khoản Ngân hàng Chính",
      fields: [
        { label: "Ngân hàng", value: "Vietcombank", isSecret: false },
        { label: "Số tài khoản", value: "1012345678", isSecret: false },
        { label: "Chủ tài khoản", value: "NGUYEN VAN A", isSecret: false },
        { label: "Chi nhánh", value: "Hội sở / Chi nhánh Hà Nội", isSecret: false }
      ],
      notes: "Dùng để nhận lương và chuyển khoản.",
      updatedAt: new Date().toISOString()
    }
  ],
  bookmarks: [
    {
      id: "bm_1",
      title: "Google Gemini AI",
      url: "https://gemini.google.com",
      category: "Công cụ AI",
      tags: ["AI", "Trợ lý"],
      description: "Trợ lý trí tuệ nhân tạo thế hệ mới của Google",
      pinned: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "bm_2",
      title: "GitHub",
      url: "https://github.com",
      category: "Công việc",
      tags: ["Code", "Dev"],
      description: "Nền tảng lưu trữ và quản lý mã nguồn",
      pinned: true,
      createdAt: new Date().toISOString()
    }
  ],
  finances: [
    {
      id: "fin_1",
      type: "income",
      amount: 20000000,
      category: "Lương",
      date: new Date().toISOString().slice(0, 10),
      description: "Lương tháng này",
      paymentMethod: "Chuyển khoản"
    },
    {
      id: "fin_2",
      type: "expense",
      amount: 5000000,
      category: "Nhà ở & Tiện ích",
      date: new Date().toISOString().slice(0, 10),
      description: "Tiền thuê nhà và phí dịch vụ",
      paymentMethod: "Chuyển khoản"
    },
    {
      id: "fin_3",
      type: "expense",
      amount: 2500000,
      category: "Ăn uống",
      date: new Date().toISOString().slice(0, 10),
      description: "Chi phí ăn uống hàng ngày",
      paymentMethod: "Tiền mặt / Thẻ"
    }
  ],
  tasks: [
    {
      id: "task_1",
      title: "Khám phá các tính năng của Personal Hub",
      description: "Thử tạo ghi chú mới, tạo danh mục chi tiêu và thiết lập Két bảo mật.",
      priority: "high",
      status: "todo",
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      category: "Cá nhân",
      createdAt: new Date().toISOString()
    },
    {
      id: "task_2",
      title: "Thiết lập mã PIN / Mật khẩu Két an toàn",
      description: "Vào mục Két Bảo Mật để khởi tạo mật khẩu bảo vệ tài khoản.",
      priority: "urgent",
      status: "in_progress",
      dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      category: "Bảo mật",
      createdAt: new Date().toISOString()
    }
  ],
  vaultMeta: {
    hasPassword: false,
    saltBase64: null,
    verifierBase64: null
  },
  vaultItems: []
};

class StorageService {
  constructor() {
    this.init();
  }

  init() {
    // Khởi tạo các bảng dữ liệu nếu chưa có
    Object.keys(SEED_DATA).forEach(key => {
      const storageKey = STORAGE_KEY_PREFIX + key;
      if (!localStorage.getItem(storageKey)) {
        this.set(key, SEED_DATA[key]);
      }
    });
  }

  get(key) {
    try {
      const val = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      return val ? JSON.parse(val) : null;
    } catch (e) {
      console.error(`Lỗi đọc dữ liệu [${key}]:`, e);
      return null;
    }
  }

  set(key, data) {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent("storage-changed", { detail: { key, data } }));
      return true;
    } catch (e) {
      console.error(`Lỗi ghi dữ liệu [${key}]:`, e);
      return false;
    }
  }

  // Lấy toàn bộ dữ liệu để xuất file sao lưu
  getAllData() {
    const data = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      settings: this.get("settings"),
      notes: this.get("notes"),
      records: this.get("records"),
      bookmarks: this.get("bookmarks"),
      finances: this.get("finances"),
      tasks: this.get("tasks"),
      vaultMeta: this.get("vaultMeta"),
      vaultItems: this.get("vaultItems")
    };
    return data;
  }

  // Tải file sao lưu JSON
  exportBackupFile() {
    const data = this.getAllData();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `PersonalHub_Backup_${timestamp}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    // Cập nhật ngày sao lưu gần nhất
    const settings = this.get("settings") || {};
    settings.lastBackupDate = new Date().toISOString();
    this.set("settings", settings);
  }

  // Nhập dữ liệu từ file sao lưu JSON
  importBackupData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== "object") {
        throw new Error("Tệp sao lưu không hợp lệ!");
      }

      if (data.settings) this.set("settings", data.settings);
      if (data.notes) this.set("notes", data.notes);
      if (data.records) this.set("records", data.records);
      if (data.bookmarks) this.set("bookmarks", data.bookmarks);
      if (data.finances) this.set("finances", data.finances);
      if (data.tasks) this.set("tasks", data.tasks);
      if (data.vaultMeta) this.set("vaultMeta", data.vaultMeta);
      if (data.vaultItems) this.set("vaultItems", data.vaultItems);

      return { success: true, message: "Đã khôi phục dữ liệu thành công!" };
    } catch (e) {
      return { success: false, message: "Lỗi khôi phục: " + e.message };
    }
  }

  // Xóa toàn bộ dữ liệu và reset về mặc định
  resetAllData() {
    Object.keys(SEED_DATA).forEach(key => {
      this.set(key, SEED_DATA[key]);
    });
  }
}

window.storageService = new StorageService();
