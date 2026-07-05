'use client';

import React from 'react';
import { Store, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function MarketplacePage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{
        width: '120px',
        height: '120px',
        backgroundColor: '#f0fdf4',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '2rem',
        border: '4px solid #dcfce7'
      }}>
        <Store size={64} color="#16a34a" />
      </div>

      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: 800,
        color: 'var(--color-text-main)',
        marginBottom: '1rem'
      }}>Cửa Hàng Nông Sản - Sắp Ra Mắt</h1>
      
      <p style={{
        fontSize: '1.125rem',
        color: 'var(--color-text-muted)',
        maxWidth: '600px',
        marginBottom: '2.5rem',
        lineHeight: 1.6
      }}>
        Chúng tôi đang xây dựng nền tảng thương mại điện tử dành riêng cho nông trại (Marketplace). Sắp tới, bạn có thể dễ dàng rao bán nông sản, tìm kiếm đối tác thu mua và mua sắm vật tư trực tiếp tại đây!
      </p>

      <Link href="/dashboard" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '1rem 2rem',
        backgroundColor: 'var(--color-primary-600)',
        color: 'white',
        borderRadius: '9999px',
        fontWeight: 700,
        textDecoration: 'none',
        transition: 'background-color 0.2s',
      }}>
        Quay lại Bảng điều khiển <ArrowRight size={18} />
      </Link>
    </div>
  );
}
