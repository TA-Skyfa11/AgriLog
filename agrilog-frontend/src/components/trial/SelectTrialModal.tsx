/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Sparkles, Check, X, ShieldCheck, Zap, Crown } from 'lucide-react';

interface SelectTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (planCode: string) => void;
  title?: string;
  subtitle?: string;
  canClose?: boolean;
}

export default function SelectTrialModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Chọn gói dùng thử miễn phí',
  subtitle,
  canClose = true,
}: SelectTrialModalProps) {
  const [loadingCode, setLoadingCode] = useState<string | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadPackages = async () => {
      setLoadingPackages(true);
      try {
        const res = await fetchAPI('/services');
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          // Chỉ lấy 3 gói BASIC, STANDARD, PREMIUM
          const filtered = res.data.filter((p: any) =>
            ['BASIC', 'STANDARD', 'PREMIUM'].includes(p.code)
          );
          if (filtered.length > 0) {
            setPackages(filtered);
            return;
          }
        }
      } catch (e) {
        console.warn('Lỗi tải gói dịch vụ:', e);
      } finally {
        setLoadingPackages(false);
      }

      // Fallback mặc định nếu chưa có API trả về
      setPackages([
        {
          code: 'BASIC',
          name: 'Gói Basic',
          description: 'Phù hợp cho nông hộ canh tác quy mô nhỏ và khởi đầu',
          maxBoards: 3,
          maxImages: 50,
          features: ['Tối đa 3 bảng canh tác', 'Tối đa 50 ảnh/tháng', 'Lưu trữ 1 năm', 'Ghi chép phân bón, thuốc BVTV'],
        },
        {
          code: 'STANDARD',
          name: 'Gói Standard',
          description: 'Đầy đủ chức năng cho trang trại vừa và gia đình',
          maxBoards: 5,
          maxImages: 500,
          features: ['Tối đa 5 bảng canh tác', 'Tối đa 500 ảnh/tháng', 'Xuất báo cáo PDF & Excel', 'Lưu trữ 2 năm'],
        },
        {
          code: 'PREMIUM',
          name: 'Gói Premium',
          description: 'Trọn gói cao cấp nhất không giới hạn tính năng',
          maxBoards: 15,
          maxImages: -1,
          features: ['Tối đa 15 bảng canh tác', 'Tải ảnh không giới hạn', 'Xuất báo cáo PDF & Excel', 'Lưu trữ 3 năm', 'Hỗ trợ ưu tiên'],
        },
      ]);
    };

    loadPackages();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = async (pkg: any) => {
    setLoadingCode(pkg.code);
    try {
      const res = await fetchAPI('/farm/profile/select-trial', {
        method: 'POST',
        body: JSON.stringify({ packageCode: pkg.code }),
      });
      if (res.success) {
        toast.success(res.message || `Đã chọn bắt đầu dùng thử gói ${pkg.name}!`);
        if (onSuccess) {
          onSuccess(pkg.code);
        }
        onClose();
      } else {
        toast.error(res.message || 'Không thể chọn gói dùng thử');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi kích hoạt gói');
    } finally {
      setLoadingCode(null);
    }
  };

  const getPackageIcon = (code: string) => {
    if (code === 'PREMIUM') return <Crown size={22} color="#f59e0b" />;
    if (code === 'STANDARD') return <Zap size={22} color="#10b981" />;
    return <ShieldCheck size={22} color="#3b82f6" />;
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', overflowY: 'auto'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        maxWidth: '920px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem 1.75rem',
          background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
          borderBottom: '1px solid #d1fae5',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
        }}>
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              backgroundColor: '#10b981', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
            }}>
              <Sparkles size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#065f46', margin: 0 }}>
                {title}
              </h2>
              <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.9rem', color: '#047857', lineHeight: 1.4 }}>
                {subtitle || 'Vui lòng chọn 1 gói dịch vụ bạn muốn trải nghiệm để hệ thống cấp quyền tạo bảng nhật ký và kích hoạt đầy đủ tính năng!'}
              </p>
            </div>
          </div>

          {canClose && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: '#64748b', padding: '0.4rem', borderRadius: '8px'
              }}
              aria-label="Đóng"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Package cards */}
        <div style={{ padding: '1.75rem' }}>
          {loadingPackages ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              Đang tải danh sách các gói dùng thử...
            </div>
          ) : (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.25rem'
            }}>
              {packages.map((pkg) => {
                const isPremium = pkg.code === 'PREMIUM';
                const isStandard = pkg.code === 'STANDARD';
                const isLoading = loadingCode === pkg.code;

                return (
                  <div
                    key={pkg.code}
                    style={{
                      borderRadius: '12px',
                      border: isPremium ? '2px solid #f59e0b' : isStandard ? '2px solid #10b981' : '1px solid #cbd5e1',
                      padding: '1.5rem',
                      display: 'flex', flexDirection: 'column',
                      backgroundColor: isPremium ? '#fffbeb' : isStandard ? '#f0fdf4' : '#ffffff',
                      position: 'relative',
                      boxShadow: isPremium || isStandard ? '0 10px 15px -3px rgba(0, 0, 0, 0.08)' : 'none',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                  >
                    {isPremium && (
                      <div style={{
                        position: 'absolute', top: '-12px', right: '16px',
                        backgroundColor: '#f59e0b', color: 'white',
                        fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.65rem',
                        borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em'
                      }}>
                        Đầy đủ nhất
                      </div>
                    )}
                    {isStandard && (
                      <div style={{
                        position: 'absolute', top: '-12px', right: '16px',
                        backgroundColor: '#10b981', color: 'white',
                        fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.65rem',
                        borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em'
                      }}>
                        Phổ biến
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {getPackageIcon(pkg.code)}
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                        {pkg.name}
                      </h3>
                    </div>

                    <div style={{
                      fontSize: '0.95rem', fontWeight: 700, color: '#10b981',
                      margin: '0.25rem 0 0.75rem 0'
                    }}>
                      MIỄN PHÍ TRẢI NGHIỆM
                    </div>

                    <p style={{ fontSize: '0.85rem', color: '#64748b', minHeight: '38px', marginBottom: '1rem', lineHeight: 1.4 }}>
                      {pkg.description || 'Gói giải pháp quản lý canh tác nông nghiệp'}
                    </p>

                    <div style={{
                      backgroundColor: '#ffffff', borderRadius: '8px',
                      padding: '0.75rem', border: '1px solid #e2e8f0', marginBottom: '1.25rem',
                      fontSize: '0.825rem', fontWeight: 600, color: '#334155'
                    }}>
                      <div>🌱 {pkg.maxBoards === -1 ? 'Không giới hạn' : pkg.maxBoards} bảng canh tác</div>
                      <div style={{ marginTop: '0.3rem' }}>
                        📷 {pkg.maxImages === -1 ? 'Không giới hạn tải ảnh' : `${pkg.maxImages} ảnh/tháng`}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, marginBottom: '1.5rem' }}>
                      {pkg.features && pkg.features.map((feat: string, idx: number) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', fontSize: '0.825rem', color: '#334155' }}>
                          <Check size={15} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleSelect(pkg)}
                      disabled={loadingCode !== null}
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: isPremium ? '#d97706' : isStandard ? '#059669' : '#0284c7',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: loadingCode !== null ? 'not-allowed' : 'pointer',
                        opacity: loadingCode !== null && !isLoading ? 0.6 : 1,
                        transition: 'background-color 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                      }}
                    >
                      {isLoading ? 'Đang kích hoạt...' : `Dùng thử ${pkg.code}`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
