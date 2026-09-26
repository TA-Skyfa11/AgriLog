import { Request, Response } from 'express';
import { SystemFeature, ISystemFeature } from '../models/SystemFeature';
import { AuthRequest } from '../middleware/authMiddleware';

export const DEFAULT_SYSTEM_FEATURES = [
  {
    key: 'diary_cultivation',
    name: 'Nhật ký canh tác',
    description: 'Quản lý bảng nhật ký gieo trồng, mùa vụ và các hoạt động canh tác nông nghiệp',
    category: 'FARM' as const,
    path: '/diary',
    icon: 'Leaf',
    order: 1,
    isEnabled: true,
  },
  {
    key: 'diary_fertilizer',
    name: 'Nhật ký bón phân',
    description: 'Ghi chép và theo dõi việc bón phân, tính toán lượng phân bón sử dụng',
    category: 'FARM' as const,
    path: '/diary/fertilizer',
    icon: 'FlaskConical',
    order: 2,
    isEnabled: true,
  },
  {
    key: 'diary_pesticide',
    name: 'Nhật ký thuốc BVTV',
    description: 'Quản lý việc phun thuốc bảo vệ thực vật, thời gian cách ly thu hoạch',
    category: 'FARM' as const,
    path: '/diary/pesticide',
    icon: 'ShieldAlert',
    order: 3,
    isEnabled: true,
  },
  {
    key: 'inventory',
    name: 'Quản lý kho vật tư',
    description: 'Theo dõi tồn kho phân bón, thuốc BVTV, hạt giống và lịch sử xuất nhập kho',
    category: 'FARM' as const,
    path: '/inventory',
    icon: 'Package',
    order: 4,
    isEnabled: true,
  },
  {
    key: 'marketplace',
    name: 'Sàn thương mại điện tử',
    description: 'Chợ mua bán vật tư nông nghiệp kết nối trực tiếp Nông trại và Doanh nghiệp',
    category: 'COMMON' as const,
    path: '/marketplace',
    icon: 'ShoppingBag',
    order: 5,
    isEnabled: true,
  },
  {
    key: 'tasks',
    name: 'Quản lý công việc',
    description: 'Phân công công việc, đặt lịch nhắc nhở và theo dõi tiến độ nông vụ',
    category: 'FARM' as const,
    path: '/tasks',
    icon: 'Calendar',
    order: 6,
    isEnabled: true,
  },
  {
    key: 'reports',
    name: 'Báo cáo & Thống kê',
    description: 'Xuất báo cáo nhật ký canh tác chuẩn GlobalGAP và thống kê chi phí',
    category: 'FARM' as const,
    path: '/reports',
    icon: 'BarChart2',
    order: 7,
    isEnabled: true,
  },
  {
    key: 'billing',
    name: 'Gói dịch vụ & Thanh toán',
    description: 'Nâng cấp gói dịch vụ nông trại, thanh toán trực tuyến qua SePay',
    category: 'FARM' as const,
    path: '/billing',
    icon: 'CreditCard',
    order: 8,
    isEnabled: true,
  },
  {
    key: 'weather',
    name: 'Dự báo thời tiết',
    description: 'Dự báo thời tiết chuyên sâu và khuyến cáo nông vụ tại địa phương',
    category: 'COMMON' as const,
    path: '/weather',
    icon: 'Sun',
    order: 9,
    isEnabled: true,
  },
  {
    key: 'company_products',
    name: 'Quản lý sản phẩm Doanh nghiệp',
    description: 'Đăng bán và quản lý danh mục sản phẩm, vật tư của doanh nghiệp',
    category: 'COMPANY' as const,
    path: '/company/products',
    icon: 'PackagePlus',
    order: 10,
    isEnabled: true,
  },
  {
    key: 'company_orders',
    name: 'Quản lý đơn hàng Doanh nghiệp',
    description: 'Xử lý và cập nhật trạng thái đơn đặt hàng từ các nông trại',
    category: 'COMPANY' as const,
    path: '/company/orders',
    icon: 'ClipboardList',
    order: 11,
    isEnabled: true,
  },
];

/**
 * Đảm bảo các tính năng mặc định luôn tồn tại trong Database
 */
export async function ensureDefaultFeatures(): Promise<ISystemFeature[]> {
  for (const def of DEFAULT_SYSTEM_FEATURES) {
    const existing = await SystemFeature.findOne({ key: def.key });
    if (!existing) {
      await SystemFeature.create(def);
    }
  }
  return SystemFeature.find().sort({ order: 1 });
}

/**
 * 1. Lấy danh sách các tính năng đang bật (Public API dành cho Frontend)
 * GET /api/features/active
 */
