require('dotenv').config();
// Production build trigger: 2026-05-06

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const Event = require('./models/Event');
const Booking = require('./models/Booking');
const { generateTicketPDF } = require('./utils/pdfGenerator');
const { sendTicketEmail } = require('./utils/emailSender');

const app = express();

// Middleware
app.use(cors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// MongoDB Connection
if (!process.env.MONGODB_URI) {
    console.error('CRITICAL ERROR: MONGODB_URI is not defined in environment variables!');
}

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));


// Razorpay Instance
let razorpay;
try {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'dummy',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy',
    });
} catch (err) {
    console.log('Razorpay not initialized - running in test mode');
}

// Get Config
app.get('/api/config', (req, res) => {
    res.json({ razorpayKey: process.env.RAZORPAY_KEY_ID });
});

// Routes
// 1. Get all events
app.get('/api/events', async (req, res) => {
    try {
        console.log('GET /api/events requested');
        
        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            console.error('Database not connected. Current state:', mongoose.connection.readyState);
            return res.status(503).json({ 
                message: 'Database connection is not ready. Please try again in a few seconds.',
                state: mongoose.connection.readyState 
            });
        }

        const today = new Date().toISOString().split('T')[0];
        console.log('Querying events for date >=', today);
        
        const events = await Event.find({ date: { $gte: today } }).sort({ date: 1 });
        console.log(`Found ${events.length} events`);
        res.json(events);
    } catch (err) {
        console.error('ERROR in GET /api/events:', err);
        res.status(500).json({ 
            message: 'Internal Server Error', 
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});



// 2. Create a new event with file uploads
app.post('/api/events', upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'artistImage', maxCount: 1 }
]), async (req, res) => {
    try {
        const eventData = { ...req.body };
        
        // Handle file paths
        if (req.files['images']) {
            eventData.images = req.files['images'].map(file => `/uploads/${file.filename}`);
            eventData.image = eventData.images[0]; // Set first image as primary thumbnail
        }
        if (req.files['artistImage']) {
            eventData.artistImage = `/uploads/${req.files['artistImage'][0].filename}`;
        }

        // Parse JSON arrays if sent as strings (typical in multipart)
        if (typeof eventData.features === 'string') {
            eventData.features = JSON.parse(eventData.features);
        }
        if (typeof eventData.thingsToKnow === 'string') {
            eventData.thingsToKnow = JSON.parse(eventData.thingsToKnow);
        }

        const newEvent = new Event({
            ...eventData,
            availableSlots: eventData.totalSlots
        });
        const savedEvent = await newEvent.save();
        res.status(201).json(savedEvent);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
app.get('/api/events/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. Create Razorpay Order
app.post('/api/booking/create-order', async (req, res) => {
    const { eventId, quantity, userName, userEmail, userPhone } = req.body;
    try {
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (event.availableSlots < quantity) {
            return res.status(400).json({ message: 'Not enough slots available' });
        }

        const amount = Math.round(event.price * quantity * 100); // Razorpay expects amount in paise

        const options = {
            amount: amount,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        // const order = await razorpay.orders.create(options);
        const order = { id: `test_order_${Date.now()}`, amount, currency: "INR" }; // Mock order for testing

        // Create a pending booking
        const booking = new Booking({
            event: eventId,
            userName,
            userEmail,
            userPhone,
            quantity,
            totalPrice: event.price * quantity,
            razorpayOrderId: order.id,
            bookingId: `TKT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        });

        await booking.save();

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            bookingId: booking.bookingId
        });
    } catch (err) {
        console.error('DETAILED ERROR:', err);
        res.status(500).json({ message: 'Order creation failed' });
    }
});

// 4. Verify Payment
app.post('/api/booking/verify-payment', async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'dummy')
        .update(sign.toString())
        .digest("hex");

    // Temporarily auto-verify for testing email system
    const isTestMode = razorpay_order_id && razorpay_order_id.startsWith('test_order_');
    
    if (isTestMode || razorpay_signature === expectedSign) {
        try {
            const booking = await Booking.findOne({ razorpayOrderId: razorpay_order_id });
            if (!booking) return res.status(404).json({ message: 'Booking not found' });

            booking.paymentStatus = 'completed';
            booking.razorpayPaymentId = razorpay_payment_id;
            await booking.save();

            // Update available slots atomically and check for overbooking
            const event = await Event.findOneAndUpdate(
                { _id: booking.event, availableSlots: { $gte: booking.quantity } },
                { $inc: { availableSlots: -booking.quantity } },
                { new: true }
            );

            if (!event) {
                return res.status(400).json({ message: "Event just sold out! Please contact temple administration for a refund." });
            }

            // Generate PDF and Send Email
            try {
                const pdfBuffer = await generateTicketPDF(booking, event);
                await sendTicketEmail(booking.userEmail, booking.userName, event.title, pdfBuffer, booking);
            } catch (err) {
                console.error('Email/PDF ERROR DETAILS:', {
                    message: err.message,
                    stack: err.stack,
                    code: err.code,
                    command: err.command
                });
                // Don't fail the response if email fails, but log it
            }

            
            res.json({ message: "Payment verified successfully", bookingId: booking.bookingId });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    } else {
        res.status(400).json({ message: "Invalid signature sent!" });
    }
});

// 5. Get User Bookings by email
app.get('/api/my-bookings/:email', async (req, res) => {
    try {
        const bookings = await Booking.find({ userEmail: req.params.email, paymentStatus: 'completed' })
            .populate('event');
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 6. Admin – View all bookings (password protected)
app.get('/api/admin/bookings', async (req, res) => {
    const adminPass = req.headers['x-admin-key'];
    if (adminPass !== process.env.ADMIN_SECRET) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const bookings = await Booking.find({ paymentStatus: 'completed' })
            .populate('event', 'title date location price')
            .sort({ createdAt: -1 });
        const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        res.json({ count: bookings.length, totalRevenue, bookings });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 7. Admin – Reseed Database (password protected)
app.get('/api/admin/reseed', async (req, res) => {
    const adminPass = (req.headers['x-admin-key'] || req.query.key || '').trim();
    const secret = (process.env.ADMIN_SECRET || '').trim();

    if (!secret || adminPass !== secret) {
        console.log(`Reseed unauthorized attempt. Provided: [${adminPass}], Secret set: ${secret ? 'YES' : 'NO'}`);
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        console.log('Reseeding database...');
        const seedData = require('./seed-data'); // I will move the array to a separate file
        await Event.deleteMany({});
        const savedEvents = await Event.insertMany(seedData);
        res.json({ message: 'Database reseeded successfully', events: savedEvents });
    } catch (err) {
        console.error('Reseed error:', err);
        res.status(500).json({ message: 'Reseed failed', error: err.message });
    }
});


// 8. Admin – Test Email (password protected)
app.get('/api/admin/test-email', async (req, res) => {
    const adminPass = (req.headers['x-admin-key'] || req.query.key || '').trim();
    if (adminPass !== process.env.ADMIN_SECRET) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
        const { sendTicketEmail } = require('./utils/emailSender');
        // Mock data for test
        const mockBooking = { bookingId: 'TEST-1234', userName: 'Test User', userEmail: req.query.to || process.env.EMAIL_USER };
        const mockEvent = { title: 'Test Event' };
        const mockPdfBuffer = Buffer.from('Test PDF Content');
        
        await sendTicketEmail(mockBooking.userEmail, mockBooking.userName, mockEvent.title, mockPdfBuffer, mockBooking);
        res.json({ message: 'Test email sent successfully to ' + mockBooking.userEmail });
    } catch (err) {
        console.error('Test email error:', err);
        res.status(500).json({ 
            message: 'Test email failed', 
            error: err.message,
            details: {
                code: err.code,
                command: err.command,
                response: err.response
            }
        });
    }
// 6. Download Ticket
app.get('/api/booking/download/:bookingId', async (req, res) => {
    try {

        const booking = await Booking.findOne({ bookingId: req.params.bookingId }).populate('event');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        const pdfBuffer = await generateTicketPDF(booking, booking.event);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ticket_${booking.bookingId}.pdf`);
        res.send(pdfBuffer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
