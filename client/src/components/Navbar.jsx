import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/5 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/logo.png" alt="ISKCON Logo" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
            <span className="text-xl font-black tracking-tight text-gray-900">ISKCON</span>
          </Link>

          {/* My Tickets Link */}
          <Link
            to="/my-bookings"
            className="flex items-center gap-2 border border-gray-200 hover:border-gray-900 hover:bg-gray-900 hover:text-white text-gray-700 font-bold text-sm px-4 py-2 rounded-xl transition-all duration-200"
          >
            <Ticket className="w-4 h-4" />
            My Tickets
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
