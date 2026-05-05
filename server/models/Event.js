const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: Number, required: true },
    images: [{ type: String }],
    image: { type: String }, // Primary image for thumbnails
    category: { type: String, default: 'Entertainment' },
    totalSlots: { type: Number, required: true },
    availableSlots: { type: Number, required: true },
    artist: { type: String },
    artistImage: { type: String },
    features: [{ type: String }],
    thingsToKnow: [{ type: String }],
    organizer: { type: String },
    fullLocation: { type: String },
    mapUrl: { type: String },
    youtubeUrl: { type: String },
    embedMap: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
