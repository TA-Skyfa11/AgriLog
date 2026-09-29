import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.6' }}>
      <Link href="/" style={{ color: '#15803d', textDecoration: 'none', fontWeight: 'bold' }}>← Quay lại Trang chủ</Link>
      <h1 style={{ marginTop: '2rem', color: '#111827' }}>Điều khoản dịch vụ</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Cập nhật lần cuối: Tháng 10, 2026</p>
      
      <h2 style={{ color: '#374151' }}>1. Chấp nhận điều khoản</h2>
      <p>Bằng việc sử dụng nền tảng AgriLog, bạn đồng ý tuân thủ các điều khoản và điều kiện được quy định tại đây.</p>
      
      <h2 style={{ color: '#374151', marginTop: '1.5rem' }}>2. Sử dụng dịch vụ</h2>
      <p>Nền tảng AgriLog cung cấp các công cụ quản lý nông trại. Bạn cam kết sử dụng dịch vụ vào mục đích hợp pháp và cung cấp thông tin canh tác chính xác.</p>
      
      <h2 style={{ color: '#374151', marginTop: '1.5rem' }}>3. Quyền sở hữu trí tuệ</h2>
      <p>Toàn bộ thiết kế, mã nguồn và nội dung nền tảng thuộc bản quyền của đội ngũ phát triển AgriLog.</p>

      <p style={{ marginTop: '3rem', fontStyle: 'italic', color: '#6b7280' }}>* Lưu ý: Đây là văn bản pháp lý đang trong quá trình hoàn thiện.</p>
    </div>
  );
}
