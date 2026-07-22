import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import bcrypt from 'bcryptjs';
import { User, Role } from '../models/User';
import { LoginHistory } from '../models/LoginHistory';
import { Notification } from '../models/Notification';
import crypto from 'crypto';
import { sendEmail } from '../utils/emailService';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, role: requestedRole, name } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email này đã được đăng ký' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Only allow FARM or COMPANY from registration, never ADMIN
    const allowedRoles = [Role.FARM, Role.COMPANY];
    const finalRole = allowedRoles.includes(requestedRole) ? requestedRole : Role.FARM;

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: finalRole,
    });

    // Create notification for admin
    const admin = await User.findOne({ role: Role.ADMIN });
    if (admin) {
      await Notification.create({
        user: admin._id,
        title: 'Người dùng mới đăng ký',
        message: `Tài khoản ${email} vừa đăng ký vào hệ thống.`,
        type: 'SYSTEM',
        referenceId: user._id.toString()
      });
    }

    (req.session as any).userId = user._id.toString();

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Sai email hoặc mật khẩu' });
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(403).json({ success: false, message: 'Tài khoản đang bị khóa tạm thời. Vui lòng thử lại sau 15 phút.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa' });
    }

    const normalizedPassword = password?.trim() || '';
    const isMatch = await bcrypt.compare(normalizedPassword, user.passwordHash);
    
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // lock for 15 minutes
      }
      await user.save();
      return res.status(401).json({ success: false, message: 'Sai email hoặc mật khẩu' });
    }

    // Reset login attempts on success
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Log login history
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    await LoginHistory.create({
      user: user._id,
      ipAddress,
      userAgent
    });

    // MFA check for Admin
    if (user.role === Role.ADMIN) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
      user.mfaOtp = crypto.createHash('sha256').update(otp).digest('hex');
      user.mfaOtpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await user.save();

      await sendEmail({
        to: user.email,
        subject: 'AgriLog - Mã xác thực đăng nhập (MFA)',
        html: `<h1>Mã xác thực của bạn là: <strong>${otp}</strong></h1><p>Mã này sẽ hết hạn sau 10 phút.</p>`
      });

      return res.json({
        success: true,
        message: 'Yêu cầu MFA. Vui lòng kiểm tra email để lấy mã xác thực.',
        requiresMfa: true,
        email: user.email
      });
    }

    // Set session
    (req.session as any).userId = user._id.toString();

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const verifyMfa = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email: email.trim().toLowerCase(), role: Role.ADMIN });
    
    if (!user || !user.mfaOtp || !user.mfaOtpExpire) {
      return res.status(400).json({ success: false, message: 'Không có yêu cầu xác thực MFA nào.' });
    }

    if (user.mfaOtpExpire < new Date()) {
      return res.status(400).json({ success: false, message: 'Mã xác thực đã hết hạn.' });
    }

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    if (user.mfaOtp !== hashedOtp) {
      return res.status(400).json({ success: false, message: 'Mã xác thực không đúng.' });
    }

    user.mfaOtp = undefined;
    user.mfaOtpExpire = undefined;
    await user.save();

    (req.session as any).userId = user._id.toString();

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const logout = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Lỗi khi đăng xuất' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Đăng xuất thành công' });
  });
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
    }

    const isMatch = await bcrypt.compare(currentPassword.trim(), user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword.trim(), salt);
    
    user.passwordHash = passwordHash;
    await user.save();

    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const toggleAdminReset = async (req: AuthRequest, res: Response) => {
  try {
    const { allow } = req.body;

    const user = await User.findById(req.user?._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    user.allowAdminReset = !!allow;
    await user.save();

    res.json({
      success: true,
      message: allow ? 'Đã cho phép Admin đặt lại mật khẩu' : 'Đã tắt quyền Admin đặt lại mật khẩu',
      data: { allowAdminReset: user.allowAdminReset }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getLoginHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const history = await LoginHistory.find({ user: userId }).sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Email chưa được đăng ký trong hệ thống' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await user.save();

    // Generate reset URL (Change localhost to frontend URL in production)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const message = `
      <h1>Yêu cầu đặt lại mật khẩu</h1>
      <p>Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản AgriLog.</p>
      <p>Vui lòng click vào đường dẫn dưới đây để đặt lại mật khẩu:</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
      <p>Đường dẫn này sẽ hết hạn sau 15 phút.</p>
      <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'AgriLog - Đặt lại mật khẩu',
        html: message
      });
      res.status(200).json({ success: true, message: 'Email khôi phục mật khẩu đã được gửi' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ success: false, message: 'Không thể gửi email, vui lòng thử lại sau' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    res.status(200).json({ success: true, message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
