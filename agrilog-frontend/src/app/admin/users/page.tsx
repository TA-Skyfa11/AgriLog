/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { Filter, UserPlus, Shield, Sprout, Ban, Building, KeyRound, Briefcase, Lock, Unlock, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import styles from '@/css/Users.module.css';
import { fetchAPI } from '@/lib/api';

export default function UsersPage() {
  const [farmsData, setFarmsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filters
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

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

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI(`/admin/users?role=${filterRole}&status=${filterStatus}`);
      if (res.success) {
        setFarmsData(res.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadUsers();
  }, [filterRole, filterStatus]);

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
        loadUsers(); // Refresh list
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

  const handleToggleLock = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Bạn có chắc muốn ${currentStatus ? 'khóa' : 'mở khóa'} tài khoản này?`)) return;
    try {
      const res = await fetchAPI(`/admin/users/${userId}/toggle-lock`, { method: 'PUT' });
      if (res.success) {
        loadUsers();
      } else {
        alert(res.message || 'Thao tác thất bại');
      }
    } catch (err: any) {
      alert(err.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản ${email} và TẤT CẢ dữ liệu liên quan? Hành động này không thể hoàn tác!`)) return;
    try {
      const res = await fetchAPI(`/admin/users/${userId}`, { method: 'DELETE' });
      if (res.success) {
        alert('Xóa tài khoản thành công!');
        loadUsers();
      } else {
        alert(res.message || 'Xóa tài khoản thất bại');
      }
    } catch (err: any) {
      alert(err.message || 'Có lỗi xảy ra khi xóa tài khoản');
    }
  };

  if (loading && farmsData.length === 0) {
    return <div className={styles.container} style={{ padding: '2rem' }}>Đang tải dữ liệu...</div>;
  }

  const kpis = [
    { label: 'Tổng tài khoản', value: farmsData.length, meta: 'Dữ liệu thực', isPos: true },
    { label: 'Tài khoản hoạt động', value: farmsData.filter(f => f.user.isActive !== false).length, meta: 'Đang hoạt động', isPos: true },
    { label: 'Tổng số bảng/SP', value: farmsData.reduce((acc, f) => acc + (f.boardCount || 0), 0), meta: 'Trên toàn hệ thống', isPos: true },
  ];

  const totalPages = Math.ceil(farmsData.length / itemsPerPage);
  const currentData = farmsData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý người dùng</h1>
          <p className={styles.subtitle}>Theo dõi và quản lý các tài khoản trên hệ thống AgriLog.</p>
        </div>
        <div className={styles.actions} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            value={filterRole} 
            onChange={e => setFilterRole(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="FARM">Nông trại</option>
            <option value="COMPANY">Doanh nghiệp</option>
          </select>
          
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Bị khóa</option>
          </select>
          
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
              <th>STT</th>
              <th>Vai trò</th>
              <th>Tên / Thương hiệu</th>
              <th>Email Đăng Ký</th>
              <th>Ngày Đăng Ký</th>
              <th>Số lượng (Bảng/SP)</th>
              <th>Trạng Thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {farmsData.length === 0 && !loading && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Không có dữ liệu.</td>
              </tr>
            )}
            {currentData.map((row, index) => {
              const isCompany = row.user.role === 'COMPANY';
              const Icon = isCompany ? Briefcase : Sprout;
              const name = isCompany ? row.profile?.companyName : row.profile?.farmName;

              return (
                <tr key={row.user._id}>
                  <td style={{ color: 'var(--color-text-muted)' }}>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td>
                    <Badge variant={isCompany ? 'warning' : 'primary'}>
                      {isCompany ? 'Doanh nghiệp' : 'Nông trại'}
                    </Badge>
                  </td>
                  <td>
                    <div className={styles.farmCell}>
                      <div className={styles.farmLogo} style={{ backgroundColor: isCompany ? '#fef3c7' : '#dcfce7', color: isCompany ? '#d97706' : '#16a34a' }}>
                        <Icon size={16} />
                      </div>
                      <span className={styles.farmName}>{name || 'Chưa cập nhật'}</span>
                    </div>
                  </td>
                  <td>{row.user.email}</td>
                  <td>{new Date(row.user.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>{row.boardCount || 0}</td>
                  <td>
                    <Badge variant={row.user.isActive === false ? 'danger' : 'success'}>
                      {row.user.isActive === false ? 'Bị Khóa' : 'Hoạt động'}
                    </Badge>
                  </td>
                  <td style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleToggleLock(row.user._id, row.user.isActive !== false)}
                      style={{
                        padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 500,
                        border: '1px solid var(--color-border)', borderRadius: '6px',
                        background: 'white', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', gap: '0.35rem', 
                        color: row.user.isActive !== false ? '#ef4444' : '#10b981',
                        transition: 'all 0.2s',
                        /* whiteSpace: nowrap */
                      }}
                      title={row.user.isActive !== false ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                    >
                      {row.user.isActive !== false ? <Lock size={14} /> : <Unlock size={14} />}
                      {row.user.isActive !== false ? 'Khóa' : 'Mở khóa'}
                    </button>
                    <button
                      onClick={() => openResetModal(row.user._id, row.user.email, row.user.allowAdminReset || false)}
                      style={{
                        padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 500,
                        border: '1px solid var(--color-border)', borderRadius: '6px',
                        background: 'white', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', gap: '0.35rem', color: '#3b82f6',
                        transition: 'all 0.2s',
                        /* whiteSpace: nowrap */
                      }}
                    >
                      <KeyRound size={14} /> Đặt lại MK
                    </button>
                    <button
                      onClick={() => handleDeleteUser(row.user._id, row.user.email)}
                      style={{
                        padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 500,
                        border: '1px solid var(--color-error)', borderRadius: '6px',
                        background: '#fef2f2', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', gap: '0.35rem', color: 'var(--color-error)',
                        transition: 'all 0.2s',
                      }}
                      title="Xóa tài khoản vĩnh viễn"
                    >
                      <Trash2 size={14} /> Xóa
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, farmsData.length)} trong tổng số {farmsData.length} tài khoản
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: currentPage === 1 ? '#f1f5f9' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              Trước
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button 
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: currentPage === i + 1 ? '1px solid #10b981' : '1px solid #cbd5e1', backgroundColor: currentPage === i + 1 ? '#10b981' : 'white', color: currentPage === i + 1 ? 'white' : '#334155', cursor: 'pointer' }}
              >
                {i + 1}
              </button>
            ))}
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: currentPage === totalPages ? '#f1f5f9' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              Sau
            </button>
          </div>
        </div>
      )}

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
                  <option value="FARM">Nông trại (FARM)</option>
                  <option value="COMPANY">Công ty Dịch vụ (COMPANY)</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontWeight: 500 }}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={addLoading}
                  style={{ flex: 1, padding: '0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 500, opacity: addLoading ? 0.7 : 1 }}
                >
                  {addLoading ? 'Đang tạo...' : 'Tạo tài khoản'}
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
          <Card style={{ width: '400px', padding: '2rem', backgroundColor: 'white' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>Đặt lại mật khẩu</h2>
            
            <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#475569' }}>
              Đặt lại mật khẩu cho tài khoản: <br/>
              <strong>{resetUserEmail}</strong>
            </p>

            {!resetUserAllowed && (
              <div style={{ padding: '1rem', background: '#fef2f2', color: '#b91c1c', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                <strong>Lưu ý:</strong> Tài khoản này chưa bật tùy chọn <em>&quot;Cho phép Admin đặt lại mật khẩu&quot;</em> trong cài đặt bảo mật. 
                Bạn không thể đặt lại mật khẩu trừ khi chủ tài khoản kích hoạt tính năng này.
              </div>
            )}

            {resetError && <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.875rem' }}>{resetError}</div>}
            {resetSuccess && <div style={{ color: '#10b981', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>{resetSuccess}</div>}

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Mật khẩu mới</label>
                <input 
                  type="password" 
                  value={resetNewPassword} 
                  onChange={e => setResetNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                  required
                  disabled={!resetUserAllowed || !!resetSuccess}
                  placeholder="Nhập mật khẩu mới..."
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsResetModalOpen(false)}
                  style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontWeight: 500 }}
                >
                  {resetSuccess ? 'Đóng' : 'Hủy'}
                </button>
                {!resetSuccess && (
                  <button 
                    type="submit" 
                    disabled={resetLoading || !resetUserAllowed || !resetNewPassword}
                    style={{ flex: 1, padding: '0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 500, opacity: (resetLoading || !resetUserAllowed || !resetNewPassword) ? 0.5 : 1 }}
                  >
                    {resetLoading ? 'Đang xử lý...' : 'Xác nhận'}
                  </button>
                )}
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}