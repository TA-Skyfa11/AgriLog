'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';

export default function CooperativeLayout({ children }: { children: React.ReactNode }) {
  return <MainLayout role="COOPERATIVE">{children}</MainLayout>;
}
