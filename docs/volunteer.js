// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ✅ Enable CORS for frontend access
app.use(cors({
    origin: ["https://shashankkaranam.github.io/strech", "https://strech-volunteer.onrender.com"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

// ✅ Middleware for parsing form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// ✅ MongoDB connection
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://nourishnetworkk:CRSrinidhi339@nourishnetworktrial.nr6w9.mongodb.net/volunteerDB?retryWrites=true&w=majority&appName=Nourishnetworktrial';

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// ✅ Define schema and model for volunteers
const volunteerSchema = new mongoose.Schema(
    {
        firstName: String,
        lastName: String,
        email: String,
        phone: String,
        pincode: String,
        experience: String,
        travelDistance: Number,
        vehicleType: String,
        vehicleCapacity: Number,
        availableDate: Date,
        terms: Boolean
    },
    { collection: 'volunteers' }
);

const Volunteer = mongoose.model('Volunteer', volunteerSchema);

// ✅ Serve the volunteer form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'volunteer-form.html')); // Adjust path if needed
});

// ✅ Serve the Thank You page
app.get('/thank-you', (req, res) => {
    res.sendFile(path.join(__dirname, 'thankyou.html')); // Adjust path if needed
});

// ✅ Handle form submission
app.post('/submit', async (req, res) => {
    try {
        const newVolunteer = new Volunteer({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            phone: req.body.phone,
            pincode: req.body.pincode,
            experience: req.body.experience,
            travelDistance: req.body.travelDistance,
            vehicleType: req.body.vehicleType,
            vehicleCapacity: req.body.vehicleCapacity,
            availableDate: req.body.availableDate,
            terms: req.body.terms === 'on'
        });

        await newVolunteer.save();

        // ✅ Redirect to thank-you page after submission
        res.redirect('/thank-you');
    } catch (error) {
        console.error('Error saving volunteer:', error);
        res.status(500).send('Internal Server Error');
    }
});

// ✅ Start the server
const PORT = process.env.PORT || 5000;
const HOST = process.env.RENDER ? '0.0.0.0' : 'localhost';

app.listen(PORT, HOST, () => {
    console.log(`Server running on ${process.env.RENDER ? 'Render' : 'Localhost'} at port ${PORT}`);
});
