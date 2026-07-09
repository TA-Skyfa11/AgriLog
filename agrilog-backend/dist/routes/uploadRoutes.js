"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Set up storage engine
const storage = multer_1.default.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
// Check file type
function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png|webp/;
    const extname = filetypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
        return cb(null, true);
    }
    else {
        cb(new Error('Images only!'));
    }
}
const upload = (0, multer_1.default)({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});
const FarmProfile_1 = require("../models/FarmProfile");
const UploadLog_1 = require("../models/UploadLog");
const IMAGE_LIMITS = {
    BASIC: 50,
    STANDARD: 500,
    PREMIUM: Infinity,
};
// Check image limit middleware
const checkImageLimit = async (req, res, next) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Farm profile not found' });
        }
        const normalizedPlan = (profile.plan || 'BASIC').toUpperCase();
        const limit = IMAGE_LIMITS[normalizedPlan] || 50;
        if (limit !== Infinity) {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const count = await UploadLog_1.UploadLog.countDocuments({
                farmProfile: profile._id,
                createdAt: { $gte: startOfMonth },
            });
            if (count >= limit) {
                return res.status(403).json({ success: false, message: `Gói cước của bạn đã đạt giới hạn upload ${limit} ảnh/tháng. Vui lòng nâng cấp gói cước.` });
            }
        }
        req.farmProfile = profile; // Pass to the next handler
        next();
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
router.post('/', authMiddleware_1.protect, checkImageLimit, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn một hình ảnh' });
    }
    try {
        const imageUrl = `/${req.file.path.replace(/\\/g, '/')}`;
        // Log the upload
        if (req.farmProfile) {
            await UploadLog_1.UploadLog.create({
                farmProfile: req.farmProfile._id,
                imageUrl,
            });
        }
        res.json({ success: true, imageUrl });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.default = router;
