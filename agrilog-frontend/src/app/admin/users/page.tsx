/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { Filter, UserPlus, Shield, Sprout, Ban, Building, KeyRound, Briefcase, Lock, Unlock, Trash2, Zap, ZapOff, Search, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import styles from '@/css/Users.module.css';
import { fetchAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useDialog } from '@/context/DialogContext';

export default function UsersPage() {
  const dialog = useDialog();

  const [farmsData, setFarmsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination (Phân trang gọn gàng theo yêu cầu, không liệt kê quá dài)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(8);
  const [searchTerm, setSearchTerm] = useState('');

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
        // Luôn sắp xếp thứ tự tài khoản tạo mới nhất đến cũ nhất
        const sorted = (res.data || []).sort((a: any, b: any) => {
          return new Date(b.user.createdAt).getTime() - new Date(a.user.createdAt).getTime();
        });
        setFarmsData(sorted);
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

  const openResetModal = async (userId: string, email: string, allowAdminReset: boolean) => {
    setResetUserId(userId);
    setResetUserEmail(email);
    setResetUserAllowed(allowAdminReset !== false);
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
    if (!(await dialog.confirm(`Bạn có chắc muốn ${currentStatus ? 'khóa' : 'mở khóa'} tài khoản này?`))) return;
    try {
      const res = await fetchAPI(`/admin/users/${userId}/toggle-lock`, { method: 'PUT' });
      if (res.success) {
        loadUsers();
      } else {
        toast.error(res.message || 'Thao tác thất bại');
      }
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra');
    }
  };

  const handleToggleDevPayment = async (userId: string, email: string, currentStatus: boolean) => {
    const actionText = currentStatus ? 'thu hồi quyền bypass' : 'cấp quyền bypass';
    if (!(await dialog.confirm(`Bạn có chắc muốn ${actionText} thanh toán (Dev Test) cho tài khoản ${email}?`))) return;
    try {
      const res = await fetchAPI(`/admin/users/${userId}/toggle-dev-payment`, { method: 'PUT' });
      if (res.success) {
        toast.success(res.message || 'Cập nhật quyền thành công!');
        loadUsers();
      } else {
        toast.error(res.message || 'Thao tác thất bại');
      }
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!(await dialog.confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản ${email} và TẤT CẢ dữ liệu liên quan? Hành động này không thể hoàn tác!`))) return;
    try {
      const res = await fetchAPI(`/admin/users/${userId}`, { method: 'DELETE' });
      if (res.success) {
        toast.success('Xóa tài khoản thành công!');
        loadUsers();
      } else {
        toast.error(res.message || 'Xóa tài khoản thất bại');
      }
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra khi xóa tài khoản');
    }
  };

  if (loading && farmsData.length === 0) {
    return <div className={styles.container} style={{ padding: '2rem' }}>Đang tải dữ liệu...</div>;
  }

  // Lọc theo từ khóa tìm kiếm
  const filteredData = farmsData.filter((row: any) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const isAdmin = row.user.role === 'ADMIN';
    const isCompany = row.user.role === 'COMPANY';
    const name = isAdmin
      ? (row.user.name || 'Quản trị viên Hệ thống')
      : isCompany
        ? row.profile?.companyName
        : row.profile?.farmName;
    const email = row.user.email || '';
    const phone = row.user.phone || '';
    return (
      (name && name.toLowerCase().includes(term)) ||
      email.toLowerCase().includes(term) ||
      phone.toLowerCase().includes(term)
    );
  });

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const kpis = [
    { label: 'Tổng tài khoản', value: farmsData.length, meta: 'Dữ liệu thực', isPos: true },
    { label: 'Tài khoản hoạt động', value: farmsData.filter(f => f.user.isActive !== false).length, meta: 'Đang hoạt động', isPos: true },
    { label: 'Tài khoản mới (7 ngày)', value: farmsData.filter(f => (Date.now() - new Date(f.user.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000).length, meta: 'Tạo gần đây', isPos: true },
    { label: 'Tổng số bảng/SP', value: farmsData.reduce((acc, f) => acc + (f.boardCount || 0), 0), meta: 'Trên toàn hệ thống', isPos: true },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý người dùng</h1>
          <p className={styles.subtitle}>
            Danh sách tất cả các tài khoản trên hệ thống AgriLog, sắp xếp từ mới nhất đến cũ nhất.
          </p>
        </div>
        <div className={styles.actions} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Ô tìm kiếm */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Tìm tên, SĐT, email..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '0.5rem 0.75rem 0.5rem 2rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                fontSize: '0.875rem',
                width: '210px'
              }}
            />
            <Search size={15} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>

          <select 
            value={filterRole} 
            onChange={e => setFilterRole(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.875rem' }}
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="FARM">Nông trại</option>
            <option value="COMPANY">Doanh nghiệp</option>
            <option value="ADMIN">Quản trị viên</option>
          </select>
          
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.875rem' }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Bị khóa</option>
          </select>

          {/* Chọn số lượng hiển thị trên mỗi trang */}
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{ 
              padding: '0.5rem 0.75rem', 
              borderRadius: '8px', 
              border: '1px solid #cbd5e1', 
              backgroundColor: 'white', 
              color: '#334155', 
              outline: 'none', 
              fontSize: '0.875rem',
              cursor: 'pointer' 
            }}
            title="Số tài khoản trên mỗi trang"
          >
            <option value="5">5 / trang</option>
            <option value="8">8 / trang</option>
            <option value="10">10 / trang</option>
            <option value="15">15 / trang</option>
            <option value="20">20 / trang</option>
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
              <th style={{ width: '50px' }}>STT</th>
              <th>Vai trò</th>
              <th>Tên / Thương hiệu</th>
              <th>SĐT / Email Đăng Ký</th>
              <th style={{ minWidth: '160px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>Ngày Đăng Ký</span>
                  <span style={{ fontSize: '0.72rem', color: '#15803d', backgroundColor: '#dcfce7', padding: '0.1rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
                    Mới nhất ↓
                  </span>
                </div>
              </th>
              <th>Số lượng (Bảng/SP)</th>
              <th>Trạng Thái</th>
              <th>Bypass TT (Dev)</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && !loading && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                  {searchTerm ? 'Không tìm thấy tài khoản nào khớp với từ khóa tìm kiếm.' : 'Không có dữ liệu.'}
                </td>
              </tr>
            )}
            {currentData.map((row, index) => {
              const isAdmin = row.user.role === 'ADMIN';
              const isCompany = row.user.role === 'COMPANY';
              const Icon = isAdmin ? Shield : isCompany ? Briefcase : Sprout;
              const name = isAdmin
                ? (row.user.name || 'Quản trị viên Hệ thống')
                : isCompany
                  ? row.profile?.companyName
                  : row.profile?.farmName;

              const isRecentlyCreated = (Date.now() - new Date(row.user.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
              const isToday = new Date(row.user.createdAt).toDateString() === new Date().toDateString();

              return (
                <tr key={row.user._id}>
                  <td style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    {(currentPage - 1) * pageSize + index + 1}
                  </td>
                  <td>
                    <Badge variant={isAdmin ? 'danger' : isCompany ? 'warning' : 'primary'}>
                      {isAdmin ? 'Quản trị viên' : isCompany ? 'Doanh nghiệp' : 'Nông trại'}
                    </Badge>
                  </td>
                  <td>
                    <div className={styles.farmCell}>
                      <div 
                        className={styles.farmLogo} 
                        style={{ 
                          backgroundColor: isAdmin ? '#fee2e2' : isCompany ? '#fef3c7' : '#dcfce7', 
                          color: isAdmin ? '#dc2626' : isCompany ? '#d97706' : '#16a34a' 
                        }}
                      >
                        <Icon size={16} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className={styles.farmName}>{name || 'Chưa cập nhật'}</span>
                        {isToday && (
                          <span style={{ fontSize: '0.65rem', backgroundColor: '#fef08a', color: '#854d0e', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>
                            HÔM NAY
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    {row.user.phone ? (
                      <div>
                        <span style={{ fontWeight: 600 }}>{row.user.phone}</span>
                        {row.user.email && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block' }}>
                            {row.user.email}
                          </span>
                        )}
                      </div>
                    ) : (
                      row.user.email || '—'
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                          {new Date(row.user.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {new Date(row.user.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      {isRecentlyCreated && !isToday && (
                        <span style={{ fontSize: '0.65rem', backgroundColor: '#dcfce7', color: '#16a34a', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>
                          Mới
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{isAdmin ? '—' : row.boardCount || 0}</td>
                  <td>
                    <Badge variant={row.user.isActive === false ? 'danger' : 'success'}>
                      {row.user.isActive === false ? 'Bị Khóa' : 'Hoạt động'}
                    </Badge>
                  </td>
                  <td>
                    {isAdmin ? (
                      <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600 }}>Toàn quyền</span>
                    ) : (
                      <button
                        onClick={() => handleToggleDevPayment(row.user._id, row.user.phone || row.user.email || 'Người dùng', row.user.allowDevPayment || false)}
                        style={{
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: row.user.allowDevPayment ? '1px solid #86efac' : '1px solid #e2e8f0',
                          backgroundColor: row.user.allowDevPayment ? '#f0fdf4' : '#f8fafc',
                          color: row.user.allowDevPayment ? '#15803d' : '#64748b',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap',
                        }}
                        title={row.user.allowDevPayment ? "Bấm để thu hồi quyền bypass thanh toán" : "Bấm để cấp quyền bypass thanh toán (Dev Test)"}
                      >
                        {row.user.allowDevPayment ? (
                          <>
                            <Zap size={14} color="#16a34a" />
                            <span>Đã cấp phép</span>
                          </>
                        ) : (
                          <>
                            <ZapOff size={14} color="#94a3b8" />
                            <span>Chưa cấp</span>
                          </>
                        )}
                      </button>
                    )}
                  </td>
                  <td style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {isAdmin ? (
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic', padding: '0.35rem 0' }}>
                        Tài khoản hệ thống
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleToggleLock(row.user._id, row.user.isActive !== false)}
                          style={{
                            padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 500,
                            border: '1px solid var(--color-border)', borderRadius: '6px',
                            background: 'white', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', gap: '0.35rem', 
                            color: row.user.isActive !== false ? '#ef4444' : '#10b981',
                            transition: 'all 0.2s',
                          }}
                          title={row.user.isActive !== false ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                        >
                          {row.user.isActive !== false ? <Lock size={14} /> : <Unlock size={14} />}
                          {row.user.isActive !== false ? 'Khóa' : 'Mở khóa'}
                        </button>
                        <button
                          onClick={() => openResetModal(row.user._id, row.user.phone || row.user.email || 'Người dùng', row.user.allowAdminReset !== false)}
                          style={{
                            padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 500,
                            border: '1px solid var(--color-border)', borderRadius: '6px',
                            background: 'white', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', gap: '0.35rem', color: '#3b82f6',
                            transition: 'all 0.2s',
                          }}
                        >
                          <KeyRound size={14} /> Đặt lại MK
                        </button>
                        <button
                          onClick={() => handleDeleteUser(row.user._id, row.user.phone || row.user.email || 'Người dùng')}
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
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', flexWrap: 'wrap', gap: '0.75rem', padding: '0.5rem 0' }}>
        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Hiển thị <strong>{totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> - <strong>{Math.min(currentPage * pageSize, totalItems)}</strong> trong tổng số <strong>{totalItems}</strong> tài khoản (mới nhất đến cũ nhất)
        </div>
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ 
                padding: '0.45rem 0.85rem', 
                borderRadius: '6px', 
                border: '1px solid #cbd5e1', 
                backgroundColor: currentPage === 1 ? '#f8fafc' : 'white', 
                color: currentPage === 1 ? '#94a3b8' : '#334155',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              ← Trước
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button 
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                style={{ 
                  minWidth: '36px',
                  padding: '0.45rem 0.65rem', 
                  borderRadius: '6px', 
                  border: currentPage === i + 1 ? '1px solid #10b981' : '1px solid #cbd5e1', 
                  backgroundColor: currentPage === i + 1 ? '#10b981' : 'white', 
                  color: currentPage === i + 1 ? 'white' : '#334155', 
                  fontWeight: currentPage === i + 1 ? 700 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                {i + 1}
              </button>
            ))}
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ 
                padding: '0.45rem 0.85rem', 
                borderRadius: '6px', 
                border: '1px solid #cbd5e1', 
                backgroundColor: currentPage === totalPages ? '#f8fafc' : 'white', 
                color: currentPage === totalPages ? '#94a3b8' : '#334155',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              Sau →
            </button>
          </div>
        )}
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
                  <option value="FARM">Nông trại (FARM)</option>
                  <option value="COMPANY">Công ty Dịch vụ (COMPANY)</option>
                  <option value="ADMIN">Quản trị viên (ADMIN)</option>
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
                <strong>Lưu ý:</strong> Tài khoản này đã tắt tùy chọn <em>&quot;Cho phép Admin đặt lại mật khẩu&quot;</em> trong cài đặt bảo mật. 
                Bạn không thể đặt lại mật khẩu trừ khi chủ tài khoản kích hoạt lại tính năng này.
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