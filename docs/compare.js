const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
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
    donationDate: { type: Date, required: true }, // ✅ Ensure it's always a Date
    willingToDeliver: String
}, { collection: 'restaurantDonations' });

const ngoRequestSchema = new mongoose.Schema({
    ngoName: String,
    foodQuantity: String,
    foodType: String,
    travel: String,
    date: { type: Date, required: true } // ✅ Ensure it's always a Date
}, { collection: 'ngoRequests' });

const volunteerSchema = new mongoose.Schema({
    firstName: String,
    vehicleType: String,
    vehicleCapacity: Number,
    availableDate: { type: Date, required: true } // ✅ Ensure it's always a Date
}, { collection: 'volunteerDetails' });

const directAssignmentSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    quantity: String,
    donorDetails: Object,
    requestDetails: Object
}, { collection: 'directAssignments' });

const volunteerAssignmentSchema = new mongoose.Schema({
    date: { type: Date, required: true },
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

// Function to Run Matching Process
async function runMatchingProcess() {
    console.log('🔄 Running Matching Process due to Database Change...');
    try {
        const restaurantDonations = await RestaurantDonation.find({});
        const requests = await NGORequest.find({});
        const volunteers = await Volunteer.find({});

        console.log(`📊 Found ${restaurantDonations.length} Donations & ${requests.length} Requests.`);

        const directAssignments = [];
        const volunteerAssignments = [];
        let usedVolunteers = new Set();

        // Match restaurant donations with requests
        for (const donation of restaurantDonations) {
            for (const request of requests) {
                // ✅ Ensure date is properly converted from MongoDB
                const donationDate = donation.donationDate instanceof Date ? donation.donationDate.toISOString().split('T')[0] : null;
                const requestDate = request.date instanceof Date ? request.date.toISOString().split('T')[0] : null;

                if (donationDate && requestDate) {
                    console.log(`🔍 Comparing Dates: Donation ${donationDate} - Request ${requestDate}`);

                    if (donationDate === requestDate) {
                        console.log(`✅ Match Found for ${donationDate}`);

                        if (donation.willingToDeliver === 'yes' || request.travel === 'Yes') {
                            console.log('✅ Direct Assignment Eligible');
                            directAssignments.push({ donorDetails: donation, requestDetails: request });
                        } else {
                            console.log('🔄 Volunteer Assignment Required');
                            
                            let assignedVolunteer = null;
                            for (const volunteer of volunteers) {
                                const volunteerDate = volunteer.availableDate instanceof Date ? volunteer.availableDate.toISOString().split('T')[0] : null;

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
                                    volunteerDetails: assignedVolunteer
                                });
                            } else {
                                console.log('❌ No Available Volunteers for this Assignment');
                            }
                        }
                    } else {
                        console.log(`❌ No Date Match: Donation Date = ${donationDate}, Request Date = ${requestDate}`);
                    }
                }
            }
        }

        // ✅ Save direct assignments and remove matched donations & requests
        if (directAssignments.length > 0) {
            await DirectAssignment.insertMany(directAssignments);
            console.log(`✅ Direct Assignments Saved: ${directAssignments.length}`);

            for (const match of directAssignments) {
                await RestaurantDonation.deleteOne({ _id: match.donorDetails._id });
                await NGORequest.deleteOne({ _id: match.requestDetails._id });
            }
        }

        // ✅ Save volunteer assignments and remove matched donations & requests
        if (volunteerAssignments.length > 0) {
            await VolunteerAssignment.insertMany(volunteerAssignments);
            console.log(`✅ Volunteer Assignments Saved: ${volunteerAssignments.length}`);

            for (const match of volunteerAssignments) {
                await RestaurantDonation.deleteOne({ _id: match.donorDetails._id });
                await NGORequest.deleteOne({ _id: match.requestDetails._id });
            }
        }

        console.log('✅ Matching Process Completed Successfully.');
    } catch (error) {
        console.error('❌ Error in Matching Process:', error);
    }
}

// 🛠 **Listen for New Entries in Donations & Requests Collections**
donationsDB.once('open', () => {
    const donationStream = donationsDB.collection('restaurantDonations').watch();
    donationStream.on('change', () => {
        runMatchingProcess();
    });
});

// 🛠 Fix Port Binding for Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
