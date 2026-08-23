# 🛡️ Personal Hub - Trung Tâm Lưu Trữ & Quản Lý Thông Tin Cá Nhân

**Personal Hub** là ứng dụng web cá nhân hiện đại, bảo mật cao và tiện lợi được thiết kế để hoạt động **100% cục bộ (Offline-First)** trên máy tính của bạn. Mọi dữ liệu ghi chú, tài khoản, giấy tờ tùy thân, liên kết và sổ thu chi đều được lưu trữ trực tiếp trên trình duyệt máy bạn mà không gửi lên bất kỳ máy chủ bên thứ ba nào.

---

## ✨ Các Tính Năng Nổi Bật

### 1. 📝 Ghi Chú & Kiến Thức (Second Brain)
- Soạn thảo văn bản chuẩn **Markdown** với trình xem trước trực tiếp (Live Preview / Split view).
- Phân loại theo thư mục (*Công việc, Học tập, Ý tưởng, Nhật ký...*) và gắn thẻ Tag.
- Ghim ghi chú quan trọng lên đầu, tìm kiếm toàn văn và xuất file `.md` về máy.

### 2. 🔒 Két An Toàn Mã Hóa Chuẩn Quân Sự (AES-GCM 256-bit)
- Lưu trữ tài khoản, mật khẩu web/app, số thẻ ngân hàng, khóa API bí mật.
- Mã hóa dữ liệu bằng **Web Crypto API (PBKDF2 100.000 vòng lặp + AES-GCM 256-bit)** với Mật khẩu Master cá nhân.
- Tự động khóa két sau thời gian không hoạt động, bộ sinh mật khẩu ngẫu nhiên siêu mạnh và sao chép 1-chạm vào Clipboard.

### 3. 🪪 Hồ Sơ & Giấy Tờ Cá Nhân (Personal Records)
- Lưu trữ số Căn cước công dân (CCCD), Hộ chiếu (Passport), Bảo hiểm Y tế (BHYT/BHXH), Tài khoản ngân hàng, Hợp đồng, Thông tin liên hệ khẩn cấp.
- Giao diện thẻ trực quan mô phỏng giấy tờ thật, hỗ trợ sao chép số nhanh khi điền biểu mẫu trực tuyến.

### 4. 🔗 Bộ Sưu Tập Liên Kết (Bookmarks Manager)
- Quản lý và phân loại các đường dẫn web, tài liệu tham khảo, công cụ AI yêu thích.
- Tự động lấy Favicon biểu tượng trang web, ghim liên kết nổi bật, lọc theo chuyên mục.

### 5. 💳 Quản Lý Tài Chính & Sổ Thu Chi (Personal Finance)
- Theo dõi dòng tiền thu chi hàng tháng, số dư ròng và tỷ lệ tiết kiệm.
- Biểu đồ phân bổ chi tiêu trực quan theo từng danh mục (Ăn uống, Nhà ở, Mua sắm, Di chuyển...).
- Xuất báo cáo lịch sử giao dịch ra file `.csv` tương thích Excel.

### 6. 📋 Kế Hoạch & Việc Cần Làm (To-Do & Tasks Planner)
- Lập danh sách công việc, phân chia mức độ ưu tiên (*Khẩn cấp, Ưu tiên cao, Bình thường, Thấp*).
- Theo dõi hạn chót (Deadline) với cảnh báo việc quá hạn, đánh dấu hoàn thành nhanh.

### 7. 💾 Sao Lưu & Khôi Phục Toàn Diện (Backup & Restore)
- Xuất toàn bộ cơ sở dữ liệu ra tệp sao lưu `.json` bất cứ lúc nào.
- Dễ dàng chuyển dữ liệu giữa các máy tính khác nhau qua USB hoặc đồng bộ qua thư mục Dropbox.

---

## 🚀 Hướng Dẫn Sử Dụng

### Cách 1: Mở Trực Tiếp Trên Trình Duyệt (Đơn giản nhất)
1. Mở thư mục `c:\Dropbox\0.AI AGENT\9.Web`.
2. **Nhấp đúp chuột vào file `index.html`** để mở ứng dụng trong Google Chrome, Microsoft Edge, Brave hoặc Firefox.
3. Ứng dụng sẽ tự động chạy ngay lập tức mà không cần cài đặt thêm phần mềm nào!

### Cách 2: Phím Tắt Tiện Ích
- **`Ctrl + K`**: Mở thanh tìm kiếm toàn cục để tìm nhanh ghi chú, liên kết, công việc hoặc hồ sơ.
- **Biểu tượng Mặt trời / Mặt trăng**: Chuyển đổi nhanh giữa Chế độ Tối (Dark Mode) và Chế độ Sáng (Light Mode).
