// Danh mục chuẩn hóa dành riêng cho cây ngắn ngày (rau ăn lá, rau củ, quả ngắn ngày)
// NGUYÊN TẮC: MỖI HOẠT ĐỘNG LÀ MỘT THAO TÁC DUY NHẤT, KHÔNG GỘP CHUNG NHIỀU THAO TÁC

// 1. GIAI ĐOẠN SINH TRƯỞNG
export const SHORT_TERM_STAGES = [
  'Làm đất',
  'Gieo hạt',
  'Trồng cây con',
  'Cây đang lớn',
  'Cây phát triển lá',
  'Cây ra hoa',
  'Cây nuôi quả',
  'Cây nuôi củ',
  'Thu hoạch'
];

// 2. HOẠT ĐỘNG CANH TÁC RIÊNG BIỆT (ATOMIC)
export const SHORT_TERM_ACTIVITIES = [
  'Cày đất',
  'Xới đất',
  'Bừa đất',
  'Phơi đất phơi ải',
  'Rải vôi bột',
  'Cuốc luống lên luống',
  'Phủ bạt màng phủ nông nghiệp',
  'Ngâm hạt giống',
  'Ủ hạt giống',
  'Gieo hạt',
  'Nhổ cây con đi trồng',
  'Tưới nước',
  'Nhổ cỏ dại',
  'Xới cỏ',
  'Vun gốc',
  'Tỉa bớt cây còi',
  'Trồng dặm trồng bù cây chết',
  'Cắm giàn làm giàn',
  'Buộc ngọn cột dây leo',
  'Ngắt ngọn bấm ngọn',
  'Tỉa lá già',
  'Tỉa cành thừa',
  'Thụ phấn cho hoa',
  'Thu hoạch nông sản'
];

// Tự động liên kết Hoạt động mặc định khi chọn Giai đoạn sinh trưởng
export const STAGE_TO_DEFAULT_ACTIVITY: Record<string, string> = {
  'Làm đất': 'Cày đất',
  'Gieo hạt': 'Gieo hạt',
  'Trồng cây con': 'Nhổ cây con đi trồng',
  'Cây đang lớn': 'Tưới nước',
  'Cây phát triển lá': 'Tỉa lá già',
  'Cây ra hoa': 'Thụ phấn cho hoa',
  'Cây nuôi quả': 'Tưới nước',
  'Cây nuôi củ': 'Vun gốc',
  'Thu hoạch': 'Thu hoạch nông sản'
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

// Liều lượng thuốc BVTV (ngắn gọn, thông dụng - không có dấu /)
export const PESTICIDE_DOSAGE_OPTIONS = [
  '10 ml',
  '15 ml',
  '20 ml',
  '25 ml',
  '1 gói',
  '100 ml',
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

// Liều lượng phân bón (ngắn gọn, súc tích - không có dấu /)
export const FERTILIZER_DOSAGE_OPTIONS = [
  '2 kg',
  '3 kg',
  '5 kg',
  '10 kg',
  '20 kg',
  '50g',
  '100g',
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
  'Chủ hộ'
];

// Điều kiện thời tiết (ngắn gọn)
export const WEATHER_OPTIONS = [
  '30°C',
  'Nắng đẹp',
  'Nắng gắt',
  'Râm mát',
  'Âm u',
  'Mưa nhỏ',
  'Mưa to'
];
