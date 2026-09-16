"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const FarmProfile_1 = require("../models/FarmProfile");
const UploadLog_1 = require("../models/UploadLog");
const r2Storage_1 = require("../utils/r2Storage");
const router = express_1.default.Router();
// Memory storage for multer so we can directly stream/upload to Cloudflare R2
const storage = multer_1.default.memoryStorage();
// Check file type
function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png|webp|gif/;
    const extname = filetypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
        return cb(null, true);
    }
    else {
        cb(new Error('Chỉ chấp nhận file định dạng ảnh (jpg, jpeg, png, webp, gif)!'));
    }
}
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});
const IMAGE_LIMITS = {
    BASIC: 50,
    STANDARD: 500,
    PREMIUM: Infinity,
};
// Check image limit middleware
const checkImageLimit = async (req, res, next) => {
    try {
        if (req.user?.role !== 'FARM') {
            return next();
        }
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ trang trại' });
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
                return res.status(403).json({
                    success: false,
                    message: `Gói cước của bạn đã đạt giới hạn upload ${limit} ảnh/tháng. Vui lòng nâng cấp gói cước.`
                });
            }
        }
        req.farmProfile = profile; // Pass to the next handler
        next();
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * Proxy streaming endpoint for R2 files
 * URL: /api/upload/file/*
 */
const handleStreamFile = async (key, res) => {
    try {
        if (!key) {
            return res.status(400).send('Thiếu mã định danh file (Key)');
        }
        const fileData = await (0, r2Storage_1.getFileFromR2)(key);
        res.setHeader('Content-Type', fileData.contentType);
        if (fileData.contentLength) {
            res.setHeader('Content-Length', fileData.contentLength);
        }
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        if (fileData.eTag) {
            res.setHeader('ETag', fileData.eTag);
        }
        fileData.stream.pipe(res);
    }
    catch (err) {
        console.error('Lỗi khi lấy file từ Cloudflare R2:', err);
        if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
            return res.status(404).send('Không tìm thấy file');
        }
        res.status(500).send('Lỗi khi tải file từ Cloudflare R2');
    }
};
router.get('/file/:folder/:filename', async (req, res) => {
    const key = `${req.params.folder}/${req.params.filename}`;
    await handleStreamFile(key, res);
});
router.get('/file/:filename', async (req, res) => {
    const key = req.params.filename;
    await handleStreamFile(key, res);
});
/**
 * POST /api/upload
 * Uploads an image to Cloudflare R2 (or fallback to local disk)
 */
router.post('/', authMiddleware_1.protect, checkImageLimit, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn một hình ảnh' });
    }
    try {
        let imageUrl = '';
        let storageType = 'local';
        if ((0, r2Storage_1.isR2Configured)()) {
            try {
                const r2Result = await (0, r2Storage_1.uploadToR2)(req.file.buffer, req.file.originalname, req.file.mimetype, 'images');
                const host = req.get('host');
                const protocol = req.protocol;
                if (r2Result.url.startsWith('http://') || r2Result.url.startsWith('https://')) {
                    // Direct public R2 URL
                    imageUrl = r2Result.url;
                }
                else {
                    // Internal proxy URL - construct absolute URL for seamless consumption
                    imageUrl = `${protocol}://${host}${r2Result.url}`;
                }
                storageType = 'cloudflare-r2';
            }
            catch (r2Error) {
                console.error('Lỗi upload lên Cloudflare R2, chuyển sang fallback lưu trữ local:', r2Error);
            }
        }
        // Fallback to local storage if R2 was not configured or threw an error
        if (!imageUrl) {
            const uploadDir = path_1.default.join(process.cwd(), 'uploads');
            if (!fs_1.default.existsSync(uploadDir)) {
                fs_1.default.mkdirSync(uploadDir, { recursive: true });
            }
            const filename = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const filePath = path_1.default.join(uploadDir, filename);
            await fs_1.default.promises.writeFile(filePath, req.file.buffer);
            const host = req.get('host');
            const protocol = req.protocol;
            imageUrl = `${protocol}://${host}/uploads/${filename}`;
            storageType = 'local';
        }
        // Log the upload for quota tracking
        if (req.farmProfile) {
            await UploadLog_1.UploadLog.create({
                farmProfile: req.farmProfile._id,
                imageUrl,
            });
        }
        res.json({
            success: true,
            imageUrl,
            storage: storageType,
            message: 'Tải ảnh lên thành công'
        });
    }
    catch (error) {
        console.error('Lỗi upload:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.default = router;
