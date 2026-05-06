import React, { useState, useEffect } from 'react';
import api from '../services/api';
import EventDetail from './EventDetail';

const Home = () => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get('/events');
        if (res.data.length > 0) {
          setEvent(res.data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch events:', err);
        if (err.response) {
          console.error('Server responded with:', err.response.status, err.response.data);
        }
      } finally {

        setLoading(false);
      }
    };
    fetchEvent();
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-dark">
      <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  if (!event) return (
    <div className="h-screen flex items-center justify-center text-gray-500 font-bold">
      No events currently scheduled.
    </div>
  );

  return <EventDetail singlePageEvent={event} />;
};

export default Home;
