/**
 * Slide Data Manager & PowerPoint Section Checkpoint Lessons
 * Quản lý kho bài giảng, đề mục và câu hỏi trắc nghiệm nhúng vào PowerPoint.
 */

window.DEFAULT_SLIDE_LESSONS = [
  {
    id: "bai_giang_ai_2026",
    title: "Trí Tuệ Nhân Tạo (AI) & Ứng Dụng Trong Chuyển Đổi Số",
    description: "Bộ câu hỏi củng cố kiến thức theo 3 đề mục chính của bài giảng AI.",
    author: "Giảng viên / Diễn giả",
    sections: [
      {
        sectionIndex: 1,
        sectionTitle: "Đề mục 1: Khái Niệm & Nền Tảng Cốt Lõi Của Trí Tuệ Nhân Tạo",
        question: "Đâu là yếu tố quan trọng nhất thúc đẩy sự bùng nổ của các mô hình AI tạo sinh (Generative AI) trong những năm gần đây?",
        choices: [
          "Sự suy giảm của các thuật toán mã nguồn mở",
          "Kiến trúc Transformer và sự gia tăng vượt bậc của dữ liệu & sức mạnh tính toán GPU",
          "Việc thay thế hoàn toàn bộ nhớ RAM máy tính",
          "Sự ra đời của các loại màn hình máy tính độ phân giải cao"
        ],
        correct: 1,
        time: 20,
        explanation: "Kiến trúc mạng Transformer (cơ chế Self-Attention) kết hợp với tập dữ liệu khổng lồ và sức mạnh xử lý song song của GPU là nền tảng cốt lõi cho sự đột phá của các mô hình ngôn ngữ lớn (LLM).",
        keyTakeaway: "📌 ĐIỂM CỐT LÕI: AI tạo sinh phát triển nhờ sự hội tụ của 3 trụ cột: Dữ liệu lớn (Big Data), Kiến trúc Transformer và Năng lực tính toán (GPU)."
      },
      {
        sectionIndex: 2,
        sectionTitle: "Đề mục 2: Kỹ Thuật Viết Prompt Hiệu Quả (Prompt Engineering)",
        question: "Phương pháp nào sau đây giúp mô hình AI suy luận logic nhiều bước chính xác nhất khi xử lý các bài toán phức tạp?",
        choices: [
          "Chỉ viết câu lệnh 1 từ duy nhất",
          "Kỹ thuật Chain-of-Thought (Chuỗi suy nghĩ từng bước)",
          "Viết toàn bộ chữ in hoa và lặp lại nhiều lần",
          "Tắt chế độ kiểm tra ngữ pháp của trình duyệt"
        ],
        correct: 1,
        time: 20,
        explanation: "Kỹ thuật Chain-of-Thought (CoT) hướng dẫn AI chia nhỏ bài toán và giải thích từng bước suy luận, giúp giảm thiểu đáng kể lỗi ảo giác và tăng độ chính xác trong các bài toán tư duy phức tạp.",
        keyTakeaway: "📌 ĐIỂM CỐT LÕI: Hãy yêu cầu AI 'suy nghĩ từng bước' (Step-by-step thinking) khi giải quyết các vấn đề đa tầng logic."
      },
      {
        sectionIndex: 3,
        sectionTitle: "Đề mục 3: Đạo Đức AI & An Toàn Dữ Liệu Doanh Nghiệp",
        question: "Khi ứng dụng các công cụ AI vào quy trình làm việc của công ty, nguyên tắc bảo mật quan trọng nhất là gì?",
        choices: [
          "Không cần quan tâm vì mọi AI trên mạng đều tự bảo mật tuyệt đối",
          "Không đưa dữ liệu nội bộ, thông tin cá nhân khách hàng hay bí mật kinh doanh vào các mô hình AI công cộng chưa được kiểm chứng",
          "Chia sẻ toàn bộ mật khẩu hệ thống cho AI để AI tự động tối ưu hóa",
          "Chỉ sử dụng AI vào ban đêm để tránh bị lộ thông tin"
        ],
        correct: 1,
        time: 20,
        explanation: "Các mô hình AI công cộng có thể sử dụng dữ liệu đầu vào của người dùng để huấn luyện tiếp, do đó tuyệt đối không nhập dữ liệu nhạy cảm hay bí mật kinh doanh trừ khi sử dụng phiên bản Enterprise có cam kết bảo mật riêng tư.",
        keyTakeaway: "📌 ĐIỂM CỐT LÕI: Nguyên tắc 'Zero Trust' với dữ liệu nhạy cảm – luôn kiểm tra chính sách bảo mật trước khi gửi thông tin vào AI."
      }
    ]
  },
  {
    id: "bai_giang_thuyet_trinh",
    title: "Nghệ Thuật Thuyết Trình & Truyền Cảm Hứng",
    description: "Bộ câu hỏi tương tác kiểm tra sau từng phần của bài giảng kỹ năng trình bày.",
    author: "Ban Đào Tạo",
    sections: [
      {
        sectionIndex: 1,
        sectionTitle: "Đề mục 1: Cấu Trúc Bài Thuyết Trình (Mở - Thân - Kết)",
        question: "Khoảng thời gian nào trong bài thuyết trình được coi là 'Khoảnh khắc vàng' quyết định 80% sự chú ý của người nghe?",
        choices: [
          "30 đến 60 giây đầu tiên (Phần mở đầu Hook)",
          "15 phút sau khi bắt đầu bài nói",
          "Lúc chuẩn bị chiếu slide cảm ơn",
          "Sau khi kết thúc buổi thuyết trình"
        ],
        correct: 0,
        time: 15,
        explanation: "30-60 giây đầu tiên là khoảng thời gian khán giả định hình ấn tượng ban đầu. Một lời mở đầu ấn tượng (câu chuyện, con số giật mình, câu hỏi tương tác) sẽ thu hút trọn vẹn sự chú ý.",
        keyTakeaway: "📌 ĐIỂM CỐT LÕI: Mở đầu mạnh mẽ bằng kỹ thuật 'Hook' – tạo lý do để người nghe muốn lắng nghe bạn."
      },
      {
        sectionIndex: 2,
        sectionTitle: "Đề mục 2: Thiết Kế Slide Trực Quan (Nguyên Lý Visual)",
        question: "Quy tắc thiết kế slide nào sau đây giúp khán giả không bị quá tải thông tin?",
        choices: [
          "Chép toàn bộ văn bản tài liệu Word dán vào slide",
          "Quy tắc 'Một ý tưởng chính cho mỗi slide' (One Idea Per Slide) kết hợp hình ảnh minh họa đắt giá",
          "Sử dụng ít nhất 10 font chữ và màu sắc khác nhau trên 1 trang",
          "Để thật nhiều hiệu ứng chuyển động nhấp nháy liên tục"
        ],
        correct: 1,
        time: 15,
        explanation: "Mỗi slide chỉ nên tập trung vào 1 thông điệp chính với bố cục thoáng đãng, phân cấp thị giác rõ ràng để người nghe nắm bắt nội dung trong vòng 3 giây.",
        keyTakeaway: "📌 ĐIỂM CỐT LÕI: Slide là công cụ hỗ trợ người thuyết trình, không phải là bản đọc tài liệu."
      }
    ]
  }
];

