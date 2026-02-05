import { Link } from 'react-router-dom';
import { ShoppingBag, Phone, MapPin, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300" dir="rtl">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-white">السوق الحضاري</h2>
                <p className="text-xs text-gray-400">قنا الجديدة</p>
              </div>
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              منصة السوق الحضاري الرقمي تجمع جميع المحلات والخدمات المحلية في قنا الجديدة
              في موقع واحد سهل الاستخدام.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-white mb-4">روابط سريعة</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm hover:text-emerald-400 transition-colors">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-sm hover:text-emerald-400 transition-colors">
                  الأقسام
                </Link>
              </li>
              <li>
                <Link to="/shops" className="text-sm hover:text-emerald-400 transition-colors">
                  المحلات
                </Link>
              </li>
              <li>
                <Link to="/offers" className="text-sm hover:text-emerald-400 transition-colors">
                  العروض
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-bold text-white mb-4">الأقسام</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/categories" className="text-sm hover:text-emerald-400 transition-colors">
                  خضار وفواكه
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-sm hover:text-emerald-400 transition-colors">
                  ماركت وسوبر ماركت
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-sm hover:text-emerald-400 transition-colors">
                  مخابز وأفران
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-sm hover:text-emerald-400 transition-colors">
                  صيدليات
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-sm hover:text-emerald-400 transition-colors">
                  مكتبات
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-white mb-4">تواصل معنا</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-emerald-500" />
                قنا الجديدة، مصر
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-emerald-500" />
                0100 000 0000
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-emerald-500" />
                info@qenamarket.com
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>© 2024 السوق الحضاري الرقمي - قنا الجديدة. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
