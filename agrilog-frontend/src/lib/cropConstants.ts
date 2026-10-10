// Danh mục chuẩn hóa dành riêng cho cây ngắn ngày (rau ăn lá, rau củ, quả ngắn ngày)
// NGUYÊN TẮC: MỖI HOẠT ĐỘNG LÀ MỘT THAO TÁC DUY NHẤT, KHÔNG GỘP CHUNG NHIỀU THAO TÁC

// 1. GIAI ĐOẠN SINH TRƯỞNG
export const SHORT_TERM_STAGES = [
  'Làm đất',
  'Gieo hạt',
  'Ươm cây con',
  'Cấy cây con',
  'Bén rễ hồi xanh',
  'Phát triển thân lá',
  'Phân hóa mầm hoa',
  'Ra hoa',
  'Đậu quả',
  'Hình thành củ',
  'Nuôi quả',
  'Nuôi củ',
  'Đóng bắp',
  'Thu hoạch',
  'Sau thu hoạch'
];

// 2. TỪNG HOẠT ĐỘNG CANH TÁC RIÊNG BIỆT (ATOMIC)
export const SHORT_TERM_ACTIVITIES = [
  // Làm đất
  'Cày xới đất',
  'Bừa san phẳng đất',
  'Phơi ải đất',
  'Rải vôi bột khử trùng đất',
  'Bón lót phân chuồng hoai mục',
  'Bón lót phân hữu cơ vi sinh',
  'Lên luống trồng',
  'San phẳng mặt luống',
  'Phủ màng nông nghiệp',
  'Đục lỗ màng phủ',

  // Gieo hạt & Ươm cây con
  'Ngâm hạt giống nước ấm',
  'Ủ hạt giống nứt nanh',
  'Chuẩn bị khay ươm giá thể',
  'Gieo hạt vào khay ươm',
  'Gieo hạt trực tiếp vào luống',
  'Tưới phun sương giữ ẩm hạt',
  'Che phủ rơm rạ giữ ẩm',
  'Che lưới đen cản nắng',

  // Cấy cây con & Bén rễ hồi xanh
  'Nhổ cây con từ khay ươm',
  'Cấy cây con ra luống sản xuất',
  'Trồng dặm cây con bị chết',
  'Tưới đẫm nước định gốc',
  'Tưới kích rễ sinh học',

  // Chăm sóc & Phát triển thân lá
  'Tưới nước giữ ẩm hằng ngày',
  'Tưới nước nhỏ giọt',
  'Tưới nước phun mưa',
  'Làm cỏ gốc',
  'Xới xáo phá váng đất',
  'Tỉa bớt cây yếu còi cọc',
  'Định khoảng cách mật độ luống',
  'Vun cao gốc cây',
  'Bón thúc đợt 1',
  'Bón thúc đợt 2',
  'Bón thúc đợt 3',
  'Phun phân bón qua lá',
  'Phun vi lượng bổ sung',
  'Cắm cọc làm giàn leo',
  'Buộc dây cố định thân leo',
  'Bấm ngọn kích thích phân nhánh',
  'Vặt tỉa chồi nách phụ',
  'Tỉa bỏ lá già úa dưới gốc',

  // Ra hoa, đậu quả, nuôi quả/củ/bắp
  'Bón thúc đón hoa',
  'Thụ phấn bổ sung nhân tạo',
  'Tỉa bớt nụ hoa dị hình',
  'Bón thúc nuôi quả',
  'Bón thúc phì to củ',
  'Bón thúc cuốn chắc bắp',
  'Tỉa bỏ quả còi cọc đèo đẹt',
  'Bọc túi bảo vệ quả',
  'Khơi rãnh luống thoát nước',

  // Phòng trừ sâu bệnh
  'Bắt sâu non thủ công',
  'Treo bẫy dính màu vàng',
  'Phun chế phẩm nấm Trichoderma',
  'Phun thuốc trừ sâu sinh học',
  'Phun thuốc trừ nấm bệnh lá',
  'Nhổ bỏ tiêu hủy cây bị bệnh',

  // Thu hoạch
  'Ngừng phân thuốc cách ly an toàn',
  'Thu hoạch tỉa cây lớn trước',
  'Thu hoạch rộ cả luống',
  'Cắt tỉa cuống quả',
  'Nhổ củ',
  'Cắt bắp cải',
  'Phân loại kích cỡ nông sản',
  'Sơ chế rửa sạch nông sản',
  'Đóng gói bao bì / Thùng sóng',

  // Sau thu hoạch
  'Dọn dẹp thu gom tàn dư cây sau vụ',
  'Thu hồi màng phủ nông nghiệp',
  'Thu dọn giàn cọc cắm',
  'Rải vôi khử trùng luống sau thu hoạch',
  'Cày lật đất chuẩn bị vụ mới'
];