export const getActiveFeatures = async (req: Request, res: Response) => {
  try {
    await ensureDefaultFeatures();
    const allFeatures = await SystemFeature.find().sort({ order: 1 });

    // Tạo object map { [key]: boolean } để Frontend check O(1)
    const featureMap: Record<string, boolean> = {};
    const disabledPaths: string[] = [];

    allFeatures.forEach((f) => {
      featureMap[f.key] = f.isEnabled;
      if (!f.isEnabled && f.path) {
        disabledPaths.push(f.path);
      }
    });

    res.json({
      success: true,
      data: {
        featureMap,
        disabledPaths,
        features: allFeatures,
      },
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách tính năng:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * 2. Lấy toàn bộ danh sách tính năng dành cho Admin Portal
 * GET /api/admin/features
 */
export const getAllFeaturesAdmin = async (req: AuthRequest, res: Response) => {
  try {
    await ensureDefaultFeatures();
    const features = await SystemFeature.find()
      .populate('updatedBy', 'fullName email')
      .sort({ order: 1 });

    res.json({
      success: true,
      data: features,
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách tính năng Admin:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * 3. Bật/Tắt tính năng hệ thống (Admin Toggle)
 * PUT /api/admin/features/:key/toggle
 */
export const toggleFeatureAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const rawKey = req.params.key;
    const key = String(rawKey || '').toLowerCase().trim();

    if (!key) {
      return res.status(400).json({ success: false, message: 'Thiếu mã tính năng' });
    }

    let feature = await SystemFeature.findOne({ key });
    if (!feature) {
      // Tìm trong danh sách mặc định nếu chưa có trong DB
      const def = DEFAULT_SYSTEM_FEATURES.find((d) => d.key === key);
      if (def) {
        feature = await SystemFeature.create({ ...def, updatedBy: req.user?._id });
      } else {
        return res.status(404).json({ success: false, message: 'Không tìm thấy tính năng này' });
      }
    }

    // Nếu body truyền { isEnabled }, dùng giá trị đó; nếu không thì đảo ngược trạng thái
    const newStatus = typeof req.body.isEnabled === 'boolean' ? req.body.isEnabled : !feature.isEnabled;

    feature.isEnabled = newStatus;
    feature.updatedBy = req.user?._id as any;
    await feature.save();

    console.log(`[Admin Feature Flag] Tính năng "${feature.name}" (${feature.key}) đã được ${newStatus ? 'BẬT (Hiện)' : 'TẮT (Ẩn)'} bởi ${req.user?.email || 'Admin'}`);

    res.json({
      success: true,
      data: feature,
      message: `Đã ${newStatus ? 'bật (hiện)' : 'tắt (ẩn)'} tính năng "${feature.name}" thành công!`,
    });
  } catch (error) {
    console.error('Lỗi chuyển trạng thái tính năng:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * 4. Cập nhật chi tiết tính năng (Tên, mô tả, order)
 * PUT /api/admin/features/:key
 */
export const updateFeatureAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const rawKey = req.params.key;
    const key = String(rawKey || '').toLowerCase().trim();
    const { name, description, isEnabled, order } = req.body;

    const feature = await SystemFeature.findOne({ key });
    if (!feature) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tính năng' });
    }

    if (name) feature.name = name.trim();
    if (description !== undefined) feature.description = description.trim();
    if (typeof isEnabled === 'boolean') feature.isEnabled = isEnabled;
    if (typeof order === 'number') feature.order = order;
    feature.updatedBy = req.user?._id as any;

    await feature.save();

    res.json({
      success: true,
      data: feature,
      message: `Cập nhật thông tin tính năng "${feature.name}" thành công`,
    });
  } catch (error) {
    console.error('Lỗi cập nhật tính năng:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * 5. Khôi phục tất cả tính năng về mặc định (BẬT toàn bộ)
 * POST /api/admin/features/reset-defaults
 */
export const resetFeaturesAdmin = async (req: AuthRequest, res: Response) => {
  try {
    for (const def of DEFAULT_SYSTEM_FEATURES) {
      await SystemFeature.findOneAndUpdate(
        { key: def.key },
        {
          $set: {
            name: def.name,
            description: def.description,
            category: def.category,
            path: def.path,
            icon: def.icon,
            order: def.order,
            isEnabled: true,
            updatedBy: req.user?._id,
          },
        },
        { upsert: true, returnDocument: 'after' }
      );
    }

    const all = await SystemFeature.find().sort({ order: 1 });
    res.json({
      success: true,
      data: all,
      message: 'Đã khôi phục tất cả các tính năng hệ thống về trạng thái BẬT mặc định',
    });
  } catch (error) {
    console.error('Lỗi khôi phục tính năng:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
