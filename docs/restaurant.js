// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware for parsing form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files (CSS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
const mongoUri = 'mongodb+srv://nourishnetworkk:CRSrinidhi339@nourishnetworktrial.nr6w9.mongodb.net/donationsDB?retryWrites=true&w=majority&appName=Nourishnetworktrial';

mongoose.connect(mongoUri)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Define schema and model for restaurant donations
const restaurantDonationSchema = new mongoose.Schema(
    {
        restaurantName: String,
        contactEmail: String,
        phoneNumber: String,
        donationSize: String,
        foodType: String,
        shelfLife: String,
        donationDate: Date,
        restaurantAddress: String,
        pincode: String,
        gstNumber: String,
        foodSafetyNumber: String,
        websiteLink: String,
        willingToDeliver: String
    },
    { collection: 'restaurantDonations' } // Explicitly set the collection name
);

const RestaurantDonation = mongoose.model('RestaurantDonation', restaurantDonationSchema);

// Serve the HTML form on the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'restaurant-donation-form.html'));
});

// Serve the "Thank You" page
app.get('/thank-you', (req, res) => {
    res.sendFile(path.join(__dirname, 'thankyou.html'));
});

// Handle form submission
app.post('/submit', async (req, res) => {
    try {
        const newDonation = new RestaurantDonation({
            restaurantName: req.body['restaurant-name'],
            contactEmail: req.body['contact-email'],
            phoneNumber: req.body['phone-number'],
            donationSize: req.body['donation-size'],
            foodType: req.body['food-type'],
            shelfLife: req.body['shelf-life'],
            donationDate: req.body['donation-date'],
            restaurantAddress: req.body['restaurant-address'],
            pincode: req.body['pincode'],
            gstNumber: req.body['gst-number'],
            foodSafetyNumber: req.body['food-safety-number'],
            websiteLink: req.body['website-link'],
            willingToDeliver: req.body['willing-to-deliver']
        });

        await newDonation.save();

        // Redirect to the Thank You page on success
        res.redirect('/thank-you');
    } catch (error) {
        console.error('Error saving donation:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
