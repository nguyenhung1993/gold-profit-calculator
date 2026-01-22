# 💰 Gold Profit Calculator - Tính Giá Vàng Realtime

Công cụ tính giá vàng - lãi lỗ realtime, hỗ trợ quy đổi cây/chỉ, tính giá hòa vốn tự động.

![Preview](https://img.shields.io/badge/Status-Live-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Tính năng

- 📊 **Tính toán Realtime** - Kết quả cập nhật ngay khi nhập
- ⚖️ **Quy đổi tự động** - Cây ↔ Chỉ (1 cây = 10 chỉ)
- 💵 **Tính lãi/lỗ** - So sánh giá mua với giá bán hiện tại
- 📈 **Giá hòa vốn** - Tính tự động dựa trên danh sách mua
- 💾 **Lưu dữ liệu** - Lưu trên Supabase PostgreSQL hoặc LocalStorage (fallback)
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

---

## 🗄️ Setup Backend với Supabase (Free)

### Bước 1: Tạo Supabase Project

1. Truy cập [supabase.com](https://supabase.com) và click **Start your project**
2. Đăng nhập bằng GitHub
3. Click **New Project**
4. Điền thông tin:
   - **Name**: `gold-calculator`
   - **Database Password**: Tự tạo password mạnh
   - **Region**: Chọn gần nhất (Singapore)
5. Click **Create new project** (đợi 1-2 phút)

### Bước 2: Tạo Table trong Database

1. Vào **SQL Editor** (menu trái)
2. Click **New query**
3. Paste đoạn SQL sau và chạy:

```sql
-- Tạo table lưu dữ liệu calculator
CREATE TABLE calculator_data (
    id SERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL DEFAULT 'main',
    transactions JSONB DEFAULT '[]'::jsonb,
    sell_price DECIMAL(10,2) DEFAULT 14.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE calculator_data ENABLE ROW LEVEL SECURITY;

-- Policy cho phép public access (cho demo app)
CREATE POLICY "Allow public access" ON calculator_data
    FOR ALL USING (true) WITH CHECK (true);

-- Insert initial data
INSERT INTO calculator_data (doc_id, transactions, sell_price)
VALUES ('main', '[]'::jsonb, 14.5)
ON CONFLICT (doc_id) DO NOTHING;
```

4. Click **Run** (hoặc Ctrl+Enter)

### Bước 3: Lấy API Keys

1. Vào **Project Settings** (icon bánh răng, menu trái)
2. Click **API** (trong Settings)
3. Copy 2 giá trị:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJI...` (dài)

### Bước 4: Cấu hình Local

Tạo file `server/.env`:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJI...your-anon-key
PORT=3001
```

---

## 🚀 Deploy lên Render (Free)

### Bước 1: Push code lên GitHub

```bash
cd gold-profit-calculator
git add .
git commit -m "Add Supabase support"
git push origin main
```

### Bước 2: Deploy Backend trên Render

1. Truy cập [render.com](https://render.com) và đăng nhập bằng GitHub
2. Click **New +** → **Web Service**
3. Connect GitHub repo `gold-profit-calculator`
4. Cấu hình:
   - **Name**: `gold-calculator-api`
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add **Environment Variables**:
   - `SUPABASE_URL`: URL từ Supabase
   - `SUPABASE_ANON_KEY`: Anon key từ Supabase
6. Click **Create Web Service**

### Bước 3: Cập nhật Frontend

Sau khi deploy xong, Render sẽ cho bạn URL (vd: `https://gold-calculator-api.onrender.com`).

Mở file `app.js` và cập nhật `API_BASE_URL`:

```javascript
const API_BASE_URL = 'https://gold-calculator-api.onrender.com';
```

### Bước 4: Deploy Frontend lên GitHub Pages

Xem hướng dẫn phía dưới.

---

## 🌐 Deploy Frontend lên GitHub Pages

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

---

## 📁 Cấu trúc files

```
gold-profit-calculator/
├── index.html          # Trang chính
├── styles.css          # CSS styling
├── app.js              # JavaScript logic (frontend)
├── README.md           # Hướng dẫn này
└── server/             # Backend API
    ├── server.js       # Express + Supabase server
    ├── package.json    # Dependencies
    ├── .env            # Environment variables (local)
    └── .env.example    # Template cho .env
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

## 🔌 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/transactions` | Lấy tất cả dữ liệu |
| POST | `/api/transactions` | Lưu dữ liệu |
| DELETE | `/api/transactions` | Xóa tất cả dữ liệu |
| GET | `/api/health` | Kiểm tra trạng thái server |

## 📝 License

MIT License - Tự do sử dụng và chỉnh sửa.

---

Made with ❤️ for gold investors