class SlideDataManager {
  constructor() {
    this.STORAGE_KEY = "phub_slide_lessons_v1";
    this.lessons = [];
    this.init();
  }

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this.lessons = JSON.parse(saved);
      } catch (e) {
        console.error("Lỗi đọc dữ liệu bài giảng Slide từ LocalStorage:", e);
        this.lessons = [...window.DEFAULT_SLIDE_LESSONS];
      }
    } else {
      this.lessons = [...window.DEFAULT_SLIDE_LESSONS];
      this.save();
    }
  }

  save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.lessons));
  }

  getAll() {
    return this.lessons;
  }

  getById(id) {
    return this.lessons.find((l) => l.id === id) || null;
  }

  getSection(lessonId, sectionIndex) {
    const lesson = this.getById(lessonId);
    if (!lesson) return null;
    const secIdx = Number(sectionIndex);
    return lesson.sections.find((s) => s.sectionIndex === secIdx) || lesson.sections[secIdx - 1] || null;
  }

  saveLesson(lessonData) {
    if (!lessonData.id) {
      lessonData.id = "lesson_" + Date.now().toString(36);
    }
    const idx = this.lessons.findIndex((l) => l.id === lessonData.id);
    if (idx >= 0) {
      this.lessons[idx] = lessonData;
    } else {
      this.lessons.unshift(lessonData);
    }
    this.save();
    return lessonData;
  }

  deleteLesson(id) {
    this.lessons = this.lessons.filter((l) => l.id !== id);
    this.save();
  }

  resetToDefault() {
    this.lessons = [...window.DEFAULT_SLIDE_LESSONS];
    this.save();
  }

  exportToJson(id) {
    const lesson = id ? this.getById(id) : this.lessons;
    if (!lesson) return;
    const blob = new Blob([JSON.stringify(lesson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = id ? `SlideLesson_${lesson.title.replace(/[^a-zA-Z0-9]/g, "_")}.json` : "All_Slide_Lessons.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  importFromJson(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data)) {
        this.lessons = [...data, ...this.lessons];
      } else if (data.sections && Array.isArray(data.sections)) {
        this.lessons.unshift(data);
      } else {
        throw new Error("Định dạng dữ liệu không hợp lệ");
      }
      this.save();
      return true;
    } catch (e) {
      console.error("Lỗi nhập bài giảng:", e);
      return false;
    }
  }

  // Tạo URL nhúng chuẩn cho từng đề mục
  buildEmbedUrl(lessonId, sectionIndex) {
    const origin = window.location.origin;
    const path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/"));
    return `${origin}${path}/slide.html?lesson=${encodeURIComponent(lessonId)}&sec=${sectionIndex}`;
  }

  // Tạo URL người chơi tương tác trên điện thoại
  buildPlayerUrl(lessonId, sectionIndex, pin) {
    const origin = window.location.origin;
    const path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/"));
    return `${origin}${path}/slide-player.html?lesson=${encodeURIComponent(lessonId)}&sec=${sectionIndex}&pin=${pin || ""}`;
  }
}

window.slideDataManager = new SlideDataManager();
