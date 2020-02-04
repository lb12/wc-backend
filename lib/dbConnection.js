'use strict'

// Load mongoose library
const mongoose = require('mongoose');
const conn = mongoose.connection;

// Handle connection event
conn.on('error', error => {
    console.log('Connection error', error);
    process.exit(1);
});

conn.once('open', () => {
    console.log('Connected with MongoDB on', conn.name);
});

// Handle deprecation warnings
const mongooseOptions = {
    useFindAndModify: false,
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
}

// Connect with MongoDB
const dbURL = process.env.MONGODB_URL || 'mongodb://localhost/wallaclone';
mongoose.connect(dbURL, mongooseOptions);

// Export the connection (optional --> we could get from mongoose.connection)
module.exports = conn;