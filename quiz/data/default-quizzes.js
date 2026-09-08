/**
 * Bộ Câu Hỏi Mẫu Tích Hợp Sẵn (Default Quizzes)
 */

window.DEFAULT_QUIZZES = [
  {
    id: "ai_tech_2026",
    title: "🤖 Công Nghệ, Chuyển Đổi Số & Trí Tuệ Nhân Tạo (AI)",
    description: "Khám phá thế giới AI, công nghệ số và xu hướng công nghệ tương lai.",
    category: "Công nghệ & AI",
    icon: "cpu",
    questions: [
      {
        question: "Công ty nào là cha đẻ phát triển mô hình trí tuệ nhân tạo Gemini?",
        choices: ["Microsoft", "Google DeepMind", "OpenAI", "Meta AI"],
        correct: 1,
        time: 15,
        explanation: "Gemini là dòng mô hình AI đa phương thức tiên tiến do Google và Google DeepMind nghiên cứu phát triển."
      },
      {
        question: "Thuật ngữ 'LLM' trong lĩnh vực trí tuệ nhân tạo viết tắt của cụm từ nào?",
        choices: [
          "Large Language Model",
          "Low Level Machine",
          "Linear Logic Matrix",
          "Local Learning Method"
        ],
        correct: 0,
        time: 15,
        explanation: "LLM (Large Language Model) nghĩa là Mô hình Ngôn ngữ Lớn, nền tảng của các AI tạo sinh như ChatGPT, Gemini."
      },
      {
        question: "Trang web hoặc dịch vụ nào sau đây KHÔNG cần máy chủ để lưu trữ nếu dùng WebRTC P2P?",
        choices: [
          "Truyền dữ liệu Peer-to-Peer trực tiếp giữa trình duyệt",
          "Cơ sở dữ liệu đám mây SQL truyền thống",
          "Email Server IMAP/SMTP",
          "Hệ thống FTP Server công ty"
        ],
        correct: 0,
        time: 20,
        explanation: "WebRTC DataChannel cho phép các trình duyệt gửi nhận dữ liệu trực tiếp với nhau (Peer-to-Peer) với độ trễ cực thấp."
      },
      {
        question: "Khái niệm 'Prompt Engineering' trong thời đại AI hiểu đơn giản là gì?",
        choices: [
          "Kỹ thuật sửa phần cứng vi xử lý AI",
          "Nghệ thuật & kỹ năng đặt câu hỏi, ra lệnh hiệu quả cho AI",
          "Viết code bằng ngôn ngữ máy nhị phân",
          "Thiết kế cáp quang kết nối Internet"
        ],
        correct: 1,
        time: 15,
        explanation: "Prompt Engineering là kỹ thuật xây dựng câu lệnh đầu vào để mô hình AI đưa ra kết quả chính xác và tối ưu nhất."
      },
      {
        question: "Đơn vị nhỏ nhất dùng để đo lường dung lượng bộ nhớ máy tính là gì?",
        choices: ["Byte", "Bit", "Kilobyte", "Pixel"],
        correct: 1,
        time: 12,
        explanation: "Bit (viết tắt của Binary Digit, có giá trị 0 hoặc 1) là đơn vị thông tin nhỏ nhất trong khoa học máy tính."
      }
    ]
  },
  {
    id: "do_vui_iq",
    title: "🧠 Đố Vui Nhanh Trí & Thử Thách IQ Hài Hước",
    description: "Bộ câu hỏi đố mẹo, phản xạ nhanh và kích thích tư duy vui nhộn.",
    category: "Đố vui & IQ",
    icon: "sparkles",
    questions: [
      {
        question: "Cái gì người mua biết, người bán biết, người dùng lại KHÔNG BAO GIỜ biết?",
        choices: ["Bình oxy lặn biển", "Chiếc quan tài", "Món quà sinh nhật", "Thuốc ngủ"],
        correct: 1,
        time: 15,
        explanation: "Chiếc quan tài: Người chết (người dùng) sẽ không bao giờ biết mình đang nằm trong đó!"
      },
      {
        question: "Một con gà trống đứng trên đỉnh mái nhà dốc sang 2 bên. Khi đẻ trứng, trứng sẽ lăn về bên nào?",
        choices: ["Lăn sang bên trái", "Lăn sang bên phải", "Đứng yên trên nóc", "Gà trống không đẻ trứng"],
        correct: 3,
        time: 10,
        explanation: "Gà trống làm sao mà đẻ trứng được! Đố mẹo thôi nha."
      },
      {
        question: "Cái gì tay trái cầm được mà tay phải KHÔNG THỂ cầm được?",
        choices: ["Bàn tay phải của bạn", "Cái bút chì", "Điện thoại thông minh", "Cái đũa ăn cơm"],
        correct: 0,
        time: 15,
        explanation: "Bàn tay phải không thể tự cầm hoặc nắm trọn chính bàn tay phải được!"
      },
      {
        question: "Tháng nào trong năm có 28 ngày?",
        choices: ["Chỉ có tháng 2", "Tháng 2 năm nhuận", "Tất cả 12 tháng", "Không có tháng nào"],
        correct: 2,
        time: 12,
        explanation: "Tất cả 12 tháng trong năm đều có ít nhất 28 ngày!"
      },
      {
        question: "Nếu bạn vượt qua người chạy ở vị trí thứ hai trong cuộc đua, bạn đang ở vị trí thứ mấy?",
        choices: ["Vị trí thứ nhất", "Vị trí thứ hai", "Vị trí thứ ba", "Về đích đầu tiên"],
        correct: 1,
        time: 15,
        explanation: "Khi vượt qua người thứ hai, bạn sẽ thế vào vị trí thứ hai của người đó!"
      }
    ]
  },
  {
    id: "vietnam_kham_pha",
    title: "🇻🇳 Khám Phá Địa Lý, Lịch Sử & Danh Thắng Việt Nam",
    description: "Kiểm tra kiến thức về non sông gấm vóc và văn hóa Việt Nam.",
    category: "Địa lý & Lịch sử",
    icon: "map-pin",
    questions: [
      {
        question: "Đỉnh núi nào được mệnh danh là 'Nóc nhà Đông Dương' với độ cao 3.143m?",
        choices: ["Bạch Mộc Lương Tử", "Fansipan (Phan Xi Păng)", "Pu Si Lung", "Langbiang"],
        correct: 1,
        time: 15,
        explanation: "Đỉnh Fansipan cao 3.143m thuộc dãy Hoàng Liên Sơn, là đỉnh núi cao nhất 3 nước Đông Dương."
      },
      {
        question: "Tỉnh nào ở Việt Nam có đường bờ biển dài nhất nước ta?",
        choices: ["Khánh Hòa", "Bình Thuận", "Quảng Ninh", "Cà Mau"],
        correct: 0,
        time: 15,
        explanation: "Tỉnh Khánh Hòa có đường bờ biển dài nhất Việt Nam (khoảng 385 km tính cả các bán đảo, vịnh biển)."
      },
      {
        question: "Cây cầu dây văng dài nhất Đông Nam Á khánh thành tại Việt Nam năm 2010 là cầu nào?",
        choices: ["Cầu Nhật Tân", "Cầu Cần Thơ", "Cầu Rồng", "Cầu Bãi Cháy"],
        correct: 1,
        time: 15,
        explanation: "Cầu Cần Thơ bắc qua sông Hậu là cầu dây văng có nhịp chính dài nhất Đông Nam Á tại thời điểm khánh thành."
      },
      {
        question: "Vịnh Hạ Long được UNESCO công nhận là Di sản Thiên nhiên Thế giới thuộc tỉnh nào?",
        choices: ["Hải Phòng", "Quảng Ninh", "Ninh Bình", "Thanh Hóa"],
        correct: 1,
        time: 12,
        explanation: "Vịnh Hạ Long là thắng cảnh thiên nhiên kỳ vĩ nổi tiếng thế giới thuộc tỉnh Quảng Ninh."
      }
    ]
  }
];
