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
const { sendTicketEmail, sendCheckInEmail } = require('./utils/emailSender');

const app = express();


app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-key');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());
app.get('/test', (req, res) => res.send('SERVER IS UPDATED'));
// (moved to line 52)


// Ensure uploads directory exists. On Vercel, only /tmp is writable.
const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
const uploadDir = isVercel ? '/tmp/uploads' : 'uploads';

if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Map /uploads route to both /tmp (for new uploads) and bundled uploads (for seeded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
if (isVercel) {
    app.use('/uploads', express.static('/tmp/uploads'));
}

// MongoDB Connection Cache for Serverless
let cachedConnection = null;

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) return mongoose.connection;
    if (cachedConnection) return cachedConnection;

    const maskedURI = process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:([^@]+)@/, ':****@') : 'MISSING';
    console.log('Connecting to MongoDB:', maskedURI);

    cachedConnection = mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000 // Increased to 10s for slow Vercel cold starts
    });
    
    return cachedConnection;
};

// Initial connection attempt
connectDB().catch(err => console.error('Initial MongoDB connection error:', err));


// Razorpay Instance
let razorpay;
const isForceTestMode = process.env.TEST_MODE === 'true';

try {
    if (isForceTestMode || !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'your_razorpay_key_id') {
        console.log('--- RUNNING IN TEST MODE (No Real Payments) ---');
        razorpay = null;
    } else {
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }
} catch (err) {
    console.log('Razorpay initialization failed - falling back to test mode');
    razorpay = null;
}


// Get Config
app.get('/api/config', (req, res) => {
    res.json({ 
        razorpayKey: process.env.RAZORPAY_KEY_ID,
        isTestMode: !razorpay 
    });
});


// Routes
// 1. Get all events
app.get('/api/events', async (req, res) => {
    try {
        console.log('GET /api/events requested');
        
        // Ensure DB is connected for serverless cold starts
        await connectDB();
        
        if (mongoose.connection.readyState !== 1) {
            console.error('Database not connected. Current state:', mongoose.connection.readyState);
            return res.status(503).json({ 
                message: 'Database connection is not ready. Please try again in a few seconds.',
                state: mongoose.connection.readyState 
            });
        }

        const today = new Date().toISOString().split('T')[0];
        console.log('Querying ALL events (No Filter)');
        
        const events = await Event.find().sort({ date: 1 });
        console.log(`Found ${events.length} events total`);
        res.json(events);

    } catch (err) {
        console.error('ERROR in GET /api/events:', err);
        res.status(500).json({ 
            message: 'Internal Server Error', 
            error: err.message
        });
    }
});

