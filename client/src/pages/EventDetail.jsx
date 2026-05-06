import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { IMAGE_BASE_URL, getImageUrl } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Clock, Ticket, Minus, Plus, ShieldCheck, Download, Navigation, User, Mail, ChevronLeft, ChevronRight, X, CheckCircle2, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

const EventDetail = ({ singlePageEvent }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(singlePageEvent || null);
  const [quantity, setQuantity] = useState(1);
  const [bookingName, setBookingName] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null); // stores { bookingId }
  const [loading, setLoading] = useState(!singlePageEvent);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (singlePageEvent) {
      setEvent(singlePageEvent);
      setLoading(false);
      return;
    }
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        setEvent(res.data);
      } catch (err) {
        toast.error('Event not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, navigate, singlePageEvent]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const processPayment = async (e) => {
    e.preventDefault();
    if (!bookingName || !bookingEmail || !bookingPhone) {
      toast.error('Please enter your Name, Email, and Phone number');
      return;
    }

    setIsBookingModalOpen(false);

    const res = await loadRazorpay();
    if (!res) {
      toast.error('Razorpay SDK failed to load');
      return;
    }

    setBookingLoading(true);
    try {
      // Fetch Razorpay key from server
      const configRes = await api.get('/config');
      const { razorpayKey } = configRes.data;

      // 1. Create order on server
      const orderRes = await api.post('/booking/create-order', {
        eventId: event._id,
        quantity,
        userName: bookingName,
        userEmail: bookingEmail,
        userPhone: bookingPhone
      });

      const { orderId, amount, currency } = orderRes.data;

      // 2. Open Razorpay Modal
      const options = {
        key: razorpayKey,
        amount: amount,
        currency: currency,
        name: "ISKCON Coimbatore",
        description: `Booking for ${event.title}`,
        order_id: orderId,
        handler: async (response) => {
          setBookingLoading(true);
          try {
            const verifyRes = await api.post('/booking/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            toast.success('🎉 Booking Successful!', {
              duration: 5000,
              icon: '🙏',
            });
            setBookingSuccess({ bookingId: verifyRes.data.bookingId });
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
          } finally {
            setBookingLoading(false);
          }
        },
        prefill: {
          name: bookingName,
          email: bookingEmail,
          contact: bookingPhone,
        },
        theme: {
          color: "#8C1C13",
        },
        modal: {
          ondismiss: () => {
            setBookingLoading(false);
          }
        }
      };
      
      const rzp1 = new window.Razorpay(options);
      rzp1.open();

    } catch (err) {
      console.error('Booking error:', err);
      toast.error(err.response?.data?.message || 'Failed to initialize booking');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-[#8C1C13] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 font-medium animate-pulse">Loading Event Details...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
      {/* Top Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl overflow-hidden w-full mb-8 relative group bg-black shadow-xl"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full flex items-center justify-center"
          >
            {(() => {
              const mediaList = event.images && event.images.length > 0 ? event.images : [event.image];
              const mediaUrl = getImageUrl(mediaList[currentSlide]);
              
              return mediaUrl?.match(/\.(mp4|webm|ogg)$/i) ? (
                <video src={mediaUrl} className="w-full h-auto max-h-[80vh] object-contain" autoPlay loop muted playsInline controls />
              ) : (
                <img src={mediaUrl} alt={event.title} className="w-full h-auto max-h-[80vh] object-contain block" />
              );
            })()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        {event.images && event.images.length > 1 && (
          <>
            <button 
              onClick={() => setCurrentSlide((prev) => (prev === 0 ? event.images.length - 1 : prev - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setCurrentSlide((prev) => (prev === event.images.length - 1 ? 0 : prev + 1))}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {event.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'}`}
                />
              ))}
            </div>
          </>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Title & Info Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="bg-black text-white text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider">Concert</span>
              <span className="bg-fuchsia-600 text-white text-xs font-bold px-3 py-1 rounded-md uppercase">Exclusive</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 leading-tight">{event.title}</h1>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 text-gray-600">
                <Calendar className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <span className="font-medium text-sm">{event.date} • {event.time}</span>
              </div>
              <div className="flex items-start gap-3 text-gray-600">
                <MapPin className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <span className="font-medium text-sm">{event.location} - {event.fullLocation}</span>
              </div>
            </div>

            {event.organizer && (
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white font-bold text-xs">
                  {event.organizer.charAt(0)}
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  Organized by <span className="text-gray-900 font-bold">{event.organizer}</span>
                </p>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 shadow-sm flex-1 min-w-[200px]">
              <div className="p-2 bg-orange-50 rounded-full text-orange-500"><ShieldCheck className="w-5 h-5" /></div>
              <div>
                <p className="text-sm font-bold text-gray-900">High-Interest Event</p>
                <p className="text-xs text-gray-500">Book now before it's gone</p>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 shadow-sm flex-1 min-w-[200px]">
              <div className="p-2 bg-pink-50 rounded-full text-pink-500"><User className="w-5 h-5" /></div>
              <div>
                <p className="text-sm font-bold text-gray-900">Popular among attendees</p>
                <p className="text-xs text-gray-500">Loved by many event-goers</p>
              </div>
            </div>
          </div>

          {/* About Event Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold mb-4 text-gray-900">About the Event</h3>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
              {event.description}
            </div>
          </div>

          {/* Artist Card */}
          {event.artist && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-bold mb-6 text-gray-900">Artist</h3>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-4">Main Performer</p>
              <div className="flex items-center gap-6">
                {event.artistImage ? (
                  <img 
                    src={getImageUrl(event.artistImage)} 
                    className="w-24 h-24 rounded-full object-cover border border-gray-100 shadow-sm" 
                    alt={event.artist}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-3xl font-bold border border-gray-200">
                    {event.artist.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-2xl font-bold text-gray-900">{event.artist}</p>
                  <p className="text-sm text-gray-500 font-medium mt-1">Independent Musician</p>
                </div>
              </div>
            </div>
          )}

          {/* YouTube Preview Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold mb-6 text-gray-900">Event Preview</h3>
            <div className="rounded-xl overflow-hidden aspect-video bg-black w-full shadow-sm">
              <iframe 
                width="100%" 
                height="100%" 
                src={event.youtubeUrl || "https://www.youtube.com/embed/RREIkDUVO7I?si=fV6n2Ld6z3bDy2lI"}
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerPolicy="strict-origin-when-cross-origin" 
                allowFullScreen
              ></iframe>
            </div>
          </div>

          {/* Comforts & Features Card */}
          {event.features && event.features.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-bold mb-2 text-gray-900">Event Comforts & Features</h3>
              <p className="text-xs text-gray-500 mb-6">About the event's comforts and features</p>
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                {event.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold mb-6 text-gray-900">Event Location</h3>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Venue</p>
                  <p className="text-sm text-gray-800 font-medium">{event.fullLocation}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">City</p>
                  <p className="text-sm text-gray-800 font-medium">{event.location}</p>
                </div>
                {event.mapUrl && (
                  <button onClick={() => window.open(event.mapUrl, '_blank')} className="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center gap-1">
                    Open in Maps <Navigation className="w-3 h-3"/>
                  </button>
                )}
              </div>
              {event.embedMap && (
                <div className="w-full md:w-64 h-48 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                  <div dangerouslySetInnerHTML={{ __html: event.embedMap }} className="w-full h-full" />
                </div>
              )}
            </div>
          </div>

          {/* Things to Know Card */}
          {event.thingsToKnow && event.thingsToKnow.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-bold mb-6 text-gray-900">Things to know</h3>
              
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-900 mb-3">Terms & Conditions</h4>
                <ul className="space-y-3">
                  {event.thingsToKnow.map((item, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-gray-600">
                      <span className="text-gray-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 mb-2">Cancellation & Refunds</h4>
                <p className="text-sm text-gray-600">No Refund for Missed Events</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Booking Widget */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            
            {/* Booking Card */}
            {bookingSuccess ? (
              <div className="bg-white border border-green-200 rounded-2xl p-6 shadow-md text-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-9 h-9 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Booking Confirmed!</h3>
                <p className="text-sm text-gray-500 mb-4">Your e-ticket has been sent to <span className="font-semibold text-gray-800">{bookingEmail}</span></p>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-5 text-left space-y-1.5">
                  <p className="text-xs text-gray-400 uppercase font-bold">Booking Summary</p>
                  <p className="text-sm font-bold text-gray-900">{event.title}</p>
                  <p className="text-xs text-gray-500">{quantity} ticket{quantity > 1 ? 's' : ''} × ₹{event.price}</p>
                  <p className="text-base font-black text-gray-900">Total: ₹{(event.price * quantity).toFixed(2)}</p>
                  <p className="text-xs text-gray-400 pt-1">Booking ID: <span className="font-mono font-bold text-gray-700">{bookingSuccess.bookingId}</span></p>
                </div>
                <button
                  onClick={async () => {
                    toast.loading('Preparing ticket...', { id: 'dl' });
                    try {
                      const response = await api.get(`/booking/download/${bookingSuccess.bookingId}`, { responseType: 'blob' });
                      const url = window.URL.createObjectURL(new Blob([response.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `ticket_${bookingSuccess.bookingId}.pdf`);
                      document.body.appendChild(link);
                      link.click();
                      toast.success('Ticket downloaded!', { id: 'dl' });
                    } catch { toast.error('Download failed', { id: 'dl' }); }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-colors text-sm"
                >
                  <Download className="w-4 h-4" /> Download Ticket PDF
                </button>
              </div>
            ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Per Ticket</p>
                  <p className="text-2xl font-bold text-gray-900">₹{event.price}</p>
                </div>
                <div className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-1 rounded">
                  Filling Fast
                </div>
              </div>

              <div className="space-y-4 mb-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Quantity</label>
                  <div className="flex items-center justify-between border border-gray-200 rounded-lg p-1 bg-gray-50">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-white rounded shadow-sm text-gray-600"><Minus className="w-4 h-4" /></button>
                    <span className="font-bold text-gray-900">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(event.availableSlots, quantity + 1))} className="p-2 hover:bg-white rounded shadow-sm text-gray-600"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mb-4 flex justify-between items-center">
                <p className="text-sm font-bold text-gray-500">Total</p>
                <p className="text-xl font-black text-gray-900">₹{(event.price * quantity).toFixed(2)}</p>
              </div>

              <button 
                onClick={() => setIsBookingModalOpen(true)}
                disabled={event.availableSlots === 0}
                className="w-full bg-[#ff4b4b] hover:bg-[#e63e3e] text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
              >
                {event.availableSlots === 0 ? 'Sold Out' : 'Book Now'}
              </button>
              
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-green-500"/> Secure Payment</span>
                <span>{event.availableSlots} slots left</span>
              </div>
            </div>
            )}

            {/* Organizer Card */}
            {event.organizer && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-4">Organized by</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    {event.organizer.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{event.organizer}</p>
                    <p className="text-xs text-gray-500">Hosted by event-goers</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tags Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-4">Tags</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-600"># {event.location}</span>
                <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-600"># Concert</span>
                <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-600"># Music</span>
              </div>
            </div>

          </div>
        </div>
      </div>
      
      {/* Mobile Sticky Booking Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-4 flex items-center justify-between shadow-2xl">
        <div>
          <p className="text-xs text-gray-500 font-bold">Total Amount</p>
          <p className="text-xl font-black text-gray-900">₹{(event.price * quantity).toFixed(2)}</p>
        </div>
        <button 
          onClick={() => setIsBookingModalOpen(true)}
          disabled={event.availableSlots === 0}
          className="bg-[#ff4b4b] text-white px-8 py-3 rounded-xl font-bold"
        >
          {event.availableSlots === 0 ? 'SOLD OUT' : 'BOOK NOW'}
        </button>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
            >
              <button 
                onClick={() => setIsBookingModalOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 z-10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900">Guest Details</h3>
                <p className="text-sm text-gray-500 mt-1">Please enter your details to receive the tickets.</p>
              </div>

              <form onSubmit={processPayment} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    placeholder="Enter your full name" 
                    className="w-full border border-gray-200 rounded-lg py-3 px-4 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={bookingEmail}
                    onChange={(e) => setBookingEmail(e.target.value)}
                    placeholder="hello@example.com" 
                    className="w-full border border-gray-200 rounded-lg py-3 px-4 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Phone Number</label>
                  <input 
                    type="tel" 
                    required
                    value={bookingPhone}
                    onChange={(e) => setBookingPhone(e.target.value)}
                    placeholder="+91 9876543210" 
                    className="w-full border border-gray-200 rounded-lg py-3 px-4 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                  />
                </div>

                <div className="pt-4 mt-6 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Total</p>
                    <p className="text-xl font-bold text-gray-900">₹{(event.price * quantity).toFixed(2)}</p>
                  </div>
                  <button 
                    type="submit"
                    disabled={bookingLoading}
                    className="bg-[#ff4b4b] hover:bg-[#e63e3e] text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {bookingLoading ? 'Processing...' : 'Proceed to Payment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default EventDetail;
