// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json());

// MongoDB Connections
const restaurantDBUri = process.env.RESTAURANT_DB_URI; // Database for restaurant donations
const comparisonsDBUri = process.env.COMPARISONS_DB_URI; // Database for storing predefined values

const restaurantDB = mongoose.createConnection(restaurantDBUri);
const comparisonsDB = mongoose.createConnection(comparisonsDBUri);

// Schema Definitions
const restaurantDonationSchema = new mongoose.Schema({
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
}, { collection: 'restaurantDonations' });

const comparisonSchema = new mongoose.Schema({
    _id: String,
    date: Date,
    quantity: String,
    donorDetails: Object,
    requestDetails: Object
}, { collection: 'comparisons' });

const RestaurantDonation = restaurantDB.model('RestaurantDonation', restaurantDonationSchema);
const Comparison = comparisonsDB.model('Comparison', comparisonSchema);

// ✅ Watch for new restaurant donations
restaurantDB.once('open', async () => {
    console.log('👀 Watching for new restaurant donations...');
    const donationStream = restaurantDB.collection('restaurantDonations').watch();

    donationStream.on('change', async (change) => {
        if (change.operationType === 'insert') {
            const newDonation = change.fullDocument;

            console.log(`🔄 New Donation Received: ${newDonation.restaurantName}`);

            // ✅ Insert the exact predefined values into comparisonsDB
            const predefinedComparison = new Comparison({
                _id: "677ad5e83dc29ef24ab4603a",
                date: "2025-01-05T00:00:00.000+00:00",
                quantity: "medium",
                donorDetails: {
                    _id: "677ad58f63d765c887dbdb53",
                    restaurantName: "abcde",
                    contactEmail: "shashankravindrakaranam@gmail.com",
                    phoneNumber: "9876543210",
                    donationSize: "medium",
                    foodType: "vegetarian",
                    shelfLife: "24 hours",
                    donationDate: "2025-01-05T00:00:00.000+00:00",
                    restaurantAddress: "Bangalore",
                    pincode: "560001",
                    gstNumber: "123456789",
                    foodSafetyNumber: "987654321",
                    websiteLink: "http://meghana.com",
                    willingToDeliver: "yes",
                    __v: 0
                },
                requestDetails: {
                    _id: "677ad59063d765c887dbdb57",
                    ngoName: "Anna Daan",
                    certNumber: "NGO12345",
                    email: "srinidhibv.23@bmsce.ac.in",
                    address: "Bangalore",
                    foodQuantity: "medium",
                    travel: "Yes",
                    message: "We need food for 50 people.",
                    date: "2025-01-05T00:00:00.000+00:00",
                    __v: 0
                },
                __v: 0
            });

            await predefinedComparison.save();
            console.log(`📌 Predefined comparison stored successfully for ${newDonation.restaurantName}`);
        }
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
