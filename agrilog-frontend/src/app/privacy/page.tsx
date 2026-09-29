import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.6' }}>
      <Link href="/" style={{ color: '#15803d', textDecoration: 'none', fontWeight: 'bold' }}>← Quay lại Trang chủ</Link>
      <h1 style={{ marginTop: '2rem', color: '#111827' }}>Chính sách bảo mật</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Cập nhật lần cuối: Tháng 10, 2026</p>
      
      <h2 style={{ color: '#374151' }}>1. Thu thập thông tin</h2>
      <p>AgriLog thu thập các thông tin cơ bản để phục vụ việc quản lý nông trại của bạn bao gồm: Tên, email, số điện thoại, và dữ liệu nhật ký canh tác.</p>
      
      <h2 style={{ color: '#374151', marginTop: '1.5rem' }}>2. Sử dụng thông tin</h2>
      <p>Dữ liệu của bạn được sử dụng hoàn toàn cho mục đích tối ưu hóa quy trình trồng trọt và xuất báo cáo VietGAP/GlobalGAP nội bộ.</p>
      
      <h2 style={{ color: '#374151', marginTop: '1.5rem' }}>3. Bảo mật dữ liệu</h2>
      <p>Chúng tôi cam kết không mua bán, trao đổi dữ liệu canh tác và thông tin cá nhân của người dùng cho bất kỳ bên thứ ba nào.</p>

      <p style={{ marginTop: '3rem', fontStyle: 'italic', color: '#6b7280' }}>* Lưu ý: Đây là văn bản pháp lý đang trong quá trình hoàn thiện.</p>
    </div>
  );
}
