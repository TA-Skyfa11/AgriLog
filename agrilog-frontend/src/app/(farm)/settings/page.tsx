/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/settings.module.css';
import { User, Lock, Bell, Globe, Layout, Shield, Save, Eye, EyeOff, Check, Building2, Users, CheckCircle2, AlertTriangle, LogOut, Copy, ArrowRight } from 'lucide-react';
import { useAppContext } from '@/context/AppProvider';
import { toast } from 'react-hot-toast';
import { requestPushPermission } from '@/lib/onesignal';


export default function SettingsPage() {
  const router = useRouter();

  // Guard: If not a farmer account, immediately redirect to their dedicated settings page
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.role === 'COOPERATIVE') {
          router.replace('/cooperative/settings');
          return;
        } else if (u.role === 'COMPANY') {
          router.replace('/company/settings');
          return;
        } else if (u.role === 'ADMIN') {
          router.replace('/admin/settings');
          return;
        }
      }
    } catch (e) {}
  }, [router]);
  const [formData, setFormData] = useState({
    farmName: '',
    address: '',
    areaSqm: '',
    mainCropType: '',
    contactPhone: '',
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('account');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notifSettings, setNotifSettings] = useState({
    push: true,
    email: false,
    tasks: true,
    billing: true
  });
  const { theme, setTheme, language, setLanguage, timezone, setTimezone, t } = useAppContext();
  const [loginHistory, setLoginHistory] = useState<any[]>([]);

  // Password tab state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Security tab state
  const [allowAdminReset, setAllowAdminReset] = useState(true);
  const [togglingReset, setTogglingReset] = useState(false);

  // Cooperative tab state
  const [coopData, setCoopData] = useState<any>(null);
  const [coopLoading, setCoopLoading] = useState(false);
  const [coopCodeInput, setCoopCodeInput] = useState('');
  const [joiningCoop, setJoiningCoop] = useState(false);
  const [leavingCoop, setLeavingCoop] = useState(false);

  const loadProfile = async () => {
    try {
      const [profileRes, meRes] = await Promise.all([
        fetchAPI('/farm/profile').catch(() => ({ success: false })),
        fetchAPI('/auth/me').catch(() => ({ success: false })),
      ]);

      if (profileRes.success && profileRes.data) {
        setFormData({
          farmName: profileRes.data.farmName || '',
          address: profileRes.data.address || '',
          areaSqm: profileRes.data.areaSqm || '',
          mainCropType: profileRes.data.mainCropType || '',
          contactPhone: profileRes.data.contactPhone || '',
          email: meRes.success ? meRes.data.email : '',
        });

        if (profileRes.data.notificationPreferences) {
          setNotifSettings(profileRes.data.notificationPreferences);
        }
      } else if (meRes.success) {
        setFormData(prev => ({ ...prev, email: meRes.data.email }));
      }

      if (meRes.success && meRes.data) {
        setAllowAdminReset(meRes.data.allowAdminReset !== false);
      }
      
      const historyRes = await fetchAPI('/auth/login-history');
      if (historyRes.success && historyRes.data) {
        setLoginHistory(historyRes.data);
      }
    } catch (error: any) {
      console.log('No profile yet or error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadCooperative();
  }, []);


  const loadCooperative = async () => {
    try {
      setCoopLoading(true);
      const res = await fetchAPI('/farm/cooperative');
      if (res.success) {
        setCoopData(res.data);
      }
    } catch (err) {
      console.warn('Lỗi tải thông tin HTX:', err);
    } finally {
      setCoopLoading(false);
    }
  };

  const handleJoinCooperative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coopCodeInput.trim()) {
      toast.error('Vui lòng nhập mã Hợp tác xã (Ví dụ: HTX-HB01)');
      return;
    }
    try {
      setJoiningCoop(true);
      const res = await fetchAPI('/farm/join-cooperative', {
        method: 'POST',
        body: JSON.stringify({ coopCode: coopCodeInput.trim() }),
      });
      if (res.success) {
        toast.success(res.message || 'Gia nhập Hợp tác xã thành công!');
        setCoopCodeInput('');
        await loadCooperative();
      } else {
        toast.error(res.message || 'Không thể gia nhập Hợp tác xã');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi kết nối khi gia nhập HTX');
    } finally {
      setJoiningCoop(false);
    }
  };

  const handleLeaveCooperative = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn rời khỏi Hợp tác xã này không? Toàn bộ dữ liệu nhật ký canh tác của nông trại vẫn được lưu giữ an toàn.')) {
      return;
    }
    try {
      setLeavingCoop(true);
      const res = await fetchAPI('/farm/leave-cooperative', {
        method: 'POST',
      });
      if (res.success) {
        toast.success('Đã rời khỏi Hợp tác xã thành công!');
        await loadCooperative();
      } else {
        toast.error(res.message || 'Lỗi khi rời HTX');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi kết nối khi rời HTX');
    } finally {
      setLeavingCoop(false);
    }
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await fetchAPI('/farm/profile', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Lỗi khi cập nhật' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword !== confirmNewPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu mới và xác nhận không khớp' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetchAPI('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setMessage({ type: 'success', text: res.message || 'Đổi mật khẩu thành công!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Đổi mật khẩu thất bại' });
    } finally {
      setChangingPassword(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const handleToggleAdminReset = async () => {
    setTogglingReset(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetchAPI('/auth/toggle-admin-reset', {
        method: 'PUT',
        body: JSON.stringify({ allow: !allowAdminReset }),
      });
      setAllowAdminReset(!allowAdminReset);
      setMessage({ type: 'success', text: res.message || 'Cập nhật thành công' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Cập nhật thất bại' });
    } finally {
      setTogglingReset(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  if (loading) return <div>Đang tải thông tin...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Cài đặt</h1>
        <p className={styles.subtitle}>Quản lý tài khoản và tùy chỉnh hệ thống</p>
      </div>

      {message.text && (
        <div className={message.type === 'success' ? styles.alertSuccess : styles.alertError}>
          {message.text}
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.sidebar}>
          <div className={`${styles.navItem} ${activeTab === 'account' ? styles.active : ''}`} onClick={() => setActiveTab('account')}>
            <User size={18} /> Tài khoản
          </div>
          <div className={`${styles.navItem} ${activeTab === 'cooperative' ? styles.active : ''}`} onClick={() => setActiveTab('cooperative')}>
            <Building2 size={18} /> Hợp tác xã liên kết
          </div>
          <div className={`${styles.navItem} ${activeTab === 'password' ? styles.active : ''}`} onClick={() => setActiveTab('password')}>
            <Lock size={18} /> Mật khẩu
          </div>
          <div className={`${styles.navItem} ${activeTab === 'security' ? styles.active : ''}`} onClick={() => setActiveTab('security')}>
            <Shield size={18} /> Bảo mật
          </div>
          {/* Notifications tab hidden per user request */}
          <div className={`${styles.navItem} ${activeTab === 'language' ? styles.active : ''}`} onClick={() => setActiveTab('language')}>
            <Globe size={18} /> Ngôn ngữ
          </div>
          <div className={`${styles.navItem} ${activeTab === 'appearance' ? styles.active : ''}`} onClick={() => setActiveTab('appearance')}>
            <Layout size={18} /> Giao diện
          </div>
        </div>

        <div className={styles.mainPanel}>
          {/* ===== TAB: Tài khoản ===== */}
          {activeTab === 'account' && (
            <>
              <h2 className={styles.panelTitle}>{t('settings.account')}</h2>
              <form onSubmit={handleSubmit}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Tên Nông Trại</label>
                    <input
                      className={styles.input}
                      type="text"
                      name="farmName"
                      value={formData.farmName}
                      onChange={handleChange}
                      placeholder="VD: Nông trại Xanh Tâm"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Email</label>
                    <input
                      className={styles.input}
                      type="email"
                      name="email"
                      value={formData.email}
                      readOnly
                      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-muted)' }}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Số điện thoại</label>
                    <input
                      className={styles.input}
                      type="text"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      placeholder="VD: 0912 345 678"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Địa chỉ</label>
                    <input
                      className={styles.input}
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="VD: Xã A, Huyện B, Tỉnh C"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Diện tích tổng (m²)</label>
                    <input
                      className={styles.input}
                      type="number"
                      name="areaSqm"
                      value={formData.areaSqm}
                      onChange={handleChange}
                      placeholder="VD: 10000"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Cây trồng chính</label>
                    <input
                      className={styles.input}
                      type="text"
                      name="mainCropType"
                      value={formData.mainCropType}
                      onChange={handleChange}
                      placeholder="VD: Lúa, Sầu riêng..."
                    />
                  </div>

                  <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                    <label className={styles.label}>Vai trò tài khoản</label>
                    <input
                      className={styles.input}
                      type="text"
                      value="Quản lý nông trại (Chủ sở hữu)"
                      readOnly
                      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-muted)' }}
                    />
                  </div>
                </div>

                <button type="submit" className={styles.button} disabled={saving}>
                  <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </form>
            </>
          )}

          {/* ===== TAB: Hợp tác xã liên kết ===== */}
          {activeTab === 'cooperative' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 className={styles.panelTitle} style={{ marginBottom: '0.25rem' }}>Hợp tác xã liên kết</h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
                    Liên kết nông trại vào Hợp tác xã (HTX) để cùng giám sát an toàn mùa vụ, kiểm soát PHI và xuất hồ sơ chứng nhận VietGAP.
                  </p>
                </div>
                {coopData && (
                  <span className={styles.coopBadge}>
                    <CheckCircle2 size={16} color="#059669" /> Đang liên kết HTX
                  </span>
                )}
              </div>

              {coopLoading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Đang tải thông tin Hợp tác xã...</div>
              ) : coopData ? (
                /* ĐÃ THAM GIA HTX */
                <div>
                  <div className={styles.coopCard} style={{ borderLeft: '5px solid #16a34a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Hợp tác xã chủ quản</div>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>{coopData.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <span className={styles.coopCodeTag}>
                            Mã HTX: <strong>{coopData.code}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(coopData.code);
                              toast.success('Đã sao chép mã HTX vào bộ nhớ tạm!');
                            }}
                            className={styles.outlineBtn}
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Copy size={13} /> Sao chép mã
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleLeaveCooperative}
                        disabled={leavingCoop}
                        style={{
                          background: 'none',
                          border: '1px solid #ef4444',
                          color: '#ef4444',
                          borderRadius: '8px',
                          padding: '0.5rem 0.875rem',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          cursor: leavingCoop ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                        }}
                      >
                        <LogOut size={15} /> {leavingCoop ? 'Đang xử lý...' : 'Rời Hợp tác xã'}
                      </button>
                    </div>

                    <div className={styles.coopInfoGrid}>
                      <div className={styles.coopInfoItem}>
                        <div className={styles.coopInfoLabel}>Cán bộ Quản lý / Kỹ thuật</div>
                        <div className={styles.coopInfoValue}>{coopData.managerName || 'Ban Quản trị'}</div>
                        <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>{coopData.managerPhone || coopData.contactPhone || '—'}</div>
                      </div>
                      <div className={styles.coopInfoItem}>
                        <div className={styles.coopInfoLabel}>Địa chỉ trụ sở HTX</div>
                        <div className={styles.coopInfoValue}>{coopData.address || '—'}</div>
                      </div>
                      <div className={styles.coopInfoItem}>
                        <div className={styles.coopInfoLabel}>Tiêu chuẩn áp dụng</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                          {(coopData.certificationStandards && coopData.certificationStandards.length > 0) ? (
                            coopData.certificationStandards.map((std: string, idx: number) => (
                              <span key={idx} style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                                {std}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.8125rem' }}>VietGAP</span>
                          )}
                        </div>
                      </div>
                      <div className={styles.coopInfoItem}>
                        <div className={styles.coopInfoLabel}>Số hộ xã viên cùng tham gia</div>
                        <div className={styles.coopInfoValue} style={{ color: '#16a34a' }}>
                          <Users size={16} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                          {coopData.memberCount || 1} nông hộ
                        </div>
                      </div>
                    </div>

                    {/* Quyền lợi xã viên */}
                    <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '1rem', border: '1px solid #e2e8f0', marginTop: '1rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b', marginBottom: '0.5rem' }}>
                        🌾 Quyền lợi thành viên HTX đang hoạt động:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: '#475569', lineHeight: 1.6 }}>
                        <li><strong>Giám sát cách ly thuốc BVTV (PHI):</strong> Cán bộ kỹ thuật theo dõi nhật ký phun thuốc và cảnh báo không được thu hoạch non nếu chưa đủ ngày cách ly.</li>
                        <li><strong>Gộp hồ sơ mùa vụ VietGAP:</strong> Bảng nhật ký canh tác của bạn được tự động trích xuất kèm toàn HTX để cung cấp cho đối tác bao tiêu và đoàn đánh giá cấp chứng nhận.</li>
                        <li><strong>Hỗ trợ kỹ thuật canh tác:</strong> Nhận khuyến cáo bón phân, phòng trừ sâu bệnh theo hướng dẫn chuyên môn của HTX.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                /* CHƯA THAM GIA HTX */
                <div>
                  <div className={styles.coopCard} style={{ background: '#f8fafc', border: '1.5px dashed #cbd5e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building2 size={24} color="#0284c7" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Gia nhập Hợp tác xã (HTX)</h3>
                        <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
                          Nhập Mã Hợp tác xã do Ban quản trị HTX cung cấp để liên kết tài khoản nông trại của bạn.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleJoinCooperative} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
                      <input
                        type="text"
                        placeholder="Nhập Mã HTX (Ví dụ: HTX-HB01)"
                        value={coopCodeInput}
                        onChange={(e) => setCoopCodeInput(e.target.value.toUpperCase())}
                        style={{
                          flex: 1,
                          minWidth: '240px',
                          padding: '0.65rem 1rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          fontSize: '0.9375rem',
                          fontWeight: 600,
                          letterSpacing: '1px',
                          textTransform: 'uppercase',
                        }}
                      />
                      <button
                        type="submit"
                        className={styles.button}
                        disabled={joiningCoop}
                        style={{ padding: '0.65rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <ArrowRight size={16} /> {joiningCoop ? 'Đang kiểm tra...' : 'Gia nhập ngay'}
                      </button>
                    </form>
                  </div>

                  <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#16a34a', marginBottom: '0.25rem' }}>🛡️ Giám sát tuân thủ PHI</div>
                      <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                        HTX sẽ giúp bạn cảnh báo an toàn thu hoạch khi vừa phun thuốc bảo vệ thực vật, tránh rủi ro dư lượng.
                      </div>
                    </div>
                    <div style={{ padding: '1rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#2563eb', marginBottom: '0.25rem' }}>📑 Xuất hồ sơ tiêu chuẩn</div>
                      <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                        Hồ sơ nhật ký của bạn được cán bộ xuất gộp 1 nút bấm để nộp cho cơ quan chứng nhận VietGAP hoặc đơn vị bao tiêu.
                      </div>
                    </div>
                    <div style={{ padding: '1rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#d97706', marginBottom: '0.25rem' }}>🤝 Liên kết chuỗi giá trị</div>
                      <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                        Bán hàng vào chuỗi cung ứng HTX, siêu thị với giá thu mua ổn định và thương hiệu tập thể.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ===== TAB: Mật khẩu ===== */}
          {activeTab === 'password' && (
            <>
              <h2 className={styles.panelTitle}>Đổi mật khẩu</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu với người khác.
              </p>
              <form onSubmit={handleChangePassword} style={{ maxWidth: '480px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Mật khẩu hiện tại</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className={styles.input}
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Nhập mật khẩu hiện tại"
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                      >
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Mật khẩu mới</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className={styles.input}
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                        required
                        minLength={6}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                      <label className={styles.label}>Xác nhận mật khẩu mới</label>
                      <input
                        className={styles.input}
                        type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button type="submit" className={styles.button} disabled={changingPassword} style={{ marginTop: '1.5rem' }}>
                  <Lock size={18} /> {changingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
              </form>
            </>
          )}

          {/* ===== TAB: Bảo mật ===== */}
          {activeTab === 'security' && (
            <>
              <h2 className={styles.panelTitle}>Cài đặt bảo mật</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Quản lý các tùy chọn bảo mật cho tài khoản của bạn.
              </p>

              <div style={{ 
                padding: '1.5rem', 
                backgroundColor: 'var(--color-surface)', 
                borderRadius: 'var(--radius-xl)', 
                border: '1px solid var(--color-border)',
                maxWidth: '600px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                      Cho phép Admin đặt lại mật khẩu
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                      Khi bật, Admin hệ thống có thể đặt lại mật khẩu cho tài khoản của bạn trong trường hợp bạn quên mật khẩu. 
                      Nếu tắt, chỉ bạn mới có thể thay đổi mật khẩu của mình.
                    </div>
                  </div>
                  <button
                    onClick={handleToggleAdminReset}
                    disabled={togglingReset}
                    style={{
                      flexShrink: 0,
                      width: '52px',
                      height: '28px',
                      borderRadius: '14px',
                      border: 'none',
                      cursor: togglingReset ? 'not-allowed' : 'pointer',
                      backgroundColor: allowAdminReset ? 'var(--color-primary-600)' : '#d1d5db',
                      position: 'relative',
                      transition: 'background-color 0.3s ease',
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: '3px',
                      left: allowAdminReset ? '26px' : '3px',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      transition: 'left 0.3s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}></span>
                  </button>
                </div>
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem 1rem', 
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  backgroundColor: allowAdminReset ? '#f0fdf4' : '#fef3c7',
                  color: allowAdminReset ? '#15803d' : '#92400e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {allowAdminReset ? <Check size={14} /> : <Shield size={14} />}
                  {allowAdminReset 
                    ? 'Admin hiện có thể hỗ trợ đặt lại mật khẩu cho bạn.' 
                    : 'Chỉ bạn mới có thể thay đổi mật khẩu của mình.'}
                </div>
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            <>
              <h2 className={styles.panelTitle}>Cài đặt thông báo</h2>
              <div className={styles.settingsList}>
                <div className={styles.settingItem}>
                  <div>
                    <div className={styles.settingLabel}>Thông báo đẩy OneSignal (Trình duyệt)</div>
                    <div className={styles.settingDesc}>Nhận thông báo nhắc việc ngay trên màn hình khi đến hạn.</div>
                  </div>
                  <label className={styles.switch}>
                    <input type="checkbox" checked={notifSettings.push} onChange={async (e) => {
                      const willEnable = e.target.checked;
                      if (willEnable) {
                        const granted = await requestPushPermission();
                        if (!granted) {
                          toast('Vui lòng cho phép quyền Thông báo trong cài đặt trình duyệt để nhận thông báo.', { icon: 'ℹ️' });
                        }
                      }
                      const newSet = {...notifSettings, push: willEnable};
                      setNotifSettings(newSet);
                      await fetchAPI('/farm/profile', { method: 'PUT', body: JSON.stringify({ notificationPreferences: newSet }) });
                      toast.success('Cập nhật thành công');
                    }} />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <div>
                    <div className={styles.settingLabel}>Thông báo qua Email</div>
                    <div className={styles.settingDesc}>Nhận bản tóm tắt các thông báo quan trọng qua email định kỳ.</div>
                  </div>
                  <label className={styles.switch}>
                    <input type="checkbox" checked={notifSettings.email} onChange={async (e) => {
                      const newSet = {...notifSettings, email: e.target.checked};
                      setNotifSettings(newSet);
                      await fetchAPI('/farm/profile', { method: 'PUT', body: JSON.stringify({ notificationPreferences: newSet }) });
                      toast.success('Cập nhật thành công');
                    }} />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <div>
                    <div className={styles.settingLabel}>Nhắc nhở Công việc</div>
                    <div className={styles.settingDesc}>Nhận thông báo khi có công việc sắp đến hạn hoặc quá hạn.</div>
                  </div>
                  <label className={styles.switch}>
                    <input type="checkbox" checked={notifSettings.tasks} onChange={async (e) => {
                      const newSet = {...notifSettings, tasks: e.target.checked};
                      setNotifSettings(newSet);
                      await fetchAPI('/farm/profile', { method: 'PUT', body: JSON.stringify({ notificationPreferences: newSet }) });
                      toast.success('Cập nhật thành công');
                    }} />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <div>
                    <div className={styles.settingLabel}>Nhắc nhở Gói dịch vụ</div>
                    <div className={styles.settingDesc}>Cảnh báo khi gói cước sắp hết hạn hoặc thanh toán thành công.</div>
                  </div>
                  <label className={styles.switch}>
                    <input type="checkbox" checked={notifSettings.billing} onChange={async (e) => {
                      const newSet = {...notifSettings, billing: e.target.checked};
                      setNotifSettings(newSet);
                      await fetchAPI('/farm/profile', { method: 'PUT', body: JSON.stringify({ notificationPreferences: newSet }) });
                      toast.success('Cập nhật thành công');
                    }} />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>

              {/* Hộp kiểm tra thông báo OneSignal */}
              <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#1e293b' }}>🔔 Thử nghiệm thông báo OneSignal</div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>Gửi một thông báo đẩy thử nghiệm đến thiết bị của bạn để kiểm tra tính năng nhắc lịch.</div>
                </div>
                <button 
                  type="button" 
                  className={styles.button}
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.8125rem', width: 'auto' }}
                  onClick={async () => {
                    try {
                      await requestPushPermission();
                      const res = await fetchAPI('/notifications/test-onesignal', { method: 'POST' });
                      if (res.success) {
                        toast.success('Đã gửi thông báo OneSignal thử nghiệm thành công! Hãy xem thông báo màn hình.');
                      } else {
                        toast.error(res.message || 'Lỗi gửi thông báo thử');
                      }
                    } catch (err: any) {
                      toast.error('Lỗi: ' + (err.message || ''));
                    }
                  }}
                >
                  Gửi thông báo thử ngay
                </button>
              </div>
            </>
          )}

          {activeTab === 'language' && (
            <>
              <h2 className={styles.panelTitle}>Ngôn ngữ khu vực</h2>
              <div className={styles.settingsList}>
                <div className={styles.settingItem}>
                  <div>
                    <div className={styles.settingLabel}>Ngôn ngữ hiển thị</div>
                    <div className={styles.settingDesc}>Chọn ngôn ngữ giao diện của hệ thống.</div>
                  </div>
                  <select className={styles.select} value={language} onChange={(e) => {
                    setLanguage(e.target.value as any);
                    toast.success('Đã thay đổi ngôn ngữ');
                  }}>
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English (Tiếng Anh)</option>
                  </select>
                </div>
                <div className={styles.settingItem}>
                  <div>
                    <div className={styles.settingLabel}>Múi giờ</div>
                    <div className={styles.settingDesc}>Hệ thống sẽ đồng bộ thời gian theo múi giờ này.</div>
                  </div>
                  <select className={styles.select} value={timezone} onChange={(e) => {
                    setTimezone(e.target.value);
                    toast.success('Đã cập nhật múi giờ');
                  }}>
                    <option value="GMT+7">(GMT+07:00) Băng Cốc, Hà Nội, Jakarta</option>
                    <option value="GMT+8">(GMT+08:00) Bắc Kinh, Singapore, Đài Bắc</option>
                    <option value="GMT+9">(GMT+09:00) Tokyo, Seoul, Osaka</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {activeTab === 'appearance' && (
            <>
              <h2 className={styles.panelTitle}>Tùy chỉnh Giao diện</h2>
              <div className={styles.settingsList}>
                <div className={styles.settingItem}>
                  <div>
                    <div className={styles.settingLabel}>Giao diện (Theme)</div>
                    <div className={styles.settingDesc}>Chuyển đổi giữa chế độ nền sáng và nền tối.</div>
                  </div>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="theme" value="light" checked={theme === 'light'} onChange={() => setTheme('light')} /> Sáng
                    </label>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="theme" value="dark" checked={theme === 'dark'} onChange={() => setTheme('dark')} /> Tối
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'security' && (
            <>
              <h2 className={styles.panelTitle} style={{marginTop: '2rem'}}>Lịch sử đăng nhập</h2>
              <div className={styles.settingsList}>
                <div className={styles.settingItem}>
                  <div>
                    <div className={styles.settingLabel}>Lịch sử đăng nhập</div>
                    <div className={styles.settingDesc}>Danh sách các phiên đăng nhập gần đây.</div>
                  </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  {loginHistory.length === 0 ? <p>Chưa có dữ liệu</p> : (
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <th style={{ padding: '0.75rem' }}>Thời gian</th>
                          <th style={{ padding: '0.75rem' }}>IP Address</th>
                          <th style={{ padding: '0.75rem' }}>Thiết bị (User Agent)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loginHistory.map(h => (
                          <tr key={h._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '0.75rem' }}>{new Date(h.createdAt).toLocaleString('vi-VN')}</td>
                            <td style={{ padding: '0.75rem' }}>{h.ipAddress}</td>
                            <td style={{ padding: '0.75rem' }}>{h.userAgent.substring(0, 50)}...</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
