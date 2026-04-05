# 🐾 PawVerse — Hướng dẫn cài đặt & chạy toàn bộ project

## Tổng quan

PawVerse là web thương mại điện tử thú cưng, gồm 2 repo:

| Thành phần | Repo | Tech Stack |
|------------|------|------------|
| **Backend** | `-J2EE-PawVerse` | Spring Boot 4.0.3, Java 21, MySQL, JWT, OAuth2 |
| **Frontend** | `Frontend-J2EE-PawVerse` | React 19, Vite 8, TailwindCSS 3, Zustand, React Query |

**Khi chạy:**
- Backend: `http://localhost:8081`
- Frontend: `http://localhost:5173` (proxy API → backend tự động)

---

## Yêu cầu môi trường

| Tool | Phiên bản tối thiểu | Kiểm tra |
|------|---------------------|----------|
| **Node.js** | 18+ (khuyên dùng 20+) | `node -v` |
| **npm** | 9+ | `npm -v` |
| **Java JDK** | 21 | `java -version` |
| **Git** | Bất kỳ | `git --version` |

> ⚠️ **Không cần cài Maven** — backend dùng Maven Wrapper (`mvnw`) tự tải.

---

## Bước 1: Clone cả 2 repo

```bash
# Clone backend
git clone https://github.com/farolnguyen/-J2EE-PawVerse.git

# Clone frontend
git clone https://github.com/HuyVTr/Frontend-J2EE-PawVerse.git
```

Đảm bảo 2 folder nằm **cùng cấp**:
```
📁 source/
├── 📁 -J2EE-PawVerse/          ← Backend
└── 📁 Frontend-J2EE-PawVerse/  ← Frontend
```

---

## Bước 2: Cài đặt Frontend

```bash
cd Frontend-J2EE-PawVerse
npm install
```

### Tạo file `.env`

Tạo file `.env` ở **gốc folder frontend** với nội dung:

```env
VITE_API_BASE_URL=
VITE_GOOGLE_CLIENT_ID=<google-client-id>
VITE_RECAPTCHA_SITE_KEY=<recaptcha-site-key>
```

> 📌 Liên hệ team leader để lấy giá trị `GOOGLE_CLIENT_ID` và `RECAPTCHA_SITE_KEY`.

---

## Bước 3: Cấu hình Backend

### 3.1 Biến môi trường OAuth2

Backend cần các biến môi trường cho OAuth2. Tạo system environment variables hoặc set trong terminal trước khi chạy:

**Windows (PowerShell):**
```powershell
$env:GOOGLE_CLIENT_ID="<giá-trị>"
$env:GOOGLE_CLIENT_SECRET="<giá-trị>"
$env:GITHUB_CLIENT_ID="<giá-trị>"
$env:GITHUB_CLIENT_SECRET="<giá-trị>"
```

**Windows (CMD):**
```cmd
set GOOGLE_CLIENT_ID=<giá-trị>
set GOOGLE_CLIENT_SECRET=<giá-trị>
set GITHUB_CLIENT_ID=<giá-trị>
set GITHUB_CLIENT_SECRET=<giá-trị>
```

> 📌 Liên hệ team leader để lấy các giá trị Secret. Nếu **không cần test OAuth**, có thể bỏ qua bước này — đăng nhập thường vẫn hoạt động.

### 3.2 Database

Backend kết nối MySQL remote (đã cấu hình sẵn trong `application.properties`). **Không cần cài MySQL local.**

---

## Bước 4: Chạy project

### Cách 1: Chạy riêng từng phần (khuyên dùng)

**Terminal 1 — Backend:**
```bash
cd -J2EE-PawVerse
.\mvnw.cmd spring-boot:run        # Windows
./mvnw spring-boot:run             # macOS/Linux
```

Đợi đến khi thấy:
```
Started PawVerseApplication in XX seconds
```

**Terminal 2 — Frontend:**
```bash
cd Frontend-J2EE-PawVerse
npx vite
```

Mở trình duyệt: **http://localhost:5173**

### Cách 2: Chạy đồng thời cả 2 (chỉ hoạt động nếu đường dẫn backend đúng)

```bash
cd Frontend-J2EE-PawVerse
npm run dev
```

> ⚠️ Script `npm run dev` dùng `concurrently` để chạy cả backend + frontend. Đường dẫn backend được hardcode trong `package.json` — nếu folder backend nằm ở vị trí khác, hãy sửa script `dev:backend` trong `package.json`.

---

## Cấu trúc thư mục Frontend

