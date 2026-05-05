import React, { useState } from 'react';
import api, { getImageUrl } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Calendar, MapPin, Search, Inbox, Loader2, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const MyBookings = () => {
  const [email, setEmail] = useState('');
  const [bookings, setBookings] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setSearched(false);
    try {
      const res = await api.get(`/my-bookings/${encodeURIComponent(email.trim())}`);
      setBookings(res.data);
      setSearched(true);
    } catch (err) {
      toast.error('Failed to fetch bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTicket = async (bookingId) => {
    toast.loading('Generating ticket...', { id: 'download' });
    try {
      const response = await api.get(`/booking/download/${bookingId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket_${bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success('Ticket downloaded!', { id: 'download' });
    } catch (err) {
      toast.error('Failed to download ticket', { id: 'download' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-2 text-gray-900">My Tickets</h1>
        <p className="text-gray-500 text-sm">Enter the email you used during booking to retrieve your tickets.</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-10">
        <div className="relative flex-1">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hello@example.com"
            className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 bg-white shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white font-bold px-5 py-3 rounded-xl transition-colors disabled:opacity-60 text-sm shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? 'Searching...' : 'Find Tickets'}
        </button>
      </form>

      {/* Results */}
      <AnimatePresence>
        {searched && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {bookings.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Inbox className="w-8 h-8 text-gray-300" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">No tickets found</h2>
                <p className="text-sm text-gray-500">No confirmed bookings were found for <strong>{email}</strong>.</p>
              </div>
            ) : (
              <div className="space-y-5">
                <p className="text-sm text-gray-500 font-medium">{bookings.length} booking{bookings.length > 1 ? 's' : ''} found for <strong>{email}</strong></p>
                {bookings.map((booking, index) => (
                  <motion.div
                    key={booking._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.07 }}
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Event Image */}
                      <div className="sm:w-40 h-36 sm:h-auto shrink-0 bg-gray-100 overflow-hidden">
                        {(() => {
                          const imgUrl = getImageUrl(booking.event?.image);
                          return imgUrl?.match(/\.(mp4|webm|ogg)$/i) ? (
                            <video src={imgUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                          ) : (
                            <img src={imgUrl} alt={booking.event?.title} className="w-full h-full object-cover" />
                          );
                        })()}
                      </div>

                      {/* Details */}
                      <div className="flex-1 p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex-1">
                          <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full mb-2 inline-block">Confirmed</span>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{booking.event?.title}</h3>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500 font-medium mb-2">
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-primary" />{booking.event?.date}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-primary" />{booking.event?.location}</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            <span className="font-bold text-gray-600">{booking.quantity}</span> ticket{booking.quantity > 1 ? 's' : ''} &bull; ₹{booking.totalPrice?.toFixed(2)} &bull; ID: <span className="font-mono font-bold text-gray-700">{booking.bookingId}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDownloadTicket(booking.bookingId)}
                          className="shrink-0 flex items-center gap-2 border border-gray-200 hover:border-gray-900 hover:bg-gray-900 hover:text-white text-gray-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
                        >
                          <Download className="w-4 h-4" /> Download PDF
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyBookings;
