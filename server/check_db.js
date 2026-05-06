require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('--- DATABASE CHECK ---');
        const count = await Event.countDocuments();
        console.log('Total Events:', count);
        const events = await Event.find();
        events.forEach(e => console.log('- Event:', e.title, 'ID:', e._id, 'Date:', e.date));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
