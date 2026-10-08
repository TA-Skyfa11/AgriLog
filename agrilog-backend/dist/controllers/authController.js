"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleAuth = exports.resetPassword = exports.forgotPassword = exports.getLoginHistory = exports.toggleAdminReset = exports.changePassword = exports.getMe = exports.logout = exports.verifyMfa = exports.login = exports.register = void 0;
require("express-session");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const LoginHistory_1 = require("../models/LoginHistory");
const Notification_1 = require("../models/Notification");
const CompanyProfile_1 = require("../models/CompanyProfile");
const farmProfileController_1 = require("./farmProfileController");
const db_1 = require("../config/db");
const crypto_1 = __importDefault(require("crypto"));
const emailService_1 = require("../utils/emailService");
const generateToken = (userId) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is not configured');
    }
    return jsonwebtoken_1.default.sign({ id: userId }, secret, {
        expiresIn: '30d',
    });
};
const register = async (req, res) => {
    try {
        const { email, password, role: requestedRole, name } = req.body;
        const userExists = await User_1.User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Email này đã được đăng ký' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        // Only allow FARM or COMPANY from registration, never ADMIN
        const allowedRoles = [User_1.Role.FARM, User_1.Role.COMPANY];
        const finalRole = allowedRoles.includes(requestedRole) ? requestedRole : User_1.Role.FARM;
        const user = await User_1.User.create({
            name,
            email,
            passwordHash,
            role: finalRole,
        });
        // Create notification for admin
        const admin = await User_1.User.findOne({ role: User_1.Role.ADMIN });
        if (admin) {
            await Notification_1.Notification.create({
                user: admin._id,
                title: 'Người dùng mới đăng ký',
                message: `Tài khoản ${email} vừa đăng ký vào hệ thống.`,
                type: 'SYSTEM',
                referenceId: user._id.toString()
            });
        }
        if (req.session) {
            req.session.userId = user._id.toString();
        }
        const token = generateToken(user._id.toString());
        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            token,
            user: {
                id: user._id,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                allowDevPayment: user.allowDevPayment || false,
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();
        const user = await User_1.User.findOne({ email: normalizedEmail });
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
        const isMatch = user.passwordHash ? await bcryptjs_1.default.compare(normalizedPassword, user.passwordHash) : false;
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
        await LoginHistory_1.LoginHistory.create({
            user: user._id,
            ipAddress,
            userAgent
        });
        // Set session
        if (req.session) {
            req.session.userId = user._id.toString();
        }
        const token = generateToken(user._id.toString());
        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            token,
            user: {
                id: user._id,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                allowDevPayment: user.allowDevPayment || false,
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.login = login;
const verifyMfa = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User_1.User.findOne({ email: email.trim().toLowerCase(), role: User_1.Role.ADMIN });
        if (!user || !user.mfaOtp || !user.mfaOtpExpire) {
            return res.status(400).json({ success: false, message: 'Không có yêu cầu xác thực MFA nào.' });
        }
        if (user.mfaOtpExpire < new Date()) {
            return res.status(400).json({ success: false, message: 'Mã xác thực đã hết hạn.' });
        }
        const hashedOtp = crypto_1.default.createHash('sha256').update(otp).digest('hex');
        if (user.mfaOtp !== hashedOtp) {
            return res.status(400).json({ success: false, message: 'Mã xác thực không đúng.' });
        }
        user.mfaOtp = undefined;
        user.mfaOtpExpire = undefined;
        await user.save();
        if (req.session) {
            req.session.userId = user._id.toString();
        }
        const token = generateToken(user._id.toString());
        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                allowDevPayment: user.allowDevPayment || false,
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.verifyMfa = verifyMfa;
const logout = (req, res) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Lỗi khi đăng xuất' });
            }
            res.clearCookie('connect.sid');
            res.json({ success: true, message: 'Đăng xuất thành công' });
        });
    }
    else {
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Đăng xuất thành công' });
    }
};
exports.logout = logout;
const getMe = async (req, res) => {
    try {
        const user = await User_1.User.findById(req.user?._id).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMe = getMe;
const changePassword = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
        }
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
        }
        const isMatch = user.passwordHash ? await bcryptjs_1.default.compare(currentPassword.trim(), user.passwordHash) : false;
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(newPassword.trim(), salt);
        user.passwordHash = passwordHash;
        await user.save();
        res.json({ success: true, message: 'Đổi mật khẩu thành công' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.changePassword = changePassword;
const toggleAdminReset = async (req, res) => {
    try {
        const { allow } = req.body;
        const user = await User_1.User.findById(req.user?._id);
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.toggleAdminReset = toggleAdminReset;
const getLoginHistory = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const history = await LoginHistory_1.LoginHistory.find({ user: userId }).sort({ createdAt: -1 }).limit(10);
        res.json({ success: true, data: history });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLoginHistory = getLoginHistory;
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User_1.User.findOne({ email: email.trim().toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Email chưa được đăng ký trong hệ thống' });
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const resetTokenHash = crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
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
            await (0, emailService_1.sendEmail)({
                to: user.email,
                subject: 'AgriLog - Đặt lại mật khẩu',
                html: message
            });
            res.status(200).json({ success: true, message: 'Email khôi phục mật khẩu đã được gửi' });
        }
        catch (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            return res.status(500).json({ success: false, message: 'Không thể gửi email, vui lòng thử lại sau' });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const resetPasswordToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
        const user = await User_1.User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        user.passwordHash = await bcryptjs_1.default.hash(newPassword, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        res.status(200).json({ success: true, message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.resetPassword = resetPassword;
const googleAuth = async (req, res) => {
    try {
        let { email, name, googleId, avatar, role: requestedRole, supabaseToken, idToken } = req.body;
        // 1. Verify Supabase token if provided
        if (supabaseToken) {
            try {
                const { data, error } = await db_1.supabase.auth.getUser(supabaseToken);
                if (!error && data?.user) {
                    const sUser = data.user;
                    email = sUser.email || email;
                    googleId = sUser.id || googleId;
                    name = sUser.user_metadata?.full_name || sUser.user_metadata?.name || name;
                    avatar = sUser.user_metadata?.avatar_url || sUser.user_metadata?.picture || avatar;
                }
            }
            catch (tokenErr) {
                console.warn('Supabase token verification failed, using payload info:', tokenErr);
            }
        }
        // 2. Decode Google ID token if provided
        if (idToken && !email) {
            try {
                const decoded = jsonwebtoken_1.default.decode(idToken);
                if (decoded && decoded.email) {
                    email = decoded.email;
                    googleId = decoded.sub || googleId;
                    name = decoded.name || name;
                    avatar = decoded.picture || avatar;
                }
            }
            catch (jwtErr) {
                console.warn('Google idToken decode error:', jwtErr);
            }
        }
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email là bắt buộc để đăng nhập hoặc đăng ký bằng Google' });
        }
        const normalizedEmail = email.trim().toLowerCase();
        // 3. Check existing user by email or googleId
        let user = await User_1.User.findOne({ email: normalizedEmail });
        if (!user && googleId) {
            user = await User_1.User.findOne({ googleId });
        }
        let isNewUser = false;
        if (user) {
            // Check lockout & active status
            if (user.lockUntil && user.lockUntil > new Date()) {
                return res.status(403).json({
                    success: false,
                    message: 'Tài khoản đang bị khóa tạm thời. Vui lòng thử lại sau 15 phút.',
                });
            }
            if (!user.isActive) {
                return res.status(403).json({ success: false, message: 'Tài khoản đã bị vô hiệu hóa' });
            }
            let modified = false;
            if (googleId && user.googleId !== googleId) {
                user.googleId = googleId;
                modified = true;
            }
            if (avatar && user.avatar !== avatar) {
                user.avatar = avatar;
                modified = true;
            }
            if (name && (!user.name || user.name === user.email)) {
                user.name = name;
                modified = true;
            }
            if (user.loginAttempts > 0) {
                user.loginAttempts = 0;
                user.lockUntil = undefined;
                modified = true;
            }
            if (modified) {
                await user.save();
            }
        }
        else {
            // 4. Create new user (Google Signup)
            isNewUser = true;
            const allowedRoles = [User_1.Role.FARM, User_1.Role.COMPANY];
            const finalRole = allowedRoles.includes(requestedRole) ? requestedRole : User_1.Role.FARM;
            const randomPassword = crypto_1.default.randomBytes(32).toString('hex');
            const salt = await bcryptjs_1.default.genSalt(10);
            const passwordHash = await bcryptjs_1.default.hash(randomPassword, salt);
            user = await User_1.User.create({
                name: name || normalizedEmail.split('@')[0],
                email: normalizedEmail,
                passwordHash,
                role: finalRole,
                googleId,
                avatar,
                authProvider: 'google',
                isActive: true,
            });
            // Automatically create corresponding profile
            if (finalRole === User_1.Role.FARM) {
                try {
                    await (0, farmProfileController_1.createDefaultFarmProfile)(user._id, {
                        farmName: name ? `Nông trại của ${name}` : 'Nông trại của tôi',
                    });
                }
                catch (profileErr) {
                    console.warn('Lỗi tạo FarmProfile mặc định cho Google user:', profileErr);
                }
            }
            else if (finalRole === User_1.Role.COMPANY) {
                try {
                    await CompanyProfile_1.CompanyProfile.create({
                        user: user._id,
                        companyName: name ? `Doanh nghiệp của ${name}` : 'Doanh nghiệp của tôi',
                    });
                }
                catch (profileErr) {
                    console.warn('Lỗi tạo CompanyProfile mặc định cho Google user:', profileErr);
                }
            }
            // Notification for admin
            try {
                const admin = await User_1.User.findOne({ role: User_1.Role.ADMIN });
                if (admin) {
                    await Notification_1.Notification.create({
                        user: admin._id,
                        title: 'Người dùng mới đăng ký qua Google',
                        message: `Tài khoản Google ${normalizedEmail} (${finalRole}) vừa tham gia hệ thống.`,
                        type: 'SYSTEM',
                        referenceId: user._id.toString(),
                    });
                }
            }
            catch (notifErr) {
                console.warn('Lỗi tạo notification admin:', notifErr);
            }
        }
        // 5. Record login history
        try {
            const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            await LoginHistory_1.LoginHistory.create({
                user: user._id,
                ipAddress,
                userAgent,
            });
        }
        catch (histErr) {
            console.warn('Lỗi ghi LoginHistory:', histErr);
        }
        // 6. Set session and generate AgriLog JWT token
        if (req.session) {
            req.session.userId = user._id.toString();
        }
        const token = generateToken(user._id.toString());
        return res.status(isNewUser ? 201 : 200).json({
            success: true,
            message: isNewUser ? 'Đăng ký bằng Google thành công' : 'Đăng nhập bằng Google thành công',
            token,
            user: {
                id: user._id,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                authProvider: user.authProvider || 'google',
                allowDevPayment: user.allowDevPayment || false,
            },
            isNewUser,
        });
    }
    catch (error) {
        console.error('Google Auth Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.googleAuth = googleAuth;
