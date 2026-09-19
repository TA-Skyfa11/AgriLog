import { Request, Response } from 'express';
import axios from 'axios';
import { AuthRequest } from '../middleware/authMiddleware';
import { PaymentAuthRequest } from '../middleware/paymentSecurityMiddleware';
import { PaymentTransaction, PaymentStatus, IPaymentTransaction } from '../models/PaymentTransaction';
import { ServicePackage } from '../models/ServicePackage';
import { FarmProfile } from '../models/FarmProfile';
import { Notification } from '../models/Notification';
import { generateOAuthPaymentToken } from '../utils/paymentSecurity';

const SEPAY_BANK = process.env.SEPAY_BANK || 'MBBank';
const SEPAY_ACC_NUMBER = process.env.SEPAY_ACC_NUMBER || '88020305666999';
const SEPAY_ACC_NAME = process.env.SEPAY_ACC_NAME || 'NGUYEN TUNG ANH';
const SEPAY_API_KEY = process.env.SEPAY_API_KEY || '';

/**
 * Hàm kích hoạt gói cước và hoàn tất giao dịch
 */
export const activatePackage = async (
  transaction: IPaymentTransaction,
  sepayData?: any
): Promise<{ success: boolean; profile?: any; message: string }> => {
  try {
    // 1. Cập nhật trạng thái giao dịch một cách nguyên tử (Atomic locking) để chống race-condition & double-spending
    const updated = await PaymentTransaction.findOneAndUpdate(
      { _id: transaction._id, status: PaymentStatus.PENDING },
      {
        $set: {
          status: PaymentStatus.SUCCESS,
          ...(sepayData && {
            sepayTransactionId: sepayData.id?.toString() || transaction.sepayTransactionId,
            sepayReferenceCode:
              sepayData.referenceCode || sepayData.reference_number || sepayData.referenceNumber || transaction.sepayReferenceCode,
            transferDate: sepayData.transactionDate
              ? new Date(sepayData.transactionDate)
              : sepayData.transaction_date
              ? new Date(sepayData.transaction_date)
              : new Date(),
            rawWebhookData: sepayData,
          }),
        },
      },
      { new: true }
    );

    // Nếu không tìm thấy PENDING nhưng transaction đã SUCCESS từ trước đó
    if (!updated && transaction.status === PaymentStatus.SUCCESS) {
      const existingProfile = await FarmProfile.findOne({ user: transaction.user });
      return {
        success: true,
        profile: existingProfile,
        message: `Giao dịch ${transaction.paymentCode} đã được kích hoạt trước đó (Idempotent).`,
      };
    }

    // 2. Tìm và kích hoạt gói cước trong FarmProfile
    let profile = await FarmProfile.findOne({ user: transaction.user });
    const durationDays = 30; // Chu kỳ gói 30 ngày

    if (!profile) {
      // Nếu chưa có FarmProfile, tạo mới
      profile = await FarmProfile.create({
        user: transaction.user,
        farmName: 'Nông trại của tôi',
        plan: transaction.packageCode as any,
        planExpiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
        previousPlan: 'FREE',
      });
    } else {
      const now = new Date();
      const currentExpire = profile.planExpiresAt ? new Date(profile.planExpiresAt) : null;

      // Nếu đang dùng cùng gói và gói còn hạn => cộng dồn ngày; nếu không => tính từ thời điểm hiện tại
      if (currentExpire && currentExpire > now && profile.plan === transaction.packageCode) {
        profile.planExpiresAt = new Date(currentExpire.getTime() + durationDays * 24 * 60 * 60 * 1000);
      } else {
        profile.previousPlan = profile.plan;
        profile.plan = transaction.packageCode as any;
        profile.planExpiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
      }
      await profile.save();
    }

    // 3. Tạo thông báo trong hệ thống
    const expireFormatted = profile.planExpiresAt
      ? profile.planExpiresAt.toLocaleDateString('vi-VN')
      : `${durationDays} ngày tới`;

    await Notification.create({
      user: transaction.user,
      title: 'Kích hoạt gói dịch vụ thành công',
      message: `Giao dịch ${transaction.paymentCode} thành công! Gói ${transaction.packageName} đã được kích hoạt tự động với thời hạn đến ngày ${expireFormatted}.`,
      type: 'BILLING',
      referenceId: transaction._id.toString(),
    });

    return { success: true, profile, message: 'Kích hoạt gói cước thành công' };
  } catch (error) {
    console.error('Lỗi khi kích hoạt gói cước:', error);
    return { success: false, message: (error as Error).message };
  }
};

