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
      id: "note_kiem_tien_ai",
      title: "🚀 Tổng Hợp 7 Cách Kiếm Tiền Từ AI Thực Chiến & Bền Vững (2026)",
      content: `# 🚀 Tổng Hợp 7 Cách Kiếm Tiền Từ AI Thực Chiến & Bền Vững (2026)

Trí tuệ nhân tạo (AI) đang tạo ra cuộc cách mạng về năng suất và cơ hội tạo ra nhiều dòng thu nhập (chủ động & thụ động). Dưới đây là các mô hình kiếm tiền thực tế, đã được chứng minh hiệu quả nhất hiện nay.

---

## 1. 🎬 Xây Dựng Kênh Video Ngắn Tự Động (Faceless YouTube / TikTok / Reels)
* **Ý tưởng**: Tạo các kênh video không cần lộ mặt về chủ đề: Lịch sử, Sự thật thú vị, Triết lý sống, Tóm tắt sách, Kể chuyện trinh thám.
* **Bộ công cụ (AI Stack)**:
  - **Kịch bản**: ChatGPT / Google Gemini / Claude 3.7.
  - **Giọng đọc (Voiceover)**: ElevenLabs (giọng lồng tiếng chân thực, cảm xúc).
  - **Hình ảnh/Video**: Midjourney, Flux.1, Kling AI, Luma Dream Machine, Runway Gen-3.
  - **Biên tập & Chèn phụ đề**: CapCut (Auto Captions), Vizard, Opus Clip.
* **Mô hình kiếm tiền**: Bật kiếm tiền từ lượt xem (YouTube Partner / TikTok Creator Rewards), Booking quảng cáo, Tiếp thị liên kết (Affiliate).

---

## 2. 🤖 Dịch Vụ Tự Động Hóa Doanh Nghiệp Bằng AI (AI Automation Agency - AAA)
* **Ý tưởng**: Giúp các doanh nghiệp vừa & nhỏ (SME), spa, nha khoa, shop online tự động hóa chăm sóc khách hàng và quy trình nội bộ.
* **Dịch vụ triển khai**:
  - Chatbot AI tư vấn và chốt đơn 24/7 (Voiceflow, Flowise, ManyChat + OpenAI API).
  - Hệ thống tự động phân loại lead, gửi email marketing cá nhân hóa (Make.com, Zapier).
* **Mức thu nhập**: Từ 5 - 20 triệu VNĐ/dự án setup + phí duy trì hàng tháng.

---

## 3. 🎨 Thiết Kế Đồ Họa & Bán Hàng In Theo Yêu Cầu (Print On Demand - POD)
* **Ý tưởng**: Dùng AI tạo tranh nghệ thuật, mẫu áo thun, cốc sứ, ốp lưng điện thoại, tranh treo tường Canvas.
* **Nền tảng bán hàng**: Etsy, Shopify, Merch by Amazon, Redbubble.
* **Công cụ**: Midjourney, Leonardo.ai, Kittle AI, Photoshop Generative Fill.

---

## 4. 📚 Biên Soạn Tài Liệu Số, Ebook & Khóa Học Micro-Learning
* **Ý tưởng**: Tổng hợp tài liệu hướng dẫn, ebook giải quyết một nỗi đau cụ thể (ví dụ: *Bộ cẩm nang ứng dụng AI cho ngành Bất động sản / Kế toán / Giáo viên*).
* **Nền tảng phân phối**: Gumroad, Payhip, Kobo, Amazon KDP.
* **Ưu điểm**: Tạo 1 lần, bán nhiều lần (Thu nhập thụ động 100%).

---

## 5. 💡 Bán Bộ Prompt & Mẫu Thiết Lập (Prompt Engineering & Notion Templates)
* **Ý tưởng**: Đóng gói các bộ Prompt chuyên sâu (System Prompts cho Sales, Marketing, Lập trình) hoặc Template Notion tích hợp AI.
* **Nơi bán**: PromptBase, Gumroad, cộng đồng mạng xã hội.

---

## 6. 💻 Xây Dựng Ứng Dụng Micro-SaaS & Tiện Ích AI (AI Wrappers)
* **Ý tưởng**: Tận dụng AI để lập trình nhanh các công cụ giải quyết 1 vấn đề ngách (ví dụ: Tiện ích tóm tắt video YouTube, Công cụ viết caption mạng xã hội tự động).
* **Công cụ No-Code & AI Code**: Cursor AI, v0.dev, Replit, Lovable, Supabase.

---

## 7. 🔗 Tiếp Thị Liên Kết Cho Các Phần Mềm AI (AI Affiliate Marketing)
* **Ý tưởng**: Viết bài đánh giá, so sánh, hướng dẫn sử dụng các công cụ AI và chèn link affiliate.
* **Mức hoa hồng**: Rất cao (thường từ 20% - 40% định kỳ hàng tháng - Recurring Commission trọn đời).

---

## 📊 Bảng So Sánh Các Mô Hình

| Mô hình | Vốn ban đầu | Độ khó | Tiềm năng thu nhập | Thời gian có kết quả |
| :--- | :--- | :--- | :--- | :--- |
| **Video Faceless** | Rất thấp | Trung bình | $500 - $3.000+/tháng | 1 - 3 tháng |
| **AI Agency (AAA)** | Thấp | Khá cao | $1.000 - $5.000+/tháng | 1 - 2 tháng |
| **Bán POD / Canvas** | Thấp | Trung bình | $300 - $2.000/tháng | 2 - 4 tháng |
| **Tài liệu số / Prompt** | 0 đồng | Dễ | $200 - $1.000/tháng | 2 - 4 tuần |
| **Affiliate Tool AI** | 0 đồng | Dễ - TB | $300 - $2.000+/tháng | 1 - 3 tháng |

---

## 🎯 Lộ Trình 4 Bước Bắt Đầu Ngay Hôm Nay:
1. **Bước 1**: Chọn **1 mô hình duy nhất** phù hợp với thế mạnh của bạn (Ví dụ: Thích nội dung chọn Video Faceless; Giỏi kỹ thuật chọn AI Agency/Micro-SaaS).
2. **Bước 2**: Dành 3-5 ngày làm chủ 2 công cụ cốt lõi (ví dụ: ChatGPT + ElevenLabs hoặc Midjourney + CapCut).
3. **Bước 3**: Tạo ra 10 sản phẩm mẫu / video mẫu đầu tiên để kiểm tra thị trường.
4. **Bước 4**: Tối ưu hóa quy trình dựa trên phản hồi và nhân bản quy mô.`,
      tags: ["AI", "Kiếm tiền", "Kinh doanh", "Xu hướng"],
      folder: "Ý tưởng",
      pinned: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "note_top_ai_tools",
      title: "🛠️ Danh Sách Các Công Cụ AI Đắc Lực Để Tạo Thu Nhập",
      content: `# 🛠️ Danh Sách Các Công Cụ AI Đắc Lực Nhất (2026)

### 1. Tạo Nội Dung & Tư Duy Chiến Lược
- **Google Gemini 2.0 / 3.7**: Phân tích dữ liệu lớn, xử lý hình ảnh & văn bản tốc độ cao.
- **Claude 3.7 Sonnet**: Khả năng lập luận logic, viết văn phong tự nhiên và coding xuất sắc.
- **ChatGPT (GPT-4o)**: Đa năng, hỗ trợ Custom GPTs và tạo kịch bản.

### 2. Tạo Giọng Nói & Âm Thanh (Audio & Voice)
- **ElevenLabs**: Đỉnh cao giọng đọc AI đa ngôn ngữ, hỗ trợ lồng tiếng cảm xúc chân thực.
- **Suno AI / Udio**: Tạo nhạc bài hát hoàn chỉnh kèm lời chỉ bằng văn bản.

### 3. Tạo Ảnh & Thiết Kế Đồ Họa (Image & Art)
- **Midjourney v6.1**: Chất lượng hình ảnh nghệ thuật, chân dung và phong cảnh số 1 thế giới.
- **Flux.1**: Mô hình tạo ảnh mã nguồn mở chân thực, viết chữ tiếng Anh cực chuẩn.
- **Canva Magic Studio**: Thiết kế banner, bài đăng mạng xã hội nhanh chóng.

### 4. Tạo Video & Hoạt Họa (Video Generation)
- **Kling AI / Luma Dream Machine / Runway Gen-3**: Biến văn bản và ảnh tĩnh thành video mượt mà.
- **CapCut**: Cắt ghép, auto caption, hiệu ứng chuyển cảnh tự động.

### 5. Tự Động Hóa & Lập Trình (Automation & Code)
- **Make.com & Zapier**: Kết nối API không cần code.
- **Cursor AI / Lovable.dev**: Trợ lý lập trình AI thế hệ mới.`,
      tags: ["AI Tools", "Danh sách", "Công nghệ"],
      folder: "Học tập",
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
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
      pinned: false,
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
      id: "bm_elevenlabs",
      title: "ElevenLabs - AI Giọng Đọc Đỉnh Cao",
      url: "https://elevenlabs.io",
      category: "Công cụ AI",
      tags: ["Voice", "Audio", "Kiếm tiền"],
      description: "Nền tảng lồng tiếng và nhân bản giọng đọc AI chất lượng cao nhất",
      pinned: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "bm_midjourney",
      title: "Midjourney - AI Tạo Hình Ảnh Nghệ Thuật",
      url: "https://www.midjourney.com",
      category: "Công cụ AI",
      tags: ["Image", "Design", "POD"],
      description: "Công cụ tạo hình ảnh, tranh nghệ thuật, mẫu áo thun POD hàng đầu",
      pinned: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "bm_make",
      title: "Make.com - Tự Động Hóa Quy Trình & Chatbot",
      url: "https://www.make.com",
      category: "Công cụ AI",
      tags: ["Automation", "AAA", "NoCode"],
      description: "Nền tảng tự động hóa quy trình cho doanh nghiệp và Agency",
      pinned: false,
      createdAt: new Date().toISOString()
    },
    {
      id: "bm_gumroad",
      title: "Gumroad - Nền Tảng Bán Sản Phẩm Số & Ebook",
      url: "https://gumroad.com",
      category: "Tài chính",
      tags: ["Digital Product", "Ebook", "Bán hàng"],
      description: "Nơi bán Ebook, Prompt, Khóa học và sản phẩm số không cần tạo website phức tạp",
      pinned: false,
      createdAt: new Date().toISOString()
    },
    {
      id: "bm_1",
      title: "Google Gemini AI",
      url: "https://gemini.google.com",
      category: "Công cụ AI",
      tags: ["AI", "Trợ lý"],
      description: "Trợ lý trí tuệ nhân tạo thế hệ mới của Google",
      pinned: false,
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
      const existing = localStorage.getItem(storageKey);
      if (!existing) {
        this.set(key, SEED_DATA[key]);
      } else {
        // Tự động bổ sung ghi chú & bookmarks mới nếu chưa có
        if (key === "notes" || key === "bookmarks") {
          try {
            const currentList = JSON.parse(existing) || [];
            const currentIds = new Set(currentList.map(item => item.id));
            let hasNew = false;
            SEED_DATA[key].forEach(seedItem => {
              if (!currentIds.has(seedItem.id)) {
                currentList.unshift(seedItem);
                hasNew = true;
              }
            });
            if (hasNew) {
              this.set(key, currentList);
            }
          } catch (e) {
            console.error("Lỗi merge seed data:", e);
          }
        }
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
