"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteServicePackage = exports.updateServicePackage = exports.createServicePackage = exports.getServicePackages = void 0;
const ServicePackage_1 = require("../models/ServicePackage");
// Lấy danh sách tất cả các gói dịch vụ
const getServicePackages = async (req, res) => {
    try {
        const packages = await ServicePackage_1.ServicePackage.find().sort({ price: 1 });
        res.json({ success: true, data: packages });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getServicePackages = getServicePackages;
// Tạo gói dịch vụ mới (Admin)
const createServicePackage = async (req, res) => {
    try {
        const { name, code, price, description, features, maxImages, maxBoards, isActive } = req.body;
        if (!name || !code || price == null) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tên, mã và giá' });
        }
        const pkgExists = await ServicePackage_1.ServicePackage.findOne({ code });
        if (pkgExists) {
            return res.status(400).json({ success: false, message: 'Mã gói dịch vụ đã tồn tại' });
        }
        const newPackage = await ServicePackage_1.ServicePackage.create({
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createServicePackage = createServicePackage;
// Cập nhật gói dịch vụ (Admin)
const updateServicePackage = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, price, description, features, maxImages, maxBoards, isActive } = req.body;
        const pkg = await ServicePackage_1.ServicePackage.findById(id);
        if (!pkg) {
            return res.status(404).json({ success: false, message: 'Gói dịch vụ không tồn tại' });
        }
        if (name)
            pkg.name = name;
        if (code)
            pkg.code = code;
        if (price != null)
            pkg.price = price;
        if (description != null)
            pkg.description = description;
        if (features)
            pkg.features = features;
        if (maxImages != null)
            pkg.maxImages = maxImages;
        if (maxBoards != null)
            pkg.maxBoards = maxBoards;
        if (isActive != null)
            pkg.isActive = isActive;
        await pkg.save();
        res.json({ success: true, data: pkg, message: 'Cập nhật thành công' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateServicePackage = updateServicePackage;
// Xóa gói dịch vụ (Admin)
const deleteServicePackage = async (req, res) => {
    try {
        const { id } = req.params;
        const pkg = await ServicePackage_1.ServicePackage.findByIdAndDelete(id);
        if (!pkg) {
            return res.status(404).json({ success: false, message: 'Gói dịch vụ không tồn tại' });
        }
        res.json({ success: true, message: 'Đã xóa gói dịch vụ' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteServicePackage = deleteServicePackage;
