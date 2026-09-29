import React from 'react';
import Link from 'next/link';

export default function DocsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.6' }}>
      <Link href="/" style={{ color: '#15803d', textDecoration: 'none', fontWeight: 'bold' }}>← Quay lại Trang chủ</Link>
      <h1 style={{ marginTop: '2rem', color: '#111827' }}>Tài liệu Hướng dẫn Sử dụng</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Dành cho Nền tảng AgriLog</p>
      
      <div style={{ padding: '1.5rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#166534' }}>Bắt đầu nhanh</h3>
        <ol style={{ margin: 0, paddingLeft: '1.25rem', color: '#15803d' }}>
          <li>Đăng ký tài khoản hệ thống</li>
          <li>Thiết lập hồ sơ nông trại của bạn</li>
          <li>Tạo khu vực canh tác và bắt đầu thêm nhật ký</li>
        </ol>
      </div>

      <h2 style={{ color: '#374151' }}>1. Quản lý Nhật ký canh tác</h2>
      <p>Tại giao diện chính, bấm vào nút <strong>&quot;Thêm nhật ký&quot;</strong>. Điền đầy đủ các thông tin về phân bón, thuốc bảo vệ thực vật, và lưu lại để hệ thống tự động theo dõi thời gian cách ly.</p>
      
      <h2 style={{ color: '#374151', marginTop: '1.5rem' }}>2. Xuất báo cáo VietGAP</h2>
      <p>Hệ thống hỗ trợ xuất báo cáo dưới dạng Excel/PDF định kỳ. Hãy đảm bảo bạn cập nhật đầy đủ nhật ký theo từng lô thửa trước khi kết xuất để nộp cho đơn vị chứng nhận.</p>
      
      <p style={{ marginTop: '3rem', fontStyle: 'italic', color: '#6b7280' }}>* Lưu ý: Giao diện HDSD chi tiết sẽ được cập nhật trong phiên bản sắp tới.</p>
    </div>
  );
}
