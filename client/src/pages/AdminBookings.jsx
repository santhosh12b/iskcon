import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Users, IndianRupee, Ticket, Search, Lock, Loader2, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminBookings = () => {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState({ count: 0, totalRevenue: 0, bookings: [] });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    fetchBookings(adminKey);
  };

  const fetchBookings = async (key) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/bookings', {
        headers: { 'x-admin-key': key }
      });
      setData(res.data);
      setIsAuthenticated(true);
      toast.success('Admin access granted');
    } catch (err) {
      toast.error('Invalid Admin Key');
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = data.bookings.filter(b => 
    b.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.bookingId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xl max-w-md w-full"
        >
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <Lock className="w-8 h-8 text-[#ff4b4b]" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">Organizer Access</h1>
          <p className="text-gray-500 text-center mb-8 text-sm">Please enter the admin secret key to view bookings.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Enter Admin Key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-red-400"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login to Dashboard'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Organizer Dashboard</h1>
          <p className="text-gray-500 mt-1">Real-time booking stats and attendee list.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search attendees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 w-64 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase">Total Attendees</p>
              <p className="text-2xl font-black text-gray-900">{data.count}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase">Total Revenue</p>
              <p className="text-2xl font-black text-gray-900">₹{data.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <Ticket className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase">Events Active</p>
              <p className="text-2xl font-black text-gray-900">1</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Attendee</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Tickets</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Booking ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredBookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{booking.userName}</p>
                    <p className="text-xs text-gray-400">{new Date(booking.createdAt).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <p>{booking.userEmail}</p>
                    <p className="text-xs">{booking.userPhone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">{booking.quantity}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">₹{booking.totalPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{booking.bookingId}</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={async () => {
                        toast.loading('Downloading...', { id: 'dl' });
                        try {
                          const res = await api.get(`/booking/download/${booking.bookingId}`, { responseType: 'blob' });
                          const url = window.URL.createObjectURL(new Blob([res.data]));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', `ticket_${booking.bookingId}.pdf`);
                          document.body.appendChild(link);
                          link.click();
                          toast.success('Downloaded', { id: 'dl' });
                        } catch { toast.error('Failed', { id: 'dl' }); }
                      }}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredBookings.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No bookings found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBookings;
