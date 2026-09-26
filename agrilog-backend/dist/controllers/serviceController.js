"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTrialPolicy = exports.getTrialPolicy = exports.deleteServicePackage = exports.updateServicePackage = exports.createServicePackage = exports.getServicePackages = void 0;
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
// Lấy thông tin cấu hình chính sách Dùng thử (Public/Admin)
const getTrialPolicy = async (req, res) => {
    try {
        const { getOrCreateTrialSetting } = await Promise.resolve().then(() => __importStar(require('../utils/boardUtils')));
        const setting = await getOrCreateTrialSetting();
        res.json({ success: true, data: setting });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getTrialPolicy = getTrialPolicy;
// Cập nhật cấu hình chính sách Dùng thử (Admin)
const updateTrialPolicy = async (req, res) => {
    try {
        const { getOrCreateTrialSetting } = await Promise.resolve().then(() => __importStar(require('../utils/boardUtils')));
        const { isEnabled, durationMonths, trialPlan, lockOnExpiry } = req.body;
        const setting = await getOrCreateTrialSetting();
        if (typeof isEnabled === 'boolean')
            setting.isEnabled = isEnabled;
        if (typeof durationMonths === 'number' && durationMonths >= 1)
            setting.durationMonths = Math.max(1, Math.min(36, Math.floor(durationMonths)));
        if (trialPlan && ['BASIC', 'STANDARD', 'PREMIUM'].includes(trialPlan))
            setting.trialPlan = trialPlan;
        if (typeof lockOnExpiry === 'boolean')
            setting.lockOnExpiry = lockOnExpiry;
        setting.updatedBy = req.user?._id;
        await setting.save();
        res.json({
            success: true,
            data: setting,
            message: `Cập nhật chính sách dùng thử thành công: ${setting.isEnabled ? `Bật (${setting.durationMonths} tháng)` : 'Đã tắt'}`,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateTrialPolicy = updateTrialPolicy;
