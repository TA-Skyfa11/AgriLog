import { Request, Response } from 'express';
import { CropStandard } from '../models/CropStandard';
import { getSql } from '../config/db';

// Dữ liệu mẫu chuẩn hóa chuyên sâu cho cây ngắn ngày (rau củ, rau ăn lá, quả ngắn ngày)
// Từng hoạt động, giai đoạn, sâu bệnh được tách riêng biệt 100%, không gộp chung
const INITIAL_STANDARDS = [
  // --- 1. GIAI ĐOẠN SINH TRƯỞNG (STAGE) ---
  { cropGroup: 'SHORT_TERM', type: 'STAGE', name: 'Làm đất', order: 1 },
  { cropGroup: 'SHORT_TERM', type: 'STAGE', name: 'Gieo hạt', order: 2 },
  { cropGroup: 'SHORT_TERM', type: 'STAGE', name: 'Trồng cây con', order: 3 },
  { cropGroup: 'SHORT_TERM', type: 'STAGE', name: 'Cây đang lớn', order: 4 },
  { cropGroup: 'SHORT_TERM', type: 'STAGE', name: 'Cây phát triển lá', order: 5 },
  { cropGroup: 'SHORT_TERM', type: 'STAGE', name: 'Cây ra hoa', order: 6 },
  { cropGroup: 'SHORT_TERM', type: 'STAGE', name: 'Cây nuôi quả', order: 7 },
  { cropGroup: 'SHORT_TERM', type: 'STAGE', name: 'Cây nuôi củ', order: 8 },
  { cropGroup: 'SHORT_TERM', type: 'STAGE', name: 'Thu hoạch', order: 9 },

  // --- 2. HOẠT ĐỘNG CANH TÁC (ACTIVITY) ---
  // Làm đất
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Làm đất', name: 'Cày đất', order: 101 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Làm đất', name: 'Xới đất', order: 102 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Làm đất', name: 'Bừa đất', order: 103 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Làm đất', name: 'Phơi đất phơi ải', order: 104 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Làm đất', name: 'Rải vôi bột', order: 105 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Làm đất', name: 'Cuốc luống lên luống', order: 106 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Làm đất', name: 'Phủ bạt màng phủ nông nghiệp', order: 107 },

  // Gieo hạt
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Gieo hạt', name: 'Ngâm hạt giống', order: 201 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Gieo hạt', name: 'Ủ hạt giống', order: 202 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Gieo hạt', name: 'Gieo hạt', order: 203 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Gieo hạt', name: 'Tưới nước', order: 204 },

  // Trồng cây con
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Trồng cây con', name: 'Nhổ cây con đi trồng', order: 301 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Trồng cây con', name: 'Trồng dặm trồng bù cây chết', order: 302 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Trồng cây con', name: 'Tưới nước', order: 303 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Trồng cây con', name: 'Vun gốc', order: 304 },

  // Cây đang lớn
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây đang lớn', name: 'Tưới nước', order: 401 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây đang lớn', name: 'Nhổ cỏ dại', order: 402 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây đang lớn', name: 'Xới cỏ', order: 403 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây đang lớn', name: 'Vun gốc', order: 404 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây đang lớn', name: 'Tỉa bớt cây còi', order: 405 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây đang lớn', name: 'Cắm giàn làm giàn', order: 406 },

  // Cây phát triển lá
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây phát triển lá', name: 'Tưới nước', order: 501 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây phát triển lá', name: 'Nhổ cỏ dại', order: 502 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây phát triển lá', name: 'Vun gốc', order: 503 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây phát triển lá', name: 'Buộc ngọn cột dây leo', order: 504 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây phát triển lá', name: 'Ngắt ngọn bấm ngọn', order: 505 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây phát triển lá', name: 'Tỉa lá già', order: 506 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây phát triển lá', name: 'Tỉa cành thừa', order: 507 },

  // Cây ra hoa
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây ra hoa', name: 'Tưới nước', order: 601 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây ra hoa', name: 'Thụ phấn cho hoa', order: 602 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây ra hoa', name: 'Buộc ngọn cột dây leo', order: 603 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây ra hoa', name: 'Tỉa lá già', order: 604 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây ra hoa', name: 'Tỉa cành thừa', order: 605 },

  // Cây nuôi quả
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây nuôi quả', name: 'Tưới nước', order: 701 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây nuôi quả', name: 'Vun gốc', order: 702 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây nuôi quả', name: 'Buộc ngọn cột dây leo', order: 703 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây nuôi quả', name: 'Tỉa lá già', order: 704 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây nuôi quả', name: 'Tỉa cành thừa', order: 705 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây nuôi quả', name: 'Thu hoạch nông sản', order: 706 },

  // Cây nuôi củ
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây nuôi củ', name: 'Tưới nước', order: 801 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây nuôi củ', name: 'Vun gốc', order: 802 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây nuôi củ', name: 'Nhổ cỏ dại', order: 803 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây nuôi củ', name: 'Xới cỏ', order: 804 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây nuôi củ', name: 'Tỉa lá già', order: 805 },
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Cây nuôi củ', name: 'Thu hoạch nông sản', order: 806 },

  // Thu hoạch
  { cropGroup: 'SHORT_TERM', type: 'ACTIVITY', stageName: 'Thu hoạch', name: 'Thu hoạch nông sản', order: 901 },

  // --- 3. ĐỐI TƯỢNG SÂU BỆNH
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

    // --- 4. LIỀU LƯỢNG PHÂN BÓN (FERTILIZER_DOSAGE) ---
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_DOSAGE', name: '2 kg', order: 901 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_DOSAGE', name: '3 kg', order: 902 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_DOSAGE', name: '5 kg', order: 903 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_DOSAGE', name: '10 kg', order: 904 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_DOSAGE', name: '20 kg', order: 905 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_DOSAGE', name: '50g', order: 906 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_DOSAGE', name: '100g', order: 907 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_DOSAGE', name: 'Tưới loãng', order: 908 },

// --- 5. MỤC ĐÍCH BÓN PHÂN (FERTILIZER_PURPOSE) - NGẮN GỌN ---
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_PURPOSE', name: 'Bón lót', order: 1001 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_PURPOSE', name: 'Bón thúc đợt 1', order: 1002 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_PURPOSE', name: 'Bón thúc đợt 2', order: 1003 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_PURPOSE', name: 'Bón thúc đợt 3', order: 1004 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_PURPOSE', name: 'Bón thúc nuôi quả', order: 1005 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_PURPOSE', name: 'Phun qua lá', order: 1006 },
  { cropGroup: 'SHORT_TERM', type: 'FERTILIZER_PURPOSE', name: 'Tưới kích rễ', order: 1007 },

    // --- 6. LIỀU LƯỢNG THUỐC BVTV (PESTICIDE_DOSAGE) ---
  { cropGroup: 'SHORT_TERM', type: 'PESTICIDE_DOSAGE', name: '10 ml', order: 1101 },
  { cropGroup: 'SHORT_TERM', type: 'PESTICIDE_DOSAGE', name: '15 ml', order: 1102 },
  { cropGroup: 'SHORT_TERM', type: 'PESTICIDE_DOSAGE', name: '20 ml', order: 1103 },
  { cropGroup: 'SHORT_TERM', type: 'PESTICIDE_DOSAGE', name: '25 ml', order: 1104 },
  { cropGroup: 'SHORT_TERM', type: 'PESTICIDE_DOSAGE', name: '1 gói', order: 1105 },
  { cropGroup: 'SHORT_TERM', type: 'PESTICIDE_DOSAGE', name: '100 ml', order: 1106 },
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