// Tự động liên kết Hoạt động mặc định khi chọn Giai đoạn sinh trưởng
export const STAGE_TO_DEFAULT_ACTIVITY: Record<string, string> = {
  'Làm đất': 'Cày xới đất',
  'Gieo hạt': 'Gieo hạt trực tiếp vào luống',
  'Ươm cây con': 'Gieo hạt vào khay ươm',
  'Cấy cây con': 'Cấy cây con ra luống sản xuất',
  'Bén rễ hồi xanh': 'Tưới kích rễ sinh học',
  'Phát triển thân lá': 'Bón thúc đợt 2',
  'Phân hóa mầm hoa': 'Phun vi lượng bổ sung',
  'Ra hoa': 'Bón thúc đón hoa',
  'Đậu quả': 'Thụ phấn bổ sung nhân tạo',
  'Hình thành củ': 'Vun cao gốc cây',
  'Nuôi quả': 'Bón thúc nuôi quả',
  'Nuôi củ': 'Bón thúc phì to củ',
  'Đóng bắp': 'Bón thúc cuốn chắc bắp',
  'Thu hoạch': 'Thu hoạch tỉa cây lớn trước',
  'Sau thu hoạch': 'Dọn dẹp thu gom tàn dư cây sau vụ'
};

// Sâu bệnh hại cây ngắn ngày (ngắn gọn, phổ biến nhất)
export const SHORT_TERM_TARGET_PESTS = [
  'Sâu tơ',
  'Sâu xanh',
  'Bọ nhảy',
  'Bọ trĩ',
  'Rệp muội',
  'Dòi đục lá',
  'Bệnh thối nhũn',
  'Bệnh sương mai',
  'Bệnh lở cổ rễ',
  'Bệnh thán thư'
];

// Liều lượng thuốc BVTV (ngắn gọn, thông dụng)
export const PESTICIDE_DOSAGE_OPTIONS = [
  '10 ml / bình 16L',
  '15 ml / bình 16L',
  '20 ml / bình 16L',
  '25 ml / bình 25L',
  '1 gói / bình 16L',
  '100 ml / phuy 200L',
  'Phun ướt lá',
  'Tưới đẫm gốc'
];

// Thời gian cách ly PHI (ngắn gọn)
export const PHI_OPTIONS = [
  '3 ngày',
  '5 ngày',
  '7 ngày',
  '10 ngày',
  '14 ngày'
];

// Liều lượng phân bón (ngắn gọn, súc tích)
export const FERTILIZER_DOSAGE_OPTIONS = [
  '2 kg / sào',
  '3 kg / sào',
  '5 kg / sào',
  '10 kg / sào',
  '10 kg / 1000m²',
  '20 kg / 1000m²',
  '50g / gốc',
  '100g / gốc',
  'Tưới loãng'
];

// Mục đích bón phân (ngắn gọn)
export const FERTILIZER_NOTES_OPTIONS = [
  'Bón lót',
  'Bón thúc đợt 1',
  'Bón thúc đợt 2',
  'Bón thúc đợt 3',
  'Bón thúc nuôi quả',
  'Phun qua lá',
  'Tưới kích rễ'
];

// Người thực hiện (ngắn gọn)
export const PERFORMER_OPTIONS = [
  'Chủ hộ',
  'Kỹ thuật viên',
  'Công nhân',
  'Tổ BVTV'
];

// Điều kiện thời tiết (ngắn gọn)
export const WEATHER_OPTIONS = [
  'Nắng đẹp',
  'Nắng gắt',
  'Râm mát',
  'Âm u',
  'Mưa nhỏ',
  'Mưa to'
];
