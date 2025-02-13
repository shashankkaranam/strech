// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' })); // Allow all frontend requests

// ✅ MongoDB Connection for Comparisons Database
mongoose.connect(process.env.COMPARISONS_DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ Schema Definition for Comparisons
const comparisonSchema = new mongoose.Schema({
    _id: String,
    date: Date,
    quantity: String,
    donorDetails: Object,
    requestDetails: Object
}, { collection: 'comparisons' });

const Comparison = mongoose.model('Comparison', comparisonSchema);

// ✅ Set up Nodemailer Transport (No Encryption)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,  // Your Gmail address
        pass: process.env.EMAIL_PASS   // App password (not your Gmail password)
    }
});

// ✅ Function to Send Email Notifications
const sendEmail = async (to, subject, text) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            text: text
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent successfully to ${to}`);
    } catch (error) {
        console.error(`❌ Error sending email to ${to}:`, error);
    }
};

// ✅ Function to Process and Send Emails
const processAndSendEmails = async () => {
    try {
        // Fetch new comparisons from the database
        const newComparisons = await Comparison.find();

        if (newComparisons.length === 0) {
            console.log("🔄 No new comparisons found.");
            return;
        }

        for (const comparison of newComparisons) {
            console.log(`🔍 Processing new comparison: ${comparison._id}`);

            // ✅ Extract Emails
            const restaurantEmail = comparison.donorDetails.contactEmail;
            const ngoEmail = comparison.requestDetails.email;

            // ✅ Send Email to Restaurant (Donor)
            if (restaurantEmail) {
                await sendEmail(
                    restaurantEmail,
                    "Donation Accepted!",
                    `Hello ${comparison.donorDetails.restaurantName},\n\nYour food donation has been successfully accepted and assigned to a request. Thank you for your generosity!`
                );
            }

            // ✅ Send Email to NGO (Requestor)
            if (ngoEmail) {
                await sendEmail(
                    ngoEmail,
                    "Food Request Fulfilled!",
                    `Hello ${comparison.requestDetails.ngoName},\n\nYour food request has been fulfilled! The assigned donation will reach you soon.`
                );
            }
        }
    } catch (error) {
        console.error("❌ Error processing comparisons:", error);
    }
};

// ✅ Run Email Sending Every Minute
setInterval(processAndSendEmails, 60000);

// ✅ Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