// DEBUG: Get all events without filters
app.get('/api/admin/all-events', async (req, res) => {
    try {
        await connectDB();
        const events = await Event.find();
        res.json({
            count: events.length,
            events: events
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});




// 2. Create a new event with file uploads
app.post('/api/events', upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'artistImage', maxCount: 1 }
]), async (req, res) => {
    try {
        await connectDB();
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
        await connectDB();
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// (Duplicate config route removed)

// 3. Create Razorpay Order
app.post('/api/booking/create-order', async (req, res) => {
    const { eventId, quantity, userName, userEmail, userPhone } = req.body;
    try {
        await connectDB();
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (event.availableSlots < quantity) {
            return res.status(400).json({ message: 'Not enough slots available' });
        }

        const amount = Math.round(event.price * quantity * 100); // Razorpay expects amount in paise

        let order;
        if (!razorpay) {
            // DEVELOPER TEST MODE: Create a fake order object
            order = {
                id: `test_order_${Math.random().toString(36).substr(2, 9)}`,
                amount: amount,
                currency: "INR"
            };
        } else {
            const options = {
                amount: amount,
                currency: "INR",
                receipt: `receipt_${Math.random().toString(36).substr(2, 9)}`
            };
            order = await razorpay.orders.create(options);
        }


        const booking = new Booking({
            event: eventId,
            quantity,
            userName,
            userEmail,
            userPhone,
            totalPrice: event.price * quantity,
            razorpayOrderId: order.id,
            bookingId: `TKT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        });

        await booking.save();

        const responseData = {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            bookingId: booking.bookingId,
            isTestMode: !razorpay
        };
        console.log('Sending Response:', responseData);
        res.json(responseData);

    } catch (err) {
        console.error('ORDER CREATION ERROR:', err);
        res.status(500).json({ message: 'Order creation failed', error: err.message });
    }
});


// 4. Verify Payment
app.post('/api/booking/verify-payment', async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    try {
        await connectDB();
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

            // Calculate Seat Numbers (Sequential starting from G0001)
            const result = await Booking.aggregate([
                { $match: { event: event._id, paymentStatus: 'completed', _id: { $ne: booking._id } } },
                { $group: { _id: null, total: { $sum: "$quantity" } } }
            ]);
            const prevSold = result[0]?.total || 0;
            const seatStart = prevSold + 1;
            const seatRange = booking.quantity > 1 
                ? `G${String(seatStart).padStart(3, '0')} - G${String(seatStart + booking.quantity - 1).padStart(3, '0')}`
                : `G${String(seatStart).padStart(3, '0')}`;

            // Generate PDF and Send Email
            try {
                const pdfBuffer = await generateTicketPDF(booking, event, seatRange);
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
    } catch (err) {
        console.error('VERIFY PAYMENT ERROR:', err);
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
});

// 5. Get User Bookings by email
app.get('/api/my-bookings/:email', async (req, res) => {
    try {
        await connectDB();
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
        await connectDB();
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
});

// 6. Validate Booking for Check-in
app.get('/api/booking/checkin/:bookingId', async (req, res) => {
    try {
        await connectDB();
        const booking = await Booking.findOne({ bookingId: req.params.bookingId }).populate('event');
        if (!booking) return res.status(404).json({ message: 'Ticket not found or invalid' });
        
        res.json({
            bookingId: booking.bookingId,
            userName: booking.userName,
            userEmail: booking.userEmail,
            userPhone: booking.userPhone,
            quantity: booking.quantity,
            eventTitle: booking.event?.title,
            eventDate: booking.event?.date,
            paymentStatus: booking.paymentStatus,
            checkedIn: booking.checkedIn,
            checkedInAt: booking.checkedInAt
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 7. Confirm Check-in
app.post('/api/booking/confirm-checkin/:bookingId', async (req, res) => {
    try {
        await connectDB();
        const { pin } = req.body;
        if (pin !== process.env.STAFF_PIN) {
            return res.status(401).json({ message: 'Invalid Staff PIN' });
        }

        const booking = await Booking.findOne({ bookingId: req.params.bookingId });
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        
        if (booking.checkedIn) {
            return res.status(400).json({ 
                message: 'Already checked in!', 
                time: booking.checkedInAt 
            });
        }

        booking.checkedIn = true;
        booking.checkedInAt = new Date();
        await booking.save();

        // Send Welcome Email
        const event = await Event.findById(booking.event);
        try {
            console.log(`Sending Welcome Email to ${booking.userEmail}...`);
            await sendCheckInEmail(booking.userEmail, booking.userName, event ? event.title : 'the Event');
            console.log('Welcome Email sent successfully!');
        } catch (err) {
            console.error("Check-in Email failed:", err);
        }


        res.json({ 
            message: 'Check-in successful!', 
            userName: booking.userName,
            time: booking.checkedInAt 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 8. Download Ticket
app.get('/api/booking/download/:bookingId', async (req, res) => {
    try {
        await connectDB();
        const booking = await Booking.findOne({ bookingId: req.params.bookingId }).populate('event');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (!booking.event) return res.status(404).json({ message: 'Event associated with this booking no longer exists' });

        // Calculate Seat Numbers for PDF
        const result = await Booking.aggregate([
            { $match: { event: booking.event._id, paymentStatus: 'completed', createdAt: { $lt: booking.createdAt } } },

            { $group: { _id: null, total: { $sum: "$quantity" } } }
        ]);
        const prevSold = result[0]?.total || 0;
        const seatStart = prevSold + 1;
        const seatRange = booking.quantity > 1 
            ? `G${String(seatStart).padStart(3, '0')} - G${String(seatStart + booking.quantity - 1).padStart(3, '0')}`
            : `G${String(seatStart).padStart(3, '0')}`;

        const pdfBuffer = await generateTicketPDF(booking, booking.event, seatRange);

        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ticket_${booking.bookingId}.pdf`);
        res.send(pdfBuffer);
    } catch (err) {
        console.error('DOWNLOAD ERROR:', err);
        res.status(500).json({ message: 'Ticket generation failed: ' + err.message });
    }

});

const PORT = process.env.PORT || 5001;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Required for Vercel Serverless
module.exports = app;
