import { Link } from 'react-router-dom';
import { Facebook, Mail, Phone, MapPin, Instagram, Youtube, Twitter } from 'lucide-react';
import logo from '../../../Images/headerandfooter/Logo.png';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-24 pb-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 mb-20 text-center lg:text-left">
          {/* Logo & About */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start">
            <Link to="/" className="inline-block mb-8 group">
              <img src={logo} alt="PawVerse Logo" className="h-24 w-auto group-hover:scale-105 transition-transform" />
            </Link>
            <p className="text-gray-500 text-lg leading-relaxed mb-10 max-w-sm mx-auto lg:mx-0">
              PawVerse - Nơi kết nối tình yêu thương và mang đến những gì tốt đẹp nhất cho người bạn bốn chân của bạn.
            </p>
            <div className="flex gap-4 justify-center lg:justify-start">
              <SocialIcon icon={<Facebook size={20} />} href="https://facebook.com" color="hover:bg-blue-600" />
              <SocialIcon icon={<Instagram size={20} />} href="https://instagram.com" color="hover:bg-pink-600" />
              <SocialIcon icon={<Twitter size={20} />} href="https://twitter.com" color="hover:bg-sky-500" />
              <SocialIcon icon={<Youtube size={20} />} href="https://youtube.com" color="hover:bg-red-600" />
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="text-xl font-black text-gray-900 mb-8 uppercase tracking-widest text-sm">Cửa hàng</h4>
            <ul className="space-y-4">
              <FooterLink to="/products">Tất cả sản phẩm</FooterLink>
              <FooterLink to="/products?category=1">Thức ăn</FooterLink>
              <FooterLink to="/products?category=2">Phụ kiện</FooterLink>
              <FooterLink to="/products?category=3">Đồ chơi</FooterLink>
            </ul>
          </div>

          {/* Support */}
          <div className="lg:col-span-2">
            <h4 className="text-xl font-black text-gray-900 mb-8 uppercase tracking-widest text-sm">Hỗ trợ</h4>
            <ul className="space-y-4">
              <FooterLink to="/about">Về PawVerse</FooterLink>
              <FooterLink to="/contact">Liên hệ</FooterLink>
              <FooterLink to="/shipping">Giao hàng</FooterLink>
              <FooterLink to="/returns">Đổi trả</FooterLink>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-4 text-left">
            <h4 className="text-xl font-black text-gray-900 mb-8 uppercase tracking-widest text-sm text-center lg:text-left">Liên hệ</h4>
            <div className="space-y-6 flex flex-col items-center lg:items-start">
              <div className="flex gap-4 group w-full max-w-sm">
                <div className="w-12 h-12 shrink-0 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Địa chỉ</p>
                  <p className="text-gray-900 font-medium">Số 1, Võ Văn Ngân, Thủ Đức, TP.HCM</p>
                </div>
              </div>
              <div className="flex gap-4 group w-full max-w-sm">
                <div className="w-12 h-12 shrink-0 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all">
                  <Phone size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Hotline</p>
                  <p className="text-gray-900 font-black text-xl">1900 8888</p>
                </div>
              </div>
              <div className="flex gap-4 group w-full max-w-sm">
                <div className="w-12 h-12 shrink-0 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all">
                  <Mail size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Email</p>
                  <p className="text-gray-900 font-medium">hello@pawverse.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-400 font-medium">
            &copy; 2026 <span className="text-gray-900 font-bold">PawVerse</span>. Design with ❤️ for Pets.
          </p>
          <div className="flex gap-8">
            <Link to="/privacy" className="text-gray-400 hover:text-gray-900 font-medium text-sm">Bảo mật</Link>
            <Link to="/terms" className="text-gray-400 hover:text-gray-900 font-medium text-sm">Điều khoản</Link>
            <Link to="/cookies" className="text-gray-400 hover:text-gray-900 font-medium text-sm">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }) {
  return (
    <li>
      <Link to={to} className="text-gray-500 hover:text-primary-600 font-medium transition-colors flex items-center gap-2 group">
        <span className="w-0 group-hover:w-2 h-0.5 bg-primary-600 transition-all"></span>
        {children}
      </Link>
    </li>
  );
}

function SocialIcon({ icon, href, color }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className={`w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 transition-all ${color} hover:text-white hover:border-transparent hover:scale-110 active:scale-90`}
    >
      {icon}
    </a>
  );
}
