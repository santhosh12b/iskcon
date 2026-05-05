import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin } from 'lucide-react';
import { getImageUrl } from '../services/api';

const EventCard = ({ event }) => {
  const imageUrl = getImageUrl(event.image);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group glass rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 border-black/5 bg-white"
    >
      <Link to={`/event/${event._id}`} className="block relative aspect-[16/10] overflow-hidden">
        {imageUrl.match(/\.(mp4|webm|ogg)$/i) ? (
          <video 
            src={imageUrl} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            autoPlay loop muted playsInline
          />
        ) : (
          <img 
            src={imageUrl} 
            alt={event.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}
        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold border border-black/5 text-text">
          ₹{event.price}
        </div>
      </Link>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          {event.category}
        </div>
        
        <h3 className="text-xl font-bold mb-3 line-clamp-1">{event.title}</h3>
        
        <div className="space-y-2 mb-6 flex-1">
          <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
            <Calendar className="w-4 h-4 text-primary" />
            {event.date}
          </div>
          <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
            <MapPin className="w-4 h-4 text-primary" />
            {event.location}
          </div>
        </div>

        <Link to={`/event/${event._id}`}>
          <motion.button 
            whileTap={{ scale: 0.98 }}
            className={`w-full btn-primary ${event.availableSlots === 0 ? 'bg-gray-400 cursor-not-allowed shadow-none' : ''}`}
            disabled={event.availableSlots === 0}
          >
            {event.availableSlots === 0 ? 'Sold Out' : 'Book Now'}
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
};

export default EventCard;
