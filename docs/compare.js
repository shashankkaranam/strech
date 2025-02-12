const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// MongoDB Connections
const donationsDBUri = process.env.DONATIONS_DB_URI;
const requestsDBUri = process.env.REQUESTS_DB_URI;
const volunteersDBUri = process.env.VOLUNTEERS_DB_URI;
const derivedDBUri = process.env.DERIVED_DB_URI;

const donationsDB = mongoose.createConnection(donationsDBUri);
const requestsDB = mongoose.createConnection(requestsDBUri);
const volunteersDB = mongoose.createConnection(volunteersDBUri);
const derivedDB = mongoose.createConnection(derivedDBUri);

// Schema Definitions
const donationSchema = new mongoose.Schema({
    restaurantName: String,
    contactEmail: String,
    phoneNumber: String,
    donationSize: String,
    foodType: String,
    shelfLife: String,
    donationDate: { type: Date, required: true },
    willingToDeliver: String
}, { collection: 'restaurantDonations' });

const ngoRequestSchema = new mongoose.Schema({
    ngoName: String,
    foodQuantity: String,
    foodType: String,
    travel: String,
    Date: { type: Date, required: true }
}, { collection: 'ngoRequests' });

const volunteerSchema = new mongoose.Schema({
    firstName: String,
    vehicleType: String,
    vehicleCapacity: Number,
    availableDate: { type: Date, required: true }
}, { collection: 'volunteerDetails' });

const directAssignmentSchema = new mongoose.Schema({
    date: Date,
    quantity: String,
    donorDetails: Object,
    requestDetails: Object
}, { collection: 'directAssignments' });

const volunteerAssignmentSchema = new mongoose.Schema({
    date: Date,
    quantity: String,
    donorDetails: Object,
    requestDetails: Object,
    volunteerDetails: Object
}, { collection: 'volunteerassignment' });

// Models
const RestaurantDonation = donationsDB.model('RestaurantDonation', donationSchema);
const NGORequest = requestsDB.model('NGORequest', ngoRequestSchema);
const Volunteer = volunteersDB.model('Volunteer', volunteerSchema);
const DirectAssignment = derivedDB.model('DirectAssignment', directAssignmentSchema);
const VolunteerAssignment = derivedDB.model('VolunteerAssignment', volunteerAssignmentSchema);

// NGO Request Submission Endpoint
app.post('/submit', async (req, res) => {
    try {
        const newRequest = new NGORequest({
            ngoName: req.body.ngoName,
            foodQuantity: req.body.foodQuantity,
            foodType: req.body.foodType,
            travel: req.body.travel,
            Date: req.body.Date ? new Date(req.body.Date) : new Date()
        });
        await newRequest.save();
        res.json({ message: "Request submitted successfully!" });
    } catch (error) {
        console.error('❌ Error saving request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

async function runMatchingProcess() {
    console.log('🔄 Running Matching Process...');
    try {
        const restaurantDonations = await RestaurantDonation.find({});
        const requests = await NGORequest.find({});
        const volunteers = await Volunteer.find({});

        console.log(`📊 Found ${restaurantDonations.length} Donations & ${requests.length} Requests.`);
        const directAssignments = [];
        const volunteerAssignments = [];
        let usedVolunteers = new Set();

        for (const donation of restaurantDonations) {
            for (const request of requests) {
                const donationDate = donation.donationDate?.toISOString().split('T')[0];
                const requestDate = request.Date?.toISOString().split('T')[0];

                if (donationDate && requestDate && donationDate === requestDate) {
                    if (donation.willingToDeliver === 'yes' || request.travel === 'Yes') {
                        directAssignments.push({ 
                            donorDetails: donation,
                            requestDetails: request,
                            date: donationDate
                        });
                    } else {
                        let assignedVolunteer = null;
                        for (const volunteer of volunteers) {
                            const volunteerDate = volunteer.availableDate?.toISOString().split('T')[0];
                            if (volunteerDate === donationDate && !usedVolunteers.has(volunteer._id)) {
                                assignedVolunteer = volunteer;
                                usedVolunteers.add(volunteer._id);
                                break;
                            }
                        }
                        if (assignedVolunteer) {
                            volunteerAssignments.push({
                                donorDetails: donation,
                                requestDetails: request,
                                volunteerDetails: assignedVolunteer,
                                date: donationDate
                            });
                        }
                    }
                }
            }
        }

        if (directAssignments.length > 0) {
            await DirectAssignment.insertMany(directAssignments);
            await RestaurantDonation.deleteMany({ _id: { $in: directAssignments.map(d => d.donorDetails._id) } });
            await NGORequest.deleteMany({ _id: { $in: directAssignments.map(d => d.requestDetails._id) } });
        }

        if (volunteerAssignments.length > 0) {
            await VolunteerAssignment.insertMany(volunteerAssignments);
            await RestaurantDonation.deleteMany({ _id: { $in: volunteerAssignments.map(d => d.donorDetails._id) } });
            await NGORequest.deleteMany({ _id: { $in: volunteerAssignments.map(d => d.requestDetails._id) } });
        }

        console.log('✅ Matching Process Completed');
    } catch (error) {
        console.error('❌ Matching Error:', error);
    }
}

// Database Change Listeners
donationsDB.once('open', () => {
    donationsDB.collection('restaurantDonations').watch().on('change', runMatchingProcess);
});

requestsDB.once('open', () => {
    requestsDB.collection('ngoRequests').watch().on('change', runMatchingProcess);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
