# 💰 Gold Profit Calculator - Tính Giá Vàng Realtime

Công cụ tính giá vàng - lãi lỗ realtime, hỗ trợ quy đổi cây/chỉ, tính giá hòa vốn tự động.

![Preview](https://img.shields.io/badge/Status-Live-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Tính năng

- 📊 **Tính toán Realtime** - Kết quả cập nhật ngay khi nhập
- ⚖️ **Quy đổi tự động** - Cây ↔ Chỉ (1 cây = 10 chỉ)
- 💵 **Tính lãi/lỗ** - So sánh giá mua với giá bán hiện tại
- 📈 **Giá hòa vốn** - Tính tự động dựa trên danh sách mua
- 💾 **Lưu dữ liệu** - Tự động lưu vào LocalStorage
- 📱 **Responsive** - Hiển thị đẹp trên mobile

## 🚀 Demo

Mở file `index.html` trong trình duyệt để sử dụng.

## 📖 Cách sử dụng

1. **Nhập giá bán hiện tại** - Giá bạn có thể bán được hôm nay
2. **Thêm giao dịch mua** - Click "Thêm Dòng"
3. **Nhập thông tin**:
   - Số lượng (ví dụ: 1, 2, 0.5)
   - Đơn vị (Cây hoặc Chỉ)
   - Giá mua/chỉ (triệu đồng)
4. **Xem kết quả** - Lãi/lỗ tự động cập nhật

## 🌐 Deploy lên GitHub Pages

### Bước 1: Tạo Repository mới trên GitHub

1. Vào [github.com/new](https://github.com/new)
2. Đặt tên repo: `gold-profit-calculator`
3. Để Public
4. Không cần README (đã có sẵn)
5. Click **Create repository**

### Bước 2: Push code lên GitHub

```bash
# Di chuyển vào thư mục dự án
cd gold-profit-calculator

# Khởi tạo git
git init

# Thêm tất cả files
git add .

# Commit
git commit -m "Initial commit: Gold profit calculator"

# Thêm remote (thay YOUR_USERNAME bằng username GitHub của bạn)
git remote add origin https://github.com/YOUR_USERNAME/gold-profit-calculator.git

# Push lên GitHub
git push -u origin main
```

### Bước 3: Bật GitHub Pages

1. Vào repo trên GitHub
2. Click **Settings** (tab)
3. Scroll xuống tìm **Pages** (menu trái)
4. Source: chọn **Deploy from a branch**
5. Branch: chọn **main**, folder: **/ (root)**
6. Click **Save**

### Bước 4: Truy cập website

Sau 1-2 phút, website sẽ có tại:
```
https://YOUR_USERNAME.github.io/gold-profit-calculator/
```

## 📁 Cấu trúc files

```
gold-profit-calculator/
├── index.html      # Trang chính
├── styles.css      # CSS styling
├── app.js          # JavaScript logic
└── README.md       # Hướng dẫn này
```

## 🔧 Công thức tính

| Chỉ tiêu | Công thức |
|----------|-----------|
| Quy đổi chỉ | `unit === "cây" ? qty * 10 : qty` |
| Thành tiền mua | `SL_chỉ × Giá_mua` |
| Thành tiền bán | `SL_chỉ × Giá_bán` |
| Lãi/Lỗ | `Thành_tiền_bán - Thành_tiền_mua` |
| Giá hòa vốn | `Tổng_tiền_mua / Tổng_số_chỉ` |
| % Lãi/Lỗ | `(Lãi_Lỗ / Tổng_mua) × 100` |

## 📝 License

MIT License - Tự do sử dụng và chỉnh sửa.

---

Made with ❤️ for gold investors
