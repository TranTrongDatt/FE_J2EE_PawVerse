import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

// Layouts (eager — needed on every route)
import MainLayout from '../components/layout/MainLayout';
import AdminLayout from '../components/layout/AdminLayout';
import StaffLayout from '../components/layout/StaffLayout';

// Auth guard (eager)
import PrivateRoute from '../components/common/PrivateRoute';

// Lazy-loaded pages
const HomePage = lazy(() => import('../pages/Home/HomePage'));
const ProductsPage = lazy(() => import('../pages/Products/ProductsPage'));
const ProductDetailPage = lazy(() => import('../pages/Products/ProductDetailPage'));
const ServicesPage = lazy(() => import('../pages/Services/ServicesPage'));
const LoginPage = lazy(() => import('../pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/Auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/Auth/ForgotPasswordPage'));
const OAuth2CallbackPage = lazy(() => import('../pages/Auth/OAuth2CallbackPage'));
const ProfilePage = lazy(() => import('../pages/Profile/ProfilePage'));
const CartPage = lazy(() => import('../pages/Cart/CartPage'));
const CheckoutPage = lazy(() => import('../pages/Checkout/CheckoutPage'));
const OrdersPage = lazy(() => import('../pages/Orders/OrdersPage'));
const OrderDetailPage = lazy(() => import('../pages/Orders/OrderDetailPage'));
const WishlistPage = lazy(() => import('../pages/Wishlist/WishlistPage'));
const BookingHistoryPage = lazy(() => import('../pages/Bookings/BookingHistoryPage'));
const PetProfilePage = lazy(() => import('../pages/Pet/PetProfilePage'));
const AdminDashboardPage = lazy(() => import('../pages/Admin/DashboardPage'));
const UserManagementPage = lazy(() => import('../pages/Admin/UserManagementPage'));
const StaffDashboardPage = lazy(() => import('../pages/Staff/StaffDashboardPage'));
const ProductManagementPage = lazy(() => import('../pages/Admin/ProductManagementPage'));
const OrderManagementPage = lazy(() => import('../pages/Admin/OrderManagementPage'));
const CategoryManagementPage = lazy(() => import('../pages/Admin/CategoryManagementPage'));
const BrandManagementPage = lazy(() => import('../pages/Admin/BrandManagementPage'));
const BookingManagementPage = lazy(() => import('../pages/Staff/BookingManagementPage'));
const BookingDetailPage = lazy(() => import('../pages/Staff/BookingDetailPage'));
const ActivityLogPage = lazy(() => import('../pages/Admin/ActivityLogPage'));
const VoucherManagementPage = lazy(() => import('../pages/Staff/VoucherManagementPage'));
const NotFoundPage = lazy(() => import('../pages/NotFound/NotFoundPage'));

// Suspense wrapper with loading fallback
function SL({ children }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <SL><HomePage /></SL> },
      { path: 'products', element: <SL><ProductsPage /></SL> },
      { path: 'products/:id', element: <SL><ProductDetailPage /></SL> },
      { path: 'services', element: <SL><ServicesPage /></SL> },
      { path: 'login', element: <SL><LoginPage /></SL> },
      { path: 'register', element: <SL><RegisterPage /></SL> },
      { path: 'forgot-password', element: <SL><ForgotPasswordPage /></SL> },
      { path: 'oauth2/redirect', element: <SL><OAuth2CallbackPage /></SL> },
      { path: 'profile', element: <SL><ProfilePage /></SL> },
      { path: 'cart', element: <SL><CartPage /></SL> },
      { path: 'checkout', element: <SL><CheckoutPage /></SL> },
      { path: 'orders', element: <SL><OrdersPage /></SL> },
      { path: 'orders/:id', element: <SL><OrderDetailPage /></SL> },
      { path: 'wishlist', element: <SL><WishlistPage /></SL> },
      { path: 'bookings', element: <SL><BookingHistoryPage /></SL> },
      { path: 'my-pets', element: <SL><PetProfilePage /></SL> },
    ],
  },
  {
    path: '/admin',
    element: (
      <PrivateRoute requiredRole="ADMIN">
        <AdminLayout />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <SL><AdminDashboardPage /></SL> },
      { path: 'users', element: <SL><UserManagementPage /></SL> },
      { path: 'activity-logs', element: <SL><ActivityLogPage /></SL> },
    ],
  },
  {
    path: '/staff',
    element: (
      <PrivateRoute requiredRole="STAFF">
        <StaffLayout />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <SL><StaffDashboardPage /></SL> },
      { path: 'products', element: <SL><ProductManagementPage /></SL> },
      { path: 'orders', element: <SL><OrderManagementPage /></SL> },
      { path: 'orders/:id', element: <SL><OrderDetailPage /></SL> },
      { path: 'categories', element: <SL><CategoryManagementPage /></SL> },
      { path: 'brands', element: <SL><BrandManagementPage /></SL> },
      { path: 'bookings', element: <SL><BookingManagementPage /></SL> },
      { path: 'bookings/:id', element: <SL><BookingDetailPage /></SL> },
      { path: 'vouchers', element: <SL><VoucherManagementPage /></SL> },
    ],
  },
  {
    path: '*',
    element: <SL><NotFoundPage /></SL>,
  },
]);

export default router;
