"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectProduct = exports.approveProduct = exports.getAllProductsAdmin = exports.getPendingProducts = exports.getProductDetail = exports.getApprovedProducts = exports.deleteProduct = exports.updateProduct = exports.getMyProducts = exports.createProduct = void 0;
const Product_1 = require("../models/Product");
const User_1 = require("../models/User");
const Notification_1 = require("../models/Notification");
// ===== COMPANY ENDPOINTS =====
const createProduct = async (req, res) => {
    try {
        const { name, description, category, price, unit, stock, images } = req.body;
        if (!name || !description || !category || price == null || !unit) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin sản phẩm' });
        }
        // Agriculture relevance filter
        const filterResult = (0, Product_1.checkAgricultureRelevance)(name, description, category);
        const product = await Product_1.Product.create({
            company: req.user?._id,
            name,
            description,
            category,
            price,
            unit,
            stock: stock || 0,
            images: images || [],
            filterPassed: filterResult.passed,
            status: filterResult.passed ? Product_1.ProductStatus.PENDING : Product_1.ProductStatus.REJECTED,
            rejectionReason: filterResult.passed ? '' : filterResult.reason,
        });
        if (filterResult.passed) {
            const admin = await User_1.User.findOne({ role: User_1.Role.ADMIN });
            if (admin) {
                await Notification_1.Notification.create({
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createProduct = createProduct;
const getMyProducts = async (req, res) => {
    try {
        const products = await Product_1.Product.find({ company: req.user?._id }).sort({ createdAt: -1 });
        res.json({ success: true, data: products });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMyProducts = getMyProducts;
const updateProduct = async (req, res) => {
    try {
        const product = await Product_1.Product.findOne({ _id: req.params.id, company: req.user?._id });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }
        const { name, description, category, price, unit, stock, images } = req.body;
        if (name)
            product.name = name;
        if (description)
            product.description = description;
        if (category)
            product.category = category;
        if (price != null)
            product.price = price;
        if (unit)
            product.unit = unit;
        if (stock != null)
            product.stock = stock;
        if (images)
            product.images = images;
        // Re-run filter if content changed
        if (name || description || category) {
            const filterResult = (0, Product_1.checkAgricultureRelevance)(product.name, product.description, product.category);
            product.filterPassed = filterResult.passed;
            if (!filterResult.passed) {
                product.status = Product_1.ProductStatus.REJECTED;
                product.rejectionReason = filterResult.reason;
            }
            else {
                // Reset to pending for re-review
                product.status = Product_1.ProductStatus.PENDING;
                product.rejectionReason = '';
            }
        }
        await product.save();
        res.json({ success: true, data: product });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const product = await Product_1.Product.findOneAndDelete({ _id: req.params.id, company: req.user?._id });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }
        res.json({ success: true, message: 'Đã xóa sản phẩm' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteProduct = deleteProduct;
// ===== FARM ENDPOINTS =====
const getApprovedProducts = async (req, res) => {
    try {
        const { category, search } = req.query;
        const filter = { status: Product_1.ProductStatus.APPROVED };
        if (category && category !== 'ALL') {
            filter.category = category;
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const skip = (page - 1) * limit;
        const total = await Product_1.Product.countDocuments(filter);
        const products = await Product_1.Product.find(filter)
            .populate('company', 'email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        res.json({
            success: true,
            data: products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getApprovedProducts = getApprovedProducts;
const getProductDetail = async (req, res) => {
    try {
        const product = await Product_1.Product.findById(req.params.id).populate('company', 'email');
        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }
        res.json({ success: true, data: product });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getProductDetail = getProductDetail;
// ===== ADMIN ENDPOINTS =====
const getPendingProducts = async (req, res) => {
    try {
        const products = await Product_1.Product.find({ status: Product_1.ProductStatus.PENDING })
            .populate('company', 'email')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: products });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getPendingProducts = getPendingProducts;
const getAllProductsAdmin = async (req, res) => {
    try {
        const products = await Product_1.Product.find()
            .populate('company', 'email')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: products });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllProductsAdmin = getAllProductsAdmin;
const approveProduct = async (req, res) => {
    try {
        const product = await Product_1.Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }
        product.status = Product_1.ProductStatus.APPROVED;
        product.rejectionReason = '';
        await product.save();
        res.json({ success: true, message: 'Sản phẩm đã được duyệt', data: product });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.approveProduct = approveProduct;
const rejectProduct = async (req, res) => {
    try {
        const product = await Product_1.Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }
        product.status = Product_1.ProductStatus.REJECTED;
        product.rejectionReason = req.body.reason || 'Không đạt yêu cầu';
        await product.save();
        res.json({ success: true, message: 'Sản phẩm đã bị từ chối', data: product });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.rejectProduct = rejectProduct;
