import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, 
  Ticket, 
  CheckCircle2, 
  Clock,
  Search,
  Lock,
  QrCode
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const savedKey = localStorage.getItem('adminKey') || '';
  const [adminKey, setAdminKey] = useState(savedKey);
  const [isAuthenticated, setIsAuthenticated] = useState(!!savedKey);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ count: 0, totalRevenue: 0, bookings: [] });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (adminKey && isAuthenticated) {
      fetchData();
    }
  }, []); // Only run once on mount if already authenticated

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!adminKey) {
      toast.error('Please enter Admin Key');
      return;
    }
    // We try to fetch data to verify the key
    await fetchData();
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/bookings', {
        headers: { 'x-admin-key': adminKey }
      });
      setData(response.data);
      localStorage.setItem('adminKey', adminKey);
      setIsAuthenticated(true);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Invalid Admin Key');
        setIsAuthenticated(false);
        localStorage.removeItem('adminKey');
      } else {
        toast.error('Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminKey');
    setAdminKey('');
    setIsAuthenticated(false);
    setData({ count: 0, totalRevenue: 0, bookings: [] });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-100 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-gray-800" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Admin Access</h1>
          <p className="text-sm text-gray-500 mb-8">Enter your secure key to view the dashboard</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Admin Secret Key"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black transition-all"
            />
            <button 
              type="submit"
              className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-all active:scale-95"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Derived Stats — count total checked-in TICKETS not just bookings
  const checkedInCount = data.bookings.filter(b => b.checkedIn).reduce((sum, b) => sum + b.quantity, 0);
  const totalTickets = data.bookings.reduce((sum, b) => sum + b.quantity, 0);

  // Filter Bookings
  const filteredBookings = data.bookings.filter(b => 
    b.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-gray-900">Admin Dashboard</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Real-time Event Stats</p>
        </div>
        <div className="flex gap-4 items-center">
            <button 
              onClick={() => window.location.href = '/scanner'} 
              className="text-sm font-bold bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              Scan Ticket
            </button>
            <button onClick={fetchData} className="text-sm font-bold text-blue-600 hover:text-blue-800 px-2">
                Refresh
            </button>
            <button onClick={handleLogout} className="text-sm font-bold text-red-600 hover:text-red-800 px-2">
            Logout
            </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Ticket className="w-5 h-5" /></div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Tickets</p>
            </div>
            <p className="text-3xl font-black text-gray-900">{totalTickets}</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Users className="w-5 h-5" /></div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Bookings</p>
            </div>
            <p className="text-3xl font-black text-gray-900">{data.count}</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><CheckCircle2 className="w-5 h-5" /></div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Checked In</p>
            </div>
            <p className="text-3xl font-black text-gray-900">{checkedInCount} <span className="text-sm font-medium text-gray-400">/ {totalTickets}</span></p>
          </div>
        </div>

        {/* Guest List */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900">Guest List</h2>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black w-full md:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold border-b border-gray-200">Attendee</th>
                  <th className="px-6 py-4 font-bold border-b border-gray-200">Booking ID</th>
                  <th className="px-6 py-4 font-bold border-b border-gray-200">Qty</th>
                  <th className="px-6 py-4 font-bold border-b border-gray-200">Status</th>
                  <th className="px-6 py-4 font-bold border-b border-gray-200">Check-In Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading guests...</td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No bookings found.</td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{booking.userName}</p>
                        <p className="text-xs text-gray-500">{booking.userEmail}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                          {booking.bookingId}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">{booking.quantity}</td>
                      <td className="px-6 py-4">
                        {booking.checkedIn ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Arrived
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-100 px-2.5 py-1 rounded-full">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {booking.checkedInAt 
                          ? new Date(booking.checkedInAt).toLocaleString([], {hour: '2-digit', minute:'2-digit'})
                          : '-'
                        }
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
