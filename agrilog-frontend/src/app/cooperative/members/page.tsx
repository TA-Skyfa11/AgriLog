'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/cooperative.module.css';
import { 
  Users, UserPlus, Phone, MapPin, Sprout, ArrowLeft, 
  X, Check, Search, ShieldCheck, Copy, Trash2, Building, 
  CheckCircle2, UserCheck, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function CooperativeMembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [coop, setCoop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalTab, setModalTab] = useState<'search' | 'manual'>('search');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Search registered farmers
  const [farmerSearchQuery, setFarmerSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingFarmers, setSearchingFarmers] = useState(false);
  const [addingMemberId, setAddingMemberId] = useState<string | null>(null);

  // Manual form data
  const [formData, setFormData] = useState({
    ownerName: '',
    farmName: '',
    phone: '',
    areaSqm: '',
    mainCropType: '',
    address: '',
  });

  const loadMembers = async () => {
    try {
      setLoading(true);
      const res = await fetchAPI('/cooperative/members');
      if (res.success) {
        setMembers(res.data || []);
        if (res.cooperative) setCoop(res.cooperative);
      }
    } catch (e) {
      toast.error('Lỗi tải danh sách xã viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // Search farmers by phone/name
  const handleSearchFarmers = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!farmerSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setSearchingFarmers(true);
      const res = await fetchAPI(`/cooperative/search-farmers?q=${encodeURIComponent(farmerSearchQuery.trim())}`);
      if (res.success) {
        setSearchResults(res.data || []);
      }
    } catch (err: any) {
      toast.error('Lỗi tìm kiếm nông dân');
    } finally {
      setSearchingFarmers(false);
    }
  };

  // Add existing farmer to coop
  const handleAddExistingFarmer = async (farmer: any) => {
    try {
      setAddingMemberId(farmer._id);
      const res = await fetchAPI('/cooperative/members', {
        method: 'POST',
        body: JSON.stringify({
          farmProfileId: farmer._id,
        }),
      });

      if (res.success) {
        toast.success(`Đã thêm ${farmer.farmName || farmer.ownerName} vào HTX thành công!`);
        await loadMembers();
        // Update search results status
        setSearchResults(prev => prev.map(p => p._id === farmer._id ? { ...p, isCurrentMember: true } : p));
      } else {
        toast.error(res.message || 'Lỗi thêm xã viên');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi thêm xã viên');
    } finally {
      setAddingMemberId(null);
    }
  };

  // Remove member from coop
  const handleRemoveMember = async (member: any) => {
    const name = member.farmName || member.ownerName || 'hộ xã viên này';
    if (!window.confirm(`Bạn có chắc chắn muốn xóa "${name}" khỏi Hợp tác xã không? Dữ liệu mùa vụ và nhật ký canh tác của nông dân vẫn được giữ nguyên độc lập trên tài khoản của họ.`)) {
      return;
    }

    try {
      const res = await fetchAPI(`/cooperative/members/${member._id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        toast.success(`Đã xóa "${name}" khỏi Hợp tác xã thành công!`);
        loadMembers();
      } else {
        toast.error(res.message || 'Lỗi khi xóa xã viên');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi kết nối khi xóa xã viên');
    }
  };

  // Create new member manually
  const handleAddMemberManual = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchAPI('/cooperative/members', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (res.success) {
        toast.success('Đã thêm hộ xã viên mới vào HTX thành công!');
        setShowAddModal(false);
        setFormData({ ownerName: '', farmName: '', phone: '', areaSqm: '', mainCropType: '', address: '' });
        loadMembers();
      } else {
        toast.error(res.message || 'Lỗi thêm xã viên');
      }
    } catch (e) {
      toast.error('Lỗi kết nối khi thêm xã viên');
    }
  };

  const filteredMembers = members.filter(m => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const nameMatch = (m.ownerName || m.user?.name || '').toLowerCase().includes(term);
    const farmMatch = (m.farmName || '').toLowerCase().includes(term);
    const phoneMatch = (m.contactPhone || m.user?.phone || '').includes(term);
    return nameMatch || farmMatch || phoneMatch;
  });

  return (
    <div className={styles.container}>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/cooperative/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: '#64748b', textDecoration: 'none', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Quay lại Bảng điều khiển HTX
        </Link>
      </div>

      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>
            <Users size={28} color="#16a34a" /> Quản lý Hộ thành viên (Xã viên HTX)
          </h1>
          <p className={styles.headerSubtitle}>
            Danh sách các nông hộ xã viên tham gia chuỗi liên kết sản xuất nông sản an toàn của {coop?.name || 'Hợp tác xã'}.
          </p>
        </div>
        <button onClick={() => { setShowAddModal(true); setModalTab('search'); }} className={styles.btnPrimary}>
          <UserPlus size={16} /> Thêm Xã viên vào HTX
        </button>
      </div>

      {/* Invite Code Share Card */}
      <div style={{ 
        background: '#f0fdf4', 
        border: '1px solid #bbf7d0', 
        borderRadius: '12px', 
        padding: '1.25rem 1.5rem', 
        marginBottom: '1.5rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '1rem' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building size={24} color="#16a34a" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              MÃ LIÊN KẾT HỢP TÁC XÃ
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0.15rem 0' }}>
              Mã HTX: <span style={{ color: '#15803d', fontFamily: 'monospace', background: '#dcfce7', padding: '0.2rem 0.6rem', borderRadius: '6px', letterSpacing: '1px' }}>{coop?.code || 'HTX-HB01'}</span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#475569' }}>
              Chia sẻ mã này cho nông dân để họ tự nhập trong mục <strong>Cài đặt &gt; Hợp tác xã liên kết</strong> để tham gia ngay.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (coop?.code) {
              navigator.clipboard.writeText(coop.code);
              toast.success(`Đã sao chép mã ${coop.code} vào bộ nhớ tạm!`);
            }
          }}
          className={styles.btnOutline}
          style={{ background: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, padding: '0.6rem 1.25rem' }}
        >
          <Copy size={16} /> Sao chép Mã HTX
        </button>
      </div>

      {/* Search and Summary */}
      <div className={styles.card} style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#334155' }}>
            Tổng số: <strong style={{ color: '#16a34a' }}>{members.length}</strong> hộ xã viên | Tổng diện tích: <strong>{members.reduce((sum, m) => sum + (Number(m.areaSqm) || 0), 0).toLocaleString('vi-VN')} m²</strong>
          </div>
          <div style={{ position: 'relative', minWidth: '280px' }}>
            <input 
              type="text" 
              placeholder="Tìm theo tên chủ hộ, tên vườn, SĐT..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.75rem 0.45rem 2rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            />
            <Search size={15} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.card}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên Hộ xã viên</th>
                <th>Chủ hộ / Đại diện</th>
                <th>Số điện thoại</th>
                <th>Địa chỉ vùng trồng</th>
                <th>Diện tích (m²)</th>
                <th>Cây trồng chính</th>
                <th>Số mùa vụ</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    Không tìm thấy xã viên nào. Hãy thêm xã viên hoặc chia sẻ Mã HTX để nông dân tham gia.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m, idx) => (
                  <tr key={m._id}>
                    <td>{idx + 1}</td>
                    <td><strong>{m.farmName}</strong></td>
                    <td>{m.ownerName || m.user?.name || '—'}</td>
                    <td>{m.contactPhone || m.user?.phone || '—'}</td>
                    <td>{m.address || '—'}</td>
                    <td><strong>{Number(m.areaSqm || 0).toLocaleString('vi-VN')}</strong></td>
                    <td><span className={`${styles.badge} ${styles.badgeInProgress}`}>{m.mainCropType || 'Rau màu'}</span></td>
                    <td>{m.boardsCount || 0} luống</td>
                    <td><span className={`${styles.badge} ${styles.badgeSafe}`}>Đang liên kết</span></td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m)}
                        style={{
                          background: 'none',
                          border: '1px solid #fecaca',
                          color: '#dc2626',
                          borderRadius: '6px',
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        title="Xóa hộ này khỏi HTX"
                      >
                        <Trash2 size={13} /> Xóa khỏi HTX
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Member with 2 Tabs */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Thêm Xã viên vào Hợp tác xã</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setModalTab('search')}
                style={{
                  padding: '0.6rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: modalTab === 'search' ? '#16a34a' : '#64748b',
                  borderBottom: modalTab === 'search' ? '2px solid #16a34a' : '2px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
              >
                <Search size={15} /> Tìm nông dân trên hệ thống
              </button>
              <button
                type="button"
                onClick={() => setModalTab('manual')}
                style={{
                  padding: '0.6rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: modalTab === 'manual' ? '#16a34a' : '#64748b',
                  borderBottom: modalTab === 'manual' ? '2px solid #16a34a' : '2px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
              >
                <UserPlus size={15} /> Tạo mới hộ nông dân
              </button>
            </div>

            {/* TAB 1: Search farmers */}
            {modalTab === 'search' && (
              <div>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0 0 1rem 0' }}>
                  Tìm kiếm nông dân đã có tài khoản AgriLog theo <strong>Số điện thoại</strong>, <strong>Họ tên</strong> hoặc <strong>Tên nông trại</strong> để đưa vào HTX chỉ với 1 click.
                </p>

                <form onSubmit={handleSearchFarmers} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type="text"
                      placeholder="Nhập SĐT, Tên hoặc Nông trại cần tìm..."
                      value={farmerSearchQuery}
                      onChange={(e) => setFarmerSearchQuery(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem' }}
                    />
                    <Search size={15} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  </div>
                  <button type="submit" className={styles.btnPrimary} disabled={searchingFarmers} style={{ padding: '0.55rem 1rem' }}>
                    {searchingFarmers ? 'Đang tìm...' : 'Tìm kiếm'}
                  </button>
                </form>

                {/* Results list */}
                <div style={{ minHeight: '160px', maxHeight: '280px', overflowY: 'auto' }}>
                  {searchingFarmers ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>Đang tìm kiếm...</div>
                  ) : searchResults.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {searchResults.map((f) => (
                        <div key={f._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>{f.farmName}</div>
                            <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.125rem' }}>
                              Chủ hộ: <strong>{f.ownerName}</strong> {f.phone ? `• SĐT: ${f.phone}` : ''}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>
                              {f.mainCropType} • {Number(f.areaSqm || 0).toLocaleString('vi-VN')} m² {f.address ? `• ${f.address}` : ''}
                            </div>
                          </div>

                          <div>
                            {f.isCurrentMember ? (
                              <span style={{ fontSize: '0.75rem', background: '#ecfdf5', color: '#059669', padding: '0.35rem 0.6rem', borderRadius: '6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                <CheckCircle2 size={13} /> Đã là xã viên
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddExistingFarmer(f)}
                                disabled={addingMemberId === f._id}
                                className={styles.btnPrimary}
                                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8125rem' }}
                              >
                                {addingMemberId === f._id ? 'Đang thêm...' : (f.hasOtherCooperative ? 'Chuyển vào HTX' : 'Thêm vào HTX')}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : farmerSearchQuery ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                      Không tìm thấy nông dân nào khớp với &quot;{farmerSearchQuery}&quot;. Bạn có thể chuyển sang tab &quot;Tạo mới hộ nông dân&quot; để thêm thủ công.
                    </div>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                      Nhập số điện thoại (ví dụ: 0987...) hoặc tên nông dân để bắt đầu tìm kiếm.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Manual creation */}
            {modalTab === 'manual' && (
              <form onSubmit={handleAddMemberManual}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Họ và tên Chủ hộ xã viên *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ví dụ: Trần Văn Ba" 
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Tên Nông trại / Vườn *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ví dụ: Nông trại Ba Hưng" 
                    value={formData.farmName}
                    onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Số điện thoại *</label>
                    <input 
                      type="tel" 
                      required 
                      placeholder="0912345678" 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Diện tích (m²) *</label>
                    <input 
                      type="number" 
                      required 
                      placeholder="3000" 
                      value={formData.areaSqm}
                      onChange={(e) => setFormData({ ...formData, areaSqm: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Cây trồng chính</label>
                  <input 
                    type="text" 
                    placeholder="Ví dụ: Dưa lưới, Cà chua..." 
                    value={formData.mainCropType}
                    onChange={(e) => setFormData({ ...formData, mainCropType: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Địa chỉ vùng trồng</label>
                  <input 
                    type="text" 
                    placeholder="Thôn, Xã, Huyện..." 
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setShowAddModal(false)} className={styles.btnOutline}>
                    Hủy
                  </button>
                  <button type="submit" className={styles.btnPrimary}>
                    Xác nhận Thêm xã viên
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
