require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');

const events = require('./seed-data');


mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        await Event.deleteMany({});
        await Event.insertMany(events);
        console.log('Database Seeded with Temple Events!');
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
