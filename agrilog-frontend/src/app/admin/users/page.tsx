/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { Filter, UserPlus, Shield, Sprout, Ban, Building, KeyRound } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import styles from '@/css/Users.module.css';
import { fetchAPI } from '@/lib/api';

export default function UsersPage() {
  const [farmsData, setFarmsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('FARM');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // Reset Password Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState('');
  const [resetUserEmail, setResetUserEmail] = useState('');
  const [resetUserAllowed, setResetUserAllowed] = useState(false);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const loadFarms = async () => {
    try {
      const res = await fetchAPI('/admin/farms');
      if (res.success) {
        setFarmsData(res.data);
      }
    } catch (error) {
      console.error('Error fetching farms:', error);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    loadFarms();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);

    try {
      const res = await fetchAPI('/admin/users', {
        method: 'POST',
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole })
      });
      if (res.success) {
        setIsAddModalOpen(false);
        setNewEmail('');
        setNewPassword('');
        setNewRole('FARM');
        loadFarms(); // Refresh list
      }
    } catch (error: any) {
      setAddError(error.message || 'Thêm tài khoản thất bại');
    } finally {
      setAddLoading(false);
    }
  };

  const openResetModal = (userId: string, email: string, allowAdminReset: boolean) => {
    setResetUserId(userId);
    setResetUserEmail(email);
    setResetUserAllowed(allowAdminReset);
    setResetNewPassword('');
    setResetError('');
    setResetSuccess('');
    setIsResetModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    setResetLoading(true);

    try {
      const res = await fetchAPI(`/admin/users/${resetUserId}/reset-password`, {
        method: 'PUT',
        body: JSON.stringify({ newPassword: resetNewPassword }),
      });
      if (res.success) {
        setResetSuccess(res.message || 'Đặt lại mật khẩu thành công!');
        setResetNewPassword('');
      }
    } catch (error: any) {
      setResetError(error.message || 'Đặt lại mật khẩu thất bại');
    } finally {
      setResetLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.container} style={{ padding: '2rem' }}>Đang tải dữ liệu...</div>;
  }

  const kpis = [
    { label: 'Tổng Nông trại', value: farmsData.length, meta: 'Dữ liệu thực', isPos: true },
    { label: 'Nông trại hoạt động', value: farmsData.filter(f => f.user.isActive !== false).length, meta: 'Đang hoạt động', isPos: true },
    { label: 'Tổng số bảng canh tác', value: farmsData.reduce((acc, f) => acc + (f.boardCount || 0), 0), meta: 'Trên toàn hệ thống', isPos: true },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý người dùng</h1>
          <p className={styles.subtitle}>Theo dõi và quản lý các tài khoản nông trại trên hệ thống AgriLog.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnLight}>
            <Filter size={16} /> Bộ lọc
          </button>
          <button className={styles.btnPrimary} onClick={() => setIsAddModalOpen(true)}>
            <UserPlus size={16} /> Thêm tài khoản
          </button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        {kpis.map((kpi, index) => (
          <Card key={index} className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{kpi.label}</div>
            <div className={styles.kpiValueRow}>
              <span className={styles.kpiValue}>{kpi.value}</span>
              <span className={`${styles.kpiMeta} ${kpi.isPos ? styles.kpiMetaPos : styles.kpiMetaLabel}`}>
                {kpi.meta} {kpi.isPos && '↗'}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên Nông Trại</th>
              <th>Email Đăng Ký</th>
              <th>Tỉnh Thành</th>
              <th>Ngày Đăng Ký</th>
              <th>Số lượng Nhật ký</th>
              <th>Trạng Thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {farmsData.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Không có dữ liệu.</td>
              </tr>
            )}
            {farmsData.map((row) => {
              const Icon = Sprout;

              return (
                <tr key={row.user._id}>
                  <td style={{ color: 'var(--color-text-muted)' }}>{row.user._id.substring(0, 8)}...</td>
                  <td>
                    <div className={styles.farmCell}>
                      <div className={styles.farmLogo}><Icon size={16} /></div>
                      <span className={styles.farmName}>{row.profile?.farmName || 'Chưa cập nhật'}</span>
                    </div>
                  </td>
                  <td>{row.user.email}</td>
                  <td>{row.profile?.location?.province || 'Chưa cập nhật'}</td>
                  <td>{new Date(row.user.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>{row.boardCount}</td>
                  <td>
                    <Badge variant={row.user.isActive === false ? 'danger' : 'success'}>
                      {row.user.isActive === false ? 'Bị Khóa' : 'Hoạt động'}
                    </Badge>
                  </td>
                  <td>
                    <button
                      onClick={() => openResetModal(row.user._id, row.user.email, row.user.allowAdminReset || false)}
                      style={{
                        padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 500,
                        border: '1px solid var(--color-border)', borderRadius: '6px',
                        background: 'white', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-main)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <KeyRound size={14} /> Đặt lại MK
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className={styles.pagination}>
          <div className={styles.pageInfo}>Hiển thị {farmsData.length} tài khoản</div>
          <div className={styles.pageControls}>
            <button className={styles.pageBtn}>&lt;</button>
            <button className={`${styles.pageBtn} ${styles.active}`}>1</button>
            <button className={styles.pageBtn}>&gt;</button>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Card style={{ width: '400px', padding: '2rem', backgroundColor: 'white' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>Thêm tài khoản mới</h2>
            {addError && <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.875rem' }}>{addError}</div>}
            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Email</label>
                <input 
                  type="email" 
                  value={newEmail} 
                  onChange={e => setNewEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Mật khẩu</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Quyền (Role)</label>
                <select 
                  value={newRole} 
                  onChange={e => setNewRole(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                >
                  <option value="FARM">Farm</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" disabled={addLoading} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary-600)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {addLoading ? 'Đang thêm...' : 'Thêm tài khoản'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Card style={{ width: '440px', padding: '2rem', backgroundColor: 'white' }}>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>Đặt lại mật khẩu</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Tài khoản: <strong>{resetUserEmail}</strong>
            </p>

            {!resetUserAllowed ? (
              <>
                <div style={{
                  padding: '1rem', borderRadius: '8px',
                  backgroundColor: '#fef3c7', color: '#92400e',
                  fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.5rem'
                }}>
                  <strong>⚠ Không có quyền.</strong><br />
                  Người dùng này chưa cho phép Admin đặt lại mật khẩu.<br />
                  Hãy yêu cầu họ bật tùy chọn <strong>&quot;Cho phép Admin đặt lại mật khẩu&quot;</strong> trong <strong>Cài đặt &gt; Bảo mật</strong>.
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => setIsResetModalOpen(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Đóng</button>
                </div>
              </>
            ) : (
              <>
                {resetError && <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.875rem' }}>{resetError}</div>}
                {resetSuccess && <div style={{ color: '#15803d', marginBottom: '1rem', fontSize: '0.875rem', backgroundColor: '#f0fdf4', padding: '0.75rem', borderRadius: '8px' }}>{resetSuccess}</div>}
                <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Mật khẩu mới</label>
                    <input
                      type="password"
                      value={resetNewPassword}
                      onChange={e => setResetNewPassword(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                      required
                      minLength={6}
                      placeholder="Tối thiểu 6 ký tự"
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => setIsResetModalOpen(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
                    <button type="submit" disabled={resetLoading} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary-600)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      {resetLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
