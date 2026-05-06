import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { QrCode, ArrowLeft, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const Scanner = () => {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);
  const [manualId, setManualId] = useState('');

  useEffect(() => {
    // Initialize the scanner
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 10,
    });

    scanner.render(success, error);

    function success(result) {
      if (!scanResult) {
        scanner.clear();
        setScanResult(result);
        
        // Parse the URL to get the booking ID
        // The QR code contains a URL like: http://localhost:5174/checkin/TKT-1234
        try {
          // Check if it's our checkin URL
          if (result.includes('/checkin/')) {
            const parts = result.split('/checkin/');
            const bookingId = parts[1];
            
            toast.success('Ticket Scanned!');
            // Play a success beep if needed
            
            // Navigate to the checkin page
            navigate(`/checkin/${bookingId}`);
          } else {
            toast.error('Invalid QR Code. Not an ISKCON Ticket.');
            // Re-render scanner after a delay
            setTimeout(() => {
              setScanResult(null);
              scanner.render(success, error);
            }, 3000);
          }
        } catch (err) {
          toast.error('Error reading QR code');
        }
      }
    }

    function error(err) {
      // Quietly ignore scan errors as it scans continuously
    }

    // Cleanup on unmount
    return () => {
      scanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, [navigate, scanResult]);

  const handleManualSubmit = (e) => {
    if (e) e.preventDefault();
    if (!manualId.trim()) return;
    
    // Ensure it has TKT- prefix if user forgot
    let finalId = manualId.trim().toUpperCase();
    if (!finalId.startsWith('TKT-')) {
      finalId = 'TKT-' + finalId;
    }
    
    // Force a hard redirect to ensure the camera is fully released
    window.location.href = `/checkin/${finalId}`;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between z-10 bg-black/80 backdrop-blur-md sticky top-0 border-b border-gray-800">
        <button 
          onClick={() => navigate('/admin')} 
          className="p-2 bg-gray-900 hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary" />
          <span className="font-bold tracking-widest text-sm uppercase">Live Scanner</span>
        </div>
        <div className="w-10"></div> {/* Spacer for center alignment */}
      </div>

      {/* Scanner Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        
        <div className="w-full max-w-md mx-auto relative">
          {/* UI decorative corners */}
          <div className="absolute -top-4 -left-4 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl z-10"></div>
          <div className="absolute -top-4 -right-4 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl z-10"></div>
          <div className="absolute -bottom-4 -left-4 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl z-10"></div>
          <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl z-10"></div>
          
          <div id="reader" className="w-full rounded-2xl overflow-hidden shadow-2xl bg-gray-900 border border-gray-800"></div>
        </div>

        <div className="mt-8 text-center max-w-xs w-full">
          <p className="text-gray-400 font-medium mb-6">Align the ticket's QR code within the frame to scan.</p>
          
          {/* Manual Input Fallback */}
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 relative z-50">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">Or Enter Booking ID Manually</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="TKT-XXXXX"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleManualSubmit(e);
                }}
                className="flex-1 bg-black border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary uppercase font-mono"
              />
              <button 
                type="button"
                onClick={handleManualSubmit}
                className="bg-primary hover:bg-red-800 text-white p-3 rounded-xl transition-colors shrink-0 flex items-center justify-center cursor-pointer"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scanner;