```
Frontend-J2EE-PawVerse/
├── .env                      ← Biến môi trường (KHÔNG commit)
├── package.json              ← Dependencies & scripts
├── vite.config.js            ← Vite config + proxy API
├── tailwind.config.js        ← TailwindCSS config
├── index.html                ← Entry HTML
├── Images/                   ← Ảnh tĩnh (sản phẩm, banner...)
├── public/                   ← Assets public
└── src/
    ├── main.jsx              ← Entry point React
    ├── App.jsx               ← Root component + routing
    ├── api/                  ← API service layer
    │   ├── axios.js          ← Axios instance (interceptors, refresh token)
    │   ├── authService.js    ← Đăng nhập, đăng ký, quên mật khẩu
    │   ├── productService.js ← Sản phẩm, danh mục, thương hiệu
    │   ├── cartService.js    ← Giỏ hàng
    │   ├── orderService.js   ← Đơn hàng
    │   ├── bookingService.js ← Đặt lịch dịch vụ
    │   ├── petService.js     ← Thú cưng
    │   ├── wishlistService.js← Yêu thích
    │   ├── userService.js    ← Quản lý user/profile
    │   ├── adminService.js   ← API dành cho admin
    │   ├── chatbotService.js ← Chatbot AI
    │   └── notificationService.js
    ├── components/
    │   ├── layout/           ← Header, Footer, MainLayout
    │   ├── common/           ← Shared components (MiniCartDrawer...)
    │   ├── admin/            ← Components riêng trang admin
    │   ├── chatbot/          ← Chatbot widget
    │   ├── pet/              ← Components thú cưng
    │   └── CartSyncProvider.jsx ← Đồng bộ giỏ hàng
    ├── pages/
    │   ├── Home/             ← Trang chủ
    │   ├── Auth/             ← Đăng nhập, đăng ký
    │   ├── Products/         ← Danh sách & chi tiết sản phẩm
    │   ├── Cart/             ← Giỏ hàng
    │   ├── Checkout/         ← Thanh toán
    │   ├── Orders/           ← Lịch sử đơn hàng
    │   ├── Wishlist/         ← Danh sách yêu thích
    │   ├── Pet/              ← Quản lý thú cưng
    │   ├── Bookings/         ← Đặt lịch dịch vụ
    │   ├── Services/         ← Dịch vụ
    │   ├── Profile/          ← Hồ sơ cá nhân
    │   ├── Admin/            ← Trang quản trị
    │   ├── Staff/            ← Trang nhân viên
    │   └── NotFound/         ← Trang 404
    ├── store/
    │   ├── useAuthStore.js   ← Zustand: trạng thái đăng nhập
    │   └── useCartStore.js   ← Zustand: giỏ hàng + drawer
    ├── routes/
    │   └── routes.jsx        ← Định nghĩa routes
    ├── hooks/
    │   └── useDebounce.js    ← Custom hooks
    └── utils/
        └── formatters.js     ← Format tiền, ngày...
```

---

## Proxy API

Vite đã cấu hình proxy trong `vite.config.js` — khi frontend gọi `/api/*`, request tự chuyển đến `http://localhost:8081`:

| Path frontend | Chuyển đến backend |
|---------------|--------------------|
| `/api/*` | `http://localhost:8081/api/*` |
| `/oauth2/authorization/*` | `http://localhost:8081/oauth2/authorization/*` |
| `/login/oauth2/*` | `http://localhost:8081/login/oauth2/*` |
| `/uploads/*` | `http://localhost:8081/uploads/*` |

→ **Không cần cấu hình CORS hay đổi URL trong code.**

---

## Tài khoản test

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | Liên hệ team leader |
| User,Staff | Tự đăng ký tại `/register` | — |

---

## Tech Stack chi tiết

### Frontend
| Library | Mục đích |
|---------|----------|
| React 19 | UI framework |
| Vite 8 | Build tool & dev server |
| TailwindCSS 3 | Utility-first CSS |
| React Router 7 | Routing SPA |
| Zustand | State management |
| React Query (TanStack) | Server state & caching |
| React Hook Form + Zod | Form validation |
| Axios | HTTP client |
| Recharts | Biểu đồ thống kê |
| Swiper | Carousel/slider |
| Lucide React | Icons |
| React Hot Toast | Thông báo toast |
| react-google-recaptcha | Google reCAPTCHA v2 |

### Backend
| Library | Mục đích |
|---------|----------|
| Spring Boot 4.0.3 | Web framework |
| Spring Security + JWT | Authentication |
| Spring OAuth2 Client | Đăng nhập Google/GitHub/Discord |
| Spring Data JPA + Hibernate | ORM |
| MySQL | Database |
| Lombok | Giảm boilerplate |
| Swagger/OpenAPI | API documentation (`/swagger-ui.html`) |

---

## API Documentation

Khi backend đang chạy, truy cập Swagger UI:

```
http://localhost:8081/swagger-ui.html
```

---

> 📝 **Lưu ý:** File `.env` chứa thông tin nhạy cảm — **KHÔNG commit** lên Git. File này đã có trong `.gitignore`.
