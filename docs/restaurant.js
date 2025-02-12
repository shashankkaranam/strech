const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
    origin: [
        'https://shashankkaranam.github.io',
        'http://localhost:3000',
        'https://strech-restaurant.onrender.com'
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const mongoUri = process.env.MONGO_URI;

mongoose.connect(mongoUri, { 
    dbName: "donationsDB",
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ Connection Error:', err));

const restaurantDonationSchema = new mongoose.Schema({
    restaurantName: String,
    contactEmail: String,
    phoneNumber: String,
    donationSize: String,
    foodType: String,
    shelfLife: String,
    donationDate: { type: Date, default: Date.now },
    restaurantAddress: String,
    pincode: String,
    gstNumber: String,
    foodSafetyNumber: String,
    websiteLink: String,
    willingToDeliver: String
}, { collection: 'restaurantDonations' });

const RestaurantDonation = mongoose.model('RestaurantDonation', restaurantDonationSchema);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'restaurant-donation-form.html'));
});

app.post('/submit', async (req, res) => {
    try {
        const newDonation = new RestaurantDonation({
            ...req.body,
            donationDate: req.body.donationDate ? new Date(req.body.donationDate) : new Date()
        });
        await newDonation.save();
        res.json({ message: "Donation submitted successfully!" });
    } catch (error) {
        console.error('❌ Submission Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Restaurant Server running on port ${PORT}`);
});
