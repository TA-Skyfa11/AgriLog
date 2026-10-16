import puppeteer from 'puppeteer';

export const generatePdfFromHtml = async (htmlContent: string, landscape: boolean = true): Promise<Buffer> => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    const pdfUint8Array = await page.pdf({
      format: 'A4',
      landscape,
      printBackground: true,
      margin: {
        top: '12mm',
        right: '10mm',
        bottom: '12mm',
        left: '10mm',
      },
    });

    return Buffer.from(pdfUint8Array);
  } finally {
    await browser.close();
  }
};

const formatDate = (date: any): string => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const getBaseStyles = (primaryColor: string) => `
  @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    background-color: #ffffff;
    font-size: 11px;
    line-height: 1.4;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 12px;
    border-bottom: 2px solid ${primaryColor};
    margin-bottom: 14px;
  }
  .brand-title {
    font-size: 18px;
    font-weight: 700;
    color: ${primaryColor};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .farm-meta {
    font-size: 10px;
    color: #475569;
    margin-top: 3px;
  }
  .doc-title-block {
    text-align: right;
  }
  .doc-title {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    text-transform: uppercase;
  }
  .doc-date {
    font-size: 10px;
    color: #64748b;
    margin-top: 3px;
  }
  .info-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 14px;
  }
  .info-item {
    display: flex;
    flex-direction: column;
  }
  .info-label {
    font-size: 9px;
    color: #64748b;
    text-transform: uppercase;
    font-weight: 600;
  }
  .info-value {
    font-size: 11px;
    font-weight: 600;
    color: #0f172a;
    margin-top: 2px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  th {
    background-color: ${primaryColor};
    color: #ffffff;
    font-weight: 600;
    text-align: center;
    padding: 7px 6px;
    border: 1px solid ${primaryColor};
    font-size: 10px;
    text-transform: uppercase;
  }
  td {
    padding: 6px 6px;
    border: 1px solid #e2e8f0;
    font-size: 10px;
    vertical-align: middle;
    word-break: break-word;
  }
  tr:nth-child(even) {
    background-color: #f8fafc;
  }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .text-bold { font-weight: 600; }
  .footer {
    display: flex;
    justify-content: space-between;
    margin-top: 30px;
    page-break-inside: avoid;
  }
  .signature-box {
    text-align: center;
    width: 200px;
  }
  .sig-title {
    font-weight: 600;
    font-size: 11px;
    color: #0f172a;
  }
  .sig-subtitle {
    font-size: 9px;
    color: #64748b;
    font-style: italic;
    margin-top: 2px;
  }
  .sig-space {
    height: 55px;
  }
  .watermark {
    text-align: center;
    font-size: 9px;
    color: #94a3b8;
    margin-top: 15px;
    border-top: 1px dashed #e2e8f0;
    padding-top: 8px;
  }
`;

/**
 * HTML Template for Cultivation Diary
 */