/**
 * 1. Khởi tạo giao dịch thanh toán nâng cấp gói qua SePay
 * POST /api/payment/create
 */
export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { packageCode } = req.body;
    if (!packageCode) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn gói dịch vụ' });
    }

    const pkg = await ServicePackage.findOne({
      code: packageCode.toUpperCase(),
      isActive: true,
    });

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: 'Gói dịch vụ không tồn tại hoặc đã ngừng cung cấp',
      });
    }

    // Tìm FarmProfile liên kết (nếu có)
    const farmProfile = await FarmProfile.findOne({ user: req.user?._id });

    // Sinh mã chuyển khoản duy nhất dạng AGRI + 6 chữ số ngẫu nhiên
    let paymentCode = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      attempts++;
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const candidate = `AGRI${randomNum}`;
      const existing = await PaymentTransaction.findOne({ paymentCode: candidate });
      if (!existing) {
        paymentCode = candidate;
        isUnique = true;
      }
    }

    if (!paymentCode) {
      paymentCode = `AGRI${Date.now().toString().slice(-6)}`;
    }

    // Tạo URL ảnh mã QR SePay chuẩn
    const qrUrl = `https://qr.sepay.vn/img?bank=${SEPAY_BANK}&acc=${SEPAY_ACC_NUMBER}&template=compact&amount=${pkg.price}&des=${paymentCode}`;
    const vietqrUrl = `https://vietqr.app/img?bank=${SEPAY_BANK}&acc=${SEPAY_ACC_NUMBER}&template=compact&showinfo=true&holder=${encodeURIComponent(
      SEPAY_ACC_NAME
    )}&amount=${pkg.price}&desc=${paymentCode}`;

    // Thời gian hết hạn lệnh chuyển khoản: 15 phút
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const transaction = await PaymentTransaction.create({
      user: req.user?._id,
      farmProfile: farmProfile?._id,
      packageCode: pkg.code,
      packageName: pkg.name,
      amount: pkg.price,
      paymentCode,
      bankName: SEPAY_BANK,
      accountNumber: SEPAY_ACC_NUMBER,
      accountHolder: SEPAY_ACC_NAME,
      qrUrl,
      status: PaymentStatus.PENDING,
      expiresAt,
    });

    res.status(201).json({
      success: true,
      data: {
        id: transaction._id,
        paymentCode: transaction.paymentCode,
        amount: transaction.amount,
        packageName: transaction.packageName,
        packageCode: transaction.packageCode,
        bankName: SEPAY_BANK,
        bankFullName: 'Ngân hàng TMCP Quân đội (MB)',
        accountNumber: SEPAY_ACC_NUMBER,
        accountHolder: SEPAY_ACC_NAME,
        qrUrl,
        vietqrUrl,
        expiresAt: transaction.expiresAt,
        status: transaction.status,
      },
    });
  } catch (error) {
    console.error('Lỗi khởi tạo thanh toán:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * 2. Kiểm tra trạng thái giao dịch (dành cho polling và kiểm tra chủ động)
 * GET /api/payment/status/:paymentCode
 */
export const getPaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const rawCode = Array.isArray(req.params.paymentCode) ? req.params.paymentCode[0] : req.params.paymentCode;
    const paymentCode = String(rawCode || '').trim();
    if (!paymentCode) {
      return res.status(400).json({ success: false, message: 'Thiếu mã thanh toán' });
    }

    const transaction = await PaymentTransaction.findOne({
      paymentCode: paymentCode.toUpperCase(),
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch' });
    }

    // Nếu đã thành công thì trả về ngay
    if (transaction.status === PaymentStatus.SUCCESS) {
      return res.json({
        success: true,
        data: {
          status: PaymentStatus.SUCCESS,
          transaction,
          message: 'Giao dịch đã hoàn tất và kích hoạt gói cước thành công',
        },
      });
    }

    // Nếu đã hết hạn
    if (new Date() > new Date(transaction.expiresAt)) {
      if (transaction.status === PaymentStatus.PENDING) {
        transaction.status = PaymentStatus.EXPIRED;
        await transaction.save();
      }
      return res.json({
        success: true,
        data: {
          status: PaymentStatus.EXPIRED,
          transaction,
          message: 'Lệnh thanh toán đã hết hạn (quá 15 phút)',
        },
      });
    }

    // Nếu đang PENDING và hệ thống có SEPAY_API_KEY:
    // Chủ động tra cứu SePay API v2 để tự động đối soát giao dịch
    if (SEPAY_API_KEY) {
      try {
        const matchingTx = await checkSePayApiForTransaction(transaction);
        if (matchingTx) {
          const activated = await activatePackage(transaction, matchingTx);
          if (activated.success) {
            return res.json({
              success: true,
              data: {
                status: PaymentStatus.SUCCESS,
                transaction,
                message: 'Đã nhận được chuyển khoản qua SePay và tự động kích hoạt gói!',
              },
            });
          }
        }
      } catch (apiErr) {
        console.warn('Tra cứu SePay API thất bại hoặc chưa có giao dịch:', (apiErr as Error).message);
      }
    }

    // Vẫn đang chờ
    res.json({
      success: true,
      data: {
        status: transaction.status,
        transaction,
        message: 'Đang chờ nhận tiền chuyển khoản...',
      },
    });
  } catch (error) {
    console.error('Lỗi kiểm tra trạng thái thanh toán:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * Hàm tra cứu giao dịch khớp từ SePay API v2 hoặc v1
 */
async function checkSePayApiForTransaction(transaction: IPaymentTransaction): Promise<any | null> {
  if (!SEPAY_API_KEY) return null;

  try {
    // 1. Thử gọi SePay API v2 với bộ lọc nội dung giao dịch
    const v2Url = `https://userapi.sepay.vn/v2/transactions?transaction_content=${encodeURIComponent(
      transaction.paymentCode
    )}`;

    const v2Res = await axios.get(v2Url, {
      headers: {
        Authorization: `Bearer ${SEPAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });

    const v2Data = v2Res.data?.data || v2Res.data?.transactions;
    if (Array.isArray(v2Data) && v2Data.length > 0) {
      for (const item of v2Data) {
        const content = (item.transaction_content || item.content || '').toUpperCase();
        const amountIn = Number(item.amount_in || item.transferAmount || item.transfer_amount || 0);

        if (content.includes(transaction.paymentCode.toUpperCase()) && amountIn >= transaction.amount) {
          return item;
        }
      }
    }
  } catch (err) {
    // Thử fallback sang v1 nếu v2 lỗi
    try {
      const v1Url = `https://my.sepay.vn/userapi/transactions/list?account_number=${SEPAY_ACC_NUMBER}&limit=20`;
      const v1Res = await axios.get(v1Url, {
        headers: {
          Authorization: `Bearer ${SEPAY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      const list = v1Res.data?.transactions;
      if (Array.isArray(list)) {
        for (const item of list) {
          const content = (item.transaction_content || item.content || '').toUpperCase();
          const amountIn = Number(item.amount_in || item.transferAmount || 0);

          if (content.includes(transaction.paymentCode.toUpperCase()) && amountIn >= transaction.amount) {
            return item;
          }
        }
      }
    } catch (v1Err) {
      // Bỏ qua lỗi fallback
    }
  }

  return null;
}

/**
 * 3. Webhook tiếp nhận thông báo biến động số dư từ SePay
 * POST /api/payment/sepay-webhook
 * Đã được bảo vệ qua middleware verifyPaymentWebhookAuth (API Key, HMAC-SHA256, hoặc OAuth 2.0)
 */
export const sepayWebhook = async (req: PaymentAuthRequest, res: Response) => {
  try {
    // SePay yêu cầu luôn trả về HTTP 200 kèm {"success": true}
    const data = req.body;
    console.log(
      `--- Nhận SePay Webhook [Auth Method: ${req.paymentAuth?.method || 'NONE'}] ---`,
      JSON.stringify(data)
    );

    const {
      id,
      gateway,
      transactionDate,
      accountNumber,
      code,
      content,
      transferType,
      transferAmount,
      referenceCode,
    } = data;

    // Chỉ xử lý giao dịch tiền vào (transferType = 'in')
    if (transferType && transferType !== 'in') {
      return res.status(200).json({ success: true, message: 'Bỏ qua giao dịch tiền ra' });
    }

    // Kiểm tra tài khoản nhận
    if (accountNumber && accountNumber !== SEPAY_ACC_NUMBER) {
      console.warn(`Giao dịch không thuộc tài khoản cấu hình: ${accountNumber}`);
      return res.status(200).json({ success: true, message: 'Tài khoản không khớp' });
    }

    // Chống xử lý trùng lặp (Idempotency) theo ID SePay
    if (id) {
      const existing = await PaymentTransaction.findOne({
        sepayTransactionId: id.toString(),
        status: PaymentStatus.SUCCESS,
      });
      if (existing) {
        console.log(`Giao dịch SePay ID ${id} đã được xử lý trước đó.`);
        return res.status(200).json({ success: true, message: 'Giao dịch đã được xử lý trước đó' });
      }
    }

    // Quét mã thanh toán AGRIxxxxxx trong nội dung chuyển khoản
    const fullText = `${content || ''} ${code || ''}`.toUpperCase();
    const match = fullText.match(/AGRI\d{4,8}/i);

    if (!match) {
      console.log('Không tìm thấy mã AGRIxxxxxx trong nội dung chuyển khoản:', fullText);
      return res.status(200).json({
        success: true,
        message: 'Không tìm thấy mã thanh toán trong nội dung chuyển khoản',
      });
    }

    const paymentCode = match[0].toUpperCase();
    console.log(`Tìm thấy mã thanh toán từ Webhook: ${paymentCode}`);

    // Tìm đơn thanh toán tương ứng
    const transaction = await PaymentTransaction.findOne({
      paymentCode,
      status: PaymentStatus.PENDING,
    });

    if (!transaction) {
      console.log(`Không có giao dịch PENDING nào khớp với mã: ${paymentCode}`);
      return res.status(200).json({
        success: true,
        message: `Không có giao dịch PENDING khớp mã ${paymentCode}`,
      });
    }

    // Kiểm tra số tiền chuyển
    const receivedAmount = Number(transferAmount);
    if (receivedAmount < transaction.amount) {
      console.warn(`Số tiền nhận (${receivedAmount}) nhỏ hơn số tiền gói (${transaction.amount})`);
      // Lưu lại thông tin lỗi hoặc cập nhật trạng thái
      transaction.rawWebhookData = data;
      await transaction.save();
      return res.status(200).json({
        success: true,
        message: 'Số tiền thanh toán không đủ so với giá gói dịch vụ',
      });
    }

    // Kích hoạt gói dịch vụ tự động
    const activationResult = await activatePackage(transaction, data);
    console.log(`Kích hoạt thành công gói cước cho user qua Webhook:`, activationResult);

    return res.status(200).json({
      success: true,
      message: 'Giao dịch SePay hợp lệ và đã kích hoạt gói cước thành công',
    });
  } catch (error) {
    console.error('Lỗi khi xử lý SePay Webhook:', error);
    // Vẫn trả về 200 để SePay không retry dồn dập khi có lỗi ứng dụng
    return res.status(200).json({ success: false, message: (error as Error).message });
  }
};

/**
 * 4. Mô phỏng thanh toán thành công (Dành cho Dev/Test môi trường local)
 * POST /api/payment/dev-simulate
 */
export const simulatePaymentSuccess = async (req: AuthRequest, res: Response) => {
  try {
    const { paymentCode } = req.body;
    if (!paymentCode) {
      return res.status(400).json({ success: false, message: 'Thiếu paymentCode' });
    }

    const transaction = await PaymentTransaction.findOne({
      paymentCode: paymentCode.toUpperCase(),
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch' });
    }

    if (transaction.status === PaymentStatus.SUCCESS) {
      return res.json({ success: true, message: 'Giao dịch này đã thành công trước đó' });
    }

    const fakeSepayData = {
      id: `DEV_${Date.now()}`,
      gateway: 'MBBank',
      transactionDate: new Date().toISOString(),
      accountNumber: SEPAY_ACC_NUMBER,
      content: `${paymentCode} DEV TEST CHUYEN KHOAN`,
      transferType: 'in',
      transferAmount: transaction.amount,
      referenceCode: `MB_${Math.floor(10000000 + Math.random() * 90000000)}`,
    };

    const result = await activatePackage(transaction, fakeSepayData);

    res.json({
      success: true,
      data: {
        transaction,
        profile: result.profile,
      },
      message: 'Mô phỏng thanh toán SePay thành công! Gói cước đã được kích hoạt.',
    });
  } catch (error) {
    console.error('Lỗi khi mô phỏng thanh toán:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * 5. Lấy lịch sử giao dịch nạp / nâng cấp gói của người dùng
 * GET /api/payment/history
 */
export const getUserPaymentHistory = async (req: AuthRequest, res: Response) => {
  try {
    const history = await PaymentTransaction.find({ user: req.user?._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * 6. Cấp phát OAuth 2.0 Access Token (Client Credentials Grant - RFC 6749)
 * POST /api/payment/oauth/token
 */
export const issueOAuthToken = async (req: Request, res: Response) => {
  try {
    const grantType = req.body?.grant_type || req.query?.grant_type;
    if (grantType !== 'client_credentials') {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Hệ thống chỉ hỗ trợ grant_type="client_credentials"',
      });
    }

    // Trích xuất client_id và client_secret từ body, query hoặc Basic Auth header
    let clientId = req.body?.client_id || req.query?.client_id;
    let clientSecret = req.body?.client_secret || req.query?.client_secret;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Basic ')) {
      try {
        const credentials = Buffer.from(authHeader.substring(6), 'base64').toString('utf8');
        const [id, secret] = credentials.split(':');
        if (id && secret) {
          clientId = id;
          clientSecret = secret;
        }
      } catch {
        // Bỏ qua lỗi parse Basic header
      }
    }

    if (!clientId || !clientSecret) {
      return res.status(400).json({
        error: 'invalid_client',
        error_description: 'Yêu cầu cung cấp đầy đủ client_id và client_secret',
      });
    }

    const tokenResult = generateOAuthPaymentToken(clientId, clientSecret);
    if (!tokenResult) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Thông tin xác thực client_id hoặc client_secret không chính xác',
      });
    }

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    return res.status(200).json(tokenResult);
  } catch (error) {
    console.error('Lỗi khi cấp phát OAuth 2.0 token:', error);
    return res.status(500).json({
      error: 'server_error',
      error_description: (error as Error).message,
    });
  }
};

