/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { fetchAPI } from '@/lib/api';
import { 
  Lock, Eye, EyeOff, Save, User, Shield, DollarSign,
  Layers, RefreshCw, RotateCcw, Search, Check, X,
  Leaf, FlaskConical, ShieldAlert, Package, ShoppingBag,
  Calendar, BarChart2, CreditCard, Sun, PackagePlus, ClipboardList
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAppContext } from '@/context/AppProvider';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('features');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Commission state
  const [commissionRate, setCommissionRate] = useState<number>(5);
  const [savingCommission, setSavingCommission] = useState(false);

  // Features state
  const [features, setFeatures] = useState<any[]>([]);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [featureCategory, setFeatureCategory] = useState<'ALL' | 'FARM' | 'COMPANY' | 'COMMON'>('ALL');
  const [featureSearch, setFeatureSearch] = useState('');
  const [resettingDefaults, setResettingDefaults] = useState(false);
  const { reloadFeatures } = useAppContext();

  // Load commission
  useEffect(() => {
    const loadCommission = async () => {
      try {
        const res = await fetchAPI('/admin/commission');
        if (res.success && res.data) {
          setCommissionRate(res.data.rate);
        }
      } catch (e) {}
    };
    loadCommission();
  }, []);

  // Load features
  const loadFeatures = async () => {
    setLoadingFeatures(true);
    try {
      const res = await fetchAPI('/admin/features');
      if (res.success && Array.isArray(res.data)) {
        setFeatures(res.data);
      } else {
        toast.error(res.message || 'Không thể tải danh sách tính năng');
      }
    } catch (e: any) {
      toast.error('Lỗi khi nạp danh sách tính năng hệ thống');
    } finally {
      setLoadingFeatures(false);
    }
  };

  useEffect(() => {
    loadFeatures();
  }, []);

  const handleToggleFeature = async (feature: any) => {
    setTogglingKey(feature.key);
    const targetStatus = !feature.isEnabled;
    try {
      const res = await fetchAPI(`/admin/features/${feature.key}/toggle`, {
        method: 'PUT',
        body: JSON.stringify({ isEnabled: targetStatus }),
      });
      if (res.success && res.data) {
        setFeatures(prev => prev.map(f => f.key === feature.key ? { ...f, isEnabled: res.data.isEnabled } : f));
        toast.success(res.message || (res.data.isEnabled ? `Đã BẬT (Hiện) ${feature.name}` : `Đã TẮT (Ẩn) ${feature.name}`));
        await reloadFeatures();
      } else {
        toast.error(res.message || 'Không thể đổi trạng thái tính năng');
      }
    } catch (e: any) {
      toast.error(e.message || 'Lỗi khi cập nhật trạng thái tính năng');
    } finally {
      setTogglingKey(null);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn khôi phục tất cả các tính năng về trạng thái BẬT mặc định?')) {
      return;
    }
    setResettingDefaults(true);
    try {
      const res = await fetchAPI('/admin/features/reset-defaults', { method: 'POST' });
      if (res.success && Array.isArray(res.data)) {
        setFeatures(res.data);
        toast.success('Đã khôi phục tất cả tính năng về trạng thái BẬT!');
        await reloadFeatures();
      }
    } catch {
      toast.error('Lỗi khi khôi phục tính năng mặc định');
    } finally {
      setResettingDefaults(false);
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

  const handleSaveCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setSavingCommission(true);
    try {
      const res = await fetchAPI('/admin/commission', {
        method: 'PUT',
        body: JSON.stringify({ rate: commissionRate, description: 'Mức hoa hồng mặc định' })
      });
      if (res.success) {
        setMessage({ type: 'success', text: res.message || 'Cập nhật hoa hồng thành công' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Cập nhật thất bại' });
    } finally {
      setSavingCommission(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const renderFeatureIcon = (iconName?: string) => {
    const props = { size: 22 };
    switch (iconName) {
      case 'Leaf': return <Leaf {...props} color="#16a34a" />;
      case 'FlaskConical': return <FlaskConical {...props} color="#0284c7" />;
      case 'ShieldAlert': return <ShieldAlert {...props} color="#ea580c" />;
      case 'Package': return <Package {...props} color="#d97706" />;
      case 'ShoppingBag': return <ShoppingBag {...props} color="#8b5cf6" />;
      case 'Calendar': return <Calendar {...props} color="#059669" />;
      case 'BarChart2': return <BarChart2 {...props} color="#2563eb" />;
      case 'CreditCard': return <CreditCard {...props} color="#ec4899" />;
      case 'Sun': return <Sun {...props} color="#f59e0b" />;
      case 'PackagePlus': return <PackagePlus {...props} color="#10b981" />;
      case 'ClipboardList': return <ClipboardList {...props} color="#6366f1" />;
      default: return <Layers {...props} color="#64748b" />;
    }
  };

  const filteredFeatures = features.filter((f) => {
    const matchCat = featureCategory === 'ALL' || f.category === featureCategory;
    const matchSearch = !featureSearch.trim() || 
      f.name.toLowerCase().includes(featureSearch.toLowerCase()) ||
      f.key.toLowerCase().includes(featureSearch.toLowerCase()) ||
      f.path.toLowerCase().includes(featureSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalFeaturesCount = features.length;
  const enabledCount = features.filter(f => f.isEnabled).length;
  const disabledCount = features.filter(f => !f.isEnabled).length;

  const tabStyle = (tab: string) => ({
    padding: '0.75rem 1.25rem',
    borderRadius: '8px',
    cursor: 'pointer' as const,
    display: 'flex',
    alignItems: 'center' as const,
    gap: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: activeTab === tab ? 600 : 400,
    backgroundColor: activeTab === tab ? 'var(--color-primary-50, #f0fdf4)' : 'transparent',
    color: activeTab === tab ? 'var(--color-primary-700, #15803d)' : 'var(--color-text-muted, #64748b)',
    border: 'none',
    transition: 'all 0.2s',
  });

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid var(--color-border, #e2e8f0)',
    borderRadius: '8px',
    fontSize: '0.9rem',
    transition: 'border-color 0.2s',
    backgroundColor: 'var(--color-surface, #ffffff)',
  };

  const labelStyle = {
    display: 'block' as const,
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--color-text-main, #1e293b)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main, #1e293b)', marginBottom: '0.25rem' }}>
          Cài đặt hệ thống
        </h1>
        <p style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '0.875rem' }}>
          Quản lý hiện/ẩn chức năng, tài khoản Admin và cấu hình toàn hệ thống.
        </p>
      </div>

      {message.text && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          fontSize: '0.875rem',
          backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: message.type === 'success' ? '#15803d' : '#b91c1c',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Sidebar */}
        <Card style={{ padding: '1rem', height: 'fit-content' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={tabStyle('features')} onClick={() => setActiveTab('features')}>
              <Layers size={18} /> Bật/Tắt tính năng
            </div>
            <div style={tabStyle('password')} onClick={() => setActiveTab('password')}>
              <Lock size={18} /> Đổi mật khẩu
            </div>
            <div style={tabStyle('commission')} onClick={() => setActiveTab('commission')}>
              <DollarSign size={18} /> Hoa hồng Marketplace
            </div>
            <div style={tabStyle('account')} onClick={() => setActiveTab('account')}>
              <User size={18} /> Tài khoản Admin
            </div>
            <div style={tabStyle('security')} onClick={() => setActiveTab('security')}>
              <Shield size={18} /> Bảo mật
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <Card style={{ padding: '2rem' }}>
          {/* TAB 1: FEATURES TOGGLE MANAGEMENT */}
          {activeTab === 'features' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main, #1e293b)', marginBottom: '0.25rem' }}>
                    Quản lý Bật / Tắt tính năng hệ thống
                  </h2>
                  <p style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '0.875rem' }}>
                    Admin có thể ẩn hoặc hiện các module trên hệ thống đối với Nông trại và Doanh nghiệp. Thay đổi áp dụng ngay lập tức.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={loadFeatures}
                    disabled={loadingFeatures}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.55rem 0.95rem',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border, #e2e8f0)',
                      backgroundColor: 'transparent',
                      color: 'var(--color-text-main, #1e293b)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <RefreshCw size={15} className={loadingFeatures ? 'animate-spin' : ''} />
                    Làm mới
                  </button>
                  <button
                    onClick={handleResetDefaults}
                    disabled={resettingDefaults}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.55rem 0.95rem',
                      borderRadius: '8px',
                      border: '1px solid #fed7aa',
                      backgroundColor: '#fff7ed',
                      color: '#c2410c',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <RotateCcw size={15} />
                    Bật tất cả
                  </button>
                </div>
              </div>

              {/* Status summary banner */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}>
                <div style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, marginBottom: '0.25rem' }}>Tổng số module</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{totalFeaturesCount}</div>
                </div>
                <div style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                }}>
                  <div style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 500, marginBottom: '0.25rem' }}>Đang hoạt động (Hiện)</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a' }}>{enabledCount}</div>
                </div>
                <div style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  backgroundColor: disabledCount > 0 ? '#fff7ed' : '#f8fafc',
                  border: `1px solid ${disabledCount > 0 ? '#fed7aa' : '#e2e8f0'}`,
                }}>
                  <div style={{ fontSize: '0.8rem', color: disabledCount > 0 ? '#c2410c' : '#64748b', fontWeight: 500, marginBottom: '0.25rem' }}>Đã tạm ẩn (Tắt)</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: disabledCount > 0 ? '#ea580c' : '#64748b' }}>{disabledCount}</div>
                </div>
              </div>

              {/* Filters & Search */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                {/* Category tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[
                    { key: 'ALL', label: 'Tất cả' },
                    { key: 'FARM', label: 'Nông trại' },
                    { key: 'COMPANY', label: 'Doanh nghiệp' },
                    { key: 'COMMON', label: 'Chung' },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setFeatureCategory(cat.key as any)}
                      style={{
                        padding: '0.45rem 0.9rem',
                        borderRadius: '20px',
                        border: 'none',
                        fontSize: '0.825rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        backgroundColor: featureCategory === cat.key ? 'var(--color-primary-600, #16a34a)' : '#f1f5f9',
                        color: featureCategory === cat.key ? '#ffffff' : '#64748b',
                        transition: 'all 0.2s',
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div style={{ position: 'relative', minWidth: '240px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Tìm tính năng..."
                    value={featureSearch}
                    onChange={(e) => setFeatureSearch(e.target.value)}
                    style={{
                      ...inputStyle,
                      paddingLeft: '36px',
                      paddingTop: '0.5rem',
                      paddingBottom: '0.5rem',
                      fontSize: '0.85rem',
                    }}
                  />
                  {featureSearch && (
                    <button
                      onClick={() => setFeatureSearch('')}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Feature Cards Grid */}
              {loadingFeatures ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem auto' }} />
                  <div>Đang nạp danh sách tính năng...</div>
                </div>
              ) : filteredFeatures.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                  Không tìm thấy tính năng nào phù hợp với bộ lọc.
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1.25rem',
                }}>
                  {filteredFeatures.map((f) => {
                    const isToggling = togglingKey === f.key;
                    return (
                      <div
                        key={f.key}
                        style={{
                          borderRadius: '12px',
                          border: `1.5px solid ${f.isEnabled ? '#e2e8f0' : '#fbcfe8'}`,
                          backgroundColor: f.isEnabled ? '#ffffff' : '#fff5f7',
                          padding: '1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                          transition: 'all 0.2s',
                          position: 'relative',
                        }}
                      >
                        {/* Card Header */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '10px',
                                backgroundColor: f.isEnabled ? '#f0fdf4' : '#f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #e2e8f0',
                              }}>
                                {renderFeatureIcon(f.icon)}
                              </div>
                              <div>
                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '4px',
                                  backgroundColor: f.category === 'FARM' ? '#ecfdf5' : f.category === 'COMPANY' ? '#eff6ff' : '#f3e8ff',
                                  color: f.category === 'FARM' ? '#047857' : f.category === 'COMPANY' ? '#1d4ed8' : '#7e22ce',
                                }}>
                                  {f.category === 'FARM' ? 'Nông trại' : f.category === 'COMPANY' ? 'Doanh nghiệp' : 'Chung'}
                                </span>
                              </div>
                            </div>

                            {/* Status badge */}
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              padding: '0.2rem 0.6rem',
                              borderRadius: '12px',
                              backgroundColor: f.isEnabled ? '#dcfce7' : '#fee2e2',
                              color: f.isEnabled ? '#15803d' : '#b91c1c',
                            }}>
                              {f.isEnabled ? <Check size={12} /> : <X size={12} />}
                              {f.isEnabled ? 'Đang hiện' : 'Đã ẩn'}
                            </span>
                          </div>

                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                            {f.name}
                          </h3>

                          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', backgroundColor: '#f1f5f9', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                              code: {f.key}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#0284c7', fontFamily: 'monospace', backgroundColor: '#e0f2fe', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                              {f.path}
                            </span>
                          </div>

                          <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                            {f.description || 'Chức năng hệ thống AgriLog'}
                          </p>
                        </div>

                        {/* Card Footer: Toggle Switch */}
                        <div style={{
                          paddingTop: '0.75rem',
                          borderTop: '1px solid #f1f5f9',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: f.isEnabled ? '#15803d' : '#94a3b8' }}>
                            {f.isEnabled ? 'Hiển thị trên Menu' : 'Đang tắt (Ẩn khỏi Menu)'}
                          </span>

                          {/* iOS Style Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => handleToggleFeature(f)}
                            disabled={isToggling}
                            style={{
                              position: 'relative',
                              display: 'inline-flex',
                              alignItems: 'center',
                              width: '48px',
                              height: '26px',
                              borderRadius: '9999px',
                              backgroundColor: f.isEnabled ? '#16a34a' : '#cbd5e1',
                              cursor: isToggling ? 'not-allowed' : 'pointer',
                              border: 'none',
                              padding: '2px',
                              transition: 'background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                              outline: 'none',
                              opacity: isToggling ? 0.6 : 1,
                            }}
                          >
                            <span
                              style={{
                                display: 'inline-block',
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                backgroundColor: '#ffffff',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                transform: f.isEnabled ? 'translateX(22px)' : 'translateX(0px)',
                                transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                              }}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PASSWORD CHANGE */}
          {activeTab === 'password' && (
            <>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main, #1e293b)', marginBottom: '0.5rem' }}>Đổi mật khẩu Admin</h2>
              <p style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Hãy sử dụng mật khẩu mạnh để bảo vệ tài khoản Admin.
              </p>

              <form onSubmit={handleChangePassword} style={{ maxWidth: '480px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={labelStyle}>Mật khẩu hiện tại</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        style={inputStyle}
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Nhập mật khẩu hiện tại"
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted, #64748b)' }}
                      >
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Mật khẩu mới</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        style={inputStyle}
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
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted, #64748b)' }}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Xác nhận mật khẩu mới</label>
                    <input
                      style={inputStyle}
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={changingPassword}
                  style={{ 
                    marginTop: '1.5rem', padding: '0.75rem 1.5rem', 
                    backgroundColor: 'var(--color-primary-600, #16a34a)', color: 'white', 
                    border: 'none', borderRadius: '8px', cursor: changingPassword ? 'not-allowed' : 'pointer',
                    fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    opacity: changingPassword ? 0.7 : 1, transition: 'all 0.2s'
                  }}
                >
                  <Lock size={18} /> {changingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
              </form>
            </>
          )}

          {/* TAB 3: COMMISSION SETTINGS */}
          {activeTab === 'commission' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main, #1e293b)', marginBottom: '0.5rem' }}>Cài đặt Hoa hồng Marketplace</h2>
              <p style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Mức hoa hồng này sẽ được áp dụng cho tất cả các giao dịch mua bán trên Marketplace.
              </p>
              
              <form onSubmit={handleSaveCommission} style={{ maxWidth: '400px' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={labelStyle}>Mức phần trăm hoa hồng (%)</label>
                  <input
                    style={inputStyle}
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    required
                  />
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted, #64748b)', marginTop: '0.5rem' }}>
                    Ví dụ: 5% — Hệ thống sẽ tự động trích 5% từ tổng giá trị đơn hàng của Doanh nghiệp.
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={savingCommission}
                  style={{ 
                    padding: '0.75rem 1.5rem', 
                    backgroundColor: 'var(--color-primary-600, #16a34a)', color: 'white', 
                    border: 'none', borderRadius: '8px', cursor: savingCommission ? 'not-allowed' : 'pointer',
                    fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    opacity: savingCommission ? 0.7 : 1, transition: 'all 0.2s'
                  }}
                >
                  <Save size={18} /> {savingCommission ? 'Đang lưu...' : 'Lưu cài đặt'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: ACCOUNT INFO */}
          {activeTab === 'account' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main, #1e293b)', marginBottom: '0.5rem' }}>Thông tin tài khoản Admin</h2>
              <p style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '0.875rem' }}>Chức năng đang được phát triển...</p>
            </div>
          )}

          {/* TAB 5: SECURITY */}
          {activeTab === 'security' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main, #1e293b)', marginBottom: '0.5rem' }}>Bảo mật hệ thống</h2>
              <p style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '0.875rem' }}>Chức năng đang được phát triển...</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