export const buildCultivationHtml = (board: any, entries: any[], farmProfile: any): string => {
  const customCols = board.customColumns || [];
  const primaryColor = '#16a34a'; // Emerald Green
  const todayStr = formatDate(new Date());

  const rowsHtml = entries.map((entry, idx) => `
    <tr>
      <td class="text-center text-bold">${idx + 1}</td>
      <td class="text-center">${formatDate(entry.date)}</td>
      <td>${entry.stage || '—'}</td>
      <td class="text-bold">${entry.activityName || '—'}</td>
      <td>${entry.performer || '—'}</td>
      <td>${entry.weather || '—'}</td>
      <td>${entry.notes || '—'}</td>
      ${customCols.map((c: string) => `<td>${entry.customValues?.[c] || '—'}</td>`).join('')}
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Nhật ký Canh tác - ${board.name}</title>
      <style>${getBaseStyles(primaryColor)}</style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand-title">AGRILOG • SỔ NHẬT KÝ CANH TÁC</div>
          <div class="farm-meta">
            <strong>Trang trại:</strong> ${farmProfile?.farmName || 'Nông trại AgriLog'} &nbsp;|&nbsp;
            <strong>Địa chỉ:</strong> ${farmProfile?.address || '—'} &nbsp;|&nbsp;
            <strong>SĐT:</strong> ${farmProfile?.phone || '—'}
          </div>
        </div>
        <div class="doc-title-block">
          <div class="doc-title">${board.name}</div>
          <div class="doc-date">Ngày in biểu: ${todayStr}</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Cây trồng</span>
          <span class="info-value">${board.cropType || '—'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Diện tích</span>
          <span class="info-value">${board.areaSqm ? board.areaSqm.toLocaleString('vi-VN') + ' m²' : '—'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Khu vực / Lô</span>
          <span class="info-value">${board.areaText || '—'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Ngày bắt đầu vụ</span>
          <span class="info-value">${formatDate(board.startDate)}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 35px;">STT</th>
            <th style="width: 75px;">Ngày</th>
            <th style="width: 110px;">Giai đoạn</th>
            <th style="width: 140px;">Hoạt động</th>
            <th style="width: 90px;">Người làm</th>
            <th style="width: 90px;">Thời tiết</th>
            <th>Ghi chú</th>
            ${customCols.map((c: string) => `<th>${c}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="' + (7 + customCols.length) + '" class="text-center" style="padding: 20px;">Chưa có dữ liệu nhật ký</td></tr>'}
        </tbody>
      </table>

      <div class="footer">
        <div class="signature-box">
          <div class="sig-title">NGƯỜI LẬP NHẬT KÝ</div>
          <div class="sig-subtitle">(Ký và ghi rõ họ tên)</div>
          <div class="sig-space"></div>
        </div>
        <div class="signature-box">
          <div class="sig-title">CHỦ TRANG TRẠI / KỸ THUẬT</div>
          <div class="sig-subtitle">(Ký và ghi rõ họ tên)</div>
          <div class="sig-space"></div>
        </div>
      </div>

      <div class="watermark">
        Tài liệu được xuất tự động từ Nền tảng Quản lý Nông nghiệp Số AgriLog lúc ${todayStr}
      </div>
    </body>
    </html>
  `;
};

/**
 * HTML Template for Fertilizer Diary
 */
export const buildFertilizerHtml = (board: any, entries: any[], farmProfile: any): string => {
  const customCols = board.customColumns || [];
  const primaryColor = '#2563eb'; // Royal Blue
  const todayStr = formatDate(new Date());

  const rowsHtml = entries.map((entry, idx) => `
    <tr>
      <td class="text-center text-bold">${idx + 1}</td>
      <td class="text-center">${formatDate(entry.date)}</td>
      <td class="text-bold">${entry.materialName || '—'}</td>
      <td>${entry.manufacturer || '—'}</td>
      <td class="text-center text-bold">${entry.quantity || '—'}</td>
      <td class="text-center">${entry.appliedArea ? entry.appliedArea + ' m²' : '—'}</td>
      <td>${entry.performer || '—'}</td>
      <td>${entry.weather || '—'}</td>
      <td>${entry.notes || '—'}</td>
      ${customCols.map((c: string) => `<td>${entry.customValues?.[c] || '—'}</td>`).join('')}
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Nhật ký Bón phân - ${board.name}</title>
      <style>${getBaseStyles(primaryColor)}</style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand-title">AGRILOG • SỔ NHẬT KÝ BÓN PHÂN</div>
          <div class="farm-meta">
            <strong>Trang trại:</strong> ${farmProfile?.farmName || 'Nông trại AgriLog'} &nbsp;|&nbsp;
            <strong>Địa chỉ:</strong> ${farmProfile?.address || '—'} &nbsp;|&nbsp;
            <strong>SĐT:</strong> ${farmProfile?.phone || '—'}
          </div>
        </div>
        <div class="doc-title-block">
          <div class="doc-title">${board.name}</div>
          <div class="doc-date">Ngày in biểu: ${todayStr}</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Cây trồng</span>
          <span class="info-value">${board.cropType || '—'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Diện tích</span>
          <span class="info-value">${board.areaSqm ? board.areaSqm.toLocaleString('vi-VN') + ' m²' : '—'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Khu vực / Lô</span>
          <span class="info-value">${board.areaText || '—'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Ngày bắt đầu vụ</span>
          <span class="info-value">${formatDate(board.startDate)}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 35px;">STT</th>
            <th style="width: 75px;">Ngày bón</th>
            <th style="width: 140px;">Tên phân bón</th>
            <th style="width: 120px;">Nhà sản xuất</th>
            <th style="width: 80px;">Liều lượng</th>
            <th style="width: 80px;">Diện tích</th>
            <th style="width: 90px;">Người làm</th>
            <th style="width: 90px;">Thời tiết</th>
            <th>Ghi chú</th>
            ${customCols.map((c: string) => `<th>${c}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="' + (10 + customCols.length) + '" class="text-center" style="padding: 20px;">Chưa có dữ liệu nhật ký bón phân</td></tr>'}
        </tbody>
      </table>

      <div class="footer">
        <div class="signature-box">
          <div class="sig-title">NGƯỜI LẬP NHẬT KÝ</div>
          <div class="sig-subtitle">(Ký và ghi rõ họ tên)</div>
          <div class="sig-space"></div>
        </div>
        <div class="signature-box">
          <div class="sig-title">CHỦ TRANG TRẠI / KỸ THUẬT</div>
          <div class="sig-subtitle">(Ký và ghi rõ họ tên)</div>
          <div class="sig-space"></div>
        </div>
      </div>

      <div class="watermark">
        Tài liệu được xuất tự động từ Nền tảng Quản lý Nông nghiệp Số AgriLog lúc ${todayStr}
      </div>
    </body>
    </html>
  `;
};

/**
 * HTML Template for Pesticide Diary
 */
export const buildPesticideHtml = (board: any, entries: any[], farmProfile: any): string => {
  const customCols = board.customColumns || [];
  const primaryColor = '#ea580c'; // Vibrant Orange
  const todayStr = formatDate(new Date());

  const rowsHtml = entries.map((entry, idx) => `
    <tr>
      <td class="text-center text-bold">${idx + 1}</td>
      <td class="text-center">${formatDate(entry.date)}</td>
      <td class="text-bold">${entry.materialName || '—'}</td>
      <td>${entry.manufacturer || '—'}</td>
      <td>${entry.targetPest || '—'}</td>
      <td class="text-center text-bold">${entry.quantity || '—'}</td>
      <td class="text-center text-bold" style="color: #c2410c;">${entry.phiDays ? entry.phiDays + ' ngày' : '0'}</td>
      <td>${entry.performer || '—'}</td>
      <td>${entry.weather || '—'}</td>
      <td>${entry.notes || '—'}</td>
      ${customCols.map((c: string) => `<td>${entry.customValues?.[c] || '—'}</td>`).join('')}
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Nhật ký Thuốc BVTV - ${board.name}</title>
      <style>${getBaseStyles(primaryColor)}</style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand-title">AGRILOG • SỔ NHẬT KÝ THUỐC BẢO VỆ THỰC VẬT</div>
          <div class="farm-meta">
            <strong>Trang trại:</strong> ${farmProfile?.farmName || 'Nông trại AgriLog'} &nbsp;|&nbsp;
            <strong>Địa chỉ:</strong> ${farmProfile?.address || '—'} &nbsp;|&nbsp;
            <strong>SĐT:</strong> ${farmProfile?.phone || '—'}
          </div>
        </div>
        <div class="doc-title-block">
          <div class="doc-title">${board.name}</div>
          <div class="doc-date">Ngày in biểu: ${todayStr}</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Cây trồng</span>
          <span class="info-value">${board.cropType || '—'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Diện tích</span>
          <span class="info-value">${board.areaSqm ? board.areaSqm.toLocaleString('vi-VN') + ' m²' : '—'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Khu vực / Lô</span>
          <span class="info-value">${board.areaText || '—'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Ngày bắt đầu vụ</span>
          <span class="info-value">${formatDate(board.startDate)}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 35px;">STT</th>
            <th style="width: 75px;">Ngày phun</th>
            <th style="width: 120px;">Tên thuốc BVTV</th>
            <th style="width: 120px;">Nhà sản xuất</th>
            <th style="width: 100px;">Đối tượng hại</th>
            <th style="width: 75px;">Liều lượng</th>
            <th style="width: 65px;">Cách ly</th>
            <th style="width: 85px;">Người phun</th>
            <th style="width: 85px;">Thời tiết</th>
            <th>Ghi chú</th>
            ${customCols.map((c: string) => `<th>${c}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="' + (9 + customCols.length) + '" class="text-center" style="padding: 20px;">Chưa có dữ liệu nhật ký thuốc BVTV</td></tr>'}
        </tbody>
      </table>

      <div class="footer">
        <div class="signature-box">
          <div class="sig-title">NGƯỜI LẬP NHẬT KÝ</div>
          <div class="sig-subtitle">(Ký và ghi rõ họ tên)</div>
          <div class="sig-space"></div>
        </div>
        <div class="signature-box">
          <div class="sig-title">CHỦ TRANG TRẠI / KỸ THUẬT</div>
          <div class="sig-subtitle">(Ký và ghi rõ họ tên)</div>
          <div class="sig-space"></div>
        </div>
      </div>

      <div class="watermark">
        Tài liệu được xuất tự động từ Nền tảng Quản lý Nông nghiệp Số AgriLog lúc ${todayStr}
      </div>
    </body>
    </html>
  `;
};

/**
 * HTML Template for Monthly Report
 */
export const buildReportsHtml = (stats: any, month: string, farmProfile: any): string => {
  const primaryColor = '#0f766e'; // Teal
  const todayStr = formatDate(new Date());

  const summary = stats.summary || {};
  const cultivationReport = stats.cultivationReport || [];
  const fertilizerReport = stats.fertilizerReport || [];
  const pesticideReport = stats.pesticideReport || [];
  const inventoryReport = stats.inventoryReport || [];

  const cultRows = cultivationReport.map((r: any, i: number) => `
    <tr>
      <td class="text-center text-bold">${i + 1}</td>
      <td class="text-bold">${r.activity || '—'}</td>
      <td>${r.crops || '—'}</td>
      <td class="text-center">${r.taskCount || 0}</td>
      <td class="text-center">${r.daysCount || 0}</td>
      <td class="text-center text-bold">${r.laborCount || 0}</td>
      <td class="text-right text-bold" style="color: #0f766e;">${(r.totalCost || 0).toLocaleString('vi-VN')} đ</td>
    </tr>
  `).join('');

  const fertRows = fertilizerReport.map((r: any, i: number) => `
    <tr>
      <td class="text-center text-bold">${i + 1}</td>
      <td class="text-bold">${r.name || r.materialName || '—'}</td>
      <td>${r.manufacturer || '—'}</td>
      <td class="text-center">${r.timesUsed || 0}</td>
      <td class="text-center text-bold">${r.totalQuantity || 0}</td>
      <td class="text-center">${r.totalArea || 0} m²</td>
      <td class="text-right text-bold" style="color: #0f766e;">${(r.totalCost || 0).toLocaleString('vi-VN')} đ</td>
    </tr>
  `).join('');

  const pestRows = pesticideReport.map((r: any, i: number) => `
    <tr>
      <td class="text-center text-bold">${i + 1}</td>
      <td class="text-bold">${r.name || r.materialName || '—'}</td>
      <td>${r.manufacturer || '—'}</td>
      <td>${r.targetPest || '—'}</td>
      <td class="text-center">${r.timesUsed || 0}</td>
      <td class="text-center text-bold">${r.totalQuantity || 0}</td>
      <td class="text-center">${r.phiDays ? `${r.phiDays} ngày` : '7 ngày'}</td>
      <td class="text-right text-bold" style="color: #0f766e;">${(r.totalCost || 0).toLocaleString('vi-VN')} đ</td>
    </tr>
  `).join('');

  const invRows = inventoryReport.map((r: any, i: number) => `
    <tr>
      <td class="text-center text-bold">${i + 1}</td>
      <td class="text-bold">${r.name || '—'}</td>
      <td class="text-center">${r.typeLabel || (r.type === 'FERTILIZER' ? 'Phân bón' : 'Thuốc BVTV')}</td>
      <td class="text-center text-bold">${r.quantity || 0} ${r.unit || ''}</td>
      <td class="text-center">${r.usedInMonth || '0'}</td>
      <td class="text-center">${r.expiryDate || '—'}</td>
      <td class="text-center">${r.statusText || 'Bình thường'}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Báo cáo hoạt động Nông trại tháng ${month}</title>
      <style>
        ${getBaseStyles(primaryColor)}
        .section-title {
          font-size: 13px;
          font-weight: 700;
          color: ${primaryColor};
          margin-top: 15px;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .kpi-container {
          display: flex;
          gap: 12px;
          margin-bottom: 15px;
        }
        .kpi-card {
          flex: 1;
          padding: 8px 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
        }
        .kpi-label {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
        }
        .kpi-val {
          font-size: 14px;
          font-weight: 700;
          color: ${primaryColor};
          margin-top: 2px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand-title">AGRILOG • BÁO CÁO TỔNG HỢP HOẠT ĐỘNG</div>
          <div class="farm-meta">
            <strong>Trang trại:</strong> ${farmProfile?.farmName || 'Nông trại AgriLog'} &nbsp;|&nbsp;
            <strong>Địa chỉ:</strong> ${farmProfile?.address || '—'} &nbsp;|&nbsp;
            <strong>SĐT:</strong> ${farmProfile?.phone || '—'}
          </div>
        </div>
        <div class="doc-title-block">
          <div class="doc-title">THÁNG: ${month}</div>
          <div class="doc-date">Ngày xuất: ${todayStr}</div>
        </div>
      </div>

      <div class="kpi-container">
        <div class="kpi-card">
          <div class="kpi-label">Tổng đầu việc</div>
          <div class="kpi-val">${summary.totalTasks || (cultivationReport.length + fertilizerReport.length + pesticideReport.length)} việc</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Tổng công lao động</div>
          <div class="kpi-val">${summary.totalLabor || cultivationReport.reduce((a: number, b: any) => a + (b.laborCount || 0), 0)} công</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Tổng chi phí sản xuất</div>
          <div class="kpi-val">${(summary.totalCost || 0).toLocaleString('vi-VN')} đ</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Vật tư theo dõi</div>
          <div class="kpi-val">${summary.materialsTotal || inventoryReport.length} loại</div>
        </div>
      </div>

      <div class="section-title">1. Tổng hợp Công việc & Nhật ký Canh tác</div>
      <table>
        <thead>
          <tr>
            <th style="width: 35px;">STT</th>
            <th>Hoạt động canh tác</th>
            <th style="width: 100px;">Cây trồng</th>
            <th style="width: 80px;">Số lần</th>
            <th style="width: 80px;">Số ngày</th>
            <th style="width: 80px;">Tổng công</th>
            <th style="width: 100px;" class="text-right">Chi phí</th>
          </tr>
        </thead>
        <tbody>
          ${cultRows || '<tr><td colspan="7" class="text-center" style="padding: 10px;">Không có dữ liệu trong tháng này</td></tr>'}
        </tbody>
      </table>

      <div class="section-title">2. Tổng hợp Vật tư Phân bón đã sử dụng</div>
      <table>
        <thead>
          <tr>
            <th style="width: 35px;">STT</th>
            <th>Tên loại phân bón</th>
            <th style="width: 110px;">Nhà sản xuất</th>
            <th style="width: 70px;">Số lần bón</th>
            <th style="width: 110px;">Tổng lượng bón</th>
            <th style="width: 100px;">Diện tích áp dụng</th>
            <th style="width: 100px;" class="text-right">Chi phí</th>
          </tr>
        </thead>
        <tbody>
          ${fertRows || '<tr><td colspan="7" class="text-center" style="padding: 10px;">Không có dữ liệu trong tháng này</td></tr>'}
        </tbody>
      </table>

      <div class="section-title">3. Tổng hợp Thuốc Bảo vệ Thực vật đã sử dụng</div>
      <table>
        <thead>
          <tr>
            <th style="width: 35px;">STT</th>
            <th>Tên thuốc BVTV</th>
            <th style="width: 110px;">Nhà sản xuất</th>
            <th style="width: 100px;">Đối tượng phòng trừ</th>
            <th style="width: 65px;">Số lần</th>
            <th style="width: 90px;">Tổng lượng</th>
            <th style="width: 80px;">Cách ly PHI</th>
            <th style="width: 95px;" class="text-right">Chi phí</th>
          </tr>
        </thead>
        <tbody>
          ${pestRows || '<tr><td colspan="8" class="text-center" style="padding: 10px;">Không có dữ liệu trong tháng này</td></tr>'}
        </tbody>
      </table>

      ${inventoryReport.length > 0 ? `
      <div class="section-title">4. Báo cáo Kho Vật tư & Tình trạng Tồn kho</div>
      <table>
        <thead>
          <tr>
            <th style="width: 35px;">STT</th>
            <th>Tên vật tư</th>
            <th style="width: 90px;">Phân loại</th>
            <th style="width: 100px;">Tồn kho hiện tại</th>
            <th style="width: 110px;">Đã dùng trong tháng</th>
            <th style="width: 95px;">Hạn sử dụng</th>
            <th style="width: 100px;">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          ${invRows}
        </tbody>
      </table>
      ` : ''}

      <div class="footer">
        <div class="signature-box">
          <div class="sig-title">NGƯỜI LẬP BÁO CÁO</div>
          <div class="sig-subtitle">(Ký và ghi rõ họ tên)</div>
          <div class="sig-space"></div>
        </div>
        <div class="signature-box">
          <div class="sig-title">CHỦ TRANG TRẠI / GIÁM ĐỐC</div>
          <div class="sig-subtitle">(Ký và ghi rõ họ tên)</div>
          <div class="sig-space"></div>
        </div>
      </div>

      <div class="watermark">
        Tài liệu được xuất tự động từ Nền tảng Quản lý Nông nghiệp Số AgriLog lúc ${todayStr}
      </div>
    </body>
    </html>
  `;
};


/**
 * HTML Template for Unified Diary (Gộp 3 bảng: Canh tác, Bón phân, Thuốc BVTV)
 */
export const buildUnifiedDiaryHtml = (
  mainBoard: any,
  cultivationData: { board: any; entries: any[] },
  fertilizerData: { board: any; entries: any[] },
  pesticideData: { board: any; entries: any[] },
  farmProfile: any
): string => {
  const primaryColor = '#16a34a'; // Agricultural Green
  const todayStr = formatDate(new Date());

  const cultEntries = cultivationData?.entries || [];
  const fertEntries = fertilizerData?.entries || [];
  const pestEntries = pesticideData?.entries || [];

  const cultCustomCols = cultivationData?.board?.customColumns || [];
  const fertCustomCols = fertilizerData?.board?.customColumns || [];
  const pestCustomCols = pesticideData?.board?.customColumns || [];

  // Cultivation Rows
  const cultRowsHtml = cultEntries.map((entry, idx) => `
    <tr>
      <td class="text-center text-bold">${idx + 1}</td>
      <td class="text-center">${formatDate(entry.date)}</td>
      <td>${entry.stage || '—'}</td>
      <td class="text-bold">${entry.activityName || '—'}</td>
      <td>${entry.performer || '—'}</td>
      <td>${entry.weather || '—'}</td>
      <td>${entry.notes || '—'}</td>
      ${cultCustomCols.map((c: string) => `<td>${entry.customValues?.[c] || '—'}</td>`).join('')}
    </tr>
  `).join('');

  // Fertilizer Rows
  const fertRowsHtml = fertEntries.map((entry, idx) => `
    <tr>
      <td class="text-center text-bold">${idx + 1}</td>
      <td class="text-center">${formatDate(entry.date)}</td>
      <td class="text-bold">${entry.materialName || '—'}</td>
      <td>${entry.manufacturer || '—'}</td>
      <td class="text-center text-bold">${entry.quantity || '—'}</td>
      <td class="text-center">${entry.appliedArea ? entry.appliedArea + ' m²' : '—'}</td>
      <td>${entry.performer || '—'}</td>
      <td>${entry.weather || '—'}</td>
      <td>${entry.notes || '—'}</td>
      ${fertCustomCols.map((c: string) => `<td>${entry.customValues?.[c] || '—'}</td>`).join('')}
    </tr>
  `).join('');

  // Pesticide Rows
  const pestRowsHtml = pestEntries.map((entry, idx) => `
    <tr>
      <td class="text-center text-bold">${idx + 1}</td>
      <td class="text-center">${formatDate(entry.date)}</td>
      <td class="text-bold">${entry.materialName || '—'}</td>
      <td>${entry.manufacturer || '—'}</td>
      <td>${entry.targetPest || '—'}</td>
      <td class="text-center text-bold">${entry.quantity || '—'}</td>
      <td class="text-center text-bold" style="color: #c2410c;">${entry.phiDays ? entry.phiDays + ' ngày' : '0'}</td>
      <td>${entry.performer || '—'}</td>
      <td>${entry.weather || '—'}</td>
      <td>${entry.notes || '—'}</td>
      ${pestCustomCols.map((c: string) => `<td>${entry.customValues?.[c] || '—'}</td>`).join('')}
    </tr>
  `).join('');

  const ownerName = farmProfile?.ownerName || (farmProfile?.farmName ? `Chủ trang trại: ${farmProfile.farmName}` : 'Họ và tên: ...................................');

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Sổ Nhật Ký Sản Xuất Tổng Hợp - ${mainBoard.name || 'AgriLog'}</title>
      <style>
        ${getBaseStyles(primaryColor)}
        
        /* Compact layout to optimize vertical spacing */
        .header {
          padding-bottom: 8px;
          margin-bottom: 8px;
        }
        .brand-title {
          font-size: 16px;
        }
        .info-grid {
          padding: 6px 12px;
          margin-bottom: 10px;
          gap: 8px;
        }
        .info-label {
          font-size: 8.5px;
        }
        .info-value {
          font-size: 10.5px;
        }
        table {
          margin-bottom: 6px;
        }
        th {
          padding: 5px 4px;
          font-size: 9px;
        }
        td {
          padding: 4px 5px;
          font-size: 9.5px;
        }

        .section-block {
          margin-bottom: 10px;
          page-break-inside: auto;
        }
        .section-header-wrap {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 10px;
          border-radius: 4px;
          margin-bottom: 4px;
          page-break-after: avoid;
        }
        .sec-bg-cultivation { background-color: #16a34a; color: #ffffff; }
        .sec-bg-fertilizer { background-color: #2563eb; color: #ffffff; }
        .sec-bg-pesticide { background-color: #ea580c; color: #ffffff; }
        .sec-title {
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .sec-count {
          font-size: 9.5px;
          font-weight: 600;
          opacity: 0.9;
        }
        .table-cultivation th { background-color: #15803d !important; border-color: #15803d !important; }
        .table-fertilizer th { background-color: #1d4ed8 !important; border-color: #1d4ed8 !important; }
        .table-pesticide th { background-color: #c2410c !important; border-color: #c2410c !important; }
        .empty-row td {
          padding: 12px !important;
          color: #94a3b8;
          font-style: italic;
          text-align: center;
        }

        /* CONFIRMATION & SIGNATURE SECTION */
        .confirmation-section {
          margin-top: 12px;
          page-break-inside: avoid;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background-color: #fbfcfe;
          padding: 8px 12px 10px 12px;
        }
        .confirm-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 5px;
          margin-bottom: 8px;
        }
        .confirm-statement {
          font-size: 9px;
          font-style: italic;
          color: #475569;
        }
        .confirm-date {
          font-size: 9.5px;
          font-style: italic;
          color: #1e293b;
          font-weight: 500;
        }
        .signatures-grid {
          display: flex;
          justify-content: space-between;
          gap: 14px;
        }
        .sig-card {
          flex: 1;
          text-align: center;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 5px;
          padding: 7px 8px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .sig-role {
          font-size: 10px;
          font-weight: 700;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .sig-hint {
          font-size: 8px;
          color: #64748b;
          font-style: italic;
          margin-top: 2px;
          margin-bottom: 5px;
        }
        .sig-space-box {
          height: 60px;
          border: 1.5px dashed #cbd5e1;
          border-radius: 4px;
          background-color: #fafbfc;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-size: 8px;
          font-style: italic;
          margin-bottom: 6px;
        }
        .sig-name {
          font-size: 9px;
          font-weight: 600;
          color: #1e293b;
          min-height: 14px;
        }
        .watermark {
          text-align: center;
          font-size: 8.5px;
          color: #94a3b8;
          margin-top: 8px;
          border-top: 1px dashed #e2e8f0;
          padding-top: 5px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand-title">AGRILOG • SỔ NHẬT KÝ SẢN XUẤT TỔNG HỢP</div>
          <div class="farm-meta">
            <strong>Trang trại:</strong> ${farmProfile?.farmName || 'Nông trại AgriLog'} &nbsp;|&nbsp;
            <strong>Địa chỉ:</strong> ${farmProfile?.address || '—'} &nbsp;|&nbsp;
            <strong>SĐT:</strong> ${farmProfile?.phone || '—'}
          </div>
        </div>
        <div class="doc-title-block">
          <div class="doc-title">${mainBoard.name || 'Sổ Nhật Ký Canh Tác'}</div>
          <div class="doc-date">Ngày in biểu: ${todayStr}</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Cây trồng</span>
          <span class="info-value">${mainBoard.cropType || '—'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Diện tích</span>
          <span class="info-value">${mainBoard.areaSqm ? mainBoard.areaSqm.toLocaleString('vi-VN') + ' m²' : '—'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Khu vực / Lô</span>
          <span class="info-value">${mainBoard.areaText || '—'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Ngày bắt đầu vụ</span>
          <span class="info-value">${formatDate(mainBoard.startDate)}</span>
        </div>
      </div>

      <!-- PHẦN 1: NHẬT KÝ CANH TÁC & CHĂM SÓC -->
      <div class="section-block">
        <div class="section-header-wrap sec-bg-cultivation">
          <span class="sec-title">PHẦN 1: NHẬT KÝ CANH TÁC & CHĂM SÓC CÂY TRỒNG</span>
          <span class="sec-count">Tổng số: ${cultEntries.length} mục</span>
        </div>
        <table class="table-cultivation">
          <thead>
            <tr>
              <th style="width: 35px;">STT</th>
              <th style="width: 75px;">Ngày</th>
              <th style="width: 110px;">Giai đoạn</th>
              <th style="width: 140px;">Hoạt động</th>
              <th style="width: 90px;">Người làm</th>
              <th style="width: 80px;">Thời tiết</th>
              <th>Ghi chú</th>
              ${cultCustomCols.map((c: string) => `<th>${c}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${cultRowsHtml || '<tr class="empty-row"><td colspan="' + (7 + cultCustomCols.length) + '">Chưa có dữ liệu nhật ký canh tác</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- PHẦN 2: NHẬT KÝ SỬ DỤNG PHÂN BÓN -->
      <div class="section-block">
        <div class="section-header-wrap sec-bg-fertilizer">
          <span class="sec-title">PHẦN 2: NHẬT KÝ SỬ DỤNG PHÂN BÓN</span>
          <span class="sec-count">Tổng số: ${fertEntries.length} mục</span>
        </div>
        <table class="table-fertilizer">
          <thead>
            <tr>
              <th style="width: 35px;">STT</th>
              <th style="width: 75px;">Ngày bón</th>
              <th style="width: 140px;">Tên phân bón</th>
              <th style="width: 120px;">Nhà sản xuất</th>
              <th style="width: 80px;">Liều lượng</th>
              <th style="width: 80px;">Diện tích</th>
              <th style="width: 90px;">Người làm</th>
              <th style="width: 80px;">Thời tiết</th>
              <th>Ghi chú</th>
              ${fertCustomCols.map((c: string) => `<th>${c}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${fertRowsHtml || '<tr class="empty-row"><td colspan="' + (9 + fertCustomCols.length) + '">Chưa có dữ liệu nhật ký bón phân</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- PHẦN 3: NHẬT KÝ SỬ DỤNG THUỐC BVTV -->
      <div class="section-block">
        <div class="section-header-wrap sec-bg-pesticide">
          <span class="sec-title">PHẦN 3: NHẬT KÝ SỬ DỤNG THUỐC BẢO VỆ THỰC VẬT</span>
          <span class="sec-count">Tổng số: ${pestEntries.length} mục</span>
        </div>
        <table class="table-pesticide">
          <thead>
            <tr>
              <th style="width: 35px;">STT</th>
              <th style="width: 75px;">Ngày phun</th>
              <th style="width: 120px;">Tên thuốc BVTV</th>
                <th style="width: 110px;">Nhà sản xuất</th>
                <th style="width: 100px;">Đối tượng hại</th>
              <th style="width: 75px;">Liều lượng</th>
              <th style="width: 65px;">Cách ly</th>
              <th style="width: 85px;">Người phun</th>
              <th style="width: 80px;">Thời tiết</th>
              <th>Ghi chú</th>
              ${pestCustomCols.map((c: string) => `<th>${c}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${pestRowsHtml || '<tr class="empty-row"><td colspan="' + (10 + pestCustomCols.length) + '">Chưa có dữ liệu nhật ký thuốc BVTV</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- KHUNG XÁC NHẬN & CHỮ KÝ CHUẨN VIETGAP -->
      <div class="confirmation-section">
        <div class="confirm-header-row">
          <div class="confirm-statement">✓ Cam kết các số liệu ghi chép trên là trung thực, chính xác và tuân thủ đúng quy trình kỹ thuật.</div>
          <div class="confirm-date">......, ngày ...... tháng ...... năm 20...</div>
        </div>
        <div class="signatures-grid">
          <div class="sig-card">
            <div class="sig-role">NGƯỜI LẬP NHẬT KÝ</div>
            <div class="sig-hint">(Ký và ghi rõ họ tên)</div>
            <div class="sig-space-box">Ký tại đây</div>
            <div class="sig-name">Họ và tên: ...................................</div>
          </div>
          <div class="sig-card">
            <div class="sig-role">KỸ THUẬT VIÊN / GIÁM SÁT</div>
            <div class="sig-hint">(Ký và ghi rõ họ tên)</div>
            <div class="sig-space-box">Ký tại đây</div>
            <div class="sig-name">Họ và tên: ...................................</div>
          </div>
          <div class="sig-card">
            <div class="sig-role">ĐẠI DIỆN TRANG TRẠI</div>
            <div class="sig-hint">(Ký, đóng dấu nếu có)</div>
            <div class="sig-space-box">Ký & đóng dấu tại đây</div>
            <div class="sig-name">${ownerName}</div>
          </div>
        </div>
      </div>

      <div class="watermark">
        Sổ nhật ký sản xuất điện tử trích xuất tự động từ Hệ thống AgriLog • Tiêu chuẩn VietGAP • Xuất lúc ${todayStr}
      </div>
    </body>
    </html>
  `;
};
