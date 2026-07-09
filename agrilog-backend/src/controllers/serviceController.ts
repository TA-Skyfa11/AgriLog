import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { ServicePackage } from '../models/ServicePackage';

// Lấy danh sách tất cả các gói dịch vụ
export const getServicePackages = async (req: AuthRequest, res: Response) => {
  try {
    const packages = await ServicePackage.find().sort({ price: 1 });
    res.json({ success: true, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Tạo gói dịch vụ mới (Admin)
export const createServicePackage = async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, price, description, features, maxImages, maxBoards, isActive } = req.body;

    if (!name || !code || price == null) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tên, mã và giá' });
    }

    const pkgExists = await ServicePackage.findOne({ code });
    if (pkgExists) {
      return res.status(400).json({ success: false, message: 'Mã gói dịch vụ đã tồn tại' });
    }

    const newPackage = await ServicePackage.create({
      name,
      code,
      price,
      description,
      features,
      maxImages,
      maxBoards,
      isActive
    });

    res.status(201).json({ success: true, data: newPackage, message: 'Tạo gói dịch vụ thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Cập nhật gói dịch vụ (Admin)
export const updateServicePackage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, price, description, features, maxImages, maxBoards, isActive } = req.body;

    const pkg = await ServicePackage.findById(id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Gói dịch vụ không tồn tại' });
    }

    if (name) pkg.name = name;
    if (code) pkg.code = code;
    if (price != null) pkg.price = price;
    if (description != null) pkg.description = description;
    if (features) pkg.features = features;
    if (maxImages != null) pkg.maxImages = maxImages;
    if (maxBoards != null) pkg.maxBoards = maxBoards;
    if (isActive != null) pkg.isActive = isActive;

    await pkg.save();
    res.json({ success: true, data: pkg, message: 'Cập nhật thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Xóa gói dịch vụ (Admin)
export const deleteServicePackage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const pkg = await ServicePackage.findByIdAndDelete(id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Gói dịch vụ không tồn tại' });
    }
    res.json({ success: true, message: 'Đã xóa gói dịch vụ' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
