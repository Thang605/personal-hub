/**
 * Quiz Data Manager
 * Quản lý danh sách các bộ câu hỏi, lưu trữ LocalStorage, xuất/nhập tệp JSON.
 */

class QuizDataManager {
  constructor() {
    this.STORAGE_KEY = "phub_quiz_collections_v1";
    this.quizzes = [];
    this.init();
  }

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this.quizzes = JSON.parse(saved);
      } catch (e) {
        console.error("Lỗi đọc câu hỏi từ LocalStorage:", e);
        this.quizzes = JSON.parse(JSON.stringify(window.DEFAULT_QUIZZES || []));
      }
    } else {
      this.quizzes = JSON.parse(JSON.stringify(window.DEFAULT_QUIZZES || []));
      this.save();
    }
  }

  save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.quizzes));
  }

  getAll() {
    return this.quizzes;
  }

  getById(id) {
    return this.quizzes.find((q) => q.id === id) || null;
  }

  saveQuiz(quizData) {
    if (!quizData.id) {
      quizData.id = "quiz_" + Date.now().toString(36);
    }
    const idx = this.quizzes.findIndex((q) => q.id === quizData.id);
    if (idx >= 0) {
      this.quizzes[idx] = quizData;
    } else {
      this.quizzes.unshift(quizData);
    }
    this.save();
    return quizData;
  }

  deleteQuiz(id) {
    this.quizzes = this.quizzes.filter((q) => q.id !== id);
    this.save();
  }

  resetToDefault() {
    this.quizzes = JSON.parse(JSON.stringify(window.DEFAULT_QUIZZES || []));
    this.save();
  }

  exportToJson(id) {
    const quiz = id ? this.getById(id) : this.quizzes;
    if (!quiz) return;
    const blob = new Blob([JSON.stringify(quiz, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = id ? `Quiz_${quiz.title.replace(/[^a-zA-Z0-9]/g, "_")}.json` : "All_Quizzes_Backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  importFromJson(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data)) {
        this.quizzes = [...data, ...this.quizzes];
      } else if (data.questions && Array.isArray(data.questions)) {
        this.quizzes.unshift(data);
      } else {
        throw new Error("Định dạng file không hợp lệ");
      }
      this.save();
      return true;
    } catch (e) {
      console.error("Lỗi nhập file JSON:", e);
      return false;
    }
  }
}

window.quizDataManager = new QuizDataManager();
