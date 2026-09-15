import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect, AuthRequest } from '../middleware/authMiddleware';
import { FarmProfile } from '../models/FarmProfile';
import { UploadLog } from '../models/UploadLog';
import { isR2Configured, uploadToR2, getFileFromR2 } from '../utils/r2Storage';

const router = express.Router();

// Memory storage for multer so we can directly stream/upload to Cloudflare R2
const storage = multer.memoryStorage();

// Check file type
function checkFileType(file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const filetypes = /jpg|jpeg|png|webp|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file định dạng ảnh (jpg, jpeg, png, webp, gif)!'));
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

const IMAGE_LIMITS: Record<string, number> = {
  BASIC: 50,
  STANDARD: 500,
  PREMIUM: Infinity,
};

interface UploadRequest extends AuthRequest {
  farmProfile?: any;
}

// Check image limit middleware
const checkImageLimit = async (req: UploadRequest, res: express.Response, next: express.NextFunction) => {
  try {
    if (req.user?.role !== 'FARM') {
      return next();
    }

    const profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ trang trại' });
    }
    
    const normalizedPlan = (profile.plan || 'BASIC').toUpperCase();
    const limit = IMAGE_LIMITS[normalizedPlan] || 50;
    
    if (limit !== Infinity) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const count = await UploadLog.countDocuments({
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
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * Proxy streaming endpoint for R2 files
 * URL: /api/upload/file/*
 */
const handleStreamFile = async (key: string, res: express.Response) => {
  try {
    if (!key) {
      return res.status(400).send('Thiếu mã định danh file (Key)');
    }

    const fileData = await getFileFromR2(key);
    res.setHeader('Content-Type', fileData.contentType);
    if (fileData.contentLength) {
      res.setHeader('Content-Length', fileData.contentLength);
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    if (fileData.eTag) {
      res.setHeader('ETag', fileData.eTag);
    }
    fileData.stream.pipe(res);
  } catch (err: any) {
    console.error('Lỗi khi lấy file từ Cloudflare R2:', err);
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      return res.status(404).send('Không tìm thấy file');
    }
    res.status(500).send('Lỗi khi tải file từ Cloudflare R2');
  }
};

router.get('/file/:folder/:filename', async (req: express.Request, res: express.Response) => {
  const key = `${req.params.folder}/${req.params.filename}`;
  await handleStreamFile(key, res);
});

router.get('/file/:filename', async (req: express.Request, res: express.Response) => {
  const key = req.params.filename as string;
  await handleStreamFile(key, res);
});

/**
 * POST /api/upload
 * Uploads an image to Cloudflare R2 (or fallback to local disk)
 */
router.post('/', protect, checkImageLimit, upload.single('image'), async (req: UploadRequest, res: express.Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn một hình ảnh' });
  }
  
  try {
    let imageUrl = '';
    let storageType = 'local';

    if (isR2Configured()) {
      try {
        const r2Result = await uploadToR2(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          'images'
        );

        const host = req.get('host');
        const protocol = req.protocol;

        if (r2Result.url.startsWith('http://') || r2Result.url.startsWith('https://')) {
          // Direct public R2 URL
          imageUrl = r2Result.url;
        } else {
          // Internal proxy URL - construct absolute URL for seamless consumption
          imageUrl = `${protocol}://${host}${r2Result.url}`;
        }
        storageType = 'cloudflare-r2';
      } catch (r2Error) {
        console.error('Lỗi upload lên Cloudflare R2, chuyển sang fallback lưu trữ local:', r2Error);
      }
    }

    // Fallback to local storage if R2 was not configured or threw an error
    if (!imageUrl) {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filename = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = path.join(uploadDir, filename);
      await fs.promises.writeFile(filePath, req.file.buffer);

      const host = req.get('host');
      const protocol = req.protocol;
      imageUrl = `${protocol}://${host}/uploads/${filename}`;
      storageType = 'local';
    }
    
    // Log the upload for quota tracking
    if (req.farmProfile) {
      await UploadLog.create({
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
  } catch (error) {
    console.error('Lỗi upload:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

export default router;
