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
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// ✅ Define schema and model
const ngoRequestSchema = new mongoose.Schema({
    ngoName: String,
    certNumber: String,
    email: String,
    address: String,
    foodQuantity: String,
    travel: String,
    message: String
}, { collection: 'ngoRequests' });

const NGORequest = mongoose.model('NGORequest', ngoRequestSchema);

// ✅ Serve the form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'needameal.html'));
});

// ✅ Handle form submission
app.post('/submit', async (req, res) => {
    try {
        const newRequest = new NGORequest({
            ngoName: req.body.ngoName,
            certNumber: req.body.certNumber,
            email: req.body.email,
            address: req.body.address,
            foodQuantity: req.body.foodQuantity,
            travel: req.body.travel,
            message: req.body.message
        });

        await newRequest.save();
        res.redirect('/thank-you');  // Redirect to thank-you page
    } catch (error) {
        console.error('Error saving request:', error);
        res.status(500).send('Internal Server Error');
    }
});

// ✅ Start the server on Render with correct PORT binding
const PORT = process.env.PORT || 3000;
const HOST = process.env.RENDER ? '0.0.0.0' : 'localhost';

app.listen(PORT, HOST, () => {
    console.log(`Server running on ${process.env.RENDER ? 'Render' : 'Localhost'} at port ${PORT}`);
});
