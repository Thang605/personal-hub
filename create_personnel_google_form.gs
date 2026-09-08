/**
 * ===================================================================
 * GOOGLE APPS SCRIPT: CẬP NHẬT GOOGLE FORM VỚI 3 LƯỚI + Ô BỔ SUNG KHÁC
 * ===================================================================
 */

function updateFormWith3GridsAndOtherOptions() {
  const form = FormApp.openById('1ZW2ahSDxa9Y1SyhHXZoNaWyAUCPzqe28R4a3iDqPd7c');
  
  // 1. Xóa toàn bộ item cũ
  const items = form.getItems();
  for (let i = items.length - 1; i >= 0; i--) {
    form.deleteItem(i);
  }
  
  // 2. Cấu hình chung của Form
  form.setTitle('PHIẾU THU THẬP & CẬP NHẬT HỒ SƠ NĂNG LỰC CÁ NHÂN');
  form.setDescription('Biểu mẫu thu thập, cập nhật thông tin cá nhân, trình độ đào tạo, chứng chỉ hành nghề và tự đánh giá năng lực theo 3 nhóm (Kỹ năng chuyên môn, Ứng dụng AI, Phần mềm chuyên ngành).\n\n* Vui lòng điền đầy đủ và chính xác các mục bên dưới.');
  form.setAllowResponseEdits(true);
  form.setCollectEmail(true);

  // ==========================================
  // MỤC A: THÔNG TIN CÁ NHÂN & QUÁ TRÌNH CÔNG TÁC
  // ==========================================
  const hA = form.addSectionHeaderItem();
  hA.setTitle('👤 MỤC A: THÔNG TIN CÁ NHÂN & QUÁ TRÌNH CÔNG TÁC')
    .setHelpText('Kê khai thông tin cá nhân, định danh, văn bằng và chứng chỉ');

  form.addTextItem().setTitle('Họ và tên').setHelpText('Ví dụ: ĐỖ VĂN PHONG (Viết hoa đầy đủ)').setRequired(true);
  form.addTextItem().setTitle('Mã số hồ sơ').setHelpText('Ví dụ: T27-01').setRequired(true);
  form.addDateItem().setTitle('Ngày sinh').setHelpText('Định dạng: Ngày/Tháng/Năm (Ví dụ: 10/05/1978)').setRequired(true);
  form.addTextItem().setTitle('Địa chỉ Email cá nhân / công việc').setHelpText('Ví dụ: Phongt27nt@gmail.com').setRequired(true);
  form.addTextItem().setTitle('Số điện thoại liên hệ & Zalo').setHelpText('Ví dụ: 0913431515; Zalo: 0913431515; 0988112277').setRequired(true);
  form.addParagraphTextItem().setTitle('Chỗ ở hiện tại / Địa chỉ liên hệ').setHelpText('Ví dụ: 38A Lý Tự Trọng , phường Nha Trang , tỉnh Khánh Hòa').setRequired(true);
  form.addTextItem().setTitle('Số Căn cước công dân (CCCD / CMND)').setHelpText('Nhập đúng 12 chữ số CCCD (Ví dụ: 052078000567)').setRequired(true);
  form.addParagraphTextItem().setTitle('Trình độ được đào tạo').setHelpText('Ghi rõ văn bằng, chuyên ngành, số hiệu bằng, ngày cấp.\nVí dụ: Kỹ Sư Giao thông cấp bằng số B139107 , ngày 16/10/2000 ; Kỹ Sư đường sắt tốc độ cao, thạc sỹ kỹ thuật cấp bằng số DND.7.7.0013061, ngày 12/11/2018').setRequired(true);
  form.addParagraphTextItem().setTitle('Chứng chỉ hành nghề').setHelpText('Ghi rõ lĩnh vực, hạng cấp, số chứng chỉ, ngày hết hạn.\nVí dụ: Thiết kế công trình cầu , hầm, đường bộ : Cấp I; Tư vấn giám sát công trình giao thông : Cấp I; Kỹ Sư định giá: cấp I ; Số : BXD-00020412, ngày hết hạn của chứng chỉ : 05/05/2028').setRequired(false);
  form.addTextItem().setTitle('Chức vụ hiện tại').setHelpText('Ví dụ: Chủ tịch HĐQT/ Tổng giám đốc').setRequired(true);
  form.addTextItem().setTitle('Số năm công tác tại công ty').setHelpText('Ví dụ: 19 năm 10 tháng').setRequired(true);
  form.addParagraphTextItem().setTitle('Bằng khen / Khen thưởng & Thành tích').setHelpText('Ví dụ: Liên hiệp hội năm 2020, Hội KHKT Cầu đường Việt Nam năm 2020; UBND tỉnh khen năm 2021,..').setRequired(false);

  // Mức độ chuẩn dùng chung cho cả 3 lưới
  const levelColumns = [
    '1. Chưa biết (Cần đào tạo)',
    '2. Biết cơ bản',
    '3. Thành thạo',
    '4. Chuyên sâu / Làm chủ'
  ];

  // ==========================================
  // LƯỚI 1: CÁC KỸ NĂNG CHUYÊN MÔN & QUẢN LÝ DỰ ÁN
  // ==========================================
  const h1 = form.addSectionHeaderItem();
  h1.setTitle('📋 LƯỚI 1: ĐÁNH GIÁ MỨC ĐỘ KỸ NĂNG CHUYÊN MÔN & QUẢN LÝ')
    .setHelpText('Chọn mức độ thành thạo cho từng kỹ năng quản lý & chủ nhiệm');

  const grid1 = form.addGridItem();
  grid1.setTitle('1. Kỹ năng chuyên môn & Quản lý dự án')
       .setRows([
         'Chủ nhiệm Dự án (Giao thông: ĐƯỜNG, CẦU, HẦM)',
         'Quản lý điều hành dự án & Hồ sơ pháp lý xây dựng',
         'Khảo sát, thiết kế kỹ thuật & Lập dự toán công trình',
         'Tư vấn giám sát công trình giao thông',
         'Thẩm định thiết kế & Định giá công trình',
         'Kỹ năng lập hồ sơ dự thầu & Quản lý hợp đồng xây dựng'
       ])
       .setColumns(levelColumns)
       .setRequired(false);

  form.addParagraphTextItem()
      .setTitle('1.1. Kỹ năng chuyên môn & Quản lý dự án KHÁC (nếu có)')
      .setHelpText('Ghi rõ tên kỹ năng và mức độ sử dụng.\nVí dụ: Lập tiến độ Microsoft Project - Thành thạo; Quản lý chi phí Primavera - Cơ bản...')
      .setRequired(false);

  // ==========================================
  // LƯỚI 2: PHẦN MỀM & CÔNG NGHỆ AI
  // ==========================================
  const h2 = form.addSectionHeaderItem();
  h2.setTitle('🤖 LƯỚI 2: ĐÁNH GIÁ MỨC ĐỘ SỬ DỤNG PHẦN MỀM AI & TIN HỌC')
    .setHelpText('Chọn mức độ thành thạo cho các công cụ AI & ứng dụng văn phòng');

  const grid2 = form.addGridItem();
  grid2.setTitle('2. Phần mềm AI & Công nghệ hỗ trợ')
       .setRows([
         'Sử dụng AI viết báo cáo & Thuyết minh (ChatGPT, Gemini)',
         'Sử dụng Claude AI & Prompt Engineering nâng cao',
         'Lập trình tự động hóa Python & Phân tích dữ liệu',
         'Tin học văn phòng nâng cao (Word, Excel, PowerPoint)',
         'Thiết kế đồ họa & Trực quan hóa báo cáo (Canva, Photoshop)'
       ])
       .setColumns(levelColumns)
       .setRequired(false);

  form.addParagraphTextItem()
      .setTitle('2.1. Công cụ AI & Phần mềm công nghệ KHÁC (nếu có)')
      .setHelpText('Ghi rõ tên công cụ AI và mức độ sử dụng.\nVí dụ: Cursor AI - Thành thạo; Midjourney - Cơ bản; v0.dev - Cơ bản...')
      .setRequired(false);

  // ==========================================
  // LƯỚI 3: PHẦN MỀM & ỨNG DỤNG CHUYÊN NGÀNH
  // ==========================================
  const h3 = form.addSectionHeaderItem();
  h3.setTitle('📐 LƯỚI 3: ĐÁNH GIÁ MỨC ĐỘ PHẦN MỀM & ỨNG DỤNG CHUYÊN NGÀNH')
    .setHelpText('Chọn mức độ thành thạo cho các phần mềm kỹ thuật chuyên sâu');

  const grid3 = form.addGridItem();
  grid3.setTitle('3. Phần mềm kỹ thuật & Thiết kế chuyên ngành')
       .setRows([
         'AutoCAD 2D / 3D',
         'Autodesk Revit (Kiến trúc, Kết cấu, Hạ tầng)',
         'Midas Civil / Midas GTS NX (Tính toán kết cấu cầu & Địa kỹ thuật)',
         'Civil 3D (Thiết kế bình đồ, trắc dọc, trắc ngang)',
         'SAP2000 / ETABS (Mô hình hóa kết cấu)',
         'Mô hình thông tin công trình BIM (BIM Coordinator / Quản trị)'
       ])
       .setColumns(levelColumns)
       .setRequired(false);

  form.addParagraphTextItem()
      .setTitle('3.1. Phần mềm kỹ thuật chuyên ngành KHÁC (nếu có)')
      .setHelpText('Ghi rõ tên phần mềm và mức độ sử dụng.\nVí dụ: Plaxis 3D - Thành thạo; GEO5 - Biết cơ bản; GeoSlope - Thành thạo; NOVA-TDN - Thành thạo...')
      .setRequired(false);

  // ==========================================
  // MỤC E: KIẾN NGHỊ & ĐỀ XUẤT
  // ==========================================
  const hE = form.addSectionHeaderItem();
  hE.setTitle('📝 MỤC E: KIẾN NGHỊ & ĐỀ XUẤT')
    .setHelpText('Ý kiến đóng góp ý kiến về môi trường làm việc, trao đổi học thuật, quy trình công việc');

  form.addParagraphTextItem()
      .setTitle('E. Kiến nghị khác')
      .setHelpText('Ví dụ:\n(1) Cần trao đổi học tập 1 tuần /1 lần các kiến thức mới.\n(2) Hồ sơ cá nhân thiết kế phải in giấy và trình chủ nhiệm xem trước khi xuất.')
      .setRequired(false);

  // ==========================================
  // XẾP HẠNG TỔNG THỂ (Cột F)
  // ==========================================
  form.addScaleItem()
      .setTitle('Xếp hạng đánh giá năng lực hiện tại (Tương ứng cột F)')
      .setBounds(1, 10)
      .setLabels('1★ (Cần cải thiện)', '10★ (Xuất sắc)')
      .setRequired(false);

  form.setConfirmationMessage('Cảm ơn bạn đã gửi thông tin cập nhật hồ sơ năng lực cá nhân. Dữ liệu đã được ghi nhận vào hệ thống!');

  Logger.log('FORM_WITH_OTHER_OPTIONS_UPDATED: ' + form.getPublishedUrl());
}
