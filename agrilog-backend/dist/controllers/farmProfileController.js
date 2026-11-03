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
exports.removeFarmPerformer = exports.leaveCooperative = exports.joinCooperative = exports.getFarmCooperative = exports.addFarmPerformer = exports.getFarmPerformers = exports.selectTrialPlan = exports.updateFarmProfile = exports.getFarmProfile = exports.createDefaultFarmProfile = void 0;
const FarmProfile_1 = require("../models/FarmProfile");
const Cooperative_1 = require("../models/Cooperative");
const Notification_1 = require("../models/Notification");
const boardUtils_1 = require("../utils/boardUtils");
/**
 * Hàm khởi tạo FarmProfile mặc định có áp dụng chính sách Dùng thử miễn phí
 */
const createDefaultFarmProfile = async (userId, initialData = {}) => {
    const trialSetting = await (0, boardUtils_1.getOrCreateTrialSetting)();
    let plan = initialData.plan || 'FREE';
    let planExpiresAt = initialData.planExpiresAt;
    let isTrial = false;
    // Nếu chính sách dùng thử đang BẬT và tài khoản chưa từng mua gói
    if (trialSetting.isEnabled) {
        const durationDays = (trialSetting.durationMonths || 6) * 30;
        const designatedPlan = trialSetting.trialPlan || 'PREMIUM';
        plan = designatedPlan;
        planExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
        isTrial = true;
    }
    const profile = await FarmProfile_1.FarmProfile.create({
        user: userId,
        farmName: initialData.farmName || 'Nông trại của tôi',
        address: initialData.address || '',
        areaSqm: initialData.areaSqm,
        mainCropType: initialData.mainCropType,
        contactPhone: initialData.contactPhone,
        plan,
        planExpiresAt,
        isTrial,
        previousPlan: 'FREE',
        ...initialData,
    });
    // Tạo thông báo chào mừng dùng thử miễn phí
    if (isTrial && planExpiresAt) {
        try {
            const welcomeMsg = trialSetting.trialPromptMessage || `Chào mừng bạn đến với AgriLog! Nông trại của bạn đã được kích hoạt gói ${plan} miễn phí ${trialSetting.durationMonths} tháng (hạn dùng đến ${planExpiresAt.toLocaleDateString('vi-VN')}). Hãy bắt đầu trải nghiệm ngay mọi tính năng!`;
            await Notification_1.Notification.create({
                user: userId,
                title: `Kích hoạt gói dịch vụ ${plan} miễn phí ${trialSetting.durationMonths} tháng`,
                message: welcomeMsg,
                type: 'BILLING',
            });
        }
        catch (e) {
            console.warn('Lỗi tạo notification chào mừng dùng thử:', e.message);
        }
    }
    return profile;
};
exports.createDefaultFarmProfile = createDefaultFarmProfile;
const getFarmProfile = async (req, res) => {
    try {
        let profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile) {
            profile = await (0, exports.createDefaultFarmProfile)(req.user?._id);
        }
        const trialSetting = await (0, boardUtils_1.getOrCreateTrialSetting)();
        // Tự động kiểm tra hết hạn dùng thử -> Thông báo & Chuyển về gói FREE nếu cấu hình là SWITCH_TO_FREE
        if (profile.isTrial && profile.planExpiresAt && new Date(profile.planExpiresAt) < new Date()) {
            if (trialSetting.expiryAction === 'SWITCH_TO_FREE' || !trialSetting.lockOnExpiry) {
                if (profile.plan !== 'FREE') {
                    profile.plan = 'FREE';
                    profile.isTrial = false;
                    await profile.save();
                    try {
                        await Notification_1.Notification.create({
                            user: req.user?._id,
                            title: 'Hết hạn dùng thử - Chuyển sang gói Miễn phí',
                            message: trialSetting.expiryNotificationMessage ||
                                'Thời hạn dùng thử miễn phí của bạn đã kết thúc. Tài khoản của bạn đã được chuyển về gói Miễn phí với các chức năng cơ bản (tối đa 1 bảng mỗi loại nhật ký, không xuất Excel/PDF và không tải ảnh).',
                            type: 'BILLING',
                        });
                    }
                    catch (notifErr) {
                        console.warn('Lỗi tạo thông báo hết hạn trial:', notifErr);
                    }
                }
            }
        }
        // Gắn thông tin tính toán gói cước hiệu dụng và trạng thái hết hạn
        const profileObj = profile.toObject ? profile.toObject() : profile;
        const effectivePlan = (0, boardUtils_1.getEffectivePlan)(profile);
        const expired = (0, boardUtils_1.isPlanExpired)(profile);
        profileObj.effectivePlan = effectivePlan;
        profileObj.isPlanExpired = expired;
        profileObj.isTrial = profile.isTrial || false;
        const isTrialAll = profile.isTrial && profile.plan === 'ALL';
        profileObj.isTrialAll = isTrialAll;
        // Gắn thông tin cấu hình dùng thử để frontend hiển thị thông báo & modal chọn gói
        profileObj.trialPromptMessage = trialSetting.trialPromptMessage;
        profileObj.expiryNotificationMessage = trialSetting.expiryNotificationMessage;
        profileObj.requirePlanSelection = trialSetting.requirePlanSelection;
        profileObj.trialDurationMonths = trialSetting.durationMonths;
        profileObj.expiryAction = trialSetting.expiryAction;
        // Check if package allows export based on features
        let allowExport = false;
        if (effectivePlan === 'FREE' || effectivePlan === 'BASIC' || effectivePlan === 'EXPIRED') {
            allowExport = false;
        }
        else {
            const { ServicePackage } = await Promise.resolve().then(() => __importStar(require('../models/ServicePackage')));
            const pkg = await ServicePackage.findOne({ code: effectivePlan });
            if (pkg) {
                const featureString = pkg.features.join(' ').toLowerCase();
                allowExport = featureString.includes('lưu trữ') || featureString.includes('hồ sơ') || featureString.includes('xuất');
            }
            else {
                allowExport = true;
            }
        }
        profileObj.allowExport = allowExport;
        res.json({ success: true, data: profileObj });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getFarmProfile = getFarmProfile;
const updateFarmProfile = async (req, res) => {
    try {
        let profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile) {
            profile = await (0, exports.createDefaultFarmProfile)(req.user?._id, req.body);
        }
        else {
            const currentEffectivePlan = (0, boardUtils_1.getEffectivePlan)(profile);
            if (req.body.plan && req.body.plan !== currentEffectivePlan) {
                const planValues = { FREE: 0, BASIC: 1, STANDARD: 2, PREMIUM: 3, EXPIRED: 0 };
                const currentVal = planValues[currentEffectivePlan] || 0;
                const newVal = planValues[req.body.plan] || 0;
                if (newVal > currentVal) {
                    const isNewPurchase = !profile.planExpiresAt || new Date(profile.planExpiresAt) < new Date();
                    profile.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    profile.isTrial = false; // Nếu mua gói mới thì không còn là trial nữa
                    if (isNewPurchase) {
                        // Generate notification for successful purchase
                        await Notification_1.Notification.create({
                            user: req.user?._id,
                            title: 'Mua gói cước thành công',
                            message: `Chúc mừng bạn đã nâng cấp lên gói ${req.body.plan}. Gói cước có hiệu lực đến ngày ${profile.planExpiresAt.toLocaleDateString('vi-VN')}.`,
                            type: 'BILLING'
                        });
                    }
                    profile.previousPlan = currentEffectivePlan === 'EXPIRED' ? 'FREE' : currentEffectivePlan;
                }
                else {
                    // Downgrade
                    profile.planExpiresAt = undefined;
                    profile.previousPlan = undefined;
                    profile.isTrial = false;
                }
            }
            const updateData = { ...req.body };
            delete updateData._id;
            delete updateData.id;
            delete updateData.user;
            delete updateData.createdAt;
            delete updateData.updatedAt;
            if (typeof profile.set === 'function') {
                profile.set(updateData);
            }
            else {
                Object.assign(profile, updateData);
            }
            await profile.save();
        }
        const profileObj = profile.toObject ? profile.toObject() : { ...profile };
        profileObj.effectivePlan = (0, boardUtils_1.getEffectivePlan)(profile);
        profileObj.isPlanExpired = (0, boardUtils_1.isPlanExpired)(profile);
        profileObj.isTrial = profile.isTrial || false;
        const trialSetting = await (0, boardUtils_1.getOrCreateTrialSetting)();
        profileObj.isTrialAll = profile.isTrial && profile.plan === 'ALL';
        res.json({ success: true, data: profileObj });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateFarmProfile = updateFarmProfile;
const selectTrialPlan = async (req, res) => {
    try {
        const { packageCode } = req.body;
        if (!['BASIC', 'STANDARD', 'PREMIUM'].includes(packageCode)) {
            return res.status(400).json({ success: false, message: 'Gói không hợp lệ' });
        }
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ nông trại' });
        }
        if (!profile.isTrial) {
            return res.status(400).json({ success: false, message: 'Tài khoản của bạn hiện không trong thời gian dùng thử' });
        }
        if ((0, boardUtils_1.isPlanExpired)(profile)) {
            return res.status(400).json({ success: false, message: 'Thời hạn dùng thử miễn phí của bạn đã kết thúc' });
        }
        profile.plan = packageCode;
        // We KEEP the isTrial=true and the original planExpiresAt!
        await profile.save();
        const expiryDateStr = profile.planExpiresAt ? new Date(profile.planExpiresAt).toLocaleDateString('vi-VN') : '';
        await Notification_1.Notification.create({
            user: req.user?._id,
            title: `Bắt đầu dùng thử gói ${packageCode}`,
            message: `Bạn đã bắt đầu dùng thử gói ${packageCode}. Hạn dùng thử đến ngày ${expiryDateStr}. Chúc bạn có trải nghiệm tuyệt vời và ghi chép mùa vụ thật hiệu quả!`,
            type: 'BILLING'
        });
        const profileObj = profile.toObject ? profile.toObject() : { ...profile };
        profileObj.effectivePlan = (0, boardUtils_1.getEffectivePlan)(profile);
        profileObj.isPlanExpired = (0, boardUtils_1.isPlanExpired)(profile);
        profileObj.isTrial = profile.isTrial;
        res.json({
            success: true,
            message: `Bắt đầu dùng thử theo gói ${packageCode} đã chọn! Hạn dùng đến ngày ${expiryDateStr}.`,
            data: profileObj
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.selectTrialPlan = selectTrialPlan;
const getFarmPerformers = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ trang trại' });
        }
        const list = profile.customPerformers || [];
        res.json({ success: true, performers: list });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getFarmPerformers = getFarmPerformers;
const addFarmPerformer = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ trang trại' });
        }
        const name = (req.body.name || '').trim();
        if (!name || name === 'Chủ hộ' || name === '—') {
            return res.json({ success: true, performers: profile.customPerformers || [] });
        }
        const current = profile.customPerformers || [];
        if (!current.includes(name)) {
            current.push(name);
            profile.customPerformers = current;
            await profile.save();
        }
        res.json({ success: true, performers: profile.customPerformers });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.addFarmPerformer = addFarmPerformer;
/**
 * Lấy thông tin Hợp tác xã mà nông trại đang tham gia
 */
const getFarmCooperative = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile || !profile.cooperative) {
            return res.json({ success: true, data: null });
        }
        const coop = await Cooperative_1.Cooperative.findById(profile.cooperative).populate('manager', 'name phone email');
        if (!coop) {
            profile.cooperative = undefined;
            await profile.save();
            return res.json({ success: true, data: null });
        }
        return res.json({
            success: true,
            data: {
                _id: coop._id,
                name: coop.name,
                code: coop.code,
                address: coop.address,
                contactPhone: coop.contactPhone,
                email: coop.email,
                establishedYear: coop.establishedYear,
                certificationStandards: coop.certificationStandards,
                description: coop.description,
                managerName: coop.manager?.name || 'Ban Quản trị HTX',
                managerPhone: coop.manager?.phone || coop.contactPhone,
                memberCount: coop.members ? coop.members.length : 0,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getFarmCooperative = getFarmCooperative;
/**
 * Nông dân chủ động nhập mã HTX (HTX-xxxx) để gia nhập
 */
const joinCooperative = async (req, res) => {
    try {
        const { coopCode } = req.body;
        if (!coopCode || typeof coopCode !== 'string') {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã Hợp tác xã.' });
        }
        const trimmedCode = coopCode.trim().toUpperCase();
        const coop = await Cooperative_1.Cooperative.findOne({ code: trimmedCode });
        if (!coop) {
            return res.status(404).json({ success: false, message: `Không tìm thấy Hợp tác xã nào có mã "${trimmedCode}". Vui lòng kiểm tra lại mã chính xác!` });
        }
        let profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile) {
            profile = await (0, exports.createDefaultFarmProfile)(req.user?._id);
        }
        if (profile.cooperative && profile.cooperative.toString() === coop._id.toString()) {
            return res.status(400).json({ success: false, message: `Nông trại của bạn đã tham gia Hợp tác xã "${coop.name}" rồi.` });
        }
        // Nếu đang thuộc HTX khác, gỡ khỏi HTX cũ
        if (profile.cooperative) {
            const oldCoop = await Cooperative_1.Cooperative.findById(profile.cooperative);
            if (oldCoop) {
                oldCoop.members = (oldCoop.members || []).filter((m) => m.toString() !== profile._id.toString());
                await oldCoop.save();
            }
        }
        profile.cooperative = coop._id;
        if (!profile.ownerName && req.user?.name) {
            profile.ownerName = req.user.name;
        }
        await profile.save();
        if (!coop.members)
            coop.members = [];
        if (!coop.members.map((id) => id.toString()).includes(profile._id.toString())) {
            coop.members.push(profile._id);
            await coop.save();
        }
        // Gửi thông báo đến Nông dân
        try {
            await Notification_1.Notification.create({
                user: req.user?._id,
                title: 'Gia nhập Hợp tác xã thành công',
                message: `Chúc mừng bạn đã gia nhập thành công Hợp tác xã "${coop.name}" (Mã: ${coop.code}). Cán bộ kỹ thuật HTX hiện có thể đồng hành giám sát mùa vụ và hỗ trợ xuất hồ sơ VietGAP cho nông trại của bạn!`,
                type: 'SYSTEM',
            });
        }
        catch (err) {
            console.warn('Lỗi tạo notification join HTX:', err);
        }
        // Gửi thông báo đến Quản lý HTX
        if (coop.manager) {
            try {
                await Notification_1.Notification.create({
                    user: coop.manager,
                    title: 'Xã viên mới gia nhập HTX',
                    message: `Hộ nông dân "${profile.farmName || req.user?.name || 'Xã viên mới'}" vừa nhập mã "${coop.code}" để gia nhập HTX.`,
                    type: 'SYSTEM',
                });
            }
            catch (err) {
                console.warn('Lỗi tạo notification cho manager HTX:', err);
            }
        }
        return res.json({
            success: true,
            message: `Đã gia nhập thành công Hợp tác xã "${coop.name}"!`,
            data: {
                _id: coop._id,
                name: coop.name,
                code: coop.code,
                address: coop.address,
                contactPhone: coop.contactPhone,
                certificationStandards: coop.certificationStandards,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.joinCooperative = joinCooperative;
/**
 * Nông dân chủ động rời khỏi Hợp tác xã
 */
const leaveCooperative = async (req, res) => {
    try {
        let profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile || !profile.cooperative) {
            return res.status(400).json({ success: false, message: 'Hiện tại nông trại của bạn chưa liên kết với Hợp tác xã nào.' });
        }
        const coop = await Cooperative_1.Cooperative.findById(profile.cooperative);
        const oldName = coop ? coop.name : 'Hợp tác xã';
        profile.cooperative = undefined;
        await profile.save();
        if (coop) {
            coop.members = (coop.members || []).filter((m) => m.toString() !== profile._id.toString());
            await coop.save();
            // Thông báo cho Quản lý HTX
            if (coop.manager) {
                try {
                    await Notification_1.Notification.create({
                        user: coop.manager,
                        title: 'Xã viên đã rời Hợp tác xã',
                        message: `Hộ nông dân "${profile.farmName || req.user?.name || 'Xã viên'}" đã hủy liên kết khỏi HTX.`,
                        type: 'SYSTEM',
                    });
                }
                catch (err) {
                    console.warn('Lỗi tạo thông báo rời HTX cho manager:', err);
                }
            }
        }
        // Thông báo cho nông dân
        try {
            await Notification_1.Notification.create({
                user: req.user?._id,
                title: 'Đã rời khỏi Hợp tác xã',
                message: `Bạn đã hủy liên kết khỏi "${oldName}". Toàn bộ nhật ký canh tác của bạn vẫn được lưu giữ an toàn trên tài khoản độc lập.`,
                type: 'SYSTEM',
            });
        }
        catch (err) {
            console.warn('Lỗi tạo notification rời HTX cho farmer:', err);
        }
        return res.json({
            success: true,
            message: `Đã hủy liên kết khỏi ${oldName} thành công.`,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.leaveCooperative = leaveCooperative;
const removeFarmPerformer = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ trang trại' });
        }
        const rawName = req.params.name || '';
        const name = decodeURIComponent(rawName).trim();
        if (name) {
            profile.customPerformers = (profile.customPerformers || []).filter((p) => p !== name);
            await profile.save();
        }
        res.json({ success: true, performers: profile.customPerformers || [] });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.removeFarmPerformer = removeFarmPerformer;
