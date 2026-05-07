const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    userPhone: { type: String },
    quantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    bookingId: { type: String, unique: true }, // Unique human-readable ID
    checkedIn: { type: Boolean, default: false }, // Overall status
    checkedInAt: { type: Date },
    checkedInCount: { type: Number, default: 0 },
    checkInDetails: [{
        seatNumber: String,
        checkedIn: { type: Boolean, default: false },
        checkedInAt: { type: Date }
    }]
}, { timestamps: true });


module.exports = mongoose.model('Booking', bookingSchema);
