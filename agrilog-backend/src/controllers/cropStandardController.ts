import { Request, Response } from 'express';
import { CropStandard } from '../models/CropStandard';
import { getSql } from '../config/db';

// Dữ liệu mẫu chuẩn hóa chuyên sâu cho cây ngắn ngày (rau củ, rau ăn lá, quả ngắn ngày)
// Từng hoạt động, giai đoạn, sâu bệnh được tách riêng biệt 100%, không gộp chung
const INITIAL_STANDARDS = [
  // --- 1. GIAI ĐOẠN SINH TRƯỞNG (STAGE) ---
  { cropGroup: 'SHORT_TERM', type: 'STAGE', name: 'Làm đất', order: 1 },
  { cropGroup: 'SHORT_TERM', type: 'STAGE', name: 'Gieo hạt', order: 2 },
  { cropGroup: 'SHORT_TERM', type: 'STAGE', name: 'Ươm cây con', order: 3 },
  { cropGroup: 'SHORT_TERM', type: 'STAGE', name: 'Cấy cây con', order: 4 },
  { cropGroup: 'SHORT_TERM', type: 'STAGE', name: 'Bén rễ hồi xanh', order: 5 },
  { cropGroup: 'SHORT_TERM', type: 'STAGE', name: 'Phát triển thân lá', order: 6 },
  { cropGroup: 'SHORT_TERM', type: 'STAGE', name: 'Phân hóa mầm hoa', order: 7 },
  { cropGroup: 'SHORT_TERM', type: 'STAGE', name: 'Ra hoa', order: 8 },
  { cropGroup: 'SHORT_TERM', type: 'STAGE', name: 'Đậu quả', order: 9 },
  { cropGroup: 'SHORT_TERM', type: 'STAGE', name: 'Hình thành củ', order: 10 },
  { cropGroup: 'SHORT_TERM', type: 'STAGE', name: 'Nuôi quả', order: 11 },
  { cropGroup: 'SHORT_TERM', type: 'STAGE', name: 'Nuôi củ', order: 12 },
  { cropGroup: 'SHORT_TERM', type: 'STAGE', name: 'Đóng bắp', order: 13 },
  { cropGroup: 'SHORT_TERM', type: 'STAGE', name: 'Thu hoạch', order: 14 },
  { cropGroup: 'SHORT_TERM', type: 'STAGE', name: 'Sau thu hoạch', order: 15 },

  // --- 2. HOẠT ĐỘNG CANH TÁC (ACTIVITY) - TÁCH RIÊNG TỪNG HOẠT ĐỘNG ---
  // Làm đất
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Làm đất', name: 'Cày xới đất', order: 101 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Làm đất', name: 'Bừa san phẳng đất', order: 102 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Làm đất', name: 'Phơi ải đất', order: 103 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Làm đất', name: 'Rải vôi bột khử trùng đất', order: 104 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Làm đất', name: 'Bón lót phân chuồng hoai mục', order: 105 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Làm đất', name: 'Bón lót phân hữu cơ vi sinh', order: 106 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Làm đất', name: 'Lên luống trồng', order: 107 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Làm đất', name: 'San phẳng mặt luống', order: 108 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Làm đất', name: 'Phủ màng nông nghiệp', order: 109 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Làm đất', name: 'Đục lỗ màng phủ', order: 110 },

  // Gieo hạt & Ươm cây con
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Gieo hạt', name: 'Ngâm hạt giống nước ấm', order: 201 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Gieo hạt', name: 'Ủ hạt giống nứt nanh', order: 202 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Ươm cây con', name: 'Chuẩn bị khay ươm giá thể', order: 203 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Ươm cây con', name: 'Gieo hạt vào khay ươm', order: 204 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Gieo hạt', name: 'Gieo hạt trực tiếp vào luống', order: 205 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Gieo hạt', name: 'Tưới phun sương giữ ẩm hạt', order: 206 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Gieo hạt', name: 'Che phủ rơm rạ giữ ẩm', order: 207 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Ươm cây con', name: 'Che lưới đen cản nắng', order: 208 },

  // Cấy cây con & Bén rễ hồi xanh
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cấy cây con', name: 'Nhổ cây con từ khay ươm', order: 301 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cấy cây con', name: 'Cấy cây con ra luống sản xuất', order: 302 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Bén rễ hồi xanh', name: 'Trồng dặm cây con bị chết', order: 303 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Bén rễ hồi xanh', name: 'Tưới đẫm nước định gốc', order: 304 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Bén rễ hồi xanh', name: 'Tưới kích rễ sinh học', order: 305 },

  // Chăm sóc & Phát triển thân lá
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Phát triển thân lá', name: 'Tưới nước giữ ẩm hằng ngày', order: 401 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Phát triển thân lá', name: 'Tưới nước nhỏ giọt', order: 402 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Phát triển thân lá', name: 'Tưới nước phun mưa', order: 403 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Phát triển thân lá', name: 'Làm cỏ gốc', order: 404 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Phát triển thân lá', name: 'Xới xáo phá váng đất', order: 405 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Phát triển thân lá', name: 'Tỉa bớt cây yếu còi cọc', order: 406 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Phát triển thân lá', name: 'Định khoảng cách mật độ luống', order: 407 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Phát triển thân lá', name: 'Vun cao gốc cây', order: 408 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Phát triển thân lá', name: 'Bón thúc đợt 1', order: 409 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Phát triển thân lá', name: 'Bón thúc đợt 2', order: 410 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Phát triển thân lá', name: 'Bón thúc đợt 3', order: 411 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Phát triển thân lá', name: 'Phun phân bón qua lá', order: 412 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Phát triển thân lá', name: 'Phun vi lượng bổ sung', order: 413 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Phát triển thân lá', name: 'Cắm cọc làm giàn leo', order: 414 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Phát triển thân lá', name: 'Buộc dây cố định thân leo', order: 415 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Phát triển thân lá', name: 'Bấm ngọn kích thích phân nhánh', order: 416 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Phát triển thân lá', name: 'Vặt tỉa chồi nách phụ', order: 417 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Phát triển thân lá', name: 'Tỉa bỏ lá già úa dưới gốc', order: 418 },

  // Ra hoa & Nuôi quả / Nuôi củ / Đóng bắp
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Ra hoa', name: 'Bón thúc đón hoa', order: 501 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Ra hoa', name: 'Thụ phấn bổ sung nhân tạo', order: 502 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Ra hoa', name: 'Tỉa bớt nụ hoa dị hình', order: 503 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Nuôi quả', name: 'Bón thúc nuôi quả', order: 504 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Nuôi củ', name: 'Bón thúc phì to củ', order: 505 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Đóng bắp', name: 'Bón thúc cuốn chắc bắp', order: 506 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Nuôi quả', name: 'Tỉa bỏ quả còi cọc đèo đẹt', order: 507 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Nuôi quả', name: 'Bọc túi bảo vệ quả', order: 508 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Nuôi củ', name: 'Khơi rãnh luống thoát nước', order: 509 },

  // Phòng trừ sâu bệnh
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Phát triển thân lá', name: 'Bắt sâu non thủ công', order: 601 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Phát triển thân lá', name: 'Treo bẫy dính màu vàng', order: 602 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Phát triển thân lá', name: 'Phun chế phẩm nấm Trichoderma', order: 603 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Phát triển thân lá', name: 'Phun thuốc trừ sâu sinh học', order: 604 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Phát triển thân lá', name: 'Phun thuốc trừ nấm bệnh lá', order: 605 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Phát triển thân lá', name: 'Nhổ bỏ tiêu hủy cây bị bệnh', order: 606 },

  // Thu hoạch & Sau thu hoạch
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Thu hoạch', name: 'Ngừng phân thuốc cách ly an toàn', order: 701 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Thu hoạch', name: 'Thu hoạch tỉa cây lớn trước', order: 702 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Thu hoạch', name: 'Thu hoạch rộ cả luống', order: 703 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Thu hoạch', name: 'Cắt tỉa cuống quả', order: 704 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Thu hoạch', name: 'Nhổ củ', order: 705 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Thu hoạch', name: 'Cắt bắp cải', order: 706 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Thu hoạch', name: 'Phân loại kích cỡ nông sản', order: 707 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Thu hoạch', name: 'Sơ chế rửa sạch rễ củ', order: 708 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Thu hoạch', name: 'Đóng gói thùng carton', order: 709 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Sau thu hoạch', name: 'Thu gom tàn dư cây trồng', order: 710 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Sau thu hoạch', name: 'Thu dọn màng phủ nilon cũ', order: 711 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Sau thu hoạch', name: 'Xới đất phơi luống tái vụ', order: 712 },

  // --- 3. SÂU BỆNH HẠI CÂY NGẮN NGÀY (PEST) - TÁCH RIÊNG TỪNG CON/BỆNH ---
  { cropGroup: 'SHORT_TERM', type: 'PEST', name: 'Sâu tơ', order: 801 },
  { cropGroup: 'SHORT_TERM', type: 'PEST', name: 'Sâu xanh bướm trắng', order: 802 },
  { cropGroup: 'SHORT_TERM', type: 'PEST', name: 'Bọ nhảy sọc cong', order: 803 },
  { cropGroup: 'SHORT_TERM', type: 'PEST', name: 'Rệp muội', order: 804 },
  { cropGroup: 'SHORT_TERM', type: 'PEST', name: 'Rầy mềm', order: 805 },
  { cropGroup: 'SHORT_TERM', type: 'PEST', name: 'Bọ trĩ', order: 806 },
  // --- 3. ĐỐI TƯỢNG SÂU BỆNH HẠI (PEST) - RÚT GỌN THÔNG DỤNG ---
  { cropGroup: 'SHORT_TERM', type: 'PEST', name: 'Sâu tơ', order: 801 },
  { cropGroup: 'SHORT_TERM', type: 'PEST', name: 'Sâu xanh', order: 802 },
  { cropGroup: 'SHORT_TERM', type: 'PEST', name: 'Bọ nhảy', order: 803 },
  { cropGroup: 'SHORT_TERM', type: 'PEST', name: 'Bọ trĩ', order: 804 },
  { cropGroup: 'SHORT_TERM', type: 'PEST', name: 'Rệp muội', order: 805 },
  { cropGroup: 'SHORT_TERM', type: 'PEST', name: 'Dòi đục lá', order: 806 },
  { cropGroup: 'SHORT_TERM', type: 'PEST', name: 'Bệnh thối nhũn', order: 807 },
  { cropGroup: 'SHORT_TERM', type: 'PEST', name: 'Bệnh sương mai', order: 808 },
  { cropGroup: 'SHORT_TERM', type: 'PEST', name: 'Bệnh lở cổ rễ', order: 809 },
  { cropGroup: 'SHORT_TERM', type: 'PEST', name: 'Bệnh thán thư', order: 810 },

  // --- 4. LIỀU LƯỢNG PHÂN BÓN (FERTILIZER_DOSAGE) - NGẮN GỌN, SÚC TÍCH ---
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_DOSAGE', name: '2 kg / sào', order: 901 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_DOSAGE', name: '3 kg / sào', order: 902 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_DOSAGE', name: '5 kg / sào', order: 903 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_DOSAGE', name: '10 kg / sào', order: 904 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_DOSAGE', name: '10 kg / 1000m²', order: 905 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_DOSAGE', name: '20 kg / 1000m²', order: 906 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_DOSAGE', name: '50g / gốc', order: 907 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_DOSAGE', name: '100g / gốc', order: 908 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_DOSAGE', name: 'Tưới loãng', order: 909 },

  // --- 5. MỤC ĐÍCH BÓN PHÂN (FERTILIZER_PURPOSE) - NGẮN GỌN ---
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_PURPOSE', name: 'Bón lót', order: 1001 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_PURPOSE', name: 'Bón thúc đợt 1', order: 1002 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_PURPOSE', name: 'Bón thúc đợt 2', order: 1003 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_PURPOSE', name: 'Bón thúc đợt 3', order: 1004 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_PURPOSE', name: 'Bón thúc nuôi quả', order: 1005 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_PURPOSE', name: 'Phun qua lá', order: 1006 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_PURPOSE', name: 'Tưới kích rễ', order: 1007 },

  // --- 6. LIỀU LƯỢNG THUỐC BVTV (PESTICIDE_DOSAGE) - NGẮN GỌN, SÚC TÍCH ---
  { cropGroup: 'SHORT_TERM', type: 'PESTICIDE_DOSAGE', name: '10 ml / bình 16L', order: 1101 },
  { cropGroup: 'SHORT_TERM', type: 'PESTICIDE_DOSAGE', name: '15 ml / bình 16L', order: 1102 },
  { cropGroup: 'SHORT_TERM', type: 'PESTICIDE_DOSAGE', name: '20 ml / bình 16L', order: 1103 },
  { cropGroup: 'SHORT_TERM', type: 'PESTICIDE_DOSAGE', name: '25 ml / bình 25L', order: 1104 },
  { cropGroup: 'SHORT_TERM', type: 'PESTICIDE_DOSAGE', name: '1 gói / bình 16L', order: 1105 },
  { cropGroup: 'SHORT_TERM', type: 'PESTICIDE_DOSAGE', name: '100 ml / phuy 200L', order: 1106 },
  { cropGroup: 'SHORT_TERM', type: 'PESTICIDE_DOSAGE', name: 'Phun ướt lá', order: 1107 },
  { cropGroup: 'SHORT_TERM', type: 'PESTICIDE_DOSAGE', name: 'Tưới đẫm gốc', order: 1108 },

  // --- 7. THỜI GIAN CÁCH LY (PHI) ---
  { cropGroup: 'SHORT_TERM', type: 'PHI', name: '3 ngày', order: 1201 },
  { cropGroup: 'SHORT_TERM', type: 'PHI', name: '5 ngày', order: 1202 },
  { cropGroup: 'SHORT_TERM', type: 'PHI', name: '7 ngày', order: 1203 },
  { cropGroup: 'SHORT_TERM', type: 'PHI', name: '10 ngày', order: 1204 },
  { cropGroup: 'SHORT_TERM', type: 'PHI', name: '14 ngày', order: 1205 },

  // --- 8. NGƯỜI THỰC HIỆN (PERFORMER) ---
  { cropGroup: 'SHORT_TERM', type: 'PERFORMER', name: 'Chủ hộ', order: 1301 },
  { cropGroup: 'SHORT_TERM', type: 'PERFORMER', name: 'Kỹ thuật viên', order: 1302 },
  { cropGroup: 'SHORT_TERM', type: 'PERFORMER', name: 'Công nhân', order: 1303 },
  { cropGroup: 'SHORT_TERM', type: 'PERFORMER', name: 'Tổ BVTV', order: 1304 },

  // --- 9. THỜI TIẾT (WEATHER) ---
  { cropGroup: 'SHORT_TERM', type: 'WEATHER', name: 'Nắng đẹp', order: 1401 },
  { cropGroup: 'SHORT_TERM', type: 'WEATHER', name: 'Nắng gắt', order: 1402 },
  { cropGroup: 'SHORT_TERM', type: 'WEATHER', name: 'Râm mát', order: 1403 },
  { cropGroup: 'SHORT_TERM', type: 'WEATHER', name: 'Âm u', order: 1404 },
  { cropGroup: 'SHORT_TERM', type: 'WEATHER', name: 'Mưa nhỏ', order: 1405 },
  { cropGroup: 'SHORT_TERM', type: 'WEATHER', name: 'Mưa to', order: 1406 },
];

