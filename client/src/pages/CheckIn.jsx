import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Ticket, 
  Calendar, 
  ChevronLeft,
  Loader2,
  AlertTriangle,
  QrCode
} from 'lucide-react';
import toast from 'react-hot-toast';

const CheckIn = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [pin, setPin] = useState(localStorage.getItem('staffPin') || '');


  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/booking/checkin/${bookingId}`);
      setBooking(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired ticket');
      toast.error('Ticket Verification Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!pin) {
      toast.error('Please enter the Staff PIN');
      return;
    }

    setCheckingIn(true);
    try {
      const response = await api.post(`/booking/confirm-checkin/${bookingId}`, { pin });
      toast.success('Check-in Successful!', { icon: '✅' });
      localStorage.setItem('staffPin', pin);
      // Update local state
      setBooking(prev => ({ 
        ...prev, 
        checkedIn: true, 
        checkedInAt: response.data.time 
      }));
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('staffPin');
      }
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">Verifying Ticket Authenticity...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <XCircle className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Ticket</h1>
        <p className="text-gray-500 mb-8 max-w-xs">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-black transition-all"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const isAlreadyCheckedIn = booking?.checkedIn;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-none">Ticket Validation</h1>
          <p className="text-xs text-gray-400 font-medium mt-1">Staff Portal • ISKCON Coimbatore</p>
        </div>
      </div>

      <div className="max-w-md mx-auto p-6 space-y-6">
        
        {/* Status Banner */}
        <div className={`p-6 rounded-3xl border-2 flex flex-col items-center text-center shadow-sm ${
          isAlreadyCheckedIn 
            ? 'bg-orange-50 border-orange-100' 
            : 'bg-green-50 border-green-100'
        }`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
            isAlreadyCheckedIn ? 'bg-orange-100' : 'bg-green-100'
          }`}>
            {isAlreadyCheckedIn ? (
              <AlertTriangle className="w-10 h-10 text-orange-600" />
            ) : (
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            )}
          </div>
          <h2 className={`text-2xl font-black ${
            isAlreadyCheckedIn ? 'text-orange-900' : 'text-green-900'
          }`}>
            {isAlreadyCheckedIn ? 'ALREADY USED' : 'TICKET VALID'}
          </h2>
          <p className={`text-sm mt-1 font-medium ${
            isAlreadyCheckedIn ? 'text-orange-600' : 'text-green-600'
          }`}>
            {isAlreadyCheckedIn 
              ? `Checked in on ${new Date(booking.checkedInAt).toLocaleTimeString()}` 
              : 'Scan verified successfully'}
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-gray-400" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Booking Information</span>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter mb-0.5">Attendee Name</p>
                <p className="text-lg font-bold text-gray-900 leading-none">{booking.userName}</p>
                <p className="text-sm text-gray-500 mt-1">{booking.userPhone}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Quantity</p>
                <div className="flex items-center gap-2 text-gray-900">
                  <Ticket className="w-4 h-4" />
                  <span className="text-xl font-bold">{booking.quantity}</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Booking ID</p>
                <p className="text-sm font-mono font-black text-primary">{booking.bookingId}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-dashed border-gray-200">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter mb-0.5">Event</p>
                  <p className="text-base font-bold text-gray-900">{booking.eventTitle}</p>
                  <p className="text-xs text-gray-500 mt-1">{booking.eventDate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {!isAlreadyCheckedIn && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-xl">🔒</span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Staff PIN</p>
                <input 
                  type="password" 
                  placeholder="Enter PIN to confirm" 
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-lg font-bold text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            <button
              onClick={handleConfirmCheckIn}
              disabled={checkingIn}
              className="w-full bg-primary hover:bg-red-800 text-white font-black py-5 rounded-3xl shadow-xl shadow-red-900/20 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {checkingIn ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="text-lg">CONFIRM ENTRY</span>
                </>
              )}
            </button>
          </div>
        )}

        {isAlreadyCheckedIn && (
          <div className="bg-white rounded-3xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">Last Seen At</p>
              <p className="text-sm font-bold text-gray-900">{new Date(booking.checkedInAt).toLocaleString()}</p>
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Powered by ISKCON Ticketing Systems</p>
        </div>

      </div>
    </div>
  );
};

export default CheckIn;
