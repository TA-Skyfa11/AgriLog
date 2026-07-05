'use client';

import React from 'react';
import styles from './reports.module.css';
import { BarChart2, Download } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Legend 
} from 'recharts';

const mockCostData = [
  { month: 'T1', phanBon: 4000, thuocBVTV: 2400, giong: 2400 },
  { month: 'T2', phanBon: 3000, thuocBVTV: 1398, giong: 2210 },
  { month: 'T3', phanBon: 2000, thuocBVTV: 9800, giong: 2290 },
  { month: 'T4', phanBon: 2780, thuocBVTV: 3908, giong: 2000 },
  { month: 'T5', phanBon: 1890, thuocBVTV: 4800, giong: 2181 },
  { month: 'T6', phanBon: 2390, thuocBVTV: 3800, giong: 2500 },
  { month: 'T7', phanBon: 3490, thuocBVTV: 4300, giong: 2100 },
];

const mockHarvestData = [
  { month: 'T1', sanLuong: 400 },
  { month: 'T2', sanLuong: 300 },
  { month: 'T3', sanLuong: 500 },
  { month: 'T4', sanLuong: 700 },
  { month: 'T5', sanLuong: 600 },
  { month: 'T6', sanLuong: 800 },
  { month: 'T7', sanLuong: 1000 },
];

export default function ReportsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}><BarChart2 size={24} color="#16a34a" /> Báo cáo & Thống kê</h1>
          <div className={styles.subtitle}>Phân tích chi tiết về hoạt động sản xuất, chi phí và doanh thu</div>
        </div>
        <button className={styles.button}>
          <Download size={18} /> Xuất báo cáo (PDF)
        </button>
      </div>

      <div className={styles.chartGrid}>
        <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
          <h3 className={styles.chartTitle}>Chi phí vật tư theo tháng (VNĐ)</h3>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <AreaChart data={mockCostData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="phanBon" name="Phân bón" stackId="1" stroke="#f59e0b" fill="#fef3c7" />
                <Area type="monotone" dataKey="thuocBVTV" name="Thuốc BVTV" stackId="1" stroke="#ef4444" fill="#fee2e2" />
                <Area type="monotone" dataKey="giong" name="Cây giống" stackId="1" stroke="#22c55e" fill="#dcfce7" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Sản lượng thu hoạch (Tấn)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={mockHarvestData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="sanLuong" name="Sản lượng" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Biến động giá trị tồn kho</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={mockCostData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="phanBon" name="Tồn kho" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
