"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOrdersAdmin = exports.getCompanyStats = exports.updateOrderStatus = exports.getCompanyOrders = exports.getMyOrders = exports.createOrder = void 0;
const Order_1 = require("../models/Order");
const Product_1 = require("../models/Product");
const CommissionSetting_1 = require("../models/CommissionSetting");
// Farm creates order
const createOrder = async (req, res) => {
    try {
        const { items, note } = req.body;
        // items: [{ productId, quantity }]
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất 1 sản phẩm' });
        }
        // Get commission rate
        let commissionRate = 5; // default
        const setting = await CommissionSetting_1.CommissionSetting.findOne().sort({ updatedAt: -1 });
        if (setting)
            commissionRate = setting.rate;
        // Build order items and calculate total
        const orderItems = [];
        let totalAmount = 0;
        let companyId = null;
        for (const item of items) {
            const product = await Product_1.Product.findById(item.productId);
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
            }
            else if (product.company.toString() !== companyId.toString()) {
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
        const order = await Order_1.Order.create({
            farm: req.user?._id,
            company: companyId,
            items: orderItems,
            totalAmount,
            commissionRate,
            commissionAmount,
            status: Order_1.OrderStatus.PENDING,
            note: note || '',
        });
        res.status(201).json({ success: true, data: order, message: 'Đặt hàng thành công!' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createOrder = createOrder;
// Farm gets their orders
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order_1.Order.find({ farm: req.user?._id })
            .populate('company', 'email')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: orders });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMyOrders = getMyOrders;
// Company gets orders for their products
const getCompanyOrders = async (req, res) => {
    try {
        const orders = await Order_1.Order.find({ company: req.user?._id })
            .populate('farm', 'email')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: orders });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCompanyOrders = getCompanyOrders;
// Company updates order status
const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order_1.Order.findOne({ _id: req.params.id, company: req.user?._id });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
        }
        const { status } = req.body;
        if (!Object.values(Order_1.OrderStatus).includes(status)) {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
        }
        order.status = status;
        await order.save();
        res.json({ success: true, data: order, message: 'Cập nhật trạng thái đơn hàng thành công' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateOrderStatus = updateOrderStatus;
// Company statistics
const getCompanyStats = async (req, res) => {
    try {
        const totalProducts = await Product_1.Product.countDocuments({ company: req.user?._id });
        const approvedProducts = await Product_1.Product.countDocuments({ company: req.user?._id, status: Product_1.ProductStatus.APPROVED });
        const pendingProducts = await Product_1.Product.countDocuments({ company: req.user?._id, status: Product_1.ProductStatus.PENDING });
        const orders = await Order_1.Order.find({ company: req.user?._id });
        const totalOrders = orders.length;
        const totalRevenue = orders
            .filter(o => o.status !== Order_1.OrderStatus.CANCELLED)
            .reduce((sum, o) => sum + o.totalAmount, 0);
        const totalCommission = orders
            .filter(o => o.status !== Order_1.OrderStatus.CANCELLED)
            .reduce((sum, o) => sum + o.commissionAmount, 0);
        const netIncome = totalRevenue - totalCommission;
        // Get current commission rate
        let commissionRate = 5;
        const setting = await CommissionSetting_1.CommissionSetting.findOne().sort({ updatedAt: -1 });
        if (setting)
            commissionRate = setting.rate;
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCompanyStats = getCompanyStats;
// Admin gets all orders
const getAllOrdersAdmin = async (req, res) => {
    try {
        const orders = await Order_1.Order.find()
            .populate('farm', 'email')
            .populate('company', 'email')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: orders });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllOrdersAdmin = getAllOrdersAdmin;
