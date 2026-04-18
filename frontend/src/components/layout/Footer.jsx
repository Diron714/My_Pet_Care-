import React from 'react';

const Footer = () => {
  return (
    <footer className="mt-8 border-t border-slate-100 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-black tracking-tight mb-3">
              My Pet <span className="text-primary-400">Care+</span>
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              A premium digital platform for modern pet health, grooming, and clinical care.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 text-slate-100 uppercase tracking-wide">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="/pets" className="hover:text-primary-300 transition-colors">Browse Pets</a></li>
              <li><a href="/products" className="hover:text-primary-300 transition-colors">Products</a></li>
              <li><a href="/doctors" className="hover:text-primary-300 transition-colors">Doctors</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 text-slate-100 uppercase tracking-wide">
              Support
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-primary-300 transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-primary-300 transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-primary-300 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 text-slate-100 uppercase tracking-wide">
              Contact
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Email: support@mypetcare.com<br />
              Phone: +1 (555) 123-4567
            </p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
          <p>&copy; 2025 My Pet Care+. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

