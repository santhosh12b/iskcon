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
      document.title = singlePageEvent.title;
      setLoading(false);
      return;
    }


    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        setEvent(res.data);
        document.title = res.data.title;


      } catch (err) {
        toast.error('Event not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, navigate, singlePageEvent]);




  const processPayment = async (e) => {
    e.preventDefault();
    if (!bookingName || !bookingEmail || !bookingPhone) {
      toast.error('Please enter your Name, Email, and Phone number');
      return;
    }

    setIsBookingModalOpen(false);

    setBookingLoading(true);
    try {
      // 1. Fetch Config
      const configRes = await api.get('/config');
      const { razorpayKey, isTestMode: configTestMode } = configRes.data;

      // 2. Create order on server
      const orderRes = await api.post('/booking/create-order', {
        eventId: event._id,
        quantity,
        userName: bookingName,
        userEmail: bookingEmail,
        userPhone: bookingPhone
      });


      const { orderId, amount, currency, isTestMode: orderTestMode } = orderRes.data;
      const isTest = configTestMode || orderTestMode;

      if (isTest) {
        // AUTO-VERIFY FOR TEST MODE
        const verifyRes = await api.post('/booking/verify-payment', {
          razorpay_order_id: orderId,
          razorpay_payment_id: 'test_payment_id',
          razorpay_signature: 'test_signature',
        });
        
        toast.success('🚀 Booking Successful!', {
          duration: 5000,
          icon: '✅',
        });
        setBookingSuccess({ bookingId: verifyRes.data.bookingId });
        setBookingLoading(false);
        return;
      }

      // 3. (Razorpay code removed)
      toast.error('Real payment system is disabled in this version');
      setBookingLoading(false);
    } catch (err) {
      console.error('Booking Error:', err);
      toast.error('Booking failed: ' + (err.response?.data?.message || err.message));
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
                <span className="font-medium text-sm">{event.location}, {event.fullLocation}</span>

              </div>
            </div>

            {event.organizer && (
              <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-100">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <p className="text-xs text-gray-400">Your ticket will be sent to your email instantly.</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                {event.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-1 p-1 bg-green-50 rounded-lg text-green-600">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold mb-6 text-gray-900">Event Location</h3>
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Venue</p>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">{event.location}</p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">City</p>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">{event.fullLocation}</p>
                </div>
              </div>

              {event.embedMap && (
                <div className="w-full h-80 rounded-2xl overflow-hidden border border-gray-200 shadow-inner group relative">
                  <div dangerouslySetInnerHTML={{ __html: event.embedMap }} className="w-full h-full grayscale-[0.2] hover:grayscale-0 transition-all duration-500" />
                  
                  {event.mapUrl && (
                    <button 
                      onClick={() => window.open(event.mapUrl, '_blank')}
                      className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm border border-gray-200 px-4 py-2 rounded-xl shadow-lg text-xs font-bold text-gray-900 flex items-center gap-2 hover:bg-white transition-all transform hover:scale-105 active:scale-95"
                    >
                      <Navigation className="w-3.5 h-3.5 text-blue-600" />
                      GET DIRECTIONS
                    </button>
                  )}
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
                className="w-full bg-primary hover:bg-red-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
              >
                <span>Book Now</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="flex items-center justify-center gap-6 pt-4 text-xs text-gray-400 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  <span>Instant Confirmation</span>
                </div>
                <div className="text-gray-300">|</div>
                <div className="font-medium text-gray-500">
                  {event.availableSlots} slots left
                </div>
              </div>
            </div>
            )}

            {/* Organizer Card */}
            {event.organizer && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-4">Performed by</p>
                <div className="flex items-center gap-4">
                  <img 
                    src="/kovai.png" 
                    className="w-14 h-14 object-contain bg-white border border-gray-100 shadow-sm shrink-0 p-1 rounded-lg" 
                    alt={event.organizer}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />

                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{ display: 'none' }}>
                    {event.organizer.charAt(0)}
                  </div>

                  <div>
                    <p className="font-bold text-gray-900">{event.organizer}</p>
                    <p className="text-xs text-gray-500">Artist: Kovai Chandra Team</p>
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
                onClick={() => {
                  setIsBookingModalOpen(false);
                  if (bookingSuccess) setBookingSuccess(null);
                }}
                className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 z-10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              {bookingSuccess ? (
                <div className="p-8 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Successful!</h3>
                  <p className="text-gray-500 mb-8">Your ticket has been sent to <br/><span className="font-bold text-gray-900">{bookingEmail}</span></p>
                  
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Booking ID</p>
                    <p className="font-mono text-xl font-bold text-gray-900">{bookingSuccess.bookingId}</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={async () => {
                        toast.loading('Generating ticket...', { id: 'download' });
                        try {
                          const res = await api.get(`/booking/download/${bookingSuccess.bookingId}`, { responseType: 'blob' });
                          const url = window.URL.createObjectURL(new Blob([res.data]));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', `ticket_${bookingSuccess.bookingId}.pdf`);
                          document.body.appendChild(link);
                          link.click();
                          toast.success('Downloaded!', { id: 'download' });
                        } catch (err) {
                          toast.error('Failed to download', { id: 'download' });
                        }
                      }}
                      className="w-full bg-primary hover:bg-red-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <Download className="w-5 h-5" />
                      Download Ticket PDF
                    </button>
                    <button
                      onClick={() => {
                        setIsBookingModalOpen(false);
                        setBookingSuccess(null);
                      }}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl transition-all"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <>
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

                    {/* Added Quantity Selector in Modal */}
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Number of Tickets</label>
                        <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 p-1">
                          <button
                            type="button"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-md transition-colors text-gray-600"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center font-bold text-gray-900">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(Math.min(event.availableSlots, quantity + 1))}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-md transition-colors text-gray-600"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
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
                </>
              )}
            </motion.div>
          </div>
        )}

      </AnimatePresence>

    </div>
  );
};

export default EventDetail;
