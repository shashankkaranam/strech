// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

require('dotenv').config();


const app = express();  // ✅ Make sure this comes before using app.use()

// Middleware for parsing form data
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());




// Middleware for parsing form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// MongoDB connection
const mongoUri = 'mongodb+srv://nourishnetworkk:CRSrinidhi339@nourishnetworktrial.nr6w9.mongodb.net/donationsDB?retryWrites=true&w=majority&appName=Nourishnetworktrial';

mongoose.connect(mongoUri)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Define schema and model for individual donations
const individualDonationSchema = new mongoose.Schema(
    {
        name: String,
        email: String,
        donationType: [String], // Handles multiple donation types
        quantity: String,
        notes: String,
        fullname: String,
        donationAmount: String,
        location: String,
        city: String,
        pickupDate: String
    },
    { collection: 'individualDonations' } // Explicitly set the collection name
);

const IndividualDonation = mongoose.model('IndividualDonation', individualDonationSchema);

// Serve the HTML form on the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'individual-donation.html'));
});

// Serve the "Thank You" page
app.get('/thank-you', (req, res) => {
    res.sendFile(path.join(__dirname, 'thankyou.html'));
});

// Handle form submission
app.post('/submit', async (req, res) => {
    try {
        const newDonation = new IndividualDonation({
            name: req.body.name,
            email: req.body.email,
            donationType: req.body.donationType, // Assuming the frontend sends an array
            quantity: req.body.quantity,
            notes: req.body.notes,
            fullname: req.body.fullname,
            donationAmount: req.body.donationAmount,
            location: req.body.location,
            city: req.body.city,
            pickupDate: req.body['pickup-date']
        });

        await newDonation.save();

        // Redirect to the Thank You page on success
        res.redirect('/thank-you');
    } catch (error) {
        console.error('Error saving donation:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Start the server on a different port.
const PORT = process.env.PORT || 4000;
const HOST = process.env.RENDER ? '0.0.0.0' : 'localhost';

app.listen(PORT, HOST, () => {
    console.log(`Server running on ${process.env.RENDER ? 'Render' : 'Localhost'} at port ${PORT}`);
});

