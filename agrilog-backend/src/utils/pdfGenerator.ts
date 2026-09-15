import puppeteer from 'puppeteer';

export const generatePdfFromHtml = async (htmlContent: string, landscape: boolean = true): Promise<Buffer> => {
  const browser = await puppeteer.launch({
    headless: true,
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
          ${rowsHtml || '<tr><td colspan="' + (9 + customCols.length) + '" class="text-center" style="padding: 20px;">Chưa có dữ liệu nhật ký bón phân</td></tr>'}
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
      <td>${entry.activeIngredient || '—'}</td>
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
            <th style="width: 100px;">Hoạt chất</th>
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
          ${rowsHtml || '<tr><td colspan="' + (10 + customCols.length) + '" class="text-center" style="padding: 20px;">Chưa có dữ liệu nhật ký thuốc BVTV</td></tr>'}
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

  const cultivationReport = stats.cultivationReport || [];
  const fertilizerReport = stats.fertilizerReport || [];
  const pesticideReport = stats.pesticideReport || [];

  const cultRows = cultivationReport.map((r: any, i: number) => `
    <tr>
      <td class="text-center text-bold">${i + 1}</td>
      <td class="text-bold">${r.activity || '—'}</td>
      <td class="text-center">${r.taskCount || 0}</td>
      <td class="text-center">${r.peopleCount || 0}</td>
      <td class="text-center">${r.daysCount || 0}</td>
      <td class="text-center text-bold">${r.laborCount || 0}</td>
    </tr>
  `).join('');

  const fertRows = fertilizerReport.map((r: any, i: number) => `
    <tr>
      <td class="text-center text-bold">${i + 1}</td>
      <td class="text-bold">${r.materialName || '—'}</td>
      <td class="text-center">${r.timesUsed || 0}</td>
      <td class="text-center text-bold">${r.totalQuantity || 0}</td>
      <td class="text-center">${r.totalArea || 0} m²</td>
    </tr>
  `).join('');

  const pestRows = pesticideReport.map((r: any, i: number) => `
    <tr>
      <td class="text-center text-bold">${i + 1}</td>
      <td class="text-bold">${r.materialName || '—'}</td>
      <td>${r.targetPest || '—'}</td>
      <td class="text-center">${r.timesUsed || 0}</td>
      <td class="text-center text-bold">${r.totalQuantity || 0}</td>
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

      <div class="section-title">1. Tổng hợp Công việc & Nhân công Canh tác</div>
      <table>
        <thead>
          <tr>
            <th style="width: 40px;">STT</th>
            <th>Hoạt động</th>
            <th style="width: 100px;">Số lần thực hiện</th>
            <th style="width: 100px;">Số người tham gia</th>
            <th style="width: 100px;">Số ngày làm</th>
            <th style="width: 100px;">Tổng số công</th>
          </tr>
        </thead>
        <tbody>
          ${cultRows || '<tr><td colspan="6" class="text-center" style="padding: 10px;">Không có dữ liệu trong tháng này</td></tr>'}
        </tbody>
      </table>

      <div class="section-title">2. Tổng hợp Vật tư Phân bón đã sử dụng</div>
      <table>
        <thead>
          <tr>
            <th style="width: 40px;">STT</th>
            <th>Tên loại phân bón</th>
            <th style="width: 120px;">Số lần bón</th>
            <th style="width: 140px;">Tổng lượng bón</th>
            <th style="width: 140px;">Tổng diện tích áp dụng</th>
          </tr>
        </thead>
        <tbody>
          ${fertRows || '<tr><td colspan="5" class="text-center" style="padding: 10px;">Không có dữ liệu trong tháng này</td></tr>'}
        </tbody>
      </table>

      <div class="section-title">3. Tổng hợp Thuốc Bảo vệ Thực vật đã sử dụng</div>
      <table>
        <thead>
          <tr>
            <th style="width: 40px;">STT</th>
            <th>Tên thuốc BVTV</th>
            <th>Sinh vật gây hại</th>
            <th style="width: 120px;">Số lần phun</th>
            <th style="width: 140px;">Tổng lượng thuốc</th>
          </tr>
        </thead>
        <tbody>
          ${pestRows || '<tr><td colspan="5" class="text-center" style="padding: 10px;">Không có dữ liệu trong tháng này</td></tr>'}
        </tbody>
      </table>

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
