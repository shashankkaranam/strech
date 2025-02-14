const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ✅ Enable CORS for frontend access
app.use(cors({
    origin: ["https://shashankkaranam.github.io/strech", "https://strech-ngorequest.onrender.com"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

// ✅ Middleware for parsing form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Use MongoDB connection from .env
const mongoUri = process.env.MONGO_URI;

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Define schema and model
const ngoRequestSchema = new mongoose.Schema({
    ngoName: String,
    certNumber: String,
    email: String,
    address: String,
    foodQuantity: String,
    travel: String,
    donationDate: { type: Date, required: true }, // ✅ Ensure Date Field is Required
    message: String
}, { collection: 'ngoRequests' });

const NGORequest = mongoose.model('NGORequest', ngoRequestSchema);

// ✅ Serve the form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'needameal.html'));
});

// ✅ Serve the "Thank You" page
app.get('/thank-you', (req, res) => {
    res.sendFile(path.join(__dirname, 'thankyou.html'));
});

// ✅ Handle form submission
app.post('/submit', async (req, res) => {
    try {
        let donationDate = req.body.donationDate;

        // ✅ If donationDate is missing or invalid, set the current date
        if (!donationDate || isNaN(Date.parse(donationDate))) {
            donationDate = new Date();
        } else {
            donationDate = new Date(donationDate);
        }

        const newRequest = new NGORequest({
            ngoName: req.body.ngoName,
            certNumber: req.body.certNumber,
            email: req.body.email,
            address: req.body.address,
            foodQuantity: req.body.foodQuantity,
            travel: req.body.travel,
            donationDate: donationDate, // ✅ Store Date Properly
            message: req.body.message
        });

        await newRequest.save();

        console.log("✅ Request Saved with Date:", donationDate);

        // ✅ Redirect to thank-you page after submission
        res.redirect('/thank-you');
    } catch (error) {
        console.error('❌ Error saving request:', error);
        res.status(500).send('Internal Server Error');
    }
});

// ✅ Start the server on Render with correct PORT binding
const PORT = process.env.PORT || 3000;
const HOST = process.env.RENDER ? '0.0.0.0' : 'localhost';

app.listen(PORT, HOST, () => {
    console.log(`✅ Server running on ${process.env.RENDER ? 'Render' : 'Localhost'} at port ${PORT}`);
});
