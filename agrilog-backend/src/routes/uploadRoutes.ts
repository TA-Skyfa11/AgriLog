import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Set up storage engine
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Check file type
function checkFileType(file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images only!'));
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

import { AuthRequest } from '../middleware/authMiddleware';
import { FarmProfile } from '../models/FarmProfile';
import { UploadLog } from '../models/UploadLog';

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
    const profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Farm profile not found' });
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
        return res.status(403).json({ success: false, message: `Gói cước của bạn đã đạt giới hạn upload ${limit} ảnh/tháng. Vui lòng nâng cấp gói cước.` });
      }
    }
    
    req.farmProfile = profile; // Pass to the next handler
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

router.post('/', protect, checkImageLimit, upload.single('image'), async (req: UploadRequest, res: express.Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn một hình ảnh' });
  }
  
  try {
    const imageUrl = `/${req.file.path.replace(/\\/g, '/')}`;
    
    // Log the upload
    if (req.farmProfile) {
      await UploadLog.create({
        farmProfile: req.farmProfile._id,
        imageUrl,
      });
    }

    res.json({ success: true, imageUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

export default router;