/**
 * Lấy danh mục chuẩn từ database, tự động seed nếu database chưa có
 */
export const getCropStandards = async (req: Request, res: Response) => {
  try {
    const cropGroup = (req.query.cropGroup as string) || 'SHORT_TERM';
    const sql = getSql();
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.crop_standards (
        id VARCHAR(64) PRIMARY KEY,
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_crop_standards_created_at ON public.crop_standards (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_crop_standards_data ON public.crop_standards USING gin (data);
    `);

    let count = await CropStandard.countDocuments({ cropGroup });
    if (count === 0) {
      // Seed dữ liệu chuẩn vào database Supabase
      console.log(`[AgriLog] Đang tự động nạp danh mục tiêu chuẩn cây trồng (${cropGroup}) vào Database...`);
      for (const item of INITIAL_STANDARDS) {
        await CropStandard.create(item);
      }
      count = INITIAL_STANDARDS.length;
    }

    const allItems = await CropStandard.find({ cropGroup }).sort({ order: 1 });

    // Group theo từng type để trả về cấu trúc tiện lợi cho Frontend
    const grouped: Record<string, string[]> = {};
    const stageToActivities: Record<string, string[]> = {};
    const stageToDefaultActivity: Record<string, string> = {};

    for (const item of allItems) {
      if (!grouped[item.type]) {
        grouped[item.type] = [];
      }
      if (!grouped[item.type].includes(item.name)) {
        grouped[item.type].push(item.name);
      }

      // Map Giai đoạn -> Hoạt động
      if (item.type === 'ACTIVITY' && item.stageName) {
        if (!stageToActivities[item.stageName]) {
          stageToActivities[item.stageName] = [];
        }
        stageToActivities[item.stageName].push(item.name);

        if (!stageToDefaultActivity[item.stageName]) {
          stageToDefaultActivity[item.stageName] = item.name;
        }
      }
    }

    res.json({
      success: true,
      data: {
        stages: grouped['STAGE'] || [],
        activities: grouped['ACTIVITY'] || [],
        pests: grouped['PEST'] || [],
        fertilizerDosages: grouped['FERTILIZER_DOSAGE'] || [],
        fertilizerPurposes: grouped['FERTILIZER_PURPOSE'] || [],
        pesticideDosages: grouped['PESTICIDE_DOSAGE'] || [],
        phiOptions: grouped['PHI'] || [],
        performers: grouped['PERFORMER'] || [],
        weatherOptions: grouped['WEATHER'] || [],
        stageToActivities,
        stageToDefaultActivity,
        raw: allItems,
      },
    });
  } catch (error: any) {
    console.error('Lỗi lấy danh mục tiêu chuẩn:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi lấy danh mục tiêu chuẩn' });
  }
};
