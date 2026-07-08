import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Order, OrderStatus } from '../models/Order';
import { Product, ProductStatus } from '../models/Product';
import { CommissionSetting } from '../models/CommissionSetting';

// Farm creates order
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { items, note } = req.body;
    // items: [{ productId, quantity }]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất 1 sản phẩm' });
    }

    // Get commission rate
    let commissionRate = 5; // default
    const setting = await CommissionSetting.findOne().sort({ updatedAt: -1 });
    if (setting) commissionRate = setting.rate;

    // Build order items and calculate total
    const orderItems = [];
    let totalAmount = 0;
    let companyId = null;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Sản phẩm ${item.productId} không tồn tại` });
      }
      if (product.status !== 'APPROVED') {
        return res.status(400).json({ success: false, message: `Sản phẩm "${product.name}" chưa được duyệt` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Sản phẩm "${product.name}" không đủ số lượng tồn kho` });
      }

      // All items in one order must belong to the same company
      if (!companyId) {
        companyId = product.company;
      } else if (product.company.toString() !== companyId.toString()) {
        return res.status(400).json({ success: false, message: 'Một đơn hàng chỉ được chứa sản phẩm từ cùng một doanh nghiệp' });
      }

      const lineTotal = product.price * item.quantity;
      totalAmount += lineTotal;

      orderItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        priceAtPurchase: product.price,
      });

      // Reduce stock
      product.stock -= item.quantity;
      await product.save();
    }

    const commissionAmount = Math.round(totalAmount * commissionRate / 100);

    const order = await Order.create({
      farm: req.user?._id as any,
      company: companyId as any,
      items: orderItems,
      totalAmount,
      commissionRate,
      commissionAmount,
      status: OrderStatus.PENDING,
      note: note || '',
    });

    res.status(201).json({ success: true, data: order, message: 'Đặt hàng thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Farm gets their orders
export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find({ farm: req.user?._id })
      .populate('company', 'email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Company gets orders for their products
export const getCompanyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find({ company: req.user?._id })
      .populate('farm', 'email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Company updates order status
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, company: req.user?._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
    }

    const { status } = req.body;
    if (!Object.values(OrderStatus).includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    order.status = status;
    await order.save();

    res.json({ success: true, data: order, message: 'Cập nhật trạng thái đơn hàng thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Company statistics
export const getCompanyStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalProducts = await Product.countDocuments({ company: req.user?._id });
    const approvedProducts = await Product.countDocuments({ company: req.user?._id, status: ProductStatus.APPROVED });
    const pendingProducts = await Product.countDocuments({ company: req.user?._id, status: ProductStatus.PENDING });

    const orders = await Order.find({ company: req.user?._id });
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter(o => o.status !== OrderStatus.CANCELLED)
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const totalCommission = orders
      .filter(o => o.status !== OrderStatus.CANCELLED)
      .reduce((sum, o) => sum + o.commissionAmount, 0);
    const netIncome = totalRevenue - totalCommission;

    // Get current commission rate
    let commissionRate = 5;
    const setting = await CommissionSetting.findOne().sort({ updatedAt: -1 });
    if (setting) commissionRate = setting.rate;

    res.json({
      success: true,
      data: {
        totalProducts,
        approvedProducts,
        pendingProducts,
        totalOrders,
        totalRevenue,
        totalCommission,
        netIncome,
        commissionRate,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Admin gets all orders
export const getAllOrdersAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find()
      .populate('farm', 'email')
      .populate('company', 'email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

