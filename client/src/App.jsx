import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import EventDetail from './pages/EventDetail';
import MyBookings from './pages/MyBookings';
import CreateEvent from './pages/CreateEvent';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Toaster position="top-right" toastOptions={{
          style: {
            background: '#1A1A1A',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)'
          }
        }} />
        <Navbar />
        <div className="pt-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/create-event" element={<CreateEvent />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
