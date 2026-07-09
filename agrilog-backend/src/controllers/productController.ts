import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Product, ProductStatus, checkAgricultureRelevance, ProductCategory } from '../models/Product';
import { User, Role } from '../models/User';
import { Notification } from '../models/Notification';

// ===== COMPANY ENDPOINTS =====

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, category, price, unit, stock, images } = req.body;

    if (!name || !description || !category || price == null || !unit) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin sản phẩm' });
    }

    // Agriculture relevance filter
    const filterResult = checkAgricultureRelevance(name, description, category);

    const product = await Product.create({
      company: req.user?._id,
      name,
      description,
      category,
      price,
      unit,
      stock: stock || 0,
      images: images || [],
      filterPassed: filterResult.passed,
      status: filterResult.passed ? ProductStatus.PENDING : ProductStatus.REJECTED,
      rejectionReason: filterResult.passed ? '' : filterResult.reason,
    });

    if (filterResult.passed) {
      const admin = await User.findOne({ role: Role.ADMIN });
      if (admin) {
        await Notification.create({
          user: admin._id,
          title: 'Sản phẩm mới chờ duyệt',
          message: `Doanh nghiệp vừa thêm sản phẩm "${name}" cần được kiểm duyệt.`,
          type: 'SYSTEM',
          referenceId: product._id.toString()
        });
      }
    }

    res.status(201).json({
      success: true,
      data: product,
      filterPassed: filterResult.passed,
      message: filterResult.passed
        ? 'Sản phẩm đã được gửi và đang chờ Admin kiểm duyệt.'
        : `Sản phẩm bị từ chối tự động: ${filterResult.reason}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getMyProducts = async (req: AuthRequest, res: Response) => {
  try {
    const products = await Product.find({ company: req.user?._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, company: req.user?._id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    const { name, description, category, price, unit, stock, images } = req.body;

    if (name) product.name = name;
    if (description) product.description = description;
    if (category) product.category = category;
    if (price != null) product.price = price;
    if (unit) product.unit = unit;
    if (stock != null) product.stock = stock;
    if (images) product.images = images;

    // Re-run filter if content changed
    if (name || description || category) {
      const filterResult = checkAgricultureRelevance(
        product.name, product.description, product.category
      );
      product.filterPassed = filterResult.passed;
      if (!filterResult.passed) {
        product.status = ProductStatus.REJECTED;
        product.rejectionReason = filterResult.reason;
      } else {
        // Reset to pending for re-review
        product.status = ProductStatus.PENDING;
        product.rejectionReason = '';
      }
    }

    await product.save();
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, company: req.user?._id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }
    res.json({ success: true, message: 'Đã xóa sản phẩm' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ===== FARM ENDPOINTS =====

export const getApprovedProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { category, search } = req.query;
    const filter: any = { status: ProductStatus.APPROVED };

    if (category && category !== 'ALL') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(filter)
      .populate('company', 'email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getProductDetail = async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.findById(req.params.id).populate('company', 'email');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ===== ADMIN ENDPOINTS =====

export const getPendingProducts = async (req: AuthRequest, res: Response) => {
  try {
    const products = await Product.find({ status: ProductStatus.PENDING })
      .populate('company', 'email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getAllProductsAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const products = await Product.find()
      .populate('company', 'email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const approveProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }
    product.status = ProductStatus.APPROVED;
    product.rejectionReason = '';
    await product.save();
    res.json({ success: true, message: 'Sản phẩm đã được duyệt', data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const rejectProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }
    product.status = ProductStatus.REJECTED;
    product.rejectionReason = req.body.reason || 'Không đạt yêu cầu';
    await product.save();
    res.json({ success: true, message: 'Sản phẩm đã bị từ chối', data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
