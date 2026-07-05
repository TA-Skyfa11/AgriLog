// src/lib/mockData.ts

export const dashboardData = {
  kpis: {
    totalFarms: { value: '1,248', growth: '+12%', isPositive: true },
    newUsers: { value: '428', growth: '+5.4%', isPositive: true },
    marketplaceProducts: { value: '8,924', growth: '-2.1%', isPositive: false },
    orders: { value: '3,510', growth: '+18%', isPositive: true },
  },
  trendChart: [
    { name: 'Tháng 1', users: 300, orders: 400 },
    { name: 'Tháng 2', users: 400, orders: 550 },
    { name: 'Tháng 3', users: 350, orders: 500 },
    { name: 'Tháng 4', users: 500, orders: 750 },
    { name: 'Tháng 5', users: 450, orders: 650 },
    { name: 'Tháng 6', users: 600, orders: 900 },
  ],
  recentActivities: [
    { id: 1, title: 'Đơn hàng mới #8492', desc: 'từ Hợp tác xã GreenFarm vừa được xác nhận.', time: '2 phút trước', type: 'order' },
    { id: 2, title: 'Nguyễn Thị Hoa', desc: 'đã đăng ký tài khoản Chủ nông trại mới.', time: '15 phút trước', type: 'user' },
    { id: 3, title: 'Phản hồi mới', desc: 'về chất lượng phân bón từ người dùng "Nông dân Vui Vẻ".', time: '1 giờ trước', type: 'feedback' },
    { id: 4, title: 'Hệ thống IoT', desc: 'tại khu vực Cần Thơ gặp sự cố mất kết nối.', time: '3 giờ trước', type: 'alert' },
  ],
  topProducts: [
    { id: 1, name: 'Hạt giống Cà chua bi', image: '/images/products/tomato.png', sales: 850, max: 1000 },
    { id: 2, name: 'Phân bón NPK Cao cấp', image: '/images/products/npk.png', sales: 620, max: 1000 },
  ],
  weather: {
    location: 'Đà Lạt, Lâm Đồng',
    temp: '24°C',
    condition: 'Mưa rào nhẹ',
  }
};

export const usersData = {
  kpis: {
    totalUsers: { value: '1,284', growth: '+12%', isPositive: true },
    activeFarms: { value: '1,102', status: '86%', isPositive: true },
    newRegistrations: { value: '48', growth: '+5', isPositive: true },
    premiumPlans: { value: '342', label: 'Premium' },
  },
  table: [
    { id: '#AG00124', farmName: 'Green Valley Farm', logo: '/images/farms/f1.png', rep: 'Nguyễn Văn A', email: 'anguyen@gmail.com', phone: '0901234567', regDate: '12/05/2023', plan: 'Premium Plus', planColor: 'success', status: 'Hoạt động' },
    { id: '#AG00125', farmName: 'Đà Lạt Fresh', logo: '/images/farms/f2.png', rep: 'Trần Thị B', email: 'btran@dalatfresh.vn', phone: '0912233445', regDate: '15/06/2023', plan: 'Cơ bản', planColor: 'neutral', status: 'Hoạt động' },
    { id: '#AG00126', farmName: 'Mộc Châu Farm', logo: '/images/farms/f3.png', rep: 'Lê Văn C', email: 'cle@outlook.com', phone: '0933445566', regDate: '20/06/2023', plan: 'Thử nghiệm', planColor: 'neutral', status: 'Khóa' },
    { id: '#AG00127', farmName: 'AgriTech Solutions', logo: '/images/farms/f4.png', rep: 'Phạm Văn D', email: 'dpham@agritech.com', phone: '0944556677', regDate: '02/07/2023', plan: 'Enterprise', planColor: 'success', status: 'Hoạt động' },
  ]
};

export const ordersData = {
  kpis: {
    newOrders: { value: '156', growth: '+12%' },
    processing: { value: '42', label: 'Trong quy trình' },
    completed: { value: '1,284', percentage: '94%' },
    cancelled: { value: '18', growth: '-2%' },
  },
  table: [
    { id: '#ORD-9421', farmName: 'Nông Trại Xanh An Nhiên', image: '/images/farms/o1.png', date: '14/10/2023', amount: '12,500,000đ', status: 'MỚI', statusColor: 'primary', payment: 'CHỜ DUYỆT', paymentColor: 'warning' },
    { id: '#ORD-9418', farmName: 'HTX Cà Phê Cao Nguyên', image: '/images/farms/o2.png', date: '13/10/2023', amount: '45,200,000đ', status: 'ĐANG XỬ LÝ', statusColor: 'warning', payment: 'ĐÃ THANH TOÁN', paymentColor: 'success' },
    { id: '#ORD-9415', farmName: 'GreenHub Hydroponics', image: '/images/farms/o3.png', date: '12/10/2023', amount: '8,900,000đ', status: 'HOÀN THÀNH', statusColor: 'success', payment: 'ĐÃ THANH TOÁN', paymentColor: 'success' },
    { id: '#ORD-9410', farmName: 'Vườn Trái Cây Miền Tây', image: '/images/farms/o4.png', date: '11/10/2023', amount: '21,000,000đ', status: 'ĐÃ HỦY', statusColor: 'danger', payment: 'HOÀN TIỀN', paymentColor: 'danger' },
  ]
};

export const marketplaceData = {
  kpis: {
    totalProducts: { value: '1,284' },
    selling: { value: '942' },
    lowStock: { value: '12' },
    hidden: { value: '48' },
  },
  table: [
    { id: 1, name: 'Phân bón hữu cơ Premium', sku: 'AGR-FERT-001', image: '/images/products/p1.png', category: 'PHÂN BÓN', categoryColor: 'success', brand: "Earth's Own", price: '450.000đ', stock: 120, status: 'Hiển thị', statusColor: 'success' },
    { id: 2, name: 'Dịch Bio-Grow Bảo vệ Thực vật', sku: 'AGR-BIO-502', image: '/images/products/p2.png', category: 'BẢO VỆ TV', categoryColor: 'success', brand: 'BioGrow Systems', price: '280.000đ', stock: 45, status: 'Hiển thị', statusColor: 'success' },
    { id: 3, name: 'Bộ dụng cụ làm vườn Thép không gỉ', sku: 'AGR-TOOL-992', image: '/images/products/p3.png', category: 'DỤNG CỤ', categoryColor: 'neutral', brand: 'AgriPro Master', price: '1.250.000đ', stock: 8, status: 'Ẩn', statusColor: 'neutral' },
  ],
  recentActivities: [
    { id: 1, action: 'Cập nhật giá 24 sản phẩm', user: 'Admin Tuấn', time: '2 giờ trước', type: 'success' },
    { id: 2, action: 'Thêm sản phẩm "Hệ thống tưới tự động"', user: 'Quản lý Lan', time: '5 giờ trước', type: 'success' },
    { id: 3, action: 'Xóa danh mục "Thuốc trừ sâu hóa học"', user: 'System', time: '1 ngày trước', type: 'danger' },
  ]
};
