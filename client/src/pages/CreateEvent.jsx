import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { motion } from 'framer-motion';
import { 
  Plus, Image as ImageIcon, Calendar, Clock, MapPin, 
  Tag, Users, Info, Building2, Mic2, Sparkles, CheckCircle2, 
  Upload, X, Map
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const CreateEvent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState({ images: [], artistImage: null });
  const [files, setFiles] = useState({ images: [], artistImage: null });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    fullLocation: '',
    mapUrl: '',
    price: '',
    category: 'Spiritual',
    totalSlots: '',
    artist: '',
    features: '',
    thingsToKnow: '',
    organizer: ''
  });

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles.length > 0) {
      if (name === 'images') {
        const newFiles = Array.from(selectedFiles);
        setFiles(prev => ({ ...prev, images: [...prev.images, ...newFiles] }));
        const newPreviews = newFiles.map(file => ({
          url: URL.createObjectURL(file),
          type: file.type
        }));
        setPreviews(prev => ({ ...prev, images: [...prev.images, ...newPreviews] }));
      } else {
        const file = selectedFiles[0];
        setFiles(prev => ({ ...prev, [name]: file }));
        setPreviews(prev => ({ ...prev, [name]: URL.createObjectURL(file) }));
      }
    }
  };

  const removeImage = (index) => {
    setFiles(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setPreviews(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'features' || key === 'thingsToKnow') {
          const arr = formData[key].split(',').map(f => f.trim()).filter(f => f);
          data.append(key, JSON.stringify(arr));
        } else {
          data.append(key, formData[key]);
        }
      });

      if (files.images && files.images.length > 0) {
        files.images.forEach(file => data.append('images', file));
      }
      if (files.artistImage) data.append('artistImage', files.artistImage);

      await api.post('/events', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Event published successfully!');
      navigate('/');
    } catch (err) {
      toast.error('Failed to publish event');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!user) return <div className="p-20 text-center">Please login to create events.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-text mb-2">Schedule Temple Program</h1>
        <p className="text-gray-500">Add a new festival or program to the temple calendar.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Images Upload */}
        <section className="space-y-6">
          <div className="glass p-8 rounded-3xl bg-white border-black/5">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-text">
              <ImageIcon className="w-5 h-5 text-primary" /> Program Banners (Slideshow)
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {previews.images.map((preview, index) => (
                <div key={index} className="relative aspect-video rounded-2xl overflow-hidden group border border-black/5">
                  {preview.type?.startsWith('video/') ? (
                    <video src={preview.url} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                  ) : (
                    <img src={preview.url} className="w-full h-full object-cover" alt={`Preview ${index}`} />
                  )}
                  <button 
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              <label className="aspect-video rounded-2xl border-2 border-dashed border-black/10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group">
                <input type="file" name="images" multiple onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
                <Plus className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Add Banner</span>
              </label>
            </div>
            <p className="text-xs text-gray-400 italic">Select multiple images or videos to create a sliding banner. The first item will be the primary thumbnail.</p>
          </div>

          <div className="glass p-8 rounded-3xl bg-white border-black/5">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-text">
              <Mic2 className="w-5 h-5 text-primary" /> Speaker Photo
            </h3>
            <label className="max-w-xs cursor-pointer group block">
              <input type="file" name="artistImage" onChange={handleFileChange} className="hidden" accept="image/*" />
              <div className="relative aspect-square rounded-full overflow-hidden bg-black/5 flex items-center justify-center border-2 border-dashed border-black/10 group-hover:border-primary/50 transition-all">
                {previews.artistImage ? (
                  <img src={previews.artistImage} className="w-full h-full object-cover" alt="Artist Preview" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Upload Photo</span>
                  </div>
                )}
              </div>
            </label>
          </div>
        </section>

        {/* Basic Info */}
        <section className="glass p-8 rounded-3xl bg-white border-black/5 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-text">
            <Info className="w-5 h-5 text-primary" /> Basic Information
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Event Title</label>
              <input required name="title" value={formData.title} onChange={handleChange} className="w-full bg-black/5 border border-black/10 rounded-2xl py-3 px-4 focus:outline-none focus:border-primary/50 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</label>
              <textarea required name="description" value={formData.description} onChange={handleChange} rows="4" className="w-full bg-black/5 border border-black/10 rounded-2xl py-3 px-4 focus:outline-none focus:border-primary/50 transition-all" />
            </div>
          </div>
        </section>

        {/* Schedule & Registration */}
        <section className="glass p-8 rounded-3xl bg-white border-black/5 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-text">
            <Calendar className="w-5 h-5 text-primary" /> Schedule & Registration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Date</label>
              <input required type="date" name="date" value={formData.date} onChange={handleChange} className="w-full bg-black/5 border border-black/10 rounded-2xl py-3 px-4 focus:outline-none focus:border-primary/50 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Time</label>
              <input required type="time" name="time" value={formData.time} onChange={handleChange} className="w-full bg-black/5 border border-black/10 rounded-2xl py-3 px-4 focus:outline-none focus:border-primary/50 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Donation / Entry Fee (₹)</label>
              <input required type="number" name="price" value={formData.price} onChange={handleChange} className="w-full bg-black/5 border border-black/10 rounded-2xl py-3 px-4 focus:outline-none focus:border-primary/50 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Devotee Capacity</label>
              <input required type="number" name="totalSlots" value={formData.totalSlots} onChange={handleChange} className="w-full bg-black/5 border border-black/10 rounded-2xl py-3 px-4 focus:outline-none focus:border-primary/50 transition-all" />
            </div>
          </div>
        </section>

        {/* Venue & Maps */}
        <section className="glass p-8 rounded-3xl bg-white border-black/5 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-text">
            <MapPin className="w-5 h-5 text-primary" /> Venue & Navigation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Temple / Hall Name</label>
              <input required name="location" value={formData.location} onChange={handleChange} className="w-full bg-black/5 border border-black/10 rounded-2xl py-3 px-4 focus:outline-none focus:border-primary/50 transition-all" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Address</label>
              <textarea name="fullLocation" value={formData.fullLocation} onChange={handleChange} rows="2" placeholder="Complete physical address..." className="w-full bg-black/5 border border-black/10 rounded-2xl py-3 px-4 focus:outline-none focus:border-primary/50 transition-all" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Google Maps URL</label>
              <div className="relative">
                <Map className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input name="mapUrl" value={formData.mapUrl} onChange={handleChange} placeholder="Paste shared link from Google Maps" className="w-full bg-black/5 border border-black/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-all" />
              </div>
            </div>
          </div>
        </section>

        {/* Speaker & Department */}
        <section className="glass p-8 rounded-3xl bg-white border-black/5 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-text">
            <Users className="w-5 h-5 text-primary" /> Speaker & Department
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Main Speaker / Kirtaniya</label>
              <input name="artist" value={formData.artist} onChange={handleChange} className="w-full bg-black/5 border border-black/10 rounded-2xl py-3 px-4 focus:outline-none focus:border-primary/50 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Organizing Department</label>
              <input required name="organizer" value={formData.organizer} onChange={handleChange} className="w-full bg-black/5 border border-black/10 rounded-2xl py-3 px-4 focus:outline-none focus:border-primary/50 transition-all" />
            </div>
          </div>
        </section>

        {/* Facilities & Guidelines */}
        <section className="glass p-8 rounded-3xl bg-white border-black/5 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-text">
            <Sparkles className="w-5 h-5 text-primary" /> Facilities & Guidelines
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Prasadam & Facilities</label>
              <textarea name="features" value={formData.features} onChange={handleChange} rows="3" placeholder="Comma separated (e.g. Full Prasadam, AC Hall, Free Parking)" className="w-full bg-black/5 border border-black/10 rounded-2xl py-3 px-4 focus:outline-none focus:border-primary/50 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Guidelines for Devotees</label>
              <textarea name="thingsToKnow" value={formData.thingsToKnow} onChange={handleChange} rows="3" placeholder="Comma separated (e.g. Modest Vaishnava dress, Bring chanting beads)" className="w-full bg-black/5 border border-black/10 rounded-2xl py-3 px-4 focus:outline-none focus:border-primary/50 transition-all" />
            </div>
          </div>
        </section>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full btn-primary py-5 text-lg font-black flex items-center justify-center gap-3 shadow-primary/30"
        >
          {loading ? (
            <span className="animate-spin w-6 h-6 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <>
              <CheckCircle2 className="w-6 h-6" />
              SCHEDULE PROGRAM
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateEvent;
