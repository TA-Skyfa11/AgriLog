import { Request, Response, NextFunction } from 'express';

import { User, IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = (req.session as any)?.userId;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Bạn cần đăng nhập để truy cập' });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi xác thực phiên đăng nhập' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập chức năng này' });
    }
    next();
  };
};
